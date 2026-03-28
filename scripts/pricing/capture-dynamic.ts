#!/usr/bin/env tsx

import type {
  PricingBillingMode,
  PricingSourceType,
  RawPricingCard,
  RawPricingFact,
  RawPricingPageCapture,
  RawPricingState,
} from '../../src/lib/pricing/types';
import {
  computeFallbackReasons,
  ensureOutputDirs,
  extractStructuredPricingFromStateHtmls,
  extractTextFromHtml,
  getToolSource,
  inferStateHtmlCapturesFromHtml,
  loadCachedPage,
  makePageCapture,
  normalizeText,
  parseArgs,
  type StateHtmlCapture,
} from './shared';

async function dismissCookieBanner(page: any): Promise<void> {
  try {
    const cookieButton = await page.getByRole('button', { name: /accept|agree|got it|allow/i }).first();
    if (await cookieButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cookieButton.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // no-op
  }
}

async function captureCurrentHtml(page: any): Promise<string> {
  await page.waitForTimeout(1200);
  return page.content();
}

async function primePricingPage(page: any): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, Math.max(600, window.innerHeight)));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

async function waitForPricingSurface(slug: string, page: any): Promise<void> {
  try {
    if (slug === 'deepbrain-ai') {
      await page.waitForSelector('.studios-plan-item', { timeout: 20000 });
      return;
    }
    if (slug === 'd-id') {
      await page.waitForSelector('.c-pricing-app-card', { timeout: 20000 });
      return;
    }
    if (slug === 'steve-ai') {
      await page.waitForSelector('.upgrade_now_card, .headerstarter', { timeout: 30000 });
      await page.waitForFunction(() => {
        return typeof (window as any).jQuery !== 'undefined' && typeof (window as any).triggerSwapPaymentcycleOption === 'function';
      }, { timeout: 30000 }).catch(() => undefined);
      await page.waitForFunction(() => {
        try {
          return typeof (window as any).priceDetailListData !== 'undefined' && !!(window as any).priceDetailListData;
        } catch {
          return false;
        }
      }, { timeout: 30000 }).catch(() => undefined);
    }
  } catch {
    // Fall through and let downstream extraction decide if the surface is usable.
  }
}

async function captureDeepbrainStates(page: any): Promise<StateHtmlCapture[]> {
  const states: StateHtmlCapture[] = [];
  const knob = page.locator('#yearly-switch .div-block-110');
  const toggle = page.locator('#yearly-switch');

  async function detect(): Promise<PricingBillingMode> {
    const style = (await knob.getAttribute('style').catch(() => '')) || '';
    return /translate3d\(100%/.test(style) ? 'annual' : 'monthly';
  }

  async function ensure(target: PricingBillingMode): Promise<PricingBillingMode> {
    let current = await detect();
    if (current !== target) {
      await toggle.click();
      await page.waitForTimeout(1200);
      current = await detect();
    }
    return current;
  }

  const defaultMode = await detect();
  for (const target of ['monthly', 'annual'] as PricingBillingMode[]) {
    const current = await ensure(target);
    if (current !== target) continue;
    states.push({
      stateId: `${target}-${target === defaultMode ? 'default' : 'toggle'}`,
      label: target === 'annual' ? 'Yearly' : 'Monthly',
      billingMode: target,
      isDefaultVisible: target === defaultMode,
      triggerType: target === defaultMode ? 'default' : 'toggle',
      triggerLabel: target === 'annual' ? 'Yearly' : 'Monthly',
      html: await captureCurrentHtml(page),
    });
  }

  return states;
}

async function captureDIdStates(page: any): Promise<StateHtmlCapture[]> {
  const states: StateHtmlCapture[] = [];
  const monthlyRadio = page.locator('input[name="billing-cycle"][value="monthly"]').first();
  const annualRadio = page.locator('input[name="billing-cycle"][value="annually"]').first();

  async function detect(): Promise<PricingBillingMode> {
    const annualActive = await page.locator('.b-pricing-switch__element--secondary.active').count();
    return annualActive > 0 ? 'annual' : 'monthly';
  }

  async function ensure(target: PricingBillingMode): Promise<PricingBillingMode> {
    if (target === 'monthly') {
      await monthlyRadio.check().catch(async () => {
        await page.locator('.b-pricing-switch__element--primary').click();
      });
    } else {
      await annualRadio.check().catch(async () => {
        await page.locator('.b-pricing-switch__element--secondary').click();
      });
    }
    await page.waitForTimeout(1200);
    return detect();
  }

  const defaultMode = await detect();
  for (const target of ['monthly', 'annual'] as PricingBillingMode[]) {
    const current = await ensure(target);
    if (current !== target) continue;
    states.push({
      stateId: `${target}-${target === defaultMode ? 'default' : 'toggle'}`,
      label: target === 'annual' ? 'Annual' : 'Monthly',
      billingMode: target,
      isDefaultVisible: target === defaultMode,
      triggerType: target === defaultMode ? 'default' : 'toggle',
      triggerLabel: target === 'annual' ? 'Annual' : 'Monthly',
      html: await captureCurrentHtml(page),
    });
  }

  return states;
}

async function captureSteveStates(page: any): Promise<StateHtmlCapture[]> {
  const states: StateHtmlCapture[] = [];
  const toggle = page.locator('#header-toggle-pricing');

  async function detect(): Promise<PricingBillingMode> {
    const checked = await toggle.isChecked().catch(() => false);
    return checked ? 'annual' : 'monthly';
  }

  async function ensure(target: PricingBillingMode): Promise<PricingBillingMode> {
    const checked = await toggle.isChecked().catch(() => false);
    const shouldBeChecked = target === 'annual';
    if (checked !== shouldBeChecked) {
      await page.evaluate((nextChecked: boolean) => {
        const triggerSwapPaymentcycleOption = (window as unknown as { triggerSwapPaymentcycleOption?: (cycle: string) => Promise<void> | void })
          .triggerSwapPaymentcycleOption;
        const input = document.querySelector('#header-toggle-pricing') as HTMLInputElement | null;
        if (typeof triggerSwapPaymentcycleOption === 'function') {
          input && (input.checked = nextChecked);
          triggerSwapPaymentcycleOption(nextChecked ? 'Y' : 'M');
          return;
        }
        if (input) {
          input.checked = nextChecked;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, shouldBeChecked);
      const expectation = target === 'annual' ? /billed\s*yearly/i : /billed\s*monthly/i;
      await page.waitForFunction((patternSource: string) => {
        const text =
          (document.querySelector('.headerstarter h3')?.textContent || '') +
          ' ' +
          (document.querySelector('.growth_content h3')?.textContent || '');
        return new RegExp(patternSource, 'i').test(text);
      }, expectation.source, { timeout: 15000 }).catch(() => undefined);
      await page.waitForTimeout(1200);
    }
    return detect();
  }

  const defaultMode = await detect();
  for (const target of ['monthly', 'annual'] as PricingBillingMode[]) {
    const current = await ensure(target);
    if (current !== target) continue;
    states.push({
      stateId: `${target}-${target === defaultMode ? 'default' : 'toggle'}`,
      label: target === 'annual' ? 'Annually' : 'Monthly',
      billingMode: target,
      isDefaultVisible: target === defaultMode,
      triggerType: target === defaultMode ? 'default' : 'toggle',
      triggerLabel: target === 'annual' ? 'Annually' : 'Monthly',
      html: await captureCurrentHtml(page),
    });
  }

  return states;
}

async function captureLiveStates(
  slug: string,
  sourceType: PricingSourceType,
  sourceUrl: string,
): Promise<{
  states: StateHtmlCapture[];
  capturedAt: string;
  sourceUrl: string;
}> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route('**/*', (route: any) => {
      const resourceType = route.request().resourceType();
      if (resourceType === 'image' || resourceType === 'font') {
        return route.abort();
      }
      return route.continue();
    });

    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);
    await dismissCookieBanner(page);
    await primePricingPage(page);
    await waitForPricingSurface(slug, page);

    let states: StateHtmlCapture[];
    if (sourceType !== 'pricing') {
      states = inferStateHtmlCapturesFromHtml(slug, await captureCurrentHtml(page), sourceType);
    } else if (slug === 'deepbrain-ai') {
      states = await captureDeepbrainStates(page);
    } else if (slug === 'd-id') {
      states = await captureDIdStates(page);
    } else if (slug === 'steve-ai') {
      states = await captureSteveStates(page);
    } else {
      states = inferStateHtmlCapturesFromHtml(slug, await captureCurrentHtml(page), sourceType);
    }

    return {
      states,
      capturedAt: new Date().toISOString(),
      sourceUrl,
    };
  } finally {
    await browser.close();
  }
}

export async function captureDynamicSource(
  slug: string,
  sourceType: PricingSourceType,
  useCache: boolean,
  reasons: string[] = [],
): Promise<{
  page: RawPricingPageCapture;
  states: RawPricingState[];
  cards: RawPricingCard[];
  facts: RawPricingFact[];
}> {
  ensureOutputDirs();
  const source = getToolSource(slug, sourceType);
  if (!source) {
    throw new Error(`Missing ${sourceType} source for ${slug}`);
  }

  let stateHtmls: StateHtmlCapture[] = [];
  let capturedAt = new Date().toISOString();
  let sourceUrl = source.url;
  let usedCache = false;
  let cacheMode: 'static' | 'dynamic' | 'unknown' = 'dynamic';

  if (useCache) {
    const cached = loadCachedPage(slug, sourceType);
    if (cached) {
      stateHtmls = inferStateHtmlCapturesFromHtml(slug, cached.html, sourceType);
      capturedAt = cached.capturedAt;
      sourceUrl = cached.sourceUrl || source.url;
      usedCache = true;
      cacheMode = cached.cacheMode;
    }
  }

  if (stateHtmls.length === 0) {
    const live = await captureLiveStates(slug, sourceType, source.url);
    stateHtmls = live.states;
    capturedAt = live.capturedAt;
    sourceUrl = live.sourceUrl;
    usedCache = false;
    cacheMode = 'dynamic';
  }

  const combinedText = normalizeText(stateHtmls.map((state) => extractTextFromHtml(state.html)).join(' '));
  const fallbackReasons = Array.from(
    new Set([
      ...reasons,
      ...computeFallbackReasons(stateHtmls[0]?.html || '', combinedText, 'dynamic'),
    ]),
  );

  let extracted = extractStructuredPricingFromStateHtmls({
    slug,
    sourceType,
    sourceUrl,
    captureLayer: 'playwright',
    capturedAt,
    provenance: usedCache ? 'cache' : 'live',
    cacheMode: usedCache ? cacheMode : null,
    states: stateHtmls,
  });

  if (!useCache && extracted.cards.length === 0) {
    const cached = loadCachedPage(slug, sourceType);
    if (cached) {
      const cachedExtracted = extractStructuredPricingFromStateHtmls({
        slug,
        sourceType,
        sourceUrl: cached.sourceUrl || source.url,
        captureLayer: cached.cacheLayer,
        capturedAt: cached.capturedAt,
        provenance: 'cache',
        cacheMode: cached.cacheMode,
        states: inferStateHtmlCapturesFromHtml(slug, cached.html, sourceType),
      });
      const importedStates = cachedExtracted.states
        .filter((state) => !extracted.states.some((existing) => existing.stateId === state.stateId))
        .map((state) => ({
          ...state,
          isDefaultVisible: false,
          notes: [...(state.notes || []), 'state imported from cache fallback after live card extraction returned empty'],
        }));
      const importedStateMap = new Map(importedStates.map((state) => [state.stateId, state]));
      extracted = {
        states: [
          ...extracted.states,
          ...importedStates,
        ],
        cards: cachedExtracted.cards.map((card) => {
          const importedState = importedStateMap.get(card.stateId);
          if (!importedState) return card;
          return {
            ...card,
            isDefaultVisible: importedState.isDefaultVisible,
          };
        }),
        facts: cachedExtracted.facts,
        snippets: cachedExtracted.snippets,
      };
    }
  }

  const page = makePageCapture({
    sourceType,
    sourceUrl,
    captureLayer: 'playwright',
    usedCache,
    cacheMode,
    capturedAt,
    textLength: combinedText.length,
    fallbackReasons,
    stateIds: extracted.states.map((state) => state.stateId),
    cardIds: extracted.cards.map((card) => card.cardId),
    snippets: extracted.snippets,
  });

  return {
    page,
    states: extracted.states,
    cards: extracted.cards,
    facts: extracted.facts,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = String(args.slug || '');
  const sourceType = String(args.type || 'pricing') as PricingSourceType;
  const useCache = args['no-cache'] ? false : true;

  if (!slug) {
    throw new Error('Usage: tsx scripts/pricing/capture-dynamic.ts --slug <slug> [--type pricing|faq|help|terms] [--no-cache]');
  }

  const result = await captureDynamicSource(slug, sourceType, useCache);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

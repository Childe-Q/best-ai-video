#!/usr/bin/env tsx

import type {
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
  inferStateHtmlCapturesFromHtml,
  loadPageContent,
  makePageCapture,
  parseArgs,
} from './shared';

export async function captureStaticSource(
  slug: string,
  sourceType: PricingSourceType,
  useCache: boolean,
): Promise<{
  page: RawPricingPageCapture;
  states: RawPricingState[];
  cards: RawPricingCard[];
  facts: RawPricingFact[];
}> {
  ensureOutputDirs();
  const pageContent = await loadPageContent(slug, sourceType, 'fetch-cheerio', useCache);
  const fallbackReasons = computeFallbackReasons(
    pageContent.html,
    pageContent.text,
    pageContent.cacheMode === 'dynamic' ? 'dynamic' : 'static',
  );

  const stateHtmls = inferStateHtmlCapturesFromHtml(slug, pageContent.html, sourceType);
  const extracted = extractStructuredPricingFromStateHtmls({
    slug,
    sourceType,
    sourceUrl: pageContent.sourceUrl,
    captureLayer: 'fetch-cheerio',
    capturedAt: pageContent.capturedAt,
    provenance: pageContent.usedCache ? 'cache' : 'live',
    cacheMode: pageContent.usedCache ? pageContent.cacheMode : null,
    states: stateHtmls,
  });

  const page = makePageCapture({
    sourceType,
    sourceUrl: pageContent.sourceUrl,
    captureLayer: 'fetch-cheerio',
    usedCache: pageContent.usedCache,
    cacheMode: pageContent.cacheMode,
    capturedAt: pageContent.capturedAt,
    textLength: pageContent.text.length,
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
    throw new Error('Usage: tsx scripts/pricing/capture-static.ts --slug <slug> [--type pricing|faq|help|terms] [--no-cache]');
  }

  const result = await captureStaticSource(slug, sourceType, useCache);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { fetchStatic } from '../fetchers';
import type {
  CoarseDisplayText,
  NormalizedPlanBullet,
  NormalizedPlanPricePoint,
  NormalizedPricingBillingState,
  NormalizedPricingPlan,
  NormalizedPricingRecord,
  PricingAuditRecord,
  PricingBillingMode,
  PricingCaptureLayer,
  PricingCadence,
  PricingResolverPreview,
  PricingReviewSummaryRecord,
  PricingCaptureProvenance,
  PricingSourceType,
  PricingStateTriggerType,
  PricingStructuredPlanType,
  PricingUnit,
  PricingMissingField,
  RawPricingCtaMeta,
  RawPricingBulletSection,
  RawPricingCaptureFile,
  RawPricingCard,
  RawPricingCardKind,
  RawPricingPlanControl,
  RawPricingEvidence,
  RawPricingFact,
  RawPricingPageCapture,
  RawPricingPriceBlock,
  RawPricingPriceRole,
  RawPricingSnippet,
  RawPricingState,
  NormalizedPricingBillingVariant,
  NormalizedPricingBulletSection,
  NormalizedPricingDetailCard,
  NormalizedPricingPlanSourceMeta,
} from '../../src/lib/pricing/types';
import {
  buildResolverPreview,
  isValidOriginVerificationCombo,
  resolveCoarseDisplayText,
} from '../../src/lib/pricing/types';

export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
export const SOURCES_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'sources', 'tools.sources.json');
export const RAW_OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'pricing', 'raw');
export const NORMALIZED_OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'pricing', 'normalized');
export const AUDIT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'pricing', 'audits');
export const REVIEW_OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'pricing', 'reviews');
export const CACHE_DIR = path.join(PROJECT_ROOT, 'scripts', 'cache');

type ToolSourcesEntry = {
  slug: string;
  sources: Partial<Record<PricingSourceType, { url: string; mode?: 'static' | 'dynamic'; description?: string }>>;
};

const SOURCE_URL_OVERRIDES: Partial<Record<string, Partial<Record<PricingSourceType, string>>>> = {
  'deepbrain-ai': {
    pricing: 'https://www.aistudios.com/pricing',
  },
};

type CacheMeta = {
  sourceUrl?: string;
  mode?: 'static' | 'dynamic';
  htmlPath?: string;
  textPath?: string;
  createdAt?: string;
  fetchedAt?: string;
  text?: string;
  rawHtml?: string;
  renderMode?: 'fetch' | 'playwright';
};

export type StateHtmlCapture = {
  stateId: string;
  label: string;
  billingMode: PricingBillingMode;
  isDefaultVisible: boolean;
  triggerType: PricingStateTriggerType;
  triggerLabel: string | null;
  html: string;
  notes?: string[];
};

type SourceMeta = {
  sourceType: PricingSourceType;
  sourceUrl: string;
  captureLayer: PricingCaptureLayer;
  capturedAt: string;
  provenance: PricingCaptureProvenance;
  cacheMode: 'static' | 'dynamic' | 'unknown' | null;
};

function localizeCachePath(candidatePath?: string): string | null {
  if (!candidatePath) return null;
  if (fs.existsSync(candidatePath)) return candidatePath;
  const localCandidate = path.join(PROJECT_ROOT, 'scripts', 'cache', path.basename(path.dirname(candidatePath)), path.basename(candidatePath));
  return fs.existsSync(localCandidate) ? localCandidate : null;
}

export function ensureOutputDirs(): void {
  for (const dir of [RAW_OUTPUT_DIR, NORMALIZED_OUTPUT_DIR, AUDIT_OUTPUT_DIR, REVIEW_OUTPUT_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

export function loadToolSources(): ToolSourcesEntry[] {
  return readJson<ToolSourcesEntry[]>(SOURCES_PATH);
}

export function getToolSource(slug: string, sourceType: PricingSourceType): { url: string; mode: 'static' | 'dynamic' } | null {
  const entry = loadToolSources().find((item) => item.slug === slug);
  const source = entry?.sources?.[sourceType];
  if (!source?.url) return null;
  const overriddenUrl = SOURCE_URL_OVERRIDES[slug]?.[sourceType];
  return {
    url: overriddenUrl || source.url,
    mode: source.mode ?? 'dynamic',
  };
}

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return normalizeText($('body').text() || $.text());
}

function compactHtml(value: string, maxLength = 2500): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact;
}

function pickRicherText(primaryText: string, html: string): string {
  const fallbackText = extractTextFromHtml(html);
  if (!primaryText) return fallbackText;
  if (primaryText.length < 400 && fallbackText.length > primaryText.length) {
    return fallbackText;
  }
  if (!/\$[0-9]/.test(primaryText) && /\$[0-9]/.test(fallbackText)) {
    return fallbackText;
  }
  return primaryText;
}

export function getCacheMeta(slug: string, sourceType: PricingSourceType): CacheMeta | null {
  const slugDir = path.join(CACHE_DIR, slug);
  const cleanFile = path.join(slugDir, `${sourceType}-clean.json`);
  if (fs.existsSync(cleanFile)) {
    return readJson<CacheMeta>(cleanFile);
  }

  const snapshotFiles = fs
    .readdirSync(slugDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.startsWith(`${sourceType}-`) && entry.name.endsWith('.snapshot.json'))
    .map((entry) => path.join(slugDir, entry.name))
    .sort();

  if (snapshotFiles.length === 0) {
    return null;
  }

  return readJson<CacheMeta>(snapshotFiles[snapshotFiles.length - 1]);
}

export function loadCachedPage(slug: string, sourceType: PricingSourceType): {
  html: string;
  text: string;
  capturedAt: string;
  cacheMode: 'static' | 'dynamic' | 'unknown';
  cacheLayer: PricingCaptureLayer;
  sourceUrl?: string;
} | null {
  const meta = getCacheMeta(slug, sourceType);
  if (!meta) return null;

  if (meta.rawHtml && meta.text) {
    return {
      html: meta.rawHtml,
      text: pickRicherText(meta.text, meta.rawHtml),
      capturedAt: meta.fetchedAt || new Date().toISOString(),
      cacheMode: meta.mode ?? 'unknown',
      cacheLayer: meta.renderMode === 'playwright' ? 'playwright' : 'fetch-cheerio',
      sourceUrl: meta.sourceUrl,
    };
  }

  const htmlPath = localizeCachePath(meta.htmlPath);
  if (!htmlPath) return null;
  const html = fs.readFileSync(htmlPath, 'utf-8');

  let text = '';
  const textPath = localizeCachePath(meta.textPath);
  if (textPath && fs.existsSync(textPath)) {
    text = fs.readFileSync(textPath, 'utf-8');
  } else {
    text = extractTextFromHtml(html);
  }

  return {
    html,
    text: normalizeText(pickRicherText(text, html)),
    capturedAt: meta.createdAt || meta.fetchedAt || new Date().toISOString(),
    cacheMode: meta.mode ?? 'unknown',
    cacheLayer: meta.mode === 'dynamic' ? 'playwright' : 'fetch-cheerio',
    sourceUrl: meta.sourceUrl,
  };
}

export async function loadPageContent(
  slug: string,
  sourceType: PricingSourceType,
  layer: PricingCaptureLayer,
  useCache: boolean,
): Promise<{
  html: string;
  text: string;
  capturedAt: string;
  usedCache: boolean;
  cacheMode: 'static' | 'dynamic' | 'unknown';
  sourceUrl: string;
}> {
  const source = getToolSource(slug, sourceType);
  if (!source) {
    throw new Error(`Missing ${sourceType} source for ${slug}`);
  }

  if (useCache) {
    const cached = loadCachedPage(slug, sourceType);
    if (cached) {
      return {
        html: cached.html,
        text: cached.text,
        capturedAt: cached.capturedAt,
        usedCache: true,
        cacheMode: cached.cacheMode,
        sourceUrl: cached.sourceUrl || source.url,
      };
    }
  }

  const html = await fetchStatic(source.url);
  return {
    html,
    text: extractTextFromHtml(html),
    capturedAt: new Date().toISOString(),
    usedCache: false,
    cacheMode: layer === 'playwright' ? 'dynamic' : 'static',
    sourceUrl: source.url,
  };
}

export function computeFallbackReasons(
  html: string,
  text: string,
  sourceMode: 'static' | 'dynamic',
): string[] {
  const reasons = new Set<string>();
  const normalizedHtml = html.toLowerCase();
  const normalizedText = text.toLowerCase();

  if (sourceMode === 'dynamic') {
    reasons.add('source-config-marked-dynamic');
  }
  if (text.length < 1200) {
    reasons.add('pricing-text-too-short');
  }
  if (
    /pay monthly|pay yearly|monthlyannually|billed yearly|billed annually|annually30% off|save \+\d+%|billing cycle/i.test(
      normalizedText,
    ) ||
    /data-pricing|data-yearly-pricing|billing-cycle/.test(normalizedHtml)
  ) {
    reasons.add('billing-toggle-or-annual-qualifier');
  }
  if (/seat\/mo|per seat|per editor|custom editors|minutesToPrice|interactive videos per month|add on|upgrade/i.test(normalizedText + normalizedHtml)) {
    reasons.add('interactive-or-unit-priced-plans');
  }
  if (!/\$[0-9]/.test(text)) {
    reasons.add('missing-price-tokens');
  }

  return Array.from(reasons);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPlanId(planName: string): string {
  return slugify(planName || 'unknown-plan');
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => normalizeText(value))));
}

function detectBillingMode(text: string): PricingBillingMode {
  const normalized = normalizeText(text).toLowerCase();
  if (/billed yearly|billed annually|annual|annually|yearly/.test(normalized)) return 'annual';
  if (/monthly|\/mo|per month/.test(normalized)) return 'monthly';
  if (/custom|contact/.test(normalized)) return 'custom';
  return 'unknown';
}

function detectCadence(text: string): PricingCadence {
  const normalized = normalizeText(text).toLowerCase();
  if (/\/mo|per month|monthly/.test(normalized)) return 'month';
  if (/\/yr|per year|yearly|annually|annual/.test(normalized)) return 'year';
  if (/one.?time/.test(normalized)) return 'one-time';
  return null;
}

function detectUnit(text: string): PricingUnit {
  const normalized = normalizeText(text).toLowerCase();
  if (/seat/.test(normalized)) return 'seat';
  if (/editor/.test(normalized)) return 'editor';
  if (/workspace/.test(normalized)) return 'workspace';
  if (/credit/.test(normalized)) return 'credit-pack';
  if (/usage|minute|token/.test(normalized)) return 'usage';
  return 'account';
}

function extractFirstAmountText(text: string): string | null {
  const match = normalizeText(text).match(/\$[\d,]+(?:\.\d+)?/);
  return match ? match[0] : null;
}

function extractFirstAmount(text: string): number | null {
  const amountText = extractFirstAmountText(text);
  if (!amountText) return null;
  return Number(amountText.replace(/[$,]/g, ''));
}

function inferPriceRole(rawText: string, roleHint?: RawPricingPriceRole): RawPricingPriceRole {
  if (roleHint) return roleHint;
  const normalized = normalizeText(rawText).toLowerCase();
  if (/contact|custom|let'?s talk/.test(normalized)) return 'custom';
  if (/add on|addon/.test(normalized)) return 'add-on';
  if (/upgrade/.test(normalized)) return 'upgrade';
  if (/line-through|text-decoration: line-through|strike/.test(normalized)) return 'strike-through';
  if (/billed yearly|billed annually|yearly/.test(normalized) && !/\/mo|per month|monthly/.test(normalized)) return 'yearly-total';
  if (/save|discount|off/.test(normalized)) return 'promo';
  if (/\/mo|per month|monthly/.test(normalized)) return 'core-recurring';
  return 'unknown';
}

function inferSafeDisplayCandidate(role: RawPricingPriceRole, text: string, unit: PricingUnit): boolean {
  if (role !== 'core-recurring') return false;
  if (!extractFirstAmount(text)) return false;
  if (unit === 'seat') return true;
  return true;
}

function buildDisplayTextFromPoint(input: {
  amount: number | null;
  currency: string | null;
  cadence: PricingCadence;
  unit: PricingUnit;
  billingQualifier: string | null;
}): string | null {
  if (input.amount === null || !input.currency) return null;
  const amountText = `$${input.amount}`;
  if (input.unit === 'seat') {
    return `${amountText}/seat/${input.cadence === 'year' ? 'yr' : 'mo'}${input.billingQualifier ? ` ${input.billingQualifier}` : ''}`;
  }
  if (input.cadence === 'month') {
    return `${amountText}/mo${input.billingQualifier ? ` ${input.billingQualifier}` : ''}`;
  }
  if (input.cadence === 'year') {
    return `${amountText}/yr${input.billingQualifier ? ` ${input.billingQualifier}` : ''}`;
  }
  return amountText;
}

function detectPricingQualifierTexts(texts: Array<string | null | undefined>): string[] {
  return uniqueStrings(texts).filter((text) =>
    !/nan|undefined|null|\$[a-z_][a-z0-9_]*|\(\s*\)/i.test(text) &&
    /billed yearly|billed annually|monthly|annually|annual|yearly|trial|seat|editor|workspace|discount|off|save/i.test(
      text,
    ),
  );
}

function detectUpgradeAddOnInfo(texts: Array<string | null | undefined>): string[] {
  return uniqueStrings(texts).filter((text) => /add on|addon|upgrade|max limit exceeded|power up|1x\s*generative credit/i.test(text));
}

function pickDisplayedPrice(priceBlocks: RawPricingPriceBlock[]): string | null {
  const preferred = priceBlocks.find((block) => block.priceRole === 'core-recurring') || priceBlocks[0];
  if (!preferred) return null;
  return (
    buildDisplayTextFromPoint({
      amount: preferred.amount,
      currency: preferred.currency,
      cadence: preferred.cadence,
      unit: preferred.unit,
      billingQualifier: preferred.billingQualifier,
    }) || preferred.rawText
  );
}

function pickDisplayedQualifier(priceBlocks: RawPricingPriceBlock[], qualifiers: string[]): string | null {
  return (
    qualifiers[0] ||
    priceBlocks.find((block) => block.billingQualifier && !/nan|undefined|null/i.test(block.billingQualifier))?.billingQualifier ||
    null
  );
}

function inferCardStartPriceEligibility(
  cardKind: RawPricingCardKind,
  planType: NormalizedPricingPlan['planType'],
  priceBlocks: RawPricingPriceBlock[],
): boolean {
  if (cardKind !== 'core-plan') return false;
  if (planType !== 'paid') return false;
  return priceBlocks.some(
    (block) => block.priceRole === 'core-recurring' && block.amount !== null && block.amount > 0 && block.unit !== 'seat',
  );
}

function computeMissingFields(input: {
  planName: string | null;
  cardKind?: RawPricingCardKind | null;
  ctaText?: string | null;
  ctaHref?: string | null;
  displayedPrice?: string | null;
  displayedQualifier?: string | null;
  sectionHeadings?: string[];
  bulletSections?: RawPricingBulletSection[];
  coreBulletsCount?: number;
  priceBlocks?: RawPricingPriceBlock[];
  provenance?: SourceMeta | null;
  hasDefaultStateCoverage?: boolean;
}): PricingMissingField[] {
  const missing: PricingMissingField[] = [];
  if (!input.planName) missing.push('planName');
  if (!input.cardKind) missing.push('planKind');
  if (!input.ctaText && !input.ctaHref) missing.push('cta');
  if (!input.displayedPrice) missing.push('displayedPrice');
  if (!input.displayedQualifier) missing.push('qualifier');
  if (!input.provenance) missing.push('provenance');
  if (input.hasDefaultStateCoverage === false) missing.push('defaultStateCoverage');
  if (!input.sectionHeadings?.length) missing.push('sectionHeadings');
  if (!input.bulletSections?.length) missing.push('bulletSections');
  if (!input.coreBulletsCount) missing.push('coreBullets');
  if (!input.priceBlocks?.length) missing.push('priceBlocks');
  return missing;
}

function makePriceBlock(rawText: string, options: {
  roleHint?: RawPricingPriceRole;
  visibility?: 'default' | 'state-only';
  billingQualifier?: string | null;
  unitHint?: PricingUnit;
} = {}): RawPricingPriceBlock {
  const normalized = normalizeText(rawText);
  const amountText = extractFirstAmountText(normalized);
  const amount = extractFirstAmount(normalized);
  const unit = options.unitHint || detectUnit(normalized);
  const priceRole = inferPriceRole(`${normalized} ${options.roleHint || ''}`, options.roleHint);
  const billingQualifier = options.billingQualifier ?? (
    /billed yearly|billed annually/i.test(normalized)
      ? normalized.match(/billed yearly|billed annually/i)?.[0] || null
      : null
  );
  return {
    rawText: normalized,
    amountText,
    amount,
    currency: amountText ? 'USD' : null,
    cadence: detectCadence(normalized),
    unit: unit || 'unknown',
    priceRole,
    billingQualifier,
    visibility: options.visibility || 'default',
    safeDisplayCandidate: inferSafeDisplayCandidate(priceRole, normalized, unit),
  };
}

function makeEvidence(source: SourceMeta, snippet: string): RawPricingEvidence {
  return {
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    captureLayer: source.captureLayer,
    capturedAt: source.capturedAt,
    snippet,
  };
}

function formatCardProvenance(source: SourceMeta): string {
  const cacheLabel = source.provenance === 'cache' ? ` cache:${source.cacheMode || 'unknown'}` : '';
  return `${source.provenance}/${source.captureLayer}${cacheLabel} @ ${source.capturedAt}`;
}

function inferCtaIntent(text: string | null | undefined, href: string | null | undefined): RawPricingCtaMeta['intent'] {
  const normalized = normalizeText(`${text || ''} ${href || ''}`).toLowerCase();
  if (/trial/.test(normalized)) return 'start-trial';
  if (/contact|sales|demo|let'?s talk/.test(normalized)) return 'contact-sales';
  if (/upgrade/.test(normalized)) return 'upgrade';
  if (/learn more|about this plan|see all/.test(normalized)) return 'learn-more';
  if (/get started|start now|try now|checkout/.test(normalized)) return 'get-started';
  return 'unknown';
}

function buildCtaMeta(text: string | null | undefined, href: string | null | undefined): RawPricingCtaMeta {
  return {
    text: text || null,
    href: href || null,
    intent: inferCtaIntent(text, href),
  };
}

function extractCreditOptions(texts: Array<string | null | undefined>): string[] {
  return uniqueStrings(texts).filter((text) => /\b\d+\s*(credits?|generative credits?)\b/i.test(text));
}

function extractUsageOptions(texts: Array<string | null | undefined>): string[] {
  return uniqueStrings(texts).filter((text) =>
    /\b\d+\s*(mins?|minutes?|videos?\/month|video exports?|exports?|downloads?\/month|video duration|seat|seats)\b/i.test(text),
  );
}

function extractPromoNotes(texts: Array<string | null | undefined>): string[] {
  return uniqueStrings(texts).filter((text) =>
    !/nan|undefined|null/i.test(text) && /\b(discount|off|save|original price|promo)\b/i.test(text),
  );
}

function extractTrialNotes(texts: Array<string | null | undefined>): string[] {
  return uniqueStrings(texts).filter((text) => /\btrial\b/i.test(text));
}

function buildPlanControl(
  controlType: RawPricingPlanControl['controlType'],
  label: string,
  valueText: string | null,
  options: string[] = [],
  href: string | null = null,
): RawPricingPlanControl {
  return {
    controlType,
    label: normalizeText(label),
    valueText: valueText ? normalizeText(valueText) : null,
    href,
    options: uniqueStrings(options),
  };
}

function makeFact(kind: RawPricingFact['kind'], valueText: string, source: SourceMeta, extra: Partial<RawPricingFact> = {}): RawPricingFact {
  const normalized = normalizeText(valueText);
  return {
    kind,
    valueText: normalized,
    evidence: [makeEvidence(source, normalized)],
    ...extra,
  };
}

function buildBulletSectionsFromDeepbrain($: cheerio.CheerioAPI, card: cheerio.Cheerio<any>): RawPricingBulletSection[] {
  const sections: RawPricingBulletSection[] = [];
  card.find('.plan-sub > div').each((_, sectionEl) => {
    const section = $(sectionEl);
    const title = normalizeText(section.children().first().text()) || null;
    const items = uniqueStrings(
      section.find('.plan-sub-list li .pricing-maintext').map((__, item) => $(item).text()).get(),
    );
    if (title || items.length > 0) {
      sections.push({ title, items });
    }
  });
  return sections;
}

function buildBulletSectionsFromDId($: cheerio.CheerioAPI, card: cheerio.Cheerio<any>): RawPricingBulletSection[] {
  const sections: RawPricingBulletSection[] = [];
  card.find('.c-pricing-app-card__features').each((_, sectionEl) => {
    const section = $(sectionEl);
    const title =
      normalizeText(
        section.find('.c-pricing-app-card__features-title [aria-hidden="true"]').first().text() ||
          section.find('.c-pricing-app-card__features-title').first().text(),
      ) || null;
    const items = uniqueStrings(
      section
        .find('.c-pricing-app-card__features-item')
        .map((__, itemEl) => {
          const item = $(itemEl);
          return (
            item.find('.af-tooltip__title').first().text() ||
            item.find('.af-tooltip__text').first().text() ||
            item.text()
          );
        })
        .get(),
    );
    if (title || items.length > 0) {
      sections.push({ title, items });
    }
  });
  return sections;
}

function buildBulletSectionsFromSteve($: cheerio.CheerioAPI, card: cheerio.Cheerio<any>): RawPricingBulletSection[] {
  const sections: RawPricingBulletSection[] = [];
  const addOnItems = uniqueStrings(
    card.find('.addons-container .addons-credit-span, .addons-edit-container .addons-credit-span').map((_, item) => $(item).text()).get(),
  ).filter((text) => text.length <= 80);
  if (addOnItems.length > 0) {
    sections.push({ title: 'Add-ons', items: addOnItems });
  }

  const rawDetailTexts = uniqueStrings(
    card
      .find('h5, li, p, span')
      .map((_, el) => $(el).text())
      .get(),
  );

  const splitSteveDetailText = (text: string): string[] => {
    const normalized = normalizeText(text);
    if (!normalized) return [];
    const collapsed = normalized
      .replace(/\bPower Up\b/gi, '|Power Up')
      .replace(/(\d+\s*(?:AI Images|mins? AI Videos|Secs? Generative Credits|Mins Generative Credits))/gi, '|$1')
      .replace(/(720p|1080p|2K|4K)\s+Video Resolution/gi, '|$1 Video Resolution')
      .replace(/(No Steve AI Watermark|Unlimited Video Exports|100\+\s*Animated Characters|300\+\s*Animated Characters|Up to 90%\s*Human-like Voices|100%\s*Human-like Voices)/gi, '|$1');
    return uniqueStrings(collapsed.split('|'));
  };

  const detailTexts = uniqueStrings(
    rawDetailTexts.flatMap(splitSteveDetailText),
  ).filter((text) => {
    const normalized = normalizeText(text);
    if (!normalized) return false;
    if (normalized.length > 90) return false;
    if (/^\$/.test(normalized)) return false;
    if (/add on|addon|upgrade|power up|1x\s*generative credit|start now|max limit exceeded|monthly|annually|billed yearly|custom pricing|recommended/i.test(normalized)) return false;
    if (/generative credits$/i.test(normalized)) return false;
    return /video|images|credits|resolution|watermark|exports|characters|voices|stock|mins|seconds|sec\b/i.test(normalized);
  });

  if (detailTexts.length > 0) {
    sections.push({ title: 'Plan details', items: detailTexts.slice(0, 12) });
  }

  return sections;
}

function inferPlanType(planName: string | null, cardKind: RawPricingCardKind, text: string): PricingStructuredPlanType {
  const normalized = normalizeText(`${planName || ''} ${text}`).toLowerCase();
  if (cardKind === 'upgrade-offer') return 'upgrade';
  if (cardKind === 'add-on') return 'add-on';
  if (cardKind === 'enterprise-card' || /enterprise|custom pricing|let[’']?s talk|contact us|contact sales/.test(normalized)) return 'enterprise';
  if (/trial/.test(normalized)) return 'trial';
  if (planName?.toLowerCase() === 'free' || /completely free|free plan/.test(normalized)) return 'free';
  if (/custom pricing/.test(normalized)) return 'custom';
  if (extractFirstAmount(normalized) !== null) return 'paid';
  return 'unknown';
}

function stateToRaw(state: StateHtmlCapture, sourceType: PricingSourceType): RawPricingState {
  return {
    stateId: state.stateId,
    label: state.label,
    billingMode: state.billingMode,
    isDefaultVisible: state.isDefaultVisible,
    triggerType: state.triggerType,
    triggerLabel: state.triggerLabel,
    sourcePage: sourceType,
    notes: state.notes,
  };
}

function extractDeepbrainCardsFromState(
  html: string,
  state: StateHtmlCapture,
  source: SourceMeta,
): RawPricingCard[] {
  const $ = cheerio.load(html);
  const cards: RawPricingCard[] = [];
  $('.studios-plan-item').each((index, el) => {
    const card = $(el);
    const wrapper = card.parent();
    const planNameRaw = normalizeText(card.find('.pricing-h5').first().text()) || null;
    const planName = planNameRaw;
    if (!planName) return;
    const badge = normalizeText(wrapper.find('.plan_topdeco .boldtext18px').first().text()) || null;
    const cta = card.find('a.pricing-btn').first();
    const aboutPlanLink = card.find('a').filter((_, link) => /about this plan/i.test($(link).text())).first();
    const cardDescription = normalizeText(card.find('.pricing_desc').first().text()) || null;
    const textFragment = normalizeText(card.text());
    const rawPlanText = textFragment;
    const priceBlocks: RawPricingPriceBlock[] = [];
    const priceText = normalizeText(card.find('.div-block-140, .div-block-98').first().text());
    if (priceText) {
      priceBlocks.push(
        makePriceBlock(priceText, {
          roleHint: /let'?s talk|contact/i.test(priceText) ? 'custom' : 'core-recurring',
          billingQualifier:
            state.billingMode === 'annual' && !/free|let'?s talk/i.test(priceText)
              ? 'billed yearly'
              : null,
          unitHint: /seat/i.test(textFragment) ? 'seat' : undefined,
        }),
      );
    }
    const sectionHeadings = uniqueStrings(card.find('.plan-sub > div > [class*="text-block"]').map((_, h) => $(h).text()).get());
    const bulletSections = buildBulletSectionsFromDeepbrain($, card);
    const planControls: RawPricingPlanControl[] = [];
    const seatValue = normalizeText(card.find('.seat_num').first().text()) || null;
    if (seatValue) {
      planControls.push(buildPlanControl('seat-stepper', 'Seat selector', seatValue, [seatValue]));
    }
    if (aboutPlanLink.length) {
      planControls.push(
        buildPlanControl(
          'link',
          'About this plan',
          normalizeText(aboutPlanLink.text()) || null,
          [],
          aboutPlanLink.attr('href') || null,
        ),
      );
    }
    const pricingQualifiers = detectPricingQualifierTexts([
      state.billingMode === 'annual' ? 'billed yearly' : 'billed monthly',
      /1 seat/i.test(textFragment) ? '1 seat' : null,
    ]);
    const promoNotes = extractPromoNotes([
      state.billingMode === 'annual' && /-20% off/i.test(html) ? '-20% off' : null,
    ]);
    const trialNotes = extractTrialNotes([cardDescription, textFragment]);
    const creditOptions = extractCreditOptions(
      bulletSections.flatMap((section) => section.items),
    );
    const usageOptions = extractUsageOptions(
      bulletSections
        .flatMap((section) => section.items)
        .concat(seatValue ? [seatValue] : []),
    );
    const explanatoryCopy = uniqueStrings([
      cardDescription,
      badge,
      state.billingMode === 'annual' && /-20% off/i.test(html) ? '-20% off yearly billing' : null,
    ]);
    const displayedPrice = pickDisplayedPrice(priceBlocks);
    const displayedQualifier =
      displayedPrice && /let[’']?s talk|custom/i.test(displayedPrice) ? null : pickDisplayedQualifier(priceBlocks, pricingQualifiers);
    const planTypeHint = inferPlanType(planName, /enterprise/i.test(planName) ? 'enterprise-card' : 'core-plan', textFragment);
    const ctaText = normalizeText(cta.text()) || null;
    const ctaHref = cta.attr('href') || null;

    cards.push({
      cardId: `${state.stateId}::${toPlanId(planName)}`,
      stateId: state.stateId,
      cardKind: /enterprise/i.test(planName) ? 'enterprise-card' : 'core-plan',
      isVisible: true,
      isDefaultVisible: state.isDefaultVisible,
      selector: `.studios-plan-item:nth-of-type(${index + 1})`,
      htmlFragment: compactHtml($.html(el)),
      textFragment,
      rawPlanText,
      planNameRaw,
      planNameNormalized: planName,
      planName,
      planTypeHint,
      subtitle: cardDescription,
      cardDescription,
      badge,
      ctaText,
      ctaHref,
      ctaMeta: buildCtaMeta(ctaText, ctaHref),
      displayedPrice,
      displayedQualifier,
      eligibleForPublicStartPrice: inferCardStartPriceEligibility('core-plan', planTypeHint, priceBlocks),
      sectionHeadings,
      bulletSections,
      pricingQualifiers,
      promoNotes,
      trialNotes,
      creditOptions,
      usageOptions,
      explanatoryCopy,
      planControls,
      upgradeAddOnInfo: [],
      priceBlocks,
      missingFields: computeMissingFields({
        planName,
        cardKind: /enterprise/i.test(planName) ? 'enterprise-card' : 'core-plan',
        ctaText,
        ctaHref,
        displayedPrice,
        displayedQualifier,
        sectionHeadings,
        bulletSections,
        coreBulletsCount: bulletSections.reduce((count, section) => count + section.items.length, 0),
        priceBlocks,
        provenance: source,
      }),
      provenance: {
        captureLayer: source.captureLayer,
        provenance: source.provenance,
        cacheMode: source.cacheMode,
        capturedAt: source.capturedAt,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
      },
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
    });
  });
  return cards;
}

function extractDIdCardsFromState(
  html: string,
  state: StateHtmlCapture,
  source: SourceMeta,
): RawPricingCard[] {
  const $ = cheerio.load(html);
  const cards: RawPricingCard[] = [];
  $('.c-pricing-app-cards__item .c-pricing-app-card').each((index, el) => {
    const card = $(el);
    const planNameRaw = normalizeText(card.find('.c-pricing-app-card__title [aria-hidden="true"]').first().text()) || null;
    const planName = planNameRaw;
    if (!planName) return;
    const cta = card.find('.c-pricing-app-card__button').first();
    const textFragment = normalizeText(card.text());
    const rawPlanText = textFragment;
    const priceBlocks: RawPricingPriceBlock[] = [];
    const costText = normalizeText(card.find('.c-pricing-app-card__cost').first().text());
    if (costText) {
      priceBlocks.push(makePriceBlock(costText, { roleHint: /let'?s talk|contact/i.test(costText) ? 'custom' : 'core-recurring' }));
    }
    const cardDescription = normalizeText(card.find('.c-pricing-app-card__description').not('.c-pricing-app-card__description--info').first().text()) || null;
    const infoText = normalizeText(card.find('.c-pricing-app-card__description--info').first().text());
    if (infoText) {
      priceBlocks.push(makePriceBlock(infoText, { roleHint: /billed annually|billed yearly/i.test(infoText) ? 'yearly-total' : 'unknown' }));
    }
    const sectionHeadings = uniqueStrings(card.find('.c-pricing-app-card__features-title').map((_, h) => $(h).text()).get());
    const bulletSections = buildBulletSectionsFromDId($, card);
    const creditOptions = uniqueStrings(
      card.find('.c-pricing-app-card__switch-button .sr-only, .c-pricing-app-card__switch-button [aria-hidden="true"]').map((_, item) => $(item).text()).get(),
    );
    const planControls = creditOptions.length
      ? [buildPlanControl('credit-switch', 'Credit options', creditOptions[0] || null, creditOptions)]
      : [];
    const pricingQualifiers = detectPricingQualifierTexts([
      card.find('.c-pricing-app-card__description').first().text(),
      infoText,
    ]);
    const promoNotes = extractPromoNotes([infoText]);
    const trialNotes = extractTrialNotes([cardDescription, textFragment]);
    const usageOptions = extractUsageOptions(
      bulletSections
        .flatMap((section) => section.items)
        .concat(cardDescription ? [cardDescription] : []),
    );
    const explanatoryCopy = uniqueStrings([
      cardDescription,
      infoText,
    ]);
    const displayedPrice = pickDisplayedPrice(priceBlocks);
    const displayedQualifier =
      displayedPrice && /let[’']?s talk|custom/i.test(displayedPrice) ? null : pickDisplayedQualifier(priceBlocks, pricingQualifiers);
    const cardKind = /enterprise/i.test(planName) ? 'enterprise-card' : 'core-plan';
    const planTypeHint = inferPlanType(planName, cardKind, textFragment);
    const ctaText = normalizeText(cta.text()) || null;
    const ctaHref = cta.attr('href') || null;
    cards.push({
      cardId: `${state.stateId}::${toPlanId(planName)}`,
      stateId: state.stateId,
      cardKind,
      isVisible: true,
      isDefaultVisible: state.isDefaultVisible,
      selector: `.c-pricing-app-cards__item:nth-of-type(${index + 1}) .c-pricing-app-card`,
      htmlFragment: compactHtml($.html(el)),
      textFragment,
      rawPlanText,
      planNameRaw,
      planNameNormalized: planName,
      planName,
      planTypeHint,
      subtitle: cardDescription,
      cardDescription,
      badge: null,
      ctaText,
      ctaHref,
      ctaMeta: buildCtaMeta(ctaText, ctaHref),
      displayedPrice,
      displayedQualifier,
      eligibleForPublicStartPrice: inferCardStartPriceEligibility(cardKind, planTypeHint, priceBlocks),
      sectionHeadings,
      bulletSections,
      pricingQualifiers,
      promoNotes,
      trialNotes,
      creditOptions,
      usageOptions,
      explanatoryCopy,
      planControls,
      upgradeAddOnInfo: [],
      priceBlocks,
      missingFields: computeMissingFields({
        planName,
        cardKind,
        ctaText,
        ctaHref,
        displayedPrice,
        displayedQualifier,
        sectionHeadings,
        bulletSections,
        coreBulletsCount: bulletSections.reduce((count, section) => count + section.items.length, 0),
        priceBlocks,
        provenance: source,
      }),
      provenance: {
        captureLayer: source.captureLayer,
        provenance: source.provenance,
        cacheMode: source.cacheMode,
        capturedAt: source.capturedAt,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
      },
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
    });
  });
  return cards;
}

function getSteveSummaryCards($: cheerio.CheerioAPI): Map<string, cheerio.Cheerio<any>> {
  const map = new Map<string, cheerio.Cheerio<any>>();
  $('.headerbasic, .headerstarter, .headerpro').each((_, el) => {
    const entry = $(el);
    const planName = normalizeText(entry.find('h2').first().text());
    if (planName) {
      map.set(planName.toLowerCase(), entry);
    }
  });

  $('.toggle-header .container .d-flex.flex-row > .col').each((_, el) => {
    const block = $(el);
    const text = normalizeText(block.text());
    if (!text) return;
    if (/^basic\b/i.test(text)) map.set('basic', block);
    if (/^starter\b/i.test(text)) map.set('starter', block);
    if (/^pro\b/i.test(text)) map.set('pro', block);
    if (/^generative ai\b/i.test(text)) map.set('generative ai', block);
    if (/^enterprise\b/i.test(text)) map.set('enterprise', block);
  });

  return map;
}

function extractSteveCoreCardsFromState(
  html: string,
  state: StateHtmlCapture,
  source: SourceMeta,
): RawPricingCard[] {
  const $ = cheerio.load(html);
  const cards: RawPricingCard[] = [];
  const summaryCards = getSteveSummaryCards($);

  $('.upgrade_now_card').each((index, el) => {
    const detailCard = $(el).children().first();
    const planNameRaw = normalizeText(detailCard.find('h2').first().text()) || null;
    const planName = planNameRaw;
    if (!planName) return;
    const summary = summaryCards.get(planName.toLowerCase());
    const textFragment = normalizeText(`${summary?.text() || ''} ${detailCard.text()}`);
    const rawPlanText = textFragment;
    const cta = detailCard.find('button, a').filter((_, item) => /start now|contact us|upgrade/i.test($(item).text())).first();
    const priceBlocks: RawPricingPriceBlock[] = [];

    const summaryPriceText = normalizeText(summary?.find('h1').first().text() || '');
    if (summaryPriceText) {
      priceBlocks.push(makePriceBlock(summaryPriceText, { roleHint: /custom/i.test(summaryPriceText) ? 'custom' : 'core-recurring' }));
    }
    const detailPriceText = normalizeText(detailCard.find('h1').first().text());
    if (detailPriceText && detailPriceText !== summaryPriceText) {
      priceBlocks.push(makePriceBlock(detailPriceText, { roleHint: /custom/i.test(detailPriceText) ? 'custom' : 'core-recurring' }));
    }
    const strikeText = normalizeText(detailCard.find('.ogPriceTag').first().text());
    if (strikeText) {
      priceBlocks.push(makePriceBlock(strikeText, { roleHint: 'strike-through' }));
    }
    const yearlyText = normalizeText(detailCard.find('h3').first().text() || summary?.find('h3').first().text() || '');
    if (yearlyText) {
      priceBlocks.push(makePriceBlock(yearlyText, { roleHint: /billed yearly/i.test(yearlyText) ? 'yearly-total' : 'unknown' }));
    }
    const addOnText = normalizeText(detailCard.find('.addons-container').first().text());
    if (addOnText) {
      priceBlocks.push(makePriceBlock(addOnText, { roleHint: 'add-on' }));
    }
    const sectionHeadings = uniqueStrings(['Add-ons', 'Plan details'].filter(Boolean));
    const bulletSections = buildBulletSectionsFromSteve($, detailCard);
    const addOnOptions = uniqueStrings(
      detailCard.find('.addons-credit-span').map((_, item) => $(item).text()).get(),
    );
    const planControls: RawPricingPlanControl[] = [];
    if (addOnOptions.length > 0) {
      planControls.push(buildPlanControl('add-on-selector', 'Add-on options', addOnOptions[0] || null, addOnOptions));
    }
    const generativeControlText = normalizeText(detailCard.find('.gm-left-container, .change-credit-container').first().text()) || null;
    if (generativeControlText) {
      planControls.push(buildPlanControl('add-on-selector', 'Generative credit control', generativeControlText));
    }
    const pricingQualifiers = detectPricingQualifierTexts([
      summary?.find('h3').first().text(),
      detailCard.find('h3').first().text(),
      /recommended/i.test(textFragment) ? 'Recommended' : null,
    ]);
    const promoNotes = extractPromoNotes([
      detailCard.find('.ogPriceTag').first().text(),
      detailCard.find('h3').first().text(),
    ]);
    const creditOptions = extractCreditOptions(
      bulletSections.flatMap((section) => section.items).concat(addOnOptions),
    );
    const usageOptions = extractUsageOptions(
      bulletSections.flatMap((section) => section.items),
    );
    const upgradeAddOnInfo = detectUpgradeAddOnInfo([
      addOnText,
      detailCard.find('.addons-container').text(),
      detailCard.find('.addons-edit-container').text(),
    ]);
    const explanatoryCopy = uniqueStrings([
      summary?.find('h3').first().text(),
      detailCard.find('h3').first().text(),
      detailCard.find('h4').first().text(),
    ]);
    const displayedPrice = pickDisplayedPrice(priceBlocks);
    const displayedQualifier =
      displayedPrice && /let[’']?s talk|custom/i.test(displayedPrice) ? null : pickDisplayedQualifier(priceBlocks, pricingQualifiers);
    const cardKind = /enterprise/i.test(planName) ? 'enterprise-card' : 'core-plan';
    const planTypeHint = inferPlanType(planName, cardKind, textFragment);
    const ctaText = normalizeText(cta.text()) || null;
    const ctaHref = cta.attr('href') || null;

    cards.push({
      cardId: `${state.stateId}::${toPlanId(planName)}`,
      stateId: state.stateId,
      cardKind,
      isVisible: !/display:\s*none/i.test($(el).attr('style') || ''),
      isDefaultVisible: state.isDefaultVisible,
      selector: `.upgrade_now_card:nth-of-type(${index + 1})`,
      htmlFragment: compactHtml($.html(el)),
      textFragment,
      rawPlanText,
      planNameRaw,
      planNameNormalized: planName,
      planName,
      planTypeHint,
      subtitle: null,
      cardDescription: null,
      badge: null,
      ctaText,
      ctaHref,
      ctaMeta: buildCtaMeta(ctaText, ctaHref),
      displayedPrice,
      displayedQualifier,
      eligibleForPublicStartPrice: inferCardStartPriceEligibility(cardKind, planTypeHint, priceBlocks),
      sectionHeadings,
      bulletSections,
      pricingQualifiers,
      promoNotes,
      trialNotes: [],
      creditOptions,
      usageOptions,
      explanatoryCopy,
      planControls,
      upgradeAddOnInfo,
      priceBlocks,
      missingFields: computeMissingFields({
        planName,
        cardKind,
        ctaText,
        ctaHref,
        displayedPrice,
        displayedQualifier,
        sectionHeadings,
        bulletSections,
        coreBulletsCount: bulletSections.reduce((count, section) => count + section.items.length, 0),
        priceBlocks,
        provenance: source,
      }),
      provenance: {
        captureLayer: source.captureLayer,
        provenance: source.provenance,
        cacheMode: source.cacheMode,
        capturedAt: source.capturedAt,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
      },
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
    });
  });

  return cards;
}

function extractSteveUpgradeCardsFromState(
  html: string,
  state: StateHtmlCapture,
  source: SourceMeta,
): RawPricingCard[] {
  const $ = cheerio.load(html);
  const cards: RawPricingCard[] = [];
  $('.anim-new-modal[id^="Upgrade"]').each((index, el) => {
    const card = $(el);
    const detailSection = card.find('.pricing_details_section').first();
    if (!detailSection.length) return;
    const textFragment = normalizeText(detailSection.text());
    if (!textFragment) return;
    const rawPlanText = textFragment;
    const title = normalizeText(detailSection.find('h2, .growth_text, .business_text, .modal-body-text').first().text()) || 'Upgrade';
    const planNameMatch = textFragment.match(/\b(Basic|Starter|Pro|Enterprise)\b/i);
    const planName = planNameMatch ? planNameMatch[1] : title;
    const button = detailSection.find('.upgrade_plan, .contact_us').first();
    const priceBlocks = uniqueStrings(
      detailSection.find('.growth_price, .business_price, h1, h3, h4').map((_, item) => $(item).text()).get(),
    ).map((text) => makePriceBlock(text, { roleHint: /contact|custom/i.test(text) ? 'custom' : 'upgrade' }));
    if (priceBlocks.length === 0) return;
    const displayedPrice = pickDisplayedPrice(priceBlocks);
    const ctaText = normalizeText(button.text()) || null;
    const ctaHref = button.attr('href') || null;
    const pricingQualifiers = detectPricingQualifierTexts([
      detailSection.find('h3, h4').first().text(),
    ]);
    const promoNotes = extractPromoNotes(detailSection.find('.ogPriceTag, h3, h4').map((_, item) => $(item).text()).get());
    const creditOptions = extractCreditOptions([textFragment]);
    const usageOptions = extractUsageOptions([textFragment]);
    cards.push({
      cardId: `${state.stateId}::upgrade::${index + 1}`,
      stateId: state.stateId,
      cardKind: 'upgrade-offer',
      isVisible: !/display:\s*none/i.test(card.attr('style') || ''),
      isDefaultVisible: false,
      selector: `.anim-new-modal[id^="Upgrade"]:nth-of-type(${index + 1})`,
      htmlFragment: compactHtml($.html(el)),
      textFragment,
      rawPlanText,
      planNameRaw: planName,
      planNameNormalized: planName,
      planName,
      planTypeHint: 'upgrade',
      subtitle: title,
      cardDescription: title,
      badge: null,
      ctaText,
      ctaHref,
      ctaMeta: buildCtaMeta(ctaText, ctaHref),
      displayedPrice,
      displayedQualifier: null,
      eligibleForPublicStartPrice: false,
      sectionHeadings: ['Upgrade offer'],
      bulletSections: [],
      pricingQualifiers,
      promoNotes,
      trialNotes: [],
      creditOptions,
      usageOptions,
      explanatoryCopy: [title],
      planControls: [],
      upgradeAddOnInfo: detectUpgradeAddOnInfo([textFragment]),
      priceBlocks,
      missingFields: computeMissingFields({
        planName,
        cardKind: 'upgrade-offer',
        ctaText,
        ctaHref,
        displayedPrice,
        displayedQualifier: null,
        sectionHeadings: ['Upgrade offer'],
        bulletSections: [],
        coreBulletsCount: 0,
        priceBlocks,
        provenance: source,
      }),
      provenance: {
        captureLayer: source.captureLayer,
        provenance: source.provenance,
        cacheMode: source.cacheMode,
        capturedAt: source.capturedAt,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
      },
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
    });
  });
  return cards;
}

function extractCardsForState(
  slug: string,
  html: string,
  state: StateHtmlCapture,
  source: SourceMeta,
): RawPricingCard[] {
  if (slug === 'deepbrain-ai') {
    return extractDeepbrainCardsFromState(html, state, source);
  }
  if (slug === 'd-id') {
    return extractDIdCardsFromState(html, state, source);
  }
  if (slug === 'steve-ai') {
    return [
      ...extractSteveCoreCardsFromState(html, state, source),
      ...extractSteveUpgradeCardsFromState(html, state, source),
    ];
  }
  return [];
}

function deriveFactsFromCards(cards: RawPricingCard[], source: SourceMeta): RawPricingFact[] {
  const facts: RawPricingFact[] = [];
  const planTypes = new Map<string, PricingStructuredPlanType>();

  for (const card of cards) {
    const planType = card.planTypeHint || inferPlanType(card.planName, card.cardKind, card.textFragment);
    if (card.planName) {
      planTypes.set(card.planName, planType);
    }
    if (planType === 'trial') {
      facts.push(makeFact('free-trial', card.textFragment, source, { planName: card.planName || undefined }));
    }
    if (planType === 'free') {
      facts.push(makeFact('free-plan', card.textFragment, source, { planName: card.planName || undefined, amount: 0, currency: 'USD', cadence: 'month', unit: 'account' }));
    }
    if (planType === 'enterprise') {
      facts.push(makeFact('enterprise', card.textFragment, source, { planName: card.planName || undefined }));
    }
    if (card.cardKind === 'upgrade-offer' || card.priceBlocks.some((block) => ['add-on', 'upgrade'].includes(block.priceRole))) {
      facts.push(makeFact('interactive-pricing', card.textFragment, source, { planName: card.planName || undefined }));
    }
    for (const block of card.priceBlocks) {
      if (block.amount !== null) {
        facts.push(
          makeFact('price-point', block.rawText, source, {
            planName: card.planName || undefined,
            amount: block.amount,
            currency: block.currency,
            cadence: block.cadence,
            unit: block.unit,
          }),
        );
      }
    }
  }

  if (cards.some((card) => planTypes.get(card.planName || '') === 'paid')) {
    facts.push(makeFact('self-serve-paid', 'Paid plans available', source));
  }

  return dedupeFacts(facts);
}

function dedupeFacts(facts: RawPricingFact[]): RawPricingFact[] {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    const key = `${fact.kind}:${fact.planName || ''}:${fact.amount ?? ''}:${fact.valueText}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildGenericSnippets(cards: RawPricingCard[]): RawPricingSnippet[] {
  return cards.slice(0, 12).map((card) => ({
    kind: 'plan-card',
    heading: card.planName || undefined,
    text: card.textFragment.slice(0, 220),
  }));
}

export function inferStateHtmlCapturesFromHtml(slug: string, html: string, sourceType: PricingSourceType): StateHtmlCapture[] {
  const $ = cheerio.load(html);

  if (slug === 'deepbrain-ai') {
    const yearlySelected = /translate3d\(100%/.test($('#yearly-switch .div-block-110').attr('style') || '');
    return [
      {
        stateId: yearlySelected ? 'annual-visible' : 'monthly-visible',
        label: yearlySelected ? 'Yearly' : 'Monthly',
        billingMode: yearlySelected ? 'annual' : 'monthly',
        isDefaultVisible: true,
        triggerType: 'default',
        triggerLabel: yearlySelected ? 'Yearly' : 'Monthly',
        html,
      },
    ];
  }

  if (slug === 'd-id') {
    const annualSelected = $('.b-pricing-switch__element--secondary').hasClass('active');
    return [
      {
        stateId: annualSelected ? 'annual-visible' : 'monthly-visible',
        label: annualSelected ? 'Annual' : 'Monthly',
        billingMode: annualSelected ? 'annual' : 'monthly',
        isDefaultVisible: true,
        triggerType: 'default',
        triggerLabel: annualSelected ? 'Annual' : 'Monthly',
        html,
      },
    ];
  }

  if (slug === 'steve-ai') {
    const annualSelected = $('#header-toggle-pricing').attr('checked') !== undefined;
    return [
      {
        stateId: annualSelected ? 'annual-visible' : 'monthly-visible',
        label: annualSelected ? 'Annually' : 'Monthly',
        billingMode: annualSelected ? 'annual' : 'monthly',
        isDefaultVisible: true,
        triggerType: 'default',
        triggerLabel: annualSelected ? 'Annually' : 'Monthly',
        html,
      },
    ];
  }

  return [
    {
      stateId: 'default-visible',
      label: 'Default',
      billingMode: detectBillingMode(extractTextFromHtml(html)),
      isDefaultVisible: true,
      triggerType: 'default',
      triggerLabel: null,
      html,
    },
  ];
}

export function extractStructuredPricingFromStateHtmls(input: {
  slug: string;
  sourceType: PricingSourceType;
  sourceUrl: string;
  captureLayer: PricingCaptureLayer;
  capturedAt: string;
  provenance: PricingCaptureProvenance;
  cacheMode: 'static' | 'dynamic' | 'unknown' | null;
  states: StateHtmlCapture[];
}): {
  states: RawPricingState[];
  cards: RawPricingCard[];
  facts: RawPricingFact[];
  snippets: RawPricingSnippet[];
} {
  const rawStates = input.states.map((state) => stateToRaw(state, input.sourceType));
  const cards = input.states.flatMap((state) =>
    extractCardsForState(
      input.slug,
      state.html,
      state,
      {
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
        captureLayer: input.captureLayer,
        capturedAt: input.capturedAt,
        provenance: input.provenance,
        cacheMode: input.cacheMode,
      },
    ),
  );
  const facts = deriveFactsFromCards(cards, {
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    captureLayer: input.captureLayer,
    capturedAt: input.capturedAt,
    provenance: input.provenance,
    cacheMode: input.cacheMode,
  });

  return {
    states: rawStates,
    cards,
    facts,
    snippets: buildGenericSnippets(cards),
  };
}

export function summarizeCapture(
  toolSlug: string,
  pages: RawPricingPageCapture[],
  states: RawPricingState[],
  cards: RawPricingCard[],
  facts: RawPricingFact[],
  notes: string[],
): RawPricingCaptureFile {
  return {
    toolSlug,
    capturedAt: new Date().toISOString(),
    pages,
    states,
    cards,
    facts,
    sourceUrls: Array.from(new Set(pages.map((page) => page.sourceUrl))),
    notes,
  };
}

export function makePageCapture(input: {
  sourceType: PricingSourceType;
  sourceUrl: string;
  captureLayer: PricingCaptureLayer;
  usedCache: boolean;
  cacheMode: 'static' | 'dynamic' | 'unknown';
  capturedAt: string;
  textLength: number;
  fallbackReasons: string[];
  stateIds: string[];
  cardIds: string[];
  snippets: RawPricingSnippet[];
}): RawPricingPageCapture {
  return {
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    captureLayer: input.captureLayer,
    usedCache: input.usedCache,
    cacheMode: input.cacheMode,
    capturedAt: input.capturedAt,
    textLength: input.textLength,
    fallbackReasons: input.fallbackReasons,
    stateIds: input.stateIds,
    cardIds: input.cardIds,
    snippets: input.snippets,
  };
}

function classifyBulletKind(text: string): NormalizedPlanBullet['kind'] {
  const normalized = normalizeText(text).toLowerCase();
  if (/support|manager|priority/i.test(normalized)) return 'support';
  if (/min|minutes|exports|credits|avatars|images|videos|characters|workspace|seat/i.test(normalized)) return 'limit';
  if (/quota|allowance/i.test(normalized)) return 'quota';
  if (/watermark|resolution|voice|template|download|dubbing|clone/i.test(normalized)) return 'feature';
  return 'unknown';
}

function buildPlanPricePoint(
  block: RawPricingPriceBlock,
  card: RawPricingCard,
  state: RawPricingState | undefined,
  planType: NormalizedPricingPlan['planType'],
): NormalizedPlanPricePoint {
  const isCorePlanPrice = card.cardKind === 'core-plan' || card.cardKind === 'enterprise-card';
  let blockedReason: string | null = null;
  let eligibleForRecommendedDisplay = false;

  if (!isCorePlanPrice) {
    blockedReason = 'non-core card';
  } else if (planType === 'trial') {
    blockedReason = 'trial pricing is not a public paid start price';
  } else if (planType === 'free') {
    blockedReason = 'free plan is not a paid start price';
  } else if (block.unit === 'seat') {
    blockedReason = 'per-seat pricing is not a generic public start price';
  } else if (block.priceRole === 'core-recurring' && block.amount !== null) {
    eligibleForRecommendedDisplay = true;
  } else if (['yearly-total', 'add-on', 'upgrade', 'promo', 'list', 'strike-through'].includes(block.priceRole)) {
    blockedReason = `${block.priceRole} price is details-only`;
  } else if (block.priceRole === 'custom') {
    blockedReason = 'custom pricing is not a numeric self-serve start price';
  } else {
    blockedReason = 'price point is not eligible for recommended display';
  }

  const billingQualifier =
    block.billingQualifier ||
    (state?.billingMode === 'annual' && block.priceRole === 'core-recurring' ? 'billed annually' : null);
  const displayText = buildDisplayTextFromPoint({
    amount: block.amount,
    currency: block.currency,
    cadence: block.cadence,
    unit: block.unit,
    billingQualifier,
  });

  return {
    stateId: card.stateId,
    amount: block.amount,
    currency: block.currency,
    cadence: block.cadence,
    unit: block.unit,
    priceRole: block.priceRole,
    billingQualifier,
    isDefaultVisible: state?.isDefaultVisible === true,
    isCorePlanPrice,
    eligibleForRecommendedDisplay,
    blockedReason,
    rawText: block.rawText,
    displayText,
  };
}

function buildNormalizedBulletSections(cards: RawPricingCard[]): NormalizedPricingBulletSection[] {
  const sections = new Map<string, { title: string | null; bullets: string[] }>();
  for (const card of cards) {
    for (const section of card.bulletSections) {
      const key = section.title || '__untitled__';
      const existing = sections.get(key) || { title: section.title, bullets: [] };
      existing.bullets = uniqueStrings([...existing.bullets, ...section.items]);
      sections.set(key, existing);
    }
  }
  return Array.from(sections.values());
}

function buildBillingVariants(
  cards: RawPricingCard[],
  statesById: Map<string, RawPricingState>,
): NormalizedPricingBillingVariant[] {
  return cards.map((card) => {
    const state = statesById.get(card.stateId);
    const recurring = card.priceBlocks.filter((block) => block.priceRole === 'core-recurring');
    const headlinePriceText =
      recurring
        .map((block) =>
          buildDisplayTextFromPoint({
            amount: block.amount,
            currency: block.currency,
            cadence: block.cadence,
            unit: block.unit,
            billingQualifier: block.billingQualifier,
          }),
        )
        .find(Boolean) || card.displayedPrice;
    return {
      stateId: card.stateId,
      stateLabel: state?.label || card.stateId,
      billingMode: state?.billingMode || 'unknown',
      isDefaultVisible: state?.isDefaultVisible === true,
      displayedPrice: card.displayedPrice,
      displayedQualifier: card.displayedQualifier,
      headlinePriceText,
      cardDescription: card.cardDescription,
      subtitle: card.subtitle,
      qualifiers: uniqueStrings([card.displayedQualifier, ...(card.pricingQualifiers || [])]),
      promoNotes: card.promoNotes || [],
      trialNotes: card.trialNotes || [],
      creditOptions: card.creditOptions || [],
      usageOptions: card.usageOptions || [],
      planControls: card.planControls || [],
      explanatoryCopy: card.explanatoryCopy || [],
      rawPlanText: card.rawPlanText || card.textFragment,
    };
  });
}

function buildDetailCards(
  cards: RawPricingCard[],
  statesById: Map<string, RawPricingState>,
  detailType: NormalizedPricingDetailCard['detailType'],
): NormalizedPricingDetailCard[] {
  const seen = new Set<string>();
  const items: NormalizedPricingDetailCard[] = [];
  for (const card of cards) {
    const state = statesById.get(card.stateId);
    const title = card.planNameNormalized || card.planName || card.cardDescription || 'Pricing detail';
    const key = `${detailType}::${card.stateId}::${title}::${card.displayedPrice || ''}::${card.rawPlanText}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      cardId: card.cardId,
      stateId: card.stateId,
      stateLabel: state?.label || card.stateId,
      billingMode: state?.billingMode || 'unknown',
      detailType,
      title,
      displayedPrice: card.displayedPrice,
      displayedQualifier: card.displayedQualifier,
      rawPlanText: card.rawPlanText || card.textFragment,
      qualifiers: uniqueStrings([card.displayedQualifier, ...(card.pricingQualifiers || [])]),
      promoNotes: card.promoNotes || [],
      trialNotes: card.trialNotes || [],
      creditOptions: card.creditOptions || [],
      usageOptions: card.usageOptions || [],
      planControls: card.planControls || [],
      bulletSections: buildNormalizedBulletSections([card]),
      ctaMeta: card.ctaMeta,
    });
  }
  return items;
}

function buildSourceMeta(cards: RawPricingCard[]): NormalizedPricingPlanSourceMeta[] {
  const seen = new Set<string>();
  const items: NormalizedPricingPlanSourceMeta[] = [];
  for (const card of cards) {
    const key = [
      card.stateId,
      card.provenance.sourceType,
      card.provenance.sourceUrl,
      card.provenance.captureLayer,
      card.provenance.provenance,
      card.provenance.cacheMode || 'none',
      card.provenance.capturedAt,
    ].join('::');
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      stateId: card.stateId,
      sourceType: card.provenance.sourceType,
      sourceUrl: card.provenance.sourceUrl,
      captureLayer: card.provenance.captureLayer,
      provenance: card.provenance.provenance,
      cacheMode: card.provenance.cacheMode,
      capturedAt: card.provenance.capturedAt,
    });
  }
  return items;
}

function deriveRecommendedDisplayPrice(
  plans: NormalizedPricingPlan[],
): NormalizedPricingRecord['recommendedDisplayPrice'] {
  const eligible = plans
    .flatMap((plan) =>
      plan.pricePoints
        .filter(
          (point) =>
            point.eligibleForRecommendedDisplay &&
            plan.planType === 'paid' &&
            (point.amount || 0) > 0 &&
            point.unit !== 'seat',
        )
        .map((point) => ({ point, plan })),
    )
    .sort((a, b) => {
      const amountDelta = (a.point.amount || Number.MAX_SAFE_INTEGER) - (b.point.amount || Number.MAX_SAFE_INTEGER);
      if (amountDelta !== 0) return amountDelta;
      if (a.point.isDefaultVisible !== b.point.isDefaultVisible) {
        return a.point.isDefaultVisible ? -1 : 1;
      }
      return a.plan.name.localeCompare(b.plan.name);
    });

  const chosen = eligible[0];
  if (!chosen) return null;

  const reasonParts = [
    `Derived from ${chosen.plan.name}.`,
    chosen.point.billingQualifier ? `Qualifier preserved: ${chosen.point.billingQualifier}.` : null,
    chosen.point.unit === 'seat' ? 'Seat-based qualifier preserved.' : null,
  ].filter(Boolean);

  return {
    amount: chosen.point.amount,
    currency: chosen.point.currency,
    cadence: chosen.point.cadence,
    unit: chosen.point.unit,
    displayText: chosen.point.displayText ? `Starts at ${chosen.point.displayText}` : null,
    safeToShow: Boolean(chosen.point.displayText),
    reason: reasonParts.join(' '),
    planId: chosen.plan.planId,
    planName: chosen.plan.name,
    stateId: chosen.point.stateId,
    priceRole: chosen.point.priceRole,
    comparisonEligible: true,
    structuredDataEligible: true,
    scoringEligible: true,
  };
}

export function normalizeStateAwareCapture(
  capture: RawPricingCaptureFile,
  options: {
    verification?: NormalizedPricingRecord['verification'];
    notes?: string[];
  } = {},
): NormalizedPricingRecord {
  const billingStates: NormalizedPricingBillingState[] = capture.states.map((state) => ({
    stateId: state.stateId,
    label: state.label,
    billingMode: state.billingMode,
    isDefaultVisible: state.isDefaultVisible,
    sourcePage: state.sourcePage,
  }));

  const statesById = new Map(capture.states.map((state) => [state.stateId, state]));
  const planMap = new Map<string, RawPricingCard[]>();

  for (const card of capture.cards) {
    if (!card.planName) continue;
    const planId = toPlanId(card.planName);
    const existing = planMap.get(planId) || [];
    existing.push(card);
    planMap.set(planId, existing);
  }

  const plans: NormalizedPricingPlan[] = Array.from(planMap.entries()).map(([planId, cards]) => {
    const surfaceCards = cards.filter((card) => card.cardKind === 'core-plan' || card.cardKind === 'enterprise-card');
    const detailCards = cards.filter((card) => card.cardKind !== 'core-plan' && card.cardKind !== 'enterprise-card');
    const displayCards = surfaceCards.length > 0 ? surfaceCards : cards;
    const planName = cards.find((card) => card.planName)?.planName || planId;
    const planType = cards.reduce<NormalizedPricingPlan['planType']>((current, card) => {
      const next = card.planTypeHint || inferPlanType(card.planName, card.cardKind, card.textFragment);
      if (current === 'enterprise' || next === current) return current;
      if (next === 'enterprise') return next;
      if (next === 'upgrade' || next === 'add-on') return current;
      if (current === 'unknown') return next;
      if (next === 'paid') return next;
      return current;
    }, 'unknown');

    const pricePoints = cards.flatMap((card) =>
      card.priceBlocks.map((block) => buildPlanPricePoint(block, card, statesById.get(card.stateId), planType)),
    );

    const bullets: NormalizedPlanBullet[] = [];
    const coreBullets: NormalizedPlanBullet[] = [];
    for (const card of displayCards) {
      for (const section of card.bulletSections) {
        for (const item of section.items) {
          const bullet = {
            sectionTitle: section.title,
            text: item,
            kind: classifyBulletKind(item),
          } satisfies NormalizedPlanBullet;
          bullets.push(bullet);
          if (section.title !== 'Add-ons' && section.title !== 'Upgrade offer') {
            coreBullets.push(bullet);
          }
        }
      }
    }

    const uniqueBulletMap = new Map<string, NormalizedPlanBullet>();
    for (const bullet of bullets) {
      uniqueBulletMap.set(`${bullet.sectionTitle || ''}:${bullet.text}`, bullet);
    }
    const uniqueCoreBulletMap = new Map<string, NormalizedPlanBullet>();
    for (const bullet of coreBullets) {
      uniqueCoreBulletMap.set(`${bullet.sectionTitle || ''}:${bullet.text}`, bullet);
    }

    const defaultVisibleStateIds = new Set(
      capture.states.filter((state) => state.isDefaultVisible).map((state) => state.stateId),
    );
    const primaryCard =
      displayCards
        .slice()
        .sort((a, b) => {
          if (a.isDefaultVisible !== b.isDefaultVisible) return a.isDefaultVisible ? -1 : 1;
          return a.cardId.localeCompare(b.cardId);
        })[0] || null;
    const primaryPricePoints = pricePoints.filter((point) => point.isCorePlanPrice && point.priceRole === 'core-recurring');
    const firstDisplayable = primaryPricePoints.find((point) => point.displayText)?.displayText || null;
    const firstQualifier = primaryPricePoints.find((point) => point.billingQualifier)?.billingQualifier || null;
    const firstUnit = primaryPricePoints.find((point) => point.unit)?.unit || 'unknown';
    const marketingBadgeText = primaryCard?.badge || null;
    const billingVariants = buildBillingVariants(displayCards, statesById).sort((a, b) => {
      if (a.isDefaultVisible !== b.isDefaultVisible) return a.isDefaultVisible ? -1 : 1;
      if (a.billingMode !== b.billingMode) {
        return a.billingMode === 'monthly' ? -1 : 1;
      }
      return a.stateId.localeCompare(b.stateId);
    });
    const normalizedSections = buildNormalizedBulletSections(displayCards);
    const rawBullets = uniqueStrings(displayCards.flatMap((card) => card.bulletSections.flatMap((section) => section.items)));
    const pricingQualifiers = uniqueStrings([
      ...displayCards.flatMap((card) => card.pricingQualifiers),
      ...primaryPricePoints.map((point) => point.billingQualifier),
      firstUnit === 'seat' ? 'per seat' : null,
    ]);
    const qualifiers = uniqueStrings([
      ...pricingQualifiers,
      ...displayCards.map((card) => card.displayedQualifier),
    ]);
    const promoNotes = uniqueStrings(displayCards.flatMap((card) => card.promoNotes || []));
    const trialNotes = uniqueStrings(displayCards.flatMap((card) => card.trialNotes || []));
    const creditOptions = uniqueStrings(displayCards.flatMap((card) => card.creditOptions || []));
    const usageOptions = uniqueStrings(displayCards.flatMap((card) => card.usageOptions || []));
    const explanatoryCopy = uniqueStrings(displayCards.flatMap((card) => card.explanatoryCopy || []));
    const planControls = (() => {
      const seen = new Set<string>();
      const list: RawPricingPlanControl[] = [];
      for (const card of displayCards) {
        for (const control of card.planControls || []) {
          const key = `${control.controlType}:${control.label}:${control.valueText || ''}:${control.href || ''}:${control.options.join('|')}`;
          if (seen.has(key)) continue;
          seen.add(key);
          list.push(control);
        }
      }
      return list;
    })();
    const upgradeAddOnInfo = uniqueStrings(cards.flatMap((card) => card.upgradeAddOnInfo));
    const addOnCards = buildDetailCards(
      [
        ...detailCards.filter((card) => card.cardKind === 'add-on'),
        ...displayCards.filter((card) => card.priceBlocks.some((block) => block.priceRole === 'add-on') || (card.planControls || []).some((control) => control.controlType === 'add-on-selector')),
      ],
      statesById,
      'add-on',
    );
    const upgradeCards = buildDetailCards(
      detailCards.filter((card) => card.cardKind === 'upgrade-offer'),
      statesById,
      'upgrade',
    );
    const displayedPrice = primaryCard?.displayedPrice || firstDisplayable;
    const displayedQualifier =
      displayedPrice && /let[’']?s talk|custom pricing|contact/i.test(displayedPrice)
        ? null
        : primaryCard?.displayedQualifier || firstQualifier;
    const eligibleForPublicStartPrice = displayCards.some((card) => card.eligibleForPublicStartPrice);
    const missingFields = uniqueStrings(
      displayCards.flatMap((card) => card.missingFields).map((field) => String(field)),
    ) as PricingMissingField[];
    if (defaultVisibleStateIds.size > 0 && !displayCards.some((card) => defaultVisibleStateIds.has(card.stateId))) {
      missingFields.push('defaultStateCoverage');
    }
    const sourceMeta = buildSourceMeta(cards);
    const cacheFallbackStateIds = uniqueStrings(
      displayCards
        .filter((card) => card.provenance.provenance === 'cache')
        .map((card) => card.stateId),
    );
    const ctaText = cards.find((card) => card.ctaText)?.ctaText || null;
    const ctaHref = cards.find((card) => card.ctaHref)?.ctaHref || null;

    return {
      planId,
      name: planName,
      planNameRaw: cards.find((card) => card.planNameRaw || card.planName)?.planNameRaw || cards.find((card) => card.planName)?.planName || null,
      planNameNormalized: planName,
      badge: marketingBadgeText,
      subtitle: primaryCard?.subtitle || null,
      cardDescription: primaryCard?.cardDescription || null,
      cta: {
        text: ctaText,
        href: ctaHref,
      },
      ctaMeta: buildCtaMeta(ctaText, ctaHref),
      displayedPrice,
      displayedQualifier,
      eligibleForPublicStartPrice,
      headlinePriceText: firstDisplayable,
      billingQualifier: firstQualifier,
      unit: firstUnit,
      planType,
      stateAvailability: uniqueStrings(cards.map((card) => card.stateId)),
      billingVariants,
      pricePoints,
      bulletSections: normalizedSections,
      bullets: Array.from(uniqueBulletMap.values()),
      coreBullets: Array.from(uniqueCoreBulletMap.values()),
      rawBullets,
      pricingQualifiers,
      qualifiers,
      promoNotes,
      trialNotes,
      creditOptions,
      usageOptions,
      explanatoryCopy,
      planControls,
      marketingBadgeText,
      addOnCards,
      upgradeCards,
      upgradeAddOnInfo,
      missingFields,
      cardSnapshots: displayCards.map((card) => ({
        cardId: card.cardId,
        stateId: card.stateId,
        isDefaultVisible: card.isDefaultVisible,
        cardKind: card.cardKind,
        displayedPrice: card.displayedPrice,
        displayedQualifier: card.displayedQualifier,
        eligibleForPublicStartPrice: card.eligibleForPublicStartPrice,
        selector: card.selector,
        provenance: card.provenance,
      })),
      sourceCardIds: displayCards.map((card) => card.cardId),
      rawPlanText: uniqueStrings(cards.map((card) => card.rawPlanText || card.textFragment)),
      sourceMeta,
      captureMeta: {
        defaultVisibleStateIds: Array.from(defaultVisibleStateIds),
        hasDefaultVisibleCardCoverage: defaultVisibleStateIds.size === 0 || displayCards.some((card) => defaultVisibleStateIds.has(card.stateId)),
        cacheFallbackStateIds,
      },
      notes: uniqueStrings([
        ...detailCards
          .map((card) => `${card.cardKind} captured for plan details only`),
        ...displayCards
          .filter((card) => card.provenance.provenance === 'cache')
          .map((card) => `card provenance includes cache fallback for ${card.stateId}`),
        defaultVisibleStateIds.size > 0 && !displayCards.some((card) => defaultVisibleStateIds.has(card.stateId))
          ? 'default visible state has no extracted plan card for this plan'
          : null,
      ]),
      sourceUrls: uniqueStrings(cards.map((card) => card.sourceUrl)),
      evidence: uniqueStrings(cards.map((card) => card.textFragment)),
    };
  });

  let recommendedDisplayPrice = deriveRecommendedDisplayPrice(plans);
  if (recommendedDisplayPrice) {
    const candidatePlan = plans.find((plan) => plan.planId === recommendedDisplayPrice?.planId);
    const candidateSnapshot = candidatePlan?.cardSnapshots.find((snapshot) => snapshot.stateId === recommendedDisplayPrice?.stateId);
    const defaultVisibleStateIds = new Set(billingStates.filter((state) => state.isDefaultVisible).map((state) => state.stateId));
    const missingDefaultCoverage = candidatePlan?.missingFields.includes('defaultStateCoverage') === true;
    const candidateUsesCache = candidateSnapshot?.provenance.provenance === 'cache';
    const candidateOutsideDefaultState =
      defaultVisibleStateIds.size > 0 &&
      recommendedDisplayPrice.stateId !== null &&
      !defaultVisibleStateIds.has(recommendedDisplayPrice.stateId);

    if (candidateUsesCache || (missingDefaultCoverage && candidateOutsideDefaultState)) {
      const downgradeReasons = [
        candidateUsesCache ? 'candidate price currently depends on cache-fallback card capture' : null,
        missingDefaultCoverage && candidateOutsideDefaultState
          ? 'default-visible state does not yet have clean card coverage for the candidate plan'
          : null,
      ].filter(Boolean);
      recommendedDisplayPrice = {
        ...recommendedDisplayPrice,
        safeToShow: false,
        comparisonEligible: false,
        structuredDataEligible: false,
        scoringEligible: false,
        reason: uniqueStrings([recommendedDisplayPrice.reason, ...downgradeReasons]).join(' '),
      };
    }
  }
  const hasFreePlan = plans.some((plan) => plan.planType === 'free') || null;
  const hasFreeTrial = plans.some((plan) => plan.planType === 'trial') || null;
  const hasSelfServePaid = plans.some((plan) => plan.planType === 'paid') || null;
  const hasEnterprise = plans.some((plan) => plan.planType === 'enterprise' || plan.planType === 'custom') || null;
  const hasInteractivePricing =
    billingStates.length > 1 ||
    capture.cards.some((card) => card.cardKind === 'upgrade-offer' || card.priceBlocks.some((block) => ['add-on', 'upgrade'].includes(block.priceRole))) ||
    capture.cards.some((card) => card.priceBlocks.some((block) => block.unit === 'seat'));
  const interactiveReasons = uniqueStrings([
    ...capture.notes,
    billingStates.length > 1 ? 'multiple billing states captured' : null,
    capture.cards.some((card) => card.priceBlocks.some((block) => block.unit === 'seat')) ? 'per-seat pricing present' : null,
    capture.cards.some((card) => card.priceBlocks.some((block) => ['add-on', 'upgrade'].includes(block.priceRole)))
      ? 'add-on or upgrade pricing captured separately'
      : null,
  ]);

  const status: NormalizedPricingRecord['status'] =
    hasSelfServePaid
      ? 'paid'
      : hasEnterprise
        ? 'custom'
        : hasFreePlan
          ? 'free'
          : 'pricing-not-verified';

  const verification =
    options.verification ||
    (recommendedDisplayPrice
      ? 'verified'
      : hasSelfServePaid
        ? 'partial'
        : 'unverified');

  const coarseDisplayText = resolveCoarseDisplayText({
    status,
    hasSelfServePaid,
    hasEnterprise,
    verification,
  });

  const recommended =
    recommendedDisplayPrice || {
      amount: null,
      currency: 'USD',
      cadence: null,
      unit: 'unknown' as PricingUnit,
      displayText: null,
      safeToShow: false,
      reason: 'No eligible core recurring price point was derived from captured plan cards.',
      planId: null,
      planName: null,
      stateId: null,
      priceRole: null,
      comparisonEligible: false,
      structuredDataEligible: false,
      scoringEligible: false,
    };

  return {
    toolSlug: capture.toolSlug,
    capturedAt: capture.capturedAt,
    sourceUrls: capture.sourceUrls,
    governance: {
      origin: 'newly-captured',
      safeToShow: recommended.safeToShow,
      reviewRequired: true,
    },
    verification,
    status,
    coarseDisplayText,
    hasFreePlan,
    hasFreeTrial,
    hasSelfServePaid,
    hasEnterprise,
    hasInteractivePricing,
    interactiveReasons,
    billingStates,
    captureMeta: {
      pageCount: capture.pages.length,
      cardCount: capture.cards.length,
      factCount: capture.facts.length,
      defaultVisibleStateIds: billingStates.filter((state) => state.isDefaultVisible).map((state) => state.stateId),
      pageSources: capture.pages.map((page) => ({
        sourceType: page.sourceType,
        sourceUrl: page.sourceUrl,
        captureLayer: page.captureLayer,
        usedCache: page.usedCache,
        cacheMode: page.cacheMode,
        capturedAt: page.capturedAt,
      })),
    },
    plans,
    recommendedDisplayPrice: recommendedDisplayPrice,
    verifiedStartingPrice: {
      amount: recommended.amount,
      currency: recommended.currency,
      cadence: recommended.cadence,
      displayText: recommended.displayText,
      safeToShow: recommended.safeToShow,
      reason: recommended.reason,
    },
    notes: uniqueStrings([
      ...capture.notes,
      ...(options.notes || []),
      'Candidate result only. Do not replace existing frontend pricing or exact-price display without manual review.',
    ]),
  };
}

export function validateNormalizedRecord(record: NormalizedPricingRecord): string[] {
  const issues: string[] = [];
  if (!isValidOriginVerificationCombo(record.governance.origin, record.verification)) {
    issues.push(`Invalid origin/verification combo: ${record.governance.origin} + ${record.verification}`);
  }
  const expectedCoarse = resolveCoarseDisplayText(record);
  if (record.coarseDisplayText !== expectedCoarse) {
    issues.push(`coarseDisplayText mismatch: expected "${expectedCoarse}" but got "${record.coarseDisplayText}"`);
  }
  if (!record.billingStates.length) {
    issues.push('No billingStates captured');
  }
  if (!record.plans.length) {
    issues.push('No plans captured');
  }
  return issues;
}

export function buildAuditRecord(record: NormalizedPricingRecord): PricingAuditRecord {
  const resolverPreview = buildResolverPreview(record);
  const detailsOnlyPricePoints: PricingAuditRecord['detailsOnlyPricePoints'] = [];
  const blockedPricePoints: PricingAuditRecord['blockedPricePoints'] = [];

  for (const plan of record.plans) {
    for (const point of plan.pricePoints) {
      if (point.eligibleForRecommendedDisplay) continue;
      if (['yearly-total', 'promo', 'list', 'strike-through', 'add-on', 'upgrade'].includes(point.priceRole) || point.isCorePlanPrice === false) {
        detailsOnlyPricePoints.push({
          planId: plan.planId,
          planName: plan.name,
          stateId: point.stateId,
          displayText: point.displayText,
          priceRole: point.priceRole,
          reason: point.blockedReason,
        });
      } else {
        blockedPricePoints.push({
          planId: plan.planId,
          planName: plan.name,
          stateId: point.stateId,
          displayText: point.displayText,
          priceRole: point.priceRole,
          blockedReason: point.blockedReason,
        });
      }
    }
  }

  return {
    toolSlug: record.toolSlug,
    capturedAt: record.capturedAt,
    validationIssues: validateNormalizedRecord(record),
    capturedStates: record.billingStates,
    planCardSummary: record.plans.map((plan) => ({
      planId: plan.planId,
      name: plan.name,
      planType: plan.planType,
      stateAvailability: plan.stateAvailability,
      pricePointCount: plan.pricePoints.length,
      bulletCount: plan.bullets.length,
    })),
    recommendedDisplayPrice: record.recommendedDisplayPrice,
    resolverPreview,
    exactPriceAllowedForDisplay: resolverPreview.exactPriceAllowed.display,
    comparisonEligible: resolverPreview.exactPriceAllowed.comparison,
    structuredDataEligible: resolverPreview.exactPriceAllowed['structured-data'],
    detailsOnlyPricePoints,
    blockedPricePoints,
    manualReviewChecklist: uniqueStrings([
      record.governance.reviewRequired ? 'Review required before any frontend adoption.' : null,
      record.recommendedDisplayPrice?.safeToShow
        ? `Confirm recommended display price remains correct: ${record.recommendedDisplayPrice.displayText || 'n/a'}`
        : 'No exact public price is currently allowed.',
      record.plans.some((plan) => plan.pricePoints.some((point) => point.priceRole === 'strike-through'))
        ? 'Confirm promo/list/strike-through pricing is not used as public start price.'
        : null,
      record.plans.some((plan) => plan.pricePoints.some((point) => point.priceRole === 'add-on' || point.priceRole === 'upgrade'))
        ? 'Confirm add-on and upgrade prices remain plan-details only.'
        : null,
      record.plans.some((plan) => plan.planType === 'trial')
        ? 'Confirm trial is not treated as a free plan.'
        : null,
      record.plans.some((plan) => (plan.missingFields ?? []).length > 0)
        ? 'Review plans with missingFields before using captured plan details.'
        : null,
    ]),
    finalDisplayText: resolverPreview.displayText,
    safeToShow: record.governance.safeToShow,
    coarseDisplayText: resolverPreview.coarseDisplayText,
  };
}

function isMalformedReviewDisplay(value: string | null | undefined): boolean {
  if (!value) return true;
  return /nan|\$[a-z_][a-z0-9_]*|undefined|null/i.test(value);
}

function dedupeReviewPrices<T extends { planName: string; display: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.planName}::${entry.display}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeBlockedReviewPrices<T extends { planName: string; stateId: string; display: string | null; reason: string | null; priceRole: string }>(
  entries: T[],
): T[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.planName}::${entry.stateId}::${entry.display || 'n/a'}::${entry.reason || 'blocked'}::${entry.priceRole}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildBlockedPriceGroups(record: NormalizedPricingRecord) {
  const rawItems = dedupeBlockedReviewPrices(
    record.plans.flatMap((plan) =>
      plan.pricePoints
        .filter((point) => !point.eligibleForRecommendedDisplay)
        .map((point) => ({
          planName: plan.name,
          stateId: point.stateId,
          display: point.displayText,
          reason: point.blockedReason,
          priceRole: point.priceRole,
          provenance:
            plan.cardSnapshots.find((snapshot) => snapshot.stateId === point.stateId)
              ? formatCardProvenance(plan.cardSnapshots.find((snapshot) => snapshot.stateId === point.stateId)!.provenance)
              : null,
        })),
    ),
  );

  const aggregated = new Map<string, (typeof rawItems)[number] & { displays: string[]; count: number }>();
  for (const item of rawItems) {
    const aggregateKey = `${item.reason || 'blocked'}::${item.planName}::${item.stateId}::${item.priceRole}::${item.provenance || 'n/a'}`;
    const current = aggregated.get(aggregateKey);
    const nextDisplays = uniqueStrings([...(current?.displays || []), !isMalformedReviewDisplay(item.display) ? item.display : null].filter(Boolean));
    aggregated.set(aggregateKey, {
      ...item,
      display: current?.display || item.display,
      displays: nextDisplays,
      count: (current?.count || 0) + 1,
    });
  }

  const items = Array.from(aggregated.values()).map((item) => {
    const display =
      item.displays.length === 0
        ? null
        : item.displays.length <= 3
          ? item.displays.join(', ')
          : `${item.displays.slice(0, 3).join(', ')} (+${item.displays.length - 3} more)`;
    return {
      ...item,
      display,
    };
  });

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const reason = item.reason || 'blocked';
    groups.set(reason, [...(groups.get(reason) || []), item]);
  }
  return Array.from(groups.entries()).map(([reason, groupItems]) => ({ reason, items: groupItems }));
}

export function buildReviewSummaryRecord(record: NormalizedPricingRecord): PricingReviewSummaryRecord {
  const resolverPreview = buildResolverPreview(record);
  const recommendedPublicDisplay =
    resolverPreview.exactPriceAllowed.display && record.recommendedDisplayPrice?.displayText
      ? record.recommendedDisplayPrice.displayText
      : record.coarseDisplayText;
  const defaultVisibleStateIds = record.billingStates.filter((state) => state.isDefaultVisible).map((state) => state.stateId);
  const candidateSnapshot =
    record.recommendedDisplayPrice?.planId && record.recommendedDisplayPrice?.stateId
      ? record.plans
          .find((plan) => plan.planId === record.recommendedDisplayPrice?.planId)
          ?.cardSnapshots.find((snapshot) => snapshot.stateId === record.recommendedDisplayPrice?.stateId)
      : null;

  const monthlyPrices = dedupeReviewPrices(
    record.plans.flatMap((plan) =>
      plan.pricePoints
        .filter((point) => point.priceRole === 'core-recurring' && point.cadence === 'month')
        .map((point) => ({
          planName: plan.name,
          display: point.displayText || point.rawText,
          eligibleForPublicStartPrice: point.eligibleForRecommendedDisplay,
        }))
        .filter(
          (entry) =>
            !isMalformedReviewDisplay(entry.display) &&
            entry.display.includes('$') &&
            !/billed annually|billed yearly/i.test(entry.display),
        ),
    ),
  );

  const annualPrices = dedupeReviewPrices(
    record.plans.flatMap((plan) =>
      plan.pricePoints
        .filter(
          (point) =>
            point.priceRole === 'yearly-total' ||
            (point.priceRole === 'core-recurring' && /annual|yearly/i.test(point.billingQualifier || '')),
        )
        .map((point) => ({
          planName: plan.name,
          display: point.displayText || point.rawText,
          eligibleForPublicStartPrice: point.eligibleForRecommendedDisplay,
        }))
        .filter((entry) => !isMalformedReviewDisplay(entry.display) && entry.display.includes('$')),
    ),
  );

  return {
    toolSlug: record.toolSlug,
    capturedAt: record.capturedAt,
    billingStates: record.billingStates.map((state) => ({
      stateId: state.stateId,
      label: state.label,
      billingMode: state.billingMode,
      isDefaultVisible: state.isDefaultVisible,
    })),
    defaultVisibleStateIds,
    recommendedPublicDisplay,
    publicStartPriceCandidate: {
      display: record.recommendedDisplayPrice?.displayText || null,
      planName: record.recommendedDisplayPrice?.planName || null,
      stateId: record.recommendedDisplayPrice?.stateId || null,
      provenance: candidateSnapshot ? formatCardProvenance(candidateSnapshot.provenance) : null,
      allowedForExactDisplay: resolverPreview.exactPriceAllowed.display,
    },
    monthlyPrices,
    annualPrices,
    blockedPrices: buildBlockedPriceGroups(record),
    planCards: record.plans.map((plan) => ({
      planName: plan.name,
      planKind: plan.planType,
      displayedPrice: plan.displayedPrice,
      qualifier: plan.displayedQualifier,
      eligibleForPublicStartPrice: plan.eligibleForPublicStartPrice,
      badge: plan.marketingBadgeText,
      cta: plan.cta.text,
      cardProvenance: plan.cardSnapshots.map((snapshot) => ({
        stateId: snapshot.stateId,
        isDefaultVisible: snapshot.isDefaultVisible,
        provenance: formatCardProvenance(snapshot.provenance),
        displayedPrice: snapshot.displayedPrice,
        qualifier: snapshot.displayedQualifier,
      })),
      mainBullets: plan.coreBullets.slice(0, 8).map((bullet) => bullet.text),
      pricingQualifiers: plan.pricingQualifiers,
      upgradeAddOnInfo: plan.upgradeAddOnInfo.slice(0, 5),
      missingFields: plan.missingFields,
    })),
    reviewWarnings: uniqueStrings([
      ...record.notes,
      record.plans.some((plan) => plan.notes.some((note) => /default visible state has no extracted plan card/i.test(note)))
        ? 'Some plans do not yet have card extraction for the live default-visible state.'
        : null,
      record.plans.some((plan) => plan.cardSnapshots.some((snapshot) => snapshot.provenance.provenance === 'cache'))
        ? 'Some card snapshots came from cache fallback and should be manually verified against the live page.'
        : null,
      record.plans.some((plan) => plan.missingFields.length > 0)
        ? 'Some plan cards still have missingFields and need manual review.'
        : null,
    ]),
  };
}

export function buildReviewSummaryMarkdown(summary: PricingReviewSummaryRecord): string {
  const billingStateLines =
    summary.billingStates.length > 0
      ? summary.billingStates
          .map((state) => `- ${state.stateId}: ${state.label} (${state.billingMode})${state.isDefaultVisible ? ' [default visible]' : ''}`)
          .join('\n')
      : '- none';
  const monthlyLines =
    summary.monthlyPrices.length > 0
      ? summary.monthlyPrices
          .map((entry) => `- ${entry.planName}: ${entry.display}${entry.eligibleForPublicStartPrice ? ' [eligible]' : ''}`)
          .join('\n')
      : '- none';
  const annualLines =
    summary.annualPrices.length > 0
      ? summary.annualPrices
          .map((entry) => `- ${entry.planName}: ${entry.display}${entry.eligibleForPublicStartPrice ? ' [eligible]' : ''}`)
          .join('\n')
      : '- none';
  const blockedLines =
    summary.blockedPrices.length > 0
      ? summary.blockedPrices
          .map((group) => {
            const items = group.items
              .map((entry) => `  - ${entry.planName} (${entry.stateId}): ${entry.display || 'n/a'} [${entry.priceRole}]${entry.provenance ? ` via ${entry.provenance}` : ''}`)
              .join('\n');
            return `- ${group.reason}\n${items}`;
          })
          .join('\n')
      : '- none';
  const cardLines =
    summary.planCards.length > 0
      ? summary.planCards
          .map((card) => {
            const bullets = card.mainBullets.length > 0 ? card.mainBullets.join('; ') : 'none';
            const missing = card.missingFields.length > 0 ? card.missingFields.join(', ') : 'none';
            const provenance = card.cardProvenance.length
              ? card.cardProvenance
                  .map(
                    (entry) =>
                      `${entry.stateId}${entry.isDefaultVisible ? ' [default]' : ''}: price=${entry.displayedPrice || 'n/a'} qualifier=${entry.qualifier || 'n/a'} via ${entry.provenance}`,
                  )
                  .join(' | ')
              : 'none';
            const qualifiers = card.pricingQualifiers.length ? card.pricingQualifiers.join('; ') : 'none';
            const upgrades = card.upgradeAddOnInfo.length ? card.upgradeAddOnInfo.join('; ') : 'none';
            return `- ${card.planName} [${card.planKind}] price=${card.displayedPrice || 'n/a'} qualifier=${card.qualifier || 'n/a'} eligible=${card.eligibleForPublicStartPrice ? 'yes' : 'no'} badge=${card.badge || 'n/a'} cta=${card.cta || 'n/a'} missing=${missing}\n  states/provenance: ${provenance}\n  bullets: ${bullets}\n  qualifiers: ${qualifiers}\n  add-ons/upgrades: ${upgrades}`;
          })
          .join('\n')
      : '- none';
  const notes = summary.reviewWarnings.length > 0 ? summary.reviewWarnings.map((note) => `- ${note}`).join('\n') : '- none';
  const candidateLine = summary.publicStartPriceCandidate.display
    ? `${summary.publicStartPriceCandidate.display} from ${summary.publicStartPriceCandidate.planName || 'n/a'} @ ${summary.publicStartPriceCandidate.stateId || 'n/a'}${summary.publicStartPriceCandidate.provenance ? ` via ${summary.publicStartPriceCandidate.provenance}` : ''}${summary.publicStartPriceCandidate.allowedForExactDisplay ? '' : ' [coarse-only]'}` 
    : `none${summary.publicStartPriceCandidate.allowedForExactDisplay ? '' : ' [coarse-only]'}`;

  return [
    `# ${summary.toolSlug} pricing review summary`,
    '',
    `Captured at: ${summary.capturedAt}`,
    '',
    '## Billing states',
    billingStateLines,
    '',
    `Default visible states: ${summary.defaultVisibleStateIds.join(', ') || 'none'}`,
    `Recommended public display: ${summary.recommendedPublicDisplay}`,
    `Public start-price candidate: ${candidateLine}`,
    '',
    '## Monthly prices',
    monthlyLines,
    '',
    '## Annual prices',
    annualLines,
    '',
    '## Blocked prices',
    blockedLines,
    '',
    '## Plan cards',
    cardLines,
    '',
    '## Review warnings',
    notes,
    '',
  ].join('\n');
}

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { fetchDynamic, fetchStatic } from '../fetchers';
import type {
  CoarseDisplayText,
  NormalizedPricingRecord,
  PricingCaptureLayer,
  PricingResolverPreview,
  PricingSourceType,
  RawPricingCaptureFile,
  RawPricingEvidence,
  RawPricingFact,
  RawPricingPageCapture,
  RawPricingSnippet,
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
export const CACHE_DIR = path.join(PROJECT_ROOT, 'scripts', 'cache');

type ToolSourcesEntry = {
  slug: string;
  sources: Partial<Record<PricingSourceType, { url: string; mode?: 'static' | 'dynamic'; description?: string }>>;
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

function localizeCachePath(candidatePath?: string): string | null {
  if (!candidatePath) return null;
  if (fs.existsSync(candidatePath)) return candidatePath;
  const localCandidate = path.join(PROJECT_ROOT, 'scripts', 'cache', path.basename(path.dirname(candidatePath)), path.basename(candidatePath));
  return fs.existsSync(localCandidate) ? localCandidate : null;
}

export function ensureOutputDirs(): void {
  for (const dir of [RAW_OUTPUT_DIR, NORMALIZED_OUTPUT_DIR, AUDIT_OUTPUT_DIR]) {
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
  return {
    url: source.url,
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

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return normalizeText($('body').text() || $.text());
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

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
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
  text = pickRicherText(text, html);

  return {
    html,
    text: normalizeText(text),
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

  const html = layer === 'playwright' ? await fetchDynamic(source.url, { slug, type: sourceType }) : await fetchStatic(source.url);
  return {
    html,
    text: pickRicherText(extractTextFromHtml(html), html),
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
    /pay monthly|pay yearly|monthlyannually|billed yearly|billed annually|annually30% off/.test(normalizedText) ||
    /data-pricing|data-yearly-pricing/.test(normalizedHtml)
  ) {
    reasons.add('billing-toggle-or-annual-qualifier');
  }
  if (/seat\/mo|per seat|per editor|custom editors|minutesToPrice|interactive videos per month/.test(normalizedText + normalizedHtml)) {
    reasons.add('interactive-or-unit-priced-plans');
  }
  if (!/\$[0-9]/.test(text)) {
    reasons.add('missing-price-tokens');
  }

  return Array.from(reasons);
}

export function extractSnippets(text: string): RawPricingSnippet[] {
  const snippets: RawPricingSnippet[] = [];
  const patterns = [
    { kind: 'plan-card' as const, pattern: /(?:free|starter|basic|creator|business|pro|team|enterprise)[\s\S]{0,180}?(?:\$\d+|custom|let'?s talk|contact sales)/gi },
    { kind: 'billing-note' as const, pattern: /[\s\S]{0,50}(?:billed yearly|billed annually|pay monthly|pay yearly|monthly|annually)[\s\S]{0,80}/gi },
    { kind: 'faq-item' as const, pattern: /(?:frequently asked questions|questions|how much does|can i use .* for free)[\s\S]{0,180}/gi },
  ];

  for (const { kind, pattern } of patterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches.slice(0, 8)) {
      const normalized = normalizeText(match);
      if (!normalized) continue;
      snippets.push({ kind, text: normalized });
    }
  }

  if (snippets.length === 0 && text) {
    snippets.push({ kind: 'generic', text: text.slice(0, 220) });
  }

  return dedupeSnippets(snippets).slice(0, 20);
}

function dedupeSnippets(snippets: RawPricingSnippet[]): RawPricingSnippet[] {
  const seen = new Set<string>();
  return snippets.filter((snippet) => {
    const key = `${snippet.kind}:${snippet.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function guessPlanName(snippet: string): string | undefined {
  const planNames = ['Free', 'Basic', 'Starter', 'Creator', 'Business', 'Pro', 'Premium', 'Team', 'Enterprise'];
  return planNames.find((planName) => new RegExp(`\\b${planName}\\b`, 'i').test(snippet));
}

function makeEvidence(page: RawPricingPageCapture, snippet: string): RawPricingEvidence {
  return {
    sourceType: page.sourceType,
    sourceUrl: page.sourceUrl,
    captureLayer: page.captureLayer,
    capturedAt: page.capturedAt,
    snippet,
  };
}

export function extractFactsFromPage(page: RawPricingPageCapture, text: string): RawPricingFact[] {
  const facts: RawPricingFact[] = [];
  const normalizedText = normalizeText(text);

  if (/free trial|start free trial|14 days of free trail|trial period/i.test(normalizedText)) {
    const snippet = normalizedText.match(/[^.]{0,120}(free trial|start free trial|14 days of free trail|trial period)[^.]{0,120}/i)?.[0] || 'Free trial language found';
    facts.push({
      kind: 'free-trial',
      valueText: normalizeText(snippet),
      evidence: [makeEvidence(page, normalizeText(snippet))],
    });
  }

  if (/\$0|forever free|free plan|free get started|contains .* branded outro/i.test(normalizedText)) {
    const snippet = normalizedText.match(/[^.]{0,120}(\$0|forever free|free plan|free get started)[^.]{0,140}/i)?.[0] || 'Free plan language found';
    facts.push({
      kind: 'free-plan',
      planName: guessPlanName(snippet) || 'Free',
      amount: 0,
      currency: 'USD',
      cadence: 'month',
      unit: 'account',
      valueText: normalizeText(snippet),
      evidence: [makeEvidence(page, normalizeText(snippet))],
    });
  }

  if (/enterprise|custom pricing|let['’]s talk|contact sales|learn about enterprise/i.test(normalizedText)) {
    const enterpriseSnippet = normalizedText.match(/[^.]{0,120}(enterprise|custom pricing|let['’]s talk|contact sales|learn about enterprise)[^.]{0,120}/i)?.[0];
    if (enterpriseSnippet) {
      facts.push({
        kind: 'enterprise',
        planName: 'Enterprise',
        valueText: normalizeText(enterpriseSnippet),
        evidence: [makeEvidence(page, normalizeText(enterpriseSnippet))],
      });
    }
  }

  if (/pay monthly|pay yearly|monthlyannually|billed yearly|billed annually|data-pricing|data-yearly-pricing/i.test(normalizedText)) {
    const snippet = normalizedText.match(/[^.]{0,120}(pay monthly|pay yearly|monthlyannually|billed yearly|billed annually)[^.]{0,120}/i)?.[0] || 'Interactive billing controls detected';
    facts.push({
      kind: 'interactive-pricing',
      valueText: normalizeText(snippet),
      evidence: [makeEvidence(page, normalizeText(snippet))],
    });
  }

  const priceMatches = Array.from(
    normalizedText.matchAll(/(?:from)?\s*\$([0-9]+)(?:\.([0-9]{1,2}))?(?:\s*usd)?(?:\/(seat\/)?mo|\s*\/mo|\s*per month)?(?:[^.]{0,40}?(billed yearly|billed annually))?/gi),
  );
  for (const match of priceMatches.slice(0, 16)) {
    const fullMatch = match[0];
    const amount = Number(`${match[1]}${match[2] ? `.${match[2]}` : ''}`);
    const unit = match[3] ? 'seat' : 'account';
    const qualifier = match[4] ? normalizeText(match[4]) : '';
    facts.push({
      kind: 'price-point',
      planName: guessPlanName(fullMatch),
      amount,
      currency: 'USD',
      cadence: 'month',
      unit,
      valueText: normalizeText(fullMatch),
      evidence: [makeEvidence(page, normalizeText(fullMatch + (qualifier ? ` ${qualifier}` : '')))],
    });
  }

  if (/\bpaid\b|everything in free \+|everything in starter \+|everything in basic \+/i.test(normalizedText)) {
    const snippet = normalizedText.match(/[^.]{0,120}(everything in free \+|everything in starter \+|everything in basic \+)[^.]{0,120}/i)?.[0] || 'Paid plan language found';
    facts.push({
      kind: 'self-serve-paid',
      valueText: normalizeText(snippet),
      evidence: [makeEvidence(page, normalizeText(snippet))],
    });
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

export function summarizeCapture(
  toolSlug: string,
  pages: RawPricingPageCapture[],
  facts: RawPricingFact[],
  notes: string[],
): RawPricingCaptureFile {
  return {
    toolSlug,
    capturedAt: new Date().toISOString(),
    pages,
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
    snippets: input.snippets,
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
  return issues;
}

export function buildAuditRecord(record: NormalizedPricingRecord): {
  toolSlug: string;
  capturedAt: string;
  validationIssues: string[];
  resolverPreview: PricingResolverPreview;
  finalDisplayText: string;
  safeToShow: boolean;
  coarseDisplayText: CoarseDisplayText;
} {
  const resolverPreview = buildResolverPreview(record);
  return {
    toolSlug: record.toolSlug,
    capturedAt: record.capturedAt,
    validationIssues: validateNormalizedRecord(record),
    resolverPreview,
    finalDisplayText: resolverPreview.displayText,
    safeToShow: record.governance.safeToShow,
    coarseDisplayText: resolverPreview.coarseDisplayText,
  };
}

/**
 * Evidence Normalization Pipeline
 *
 * Centralized cleaning rules for evidence data:
 * 1. URL cleaning - extract URLs from markdown links
 * 2. English translation - translate non-English text
 * 3. Price filtering - remove pricing/discount related nuggets
 * 4. Deduplication - by normalized text
 * 5. Conflict resolution - preserve existing conflictGroup
 * 6. Field completion - generate hasNumber/keywords/metadata
 */

import { EvidenceNugget, EvidenceTheme } from '@/data/evidence/schema';

// =============================================================================
// Type Definitions
// =============================================================================

export interface RawEvidence {
  slug?: string;
  tool?: string;           // heygen 使用 tool 字段
  lastUpdated?: string;
  collectedAt?: string;    // heygen 使用 collectedAt
  sources?: {
    pricing?: string | string[];
    faq?: string | string[];
    help?: string | string[];
    featuresIndex?: string | string[];
    featurePages?: string | string[];
    terms?: string | string[];
    privacy?: string | string[];
    about?: string | string[];
    useCases?: string | string[];
    other?: string | string[];
    [key: string]: string | string[] | undefined;
  };
  nuggets?: RawNugget[];
  hardFacts?: RawHardFact[];  // heygen 使用 hardFacts
  // zebracat 新结构
  linkIndex?: {
    slug?: string;
    sourceType?: string;
    pageUrl?: string;
    capturedAt?: string;
    featureUrls?: string[];
    [key: string]: unknown;
  };
  pageEvidence?: Array<{
    slug?: string;
    sourceType?: string;
    pageUrl?: string;
    capturedAt?: string;
    nuggets?: RawNugget[];
    [key: string]: unknown;
  }>;
}

export interface RawNugget {
  text: string;
  theme: string;
  sourceUrl?: string;
  pageUrl?: string;
  sourceType?: string;
  capturedAt?: string;
  confidence?: string;
  note?: string;
  conflictGroup?: string;
  // Flexible: allow any additional fields
  [key: string]: unknown;
}

// heygen hardFacts 结构
export interface RawHardFact {
  field: string;
  value: string;
  sources?: Array<{
    url?: string;
    type?: string;
    quote?: string;
  }>;
  [key: string]: unknown;
}

export interface EvidenceNormalized {
  slug: string;
  lastUpdated: string;
  sources: {
    pricing?: string;
    features?: string;
    help?: string;
    faq?: string;
    terms?: string;
    docs?: string;
    examples?: string[];
    [key: string]: string | string[] | undefined;
  };
  nuggets: EvidenceNugget[];
  metadata: {
    totalNuggets: number;
    themesCovered: EvidenceTheme[];
    hasModelClaims: boolean;
    hasExamples: boolean;
    minConfidence: 'high' | 'medium' | 'low';
  };
}

// =============================================================================
// URL Cleaning - Step 1
// =============================================================================

/**
 * Clean markdown link format: [https://x](https://x) -> https://x
 */
function cleanUrl(url: string): string {
  // Match markdown link pattern: [text](url)
  const mdLinkPattern = /^\[(https?:\/\/[^\s]+)\]\((https?:\/\/[^\s]+)\)$/;
  const match = url.match(mdLinkPattern);
  if (match) {
    return match[2];
  }
  return url;
}

/**
 * Clean all URLs in a value (string or array)
 */
function cleanUrlsInValue(value: unknown): string | string[] | undefined {
  if (typeof value === 'string') {
    return cleanUrl(value);
  }
  if (Array.isArray(value)) {
    return value.map(v => typeof v === 'string' ? cleanUrl(v) : v).filter((v): v is string => typeof v === 'string');
  }
  return undefined;
}

// =============================================================================
// Price Filtering - Step 3
// =============================================================================

// Price-related patterns (must match explicit price/billing terms)
const PRICE_PATTERNS = [
  /\$\d+/,                      // Dollar amounts like $99, $10
  /save\s+\d+|\d+%\s*off/i,    // Discount terms
  /price|cost/i,               // Price/cost mentions
];

function isPriceRelated(text: string): boolean {
  // 只有明确包含价格/计费相关术语才过滤
  const hasPriceAmount = /\$\d+/.test(text);              // $99, $10 等
  const hasDiscount = /save\s+\d+|\d+%\s*off|discount|coupon/i.test(text);  // 折扣相关
  const hasPriceKeyword = /price|cost|subscription\s*(fee|plan)/i.test(text); // 价格关键词
  const hasBillingPeriod = /\/(month|year)\b/i.test(text);  // /month 或 /year 作为独立词

  // 必须同时有计费周期和价格关键词才算价格相关
  return hasPriceAmount || hasDiscount || (hasBillingPeriod && hasPriceKeyword);
}

// =============================================================================
// Deduplication - Step 4
// =============================================================================

/**
 * Normalize text for deduplication: lowercase + trim + remove trailing punctuation
 */
function normalizeForDedup(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?]+$/, '')  // Remove trailing punctuation
    .replace(/\s+/g, ' ');      // Normalize whitespace
}

// =============================================================================================================================================
// Conflict Resolution - Step 5
// =============================================================================

interface NuggetWithGroup {
  nugget: InternalNugget;
  score: number;
  orderKey: string;
}

interface InternalNugget extends EvidenceNugget {
  conflictGroup?: string;
  note?: string;
}

function resolveConflicts(nuggets: InternalNugget[]): EvidenceNugget[] {
  // Group by conflictGroup if exists
  const grouped = new Map<string, NuggetWithGroup[]>();

  for (const nugget of nuggets) {
    const key = nugget.conflictGroup || '__no_group__';
    const existing = grouped.get(key) || [];
    existing.push({ nugget, score: 0, orderKey: nugget.sourceUrl });
    grouped.set(key, existing);
  }

  // If no conflictGroup exists, do simple deduplication by normalized text
  if (grouped.size === 1 && grouped.has('__no_group__')) {
    const deduped = new Map<string, InternalNugget>();
    for (const nugget of nuggets) {
      const normKey = normalizeForDedup(nugget.text);
      if (!deduped.has(normKey)) {
        deduped.set(normKey, nugget);
      }
    }
    return Array.from(deduped.values()).map(n => {
      const { conflictGroup, note, ...rest } = n;
      return rest;
    });
  }

  // Keep first nugget per conflictGroup (preserving existing logic)
  const result: EvidenceNugget[] = [];
  for (const [key, items] of grouped) {
    if (key === '__no_group__') {
      // For ungrouped nuggets, apply deduplication
      const deduped = new Map<string, InternalNugget>();
      for (const item of items) {
        const normKey = normalizeForDedup(item.nugget.text);
        if (!deduped.has(normKey)) {
          deduped.set(normKey, item.nugget);
        }
      }
      result.push(...Array.from(deduped.values()).map(n => {
        const { conflictGroup, note, ...rest } = n;
        return rest;
      }));
    } else {
      // For grouped, keep first (existing conflictGroup logic)
      if (items.length > 0) {
        const { conflictGroup, note, ...rest } = items[0].nugget;
        result.push(rest);
      }
    }
  }

  return result;
}

// =============================================================================
// Field Completion - Step 6
// =============================================================================

function hasNumberOrUnit(text: string): boolean {
  return /\d/.test(text) || /px|kb|mb|gb|min|sec|hour|day|week|month|year/i.test(text);
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  return [...new Set(words)].slice(0, 5);
}

function buildMetadata(nuggets: EvidenceNugget[]) {
  const themesCovered = [...new Set(nuggets.map(n => n.theme))];
  const confidences = nuggets.map(n => n.confidence);
  const minConfidence: 'high' | 'medium' | 'low' =
    confidences.includes('low') ? 'low' :
    confidences.includes('medium') ? 'medium' : 'high';

  return {
    totalNuggets: nuggets.length,
    themesCovered,
    hasModelClaims: false,
    hasExamples: false,
    minConfidence,
  };
}

function mapSources(rawSources: RawEvidence['sources']) {
  if (!rawSources) return {};

  // Helper to normalize single string or array to array
  const toArray = (val: string | string[] | undefined): string[] => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  // Helper to clean single URL from string or array
  const cleanSingle = (val: string | string[] | undefined): string | undefined => {
    if (!val) return undefined;
    const arr = toArray(val);
    if (arr.length === 0) return undefined;
    return cleanUrl(arr[0]);
  };

  return {
    pricing: cleanSingle(rawSources.pricing),
    features: cleanSingle(rawSources.featuresIndex),
    help: cleanSingle(rawSources.help),
    faq: cleanSingle(rawSources.faq),
    terms: cleanSingle(rawSources.terms),
    docs: cleanSingle(rawSources.help),
    examples: [],
  };
}

function mapToEvidenceTheme(rawTheme: string): EvidenceTheme {
  const themeMap: Record<string, EvidenceTheme> = {
    'privacy': 'security',
    'limits': 'usage',
    'export': 'export',
    'formats': 'export',
    'workflow': 'workflow',
    'editing': 'editing',
    'stock': 'stock',
    'voice': 'voice',
    'avatar': 'avatar',
    'team': 'team',
    'licensing': 'licensing',
    'models': 'models',
    'integrations': 'integrations',
    'support': 'support',
    'general': 'general',
    'usage': 'usage',
    'security': 'security',
    // invideo custom themes
    'commercial': 'licensing',
    'features': 'general',
    'other': 'general',
    'terms': 'licensing',
    // veed-io custom themes
    'controls': 'editing',
    'inputs': 'general',
    'watermark': 'export',
  };
  return themeMap[rawTheme?.toLowerCase()] || 'general';
}

// =============================================================================
// Main Normalization Function
// =============================================================================

/**
 * Convert heygen hardFacts to RawNugget format
 */
function convertHardFactsToNuggets(hardFacts: RawHardFact[]): RawNugget[] {
  return hardFacts.map(fact => {
    const firstSource = fact.sources?.[0];
    return {
      text: fact.value,
      theme: 'general',  // hardFacts 不带 theme，默认 general
      sourceUrl: firstSource?.url || '',
      sourceType: firstSource?.type || 'faq',
      capturedAt: '',
      confidence: 'high' as const,
    };
  });
}

/**
 * Convert zebracat pageEvidence to RawNugget format
 */
function convertPageEvidenceToNuggets(pageEvidence: RawEvidence['pageEvidence']): RawNugget[] {
  if (!pageEvidence || !Array.isArray(pageEvidence)) return [];
  
  const allNuggets: RawNugget[] = [];
  for (const page of pageEvidence) {
    if (page.nuggets && Array.isArray(page.nuggets)) {
      allNuggets.push(...page.nuggets);
    }
  }
  return allNuggets;
}

/**
 * Normalize raw evidence data with centralized cleaning pipeline
 */
export function normalizeEvidence(raw: RawEvidence, slug: string): EvidenceNormalized {
  // Handle heygen format: tool -> slug, collectedAt -> lastUpdated
  const effectiveSlug = raw.slug || raw.tool || raw.linkIndex?.slug || slug;
  const effectiveLastUpdated = raw.lastUpdated || raw.collectedAt || raw.linkIndex?.capturedAt || new Date().toISOString();

  // Support multiple formats:
  // 1. nuggets array (fliki, heygen standard)
  // 2. hardFacts array (heygen)
  // 3. pageEvidence array (zebracat)
  const rawNuggets = raw.nuggets || raw.hardFacts
    ? convertHardFactsToNuggets(raw.hardFacts || [])
    : raw.pageEvidence
      ? convertPageEvidenceToNuggets(raw.pageEvidence)
      : [];

  // Support sources from both standard format and zebracat linkIndex
  const rawSources = raw.sources || {};
  // If zebracat has featureUrls in linkIndex, add to sources
  if (raw.linkIndex?.featureUrls && Array.isArray(raw.linkIndex.featureUrls)) {
    rawSources.featuresIndex = raw.linkIndex.featureUrls[0];
  }

  // Step 1-2: URL cleaning is applied during field extraction
  // Step 3: Price filtering
  const nonPriceNuggets = rawNuggets.filter(n => {
    const cleanText = cleanUrl(n.text);
    return !isPriceRelated(cleanText);
  });

  // Transform nuggets
  const nuggets: InternalNugget[] = nonPriceNuggets
    .map((rawNugget): InternalNugget | null => {
      const cleanText = cleanUrl(rawNugget.text);
      if (!cleanText || !cleanText.trim()) return null;

      const sourceUrl = cleanUrlsInValue(rawNugget.sourceUrl || rawNugget.pageUrl) as string | undefined;

      return {
        text: cleanText.trim(),
        theme: mapToEvidenceTheme(rawNugget.theme),
        sourceUrl: sourceUrl || '',
        sourceType: rawNugget.sourceType || 'help',
        capturedAt: rawNugget.capturedAt || effectiveLastUpdated,
        confidence: (rawNugget.confidence as 'high' | 'medium' | 'low') || 'high',
        hasNumber: hasNumberOrUnit(cleanText),
        keywords: extractKeywords(cleanText),
        note: rawNugget.note,
        conflictGroup: rawNugget.conflictGroup,
      };
    })
    .filter((n): n is InternalNugget => n !== null);

  // Step 4: Deduplication & Step 5: Conflict resolution
  const dedupedNuggets = resolveConflicts(nuggets);

  // Step 6: Field completion (metadata)
  return {
    slug: effectiveSlug,
    lastUpdated: effectiveLastUpdated,
    sources: mapSources(raw.sources),
    nuggets: dedupedNuggets,
    metadata: buildMetadata(dedupedNuggets),
  };
}

/**
 * Get empty evidence for error cases
 */
export function getEmptyEvidence(slug: string): EvidenceNormalized {
  return {
    slug,
    lastUpdated: new Date().toISOString(),
    sources: {},
    nuggets: [],
    metadata: {
      totalNuggets: 0,
      themesCovered: [],
      hasModelClaims: false,
      hasExamples: false,
      minConfidence: 'high',
    },
  };
}

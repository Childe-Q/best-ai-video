import fs from 'fs';
import path from 'path';
import { getAllTools, getToolBySlug } from '@/lib/toolData';
import { getCurrentMonthYear, getSEOCurrentYear } from '@/lib/utils';
import { generateSmartFAQs } from '@/lib/generateSmartFAQs';
import { canonicalAlternativesConfigs } from '@/data/alternatives/canonical';
import { alternativesEvidence, ToolAlternativeEvidence } from '@/data/evidence/alternatives';
import { mergeCanonicalAndEvidence } from '@/lib/alternatives/mergeCanonicalAndEvidence';
import { getEvidenceSources } from '@/lib/evidence/readEvidence';
import { mapToolNameToSlug } from '@/lib/alternatives/mapToolNameToSlug';
import { fillLongformFromScraped } from '@/lib/alternatives/fillLongformFromScraped';
import { AlternativeGroup } from '@/components/alternatives/types';
import { AlternativeGroupWithEvidence } from '@/types/alternatives';
import {
  AlternativesComparisonRow,
  AlternativesDeepDive,
  AlternativesFaq,
  AlternativesTemplateData,
  TopicAlternativesData,
} from '@/types/alternativesLongform';
import { Tool } from '@/types/tool';

const DEFAULT_DECISION_CRITERIA = [
  'Can you control cost predictably when you regenerate clips and edits?',
  'How consistent is output quality across different prompts and styles?',
  'How fast is script-to-video workflow when your team ships every week?',
  'How much editing control do you get after AI generation?',
  'Are commercial rights and licensing terms clear for client work?',
  'What happens when exports fail in browser workflows and retries are needed?',
];

const INVIDEO_REFERENCE_SIGNALS = [
  'https://www.arcade.software/post/invideo-ai-alternatives',
  'https://www.g2.com/products/invideo/competitors/alternatives',
  'https://www.capterra.com/p/180680/InVideo/alternatives/',
];

const ARCADE_INVIDEO_REFERENCE_TOOLS = [
  'Arcade',
  'Sora',
  'Pictory',
  'Runway ML',
  'Kling AI',
  'Synthesia',
  'VEED',
  'Canva',
];

const ARCADE_INVIDEO_ALIAS_RULES: Record<string, string> = {
  'runway ml': 'runway',
  veed: 'veed-io',
  'veed.io': 'veed-io',
};

const FEATURED_POOL_CANONICAL = ['fliki', 'heygen', 'invideo', 'veed-io', 'zebracat', 'synthesia'];
const FEATURED_POOL_ALIAS_TO_CANONICAL: Record<string, string> = {
  'in-video': 'invideo',
  'invideo ai': 'invideo',
  'hey-gen': 'heygen',
  'fliki ai': 'fliki',
  veed: 'veed-io',
  'veed.io': 'veed-io',
  veedio: 'veed-io',
  'zebra-cat': 'zebracat',
};
const CORE_ANCHOR_SLUGS = ['fliki', 'heygen', 'invideo'];

const FEATURED_MIN_PER_PAGE = 1;
const FEATURED_MAX_PER_PAGE = 2;
const TOP6_FEATURED_MAX = 1;
// First pass: diversify the raw candidate queue while still respecting upstream relevance order.
const DIVERSITY_WEIGHT = 0.42;
// Second pass: only a light re-order after featured injection, to keep injected picks natural.
const POST_FEATURED_DIVERSITY_WEIGHT = 0.28;
// Soft penalty reduces repeated "same top pick everywhere" behavior without banning tools.
const POPULARITY_PENALTY_BY_SLUG: Record<string, number> = {
  pictory: 0.1,
  canva: 0.05,
};
const DIVERSITY_TOKEN_STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'into',
  'this',
  'that',
  'best',
  'video',
  'videos',
  'tool',
  'tools',
  'ai',
]);
const INTENT_ORDER = ['avatar', 'editor', 'text_to_video', 'repurpose', 'cinematic', 'general'] as const;
type Intent = typeof INTENT_ORDER[number];
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  avatar: ['avatar', 'presenter', 'talking', 'spokesperson', 'lip', 'voice', 'dubbing', 'localization', 'translation'],
  editor: ['editor', 'editing', 'timeline', 'trim', 'subtitle', 'caption', 'cut', 'post', 'compose'],
  text_to_video: ['text', 'prompt', 'script', 'blog', 'tts', 'narration', 'text-to-video', 'storyboard'],
  repurpose: ['repurpose', 'social', 'short', 'clip', 'viral', 'snippet', 'reel', 'youtube shorts'],
  cinematic: ['cinematic', 'scene', 'film', 'camera', 'motion', 'shot', 'gen-3', 'gen-4', 'realism'],
  general: [],
};
const INTENT_ADJACENCY: Record<Intent, Intent[]> = {
  avatar: ['text_to_video', 'repurpose'],
  editor: ['repurpose', 'text_to_video', 'cinematic'],
  text_to_video: ['repurpose', 'cinematic', 'avatar'],
  repurpose: ['editor', 'text_to_video', 'avatar'],
  cinematic: ['text_to_video', 'editor'],
  general: ['text_to_video', 'repurpose', 'editor', 'avatar', 'cinematic'],
};

const LOCAL_IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'svg'];
const BASELINE_REPORT_PATH = path.join(process.cwd(), '_audit', 'alternatives-sort', 'report.json');
let baselineFeaturedCountCache: Map<string, number> | null | undefined;
const PLACEHOLDER_PATTERNS = [
  /\btbd\b/i,
  /\bverify\b/i,
  /\bneed(?:s)? verification\b/i,
  /export\/download documentation needs verification/i,
];

type DossierSourceMap = Map<string, string[]>;

type LongformToolCard = {
  slug: string;
  name: string;
  logoUrl: string;
  bestFor: string[];
  pickThisIf?: string;
  extraReason?: string;
  limitations?: string;
  pricingSignals: {
    freePlan?: string;
    watermark?: string;
    exportQuality?: string;
    refundCancel?: string;
  };
  startingPrice: string;
  affiliateLink?: string;
  groupId: string;
  groupTitle: string;
  groupDescription: string;
};

type ArcadeIntersectionResult = {
  keepSlugs: Set<string>;
  intersected: Array<{ name: string; slug: string; matchedArcadeName: string }>;
  missingFromSite: string[];
  aliasRules: Record<string, string>;
};

type TopPickItem = {
  toolName: string;
  toolSlug?: string;
  href: string;
};

function cleanText(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\[NEED VERIFICATION.*?\]/gi, '').trim();
  return normalized.length > 0 ? normalized : null;
}

function containsPlaceholderText(value?: string | null): boolean {
  const cleaned = cleanText(value);
  if (!cleaned) return false;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(cleaned));
}

function sanitizeSentence(value?: string | null): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  if (containsPlaceholderText(cleaned)) return null;

  const repeatedLabel = cleaned.match(/^([^:]{2,40}):\s*(.+?)\.?$/);
  if (repeatedLabel) {
    const label = repeatedLabel[1].trim().toLowerCase();
    const body = repeatedLabel[2].trim().toLowerCase();
    if (label === body) return null;
  }

  return cleaned;
}

function sanitizeSentenceList(values: Array<string | null | undefined>): string[] {
  return uniqueStrings(
    values
      .map((value) => sanitizeSentence(value))
      .filter((value): value is string => Boolean(value))
  );
}

function hasLearningContext(values: Array<string | null | undefined>): boolean {
  const text = values
    .map((item) => cleanText(item || '') || '')
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /\bl\s*&\s*d\b|learning|training|instructional|onboarding|enablement|corporate training|internal comms/.test(text);
}

function sanitizeLabel(text?: string | null, contextHints: Array<string | null | undefined> = []): string | null {
  const cleaned = cleanText(text);
  if (!cleaned) return null;

  const normalized = cleaned.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;

  const hasLndContext = hasLearningContext([normalized, ...contextHints]);
  if (/^l$/i.test(normalized) && hasLndContext) return 'L&D Teams';
  if (/^d$/i.test(normalized) && hasLndContext) return 'L&D Teams';
  if (/^d\s*teams?$/i.test(normalized) && hasLndContext) return 'L&D Teams';
  if (/^l\s*&\s*d(?:\s+teams?)?$/i.test(normalized)) return 'L&D Teams';

  if (/^[a-z]$/i.test(normalized)) return null;
  if (normalized.length < 3) return null;
  if (/^[^a-z0-9]+$/i.test(normalized)) return null;

  return normalized;
}

function sanitizeLabelList(values: Array<string | null | undefined>, contextHints: Array<string | null | undefined> = []): string[] {
  return uniqueStrings(
    values
      .map((value) => sanitizeLabel(value, contextHints))
      .filter((value): value is string => Boolean(value))
  );
}

function inferBestForFromTool(tool?: Tool): string {
  if (!tool) return 'General AI video workflows';
  const direct = sanitizeLabel(tool.best_for, [
    ...(tool.tags || []),
    ...(tool.categories || []),
    ...(tool.features || []),
    ...(tool.pros || []),
  ]);
  if (direct) return direct;

  const hint = [
    ...(tool.tags || []),
    ...(tool.categories || []),
    ...(tool.features || []),
  ].join(' ').toLowerCase();
  if (/training|learning|l&d|onboarding|internal/.test(hint)) return 'Training & Internal Comms';
  if (/avatar|presenter|talking|lip/.test(hint)) return 'AI Avatars';
  if (/editor|editing|timeline|subtitle|caption/.test(hint)) return 'Video editing control';
  if (/repurpose|social|short|clip/.test(hint)) return 'Content repurposing';
  return 'General AI video workflows';
}

function sanitizeDeepDiveLabels(item: AlternativesDeepDive, tool?: Tool): AlternativesDeepDive {
  const baseHints = [
    item.toolName,
    item.bestFor,
    ...(item.strengths || []),
    ...(item.tradeoffs || []),
    tool?.best_for || '',
    ...(tool?.tags || []),
    ...(tool?.categories || []),
    ...(tool?.features || []),
  ];
  const sanitizedBestFor = sanitizeLabel(item.bestFor, baseHints) || inferBestForFromTool(tool);
  const sanitizeNarrativeLine = (line: string): string | null => {
    const cleaned = sanitizeSentence(line);
    if (!cleaned) return null;
    const strongFitMatch = cleaned.match(/^(strong fit for|built for)\s+(.+?)([.!])?$/i);
    if (!strongFitMatch) return cleaned;
    const prefix = /built for/i.test(strongFitMatch[1]) ? 'Built for' : 'Strong fit for';
    const label = sanitizeLabel(strongFitMatch[2], [sanitizedBestFor, ...baseHints]);
    if (!label) return null;
    return `${prefix} ${label}.`;
  };

  const sanitizedStrengths = uniqueStrings(
    (item.strengths || [])
      .map((line) => sanitizeNarrativeLine(line))
      .filter((line): line is string => Boolean(line))
  ).slice(0, 3);
  const finalStrengths = sanitizedStrengths.length > 0 ? sanitizedStrengths : [`Strong fit for ${sanitizedBestFor}.`];
  const finalTradeoffs = sanitizeSentenceList(item.tradeoffs || []).slice(0, 2);

  const next: AlternativesDeepDive & { knownFor?: string | null; audience?: string | null } = {
    ...item,
    bestFor: sanitizedBestFor,
    strengths: finalStrengths,
    tradeoffs: finalTradeoffs.length > 0 ? finalTradeoffs : ['Trade-offs vary by workflow and team setup.'],
    pricingStarting: sanitizeSentence(item.pricingStarting) || 'Pricing varies by plan.',
  };

  const itemAny = item as any;
  if (Object.prototype.hasOwnProperty.call(itemAny, 'knownFor')) {
    next.knownFor = sanitizeLabel(itemAny.knownFor, [sanitizedBestFor, ...baseHints]);
  }
  if (Object.prototype.hasOwnProperty.call(itemAny, 'audience')) {
    next.audience = sanitizeLabel(itemAny.audience, [sanitizedBestFor, ...baseHints]);
  }

  return next;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function normalizeToolKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeSlugKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function toFeaturedCanonicalSlug(slug: string): string {
  const normalized = normalizeSlugKey(slug);
  return FEATURED_POOL_ALIAS_TO_CANONICAL[normalized] || normalized;
}

function isFeaturedSlug(slug?: string): boolean {
  if (!slug) return false;
  return FEATURED_POOL_CANONICAL.includes(toFeaturedCanonicalSlug(slug));
}

function uniqueDeepDiveKey(item: AlternativesDeepDive): string {
  if (item.toolSlug) return `slug:${item.toolSlug}`;
  return `name:${item.toolName.toLowerCase()}`;
}

function uniqueTopPickKey(item: TopPickItem): string {
  if (item.toolSlug) return `slug:${item.toolSlug}`;
  return `name:${item.toolName.toLowerCase()}`;
}

function formatToolNameList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function countOverlap(a: string[], b: string[]): number {
  const bSet = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => bSet.has(item.toLowerCase())).length;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function loadBaselineFeaturedCountCache(): Map<string, number> | null {
  if (baselineFeaturedCountCache !== undefined) return baselineFeaturedCountCache;

  if (!fs.existsSync(BASELINE_REPORT_PATH)) {
    baselineFeaturedCountCache = null;
    return baselineFeaturedCountCache;
  }

  try {
    const raw = fs.readFileSync(BASELINE_REPORT_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.pages) ? parsed.pages : []);
    const result = new Map<string, number>();

    for (const item of items) {
      const slug = normalizeSlugKey(String(item?.slug || ''));
      if (!slug) continue;
      const fromDeepDives = Array.isArray(item?.deepDives) ? item.deepDives : [];
      const fromTopPicks = Array.isArray(item?.topPicks) ? item.topPicks : [];
      const baselineSlugs = uniqueSlugSequence(
        [...fromDeepDives, ...fromTopPicks]
          .map((candidate: unknown) => normalizeSlugKey(String(candidate || '')))
          .filter((candidate: string) => Boolean(candidate))
      ).slice(0, 6);

      const featuredCount = baselineSlugs.filter((candidate) => isFeaturedSlug(candidate)).length;
      result.set(slug, featuredCount);
    }

    baselineFeaturedCountCache = result;
  } catch {
    baselineFeaturedCountCache = null;
  }

  return baselineFeaturedCountCache;
}

function getBaselineFeaturedCount(baseSlug: string): number | null {
  const cache = loadBaselineFeaturedCountCache();
  if (!cache) return null;
  const normalized = normalizeSlugKey(baseSlug);
  if (!normalized) return null;
  return cache.has(normalized) ? (cache.get(normalized) as number) : null;
}

function tieBreakScore(baseToolSlug: string, candidateSlug: string): number {
  // Deterministic per-page tie-break avoids cross-page identical ordering without randomness.
  return stableHash(`${baseToolSlug}:${candidateSlug}`) / 4294967295;
}

function tokenizeForDiversity(values: string[]): string[] {
  const rawTokens = values
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !DIVERSITY_TOKEN_STOPWORDS.has(token));

  return uniqueStrings(rawTokens);
}

function getIntentScores(values: string[]): Map<Intent, number> {
  const scores = new Map<Intent, number>(INTENT_ORDER.map((intent) => [intent, 0]));
  const normalized = values.join(' ').toLowerCase();

  for (const intent of INTENT_ORDER) {
    if (intent === 'general') continue;
    const keywords = INTENT_KEYWORDS[intent];
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        scores.set(intent, (scores.get(intent) || 0) + 1);
      }
    }
  }

  return scores;
}

function getIntentProfile({
  tool,
  deepDive,
  baseToolSlugForTieBreak,
}: {
  tool?: Tool;
  deepDive?: AlternativesDeepDive;
  baseToolSlugForTieBreak: string;
}): { primary: Intent; intents: Set<Intent> } {
  const values = [
    tool?.best_for || '',
    tool?.tagline || '',
    tool?.short_description || '',
    ...(tool?.tags || []),
    ...(tool?.categories || []),
    ...(tool?.features || []),
    deepDive?.bestFor || '',
    ...(deepDive?.strengths || []),
    ...(deepDive?.tradeoffs || []),
  ];
  const scores = getIntentScores(values);
  const maxScore = Math.max(...INTENT_ORDER.filter((intent) => intent !== 'general').map((intent) => scores.get(intent) || 0));

  if (maxScore <= 0) {
    return { primary: 'general', intents: new Set<Intent>(['general']) };
  }

  const ranked = INTENT_ORDER
    .filter((intent) => intent !== 'general')
    .map((intent) => ({
      intent,
      score: scores.get(intent) || 0,
      tieBreak: tieBreakScore(baseToolSlugForTieBreak, `${tool?.slug || deepDive?.toolSlug || 'unknown'}:${intent}`),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.tieBreak - a.tieBreak;
    });

  const primary = (ranked[0]?.intent || 'general') as Intent;
  const intents = new Set<Intent>(
    ranked
      .filter((item) => item.score >= Math.max(1, maxScore - 1))
      .map((item) => item.intent as Intent)
  );

  if (intents.size === 0) intents.add(primary);
  return { primary, intents };
}

function getPrimaryIntent(baseTool: Tool): Intent {
  return getIntentProfile({ tool: baseTool, baseToolSlugForTieBreak: baseTool.slug }).primary;
}

function buildIntentBuckets({
  candidates,
  baseIntent,
  deepDiveBySlug,
  toolsBySlug,
  baseToolSlug,
}: {
  candidates: string[];
  baseIntent: Intent;
  deepDiveBySlug: Map<string, AlternativesDeepDive>;
  toolsBySlug: Map<string, Tool>;
  baseToolSlug: string;
}): { sameIntent: string[]; adjacentIntent: string[]; other: string[] } {
  const adjacentSet = new Set(INTENT_ADJACENCY[baseIntent] || []);
  const sameIntent: string[] = [];
  const adjacentIntent: string[] = [];
  const other: string[] = [];

  uniqueSlugSequence(candidates)
    .filter((slug) => slug !== normalizeSlugKey(baseToolSlug))
    .forEach((slug) => {
      const deepDive = deepDiveBySlug.get(slug);
      const tool = toolsBySlug.get(slug);
      const profile = getIntentProfile({
        tool,
        deepDive,
        baseToolSlugForTieBreak: baseToolSlug,
      });

      if (profile.intents.has(baseIntent)) {
        sameIntent.push(slug);
        return;
      }

      if ([...profile.intents].some((intent) => adjacentSet.has(intent))) {
        adjacentIntent.push(slug);
        return;
      }

      other.push(slug);
    });

  return { sameIntent, adjacentIntent, other };
}

function applyIntentGating({
  candidates,
  baseIntent,
  deepDiveBySlug,
  toolsBySlug,
  baseToolSlug,
}: {
  candidates: string[];
  baseIntent: Intent;
  deepDiveBySlug: Map<string, AlternativesDeepDive>;
  toolsBySlug: Map<string, Tool>;
  baseToolSlug: string;
}): string[] {
  const buckets = buildIntentBuckets({
    candidates,
    baseIntent,
    deepDiveBySlug,
    toolsBySlug,
    baseToolSlug,
  });

  const sameSet = new Set(buckets.sameIntent);
  const adjacentSet = new Set(buckets.adjacentIntent);
  const gated = [...buckets.sameIntent, ...buckets.adjacentIntent, ...buckets.other];

  if (buckets.sameIntent.length > 0) {
    for (let slot = 0; slot < Math.min(3, buckets.sameIntent.length); slot += 1) {
      if (sameSet.has(gated[slot])) continue;
      const sameIndex = gated.findIndex((slug, index) => index > slot && sameSet.has(slug));
      if (sameIndex >= 0) {
        const [moved] = gated.splice(sameIndex, 1);
        gated.splice(slot, 0, moved);
      }
    }
  } else if (buckets.adjacentIntent.length > 0 && !adjacentSet.has(gated[0])) {
    const adjacentIndex = gated.findIndex((slug) => adjacentSet.has(slug));
    if (adjacentIndex >= 0) {
      const [moved] = gated.splice(adjacentIndex, 1);
      gated.unshift(moved);
    }
  }

  return gated;
}

type DiversityLandscapeStats = {
  totalPages: number;
  pagesByIntent: Map<Intent, number>;
  exposureBySlug: Map<string, { appearances: number; rank1: number }>;
  positionFrequencyByIntent: Map<Intent, Map<number, Map<string, number>>>;
  signaturesByIntent: Map<Intent, string[][]>;
};

let cachedDiversityLandscapeStats: DiversityLandscapeStats | null = null;

function getDiversityLandscapeStats(): DiversityLandscapeStats {
  if (cachedDiversityLandscapeStats) return cachedDiversityLandscapeStats;

  const tools = getAllTools();
  const pagesByIntent = new Map<Intent, number>();
  const exposureBySlug = new Map<string, { appearances: number; rank1: number }>();
  const positionFrequencyByIntent = new Map<Intent, Map<number, Map<string, number>>>();
  const signaturesByIntent = new Map<Intent, string[][]>();

  for (const baseTool of tools) {
    const baseIntent = getPrimaryIntent(baseTool);
    pagesByIntent.set(baseIntent, (pagesByIntent.get(baseIntent) || 0) + 1);
    if (!signaturesByIntent.has(baseIntent)) signaturesByIntent.set(baseIntent, []);
    if (!positionFrequencyByIntent.has(baseIntent)) positionFrequencyByIntent.set(baseIntent, new Map());

    const baseTags = baseTool.tags || [];
    const baseCategories = baseTool.categories || [];
    const candidateScores = tools
      .filter((candidate) => candidate.slug !== baseTool.slug)
      .map((candidate) => {
        const profile = getIntentProfile({
          tool: candidate,
          baseToolSlugForTieBreak: baseTool.slug,
        });
        const intentScore = profile.intents.has(baseIntent)
          ? 1
          : ([...profile.intents].some((intent) => (INTENT_ADJACENCY[baseIntent] || []).includes(intent)) ? 0.65 : 0.2);
        const overlapScore = (countOverlap(baseTags, candidate.tags || []) * 0.1) + (countOverlap(baseCategories, candidate.categories || []) * 0.08);
        const score = intentScore + overlapScore + (tieBreakScore(baseTool.slug, candidate.slug) * 0.05);
        return { slug: candidate.slug, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.slug);

    signaturesByIntent.get(baseIntent)!.push(candidateScores);
    candidateScores.forEach((slug, index) => {
      const exposure = exposureBySlug.get(slug) || { appearances: 0, rank1: 0 };
      exposure.appearances += 1;
      if (index === 0) exposure.rank1 += 1;
      exposureBySlug.set(slug, exposure);

      const intentPositionMap = positionFrequencyByIntent.get(baseIntent)!;
      if (!intentPositionMap.has(index)) intentPositionMap.set(index, new Map());
      const positionMap = intentPositionMap.get(index)!;
      positionMap.set(slug, (positionMap.get(slug) || 0) + 1);
    });
  }

  cachedDiversityLandscapeStats = {
    totalPages: tools.length,
    pagesByIntent,
    exposureBySlug,
    positionFrequencyByIntent,
    signaturesByIntent,
  };
  return cachedDiversityLandscapeStats;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

type DiversityCandidateProfile = {
  slug: string;
  baseScore: number;
  overlapScore: number;
  indexScore: number;
  overlapTrace: 'tags' | 'categories' | 'missing';
  tokens: Set<string>;
  overexposurePenalty: number;
  tieBreak: number;
};

function buildDiversityCandidateProfiles({
  orderedSlugs,
  deepDiveBySlug,
  toolsBySlug,
  baseToolSlug,
  baseIntent,
  landscapeStats,
}: {
  orderedSlugs: string[];
  deepDiveBySlug: Map<string, AlternativesDeepDive>;
  toolsBySlug: Map<string, Tool>;
  baseToolSlug: string;
  baseIntent: Intent;
  landscapeStats: DiversityLandscapeStats;
}): DiversityCandidateProfile[] {
  const normalizedBase = normalizeSlugKey(baseToolSlug);
  const uniqueSlugs = uniqueSlugSequence(orderedSlugs).filter((slug) => slug !== normalizedBase);
  const denominator = Math.max(1, uniqueSlugs.length - 1);
  const intentPageCount = Math.max(1, landscapeStats.pagesByIntent.get(baseIntent) || landscapeStats.totalPages);
  const baseTool = toolsBySlug.get(normalizedBase);
  const baseTags = (baseTool?.tags || []).map((tag) => normalizeToolKey(tag));
  const baseCategories = (baseTool?.categories || []).map((category) => normalizeToolKey(category));
  const baseTagSet = new Set(baseTags);
  const baseCategorySet = new Set(baseCategories);

  return uniqueSlugs
    .map((slug, index) => {
      const deepDive = deepDiveBySlug.get(slug);
      const tool = toolsBySlug.get(slug);
      if (!deepDive && !tool) return null;

      const candidateTags = (tool?.tags || []).map((tag) => normalizeToolKey(tag));
      const candidateCategories = (tool?.categories || []).map((category) => normalizeToolKey(category));
      const candidateTagSet = new Set(candidateTags);
      const candidateCategorySet = new Set(candidateCategories);

      const jaccard = (a: Set<string>, b: Set<string>) => {
        if (a.size === 0 || b.size === 0) return 0;
        let intersection = 0;
        for (const token of a) {
          if (b.has(token)) intersection += 1;
        }
        const union = a.size + b.size - intersection;
        return union > 0 ? intersection / union : 0;
      };

      const useTagOverlap = baseTagSet.size > 0 && candidateTagSet.size > 0;
      const useCategoryOverlap = !useTagOverlap && baseCategorySet.size > 0 && candidateCategorySet.size > 0;
      const overlapScore = useTagOverlap
        ? jaccard(baseTagSet, candidateTagSet)
        : (useCategoryOverlap ? jaccard(baseCategorySet, candidateCategorySet) : 0);
      const indexScore = 1 - index / denominator;
      // Weaken "raw index lock-in": relevance to base tool intent via overlap dominates.
      let baseScore = (0.65 * overlapScore) + (0.35 * indexScore);
      baseScore += tieBreakScore(baseToolSlug, slug) * 0.05;

      const tokenSource = tokenizeForDiversity([
        deepDive?.bestFor || '',
        ...(deepDive?.strengths || []),
        ...(deepDive?.tradeoffs || []),
        tool?.best_for || '',
        ...(tool?.tags || []),
        ...(tool?.categories || []),
        ...(tool?.features || []),
      ]);

      return {
        slug,
        baseScore,
        overlapScore,
        indexScore,
        overlapTrace: useTagOverlap ? 'tags' : (useCategoryOverlap ? 'categories' : 'missing'),
        tokens: new Set(tokenSource),
        overexposurePenalty: (() => {
          const globalExposure = landscapeStats.exposureBySlug.get(slug) || { appearances: 0, rank1: 0 };
          const exposurePenalty = (globalExposure.appearances / intentPageCount) * 0.08;
          const rank1Penalty = (globalExposure.rank1 / intentPageCount) * 0.12;
          return exposurePenalty + rank1Penalty + (POPULARITY_PENALTY_BY_SLUG[slug] || 0);
        })(),
        tieBreak: tieBreakScore(baseToolSlug, slug),
      };
    })
    .filter((item): item is DiversityCandidateProfile => Boolean(item));
}

function rerankTopPicksWithDiversity({
  orderedSlugs,
  deepDiveBySlug,
  toolsBySlug,
  baseToolSlug,
  baseIntent,
  limit,
  diversityWeight,
  keepFirst = false,
  sameIntentSet,
  requiredSameIntentInTop = 0,
  auditTraceBySlug,
}: {
  orderedSlugs: string[];
  deepDiveBySlug: Map<string, AlternativesDeepDive>;
  toolsBySlug: Map<string, Tool>;
  baseToolSlug: string;
  baseIntent: Intent;
  limit: number;
  diversityWeight: number;
  keepFirst?: boolean;
  sameIntentSet?: Set<string>;
  requiredSameIntentInTop?: number;
  auditTraceBySlug?: Record<string, { overlapScore: number; indexScore: number; overlapTrace: string; baseScore: number }>;
}): string[] {
  const landscapeStats = getDiversityLandscapeStats();
  const profiles = buildDiversityCandidateProfiles({
    orderedSlugs,
    deepDiveBySlug,
    toolsBySlug,
    baseToolSlug,
    baseIntent,
    landscapeStats,
  });
  if (profiles.length <= 1) {
    return profiles.slice(0, limit).map((item) => item.slug);
  }
  if (auditTraceBySlug) {
    profiles.forEach((profile) => {
      auditTraceBySlug[profile.slug] = {
        overlapScore: profile.overlapScore,
        indexScore: profile.indexScore,
        overlapTrace: profile.overlapTrace,
        baseScore: profile.baseScore,
      };
    });
  }

  const selected: DiversityCandidateProfile[] = [];
  const remaining = [...profiles];

  if (keepFirst) {
    selected.push(remaining.shift() as DiversityCandidateProfile);
  }

  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    const selectedSameCount = sameIntentSet
      ? selected.filter((item) => sameIntentSet.has(item.slug)).length
      : 0;
    const requiresSameIntent = Boolean(
      sameIntentSet
      && selected.length < requiredSameIntentInTop
      && selectedSameCount < requiredSameIntentInTop
    );
    const evaluationIndexes = requiresSameIntent
      ? remaining
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => sameIntentSet!.has(item.slug))
          .map(({ index }) => index)
      : remaining.map((_, index) => index);
    const candidateIndexes = evaluationIndexes.length > 0 ? evaluationIndexes : remaining.map((_, index) => index);

    for (const i of candidateIndexes) {
      const candidate = remaining[i];
      // MMR-style objective: keep high relevance but penalize similarity to already selected tools.
      const maxSimilarity = selected.length
        ? Math.max(...selected.map((selectedItem) => jaccardSimilarity(candidate.tokens, selectedItem.tokens)))
        : 0;
      const positionPenalty = (() => {
        const positionMap = landscapeStats.positionFrequencyByIntent.get(baseIntent)?.get(selected.length);
        if (!positionMap) return 0;
        const frequency = positionMap.get(candidate.slug) || 0;
        const denom = Math.max(1, landscapeStats.pagesByIntent.get(baseIntent) || landscapeStats.totalPages);
        return (frequency / denom) * 0.08;
      })();
      const duplicateOrderPenalty = (() => {
        const signatures = landscapeStats.signaturesByIntent.get(baseIntent) || [];
        const prospective = [...selected.map((item) => item.slug), candidate.slug];
        if (prospective.length < 5) return 0;
        const hasNearDuplicate = signatures.some(
          (signature) => signature.length >= prospective.length
            && prospective.every((slugAtIndex, idx) => signature[idx] === slugAtIndex)
        );
        return hasNearDuplicate ? 0.12 : 0;
      })();
      const combinedScore = ((1 - diversityWeight) * candidate.baseScore)
        - (diversityWeight * maxSimilarity)
        - candidate.overexposurePenalty
        - positionPenalty
        - duplicateOrderPenalty;

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestIndex = i;
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected.map((item) => item.slug).slice(0, limit);
}

function getFeaturedPreferenceOrder(baseToolSlug: string, candidates: AlternativesDeepDive[]): string[] {
  const normalizedBase = toFeaturedCanonicalSlug(baseToolSlug);
  const candidateText = candidates
    .slice(0, 6)
    .flatMap((item) => [item.bestFor, ...item.strengths])
    .join(' ')
    .toLowerCase();

  let preferred = [...FEATURED_POOL_CANONICAL];

  if (/avatar|presenter|talking|spokesperson|lip-sync/.test(candidateText)) {
    preferred = ['heygen', 'synthesia', 'fliki', 'veed-io', 'zebracat', 'invideo'];
  } else if (/editor|editing|timeline|trim|caption|subtitle|cut|control/.test(candidateText)) {
    preferred = ['veed-io', 'invideo', 'fliki', 'zebracat', 'heygen', 'synthesia'];
  } else if (/text|script|blog|tts|voiceover|narration/.test(candidateText)) {
    preferred = ['fliki', 'invideo', 'zebracat', 'veed-io', 'heygen', 'synthesia'];
  } else if (/repurpose|short|social|clip|viral/.test(candidateText)) {
    preferred = ['zebracat', 'veed-io', 'fliki', 'invideo', 'heygen', 'synthesia'];
  }

  return preferred.filter((slug) => slug !== normalizedBase);
}

function countFeaturedSlugs(slugs: string[], featuredSet: Set<string>): number {
  return slugs.filter((slug) => featuredSet.has(slug)).length;
}

function uniqueSlugSequence(slugs: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of slugs) {
    const slug = normalizeSlugKey(raw);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }
  return result;
}

function capFeaturedInSlugList(slugs: string[], featuredSet: Set<string>, maxFeatured: number): string[] {
  const result: string[] = [];
  let featuredCount = 0;
  for (const slug of slugs) {
    if (featuredSet.has(slug)) {
      if (featuredCount >= maxFeatured) continue;
      featuredCount += 1;
    }
    result.push(slug);
  }
  return result;
}

function trimSlugListToLimit({
  slugs,
  limit,
  featuredSet,
  minFeatured,
}: {
  slugs: string[];
  limit: number;
  featuredSet: Set<string>;
  minFeatured: number;
}): string[] {
  if (slugs.length <= limit) return slugs;

  const result = [...slugs];
  while (result.length > limit) {
    const currentFeatured = countFeaturedSlugs(result, featuredSet);
    let removeIndex = -1;

    for (let i = result.length - 1; i >= 0; i -= 1) {
      const isFeatured = featuredSet.has(result[i]);
      if (!isFeatured || currentFeatured > minFeatured) {
        removeIndex = i;
        break;
      }
    }

    if (removeIndex < 0) {
      removeIndex = result.length - 1;
    }
    result.splice(removeIndex, 1);
  }

  return result;
}

function insertSlugAtPreferredSlot(slugs: string[], slug: string, preferredSlot: number): string[] {
  const next = [...slugs];
  const existingIndex = next.indexOf(slug);
  if (existingIndex >= 0) return next;
  const insertAt = Math.min(preferredSlot, next.length);
  next.splice(insertAt, 0, slug);
  return next;
}

function createFallbackToolDeepDive(toolSlug: string, baseSlug: string, toolsBySlug: Map<string, Tool>): AlternativesDeepDive | null {
  const normalizedSlug = normalizeSlugKey(toolSlug);
  const tool = toolsBySlug.get(normalizedSlug)
    || toolsBySlug.get(toolSlug)
    || [...toolsBySlug.entries()].find(([slug]) => normalizeSlugKey(slug) === normalizedSlug)?.[1];
  if (!tool) return null;
  const normalizedBase = normalizeSlugKey(baseSlug);
  const baseTool = toolsBySlug.get(normalizedBase)
    || toolsBySlug.get(baseSlug)
    || [...toolsBySlug.entries()].find(([slug]) => normalizeSlugKey(slug) === normalizedBase)?.[1];

  const sourceUrls = uniqueStrings([
    ...getEvidenceSources(tool.slug),
    `/tool/${tool.slug}/pricing`,
    `/tool/${tool.slug}/reviews`,
  ]).slice(0, 4);

  const fallbackStrengths = uniqueStrings([
    ...(tool.highlights || []),
    ...(tool.features || []).slice(0, 2),
  ]).slice(0, 3);
  const fallbackTradeoffs = uniqueStrings(tool.cons || []).slice(0, 2);
  const image = resolveLocalDeepDiveImage(tool.slug);
  const imageSourceUrl = pickImageSourceUrl(sourceUrls, `/tool/${tool.slug}`);
  const fallbackBestFor = sanitizeLabel(tool.best_for, [
    ...(tool.tags || []),
    ...(tool.categories || []),
    ...(tool.features || []),
    ...(tool.pros || []),
  ]) || inferBestForFromTool(tool);

  return {
    toolName: tool.name,
    toolSlug: tool.slug,
    logoUrl: tool.logo_url,
    image,
    imageSourceUrl,
    bestFor: fallbackBestFor || `${tool.name} workflows that need a practical ${baseTool?.name || 'alternative'} replacement`,
    strengths: fallbackStrengths.length > 0 ? fallbackStrengths : [
      `${tool.name} is straightforward to onboard for day-to-day video production.`,
      'Built-in templates and guided workflows help teams publish faster.',
    ],
    tradeoffs: fallbackTradeoffs.length > 0 ? fallbackTradeoffs : [
      'Feature depth and output consistency can vary by workflow and plan.',
    ],
    pricingStarting: cleanText(tool.starting_price) || 'Pricing varies by plan and usage.',
    ctaHref: tool.affiliate_link || `/tool/${tool.slug}`,
    ctaLabel: 'Try now',
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : [`/tool/${tool.slug}/pricing`],
  };
}

function createFallbackFeaturedDeepDive(featuredSlug: string, baseSlug: string, toolsBySlug: Map<string, Tool>): AlternativesDeepDive | null {
  return createFallbackToolDeepDive(featuredSlug, baseSlug, toolsBySlug);
}

function ensureFeaturedCountForPage({
  baseSlug,
  topPickSlugs,
  deepDiveSlugs,
  allToolIndexOrAllToolsList,
  featuredPool,
  featuredCapPool,
  preferenceOrderFn,
  targetFeaturedMax = 2,
}: {
  baseSlug: string;
  topPickSlugs: string[];
  deepDiveSlugs: string[];
  allToolIndexOrAllToolsList: Map<string, Tool> | Tool[];
  featuredPool: string[];
  featuredCapPool?: string[];
  preferenceOrderFn: (baseSlug: string) => string[];
  targetFeaturedMax?: number;
}): { topPickSlugs: string[]; deepDiveSlugs: string[]; injectedDeepDiveItems: AlternativesDeepDive[] } {
  const toolIndex = Array.isArray(allToolIndexOrAllToolsList)
    ? new Map(allToolIndexOrAllToolsList.map((tool) => [tool.slug, tool]))
    : allToolIndexOrAllToolsList;
  const normalizedBase = toFeaturedCanonicalSlug(baseSlug);

  const availableFeatured = uniqueSlugSequence(
    featuredPool
      .map((slug) => toFeaturedCanonicalSlug(slug))
      .filter((slug) => slug !== normalizedBase && toolIndex.has(slug))
  );
  const capFeatured = uniqueSlugSequence(
    (featuredCapPool && featuredCapPool.length > 0 ? featuredCapPool : featuredPool)
      .map((slug) => toFeaturedCanonicalSlug(slug))
      .filter((slug) => slug !== normalizedBase && toolIndex.has(slug))
  );
  const availableForMin = availableFeatured.length > 0 ? availableFeatured : capFeatured;
  const targetFeaturedMin = availableForMin.length > 0
    ? Math.max(FEATURED_MIN_PER_PAGE, Math.min(targetFeaturedMax, availableForMin.length))
    : 0;

  const preferredFeaturedOrder = uniqueSlugSequence([
    ...preferenceOrderFn(baseSlug).map((slug) => toFeaturedCanonicalSlug(slug)),
    ...availableForMin,
  ]).filter((slug) => availableForMin.includes(slug));
  const featuredSet = new Set(capFeatured.length > 0 ? capFeatured : availableFeatured);
  const seed = stableHash(normalizedBase || baseSlug);
  const dynamicSlot1 = 1 + (seed % 2);
  const dynamicSlot2 = 3 + (seed % 2);
  const preferredSlots = Array.from(new Set([dynamicSlot1, dynamicSlot2]))
    .map((slot) => Math.max(1, Math.min(4, slot)));

  const topLimit = Math.max(1, topPickSlugs.length);
  let nextTopPickSlugs = uniqueSlugSequence(topPickSlugs).filter((slug) => slug !== normalizedBase);
  nextTopPickSlugs = capFeaturedInSlugList(nextTopPickSlugs, featuredSet, targetFeaturedMax);

  if (targetFeaturedMin > 0) {
    let slotCursor = 0;
    for (const featuredSlug of preferredFeaturedOrder) {
      if (countFeaturedSlugs(nextTopPickSlugs, featuredSet) >= targetFeaturedMin) break;
      if (nextTopPickSlugs.includes(featuredSlug)) continue;
      const preferredSlot = preferredSlots[Math.min(slotCursor, preferredSlots.length - 1)];
      nextTopPickSlugs = insertSlugAtPreferredSlot(nextTopPickSlugs, featuredSlug, preferredSlot);
      slotCursor += 1;
    }
  }

  nextTopPickSlugs = trimSlugListToLimit({
    slugs: capFeaturedInSlugList(nextTopPickSlugs, featuredSet, targetFeaturedMax),
    limit: topLimit,
    featuredSet,
    minFeatured: targetFeaturedMin,
  });

  const deepLimit = Math.max(1, deepDiveSlugs.length);
  const originalDeepDiveSet = new Set(uniqueSlugSequence(deepDiveSlugs));
  let nextDeepDiveSlugs = uniqueSlugSequence(deepDiveSlugs).filter((slug) => slug !== normalizedBase);
  nextDeepDiveSlugs = capFeaturedInSlugList(nextDeepDiveSlugs, featuredSet, targetFeaturedMax);

  const injectedDeepDiveItems: AlternativesDeepDive[] = [];
  const injectedSeen = new Set<string>();

  const ensureInDeepDives = (featuredSlug: string, slotCursor: number): number => {
    if (countFeaturedSlugs(nextDeepDiveSlugs, featuredSet) >= targetFeaturedMin) return slotCursor;
    if (!nextDeepDiveSlugs.includes(featuredSlug)) {
      const preferredSlot = preferredSlots[Math.min(slotCursor, preferredSlots.length - 1)];
      nextDeepDiveSlugs = insertSlugAtPreferredSlot(nextDeepDiveSlugs, featuredSlug, preferredSlot);
      if (!originalDeepDiveSet.has(featuredSlug) && !injectedSeen.has(featuredSlug)) {
        const fallback = createFallbackFeaturedDeepDive(featuredSlug, baseSlug, toolIndex);
        if (fallback) {
          injectedDeepDiveItems.push(fallback);
          injectedSeen.add(featuredSlug);
        }
      }
      return slotCursor + 1;
    }
    return slotCursor;
  };

  if (targetFeaturedMin > 0) {
    let deepSlotCursor = 0;
    const topFeaturedPriority = nextTopPickSlugs
      .filter((slug) => featuredSet.has(slug))
      .slice(0, targetFeaturedMax);

    for (const featuredSlug of topFeaturedPriority) {
      deepSlotCursor = ensureInDeepDives(featuredSlug, deepSlotCursor);
    }

    for (const featuredSlug of preferredFeaturedOrder) {
      if (countFeaturedSlugs(nextDeepDiveSlugs, featuredSet) >= targetFeaturedMin) break;
      deepSlotCursor = ensureInDeepDives(featuredSlug, deepSlotCursor);
    }
  }

  nextDeepDiveSlugs = trimSlugListToLimit({
    slugs: capFeaturedInSlugList(nextDeepDiveSlugs, featuredSet, targetFeaturedMax),
    limit: deepLimit,
    featuredSet,
    minFeatured: targetFeaturedMin,
  });

  return {
    topPickSlugs: nextTopPickSlugs,
    deepDiveSlugs: nextDeepDiveSlugs,
    injectedDeepDiveItems,
  };
}

function enforceFeaturedInTop3({
  baseSlug,
  top6Slugs,
  featuredPool,
  featuredMaxPerPage,
}: {
  baseSlug: string;
  top6Slugs: string[];
  featuredPool: string[];
  featuredMaxPerPage: number;
}): string[] {
  const normalizedBase = normalizeSlugKey(baseSlug);
  const featuredCanonicalSet = new Set(
    featuredPool
      .map((slug) => toFeaturedCanonicalSlug(slug))
      .filter((slug) => slug && slug !== normalizedBase)
  );
  const top = uniqueSlugSequence(top6Slugs)
    .map((slug) => normalizeSlugKey(slug))
    .filter((slug) => slug && slug !== normalizedBase)
    .slice(0, 6);
  const isFeatured = (slug: string) => featuredCanonicalSet.has(toFeaturedCanonicalSlug(slug));
  const featuredInOrder = top.filter((slug) => isFeatured(slug));
  const featuredCount = Math.min(featuredInOrder.length, Math.max(0, featuredMaxPerPage));
  if (featuredCount === 0) return top;

  const keepFeatured = featuredInOrder.slice(0, featuredCount);
  const keepFeaturedSet = new Set(keepFeatured);
  const others = top.filter((slug) => !keepFeaturedSet.has(slug));

  if (featuredCount === 1) {
    return [keepFeatured[0], ...others].slice(0, 6);
  }
  return [keepFeatured[0], keepFeatured[1], ...others].slice(0, 6);
}

function ensureTop6Constraints({
  baseSlug,
  rankedCandidates,
  allToolIndexOrAllToolsList,
  existingDeepDiveSlugs,
  featuredSet,
  coreAnchors,
  topN,
}: {
  baseSlug: string;
  rankedCandidates: string[];
  allToolIndexOrAllToolsList: Map<string, Tool> | Tool[];
  existingDeepDiveSlugs: string[];
  featuredSet: Set<string>;
  coreAnchors: string[];
  topN: number;
}): {
  finalTopN: string[];
  selectedFeatured: string | null;
  selectedCoreAnchor: string | null;
  injectedDeepDiveItems: AlternativesDeepDive[];
  injectedFallbackSlugs: string[];
  constraintMissedCore: boolean;
  constraintMissedFeatured: boolean;
} {
  const toolIndex = Array.isArray(allToolIndexOrAllToolsList)
    ? new Map(allToolIndexOrAllToolsList.map((tool) => [normalizeSlugKey(tool.slug), tool]))
    : new Map(
        [...allToolIndexOrAllToolsList.entries()].map(([slug, tool]) => [normalizeSlugKey(slug), tool])
      );
  const normalizedBase = normalizeSlugKey(baseSlug);
  const existingDeepDiveSet = new Set(
    existingDeepDiveSlugs.map((slug) => normalizeSlugKey(slug)).filter((slug) => Boolean(slug))
  );
  const ordered = uniqueSlugSequence(
    rankedCandidates.map((slug) => normalizeSlugKey(slug)).filter((slug) => Boolean(slug))
  ).filter((slug) => slug !== normalizedBase);
  const orderedForRefill = [...ordered];
  const rankedIndex = new Map(orderedForRefill.map((slug, index) => [slug, index]));
  const normalizedCoreAnchors = new Set(
    coreAnchors
      .map((slug) => normalizeSlugKey(slug))
      .filter((slug) => slug && slug !== normalizedBase)
  );
  const effectiveFeatured = new Set<string>(
    [...featuredSet].map((slug) => toFeaturedCanonicalSlug(slug))
  );
  if (effectiveFeatured.size === 0) {
    FEATURED_POOL_CANONICAL.forEach((slug) => {
      if (slug !== normalizedBase) effectiveFeatured.add(slug);
    });
  }

  const isFeatured = (slug?: string) => Boolean(slug) && effectiveFeatured.has(toFeaturedCanonicalSlug(slug as string));
  const isCore = (slug?: string) => Boolean(slug) && normalizedCoreAnchors.has(normalizeSlugKey(slug as string));
  const insertOrMove = (list: string[], slug: string, preferredSlot: number) => {
    const next = [...list];
    const existingIndex = next.indexOf(slug);
    if (existingIndex >= 0) next.splice(existingIndex, 1);
    const safeSlot = Math.max(0, Math.min(preferredSlot, next.length));
    next.splice(safeSlot, 0, slug);
    return next;
  };
  const refill = (list: string[]) => {
    const next = [...list];
    for (const candidate of orderedForRefill) {
      if (next.length >= topN) break;
      if (next.includes(candidate)) continue;
      next.push(candidate);
    }
    return next;
  };
  const refillWithFeaturedCap = (list: string[], maxFeatured: number) => {
    const next = [...list];
    let featuredCount = next.filter((slug) => isFeatured(slug)).length;
    for (const candidate of orderedForRefill) {
      if (next.length >= topN) break;
      if (next.includes(candidate)) continue;
      if (isFeatured(candidate) && featuredCount >= maxFeatured) continue;
      next.push(candidate);
      if (isFeatured(candidate)) featuredCount += 1;
    }
    return next;
  };
  const trimToTopN = (list: string[]) => {
    const next = [...list];
    while (next.length > topN) {
      const removable = next
        .map((slug, idx) => ({ slug, idx, rank: rankedIndex.get(slug) ?? Number.MAX_SAFE_INTEGER }))
        .filter((item) => !isFeatured(item.slug) && !isCore(item.slug));
      const secondary = next
        .map((slug, idx) => ({ slug, idx, rank: rankedIndex.get(slug) ?? Number.MAX_SAFE_INTEGER }))
        .filter((item) => !isFeatured(item.slug));
      const pool = removable.length > 0
        ? removable
        : (secondary.length > 0 ? secondary : next.map((slug, idx) => ({ slug, idx, rank: rankedIndex.get(slug) ?? Number.MAX_SAFE_INTEGER })));
      pool.sort((a, b) => {
        if (b.rank !== a.rank) return b.rank - a.rank;
        return b.idx - a.idx;
      });
      next.splice(pool[0].idx, 1);
    }
    return next;
  };
  const injectedDeepDiveItems: AlternativesDeepDive[] = [];
  const injectedFallbackSlugs: string[] = [];
  const registerFallbackForSlug = (toolSlug: string) => {
    const normalized = normalizeSlugKey(toolSlug);
    if (!normalized || existingDeepDiveSet.has(normalized) || injectedFallbackSlugs.includes(normalized)) return;
    const fallback = createFallbackToolDeepDive(normalized, normalizedBase, toolIndex);
    if (!fallback) return;
    injectedDeepDiveItems.push(fallback);
    injectedFallbackSlugs.push(normalized);
    existingDeepDiveSet.add(normalized);
  };
  const appendToRankedIfMissing = (toolSlug: string) => {
    const normalized = normalizeSlugKey(toolSlug);
    if (!normalized || rankedIndex.has(normalized)) return;
    orderedForRefill.push(normalized);
    rankedIndex.set(normalized, orderedForRefill.length - 1);
  };
  const pickDeterministicCoreFromSite = (): string | null => {
    const siteCoreCandidates = uniqueSlugSequence(
      coreAnchors
        .map((slug) => normalizeSlugKey(slug))
        .filter((slug) => slug && slug !== normalizedBase && toolIndex.has(slug))
    );
    if (siteCoreCandidates.length === 0) return null;
    const sorted = [...siteCoreCandidates].sort((a, b) => {
      const scoreA = stableHash(`${normalizedBase}:${a}`);
      const scoreB = stableHash(`${normalizedBase}:${b}`);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.localeCompare(b);
    });
    return sorted[0] || null;
  };
  const pickSecondFeaturedFromRanked = (existingCanonicals: Set<string>, currentTop: string[]): string | null => {
    const candidate = orderedForRefill.find((slug) => (
      slug !== normalizedBase
      && isFeatured(slug)
      && !existingCanonicals.has(toFeaturedCanonicalSlug(slug))
      && !currentTop.includes(slug)
    ));
    return candidate || null;
  };
  const pickSecondFeaturedFromSite = (existingCanonicals: Set<string>): string | null => {
    const candidates = FEATURED_POOL_CANONICAL
      .map((slug) => normalizeSlugKey(slug))
      .filter((slug) => (
        slug
        && slug !== normalizedBase
        && toolIndex.has(slug)
        && !existingCanonicals.has(toFeaturedCanonicalSlug(slug))
      ));
    if (candidates.length === 0) return null;
    const sorted = uniqueSlugSequence(candidates).sort((a, b) => {
      const scoreA = stableHash(`${normalizedBase}:featured2:${a}`);
      const scoreB = stableHash(`${normalizedBase}:featured2:${b}`);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.localeCompare(b);
    });
    return sorted[0] || null;
  };
  const trimToTopNWithProtected = (list: string[], protectedSlugs: Set<string>) => {
    const next = [...list];
    while (next.length > topN) {
      const ranked = next.map((slug, idx) => ({
        slug,
        idx,
        rank: rankedIndex.get(slug) ?? Number.MAX_SAFE_INTEGER,
      }));
      const removablePrimary = ranked.filter((item) => (
        !protectedSlugs.has(item.slug) && !isFeatured(item.slug) && !isCore(item.slug)
      ));
      const removableSecondary = ranked.filter((item) => (
        !protectedSlugs.has(item.slug) && !isFeatured(item.slug)
      ));
      const removableTertiary = ranked.filter((item) => !protectedSlugs.has(item.slug));
      const pool = removablePrimary.length > 0
        ? removablePrimary
        : (removableSecondary.length > 0 ? removableSecondary : (removableTertiary.length > 0 ? removableTertiary : ranked));

      pool.sort((a, b) => {
        if (b.rank !== a.rank) return b.rank - a.rank;
        return b.idx - a.idx;
      });
      next.splice(pool[0].idx, 1);
    }
    return next;
  };

  let top = orderedForRefill.slice(0, topN);
  let selectedFeatured: string | null = null;
  const featuredInTop = top.filter((slug) => isFeatured(slug));

  if (featuredInTop.length > 0) {
    selectedFeatured = [...featuredInTop].sort((a, b) => (rankedIndex.get(a) ?? 9999) - (rankedIndex.get(b) ?? 9999))[0];
    top = top.filter((slug) => !isFeatured(slug) || slug === selectedFeatured);
  } else {
    const featuredCandidate = ordered.find((slug) => isFeatured(slug));
    if (featuredCandidate) {
      selectedFeatured = featuredCandidate;
      const featuredSlot = 1 + (stableHash(normalizedBase) % 3);
      top = insertOrMove(top, featuredCandidate, featuredSlot);
    }
  }
  top = refill(top);
  top = trimToTopN(top);

  let selectedCoreAnchor = top.find((slug) => isCore(slug)) || null;
  let constraintMissedCore = false;
  if (!selectedCoreAnchor) {
    const coreCandidate = orderedForRefill.find((slug) => isCore(slug));
    if (coreCandidate) {
      selectedCoreAnchor = coreCandidate;
      const coreSlot = 2 + (stableHash(`${normalizedBase}core`) % 4);
      top = insertOrMove(top, coreCandidate, coreSlot);
      top = refill(top);
      top = trimToTopN(top);
      registerFallbackForSlug(coreCandidate);
    } else {
      const siteCoreCandidate = pickDeterministicCoreFromSite();
      if (siteCoreCandidate) {
        selectedCoreAnchor = siteCoreCandidate;
        appendToRankedIfMissing(siteCoreCandidate);
        const coreSlot = 2 + (stableHash(`${normalizedBase}core`) % 4);
        top = insertOrMove(top, siteCoreCandidate, coreSlot);
        top = refill(top);
        top = trimToTopN(top);
        registerFallbackForSlug(siteCoreCandidate);
      } else {
        constraintMissedCore = true;
      }
    }
  }

  const featuredAfterCore = top.filter((slug) => isFeatured(slug));
  if (featuredAfterCore.length > TOP6_FEATURED_MAX) {
    const keepFeatured = (() => {
      if (selectedCoreAnchor && isFeatured(selectedCoreAnchor)) return selectedCoreAnchor;
      if (selectedFeatured && featuredAfterCore.includes(selectedFeatured)) return selectedFeatured;
      return [...featuredAfterCore].sort((a, b) => (rankedIndex.get(a) ?? 9999) - (rankedIndex.get(b) ?? 9999))[0];
    })();
    top = top.filter((slug) => !isFeatured(slug) || slug === keepFeatured);
    selectedFeatured = keepFeatured;
    top = refill(top);
    top = trimToTopN(top);
  } else {
    selectedFeatured = featuredAfterCore[0] || null;
  }

  // Final hard cap pass for featured count: remove extras and refill with non-featured first.
  let finalTop = uniqueSlugSequence(top).slice(0, topN);
  const finalFeatured = finalTop.filter((slug) => isFeatured(slug));
  if (finalFeatured.length > TOP6_FEATURED_MAX) {
    const keepFeatured = (() => {
      if (selectedCoreAnchor && isFeatured(selectedCoreAnchor)) return selectedCoreAnchor;
      if (selectedFeatured && finalFeatured.includes(selectedFeatured)) return selectedFeatured;
      return [...finalFeatured].sort((a, b) => (rankedIndex.get(a) ?? 9999) - (rankedIndex.get(b) ?? 9999))[0];
    })();
    finalTop = finalTop.filter((slug) => !isFeatured(slug) || slug === keepFeatured);
    finalTop = refillWithFeaturedCap(finalTop, TOP6_FEATURED_MAX);
    finalTop = trimToTopN(finalTop);
  }

  const baselineFeaturedCount = getBaselineFeaturedCount(normalizedBase);
  const currentFeaturedCount = finalTop.filter((slug) => isFeatured(slug)).length;
  if (baselineFeaturedCount === 1 && currentFeaturedCount === 1) {
    const existingCanonicals = new Set(
      finalTop
        .filter((slug) => isFeatured(slug))
        .map((slug) => toFeaturedCanonicalSlug(slug))
    );
    const secondFeatured = pickSecondFeaturedFromRanked(existingCanonicals, finalTop)
      || pickSecondFeaturedFromSite(existingCanonicals);
    if (secondFeatured) {
      appendToRankedIfMissing(secondFeatured);
      const featuredSlot = 3 + (stableHash(`${normalizedBase}:featured-slot`) % 2);
      finalTop = insertOrMove(finalTop, secondFeatured, featuredSlot);
      finalTop = trimToTopNWithProtected(finalTop, new Set([secondFeatured]));
      registerFallbackForSlug(secondFeatured);
    }
  }

  const hasCoreAnchor = finalTop.some((slug) => isCore(slug));
  if (!hasCoreAnchor) {
    constraintMissedCore = true;
    selectedCoreAnchor = null;
  }

  const hasFeaturedCandidate = orderedForRefill.some((slug) => isFeatured(slug));
  selectedFeatured = finalTop.find((slug) => isFeatured(slug)) || null;
  selectedCoreAnchor = finalTop.find((slug) => isCore(slug)) || selectedCoreAnchor;
  if (selectedCoreAnchor) {
    registerFallbackForSlug(selectedCoreAnchor);
  }
  const constraintMissedFeatured = hasFeaturedCandidate && !finalTop.some((slug) => isFeatured(slug));
  const reorderedTop = enforceFeaturedInTop3({
    baseSlug: normalizedBase,
    top6Slugs: finalTop,
    featuredPool: FEATURED_POOL_CANONICAL,
    featuredMaxPerPage: FEATURED_MAX_PER_PAGE,
  });
  selectedFeatured = reorderedTop.find((slug) => isFeatured(slug)) || selectedFeatured;
  selectedCoreAnchor = reorderedTop.find((slug) => isCore(slug)) || selectedCoreAnchor;

  return {
    finalTopN: reorderedTop.slice(0, topN),
    selectedFeatured,
    selectedCoreAnchor,
    injectedDeepDiveItems,
    injectedFallbackSlugs,
    constraintMissedCore,
    constraintMissedFeatured,
  };
}

function getArcadeInVideoIntersection(): ArcadeIntersectionResult {
  const siteTools = getAllTools();
  const bySlug = new Map(siteTools.map((tool) => [tool.slug.toLowerCase(), tool]));
  const byNormalizedName = new Map(siteTools.map((tool) => [normalizeToolKey(tool.name), tool]));

  const intersected: Array<{ name: string; slug: string; matchedArcadeName: string }> = [];
  const missingFromSite: string[] = [];
  const keepSlugs = new Set<string>();

  ARCADE_INVIDEO_REFERENCE_TOOLS.forEach((rawName) => {
    const normalized = normalizeToolKey(rawName);
    const aliasSlug = ARCADE_INVIDEO_ALIAS_RULES[normalized];

    let matched = aliasSlug ? bySlug.get(aliasSlug.toLowerCase()) : undefined;
    if (!matched) {
      matched = byNormalizedName.get(normalized);
    }

    if (!matched) {
      missingFromSite.push(rawName);
      return;
    }

    keepSlugs.add(matched.slug);
    intersected.push({
      name: matched.name,
      slug: matched.slug,
      matchedArcadeName: rawName,
    });
  });

  return {
    keepSlugs,
    intersected,
    missingFromSite,
    aliasRules: ARCADE_INVIDEO_ALIAS_RULES,
  };
}

function toEvidenceMap(): Map<string, any> {
  const evidenceMap = new Map<string, any>();
  Object.entries(alternativesEvidence).forEach(([toolSlug, rawEvidence]: [string, ToolAlternativeEvidence]) => {
    evidenceMap.set(toolSlug, {
      toolSlug,
      pickThisIf: rawEvidence.whySwitch?.[0]?.claim,
      extraReason: rawEvidence.whySwitch?.[1]?.claim,
      limitations: rawEvidence.tradeoffs?.[0]?.claim,
      bestFor: rawEvidence.bestFor,
    });
  });

  return evidenceMap;
}

async function getToolAlternativesGroups(slug: string): Promise<AlternativeGroupWithEvidence[]> {
  const tool = getToolBySlug(slug)?.tool;
  if (!tool) return [];

  const allTools = getAllTools();
  const canonicalConfig = canonicalAlternativesConfigs[slug];

  if (canonicalConfig) {
    return mergeCanonicalAndEvidence(canonicalConfig, toEvidenceMap(), allTools);
  }

  const { buildAlternativeGroups } = await import('@/lib/buildAlternativesData');
  const { getAlternativesShortlist } = await import('@/lib/alternatives/getAlternativesShortlist');
  const shortlist = getAlternativesShortlist(slug, allTools, 10);
  const oldGroups = buildAlternativeGroups(tool, allTools, shortlist);

  return oldGroups.map((group: AlternativeGroup) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    tools: group.tools.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      logoUrl: item.logoUrl,
      startingPrice: item.startingPrice,
      rating: item.rating,
      affiliateLink: item.affiliateLink,
      hasFreeTrial: item.hasFreeTrial,
      pickThisIf: item.whySwitch[0],
      extraReason: item.whySwitch[1],
      limitations: item.tradeOff || undefined,
      pricingSignals: item.pricingSignals,
      bestFor: item.bestFor,
    })),
  }));
}

function rankGroupTools(group: AlternativeGroupWithEvidence): LongformToolCard[] {
  const ordered = group.bestMatch?.length || group.deals?.length
    ? [...(group.bestMatch || []), ...(group.deals || [])]
    : [...(group.tools || [])];

  const ranked = ordered
    .map((tool, index) => {
      const bestForContext = [
        ...(tool.bestFor || []),
        (tool as any).pickThisIf || '',
        (tool as any).extraReason || '',
        (tool as any).limitations || '',
        group.title,
        group.description,
      ];
      const hasBestFor = (tool.bestFor || []).some((line) => Boolean(sanitizeLabel(line, bestForContext)));
      const hasTradeoff = Boolean(cleanText((tool as any).limitations || null));
      const score = (hasBestFor ? 1 : 0) + (hasTradeoff ? 1 : 0);
      return { tool, index, score };
    })
    .filter((item) => item.score >= 1)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .slice(0, 3);

  return ranked.map(({ tool }) => ({
    slug: tool.slug,
    name: tool.name,
    logoUrl: tool.logoUrl,
    bestFor: sanitizeLabelList(
      tool.bestFor || [],
      [
        ...(tool.bestFor || []),
        (tool as any).pickThisIf || '',
        (tool as any).extraReason || '',
        (tool as any).limitations || '',
        group.title,
        group.description,
      ]
    ),
    pickThisIf: cleanText((tool as any).pickThisIf || null) || undefined,
    extraReason: cleanText((tool as any).extraReason || null) || undefined,
    limitations: cleanText((tool as any).limitations || null) || undefined,
    pricingSignals: tool.pricingSignals || {},
    startingPrice: sanitizeSentence(tool.startingPrice) || 'Pricing varies by plan.',
    affiliateLink: (tool as any).affiliateUrl || tool.affiliateLink || undefined,
    groupId: group.id,
    groupTitle: group.title,
    groupDescription: group.description,
  }));
}

function readDossierSourceMap(currentSlug: string): DossierSourceMap {
  const sourceMap: DossierSourceMap = new Map();
  const filePath = path.join(process.cwd(), 'src', 'data', 'alternatives', `${currentSlug}.json`);

  if (!fs.existsSync(filePath)) {
    return sourceMap;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as {
      switchReasonGroups?: Array<{
        alternatives?: Array<{
          toolName: string;
          whySwitch?: Array<{ sources?: Array<{ url?: string }> }>;
          tradeoffs?: Array<{ sources?: Array<{ url?: string }> }>;
        }>;
      }>;
    };

    (data.switchReasonGroups || []).forEach((group) => {
      (group.alternatives || []).forEach((alternative) => {
        const mappedSlug = mapToolNameToSlug(alternative.toolName);
        if (!mappedSlug) return;

        const urls = [
          ...(alternative.whySwitch || []).flatMap((item) => (item.sources || []).map((source) => source.url || '')),
          ...(alternative.tradeoffs || []).flatMap((item) => (item.sources || []).map((source) => source.url || '')),
        ]
          .map((url) => cleanText(url))
          .filter((url): url is string => Boolean(url));

        if (urls.length === 0) return;

        const merged = uniqueStrings([...(sourceMap.get(mappedSlug) || []), ...urls]);
        sourceMap.set(mappedSlug, merged);
      });
    });
  } catch {
    return sourceMap;
  }

  return sourceMap;
}

function getFallbackSourcesForToolPage(currentSlug: string): string[] {
  if (currentSlug === 'invideo') return INVIDEO_REFERENCE_SIGNALS;
  return [];
}

function toAbsoluteLink(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return new URL(url, 'https://best-ai-video.com').toString();
  }
}

function resolveLocalDeepDiveImage(slug: string): string | undefined {
  for (const extension of LOCAL_IMAGE_EXTENSIONS) {
    const filePath = path.join(process.cwd(), 'public', 'alternatives', 'images', `${slug}.${extension}`);
    if (fs.existsSync(filePath)) {
      return `/alternatives/images/${slug}.${extension}`;
    }
  }
  return undefined;
}

function pickImageSourceUrl(sourceUrls: string[], fallbackUrl: string): string {
  const absoluteSource = sourceUrls.find((url) => {
    const normalized = url.toLowerCase();
    return normalized.startsWith('http://') || normalized.startsWith('https://');
  });

  if (absoluteSource) {
    return toAbsoluteLink(absoluteSource);
  }

  if (sourceUrls[0]) {
    return toAbsoluteLink(sourceUrls[0]);
  }

  return toAbsoluteLink(fallbackUrl);
}

function buildToolDeepDives(cards: LongformToolCard[], currentSlug: string): AlternativesDeepDive[] {
  const dossierSourceMap = readDossierSourceMap(currentSlug);
  const fallbackSignals = getFallbackSourcesForToolPage(currentSlug);

  return cards.map((card) => {
    const bestForCandidates = sanitizeLabelList(
      card.bestFor || [],
      [
        ...(card.bestFor || []),
        card.name,
        card.groupTitle,
        card.groupDescription,
        card.pickThisIf || '',
        card.extraReason || '',
        card.limitations || '',
      ]
    );
    const primaryBestFor = bestForCandidates[0] || sanitizeLabel(card.groupTitle, [card.groupDescription]) || card.groupTitle;
    const strengths = sanitizeSentenceList(
      [
        card.pickThisIf || '',
        card.extraReason || '',
        card.pricingSignals.freePlan || '',
        card.pricingSignals.exportQuality || '',
      ]
    ).slice(0, 3);

    if (strengths.length === 0) {
      strengths.push(`Strong fit for ${primaryBestFor}.`);
    }

    const tradeoffs = sanitizeSentenceList([
      card.limitations || '',
      card.pricingSignals.refundCancel || '',
    ]).slice(0, 2);

    if (tradeoffs.length === 0) {
      tradeoffs.push('Trade-offs vary by workflow and team setup.');
    }

    const evidenceSources = uniqueStrings(getEvidenceSources(card.slug));
    const dossierSources = uniqueStrings(dossierSourceMap.get(card.slug) || []);

    const sourceUrls = uniqueStrings([
      ...dossierSources,
      ...evidenceSources,
      ...fallbackSignals,
      `https://www.g2.com/products/${card.slug}/competitors/alternatives`,
      ...(currentSlug === 'invideo' ? ['https://www.capterra.com/p/180680/InVideo/alternatives/'] : []),
      `/tool/${card.slug}/pricing`,
      `/tool/${card.slug}/reviews`,
    ]).slice(0, 4);
    const image = resolveLocalDeepDiveImage(card.slug);
    const imageSourceUrl = pickImageSourceUrl(sourceUrls, `/tool/${card.slug}`);

    return {
      toolName: card.name,
      toolSlug: card.slug,
      logoUrl: card.logoUrl,
      image,
      imageSourceUrl,
      bestFor: primaryBestFor,
      strengths,
      tradeoffs,
      pricingStarting: sanitizeSentence(card.startingPrice) || 'Pricing varies by plan.',
      ctaHref: card.affiliateLink || `/tool/${card.slug}`,
      ctaLabel: 'Try now',
      sourceUrls: sourceUrls.length > 0 ? sourceUrls : [`/tool/${card.slug}/pricing`],
    };
  });
}

function mapEditingControl(card: LongformToolCard): string {
  const groupKey = `${card.groupId} ${card.groupTitle}`.toLowerCase();
  if (groupKey.includes('editing') || groupKey.includes('timeline') || groupKey.includes('control')) {
    return card.groupTitle;
  }
  if ((card.bestFor[0] || '').toLowerCase().includes('editor')) {
    return 'Moderate';
  }
  return 'Guided workflow';
}

function mapToolComparisonRows(deepDives: AlternativesDeepDive[], cardsBySlug: Map<string, LongformToolCard>): AlternativesComparisonRow[] {
  return deepDives.slice(0, 6).map((deepDive) => {
    const card = deepDive.toolSlug ? cardsBySlug.get(deepDive.toolSlug) : undefined;
    const sanitizedBestFor = sanitizeLabel(deepDive.bestFor, [
      deepDive.toolName,
      ...(deepDive.strengths || []),
      ...(deepDive.tradeoffs || []),
      ...(card?.bestFor || []),
    ]) || deepDive.bestFor;

    return {
      toolName: deepDive.toolName,
      toolSlug: deepDive.toolSlug,
      price: sanitizeSentence(deepDive.pricingStarting) || 'Pricing varies by plan.',
      freeVersion: sanitizeSentence(card?.pricingSignals.freePlan || null)
        || ((card?.startingPrice || '').toLowerCase().includes('free') ? 'Has free plan' : 'Free plan details vary by tool'),
      watermark: sanitizeSentence(card?.pricingSignals.watermark || null) || 'Watermark rules vary by plan',
      exportLimits: sanitizeSentence(card?.pricingSignals.exportQuality || null) || 'Export limits vary by plan',
      editingControl: sanitizeSentence(card ? mapEditingControl(card) : null) || 'Guided workflow',
      bestFor: sanitizedBestFor,
      mainTradeoff: sanitizeSentence(deepDive.tradeoffs[0]) || 'Trade-offs vary by workflow',
    };
  });
}

function ensureFaqFloor(faqs: AlternativesFaq[], title: string): AlternativesFaq[] {
  const fallback: AlternativesFaq[] = [
    {
      question: `Is there a free ${title} alternative?`,
      answer: 'Yes, but free plans usually include limits in minutes, exports, or branding. Validate those limits before committing.',
    },
    {
      question: 'Do free plans include a watermark?',
      answer: 'Many do. Confirm watermark removal rules on the plan page before publishing client-facing videos.',
    },
    {
      question: 'Can I use generated videos commercially?',
      answer: 'Usually yes on paid plans, but licensing rules vary by stock media provider and AI generation policy.',
    },
    {
      question: 'How do refunds and cancellation usually work?',
      answer: 'Most vendors treat annual billing differently from monthly billing. Read refund windows and cancellation terms before purchase.',
    },
    {
      question: 'What if browser export fails repeatedly?',
      answer: 'Try supported browsers, clear cache, split projects into shorter timelines, and keep a fallback desktop tool for urgent deliveries.',
    },
    {
      question: 'What should teams compare first?',
      answer: 'Start with pricing predictability, editing control after generation, and commercial licensing clarity.',
    },
  ];

  const existing = [...faqs];
  for (const item of fallback) {
    if (existing.length >= 10) break;
    const hasQuestion = existing.some((faq) => faq.question.toLowerCase() === item.question.toLowerCase());
    if (!hasQuestion) {
      existing.push(item);
    }
  }

  return existing.slice(0, 10);
}

function evaluateContentReady(data: {
  tldrBuckets: { items: unknown[] }[];
  decisionCriteria: string[];
  comparisonRows: AlternativesComparisonRow[];
  deepDives: AlternativesDeepDive[];
  faqs: AlternativesFaq[];
}): { ready: boolean; reason?: string } {
  const nonEmptyBuckets = data.tldrBuckets.filter((bucket) => bucket.items.length > 0).length;
  if (nonEmptyBuckets < 3) {
    return { ready: false, reason: 'Not enough recommendation buckets are fully populated yet.' };
  }

  if (data.deepDives.length < 3) {
    return { ready: false, reason: 'Not enough deep dive cards are available yet.' };
  }

  if (data.comparisonRows.length < 3) {
    return { ready: false, reason: 'Comparison table needs at least three validated tools.' };
  }

  if (data.decisionCriteria.length < 3) {
    return { ready: false, reason: 'Decision criteria are still being expanded.' };
  }

  if (data.faqs.length < 6) {
    return { ready: false, reason: 'FAQ coverage is still below the minimum threshold.' };
  }

  return { ready: true };
}

export async function buildToolAlternativesLongformData(slug: string): Promise<AlternativesTemplateData | null> {
  const tool = getToolBySlug(slug)?.tool;
  if (!tool) return null;
  const arcadeIntersection = slug === 'invideo' ? getArcadeInVideoIntersection() : null;

  const groups = await getToolAlternativesGroups(slug);
  const rankedGroups = groups
    .map((group) => ({ group, tools: rankGroupTools(group) }))
    .filter((item) => item.tools.length > 0)
    .slice(0, 4);

  const rawTldrBuckets = rankedGroups.map(({ group, tools }) => ({
    id: group.id,
    title: group.title,
    items: tools.slice(0, 3).map((toolItem) => ({
      toolName: toolItem.name,
      toolSlug: toolItem.slug,
      href: `/tool/${toolItem.slug}`,
      why: toolItem.pickThisIf || toolItem.extraReason || group.description,
    })),
  }));

  const tldrBuckets = rawTldrBuckets
    .map((bucket) => ({
      ...bucket,
      items: (arcadeIntersection
        ? bucket.items.filter((item) => item.toolSlug && arcadeIntersection.keepSlugs.has(item.toolSlug))
        : bucket.items
      )
        .map((item) => {
          const sanitizedWhy = sanitizeSentence(item.why) || sanitizeSentence(bucket.title) || sanitizeSentence('Best fit by workflow');
          if (!sanitizedWhy) return null;
          return {
            ...item,
            why: sanitizedWhy,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    }))
    .filter((bucket) => bucket.items.length > 0);

  const uniqueCards: LongformToolCard[] = [];
  const seen = new Set<string>();
  rankedGroups.forEach(({ tools }) => {
    tools.forEach((toolItem) => {
      if (seen.has(toolItem.slug)) return;
      seen.add(toolItem.slug);
      uniqueCards.push(toolItem);
    });
  });

  const allDeepDives = buildToolDeepDives(uniqueCards, slug);
  const intersectedDeepDives = arcadeIntersection
    ? allDeepDives.filter((item) => item.toolSlug && arcadeIntersection.keepSlugs.has(item.toolSlug))
    : [];
  const candidateDeepDives = arcadeIntersection
    ? (intersectedDeepDives.length > 0 ? intersectedDeepDives : allDeepDives)
    : allDeepDives;
  const topCandidateDeepDives = candidateDeepDives;
  const toolsBySlug = new Map(getAllTools().map((item) => [item.slug, item]));
  const baseIntent = getPrimaryIntent(tool);
  const topPicksLimit = 5;
  const baseLimit = Math.min(6, Math.max(topCandidateDeepDives.length, topPicksLimit));
  const topCandidateBySlug = new Map(
    topCandidateDeepDives
      .filter((item) => item.toolSlug)
      .map((item) => [item.toolSlug as string, item])
  );
  const rawCandidateSlugs = uniqueSlugSequence(
    topCandidateDeepDives
      .map((item) => item.toolSlug || '')
      .filter((toolSlug) => Boolean(toolSlug))
  );
  const intentBuckets = buildIntentBuckets({
    candidates: rawCandidateSlugs,
    baseIntent,
    deepDiveBySlug: topCandidateBySlug,
    toolsBySlug,
    baseToolSlug: slug,
  });
  const intentGatedSlugs = applyIntentGating({
    candidates: rawCandidateSlugs,
    baseIntent,
    deepDiveBySlug: topCandidateBySlug,
    toolsBySlug,
    baseToolSlug: slug,
  });
  const topConstraintSet = intentBuckets.sameIntent.length > 0
    ? new Set(intentBuckets.sameIntent)
    : new Set(intentBuckets.adjacentIntent);
  const requiredTopConstraint = intentBuckets.sameIntent.length > 0
    ? Math.min(3, intentBuckets.sameIntent.length)
    : Math.min(1, intentBuckets.adjacentIntent.length);
  const diversityAuditTraceBySlug = process.env.ALT_AUDIT === '1'
    ? {} as Record<string, { overlapScore: number; indexScore: number; overlapTrace: string; baseScore: number }>
    : undefined;
  const diversifiedCandidateSlugs = rerankTopPicksWithDiversity({
    orderedSlugs: intentGatedSlugs,
    deepDiveBySlug: topCandidateBySlug,
    toolsBySlug,
    baseToolSlug: slug,
    baseIntent,
    limit: Math.max(baseLimit, topPicksLimit),
    diversityWeight: DIVERSITY_WEIGHT,
    sameIntentSet: topConstraintSet,
    requiredSameIntentInTop: requiredTopConstraint,
    auditTraceBySlug: diversityAuditTraceBySlug,
  });
  const baseTopPickSlugs = diversifiedCandidateSlugs
    .filter((toolSlug) => toolSlug && toolSlug !== slug)
    .slice(0, topPicksLimit);
  const baseDeepDiveSlugs = diversifiedCandidateSlugs.slice(0, baseLimit);

  const featuredPoolForPage = uniqueSlugSequence([
    ...intentBuckets.sameIntent,
    ...intentBuckets.adjacentIntent,
  ]).filter((toolSlug) => FEATURED_POOL_CANONICAL.includes(toFeaturedCanonicalSlug(toolSlug)));
  const effectiveFeaturedPool = featuredPoolForPage.length > 0
    ? featuredPoolForPage
    : FEATURED_POOL_CANONICAL.filter((toolSlug) => toFeaturedCanonicalSlug(toolSlug) !== toFeaturedCanonicalSlug(slug));
  const featuredCapPoolForPage = uniqueSlugSequence(
    intentGatedSlugs.filter((toolSlug) => FEATURED_POOL_CANONICAL.includes(toFeaturedCanonicalSlug(toolSlug)))
  );
  const effectiveFeaturedCapPool = featuredCapPoolForPage.length > 0 ? featuredCapPoolForPage : effectiveFeaturedPool;
  const featuredAdjusted = ensureFeaturedCountForPage({
    baseSlug: slug,
    topPickSlugs: baseTopPickSlugs,
    deepDiveSlugs: baseDeepDiveSlugs,
    allToolIndexOrAllToolsList: toolsBySlug,
    featuredPool: effectiveFeaturedPool,
    featuredCapPool: effectiveFeaturedCapPool,
    preferenceOrderFn: (currentBaseSlug) => getFeaturedPreferenceOrder(currentBaseSlug, topCandidateDeepDives),
    targetFeaturedMax: FEATURED_MAX_PER_PAGE,
  });

  const deepDiveBySlug = new Map(allDeepDives.map((item) => [item.toolSlug || '', item]));
  featuredAdjusted.injectedDeepDiveItems.forEach((item) => {
    if (!item.toolSlug) return;
    deepDiveBySlug.set(item.toolSlug, item);
  });

  // Second pass keeps featured injection results while removing within-list lookalikes.
  const postFeaturedTopPickSlugs = rerankTopPicksWithDiversity({
    orderedSlugs: featuredAdjusted.topPickSlugs,
    deepDiveBySlug,
    toolsBySlug,
    baseToolSlug: slug,
    baseIntent,
    limit: topPicksLimit,
    diversityWeight: POST_FEATURED_DIVERSITY_WEIGHT,
    keepFirst: true,
  });
  const postFeaturedDeepDiveSlugs = rerankTopPicksWithDiversity({
    orderedSlugs: featuredAdjusted.deepDiveSlugs,
    deepDiveBySlug,
    toolsBySlug,
    baseToolSlug: slug,
    baseIntent,
    limit: baseLimit,
    diversityWeight: POST_FEATURED_DIVERSITY_WEIGHT,
    keepFirst: true,
  });
  const guardedAfterPostRerank = ensureFeaturedCountForPage({
    baseSlug: slug,
    topPickSlugs: postFeaturedTopPickSlugs,
    deepDiveSlugs: postFeaturedDeepDiveSlugs,
    allToolIndexOrAllToolsList: toolsBySlug,
    featuredPool: effectiveFeaturedPool,
    featuredCapPool: effectiveFeaturedCapPool,
    preferenceOrderFn: (currentBaseSlug) => getFeaturedPreferenceOrder(currentBaseSlug, topCandidateDeepDives),
    targetFeaturedMax: FEATURED_MAX_PER_PAGE,
  });
  guardedAfterPostRerank.injectedDeepDiveItems.forEach((item) => {
    if (!item.toolSlug) return;
    deepDiveBySlug.set(item.toolSlug, item);
  });
  const top6Constraint = ensureTop6Constraints({
    baseSlug: slug,
    rankedCandidates: uniqueSlugSequence([
      ...guardedAfterPostRerank.deepDiveSlugs,
      ...postFeaturedDeepDiveSlugs,
      ...diversifiedCandidateSlugs,
      ...rawCandidateSlugs,
    ]),
    allToolIndexOrAllToolsList: toolsBySlug,
    existingDeepDiveSlugs: [...deepDiveBySlug.keys()].filter((item) => Boolean(item)),
    featuredSet: new Set(FEATURED_POOL_CANONICAL.map((toolSlug) => toFeaturedCanonicalSlug(toolSlug))),
    coreAnchors: CORE_ANCHOR_SLUGS,
    topN: 6,
  });
  top6Constraint.injectedDeepDiveItems.forEach((item) => {
    if (!item.toolSlug) return;
    deepDiveBySlug.set(item.toolSlug, item);
  });
  const constrainedTopPickSlugs = top6Constraint.finalTopN.slice(0, topPicksLimit);

  const topPickCandidates: Array<{ toolName: string; toolSlug: string; href: string } | null> = constrainedTopPickSlugs
    .map((featuredSlug) => {
      const deepDive = deepDiveBySlug.get(featuredSlug);
      const toolItem = toolsBySlug.get(featuredSlug);
      if (!deepDive && !toolItem) return null;
      return {
        toolName: deepDive?.toolName || toolItem?.name || featuredSlug,
        toolSlug: featuredSlug,
        href: `/tool/${featuredSlug}`,
      };
    });
  const topPicks: TopPickItem[] = topPickCandidates
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, topPicksLimit);

  const topOrderedDeepDives = top6Constraint.finalTopN
    .map((toolSlug) => deepDiveBySlug.get(toolSlug))
    .filter((item): item is AlternativesDeepDive => Boolean(item));
  const topOrderedKeys = new Set(topOrderedDeepDives.map((item) => uniqueDeepDiveKey(item)));

  const fillerDeepDives: AlternativesDeepDive[] = [];
  const fillerLimit = Math.max(0, baseLimit - topOrderedDeepDives.length);
  let featuredInDeepDiveCount = topOrderedDeepDives.filter((item) => isFeaturedSlug(item.toolSlug)).length;
  const fillerCandidateSlugs = uniqueSlugSequence([
    ...top6Constraint.finalTopN,
    ...postFeaturedDeepDiveSlugs,
    ...diversifiedCandidateSlugs,
  ]);
  for (const fillerSlug of fillerCandidateSlugs) {
    const item = deepDiveBySlug.get(fillerSlug);
    if (!item) continue;
    if (fillerDeepDives.length >= fillerLimit) break;
    if (topOrderedKeys.has(uniqueDeepDiveKey(item))) continue;
    if (item.toolSlug === slug) continue;
    if (isFeaturedSlug(item.toolSlug) && featuredInDeepDiveCount >= TOP6_FEATURED_MAX) continue;
    if (isFeaturedSlug(item.toolSlug)) featuredInDeepDiveCount += 1;
    fillerDeepDives.push(item);
  }
  const finalDeepDives = [...topOrderedDeepDives, ...fillerDeepDives].slice(0, baseLimit);
  const finalDeepDiveKeys = new Set(finalDeepDives.map((item) => uniqueDeepDiveKey(item)));

  const remainingCandidateDeepDives = topCandidateDeepDives.filter((item) => !finalDeepDiveKeys.has(uniqueDeepDiveKey(item)));
  const nonIntersectionDeepDives = arcadeIntersection
    ? allDeepDives.filter((item) => !item.toolSlug || !arcadeIntersection.keepSlugs.has(item.toolSlug))
    : [];
  const moreAlternatives = uniqueStrings(
    [...remainingCandidateDeepDives, ...nonIntersectionDeepDives].map((item) => uniqueDeepDiveKey(item))
  )
    .map((key) => [...remainingCandidateDeepDives, ...nonIntersectionDeepDives].find((item) => uniqueDeepDiveKey(item) === key))
    .filter((item): item is AlternativesDeepDive => Boolean(item));
  const finalMoreAlternatives = moreAlternatives.filter((item) => !finalDeepDiveKeys.has(uniqueDeepDiveKey(item)));

  const content = tool.content;
  const rawFaqs = [
    ...(content?.reviews?.faqs || []),
    ...(tool.content?.reviews?.faqs || []),
    ...(tool.faqs || []),
  ];

  const smartFaqs = generateSmartFAQs({ tool, content, rawFaqs, slug }).map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  }));

  const finalFaqs = ensureFaqFloor(smartFaqs, `${tool.name} alternatives`);
  const filledLongform = fillLongformFromScraped({
    baseSlug: slug,
    deepDives: finalDeepDives,
    moreAlternatives: finalMoreAlternatives,
    faqs: finalFaqs,
  });
  const enrichedDeepDives = filledLongform.deepDives.map((item) => {
    const toolMeta = item.toolSlug ? toolsBySlug.get(item.toolSlug) : undefined;
    return sanitizeDeepDiveLabels(item, toolMeta);
  });
  const enrichedMoreAlternatives = filledLongform.moreAlternatives.map((item) => {
    const toolMeta = item.toolSlug ? toolsBySlug.get(item.toolSlug) : undefined;
    return sanitizeDeepDiveLabels(item, toolMeta);
  });
  const enrichedFaqs = ensureFaqFloor(filledLongform.faqs, `${tool.name} alternatives`);
  const cardsBySlug = new Map(uniqueCards.map((card) => [card.slug, card]));
  const comparisonRows = mapToolComparisonRows(enrichedDeepDives, cardsBySlug);
  const readiness = evaluateContentReady({
    tldrBuckets,
    decisionCriteria: DEFAULT_DECISION_CRITERIA,
    comparisonRows,
    deepDives: enrichedDeepDives,
    faqs: enrichedFaqs,
  });

  const seoYear = getSEOCurrentYear();
  const heroToolNames = topPicks.slice(0, 3).map((item) => item.toolName);
  const heroConclusion = heroToolNames.length > 0
    ? `Top options in this guide include ${formatToolNameList(heroToolNames)}, compared for cost control, output quality, and workflow speed.`
    : `Use this guide to evaluate ${tool.name} alternatives by cost control, output quality, and workflow speed.`;
  const finalTopPicksLimit = Math.min(6, enrichedDeepDives.length);

  const auditDebugPayload = process.env.ALT_AUDIT === '1' ? {
    baseIntent,
    intentBuckets,
    intentGatedSlugs,
    diversifiedCandidateSlugs,
    featuredPreferenceOrder: getFeaturedPreferenceOrder(slug, topCandidateDeepDives),
    featuredAdjusted,
    guardedAfterPostRerank,
    top6Constraint,
    postFeaturedTopPickSlugs,
    postFeaturedDeepDiveSlugs,
    fillerDeepDiveSlugs: fillerDeepDives.map((d) => d.toolSlug),
    injectedDeepDiveSlugs: featuredAdjusted.injectedDeepDiveItems.map((d) => d.toolSlug),
    topCandidateDeepDives: topCandidateDeepDives.map((d) => ({ slug: d.toolSlug, bestFor: d.bestFor, strengths: d.strengths })),
    rawCandidateSlugs,
    diversityAuditTraceBySlug,
  } : undefined;

  return {
    pageKind: 'tool',
    slug,
    title: `${tool.name} Alternatives (${seoYear}): Best Replacements by Use Case`,
    heroConclusion,
    heroUpdatedAt: getCurrentMonthYear(),
    heroCtas: [
      { label: `Try ${tool.name}`, href: tool.affiliate_link || `/tool/${slug}` },
      { label: 'View Pricing', href: `/tool/${slug}/pricing` },
    ],
    tldrBuckets,
    decisionCriteria: DEFAULT_DECISION_CRITERIA,
    comparisonRows,
    deepDives: enrichedDeepDives,
    topPicks,
    moreAlternatives: enrichedMoreAlternatives,
    topPicksLimit: finalTopPicksLimit,
    atAGlanceRows: enrichedDeepDives.map((item) => ({
      toolName: item.toolName,
      toolSlug: item.toolSlug,
      bestFor: item.bestFor,
    })),
    arcadeIntersection: arcadeIntersection
      ? {
          referenceTools: ARCADE_INVIDEO_REFERENCE_TOOLS,
          intersected: arcadeIntersection.intersected,
          missingFromSite: arcadeIntersection.missingFromSite,
          aliasRules: arcadeIntersection.aliasRules,
        }
      : undefined,
    faqs: enrichedFaqs,
    tocSections: [
      { id: 'hero', label: 'Hero' },
      { id: 'tldr', label: 'TL;DR' },
      { id: 'how-to-choose', label: 'How to choose' },
      { id: 'comparison-table', label: 'Comparison table' },
      { id: 'deep-dives', label: 'Deep dives' },
      { id: 'faq', label: 'FAQ' },
    ],
    canonicalPath: `/tool/${slug}/alternatives`,
    contentReady: readiness.ready,
    contentGapReason: readiness.reason,
    notSureHref: '/alternatives',
    ...(auditDebugPayload ? { _debugTrace: auditDebugPayload } : {}),
    toolSummary: {
      toolName: tool.name,
      rating: tool.rating,
      startingPrice: tool.starting_price,
      conclusion: heroConclusion,
      ctas: [
        { label: 'Try now', href: tool.affiliate_link || `/tool/${slug}` },
        { label: 'View pricing', href: `/tool/${slug}/pricing` },
      ],
      reviewHref: `/tool/${slug}`,
    },
  };
}

function parseTopicPricing(pricingNote: string): {
  price: string;
  freeVersion: string;
  watermark: string;
  exportLimits: string;
} {
  const line = sanitizeSentence(pricingNote) || 'Pricing varies by plan.';
  const lower = line.toLowerCase();

  const freeVersion = lower.includes('free') ? 'Has free plan or trial' : 'Free plan details vary by tool';
  const watermark = lower.includes('watermark')
    ? line
    : 'Watermark rules vary by plan';

  const exportLimits = lower.includes('1080p') || lower.includes('4k') || lower.includes('export')
    ? line
    : 'Export limits vary by plan';

  return {
    price: line,
    freeVersion,
    watermark,
    exportLimits,
  };
}

function defaultTopicFaqs(topicTitle: string): AlternativesFaq[] {
  return [
    {
      question: `What is the best free option in ${topicTitle}?`,
      answer: 'Start with tools that publish free-plan limits clearly. Hidden credit limits are usually the biggest blocker.',
    },
    {
      question: 'Will exports include a watermark?',
      answer: 'Most free plans watermark outputs. Always verify watermark policy before client delivery.',
    },
    {
      question: 'Can I use these tools for commercial projects?',
      answer: 'Usually yes on paid tiers, but stock media rights and generated asset licensing can differ by vendor.',
    },
    {
      question: 'How should teams evaluate refunds?',
      answer: 'Check billing cadence, cancellation cutoffs, and refund eligibility before annual contracts.',
    },
    {
      question: 'Do browser-based editors fail on long exports?',
      answer: 'They can. Use supported browsers, keep versions incremental, and maintain a local backup workflow.',
    },
    {
      question: 'How many tools should we trial before buying?',
      answer: 'Shortlist three tools max, run the same script and export test, then compare cost per usable result.',
    },
  ];
}

export function getTopicAlternativesSlugs(): string[] {
  const dir = path.join(process.cwd(), 'data', 'topics');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .sort();
}

export function readTopicAlternativesData(slug: string): TopicAlternativesData | null {
  const filePath = path.join(process.cwd(), 'data', 'topics', `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as TopicAlternativesData;

    if (!parsed || !parsed.title || !Array.isArray(parsed.tools)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildTopicAlternativesLongformData(slug: string): AlternativesTemplateData | null {
  const topic = readTopicAlternativesData(slug);
  if (!topic) return null;

  const toolByName = new Map(topic.tools.map((tool) => [tool.name.toLowerCase(), tool]));

  const tldrBuckets = topic.recommendedGroups.slice(0, 4).map((group) => ({
    id: group.id,
    title: group.title,
    items: group.toolNames.slice(0, 3).map((name) => {
      const tool = toolByName.get(name.toLowerCase());
      const mappedSlug = mapToolNameToSlug(name) || undefined;
      const href = mappedSlug ? `/tool/${mappedSlug}` : (tool?.visitUrl || '/alternatives');

      return {
        toolName: name,
        toolSlug: mappedSlug,
        why: sanitizeLabel(tool?.bestFor || '', [group.why, name]) || group.why,
        href,
      };
    }),
  }));

  const deepDives: AlternativesDeepDive[] = topic.tools.slice(0, 8).map((tool) => {
    const mappedSlug = mapToolNameToSlug(tool.name) || undefined;
    const fallbackInternal = mappedSlug ? `/tool/${mappedSlug}` : '/alternatives';
    const mappedTool = mappedSlug ? getToolBySlug(mappedSlug)?.tool : undefined;
    const sourceUrls = uniqueStrings([
      ...tool.sourceUrls.map((item) => cleanText(item) || '').filter(Boolean),
      ...(mappedSlug ? [`/tool/${mappedSlug}/pricing`, `/tool/${mappedSlug}/reviews`] : []),
      tool.visitUrl,
    ]).slice(0, 4);
    const image = mappedSlug ? resolveLocalDeepDiveImage(mappedSlug) : undefined;
    const imageSourceUrl = pickImageSourceUrl(sourceUrls, tool.visitUrl || fallbackInternal);
    const topicBestFor = sanitizeLabel(tool.bestFor, [
      tool.name,
      ...(tool.strengths || []),
      ...(tool.tradeoffs || []),
      mappedTool?.best_for || '',
      ...(mappedTool?.tags || []),
      ...(mappedTool?.categories || []),
    ]) || inferBestForFromTool(mappedTool);

    return {
      toolName: tool.name,
      toolSlug: mappedSlug,
      logoUrl: mappedTool?.logo_url || undefined,
      image,
      imageSourceUrl,
      bestFor: topicBestFor,
      strengths: sanitizeSentenceList(tool.strengths).slice(0, 3),
      tradeoffs: sanitizeSentenceList(tool.tradeoffs).slice(0, 2),
      pricingStarting: sanitizeSentence(tool.pricingNote) || 'Pricing varies by plan.',
      ctaHref: cleanText(tool.visitUrl) || fallbackInternal,
      ctaLabel: 'Try now',
      sourceUrls,
    };
  });

  const comparisonRows: AlternativesComparisonRow[] = deepDives.slice(0, 6).map((deepDive) => {
    const sourceTool = topic.tools.find((tool) => tool.name === deepDive.toolName);
    const pricing = parseTopicPricing(sourceTool?.pricingNote || 'Pricing varies by plan.');

    const editingControl = (sourceTool?.strengths || []).some((line) => line.toLowerCase().includes('timeline') || line.toLowerCase().includes('edit'))
      ? 'Hands-on editing available'
      : 'Guided workflow';

    return {
      toolName: deepDive.toolName,
      toolSlug: deepDive.toolSlug,
      price: pricing.price,
      freeVersion: pricing.freeVersion,
      watermark: pricing.watermark,
      exportLimits: pricing.exportLimits,
      editingControl,
      bestFor: deepDive.bestFor,
      mainTradeoff: sanitizeSentence(deepDive.tradeoffs[0]) || 'Trade-offs vary by workflow',
    };
  });

  const faqSource = topic.faqs && topic.faqs.length > 0 ? topic.faqs : defaultTopicFaqs(topic.title);
  const finalFaqs = ensureFaqFloor(faqSource, topic.title);

  const readiness = evaluateContentReady({
    tldrBuckets,
    decisionCriteria: topic.decisionCriteria,
    comparisonRows,
    deepDives,
    faqs: finalFaqs,
  });

  return {
    pageKind: 'topic',
    slug,
    title: `${topic.title} Alternatives (${getSEOCurrentYear()}): Best Picks by Workflow`,
    heroConclusion: cleanText(topic.intro) || 'Use these alternatives to choose by workflow and team constraints.',
    heroUpdatedAt: cleanText(topic.updatedAt || '') || getCurrentMonthYear(),
    heroCtas: [
      { label: 'Jump to Picks', href: '#deep-dives' },
      { label: 'Browse Hub', href: '/alternatives' },
    ],
    tldrBuckets,
    decisionCriteria: topic.decisionCriteria,
    comparisonRows,
    deepDives,
    faqs: finalFaqs,
    tocSections: [
      { id: 'hero', label: 'Hero' },
      { id: 'tldr', label: 'TL;DR' },
      { id: 'how-to-choose', label: 'How to choose' },
      { id: 'comparison-table', label: 'Comparison table' },
      { id: 'deep-dives', label: 'Deep dives' },
      { id: 'faq', label: 'FAQ' },
    ],
    canonicalPath: `/alternatives/topic/${slug}`,
    contentReady: readiness.ready,
    contentGapReason: readiness.reason,
    notSureHref: '/alternatives',
  };
}

export async function getAlternativesHubData(): Promise<{
  tools: Array<{ name: string; slug: string; href: string; summary: string }>;
  topics: Array<{ title: string; slug: string; href: string; intro: string }>;
}> {
  const { filterPromoteSafeLinks } = await import('@/lib/readiness');
  const toolCandidates = getAllTools()
    .slice()
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 24)
    .map((tool) => ({
      kind: 'toolAlternatives' as const,
      name: tool.name,
      slug: tool.slug,
      href: `/tool/${tool.slug}/alternatives`,
      summary: `Compare by pricing, editing control, and workflow speed for ${tool.name}.`,
    }));

  const topicCandidates = getTopicAlternativesSlugs()
    .map((slug) => {
      const topic = readTopicAlternativesData(slug);
      if (!topic) return null;
      return {
        kind: 'alternativesTopic' as const,
        title: topic.title,
        slug,
        href: `/alternatives/topic/${slug}`,
        intro: topic.intro,
      };
    })
    .filter(
      (
        item
      ): item is {
        kind: 'alternativesTopic';
        title: string;
        slug: string;
        href: string;
        intro: string;
      } => Boolean(item)
    );

  const tools = (await filterPromoteSafeLinks(toolCandidates)).map((item) => ({
    name: item.name,
    slug: item.slug,
    href: item.href,
    summary: item.summary,
  }));
  const topics = (await filterPromoteSafeLinks(topicCandidates)).map((item) => ({
    title: item.title,
    slug: item.slug,
    href: item.href,
    intro: item.intro,
  }));

  return { tools, topics };
}

export function isAlternativesPageThin(data: AlternativesTemplateData | null): boolean {
  if (!data) return true;
  return !data.contentReady;
}

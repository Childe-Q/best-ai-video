import fs from 'fs';
import path from 'path';
import { getAllTools, getTool } from '@/lib/getTool';
import { getCurrentMonthYear, getSEOCurrentYear } from '@/lib/utils';
import { generateSmartFAQs } from '@/lib/generateSmartFAQs';
import { loadToolContent } from '@/lib/loadToolContent';
import { canonicalAlternativesConfigs } from '@/data/alternatives/canonical';
import { alternativesEvidence, ToolAlternativeEvidence } from '@/data/evidence/alternatives';
import { mergeCanonicalAndEvidence } from '@/lib/alternatives/mergeCanonicalAndEvidence';
import { getEvidenceSources } from '@/lib/evidence/readEvidence';
import { mapToolNameToSlug } from '@/lib/alternatives/mapToolNameToSlug';
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

const FEATURED_POOL_CANONICAL = ['invideo', 'heygen', 'fliki'];
const FEATURED_POOL_ALIAS_TO_CANONICAL: Record<string, string> = {
  'in-video': 'invideo',
  'invideo ai': 'invideo',
  'hey-gen': 'heygen',
  'fliki ai': 'fliki',
};

const INVIDEO_TOP_DENYLIST = new Set(['pictory']);
const INVIDEO_TOP_PICKS_FEATURED_POOL = ['heygen', 'fliki'];

const LOCAL_IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'svg'];

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

function ensureFeaturedPresenceInTopPicks({
  baseToolSlug,
  topCandidates,
  toolsBySlug,
  featuredPool = ['heygen', 'fliki'],
  k = 4,
  mustHave = 1,
}: {
  baseToolSlug: string;
  topCandidates: AlternativesDeepDive[];
  toolsBySlug: Map<string, Tool>;
  featuredPool?: string[];
  k?: number;
  mustHave?: number;
}): TopPickItem[] {
  const normalizedBase = toFeaturedCanonicalSlug(baseToolSlug);
  const normalizedFeaturedPool = featuredPool.map((slug) => toFeaturedCanonicalSlug(slug));

  const candidateItems = topCandidates
    .filter((item) => item.toolSlug !== normalizedBase)
    .map((item) => ({
      toolName: item.toolName,
      toolSlug: item.toolSlug,
      href: item.toolSlug ? `/tool/${item.toolSlug}` : item.ctaHref,
    }));

  const topPicks: TopPickItem[] = [];
  const seen = new Set<string>();
  candidateItems.forEach((item) => {
    if (topPicks.length >= k) return;
    const key = uniqueTopPickKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    topPicks.push(item);
  });

  const countFeaturedInFirstThree = () =>
    topPicks.slice(0, 3).filter((item) => {
      if (!item.toolSlug) return false;
      return normalizedFeaturedPool.includes(toFeaturedCanonicalSlug(item.toolSlug));
    }).length;

  if (normalizedBase !== 'invideo' || countFeaturedInFirstThree() >= mustHave) {
    return topPicks.slice(0, k);
  }

  for (const featuredSlug of normalizedFeaturedPool) {
    if (featuredSlug === normalizedBase) continue;
    const featuredTool = toolsBySlug.get(featuredSlug);
    if (!featuredTool) continue;

    const existingIndex = topPicks.findIndex((item) => item.toolSlug === featuredSlug);
    const insertIndex = Math.min(1, topPicks.length);

    if (existingIndex >= 0) {
      const [picked] = topPicks.splice(existingIndex, 1);
      topPicks.splice(insertIndex, 0, picked);
    } else {
      const injected: TopPickItem = {
        toolName: featuredTool.name,
        toolSlug: featuredTool.slug,
        href: `/tool/${featuredTool.slug}`,
      };
      topPicks.splice(insertIndex, 0, injected);
    }

    const deduped: TopPickItem[] = [];
    const dedupeSeen = new Set<string>();
    topPicks.forEach((item) => {
      const key = uniqueTopPickKey(item);
      if (dedupeSeen.has(key)) return;
      dedupeSeen.add(key);
      deduped.push(item);
    });

    topPicks.splice(0, topPicks.length, ...deduped.slice(0, k));

    if (countFeaturedInFirstThree() >= mustHave) {
      break;
    }
  }

  return topPicks.slice(0, k);
}

function prioritizeDeepDivesWithFeaturedPool(
  candidates: AlternativesDeepDive[],
  limit: number
): AlternativesDeepDive[] {
  if (limit <= 0) return [];

  const featuredSet = new Set(FEATURED_POOL_CANONICAL);
  const featuredCandidates = candidates.filter((item) => {
    if (!item.toolSlug) return false;
    return featuredSet.has(toFeaturedCanonicalSlug(item.toolSlug));
  });

  if (featuredCandidates.length === 0) {
    return candidates.slice(0, limit);
  }

  const topList: AlternativesDeepDive[] = [];
  const seen = new Set<string>();

  featuredCandidates.slice(0, 3).forEach((item) => {
    if (topList.length >= limit) return;
    const key = uniqueDeepDiveKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    topList.push(item);
  });

  candidates.forEach((item) => {
    if (topList.length >= limit) return;
    const key = uniqueDeepDiveKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    topList.push(item);
  });

  return topList;
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
  const tool = getTool(slug);
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
      const hasBestFor = (tool.bestFor || []).some((line) => Boolean(cleanText(line)));
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
    bestFor: (tool.bestFor || []).map((line) => cleanText(line) || '').filter(Boolean),
    pickThisIf: cleanText((tool as any).pickThisIf || null) || undefined,
    extraReason: cleanText((tool as any).extraReason || null) || undefined,
    limitations: cleanText((tool as any).limitations || null) || undefined,
    pricingSignals: tool.pricingSignals || {},
    startingPrice: tool.startingPrice || 'Need verification',
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
    const strengths = uniqueStrings(
      [
        cleanText(card.pickThisIf || null) || '',
        cleanText(card.extraReason || null) || '',
        cleanText(card.pricingSignals.freePlan || null) || '',
        cleanText(card.pricingSignals.exportQuality || null) || '',
      ].filter(Boolean)
    ).slice(0, 3);

    if (strengths.length === 0) {
      strengths.push(`Strong fit for ${card.bestFor[0] || card.groupTitle.toLowerCase()}.`);
    }

    const tradeoffs = uniqueStrings([
      cleanText(card.limitations || null) || '',
      cleanText(card.pricingSignals.refundCancel || null) || '',
    ].filter(Boolean)).slice(0, 2);

    if (tradeoffs.length === 0) {
      tradeoffs.push('Need verification from latest docs and reviewer feedback.');
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
      bestFor: card.bestFor[0] || card.groupTitle,
      strengths,
      tradeoffs,
      pricingStarting: cleanText(card.startingPrice) || 'Need verification',
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

    return {
      toolName: deepDive.toolName,
      toolSlug: deepDive.toolSlug,
      price: deepDive.pricingStarting,
      freeVersion: cleanText(card?.pricingSignals.freePlan || null)
        || ((card?.startingPrice || '').toLowerCase().includes('free') ? 'Has free plan' : 'Need verification'),
      watermark: cleanText(card?.pricingSignals.watermark || null) || 'Need verification',
      exportLimits: cleanText(card?.pricingSignals.exportQuality || null) || 'Need verification',
      editingControl: card ? mapEditingControl(card) : 'Need verification',
      bestFor: deepDive.bestFor,
      mainTradeoff: deepDive.tradeoffs[0] || 'Need verification',
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
  const tool = getTool(slug);
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

  const tldrBuckets = rawTldrBuckets.map((bucket) => ({
    ...bucket,
    items: arcadeIntersection
      ? bucket.items.filter((item) => item.toolSlug && arcadeIntersection.keepSlugs.has(item.toolSlug))
      : bucket.items,
  }));

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
  const deniedTopCandidates = slug === 'invideo'
    ? candidateDeepDives.filter((item) => item.toolSlug && INVIDEO_TOP_DENYLIST.has(item.toolSlug))
    : [];
  const topCandidateDeepDives = slug === 'invideo'
    ? candidateDeepDives.filter((item) => !item.toolSlug || !INVIDEO_TOP_DENYLIST.has(item.toolSlug))
    : candidateDeepDives;
  const toolsBySlug = new Map(getAllTools().map((item) => [item.slug, item]));
  const topPicks = ensureFeaturedPresenceInTopPicks({
    baseToolSlug: slug,
    topCandidates: topCandidateDeepDives,
    toolsBySlug,
    featuredPool: INVIDEO_TOP_PICKS_FEATURED_POOL,
    k: 5,
    mustHave: 1,
  });
  const baseLimit = Math.min(6, topCandidateDeepDives.length);
  const deepDives = prioritizeDeepDivesWithFeaturedPool(topCandidateDeepDives, baseLimit);
  const topDeepDiveKeys = new Set(deepDives.map((item) => uniqueDeepDiveKey(item)));

  const remainingCandidateDeepDives = topCandidateDeepDives.filter((item) => !topDeepDiveKeys.has(uniqueDeepDiveKey(item)));
  const nonIntersectionDeepDives = arcadeIntersection
    ? allDeepDives.filter((item) => !item.toolSlug || !arcadeIntersection.keepSlugs.has(item.toolSlug))
    : [];
  const moreAlternatives = uniqueStrings(
    [...remainingCandidateDeepDives, ...deniedTopCandidates, ...nonIntersectionDeepDives].map((item) => uniqueDeepDiveKey(item))
  )
    .map((key) => [...remainingCandidateDeepDives, ...deniedTopCandidates, ...nonIntersectionDeepDives].find((item) => uniqueDeepDiveKey(item) === key))
    .filter((item): item is AlternativesDeepDive => Boolean(item));
  const deepDiveBySlug = new Map(allDeepDives.map((item) => [item.toolSlug || '', item]));
  const topOrderedDeepDives = topPicks
    .map((item) => (item.toolSlug ? deepDiveBySlug.get(item.toolSlug) : undefined))
    .filter((item): item is AlternativesDeepDive => Boolean(item));
  const finalDeepDives = topOrderedDeepDives.length > 0 ? topOrderedDeepDives : deepDives;
  const finalDeepDiveKeys = new Set(finalDeepDives.map((item) => uniqueDeepDiveKey(item)));
  const finalMoreAlternatives = moreAlternatives.filter((item) => !finalDeepDiveKeys.has(uniqueDeepDiveKey(item)));

  const cardsBySlug = new Map(uniqueCards.map((card) => [card.slug, card]));
  const comparisonRows = mapToolComparisonRows(finalDeepDives, cardsBySlug);

  const content = loadToolContent(slug);
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
  const readiness = evaluateContentReady({
    tldrBuckets,
    decisionCriteria: DEFAULT_DECISION_CRITERIA,
    comparisonRows,
    deepDives: finalDeepDives,
    faqs: finalFaqs,
  });

  const seoYear = getSEOCurrentYear();
  const heroToolNames = topPicks.slice(0, 3).map((item) => item.toolName);
  const heroConclusion = heroToolNames.length > 0
    ? `Top options in this guide include ${formatToolNameList(heroToolNames)}, compared for cost control, output quality, and workflow speed.`
    : `Use this guide to evaluate ${tool.name} alternatives by cost control, output quality, and workflow speed.`;
  const topPicksLimit = Math.min(6, finalDeepDives.length);

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
    deepDives: finalDeepDives,
    topPicks,
    moreAlternatives: finalMoreAlternatives,
    topPicksLimit,
    atAGlanceRows: finalDeepDives.map((item) => ({
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
    faqs: finalFaqs,
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
  const line = pricingNote || 'Need verification';
  const lower = line.toLowerCase();

  const freeVersion = lower.includes('free') ? 'Has free plan or trial' : 'Need verification';
  const watermark = lower.includes('watermark')
    ? line
    : 'Need verification';

  const exportLimits = lower.includes('1080p') || lower.includes('4k') || lower.includes('export')
    ? line
    : 'Need verification';

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
        why: tool?.bestFor || group.why,
        href,
      };
    }),
  }));

  const deepDives: AlternativesDeepDive[] = topic.tools.slice(0, 8).map((tool) => {
    const mappedSlug = mapToolNameToSlug(tool.name) || undefined;
    const fallbackInternal = mappedSlug ? `/tool/${mappedSlug}` : '/alternatives';
    const mappedTool = mappedSlug ? getTool(mappedSlug) : undefined;
    const sourceUrls = uniqueStrings([
      ...tool.sourceUrls.map((item) => cleanText(item) || '').filter(Boolean),
      ...(mappedSlug ? [`/tool/${mappedSlug}/pricing`, `/tool/${mappedSlug}/reviews`] : []),
      tool.visitUrl,
    ]).slice(0, 4);
    const image = mappedSlug ? resolveLocalDeepDiveImage(mappedSlug) : undefined;
    const imageSourceUrl = pickImageSourceUrl(sourceUrls, tool.visitUrl || fallbackInternal);

    return {
      toolName: tool.name,
      toolSlug: mappedSlug,
      logoUrl: mappedTool?.logo_url || undefined,
      image,
      imageSourceUrl,
      bestFor: cleanText(tool.bestFor) || 'Need verification',
      strengths: uniqueStrings(tool.strengths.map((item) => cleanText(item) || '').filter(Boolean)).slice(0, 3),
      tradeoffs: uniqueStrings(tool.tradeoffs.map((item) => cleanText(item) || '').filter(Boolean)).slice(0, 2),
      pricingStarting: cleanText(tool.pricingNote) || 'Need verification',
      ctaHref: cleanText(tool.visitUrl) || fallbackInternal,
      ctaLabel: 'Try now',
      sourceUrls,
    };
  });

  const comparisonRows: AlternativesComparisonRow[] = deepDives.slice(0, 6).map((deepDive) => {
    const sourceTool = topic.tools.find((tool) => tool.name === deepDive.toolName);
    const pricing = parseTopicPricing(sourceTool?.pricingNote || 'Need verification');

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
      mainTradeoff: deepDive.tradeoffs[0] || 'Need verification',
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

export function getAlternativesHubData(): {
  tools: Array<{ name: string; slug: string; href: string; summary: string }>;
  topics: Array<{ title: string; slug: string; href: string; intro: string }>;
} {
  const tools = getAllTools()
    .slice()
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 24)
    .map((tool) => ({
      name: tool.name,
      slug: tool.slug,
      href: `/tool/${tool.slug}/alternatives`,
      summary: `Compare by pricing, editing control, and workflow speed for ${tool.name}.`,
    }));

  const topics = getTopicAlternativesSlugs()
    .map((slug) => {
      const topic = readTopicAlternativesData(slug);
      if (!topic) return null;
      return {
        title: topic.title,
        slug,
        href: `/alternatives/topic/${slug}`,
        intro: topic.intro,
      };
    })
    .filter((item): item is { title: string; slug: string; href: string; intro: string } => Boolean(item));

  return { tools, topics };
}

export function isAlternativesPageThin(data: AlternativesTemplateData | null): boolean {
  if (!data) return true;
  return !data.contentReady;
}

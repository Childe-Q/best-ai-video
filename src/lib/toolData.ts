import '@/lib/optionalServerOnly';

import { getAllTools as getRegistryTools, getTool as getRegistryTool } from '@/lib/getTool';
import { loadToolContent } from '@/lib/loadToolContent';
import toolsSourceData from '@/data/sources/tools.sources.json';
import elaiPricingData from '@/data/pricing/elai-io.json';
import heygenPricingData from '@/data/pricing/heygen.json';
import pikaPricingData from '@/data/pricing/pika.json';
import synthesiaPricingData from '@/data/pricing/synthesia.json';
import veedPricingData from '@/data/pricing/veed-io.json';
import zebracatPricingData from '@/data/pricing/zebracat.json';
import type { Tool } from '@/types/tool';
import type { ToolContent } from '@/types/toolContent';
import type { ComparisonTable } from '@/types/tool';

type ToolPageContent = NonNullable<Tool['content']>;
type ToolPricingContent = NonNullable<ToolPageContent['pricing']>;
type ToolMiniTest = NonNullable<NonNullable<ToolPageContent['overview']>['miniTest']>;
type ToolVerdict = NonNullable<ToolPricingContent['verdict']>;

export type UnifiedTool = Omit<Tool, 'content' | 'pros' | 'cons'> & {
  content: ToolPageContent;
  pros: string[];
  cons: string[];
};

export type ToolDataEntry = {
  tool: UnifiedTool;
  content: ToolPageContent;
  pricing: ToolPricingContent | null;
  limits: string[] | null;
  miniTest: ToolMiniTest | null;
  verdict: ToolVerdict | null;
  officialPricingUrl: string | null;
  comparisonTable: ComparisonTable | null;
  editorialContent: ToolContent | null;
};

type ToolSourceRecord = {
  slug: string;
  sources?: {
    pricing?: {
      url?: string;
    };
  };
};

type LegacyPricingFile = {
  comparison_table?: ComparisonTable;
};

const TOOL_SOURCE_MAP = new Map(
  (toolsSourceData as ToolSourceRecord[]).map((record) => [record.slug, record] as const),
);

const LEGACY_PRICING_TABLE_MAP: Record<string, ComparisonTable | null> = {
  'elai-io': (elaiPricingData as LegacyPricingFile).comparison_table ?? null,
  heygen: (heygenPricingData as LegacyPricingFile).comparison_table ?? null,
  pika: (pikaPricingData as LegacyPricingFile).comparison_table ?? null,
  synthesia: (synthesiaPricingData as LegacyPricingFile).comparison_table ?? null,
  'veed-io': (veedPricingData as LegacyPricingFile).comparison_table ?? null,
  zebracat: (zebracatPricingData as LegacyPricingFile).comparison_table ?? null,
};

function getOfficialPricingUrl(slug: string): string | null {
  return TOOL_SOURCE_MAP.get(slug)?.sources?.pricing?.url ?? null;
}

function getComparisonTable(tool: UnifiedTool): ComparisonTable | null {
  return tool.comparison_table ?? LEGACY_PRICING_TABLE_MAP[tool.slug] ?? null;
}

function withNullIfEmpty<T extends object>(value: T | undefined): T | null {
  if (!value) {
    return null;
  }

  return Object.keys(value).length > 0 ? value : null;
}

function mergeToolContent(base?: Tool['content'], editorial?: ToolContent | null): ToolPageContent {
  const editorialAlternatives = (editorial as Tool['content'] | null)?.alternatives;

  const mergedOverview = withNullIfEmpty({
    ...(base?.overview ?? {}),
    ...(editorial?.overview ?? {}),
    ...(editorial?.overview?.tldr ? { tldr: editorial.overview.tldr } : {}),
    ...(editorial?.overview?.miniTest ? { miniTest: editorial.overview.miniTest } : {}),
    ...(editorial?.overview?.useCases ? { useCases: editorial.overview.useCases } : {}),
    ...(editorial?.overview?.output ? { output: editorial.overview.output } : {}),
  });

  const mergedPricing = withNullIfEmpty({
    ...(base?.pricing ?? {}),
    ...(editorial?.pricing ?? {}),
    ...(editorial?.pricing?.snapshot ? { snapshot: editorial.pricing.snapshot } : {}),
    ...(editorial?.pricing?.creditUsage ? { creditUsage: editorial.pricing.creditUsage } : {}),
    ...(editorial?.pricing?.planPicker ? { planPicker: editorial.pricing.planPicker } : {}),
    ...(editorial?.pricing?.verdict ? { verdict: editorial.pricing.verdict } : {}),
    ...(Object.prototype.hasOwnProperty.call(editorial?.pricing ?? {}, 'limits')
      ? { limits: editorial?.pricing?.limits ?? null }
      : {}),
  });

  const mergedFeatures = withNullIfEmpty({
    ...(base?.features ?? {}),
    ...(editorial?.features ?? {}),
    ...(editorial?.features?.keyFeatures ? { keyFeatures: editorial.features.keyFeatures } : {}),
    ...(editorial?.features?.detailedFeatures
      ? { detailedFeatures: editorial.features.detailedFeatures }
      : {}),
  });

  const mergedReviews = withNullIfEmpty({
    ...(base?.reviews ?? {}),
    ...(editorial?.reviews ?? {}),
    ...(editorial?.reviews?.userSentiment ? { userSentiment: editorial.reviews.userSentiment } : {}),
    ...(editorial?.reviews?.faqs ? { faqs: editorial.reviews.faqs } : {}),
    ...(editorial?.reviews?.verdict ? { verdict: editorial.reviews.verdict } : {}),
    ...((base?.reviews?.reviewHighlights || editorial?.reviews?.reviewHighlights)
      ? {
          reviewHighlights: {
            likes:
              editorial?.reviews?.reviewHighlights?.likes ??
              base?.reviews?.reviewHighlights?.likes ??
              [],
            complaints:
              editorial?.reviews?.reviewHighlights?.complaints ??
              base?.reviews?.reviewHighlights?.complaints ??
              [],
            ...(editorial?.reviews?.reviewHighlights?.commonIssues ||
            base?.reviews?.reviewHighlights?.commonIssues
              ? {
                  commonIssues:
                    editorial?.reviews?.reviewHighlights?.commonIssues ??
                    base?.reviews?.reviewHighlights?.commonIssues,
                }
              : {}),
          },
        }
      : {}),
  });

  const mergedAlternatives = withNullIfEmpty({
    ...(base?.alternatives ?? {}),
    ...(editorialAlternatives ?? {}),
    ...(editorialAlternatives?.topAlternatives ? { topAlternatives: editorialAlternatives.topAlternatives } : {}),
  });

  const mergedRelated = withNullIfEmpty({
    ...(base?.related ?? {}),
    ...(editorial?.related ?? {}),
    ...(editorial?.related?.comparisons ? { comparisons: editorial.related.comparisons } : {}),
    ...(editorial?.related?.alternatives ? { alternatives: editorial.related.alternatives } : {}),
  });

  const mergedSources =
    base?.sources || editorial?.sources
      ? {
          ...(base?.sources ?? {}),
          ...(editorial?.sources ?? {}),
        }
      : undefined;

  return {
    ...(mergedOverview ? { overview: mergedOverview } : {}),
    ...(mergedPricing ? { pricing: mergedPricing } : {}),
    ...(mergedFeatures ? { features: mergedFeatures } : {}),
    ...(mergedReviews ? { reviews: mergedReviews } : {}),
    ...(mergedAlternatives ? { alternatives: mergedAlternatives } : {}),
    ...(mergedSources ? { sources: mergedSources } : {}),
    ...(mergedRelated ? { related: mergedRelated } : {}),
  } as ToolPageContent;
}

function toUnifiedTool(tool: Tool): UnifiedTool {
  const editorialContent = loadToolContent(tool.slug);
  const mergedContent = mergeToolContent(tool.content, editorialContent);

  return {
    ...tool,
    content: mergedContent,
    pros: editorialContent?.pros ?? tool.pros ?? [],
    cons: editorialContent?.cons ?? tool.cons ?? [],
  };
}

let cachedTools: UnifiedTool[] | null = null;

function getCachedTools(): UnifiedTool[] {
  if (!cachedTools) {
    cachedTools = getRegistryTools().map(toUnifiedTool);
  }

  return cachedTools;
}

export function getAllTools(): UnifiedTool[] {
  return getCachedTools();
}

export function getToolBySlug(slug: string): ToolDataEntry | undefined {
  const normalizedSlug = slug.toLowerCase().trim();
  const tool = getCachedTools().find((item) => item.slug.toLowerCase() === normalizedSlug);

  if (!tool) {
    const registryTool = getRegistryTool(slug);
    if (!registryTool) {
      return undefined;
    }

    const unifiedTool = toUnifiedTool(registryTool);
    return {
      tool: unifiedTool,
      content: unifiedTool.content,
      pricing: unifiedTool.content.pricing ?? null,
      limits: unifiedTool.content.pricing?.limits ?? null,
      miniTest: unifiedTool.content.overview?.miniTest ?? null,
      verdict: unifiedTool.content.pricing?.verdict ?? null,
      officialPricingUrl: getOfficialPricingUrl(unifiedTool.slug),
      comparisonTable: getComparisonTable(unifiedTool),
      editorialContent: loadToolContent(unifiedTool.slug),
    };
  }

  return {
    tool,
    content: tool.content,
    pricing: tool.content.pricing ?? null,
    limits: tool.content.pricing?.limits ?? null,
    miniTest: tool.content.overview?.miniTest ?? null,
    verdict: tool.content.pricing?.verdict ?? null,
    officialPricingUrl: getOfficialPricingUrl(tool.slug),
    comparisonTable: getComparisonTable(tool),
    editorialContent: loadToolContent(tool.slug),
  };
}

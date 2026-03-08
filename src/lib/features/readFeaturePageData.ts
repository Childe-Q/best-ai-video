import 'server-only';

import fs from 'fs';
import path from 'path';
import { FeaturePageData, FeatureGroup, FeatureHero, FeatureHowToChoose, FeatureRecommendedReading, FeatureToolCard } from '@/types/featurePage';
import { NormalizedFeaturePage } from '@/types/normalizedFeaturePage';

const FEATURES_DATA_DIR = path.join(process.cwd(), 'src', 'data', 'features');
const NORMALIZED_FEATURES_DATA_DIR = path.join(FEATURES_DATA_DIR, 'normalized');
const SAFE_SLUG_PATTERN = /^[a-z0-9-]+$/;
const NORMALIZED_VALIDATION_SLUGS = new Set([
  'enterprise-ai-video-solutions',
  'ai-avatar-video-generators',
  'ai-video-editors',
  'ai-video-for-social-media',
  'ai-video-generators-comparison',
  'viral-ai-video-generators',
  'text-to-video-ai-tools',
  'budget-friendly-ai-video-tools',
  'content-repurposing-ai-tools',
  'professional-ai-video-tools',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function asOptionalString(value: unknown): string | null {
  return isNonEmptyString(value) ? value.trim() : null;
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function parseHero(raw: unknown): FeatureHero | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const hero = raw as Record<string, unknown>;
  const definitionBullets = Array.isArray(hero.definitionBullets)
    ? hero.definitionBullets.filter(isNonEmptyString).map((item) => item.trim())
    : [];

  if (!isNonEmptyString(hero.h1) || !isNonEmptyString(hero.subheadline)) {
    return null;
  }

  return {
    h1: hero.h1.trim(),
    subheadline: hero.subheadline.trim(),
    definitionBullets,
  };
}

function parseHowToChoose(raw: unknown): FeatureHowToChoose | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const howToChoose = raw as Record<string, unknown>;
  const criteria = Array.isArray(howToChoose.criteria)
    ? howToChoose.criteria
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const criterion = item as Record<string, unknown>;
          if (!isNonEmptyString(criterion.title)) {
            return null;
          }

          return {
            title: criterion.title.trim(),
            desc: asOptionalString(criterion.desc),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  return criteria.length > 0 ? { criteria } : undefined;
}

function parseTool(raw: unknown): FeatureToolCard | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const tool = raw as Record<string, unknown>;
  if (!isNonEmptyString(tool.toolSlug) || !isNonEmptyString(tool.reasonLine1)) {
    return null;
  }

  return {
    toolSlug: tool.toolSlug.trim(),
    name: asOptionalString(tool.name) ?? undefined,
    logoUrl: asOptionalString(tool.logoUrl),
    reasonLine1: tool.reasonLine1.trim(),
    reasonLine2: asOptionalString(tool.reasonLine2),
    pricingStartAt: asOptionalString(tool.pricingStartAt),
    watermarkPolicy: asOptionalString(tool.watermarkPolicy),
    bestFor: asOptionalString(tool.bestFor),
    mainTradeoff: asOptionalString(tool.mainTradeoff),
    hasReviewPage: asOptionalBoolean(tool.hasReviewPage),
    reviewUrl: asOptionalString(tool.reviewUrl),
    officialUrl: asOptionalString(tool.officialUrl),
    outboundUrl: asOptionalString(tool.outboundUrl),
  };
}

function parseGroups(raw: unknown): FeatureGroup[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  const groups = raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const group = item as Record<string, unknown>;
      if (!isNonEmptyString(group.groupTitle) || !Array.isArray(group.tools)) {
        return null;
      }

      const tools = group.tools.map(parseTool).filter((tool): tool is FeatureToolCard => tool !== null);
      if (tools.length === 0) {
        return null;
      }

      const groupSummary = asOptionalString(group.groupSummary);

      return {
        groupTitle: group.groupTitle.trim(),
        groupSummary: groupSummary ?? undefined,
        tools,
      };
    })
    .filter((group): group is NonNullable<typeof group> => group !== null);

  return groups.length > 0 ? groups : null;
}

function parseRecommendedReading(raw: unknown): FeatureRecommendedReading | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const data = raw as Record<string, unknown>;
  const tools = Array.isArray(data.tools) ? data.tools.filter(isNonEmptyString).map((item) => item.trim()) : [];
  const alternativesPages = Array.isArray(data.alternativesPages)
    ? data.alternativesPages.filter(isNonEmptyString).map((item) => item.trim())
    : [];
  const vsPages = Array.isArray(data.vsPages) ? data.vsPages.filter(isNonEmptyString).map((item) => item.trim()) : [];
  const guides = Array.isArray(data.guides) ? data.guides.filter(isNonEmptyString).map((item) => item.trim()) : [];

  if (tools.length + alternativesPages.length + vsPages.length + guides.length === 0) {
    return undefined;
  }

  return {
    tools,
    alternativesPages,
    vsPages,
    guides,
  };
}

function parseNormalizedFeaturePage(raw: unknown): NormalizedFeaturePage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Partial<NormalizedFeaturePage>;
  if (!isNonEmptyString(data.slug) || !isNonEmptyString(data.title) || !Array.isArray(data.groups) || !Array.isArray(data.tools)) {
    return null;
  }

  return data as NormalizedFeaturePage;
}

function mapNormalizedTool(tool: NormalizedFeaturePage['tools'][number]): FeatureToolCard | null {
  if (!isNonEmptyString(tool.slug) || !isNonEmptyString(tool.name)) {
    return null;
  }

  const verdictSeed = asOptionalString(tool.verdictSeed);
  if (!verdictSeed) {
    return null;
  }

  return {
    toolSlug: tool.slug.trim(),
    name: tool.name.trim(),
    logoUrl: asOptionalString(tool.logoUrl),
    reasonLine1: verdictSeed,
    pricingStartAt: asOptionalString(tool.pricingSeed),
    watermarkPolicy: asOptionalString(tool.policySeed),
    bestFor: asOptionalString(tool.bestForSeed),
    mainTradeoff: asOptionalString(tool.mainLimitationSeed),
    hasReviewPage: tool.hasReviewPage,
    reviewUrl: asOptionalString(tool.reviewUrl),
    officialUrl: asOptionalString(tool.officialUrl),
  };
}

function mapNormalizedFeaturePage(data: NormalizedFeaturePage): FeaturePageData | null {
  const toolMap = new Map<string, FeatureToolCard>();

  for (const tool of data.tools) {
    const mappedTool = mapNormalizedTool(tool);
    if (mappedTool) {
      toolMap.set(mappedTool.toolSlug, mappedTool);
    }
  }

  const groups: FeatureGroup[] = data.groups
    .map((group) => {
      if (!isNonEmptyString(group.title) || !Array.isArray(group.toolSlugs)) {
        return null;
      }

      const tools = group.toolSlugs
        .map((toolSlug) => toolMap.get(toolSlug))
        .filter((tool): tool is FeatureToolCard => Boolean(tool));

      if (tools.length === 0) {
        return null;
      }

      return {
        groupTitle: group.title.trim(),
        groupSummary: asOptionalString(group.rule) ?? undefined,
        tools,
      };
    })
    .filter((group): group is NonNullable<typeof group> => group !== null);

  if (groups.length === 0) {
    return null;
  }

  const boundaries = Array.isArray(data.summarySeed?.boundaries)
    ? data.summarySeed.boundaries.filter(isNonEmptyString).map((item) => item.trim())
    : [];

  const criteria = Array.isArray(data.howToChooseSeeds)
    ? data.howToChooseSeeds
        .map((item) => {
          const title = asOptionalString(item?.title);
          if (!title) {
            return null;
          }

          return {
            title,
            desc: asOptionalString(item?.desc),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const recommendedReading: FeatureRecommendedReading = {
    tools: Array.isArray(data.relatedLinks?.reviewSlugs) ? data.relatedLinks.reviewSlugs.filter(isNonEmptyString).map((item) => item.trim()) : [],
    alternativesPages: Array.isArray(data.relatedLinks?.alternativesSlugs)
      ? data.relatedLinks.alternativesSlugs.filter(isNonEmptyString).map((item) => `${item.trim()}/alternatives`)
      : [],
    vsPages: Array.isArray(data.relatedLinks?.vsSlugs) ? data.relatedLinks.vsSlugs.filter(isNonEmptyString).map((item) => item.trim()) : [],
    guides: Array.isArray(data.relatedLinks?.guideSlugs) ? data.relatedLinks.guideSlugs.filter(isNonEmptyString).map((item) => item.trim()) : [],
  };

  return {
    slug: data.slug,
    hero: {
      h1: data.title,
      subheadline: data.summarySeed.oneLiner,
      definitionBullets: boundaries,
    },
    howToChoose: criteria.length > 0 ? { criteria } : undefined,
    groups,
    recommendedReading:
      (recommendedReading.tools?.length || 0) +
        (recommendedReading.alternativesPages?.length || 0) +
        (recommendedReading.vsPages?.length || 0) +
        (recommendedReading.guides?.length || 0) >
      0
        ? recommendedReading
        : undefined,
  };
}

function readNormalizedFeaturePageData(slug: string): FeaturePageData | null {
  if (!NORMALIZED_VALIDATION_SLUGS.has(slug)) {
    return null;
  }

  try {
    const filePath = path.join(NORMALIZED_FEATURES_DATA_DIR, `${slug}.json`);
    const rawFile = fs.readFileSync(filePath, 'utf8');
    const parsed = parseNormalizedFeaturePage(JSON.parse(rawFile));
    if (!parsed) {
      return null;
    }
    return mapNormalizedFeaturePage(parsed);
  } catch {
    return null;
  }
}

export function getFeaturePageSlugs(): string[] {
  const directSlugs = (() => {
    try {
      return fs
        .readdirSync(FEATURES_DATA_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name.replace(/\.json$/, ''));
    } catch {
      return [] as string[];
    }
  })();

  const normalizedSlugs = (() => {
    try {
      return fs
        .readdirSync(NORMALIZED_FEATURES_DATA_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name.replace(/\.json$/, ''))
        .filter((slug) => NORMALIZED_VALIDATION_SLUGS.has(slug));
    } catch {
      return [] as string[];
    }
  })();

  return Array.from(new Set([...directSlugs, ...normalizedSlugs])).sort();
}

export function readFeaturePageData(slug: string): FeaturePageData | null {
  if (!SAFE_SLUG_PATTERN.test(slug)) {
    return null;
  }

  try {
    const filePath = path.join(FEATURES_DATA_DIR, `${slug}.json`);
    const rawFile = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(rawFile) as Record<string, unknown>;
    const hero = parseHero(parsed.hero);
    const groups = parseGroups(parsed.groups);

    if (!hero || !groups) {
      return null;
    }

    return {
      slug,
      hero,
      howToChoose: parseHowToChoose(parsed.howToChoose),
      groups,
      recommendedReading: parseRecommendedReading(parsed.recommendedReading),
    };
  } catch {
    return readNormalizedFeaturePageData(slug);
  }
}

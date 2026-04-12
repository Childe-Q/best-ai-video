import { getAllTools, getToolBySlug } from '@/lib/toolData';
import { getFeaturePageSlugs, readFeaturePageData } from '@/lib/features/readFeaturePageData';
import { getFeaturePageType } from '@/lib/features/pageType';
import { toCanonicalVsSlug } from '@/data/vs';
import { getPageReadiness, getPageReadinessSync } from '@/lib/readiness';

const FEATURE_HREF_PATTERN = /^\/features\/([a-z0-9-]+)(?:[/?#].*)?$/i;
const FEATURE_TYPE_PRIORITY = {
  'narrow-workflow': 0,
  'business-procurement': 1,
  'policy-threshold': 2,
  'broad-chooser': 3,
  comparison: 4,
} as const;

function toFeatureSlug(href: string): string | null {
  const match = href.trim().match(FEATURE_HREF_PATTERN);
  return match?.[1] ?? null;
}

function toUniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function buildFeatureLink(featureSlug: string): { href: string; title: string } {
  const pageData = readFeaturePageData(featureSlug);

  return {
    href: `/features/${featureSlug}`,
    title: pageData?.hero.h1 ?? featureSlug,
  };
}

/**
 * Find related comparison pages (VS pages) for a tool
 * VS pages are dynamic routes, so we generate links based on tool relationships
 */
export function getRelatedComparisons(slug: string): Array<{ slug: string; title: string }> {
  const tools = getAllTools();
  const currentTool = tools.find(t => t.slug === slug);
  if (!currentTool) return [];

  const comparisons: Array<{ slug: string; title: string }> = [];

  // Find tools with overlapping tags (at least 2 shared tags)
  const relatedTools = tools.filter(tool => {
    if (tool.slug === slug) return false;
    if (!tool.tags || !currentTool.tags) return false;
    
    const sharedTags = tool.tags.filter(tag => currentTool.tags?.includes(tag));
    return sharedTags.length >= 2;
  });

  // Generate comparison links (VS pages are dynamic, so we can generate any slug)
  for (const tool of relatedTools) {
    if (comparisons.length >= 3) {
      break;
    }

    const comparisonSlug = toCanonicalVsSlug(slug, tool.slug);
    const comparisonReadiness = getPageReadinessSync('vs', comparisonSlug);
    if (!comparisonReadiness.ready) {
      continue;
    }
    const title =
      comparisonSlug === `${slug}-vs-${tool.slug}`
        ? `${currentTool.name} vs ${tool.name}`
        : `${tool.name} vs ${currentTool.name}`;

    comparisons.push({
      slug: comparisonSlug,
      title,
    });
  }

  return comparisons;
}

export function getComparisonLinkBetweenTools(
  currentSlug: string,
  otherSlug: string,
): { href: string; title: string } | null {
  if (currentSlug === otherSlug) {
    return null;
  }

  const currentTool = getToolBySlug(currentSlug)?.tool;
  const otherTool = getToolBySlug(otherSlug)?.tool;
  if (!currentTool || !otherTool) {
    return null;
  }

  const comparisonSlug = toCanonicalVsSlug(currentSlug, otherSlug);
  const comparisonReadiness = getPageReadinessSync('vs', comparisonSlug);
  if (!comparisonReadiness.ready) {
    return null;
  }

  const title =
    comparisonSlug === `${currentSlug}-vs-${otherSlug}`
      ? `${currentTool.name} vs ${otherTool.name}`
      : `${otherTool.name} vs ${currentTool.name}`;

  return {
    href: `/vs/${comparisonSlug}`,
    title,
  };
}

export function getMostRelevantWorkflowLink(slug: string): { href: string; title: string } | null {
  const content = getToolBySlug(slug)?.content;
  const configuredFeatureSlugs = toUniqueStrings(
    (content?.overview?.useCases ?? []).map((useCase) => toFeatureSlug(useCase.linkHref)),
  );

  for (const featureSlug of configuredFeatureSlugs) {
    const readiness = getPageReadinessSync('feature', featureSlug);
    if (readiness.ready) {
      return buildFeatureLink(featureSlug);
    }
  }

  const readyFeatureCandidates: Array<{ featureSlug: string; priority: number }> = [];

  for (const featureSlug of getFeaturePageSlugs()) {
    const pageData = readFeaturePageData(featureSlug);
    const includesTool = pageData?.groups.some((group) =>
      group.tools.some((toolCard) => toolCard.toolSlug === slug),
    );

    if (!pageData || !includesTool) {
      continue;
    }

    const readiness = getPageReadinessSync('feature', featureSlug);
    if (!readiness.ready) {
      continue;
    }

    readyFeatureCandidates.push({
      featureSlug,
      priority: FEATURE_TYPE_PRIORITY[getFeaturePageType(featureSlug)],
    });
  }

  readyFeatureCandidates.sort(
    (left, right) => left.priority - right.priority || left.featureSlug.localeCompare(right.featureSlug),
  );

  const bestMatch = readyFeatureCandidates[0];
  return bestMatch ? buildFeatureLink(bestMatch.featureSlug) : null;
}

/**
 * Get alternatives page link for a tool
 */
export async function getAlternativesLink(slug: string): Promise<{ slug: string; title: string } | null> {
  const readiness = await getPageReadiness('toolAlternatives', slug);
  if (!readiness.ready) {
    return null;
  }

  return {
    slug: `/tool/${slug}/alternatives`,
    title: 'View All Alternatives',
  };
}

/**
 * Get all related links for a tool (comparisons and alternatives)
 */
export async function getRelatedLinks(slug: string): Promise<{
  comparisons: Array<{ href: string; title: string }>;
  alternatives: { href: string; title: string } | null;
}> {
  const comparisons = getRelatedComparisons(slug).map(comp => ({
    href: `/vs/${comp.slug}`,
    title: comp.title
  }));
  
  const alternatives = await getAlternativesLink(slug);
  
  return {
    comparisons,
    alternatives: alternatives ? {
      href: alternatives.slug,
      title: alternatives.title
    } : null
  };
}

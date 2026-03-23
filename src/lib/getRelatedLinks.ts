import { getAllTools } from '@/lib/getTool';
import { toCanonicalVsSlug } from '@/data/vs';
import { getPageReadiness, getPageReadinessSync } from '@/lib/readiness';

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

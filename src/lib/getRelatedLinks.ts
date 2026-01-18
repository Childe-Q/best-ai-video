import { getAllTools } from '@/lib/getTool';

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
  for (const tool of relatedTools.slice(0, 3)) {
    comparisons.push({
      slug: `${slug}-vs-${tool.slug}`,
      title: `${currentTool.name} vs ${tool.name}`,
    });
  }

  return comparisons;
}

/**
 * Get alternatives page link for a tool
 * Alternatives pages are dynamic routes, so they always exist
 */
export function getAlternativesLink(slug: string): { slug: string; title: string } | null {
  return {
    slug: `/tool/${slug}/alternatives`,
    title: 'View All Alternatives',
  };
}

/**
 * Get all related links for a tool (comparisons and alternatives)
 */
export function getRelatedLinks(slug: string): {
  comparisons: Array<{ href: string; title: string }>;
  alternatives: { href: string; title: string } | null;
} {
  const comparisons = getRelatedComparisons(slug).map(comp => ({
    href: `/vs/${comp.slug}`,
    title: comp.title
  }));
  
  const alternatives = getAlternativesLink(slug);
  
  return {
    comparisons,
    alternatives: alternatives ? {
      href: alternatives.slug,
      title: alternatives.title
    } : null
  };
}

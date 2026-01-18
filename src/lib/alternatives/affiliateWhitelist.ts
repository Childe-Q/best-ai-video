/**
 * Hardcoded whitelist of tools that have "Try now" (affiliate) links
 * This is the single source of truth for determining which tools can be "tried now"
 */
export const TRY_NOW_WHITELIST = new Set([
  'invideo',
  'heygen',
  'fliki',
  'veed-io',
  'zebracat',
  'synthesia',
  'elai-io',
  'pika'
]);

/**
 * Check if a tool (by slug) is in the "Try now" whitelist
 * @param toolOrSlug - Tool object with slug property, or string slug
 * @returns true if the tool is in the whitelist
 */
export function isTryNowTool(toolOrSlug: { slug: string } | string): boolean {
  const slug = typeof toolOrSlug === 'string' ? toolOrSlug : toolOrSlug.slug;
  return TRY_NOW_WHITELIST.has(slug);
}

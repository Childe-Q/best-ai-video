export const FEATURED_TOOLS = new Set<string>(['invideo']);

export function isFeaturedTool(slug: string): boolean {
  return FEATURED_TOOLS.has((slug || '').trim().toLowerCase());
}

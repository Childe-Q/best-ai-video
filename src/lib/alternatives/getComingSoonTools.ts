/**
 * List of top-tier tools that are not yet in tools.json
 * These should be displayed as "Coming soon" or "Request tool" cards
 * instead of being included in the recommendation pool
 */
export const COMING_SOON_TOOLS = new Set([
  'veo3',
  'hailuo',
  'keling'
]);

export interface ComingSoonTool {
  slug: string;
  name: string;
  description: string;
}

export const COMING_SOON_TOOL_DATA: Record<string, ComingSoonTool> = {
  'veo3': {
    slug: 'veo3',
    name: 'Veo 3',
    description: 'Google\'s latest AI video generation model with advanced capabilities'
  },
  'hailuo': {
    slug: 'hailuo',
    name: 'Hailuo',
    description: 'Emerging AI video generation platform'
  },
  'keling': {
    slug: 'keling',
    name: 'Keling',
    description: 'New AI video creation tool'
  }
};

/**
 * Check if a tool slug is a "coming soon" tool (not yet in tools.json)
 */
export function isComingSoonTool(slug: string): boolean {
  return COMING_SOON_TOOLS.has(slug.toLowerCase());
}

/**
 * Get coming soon tool data if it exists
 */
export function getComingSoonTool(slug: string): ComingSoonTool | null {
  return COMING_SOON_TOOL_DATA[slug.toLowerCase()] || null;
}

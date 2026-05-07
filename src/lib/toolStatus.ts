export type ToolLifecycleStatus = {
  status: 'discontinued';
  label: string;
  discontinuedAt: string;
  apiDiscontinuedAt?: string;
  sourceUrl: string;
  summary: string;
  replacementHref: string;
};

const TOOL_LIFECYCLE_STATUS: Record<string, ToolLifecycleStatus> = {
  sora: {
    status: 'discontinued',
    label: 'Discontinued',
    discontinuedAt: '2026-04-26',
    apiDiscontinuedAt: '2026-09-24',
    sourceUrl: 'https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation',
    summary:
      'OpenAI discontinued the Sora web and app experiences on April 26, 2026. The Sora API is scheduled to be discontinued on September 24, 2026.',
    replacementHref: '/tool/sora/alternatives',
  },
};

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

export function getToolLifecycleStatus(slug: string): ToolLifecycleStatus | null {
  return TOOL_LIFECYCLE_STATUS[normalizeSlug(slug)] ?? null;
}

export function isToolDiscontinued(slug: string): boolean {
  return Boolean(getToolLifecycleStatus(slug));
}

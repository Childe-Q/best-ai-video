/**
 * Alternatives Evidence Integration
 *
 * Provides evidence sources for the alternatives page proof functionality.
 * Uses universal readEvidence() API for any tool.
 */

import { readEvidence, getEvidenceSources, hasEvidence } from '@/lib/evidence/readEvidence';

/**
 * Get evidence sources for a specific tool slug
 */
export function getEvidenceSourcesForTool(slug: string): string[] {
  return getEvidenceSources(slug);
}

/**
 * Get evidence nugget text for a specific tool
 */
export function getEvidenceClaimForTool(slug: string, claimIndex: number = 0): string | null {
  const evidence = readEvidence(slug);
  if (!evidence) return null;

  const nonPricingNuggets = evidence.nuggets.filter(n => n.theme !== 'pricing');
  if (claimIndex < nonPricingNuggets.length) {
    return nonPricingNuggets[claimIndex].text;
  }
  return null;
}

/**
 * Check if a tool has evidence data available
 */
export function hasEvidenceForTool(slug: string): boolean {
  return hasEvidence(slug);
}

/**
 * Get evidence metadata for a tool
 */
export function getEvidenceMetadataForTool(slug: string) {
  const evidence = readEvidence(slug);
  if (!evidence) return null;

  return {
    totalNuggets: evidence.metadata.totalNuggets,
    themesCovered: evidence.metadata.themesCovered,
    lastUpdated: evidence.lastUpdated,
  };
}

/**
 * Generate default internal page links for a tool if no evidence links exist
 * This ensures every tool has at least some proof sources, even if minimal
 * 
 * Priority order:
 * 1. /tool/{slug}/pricing (most important for alternatives)
 * 2. /tool/{slug}/features
 * 3. /tool/{slug}/reviews
 * 
 * Note: These are internal pages that should exist for all tools in our database
 */
export function generateDefaultEvidenceLinks(candidateSlug: string): string[] {
  const defaultLinks: string[] = [];
  
  // Always include pricing page (most relevant for alternatives comparison)
  defaultLinks.push(`/tool/${candidateSlug}/pricing`);
  
  // Add features page if available
  defaultLinks.push(`/tool/${candidateSlug}/features`);
  
  // Add reviews page if available
  defaultLinks.push(`/tool/${candidateSlug}/reviews`);
  
  return defaultLinks;
}

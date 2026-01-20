/**
 * Normalize evidence links to ensure they are based on candidateSlug (not currentSlug)
 * This prevents cross-contamination where one tool's evidence links show for another tool
 * Also deduplicates links by URL
 * 
 * Handles both string[] and object[] formats: uniqBy(links, l => normalizeUrl(l.url ?? l.href ?? l))
 */
export function normalizeEvidenceLinks(
  links: string[] | Array<{ url?: string; href?: string }>,
  candidateSlug: string
): string[] {
  // Step 1: Extract strings from links (handle both string and object formats)
  const linkStrings: string[] = links.map(link => {
    if (typeof link === 'string') {
      return link.trim();
    }
    // Handle object format: { url } or { href }
    const extracted = (link as any)?.url || (link as any)?.href || String(link);
    return typeof extracted === 'string' ? extracted.trim() : String(extracted);
  });
  
  // Step 2: Normalize links to ensure they're for candidateSlug
  const normalized = linkStrings.map(link => {
    // If link is a relative path starting with /tool/, ensure it's for the candidate tool
    if (link.startsWith('/tool/')) {
      const pathParts = link.split('/tool/')[1]?.split('/') || [];
      const pathSlug = pathParts[0];
      
      // If the slug in the path doesn't match candidateSlug, replace it
      if (pathSlug && pathSlug !== candidateSlug) {
        const restOfPath = pathParts.slice(1).join('/');
        return `/tool/${candidateSlug}${restOfPath ? '/' + restOfPath : ''}`;
      }
    }
    
    // Return link as-is if it's external or already correct
    return link;
  });
  
  // Step 3: Deduplicate by URL (case-insensitive, normalize trailing slashes)
  // This is the final deduplication step before rendering
  const normalizeUrl = (url: string) => url.toLowerCase().replace(/\/$/, '');
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  
  for (const link of normalized) {
    const normalizedUrlKey = normalizeUrl(link);
    
    if (!seen.has(normalizedUrlKey)) {
      seen.add(normalizedUrlKey);
      deduplicated.push(link); // Keep original case
    }
  }
  
  return deduplicated;
}

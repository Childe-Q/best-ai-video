/**
 * Page-level deduplication map for pricing page content
 * Prevents repeated sentences across Key Facts, FAQ, and How usage works
 */

export interface DedupeMap {
  seen: Set<string>;
  normalize: (text: string) => string;
}

export function createPageDedupeMap(): DedupeMap {
  const seen = new Set<string>();
  
  const normalize = (text: string): string => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  return { seen, normalize };
}

/**
 * Check if a sentence is a duplicate (semantic similarity)
 */
export function isDuplicate(
  text: string,
  dedupeMap: DedupeMap,
  threshold: number = 0.7
): boolean {
  const normalized = dedupeMap.normalize(text);
  
  // Check exact match
  if (dedupeMap.seen.has(normalized)) {
    return true;
  }
  
  // Check semantic similarity (word overlap)
  const words = normalized.split(/\s+/).filter(w => w.length > 3);
  for (const seenText of dedupeMap.seen) {
    const seenWords = seenText.split(/\s+/).filter(w => w.length > 3);
    const commonWords = words.filter(w => seenWords.includes(w));
    const similarity = commonWords.length / Math.max(words.length, seenWords.length);
    
    if (similarity >= threshold) {
      return true;
    }
  }
  
  return false;
}

/**
 * Add text to dedupe map
 */
export function addToDedupeMap(text: string, dedupeMap: DedupeMap): void {
  const normalized = dedupeMap.normalize(text);
  dedupeMap.seen.add(normalized);
}

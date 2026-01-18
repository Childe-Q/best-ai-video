import { Tool } from '@/types/tool';
import alternativesEvidenceData from '@/data/alternativesEvidence.json';
import { isTryNowTool } from './affiliateWhitelist';

interface ToolScore {
  slug: string;
  score: number;
  tieBreaker: number;
  breakdown?: {
    tagsOverlap: number;
    categoriesOverlap: number;
    hasAffiliate: number;
    hasEvidence: number;
    ratingBonus: number;
  };
}

interface ShortlistOptions {
  onlyAffiliate?: boolean;
  alwaysInclude?: string[];
}

/**
 * Simple string hash function for stable tie-breaking
 */
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Calculate similarity-based shortlist for alternatives page
 * 
 * Scoring rules:
 * - Tags overlap: +3 per matching tag
 * - Categories overlap: +2 per matching category
 * - Has affiliate_link: +2
 * - Has evidence (in alternativesEvidence.json): tracked but NOT added to score (for UI badge only)
 * - Rating bonus: +0~1 (normalized to 0-1 scale, max rating = 5)
 * 
 * Sorting: score desc, then tie-breaker (stable hash) asc for consistent ordering
 * 
 * @param currentSlug - The slug of the current tool
 * @param allTools - All tools from tools.json
 * @param targetCount - Target number of tools in shortlist (default: 10)
 * @param options - Optional filters: onlyAffiliate (filter to affiliate tools), alwaysInclude (always include these slugs)
 * @returns Array of tool slugs sorted by similarity score (descending)
 */
export function getAlternativesShortlist(
  currentSlug: string,
  allTools: Tool[],
  targetCount: number = 10,
  options: ShortlistOptions = {}
): string[] {
  const { onlyAffiliate = false, alwaysInclude = [] } = options;
  // Get current tool
  const currentTool = allTools.find(t => t.slug === currentSlug);
  if (!currentTool) {
    return [];
  }

  // Build evidence index (Set of tool slugs that have evidence)
  const evidenceIndex = new Set<string>();
  (alternativesEvidenceData as any[]).forEach((item: any) => {
    if (item.tool) {
      evidenceIndex.add(item.tool);
    }
  });

  // Filter candidate tools
  let candidateTools = allTools.filter(t => t.slug !== currentSlug); // Exclude self
  
  // Track alwaysInclude tools (runway, sora) - these are non-affiliate benchmarks
  const alwaysIncludeTools = new Set<string>();
  if (alwaysInclude.length > 0) {
    alwaysInclude.forEach(slug => {
      const tool = allTools.find(t => t.slug === slug && t.slug !== currentSlug);
      if (tool) {
        alwaysIncludeTools.add(slug);
      }
    });
  }
  
  if (onlyAffiliate) {
    // Filter to only whitelisted "Try now" tools, but keep alwaysInclude tools
    candidateTools = candidateTools.filter(t => 
      isTryNowTool(t) || alwaysIncludeTools.has(t.slug)
    );
  }

  // Calculate scores for candidate tools
  const scores: ToolScore[] = candidateTools
    .map(tool => {
      let score = 0;
      const breakdown = {
        tagsOverlap: 0,
        categoriesOverlap: 0,
        hasAffiliate: 0,
        hasEvidence: 0,
        ratingBonus: 0,
      };

      // Tags overlap: +3 per matching tag
      const currentTags = new Set((currentTool.tags || []).map(t => t.toLowerCase()));
      const candidateTags = new Set((tool.tags || []).map(t => t.toLowerCase()));
      const tagsOverlap = [...currentTags].filter(t => candidateTags.has(t)).length;
      breakdown.tagsOverlap = tagsOverlap * 3;
      score += breakdown.tagsOverlap;

      // Categories overlap: +2 per matching category
      const currentCategories = new Set((currentTool.categories || []).map(c => c.toLowerCase()));
      const candidateCategories = new Set((tool.categories || []).map(c => c.toLowerCase()));
      const categoriesOverlap = [...currentCategories].filter(c => candidateCategories.has(c)).length;
      breakdown.categoriesOverlap = categoriesOverlap * 2;
      score += breakdown.categoriesOverlap;

      // Is in whitelist (Try now): +2
      if (isTryNowTool(tool)) {
        breakdown.hasAffiliate = 2;
        score += 2;
      }

      // Has evidence: tracked for UI badge, but NOT added to score
      if (evidenceIndex.has(tool.slug)) {
        breakdown.hasEvidence = 1;
        // Do NOT add to score - evidence is only for UI display
      }

      // Rating bonus: +0~1 (normalized, assuming max rating = 5)
      if (tool.rating && typeof tool.rating === 'number' && tool.rating > 0) {
        // Normalize rating to 0-1 scale (rating / 5)
        breakdown.ratingBonus = tool.rating / 5;
        score += breakdown.ratingBonus;
      }

      // Calculate stable tie-breaker hash
      const tieBreaker = stableHash(`${currentSlug}:${tool.slug}`);

      return {
        slug: tool.slug,
        score,
        breakdown,
        tieBreaker, // Add tie-breaker for stable sorting
      };
    });

  // Sort by score descending, then by tie-breaker ascending for stable ordering
  // When scores are equal (or very close, < 0.0001), use tie-breaker
  scores.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) < 0.0001) {
      // Scores are effectively equal, use tie-breaker for stable ordering
      return a.tieBreaker - b.tieBreaker;
    }
    return scoreDiff;
  });

  // Separate whitelist tools and alwaysInclude tools
  const whitelistTools: string[] = [];
  const alwaysIncludeInResults: string[] = [];
  const otherTools: string[] = [];

  for (const score of scores) {
    if (alwaysIncludeTools.has(score.slug)) {
      alwaysIncludeInResults.push(score.slug);
    } else if (isTryNowTool(score.slug)) {
      whitelistTools.push(score.slug);
    } else {
      otherTools.push(score.slug);
    }
  }

  // Build result: whitelist tools first, then others, then alwaysInclude at the end (only if needed)
  let topTools: string[] = [];
  
  if (onlyAffiliate) {
    // When filtering: whitelist tools first, then alwaysInclude only if we need more
    topTools = [...whitelistTools];
    if (topTools.length < targetCount && alwaysIncludeInResults.length > 0) {
      const needed = Math.min(targetCount - topTools.length, alwaysIncludeInResults.length);
      topTools.push(...alwaysIncludeInResults.slice(0, needed));
    }
    topTools = topTools.slice(0, targetCount);
  } else {
    // Default: whitelist + others, alwaysInclude only if we're short
    topTools = [...whitelistTools, ...otherTools].slice(0, targetCount);
    if (topTools.length < targetCount && alwaysIncludeInResults.length > 0) {
      const needed = Math.min(targetCount - topTools.length, alwaysIncludeInResults.length);
      topTools.push(...alwaysIncludeInResults.slice(0, needed));
    }
  }

  // Debug output in development
  if (process.env.NODE_ENV === 'development') {
    const tryNowCount = topTools.filter(slug => isTryNowTool(slug)).length;
    const alwaysIncludeCount = topTools.filter(slug => alwaysIncludeTools.has(slug)).length;
    console.log(`[Alternatives Shortlist] ${currentSlug}:`, {
      totalCandidates: scores.length,
      tryNowCandidates: whitelistTools.length,
      alwaysIncludeCandidates: alwaysIncludeInResults.length,
      toggleState: onlyAffiliate ? 'ON (only try-now)' : 'OFF (all tools)',
      resultCount: topTools.length,
      tryNowInResult: tryNowCount,
      alwaysIncludeInResult: alwaysIncludeCount,
      topTools,
      scoreBreakdown: scores.slice(0, 5).map(s => ({
        slug: s.slug,
        isTryNow: isTryNowTool(s.slug),
        score: s.score.toFixed(2),
        breakdown: s.breakdown,
      })),
    });
  }

  return topTools;
}

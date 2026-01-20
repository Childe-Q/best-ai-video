import { Tool } from '@/types/tool';
import { isTryNowTool } from './affiliateWhitelist';

/**
 * Circular reference prevention: Tools that should not appear on each other's pages
 * This prevents Fliki/HeyGen/InVideo from circularly recommending each other
 */
const CIRCULAR_REFERENCE_BLOCKLIST: Record<string, string[]> = {
  'fliki': ['heygen', 'invideo'],
  'heygen': ['fliki', 'invideo'],
  'invideo': ['fliki', 'heygen'],
  // Add more if needed
};

/**
 * Check if a tool should be blocked from appearing on current tool's page
 */
function isBlockedByCircularReference(currentSlug: string, candidateSlug: string): boolean {
  const blocklist = CIRCULAR_REFERENCE_BLOCKLIST[currentSlug.toLowerCase()];
  if (!blocklist) return false;
  return blocklist.includes(candidateSlug.toLowerCase());
}

/**
 * Calculate relevance score based on use case/task match (NOT affiliate status)
 * Score components:
 * - Tags overlap: +3 per matching tag
 * - Categories overlap: +2 per matching category
 * - Rating bonus: +0~1 (normalized to 0-1 scale)
 * 
 * NOTE: Affiliate status is NOT included in score - only for UI labeling
 */
function calculateRelevanceScore(currentTool: Tool, candidateTool: Tool): number {
  let score = 0;

  // 1. Tags Overlap (high weight)
  const currentTags = new Set((currentTool.tags || []).map(t => t.toLowerCase()));
  const candidateTags = new Set((candidateTool.tags || []).map(t => t.toLowerCase()));
  const tagsOverlap = [...currentTags].filter(t => candidateTags.has(t)).length;
  score += tagsOverlap * 3;

  // 2. Categories Overlap (medium weight)
  const currentCats = new Set((currentTool.categories || []).map(c => c.toLowerCase()));
  const candidateCats = new Set((candidateTool.categories || []).map(c => c.toLowerCase()));
  const catsOverlap = [...currentCats].filter(c => candidateCats.has(c)).length;
  score += catsOverlap * 2;

  // 3. Rating Bonus (low weight, 0-1)
  if (candidateTool.rating && typeof candidateTool.rating === 'number' && candidateTool.rating > 0) {
    score += candidateTool.rating / 5; // Max 1.0 for 5-star
  }

  return score;
}

export interface TrustedPool {
  bestMatch: Tool[]; // Editorial recommendations (non-affiliate, high relevance)
  deals: Tool[];     // Sponsored/affiliate tools (high relevance)
  all: Tool[];       // Combined for fallback
}

/**
 * Get trusted alternatives pool with strict rules:
 * - Sort by relevance (use case match), NOT affiliate status
 * - Separate into Best Match (Editorial) and Deals (Sponsored)
 * - Prevent circular references (Fliki/HeyGen/InVideo)
 * - Include all tools from tools.json (Runway, Sora, Veo, etc.)
 */
export function getTrustedAlternativesPool(
  currentSlug: string,
  allTools: Tool[],
  options: {
    minBestMatch?: number; // Minimum number of non-affiliate tools
    maxDeals?: number;     // Max number of deals
  } = {}
): TrustedPool {
  const { minBestMatch = 3, maxDeals = 2 } = options;
  const currentTool = allTools.find(t => t.slug === currentSlug);
  
  if (!currentTool) {
    return { bestMatch: [], deals: [], all: [] };
  }

  // 1. Filter candidates: exclude self and circular references
  const candidates = allTools.filter(t => 
    t.slug !== currentSlug && 
    !isBlockedByCircularReference(currentSlug, t.slug)
  );

  // 2. Score all candidates by relevance (NOT affiliate status)
  const scoredCandidates = candidates.map(tool => ({
    tool,
    score: calculateRelevanceScore(currentTool, tool),
    isAffiliate: isTryNowTool(tool.slug)
  }));

  // 3. Sort by score descending (relevance-first, NOT affiliate-first)
  scoredCandidates.sort((a, b) => {
    // Primary sort: score (relevance)
    if (Math.abs(b.score - a.score) > 0.01) {
      return b.score - a.score;
    }
    // Tie-breaker: prefer non-affiliate if scores are very close
    if (a.isAffiliate !== b.isAffiliate) {
      return a.isAffiliate ? 1 : -1; // Non-affiliate first
    }
    return 0;
  });

  // 4. Separate into Best Match (Editorial) and Deals (Sponsored)
  const bestMatchTools: Tool[] = [];
  const dealTools: Tool[] = [];

  for (const candidate of scoredCandidates) {
    if (candidate.isAffiliate) {
      dealTools.push(candidate.tool);
    } else {
      bestMatchTools.push(candidate.tool);
    }
  }

  // 5. Ensure minimum Best Match tools (prioritize high relevance)
  const finalBestMatch = bestMatchTools.slice(0, Math.max(minBestMatch, 10));
  const finalDeals = dealTools.slice(0, maxDeals);

  // Debug output
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Trusted Alternatives Pool] ${currentSlug}:`, {
      totalCandidates: candidates.length,
      bestMatch: finalBestMatch.length,
      deals: finalDeals.length,
      bestMatchSlugs: finalBestMatch.map(t => t.slug),
      dealSlugs: finalDeals.map(t => t.slug),
      topScores: scoredCandidates.slice(0, 5).map(c => ({
        slug: c.tool.slug,
        score: c.score.toFixed(2),
        isAffiliate: c.isAffiliate
      }))
    });
  }

  return {
    bestMatch: finalBestMatch,
    deals: finalDeals,
    all: [...finalBestMatch, ...finalDeals]
  };
}

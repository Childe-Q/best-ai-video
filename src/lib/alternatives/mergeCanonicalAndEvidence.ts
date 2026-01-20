import { Tool } from '@/types/tool';
import { 
  CanonicalAlternativesConfig, 
  ToolEvidence, 
  AlternativeToolWithEvidence,
  AlternativeGroupWithEvidence 
} from '@/types/alternatives';
import { getPricingDetails } from './getPricingDetails';
import { getAllTools } from '@/lib/getTool';
import { getAlternativesShortlist } from './getAlternativesShortlist';
import { getTrustedAlternativesPool } from './getTrustedAlternativesPool';
import { isTryNowTool } from './affiliateWhitelist';
import { normalizeEvidenceText } from './normalizeEvidenceText';

/**
 * Validate that all tool slugs in canonical config exist in tools.json
 * (Only validates legacy toolSlugs if present)
 */
export function validateCanonicalConfig(
  config: CanonicalAlternativesConfig,
  allTools: Tool[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const toolSlugSet = new Set(allTools.map(t => t.slug));

  for (const group of config.groups) {
    // Only validate if toolSlugs is present (legacy support)
    if (group.toolSlugs) {
      for (const toolSlug of group.toolSlugs) {
        if (!toolSlugSet.has(toolSlug)) {
          warnings.push(
            `Canonical config for ${config.toolSlug}: tool slug "${toolSlug}" in group "${group.id}" does not exist in tools.json. Ignoring.`
          );
        }
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Validate evidence: tool slug must exist, and evidence must not contain structure fields
 */
export function validateEvidence(
  evidence: ToolEvidence,
  allTools: Tool[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const toolSlugSet = new Set(allTools.map(t => t.slug));

  if (!toolSlugSet.has(evidence.toolSlug)) {
    warnings.push(
      `Evidence for tool slug "${evidence.toolSlug}" does not exist in tools.json. Ignoring evidence.`
    );
    return { valid: false, warnings };
  }

  // Check for forbidden structure fields (these should not be in evidence)
  const forbiddenFields = ['groups', 'toolSlugs', 'filters', 'switchReasonGroups', 'alternatives'];
  const evidenceKeys = Object.keys(evidence);
  for (const field of forbiddenFields) {
    if (field in evidence) {
      warnings.push(
        `Evidence for "${evidence.toolSlug}" contains forbidden structure field "${field}". This field will be ignored.`
      );
    }
  }

  return { valid: true, warnings };
}

/**
 * Generate tool-specific fallback copy based on tool properties and group intent
 * Creates unique, non-template descriptions for each tool
 */
function generateFallbackCopy(tool: Tool, groupIntent: string, currentTool: Tool): {
  pickThisIf?: string;
  extraReason?: string;
  limitations?: string;
} {
  const tags = (tool.tags || []).map(t => t.toLowerCase());
  const categories = (tool.categories || []).map(c => c.toLowerCase());
  const currentTags = new Set((currentTool.tags || []).map(t => t.toLowerCase()));
  const currentCats = new Set((currentTool.categories || []).map(c => c.toLowerCase()));
  
  // Find unique strengths of this tool compared to current tool
  const uniqueTags = tags.filter(t => !currentTags.has(t));
  const uniqueCats = categories.filter(c => !currentCats.has(c));
  
  // Generate pickThisIf based on group intent and tool's unique features
  let pickThisIf: string | undefined;
  let extraReason: string | undefined;
  let limitations: string | undefined;
  
  const groupLower = groupIntent.toLowerCase();
  
  if (groupLower.includes('avatar') || groupLower.includes('presenter')) {
    if (tags.some(t => t.includes('avatar'))) {
      pickThisIf = `${tool.name} specializes in ${tool.name.includes('Avatar') ? 'AI avatar' : 'avatar-based'} video creation`;
      if (tool.rating && tool.rating >= 4) {
        extraReason = `High-quality avatar rendering with natural movements`;
      }
    } else {
      pickThisIf = `${tool.name} offers avatar features for video creation`;
    }
  } else if (groupLower.includes('edit') || groupLower.includes('control') || groupLower.includes('timeline')) {
    if (tags.some(t => t.includes('editor') || t.includes('edit'))) {
      pickThisIf = `${tool.name} provides ${tags.some(t => t.includes('timeline')) ? 'timeline-based' : 'advanced'} editing control`;
      if (uniqueTags.length > 0) {
        extraReason = `Includes ${uniqueTags[0]} features not available in ${currentTool.name}`;
      }
    } else {
      pickThisIf = `${tool.name} offers editing capabilities for post-production`;
    }
  } else if (groupLower.includes('stock') || groupLower.includes('voice') || groupLower.includes('audio') || groupLower.includes('quality')) {
    if (tags.some(t => t.includes('stock') || t.includes('library'))) {
      pickThisIf = `${tool.name} includes ${tags.some(t => t.includes('stock')) ? 'extensive stock' : 'premium'} asset libraries`;
    } else if (tags.some(t => t.includes('voice') || t.includes('tts') || t.includes('speech'))) {
      pickThisIf = `${tool.name} focuses on ${tags.some(t => t.includes('voice')) ? 'high-quality voice' : 'text-to-speech'} generation`;
    } else {
      pickThisIf = `${tool.name} offers improved ${groupLower.includes('quality') ? 'output quality' : 'asset management'}`;
    }
  } else if (groupLower.includes('pricing') || groupLower.includes('cost') || groupLower.includes('predictable')) {
    if (tool.has_free_trial || (typeof tool.starting_price === 'string' && tool.starting_price.toLowerCase().includes('free'))) {
      pickThisIf = `${tool.name} offers ${tool.has_free_trial ? 'a free trial' : 'free tier'} with ${typeof tool.starting_price === 'string' ? tool.starting_price : 'flexible pricing'}`;
    } else {
      const priceStr = typeof tool.starting_price === 'string' ? tool.starting_price : 'competitive pricing';
      pickThisIf = `${tool.name} provides ${priceStr} with ${tool.has_free_trial ? 'free trial' : 'transparent pricing'}`;
    }
  } else {
    // Generic but tool-specific fallback
    const mainFeature = uniqueTags[0] || uniqueCats[0] || tags[0] || categories[0] || 'video creation';
    pickThisIf = `${tool.name} specializes in ${mainFeature}`;
    if (tool.rating && tool.rating >= 4.5) {
      extraReason = `Highly rated for ${mainFeature} capabilities`;
    }
  }
  
  // Generate limitations based on tool properties
  if (tool.cons && tool.cons.length > 0) {
    limitations = tool.cons[0]; // Use first con as limitation
  } else if (typeof tool.starting_price === 'string' && !tool.starting_price.toLowerCase().includes('free')) {
    limitations = `Paid plans required for full features`;
  } else if (!tool.has_free_trial) {
    limitations = `No free trial available`;
  }
  
  // Add [NEED VERIFICATION] if no specific evidence
  if (!pickThisIf.includes('[NEED VERIFICATION]')) {
    pickThisIf += ' [NEED VERIFICATION]';
  }
  
  return { pickThisIf, extraReason, limitations };
}

/**
 * Calculate matching factors for a tool (tags, categories, rating)
 */
function calculateMatchingFactors(
  tool: Tool,
  currentTool: Tool
): { tags: string[]; categories: string[]; rating?: number } {
  const currentTags = new Set((currentTool.tags || []).map(t => t.toLowerCase()));
  const currentCategories = new Set((currentTool.categories || []).map(c => c.toLowerCase()));
  
  const matchingTags = (tool.tags || [])
    .filter(t => currentTags.has(t.toLowerCase()))
    .slice(0, 3); // Limit to top 3 matching tags
  
  const matchingCategories = (tool.categories || [])
    .filter(c => currentCategories.has(c.toLowerCase()))
    .slice(0, 2); // Limit to top 2 matching categories
  
  return {
    tags: matchingTags,
    categories: matchingCategories,
    rating: tool.rating
  };
}

/**
 * Build AlternativeToolWithEvidence from tool data and evidence
 * Allows tools without evidence (with fallback copy)
 */
function buildToolWithEvidence(
  tool: Tool,
  evidence: ToolEvidence | undefined,
  allTools: Tool[],
  groupIntent: string = '',
  currentTool: Tool // Add currentTool parameter for fallback generation
): AlternativeToolWithEvidence {
  // Validate evidence if present
  if (evidence) {
    const evidenceValidation = validateEvidence(evidence, allTools);
    if (evidenceValidation.warnings.length > 0) {
      evidenceValidation.warnings.forEach(w => console.warn(w));
    }
  }

  // Get pricing details from internal data (NEVER from evidence)
  const pricingBullets = getPricingDetails(tool.slug);
  const pricingSignals: AlternativeToolWithEvidence['pricingSignals'] = {};
  if (pricingBullets.length > 0) {
    pricingSignals.freePlan = pricingBullets[0] || undefined;
    pricingSignals.watermark = pricingBullets[1] || undefined;
    pricingSignals.exportQuality = pricingBullets[2] || undefined;
    pricingSignals.refundCancel = pricingBullets[3] || undefined;
  }

  // Generate fallback copy if no evidence (tool-specific, not template)
  const fallbackCopy = !evidence ? generateFallbackCopy(tool, groupIntent, currentTool) : {};

  // Normalize evidence text to replace hardcoded tool names with currentTool.name
  const normalizedPickThisIf = normalizeEvidenceText(
    evidence?.pickThisIf || fallbackCopy.pickThisIf,
    currentTool,
    allTools
  );
  const normalizedExtraReason = normalizeEvidenceText(
    evidence?.extraReason || fallbackCopy.extraReason,
    currentTool,
    allTools
  );
  const normalizedLimitations = normalizeEvidenceText(
    evidence?.limitations || fallbackCopy.limitations,
    currentTool,
    allTools
  );

  // Calculate matching factors
  const matchedOn = calculateMatchingFactors(tool, currentTool);

  return {
    // From tool data
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    logoUrl: tool.logo_url || '',
    startingPrice: tool.starting_price || 'Free Trial',
    rating: tool.rating,
    affiliateLink: tool.affiliate_link || '',
    hasFreeTrial: tool.has_free_trial || false,
    // From evidence (copy only), normalized to replace hardcoded tool names
    pickThisIf: normalizedPickThisIf,
    extraReason: normalizedExtraReason,
    limitations: normalizedLimitations,
    // From internal pricing data (never from evidence)
    pricingSignals,
    // Best for tags (from tool.best_for, can be enhanced by evidence but not structure)
    bestFor: evidence?.bestFor && evidence.bestFor.length > 0
      ? evidence.bestFor
      : tool.best_for?.split(/[,&]/).map((s: string) => s.trim()) || [],
    // Matching factors for "Matched on" display
    matchedOn
  };
}

/**
 * Define group intent types for per-group scoring
 */
type GroupIntentType = 'editing_control' | 'stock_voice' | 'predictable_pricing' | 'avatar_presenters' | 'other';

/**
 * Determine group intent type from group metadata
 */
function getGroupIntentType(groupId: string, groupTitle: string, groupDescription: string): GroupIntentType {
  const intentText = `${groupId} ${groupTitle} ${groupDescription}`.toLowerCase();
  
  if (intentText.includes('avatar') || intentText.includes('presenter')) {
    return 'avatar_presenters';
  }
  if (intentText.includes('edit') || intentText.includes('control') || intentText.includes('timeline')) {
    return 'editing_control';
  }
  if (intentText.includes('stock') || intentText.includes('voice') || intentText.includes('audio') || intentText.includes('quality')) {
    return 'stock_voice';
  }
  if (intentText.includes('pricing') || intentText.includes('cost') || intentText.includes('predictable')) {
    return 'predictable_pricing';
  }
  return 'other';
}

/**
 * Calculate per-group score for a tool based on group intent
 * Returns a score (higher = better match for this group)
 */
function calculateGroupScore(
  tool: Tool,
  intentType: GroupIntentType,
  currentTool: Tool
): number {
  let score = 0;
  const tags = (tool.tags || []).map(t => t.toLowerCase());
  const categories = (tool.categories || []).map(c => c.toLowerCase());
  const currentTags = new Set((currentTool.tags || []).map(t => t.toLowerCase()));
  const currentCategories = new Set((currentTool.categories || []).map(c => c.toLowerCase()));
  
  // Base similarity score (tags/categories overlap)
  const tagOverlap = tags.filter(t => currentTags.has(t)).length;
  const categoryOverlap = categories.filter(c => currentCategories.has(c)).length;
  score += tagOverlap * 3;
  score += categoryOverlap * 2;
  
  // Intent-specific scoring
  switch (intentType) {
    case 'avatar_presenters':
      if (tags.some(t => t.includes('avatar'))) score += 10;
      if (categories.some(c => c.includes('avatar') || c.includes('presenter'))) score += 8;
      break;
    case 'editing_control':
      if (tags.some(t => t.includes('editor') || t.includes('edit') || t.includes('timeline'))) score += 10;
      if (categories.some(c => c.includes('editor') || c.includes('edit'))) score += 8;
      break;
    case 'stock_voice':
      if (tags.some(t => t.includes('text-to-video') || t.includes('repurposing') || t.includes('text to speech') || t.includes('stock'))) score += 10;
      if (categories.some(c => c.includes('text-to-video') || c.includes('repurposing'))) score += 8;
      break;
    case 'predictable_pricing':
      if (tool.has_free_trial) score += 10;
      if (typeof tool.starting_price === 'string' && tool.starting_price) {
        const priceLower = tool.starting_price.toLowerCase();
        if (priceLower.includes('free')) score += 8;
        const priceNum = parseFloat(tool.starting_price.replace(/[^0-9.]/g, ''));
        if (!isNaN(priceNum) && priceNum < 10) score += 6;
      }
      break;
  }
  
  // Rating bonus
  if (tool.rating && typeof tool.rating === 'number' && tool.rating > 0) {
    score += tool.rating / 5;
  }
  
  return score;
}

/**
 * Check if Descript should be allowed in this group
 */
function shouldAllowDescript(
  tool: Tool,
  intentType: GroupIntentType,
  currentTool: Tool
): boolean {
  if (tool.slug !== 'descript') return true;
  
  // Descript is only allowed if:
  // 1. Intent is editing_control, OR
  // 2. Current tool has editor tags
  if (intentType === 'editing_control') return true;
  
  const currentTags = (currentTool.tags || []).map(t => t.toLowerCase());
  if (currentTags.some(t => t.includes('editor') || t.includes('edit'))) return true;
  
  return false;
}

/**
 * Merge canonical structure with evidence copy
 * 
 * NEW BEHAVIOR:
 * - Per-group scoring: Each group independently scores and selects tools based on its intent
 * - Global deduplication: Each tool appears at most ONCE across all groups on a page
 * - Descript filtering: Descript only appears in editing_control groups (or if current tool is editor)
 * - Non-affiliate tools allowed: Runway, Sora can appear if similarity is high
 * - Tools without evidence allowed: Fallback copy with [NEED VERIFICATION]
 */
export function mergeCanonicalAndEvidence(
  config: CanonicalAlternativesConfig,
  evidenceMap: Map<string, ToolEvidence>,
  allTools: Tool[]
): AlternativeGroupWithEvidence[] {
  // Validate canonical config (only for legacy toolSlugs)
  const configValidation = validateCanonicalConfig(config, allTools);
  if (configValidation.warnings.length > 0) {
    configValidation.warnings.forEach(w => console.warn(w));
  }

  // Build tool lookup map
  const toolMap = new Map<string, Tool>();
  allTools.forEach(tool => {
    toolMap.set(tool.slug, tool);
  });

  const currentSlug = config.toolSlug;
  const currentTool = toolMap.get(currentSlug);
  if (!currentTool) {
    console.error(`[Alternatives] Current tool ${currentSlug} not found`);
    return [];
  }

  const targetToolsPerGroup = 2; // Target: 2-3 tools per group
  const maxToolsPerGroup = 3;
  const maxAppearancesPerTool = 1; // Each tool appears at most ONCE per page

  // ✅ NEW: Get trusted pool (relevance-based, not affiliate-based)
  const trustedPool = getTrustedAlternativesPool(currentSlug, allTools, {
    minBestMatch: 3,
    maxDeals: 2
  });

  // ✅ CRITICAL: Candidate pool must come from ALL tools, NOT from evidenceMap
  const allCandidateTools = allTools.filter(t => t.slug !== currentSlug);
  
  // A. Print candidate pool info (dev mode only)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Alternatives Candidate Pool] ${currentSlug}:`, {
      totalTools: allTools.length,
      candidateCount: allCandidateTools.length,
      candidateSlugs: allCandidateTools.map(t => t.slug).sort(),
      warning: allCandidateTools.length < 15 
        ? `⚠️ 候选池过小 (${allCandidateTools.length} < 15)，可能导致推荐趋同`
        : undefined
    });
    
    if (allCandidateTools.length < 15) {
      console.warn(`[Alternatives] 候选池过小 (${allCandidateTools.length} < 15)，可能导致推荐趋同`);
    }
  }

  // Track tool usage across ALL groups (global deduplication)
  const usedToolSlugs = new Set<string>();

  // Build groups with trusted recommendation structure
  const groups: AlternativeGroupWithEvidence[] = config.groups.map((group) => {
    const groupIntent = `${group.id} ${group.title} ${group.description}`;
    const intentType = getGroupIntentType(group.id, group.title, group.description);

    const bestMatch: AlternativeToolWithEvidence[] = [];
    const deals: AlternativeToolWithEvidence[] = [];

    // Helper to build and add tool
    const addTool = (tool: Tool, targetList: AlternativeToolWithEvidence[]) => {
      if (usedToolSlugs.has(tool.slug)) return false;
      if (!shouldAllowDescript(tool, intentType, currentTool)) return false;
      
      // Get evidence for THIS candidate tool (tool.slug), not currentSlug
      const evidence = evidenceMap.get(tool.slug);
      const toolWithEvidence = buildToolWithEvidence(tool, evidence, allTools, groupIntent, currentTool);
      targetList.push(toolWithEvidence);
      usedToolSlugs.add(tool.slug);
      return true;
    };

    // Step 1: Fill Best Match from trusted pool (Editorial, non-affiliate)
    // Filter by group intent relevance
    // ❌ REMOVED: Legacy hardcoded toolSlugs priority - now using relevance-based selection only
    const relevantBestMatch = trustedPool.bestMatch
      .filter(t => {
        const score = calculateGroupScore(t, intentType, currentTool);
        return score >= 2; // Minimum relevance threshold
      })
      .sort((a, b) => {
        const scoreA = calculateGroupScore(a, intentType, currentTool);
        const scoreB = calculateGroupScore(b, intentType, currentTool);
        return scoreB - scoreA;
      });

    for (const tool of relevantBestMatch) {
      if (bestMatch.length >= maxToolsPerGroup) break;
      addTool(tool, bestMatch);
    }

    // Step 2: Fill Deals from trusted pool (Sponsored, affiliate)
    const relevantDeals = trustedPool.deals
      .filter(t => {
        const score = calculateGroupScore(t, intentType, currentTool);
        return score >= 1; // Lower threshold for deals
      })
      .sort((a, b) => {
        const scoreA = calculateGroupScore(a, intentType, currentTool);
        const scoreB = calculateGroupScore(b, intentType, currentTool);
        return scoreB - scoreA;
      });

    for (const tool of relevantDeals) {
      if (deals.length >= 2) break; // Max 2 deals per group
      addTool(tool, deals);
    }

    // Step 3: Backfill if needed (from remaining candidates, scored by group intent)
    if (bestMatch.length + deals.length < targetToolsPerGroup) {
      const scoredCandidates: Array<{ tool: Tool; score: number }> = [];
      
      for (const tool of allCandidateTools) {
        if (usedToolSlugs.has(tool.slug)) continue;
        if (!shouldAllowDescript(tool, intentType, currentTool)) continue;
        
        const score = calculateGroupScore(tool, intentType, currentTool);
        if (score >= 1) { // Minimum threshold
          scoredCandidates.push({ tool, score });
        }
      }
      
      scoredCandidates.sort((a, b) => b.score - a.score);
      
      for (const { tool } of scoredCandidates) {
        if (bestMatch.length + deals.length >= maxToolsPerGroup) break;
        
        // Add to appropriate section
        if (isTryNowTool(tool.slug) && deals.length < 2) {
          addTool(tool, deals);
        } else if (!isTryNowTool(tool.slug) && bestMatch.length < maxToolsPerGroup) {
          addTool(tool, bestMatch);
        }
      }
    }

    // Combine for backward compatibility
    const allToolsInGroup = [...bestMatch, ...deals];

    return {
      id: group.id,
      title: group.title,
      description: group.description,
      tools: allToolsInGroup, // Legacy field
      bestMatch: bestMatch.length > 0 ? bestMatch : undefined,
      deals: deals.length > 0 ? deals : undefined,
      hasInsufficientCandidates: allToolsInGroup.length < targetToolsPerGroup
    };
  }).filter(group => (group.bestMatch?.length ?? 0) + (group.deals?.length ?? 0) > 0);

  // Dev-only debug logging
  if (process.env.NODE_ENV !== 'production') {
    const allSelectedSlugs = new Set<string>();
    groups.forEach(g => g.tools.forEach(t => allSelectedSlugs.add(t.slug)));
    
    console.log(`[Alternatives Debug] ${currentSlug}:`, {
      totalCandidates: allCandidateTools.length,
      totalSelected: allSelectedSlugs.size,
      uniqueToolsPerPage: allSelectedSlugs.size,
      groups: groups.map(g => ({
        id: g.id,
        title: g.title,
        intentType: getGroupIntentType(g.id, g.title, g.description),
        toolCount: g.tools.length,
        toolSlugs: g.tools.map(t => t.slug),
        toolNames: g.tools.map(t => t.name),
        hasInsufficientCandidates: g.hasInsufficientCandidates
      }))
    });
  }

  return groups;
}

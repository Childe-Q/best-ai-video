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
 * Generate fallback copy for tools without evidence
 */
function generateFallbackCopy(tool: Tool, groupIntent: string): {
  pickThisIf?: string;
  extraReason?: string;
} {
  const tags = (tool.tags || []).map(t => t.toLowerCase());
  const categories = (tool.categories || []).map(c => c.toLowerCase());
  
  // Generate pickThisIf based on group intent and tool properties
  let pickThisIf: string | undefined;
  
  if (groupIntent.includes('avatar')) {
    pickThisIf = tool.name + ' offers avatar-based video creation' + 
      (tags.includes('avatar') ? ' with realistic avatars' : '');
  } else if (groupIntent.includes('edit') || groupIntent.includes('control')) {
    pickThisIf = tool.name + ' provides manual editing control' +
      (tags.includes('editor') ? ' with timeline editing' : '');
  } else if (groupIntent.includes('stock') || groupIntent.includes('voice')) {
    pickThisIf = tool.name + ' includes stock assets' +
      (tags.includes('text-to-video') ? ' and text-to-video generation' : '');
  } else if (groupIntent.includes('pricing') || groupIntent.includes('cost')) {
    pickThisIf = tool.name + ' offers' +
      (tool.has_free_trial ? ' a free trial' : ' flexible pricing');
  } else {
    // Generic fallback
    const mainTag = tags[0] || categories[0] || 'video creation';
    pickThisIf = `${tool.name} specializes in ${mainTag}`;
  }
  
  // Add [NEED VERIFICATION] if no specific evidence
  if (!pickThisIf.includes('[NEED VERIFICATION]')) {
    pickThisIf += ' [NEED VERIFICATION]';
  }
  
  return { pickThisIf };
}

/**
 * Build AlternativeToolWithEvidence from tool data and evidence
 * Allows tools without evidence (with fallback copy)
 */
function buildToolWithEvidence(
  tool: Tool,
  evidence: ToolEvidence | undefined,
  allTools: Tool[],
  groupIntent: string = ''
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

  // Generate fallback copy if no evidence
  const fallbackCopy = !evidence ? generateFallbackCopy(tool, groupIntent) : {};

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
    // From evidence (copy only), or fallback if no evidence
    pickThisIf: evidence?.pickThisIf || fallbackCopy.pickThisIf,
    extraReason: evidence?.extraReason || fallbackCopy.extraReason,
    limitations: evidence?.limitations,
    evidenceLinks: evidence?.evidenceLinks || [], // Only show badge if evidence exists
    // From internal pricing data (never from evidence)
    pricingSignals,
    // Best for tags (from tool.best_for, can be enhanced by evidence but not structure)
    bestFor: evidence?.bestFor && evidence.bestFor.length > 0
      ? evidence.bestFor
      : tool.best_for?.split(/[,&]/).map((s: string) => s.trim()) || []
  };
}

/**
 * Check if a tool matches the group intent based on tags/categories
 */
function matchesGroupIntent(tool: Tool, groupId: string, groupTitle: string, groupDescription: string): boolean {
  const intentText = `${groupId} ${groupTitle} ${groupDescription}`.toLowerCase();
  const tags = (tool.tags || []).map(t => t.toLowerCase());
  const categories = (tool.categories || []).map(c => c.toLowerCase());
  
  // Avatar intent
  if (intentText.includes('avatar')) {
    return tags.some(t => t.includes('avatar')) || 
           categories.some(c => c.includes('avatar') || c.includes('presenter'));
  }
  
  // Editing/control intent
  if (intentText.includes('edit') || intentText.includes('control')) {
    return tags.some(t => t.includes('editor') || t.includes('edit') || t.includes('timeline')) ||
           categories.some(c => c.includes('editor') || c.includes('edit'));
  }
  
  // Stock/voice intent
  if (intentText.includes('stock') || intentText.includes('voice') || intentText.includes('audio')) {
    return tags.some(t => 
      t.includes('text-to-video') || 
      t.includes('repurposing') || 
      t.includes('text to speech') ||
      t.includes('stock')
    ) || categories.some(c => 
      c.includes('text-to-video') || 
      c.includes('repurposing')
    );
  }
  
  // Pricing/cost intent
  if (intentText.includes('pricing') || intentText.includes('cost')) {
    if (tool.has_free_trial) return true;
    if (typeof tool.starting_price === 'string' && tool.starting_price) {
      const priceLower = tool.starting_price.toLowerCase();
      if (priceLower.includes('free')) return true;
      const priceNum = parseFloat(tool.starting_price.replace(/[^0-9.]/g, ''));
      if (!isNaN(priceNum) && priceNum < 10) return true;
    }
    return false;
  }
  
  // Default: match if tool has any relevant tags
  return tags.length > 0 || categories.length > 0;
}

/**
 * Merge canonical structure with evidence copy
 * 
 * NEW BEHAVIOR:
 * - Canonical config only defines group structure (id, title, description)
 * - Tools are dynamically selected using getAlternativesShortlist from ALL tools (not evidence-only)
 * - Implements group intent filtering (each group prioritizes tools matching its intent)
 * - Implements cross-group deduplication (each tool appears max 2 times across all groups)
 * - Implements diversity backfill (if group has < N tools after dedup, fill from remaining candidates)
 * - Non-affiliate tools (runway, sora) are allowed if similarity is high enough
 * - Tools without evidence are allowed (with fallback copy)
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
  const targetToolsPerGroup = 3; // Target number of tools per group
  const maxAppearancesPerTool = 2; // Max times a tool can appear across all groups

  // ✅ CRITICAL: Candidate pool must come from ALL tools, NOT from evidenceMap
  // Evidence is only for enriching copy, not for filtering candidates
  const allCandidateTools = allTools.filter(t => t.slug !== currentSlug);
  
  // Get full shortlist (allows non-affiliate tools like runway, sora)
  // Use a larger pool to ensure diversity
  const fullShortlist = getAlternativesShortlist(
    currentSlug,
    allTools,
    targetToolsPerGroup * config.groups.length * 3, // Get 3x pool for diversity
    { onlyAffiliate: false } // Allow non-affiliate tools
  );

  // Track tool usage across all groups (for deduplication)
  const toolUsageCount = new Map<string, number>();

  // Build groups dynamically with intent filtering
  const groups: AlternativeGroupWithEvidence[] = config.groups.map((group, groupIndex) => {
    const tools: AlternativeToolWithEvidence[] = [];
    const groupUsedSlugs = new Set<string>();
    const groupIntent = `${group.id} ${group.title} ${group.description}`;

    // Step 1: If legacy toolSlugs exist, use them first (backward compatibility)
    if (group.toolSlugs && group.toolSlugs.length > 0) {
      for (const toolSlug of group.toolSlugs) {
        const tool = toolMap.get(toolSlug);
        if (!tool) continue;
        
        const usageCount = toolUsageCount.get(toolSlug) || 0;
        if (usageCount < maxAppearancesPerTool && !groupUsedSlugs.has(toolSlug)) {
          const evidence = evidenceMap.get(toolSlug);
          tools.push(buildToolWithEvidence(tool, evidence, allTools, groupIntent));
          toolUsageCount.set(toolSlug, usageCount + 1);
          groupUsedSlugs.add(toolSlug);
        }
      }
    }

    // Step 2: Prioritize tools matching group intent from shortlist
    const intentMatches: string[] = [];
    const otherCandidates: string[] = [];
    
    for (const toolSlug of fullShortlist) {
      if (groupUsedSlugs.has(toolSlug)) continue;
      
      const tool = toolMap.get(toolSlug);
      if (!tool) continue;
      
      const usageCount = toolUsageCount.get(toolSlug) || 0;
      if (usageCount >= maxAppearancesPerTool) continue;
      
      if (matchesGroupIntent(tool, group.id, group.title, group.description)) {
        intentMatches.push(toolSlug);
      } else {
        otherCandidates.push(toolSlug);
      }
    }
    
    // Fill from intent matches first
    for (const toolSlug of intentMatches) {
      if (tools.length >= targetToolsPerGroup) break;
      
      const tool = toolMap.get(toolSlug);
      if (!tool) continue;
      
      const usageCount = toolUsageCount.get(toolSlug) || 0;
      if (usageCount < maxAppearancesPerTool && !groupUsedSlugs.has(toolSlug)) {
        const evidence = evidenceMap.get(toolSlug);
        tools.push(buildToolWithEvidence(tool, evidence, allTools, groupIntent));
        toolUsageCount.set(toolSlug, usageCount + 1);
        groupUsedSlugs.add(toolSlug);
      }
    }
    
    // Step 3: Fill remaining slots from other candidates
    for (const toolSlug of otherCandidates) {
      if (tools.length >= targetToolsPerGroup) break;
      
      const tool = toolMap.get(toolSlug);
      if (!tool) continue;
      
      const usageCount = toolUsageCount.get(toolSlug) || 0;
      if (usageCount < maxAppearancesPerTool && !groupUsedSlugs.has(toolSlug)) {
        const evidence = evidenceMap.get(toolSlug);
        tools.push(buildToolWithEvidence(tool, evidence, allTools, groupIntent));
        toolUsageCount.set(toolSlug, usageCount + 1);
        groupUsedSlugs.add(toolSlug);
      }
    }

    // Step 4: Diversity backfill - if group still has < targetToolsPerGroup, 
    // fill from remaining ALL candidates (not just shortlist)
    if (tools.length < targetToolsPerGroup) {
      for (const tool of allCandidateTools) {
        if (tools.length >= targetToolsPerGroup) break;
        
        const usageCount = toolUsageCount.get(tool.slug) || 0;
        if (usageCount < maxAppearancesPerTool && !groupUsedSlugs.has(tool.slug)) {
          const evidence = evidenceMap.get(tool.slug);
          tools.push(buildToolWithEvidence(tool, evidence, allTools, groupIntent));
          toolUsageCount.set(tool.slug, usageCount + 1);
          groupUsedSlugs.add(tool.slug);
        }
      }
    }

    return {
      id: group.id,
      title: group.title,
      description: group.description,
      tools
    };
  }).filter(group => group.tools.length > 0); // Only return groups with tools

  // Dev-only debug logging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Alternatives Debug] ${currentSlug}:`, {
      totalCandidates: allCandidateTools.length,
      shortlistSize: fullShortlist.length,
      groups: groups.map(g => ({
        id: g.id,
        title: g.title,
        toolSlugs: g.tools.map(t => t.slug),
        toolNames: g.tools.map(t => t.name)
      }))
    });
  }

  return groups;
}

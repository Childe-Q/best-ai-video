import { Tool } from '@/types/tool';
import { AlternativeGroup, AlternativeTool, STANDARD_SWITCHING_REASONS } from '@/components/alternatives/types';
import { getRelatedComparisons } from './getRelatedLinks';
import alternativesEvidenceData from '@/data/alternativesEvidence.json';
import { alternativesEvidence } from '@/data/evidence/alternatives';
import { isTryNowTool } from './alternatives/affiliateWhitelist';
import { mapAlternativeCardCopy } from './alternatives/mapAlternativeCardCopy';

// Helper to check if tool has affiliate link
export function hasAffiliate(tool: Tool): boolean {
  return Boolean(
    tool.affiliate_link ||
    (tool as any).affiliateLink ||
    (tool as any).affiliate_url ||
    (tool as any).affiliateUrl
  );
}

// Helper to check if a claim is valid (no [NEED VERIFICATION])
export function isValidClaim(text: string): boolean {
  return !text.includes('[NEED VERIFICATION]') && text.trim().length > 0;
}

// Helper to clean claim (remove verification tags)
export function cleanClaim(text: string): string {
  return text.replace(/\[NEED VERIFICATION.*?\]/g, '').trim();
}

// Helper to filter and map evidence links (only internal, max 3, deduplicated)
export function filterEvidenceLinks(sources: { url: string }[]): string[] {
  const links = new Set<string>();
  for (const s of sources) {
    let url = s.url;
    // Map external URLs to internal paths if possible
    if (url && !url.startsWith('/')) {
      // Try to map common external patterns to internal paths
      if (url.includes('pricing')) {
        // Extract tool slug from URL if possible, otherwise skip
        continue;
      }
      // Skip external URLs
      continue;
    }
    if (url && url.startsWith('/') && url !== '' && url !== '#') {
      links.add(url);
    }
  }
  return Array.from(links).slice(0, 3);
}

// Truncate text to max words
export function truncateText(text: string, maxWords: number = 18): string {
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Build alternative tool data from evidence and tool data
 */
export function buildAlternativeTool(
  tool: Tool,
  evidence: any,
  currentToolSlug: string
): AlternativeTool | null {
  // Don't filter by affiliate_link here - allow all tools with evidence
  // Affiliate filtering is handled at the shortlist level

  const cardData: AlternativeTool = {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    logoUrl: tool.logo_url,
    startingPrice: tool.starting_price || 'Free Trial',
    rating: tool.rating,
    affiliateLink: tool.affiliate_link || '',
    hasFreeTrial: tool.has_free_trial,
    bestFor: [],
    whySwitch: [],
    tradeOff: null,
    pricingSignals: {},
    evidenceLinks: []
  };

  // Get compare link
  const comparisons = getRelatedComparisons(currentToolSlug);
  const compareLink = comparisons.find(c => 
    c.slug && (c.slug.includes(tool.slug) || c.slug.includes(`${currentToolSlug}-vs-${tool.slug}`) || c.slug.includes(`${tool.slug}-vs-${currentToolSlug}`))
  );
  if (compareLink && compareLink.slug) {
    cardData.compareLink = `/vs/${compareLink.slug}`;
  }

  // Merge evidence if available
  if (evidence) {
    // Best For - Show all available tags (no limit)
    cardData.bestFor = (evidence.bestFor || evidence.best_for || [])
      .filter((tag: string) => isValidClaim(tag))
      .map((tag: string) => cleanClaim(tag));

    // Fallback to tool.best_for if evidence missing
    if (cardData.bestFor.length === 0 && tool.best_for) {
      cardData.bestFor = tool.best_for.split(/[,&]/).map((s: string) => s.trim());
    }

    // Why Switch (filter, clean, truncate) - take up to 2 claims for "Pick this if" + highlight
    const validWhySwitch = (evidence.whySwitch || evidence.why_switch || [])
      .filter((item: any) => {
        // Check claim itself
        if (!item.claim || !isValidClaim(item.claim)) return false;
        // Check all facts in sources - if any fact has [NEED VERIFICATION], skip this claim
        if (item.sources && Array.isArray(item.sources)) {
          for (const source of item.sources) {
            if (source.facts && Array.isArray(source.facts)) {
              for (const fact of source.facts) {
                if (typeof fact === 'string' && fact.includes('[NEED VERIFICATION]')) {
                  return false;
                }
              }
            }
          }
        }
        return true;
      })
      .map((item: any) => cleanClaim(item.claim)) // Don't truncate - need full comparison sentences
      .slice(0, 2); // Take up to 2 claims: first for "Pick this if", second for highlight

    cardData.whySwitch = validWhySwitch;

    // Trade-off (filter, clean, truncate) - only take the strongest 1 claim
    const validTradeOffs = (evidence.tradeoffs || evidence.trade_offs || [])
      .filter((item: any) => {
        // Check claim itself
        if (!item.claim || !isValidClaim(item.claim)) return false;
        // Check all facts in sources - if any fact has [NEED VERIFICATION], skip this claim
        if (item.sources && Array.isArray(item.sources)) {
          for (const source of item.sources) {
            if (source.facts && Array.isArray(source.facts)) {
              for (const fact of source.facts) {
                if (typeof fact === 'string' && fact.includes('[NEED VERIFICATION]')) {
                  return false;
                }
              }
            }
          }
        }
        return true;
      })
      .map((item: any) => cleanClaim(item.claim)); // Don't truncate - need full limitation description
    if (validTradeOffs.length > 0) {
      cardData.tradeOff = validTradeOffs[0]; // Only 1 strongest tradeoff
    }

    // Pricing Signals (only valid claims)
    if (evidence.pricingSignals || evidence.pricing_signals) {
      const signals = evidence.pricingSignals || evidence.pricing_signals;
      if (signals.freePlan && isValidClaim(signals.freePlan.claim || signals.freePlan)) {
        cardData.pricingSignals.freePlan = cleanClaim(
          typeof signals.freePlan === 'string' ? signals.freePlan : signals.freePlan.claim
        );
      }
      if (signals.watermark && isValidClaim(signals.watermark.claim || signals.watermark)) {
        cardData.pricingSignals.watermark = cleanClaim(
          typeof signals.watermark === 'string' ? signals.watermark : signals.watermark.claim
        );
      }
      if (signals.exportQuality && isValidClaim(signals.exportQuality.claim || signals.exportQuality)) {
        cardData.pricingSignals.exportQuality = cleanClaim(
          typeof signals.exportQuality === 'string' ? signals.exportQuality : signals.exportQuality.claim
        );
      }
      if (signals.refundCancel && isValidClaim(signals.refundCancel.claim || signals.refundCancel)) {
        cardData.pricingSignals.refundCancel = cleanClaim(
          typeof signals.refundCancel === 'string' ? signals.refundCancel : signals.refundCancel.claim
        );
      }
    }

    // Evidence Links (collect from valid sources only, filter internal only, dedupe, max 2-3)
    const allSources: { url: string }[] = [];
    [...(evidence.whySwitch || evidence.why_switch || []), ...(evidence.tradeoffs || evidence.trade_offs || [])].forEach((item: any) => {
      // Only include sources from valid claims (no [NEED VERIFICATION])
      const hasVerification = item.claim && item.claim.includes('[NEED VERIFICATION]');
      if (hasVerification) return;
      
      if (item.sources && Array.isArray(item.sources)) {
        item.sources.forEach((s: any) => {
          // Check if any fact has [NEED VERIFICATION]
          let hasInvalidFact = false;
          if (s.facts && Array.isArray(s.facts)) {
            for (const fact of s.facts) {
              if (typeof fact === 'string' && fact.includes('[NEED VERIFICATION]')) {
                hasInvalidFact = true;
                break;
              }
            }
          }
          if (!hasInvalidFact && s.url && isValidClaim(s.url)) {
            allSources.push({ url: s.url });
          }
        });
      }
    });
    cardData.evidenceLinks = filterEvidenceLinks(allSources).slice(0, 3); // Max 3 links
  } else {
    // Fallback content if no evidence found (use tool data)
    cardData.bestFor = tool.best_for?.split(/[,&]/).map((s: string) => s.trim()) || [];
    cardData.whySwitch = (tool.pros || []).slice(0, 2).map(p => truncateText(p, 18));
    cardData.tradeOff = tool.cons?.[0] ? truncateText(tool.cons[0], 18) : null;
  }

  // Enhance card data with copy mapper to ensure high information density
  return mapAlternativeCardCopy(cardData, tool, evidence);
}

/**
 * Build alternative groups for a tool using standard switching reasons
 * Only includes tools that have evidence in alternativesEvidence.json
 * Ensures no duplicate tools across groups (cross-group deduplication)
 */
export function buildAlternativeGroups(
  currentTool: Tool,
  allTools: Tool[],
  toolShortlist: string[] = []
): AlternativeGroup[] {
  // Get evidence map from both JSON and TS files
  const evidenceMap = new Map<string, any>();
  // First, load from JSON file
  (alternativesEvidenceData as any[]).forEach(e => {
    evidenceMap.set(e.tool, e);
  });
  // Then, merge from TS file (overwrites JSON if exists, adds new entries)
  Object.entries(alternativesEvidence).forEach(([slug, evidence]) => {
    evidenceMap.set(slug, evidence);
  });

  // Filter tools: must be in shortlist
  // Note: If tool is in shortlist but has no evidence, we still include it (fallback to tool data)
  const candidateTools = (toolShortlist.length > 0
    ? allTools.filter(t => toolShortlist.includes(t.slug) && t.slug !== currentTool.slug)
    : allTools.filter(t => t.slug !== currentTool.slug));

  // Build all valid tools first
  // Priority: tools with evidence > tools without evidence (fallback)
  const validTools: AlternativeTool[] = candidateTools
    .map(t => {
      const evidence = evidenceMap.get(t.slug);
      return buildAlternativeTool(t, evidence, currentTool.slug);
    })
    .filter((t): t is AlternativeTool => {
      if (!t) return false;
      // If tool has evidence, must have valid content (no [NEED VERIFICATION])
      // If tool has no evidence, allow fallback content (from tool.pros/cons)
      const hasEvidence = evidenceMap.has(t.slug);
      if (hasEvidence) {
        // Must have at least one whySwitch claim and bestFor tags
        return t.whySwitch.length > 0 && t.bestFor.length > 0;
      } else {
        // Fallback: allow if has any content (pros/cons/bestFor)
        return t.bestFor.length > 0 || t.whySwitch.length > 0;
      }
    });

  // Cross-group deduplication: track used tools
  const usedToolSlugs = new Set<string>();

  // Build groups using standard switching reasons
  const groups: AlternativeGroup[] = STANDARD_SWITCHING_REASONS.map(reason => {
    // Pick tools for this group, skipping already used ones
    const toolsInGroup: AlternativeTool[] = [];
    for (const tool of validTools) {
      if (toolsInGroup.length >= 2) break; // Max 1-2 tools per group
      if (!usedToolSlugs.has(tool.slug)) {
        toolsInGroup.push(tool);
        usedToolSlugs.add(tool.slug);
      }
    }

    return {
      id: reason.id,
      title: reason.title,
      description: reason.description,
      tools: toolsInGroup
    };
  }).filter(g => g.tools.length > 0); // Only return groups with tools

  return groups;
}

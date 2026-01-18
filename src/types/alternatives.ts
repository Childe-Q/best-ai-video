/**
 * Canonical layer: Structure that cannot be overridden by AI evidence
 * 
 * Note: toolSlugs is now optional and deprecated. Tools are dynamically selected
 * using getAlternativesShortlist based on similarity scoring.
 */
export type CanonicalGroupConfig = {
  id: string; // e.g., 'cost-control', 'quality-issues', 'editing-control', 'workflow-speed'
  title: string; // Group title (e.g., "Cost control")
  description: string; // Group summary
  toolSlugs?: string[]; // DEPRECATED: Optional legacy tool slugs (for backward compatibility)
  // Tools are now dynamically selected via getAlternativesShortlist
};

export type CanonicalAlternativesConfig = {
  toolSlug: string; // The tool this alternatives page is for
  groups: CanonicalGroupConfig[]; // Fixed groups with tool lists
  // Filters are derived from tool properties, not config
};

/**
 * Evidence layer: Only copy/text content, no structure
 */
export type ToolEvidence = {
  toolSlug: string; // Must match a tool in tools.json
  pickThisIf?: string; // whySwitch[0].claim
  extraReason?: string; // whySwitch[1].claim (optional)
  limitations?: string; // tradeoffs[0].claim
  evidenceLinks?: string[]; // Deduplicated URLs from sources
  bestFor?: string[]; // Optional: can enhance tool.best_for but not replace structure
  // Pricing details are NEVER in evidence - always from internal pricing data
};

/**
 * Merged result for rendering
 */
export type AlternativeToolWithEvidence = {
  // From canonical (tool data)
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  startingPrice: string;
  rating?: number;
  affiliateLink: string;
  hasFreeTrial: boolean;
  // From evidence (copy only)
  pickThisIf?: string;
  extraReason?: string;
  limitations?: string;
  evidenceLinks: string[];
  // From internal pricing data (never from evidence)
  pricingSignals: {
    freePlan?: string;
    watermark?: string;
    exportQuality?: string;
    refundCancel?: string;
  };
  // Best for tags (from tool.best_for or evidence, but not structure)
  bestFor: string[];
};

export type AlternativeGroupWithEvidence = {
  id: string;
  title: string;
  description: string;
  tools: AlternativeToolWithEvidence[];
};

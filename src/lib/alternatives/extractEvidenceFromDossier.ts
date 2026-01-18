/**
 * Extract evidence-only data from dossier JSON
 * This removes all structure (groups, tool lists) and keeps only copy
 */

import { ToolEvidence } from '@/types/alternatives';
import { getToolByNameOrSlug } from './mapToolNameToSlug';

interface DossierAlternative {
  toolName: string;
  bestFor?: string[];
  whySwitch?: Array<{
    claim: string;
    sources?: Array<{
      url: string;
      type?: string;
      quote?: string;
    }>;
  }>;
  tradeoffs?: Array<{
    claim: string;
    sources?: Array<{
      url: string;
      type?: string;
      quote?: string;
    }>;
  }>;
}

interface DossierGroup {
  reasonTag?: string;
  reasonTitle?: string;
  reasonSummary?: string;
  alternatives?: DossierAlternative[];
}

interface DossierData {
  tool: string;
  collectedAt?: string;
  switchReasonGroups?: DossierGroup[];
}

/**
 * Extract evidence for a single tool from dossier alternative
 */
function extractToolEvidence(
  alt: DossierAlternative,
  targetToolSlug: string
): ToolEvidence | null {
  // Map tool name to slug
  const toolSlug = getToolByNameOrSlug(alt.toolName)?.slug;
  if (!toolSlug) {
    console.warn(
      `Cannot map tool name "${alt.toolName}" to slug. Skipping evidence extraction.`
    );
    return null;
  }

  // Extract pickThisIf (whySwitch[0])
  const pickThisIf = alt.whySwitch?.[0]?.claim?.trim();
  if (!pickThisIf || pickThisIf.includes('[NEED VERIFICATION]')) {
    // Skip if no valid claim
  }

  // Extract extraReason (whySwitch[1])
  const extraReason = alt.whySwitch?.[1]?.claim?.trim();
  if (extraReason && extraReason.includes('[NEED VERIFICATION]')) {
    // Skip if has verification tag
  }

  // Extract limitations (tradeoffs[0])
  const limitations = alt.tradeoffs?.[0]?.claim?.trim();
  if (limitations && limitations.includes('[NEED VERIFICATION]')) {
    // Skip if has verification tag
  }

  // Extract evidence links (dedupe URLs from all sources)
  const evidenceLinks = new Set<string>();
  [...(alt.whySwitch || []), ...(alt.tradeoffs || [])].forEach(item => {
    item.sources?.forEach(source => {
      if (source.url) {
        // Only include internal links (starting with /) or keep external for now
        // In production, you might want to filter to only internal
        evidenceLinks.add(source.url);
      }
    });
  });

  return {
    toolSlug,
    pickThisIf: pickThisIf && !pickThisIf.includes('[NEED VERIFICATION]') ? pickThisIf : undefined,
    extraReason: extraReason && !extraReason.includes('[NEED VERIFICATION]') ? extraReason : undefined,
    limitations: limitations && !limitations.includes('[NEED VERIFICATION]') ? limitations : undefined,
    evidenceLinks: Array.from(evidenceLinks).slice(0, 3) // Max 3 links
  };
}

/**
 * Extract all evidence from dossier JSON
 * Returns a map of toolSlug -> ToolEvidence
 */
export function extractEvidenceFromDossier(
  dossier: DossierData
): Map<string, ToolEvidence> {
  const evidenceMap = new Map<string, ToolEvidence>();

  if (!dossier.switchReasonGroups) {
    return evidenceMap;
  }

  for (const group of dossier.switchReasonGroups) {
    if (!group.alternatives) continue;

    for (const alt of group.alternatives) {
      const evidence = extractToolEvidence(alt, dossier.tool);
      if (evidence) {
        // Merge if evidence already exists for this tool
        const existing = evidenceMap.get(evidence.toolSlug);
        if (existing) {
          // Merge: prefer non-empty values
          evidenceMap.set(evidence.toolSlug, {
            toolSlug: evidence.toolSlug,
            pickThisIf: evidence.pickThisIf || existing.pickThisIf,
            extraReason: evidence.extraReason || existing.extraReason,
            limitations: evidence.limitations || existing.limitations,
            evidenceLinks: [...new Set([...(existing.evidenceLinks || []), ...(evidence.evidenceLinks || [])])].slice(0, 3)
          });
        } else {
          evidenceMap.set(evidence.toolSlug, evidence);
        }
      }
    }
  }

  return evidenceMap;
}

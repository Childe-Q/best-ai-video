/**
 * Universal Evidence Reader
 *
 * Reads and normalizes evidence JSON for any tool.
 * Server-side only (uses fs).
 */

import fs from 'fs';
import path from 'path';
import { normalizeEvidence, getEmptyEvidence, RawEvidence, EvidenceNormalized } from './normalizeEvidence';

// =============================================================================
// Main API
// =============================================================================

/**
 * Read and normalize evidence for a specific tool slug.
 *
 * @param slug - Tool slug (e.g., "fliki", "heygen")
 * @returns Normalized evidence or null if file not found/invalid
 *
 * @example
 * const evidence = readEvidence('fliki');
 * if (evidence) {
 *   console.log(evidence.nuggets);
 * }
 */
export function readEvidence(slug: string): EvidenceNormalized | null {
  const evidencePath = path.join(process.cwd(), 'data', 'evidence', `${slug}.json`);

  // Read file
  let fileContent: string;
  try {
    fileContent = fs.readFileSync(evidencePath, 'utf-8');
  } catch (error) {
    console.warn(`[evidence] File not found: ${evidencePath}`);
    return null;
  }

  // Parse JSON
  let rawData: RawEvidence;
  try {
    rawData = JSON.parse(fileContent) as RawEvidence;
  } catch (error) {
    console.warn(`[evidence] Invalid JSON for ${slug}:`, error);
    return null;
  }

  // Validate basic structure - support both nuggets and hardFacts
  if (!rawData || (!rawData.nuggets && !rawData.hardFacts)) {
    console.warn(`[evidence] Invalid structure for ${slug}: missing nuggets/hardFacts array`);
    return null;
  }

  // Normalize
  return normalizeEvidence(rawData, slug);
}

/**
 * Get evidence for a specific theme only
 */
export function getEvidenceByTheme(slug: string, theme: string) {
  const evidence = readEvidence(slug);
  if (!evidence) return [];

  return evidence.nuggets.filter(n => n.theme === theme);
}

/**
 * Get all unique source URLs from evidence
 */
export function getEvidenceSources(slug: string): string[] {
  const evidence = readEvidence(slug);
  if (!evidence) return [];

  const sources = new Set<string>();
  evidence.nuggets.forEach(nugget => {
    if (nugget.sourceUrl) {
      sources.add(nugget.sourceUrl);
    }
  });
  return Array.from(sources);
}

/**
 * Check if evidence exists and has nuggets
 */
export function hasEvidence(slug: string): boolean {
  const evidence = readEvidence(slug);
  return evidence !== null && evidence.nuggets.length > 0;
}

// =============================================================================
// Server Component Helper
// =============================================================================

/**
 * Get evidence for use in server components/pages.
 * Returns empty evidence structure if not found (safer for UI).
 */
export function getEvidenceForPage(slug: string): EvidenceNormalized {
  const evidence = readEvidence(slug);
  if (evidence) return evidence;
  return getEmptyEvidence(slug);
}

import { VsComparison } from '@/types/vs';
import { buildDecisionTableRows } from '@/lib/vsDecisionTable';

/**
 * Checks if a specific string from a decision table cell is just placeholder text.
 */
export function isPlaceholderText(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return (
    !normalized ||
    normalized.includes('pending verification') ||
    normalized === 'see product docs' ||
    normalized === 'check current pricing' ||
    normalized === 'check plan limits' ||
    normalized === 'not explicitly listed' ||
    normalized === 'see product positioning'
  );
}

/**
 * Determines if a VS comparison has enough quality data to be exposed to search engines.
 * 
 * Rules:
 * - Decision table must have 5-8 valid rows
 * - Decision table rows must not contain generic placeholders
 * - Must have at least 3 key diffs
 * - Must have scoring data for both tools
 * - Must have a final verdict recommendation
 */
export function isComparisonReady(comparison: VsComparison | null | undefined): boolean {
  if (!comparison) return false;
  
  // 1. Check matrix rows
  const decisionRows = buildDecisionTableRows(comparison.matrixRows, comparison.slugA, comparison.slugB);
  const tableReady =
    decisionRows.length >= 5 &&
    decisionRows.length <= 8 &&
    decisionRows.every((row) => !isPlaceholderText(row.aText) && !isPlaceholderText(row.bText));
    
  // 2. Check key diffs
  const hasKeyDiffs = Boolean(comparison.keyDiffs && comparison.keyDiffs.length >= 3);
  
  // 3. Check scores
  const hasScore = Boolean(
    comparison.score && 
    Object.keys(comparison.score.a ?? {}).length > 0 && 
    Object.keys(comparison.score.b ?? {}).length > 0
  );
  
  // 4. Check verdict
  const hasVerdict = Boolean(comparison.verdict?.recommendation);
  
  return tableReady && hasKeyDiffs && hasScore && hasVerdict;
}

import { Tool } from '@/types/tool';

/**
 * Replace hardcoded comparison references (e.g., "than InVideo", "than Pika") 
 * with the current tool's name, or neutralize the sentence if replacement fails
 */
export function normalizeEvidenceText(
  text: string | undefined,
  currentTool: Tool,
  allTools: Tool[]
): string | undefined {
  if (!text) return undefined;

  // Common tool names that might appear in evidence text
  const toolNamePatterns = allTools
    .filter(t => t.slug !== currentTool.slug)
    .map(t => ({
      name: t.name,
      slug: t.slug,
      // Also match common variations
      variations: [
        t.name,
        t.name.toLowerCase(),
        t.slug,
        t.slug.replace(/-/g, ' '),
        t.slug.replace(/-/g, '')
      ]
    }));

  let normalized = text;

  // Replace "than [ToolName]" patterns
  for (const toolInfo of toolNamePatterns) {
    for (const variation of toolInfo.variations) {
      // Match "than ToolName" or "than tool-name" (case-insensitive)
      const regex = new RegExp(`\\bthan\\s+${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(normalized)) {
        normalized = normalized.replace(regex, `than ${currentTool.name}`);
        break; // Only replace once per tool
      }
    }
  }

  // Replace "compared to [ToolName]" patterns
  for (const toolInfo of toolNamePatterns) {
    for (const variation of toolInfo.variations) {
      const regex = new RegExp(`\\bcompared\\s+to\\s+${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(normalized)) {
        normalized = normalized.replace(regex, `compared to ${currentTool.name}`);
        break;
      }
    }
  }

  // Replace "vs [ToolName]" or "versus [ToolName]" patterns
  for (const toolInfo of toolNamePatterns) {
    for (const variation of toolInfo.variations) {
      const regex = new RegExp(`\\b(vs|versus)\\s+${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(normalized)) {
        normalized = normalized.replace(regex, `$1 ${currentTool.name}`);
        break;
      }
    }
  }

  // If still contains hardcoded tool references that we couldn't replace,
  // neutralize by removing the comparison or making it generic
  const hasUnmatchedComparison = /\bthan\s+[A-Z][a-z]+/i.test(normalized) ||
    /\bcompared\s+to\s+[A-Z][a-z]+/i.test(normalized) ||
    /\b(vs|versus)\s+[A-Z][a-z]+/i.test(normalized);

  if (hasUnmatchedComparison) {
    // Neutralize: remove the comparison part or make it generic
    normalized = normalized
      .replace(/\bthan\s+[A-Z][a-z]+/gi, '')
      .replace(/\bcompared\s+to\s+[A-Z][a-z]+/gi, '')
      .replace(/\b(vs|versus)\s+[A-Z][a-z]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If the sentence becomes too short or meaningless, add a neutral prefix
    if (normalized.length < 20) {
      normalized = `This tool offers ${normalized}`;
    }
  }

  return normalized;
}

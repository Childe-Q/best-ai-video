import { Tool } from '@/types/tool';
import { ToolContent } from '@/types/toolContent';
import { loadToolContent } from '@/lib/loadToolContent';

/**
 * Determines if a tool's features page is "thin" — lacking enough unique
 * data points to justify a standalone indexed page.
 *
 * Criteria (matches the data sources used by ToolFeaturesPageTemplate):
 * - keyCapabilities: from tool.features, content.features.keyFeatures,
 *   content.features.detailedFeatures, tool.featureCards
 * - deepDiveEvidence: from tool.key_facts, tool.highlights, tool.features,
 *   tool.featureCards, content.features.keyFeatures — only items that
 *   match at least one topic theme
 *
 * A page is thin if:
 * - keyCapabilities < 3  AND  deepDiveEvidence < 4
 *   (i.e. there isn't enough data for either the Key Capabilities section
 *    OR the Feature Deep Dives section to be substantive)
 */
export function isFeaturePageThin(tool: Tool, content?: ToolContent | null): boolean {
  // Count unique key capabilities (mirrors generateKeyCapabilities logic)
  const capTitles = new Set<string>();

  if (content?.features?.keyFeatures) {
    content.features.keyFeatures.forEach((f) => capTitles.add(f));
  }
  if (content?.features?.detailedFeatures) {
    content.features.detailedFeatures.forEach((f) => capTitles.add(f.title));
  }
  if (tool.features) {
    tool.features.forEach((f) => capTitles.add(f));
  }
  if (tool.featureCards) {
    tool.featureCards.forEach((c) => capTitles.add(c.title));
  }

  // Count evidence nuggets that would produce deep dives
  // (simplified version of generateFeatureDeepDives' extractEvidence)
  const evidenceTexts: string[] = [];
  const addArr = (arr: string[] | undefined) => {
    if (!arr) return;
    arr.forEach((s) => {
      s.split(/[;.]/)
        .filter((p) => p.trim().length > 5)
        .forEach((p) => evidenceTexts.push(p.trim()));
    });
  };

  addArr(tool.key_facts);
  addArr(tool.highlights);
  addArr(tool.features);
  if (tool.best_for) evidenceTexts.push(tool.best_for);
  if (tool.featureCards) {
    tool.featureCards.forEach((c) => {
      evidenceTexts.push(c.title);
      if (c.description) evidenceTexts.push(c.description);
    });
  }
  if (content?.features?.keyFeatures) addArr(content.features.keyFeatures);

  // Theme-matching regex (simplified from generateFeatureDeepDives TOPICS)
  const themeRegex =
    /\b(workflow|speed|minutes?|seconds?|fast|render|auto|batch|timeline|subtitle|caption|font|edit|canvas|layer|scene|transition|stock|library|asset|voice|language|accent|clone|4k|1080p|720p|export|format|mp4|avatar|character|lip-sync|presenter|team|collab|seat|sso|workspace|brand\s*kit|credit|watermark|trial|free|expire|refund|cap|quota)\b/i;
  const themedCount = evidenceTexts.filter((t) => themeRegex.test(t)).length;

  const keyCapCount = capTitles.size;

  // Thin = not enough data for EITHER main section
  return keyCapCount < 3 && themedCount < 4;
}

/**
 * Convenience: load content and check thinness for a given slug.
 */
export function isFeaturePageThinBySlug(tool: Tool, slug: string): boolean {
  const content = loadToolContent(slug);
  return isFeaturePageThin(tool, content);
}

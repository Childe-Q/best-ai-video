import { Tool } from '@/types/tool';
import { ToolContent } from '@/types/toolContent';
import { loadToolContent } from '@/lib/loadToolContent';
import { loadReviewsData } from '@/lib/loadReviewsData';

/**
 * Determines if a tool's reviews page is "thin" — lacking enough data
 * to render substantive review content for indexing.
 *
 * Mirrors the buildReviewsData logic:
 * - userFeedbackSnapshot: needs ≥2 items (likes + complaints from
 *   reviewHighlights OR extracted from pros/cons/features/keyFacts)
 * - commonIssues: needs ≥2 items (from reviewHighlights.commonIssues
 *   OR cons)
 * - faqs: needs ≥3 deduplicated items
 *
 * A page is thin if fewer than 2 of these 3 sections would render.
 */
export function isReviewPageThin(tool: Tool, content?: ToolContent | null): boolean {
  // If a dedicated reviews JSON file exists, the page is always rich
  const reviewsData = loadReviewsData(tool.slug);
  if (reviewsData) return false;

  // --- Check section 1: userFeedbackSnapshot ---
  const reviewHighlights = content?.reviews?.reviewHighlights || tool.content?.reviews?.reviewHighlights;

  let hasFeedbackSnapshot = false;
  if (reviewHighlights) {
    const likes = (reviewHighlights.likes || []).length;
    const complaints = (reviewHighlights.complaints || []).length;
    hasFeedbackSnapshot = likes + complaints >= 2;
  } else {
    // Fallback: extractFactualLikes from pros/features/keyFeatures/keyFacts
    const factualSources = [
      ...(content?.pros || tool.pros || []),
      ...(tool.features || []),
      ...(content?.features?.keyFeatures || []),
      ...(tool.key_facts || []),
    ];
    const factualKeywords = /\b(export|resolution|language|format|plan|tier|workflow|feature|support|integration)\b/i;
    const subjectiveKeywords = /\b(great|excellent|amazing|wonderful|best|perfect)\b/i;
    const factualLikes = factualSources.filter(
      (item) => factualKeywords.test(item) && !subjectiveKeywords.test(item)
    ).length;

    const complaints = [...(content?.cons || []), ...(tool.cons || [])].length;
    hasFeedbackSnapshot = factualLikes + complaints >= 2;
  }

  // --- Check section 2: commonIssues ---
  let hasCommonIssues = false;
  if (reviewHighlights?.commonIssues && reviewHighlights.commonIssues.length >= 2) {
    hasCommonIssues = true;
  } else {
    const allCons = [...(content?.cons || []), ...(tool.cons || [])];
    hasCommonIssues = allCons.length >= 2;
  }

  // --- Check section 3: faqs ---
  const faqCount = (tool.faqs || []).length;
  const hasFaqs = faqCount >= 3;

  // Count how many sections would render
  const sectionsRendered = [hasFeedbackSnapshot, hasCommonIssues, hasFaqs].filter(Boolean).length;

  // Thin = fewer than 2 sections would render
  return sectionsRendered < 2;
}

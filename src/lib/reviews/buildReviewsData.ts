import { Tool } from '@/types/tool';
import { ToolContent } from '@/types/toolContent';
import { ReviewsPageData } from '@/components/reviews/ReviewsPageTemplate';
import { FAQ } from '@/lib/generateSmartFAQs';

type ReviewHighlights = NonNullable<ToolContent['reviews']>['reviewHighlights'];

/**
 * Determine severity based on keywords in the issue text
 */
function determineSeverity(text: string): 'low' | 'med' | 'high' {
  const lowerText = text.toLowerCase();
  
  // High severity keywords
  if (lowerText.includes('refund') || lowerText.includes('cancel') || 
      lowerText.includes('export fail') || lowerText.includes('bug') ||
      lowerText.includes('data loss') || lowerText.includes('security')) {
    return 'high';
  }
  
  // Medium severity keywords
  if (lowerText.includes('credit') || lowerText.includes('watermark') ||
      lowerText.includes('limit') || lowerText.includes('expire') ||
      lowerText.includes('slow') || lowerText.includes('lag')) {
    return 'med';
  }
  
  return 'low';
}

/**
 * Normalize question text for deduplication (ignore case, punctuation, whitespace)
 * Reuses the same logic from generateSmartFAQs for consistency
 */
function normalizeQuestionForDedup(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Deduplicate FAQs by question text
 */
export function deduplicateFAQs(faqs: FAQ[]): FAQ[] {
  const seen = new Set<string>();
  const deduplicated: FAQ[] = [];
  
  for (const faq of faqs) {
    const normalized = normalizeQuestionForDedup(faq.question);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      deduplicated.push(faq);
    }
  }
  
  return deduplicated;
}

/**
 * Extract fact-based likes from pros, features, and key facts
 * Only includes factual statements (e.g., "1080p export on paid plan"), not subjective adjectives
 */
function extractFactualLikes(
  pros: string[] | undefined,
  features: string[] | undefined,
  keyFeatures: string[] | undefined,
  keyFacts: string[] | undefined
): string[] {
  const allSources = [
    ...(pros || []),
    ...(features || []),
    ...(keyFeatures || []),
    ...(keyFacts || [])
  ];
  
  // Filter for factual statements (avoid subjective adjectives)
  const factualLikes = allSources
    .filter(item => {
      const lower = item.toLowerCase();
      // Exclude subjective words
      if (lower.includes('great') || lower.includes('excellent') || 
          lower.includes('amazing') || lower.includes('wonderful') ||
          lower.includes('best') || lower.includes('perfect')) {
        return false;
      }
      // Include factual statements about features, capabilities, limits
      return lower.includes('export') || lower.includes('resolution') ||
             lower.includes('language') || lower.includes('format') ||
             lower.includes('plan') || lower.includes('tier') ||
             lower.includes('workflow') || lower.includes('feature') ||
             lower.includes('support') || lower.includes('integration');
    })
    .slice(0, 3);
  
  return factualLikes;
}

/**
 * Generate user feedback snapshot from multiple sources
 * Returns both likes and complaints, with proper fallback logic
 */
function generateFeedbackSnapshot(
  tool: Tool,
  content: ToolContent | null,
  reviewHighlights: ReviewHighlights | undefined
): ReviewsPageData['userFeedbackSnapshot'] | undefined {
  // Priority 1: Use reviewHighlights if available (highest quality)
  if (reviewHighlights) {
    const likes = (reviewHighlights.likes || []).slice(0, 3);
    const complaints = (reviewHighlights.complaints || []).slice(0, 3);
    
    if (likes.length + complaints.length >= 2) {
      return [
        ...likes.map(like => ({
          point: like,
          type: 'positive' as const
        })),
        ...complaints.map(complaint => ({
          point: complaint,
          type: 'negative' as const
        }))
      ];
    }
  }
  
  // Priority 2: Generate from available data sources
  const allCons = [
    ...(content?.cons || []),
    ...(tool.cons || [])
  ];
  
  // Extract likes from pros/features (factual only)
  const likes = extractFactualLikes(
    content?.pros || tool.pros,
    tool.features,
    content?.features?.keyFeatures,
    tool.key_facts
  );
  
  // Extract complaints from cons
  const complaints = allCons.slice(0, 3);
  
  // Only return if we have at least 2 items total
  if (likes.length + complaints.length >= 2) {
    return [
      ...likes.map(like => ({
        point: like,
        type: 'positive' as const
      })),
      ...complaints.map(complaint => ({
        point: complaint, // No "用户反馈：" prefix
        type: 'negative' as const
      }))
    ];
  }
  
  return undefined;
}

/**
 * Clean action text by removing "use case" suffixes and variables
 */
function cleanActionText(text: string): string {
  return text
    .replace(/\s*use\s+case\s*$/i, '') // Remove trailing "use case"
    .replace(/\s*\{useCase\}\s*/gi, '') // Remove {useCase} variable
    .replace(/\s*\$?\{use_case\}\s*/gi, '') // Remove ${use_case} variable
    .replace(/\s*useCase\s*/gi, '') // Remove useCase variable
    .trim();
}

/**
 * Generate default action text based on evidence type
 */
function getDefaultAction(evidenceType: 'user' | 'official'): string {
  if (evidenceType === 'official') {
    return 'Check official docs or terms of service for details.';
  }
  return 'Check official docs or ask support before upgrading.';
}

/**
 * Generate common issues from cons/painPoints
 * Only generates if we have at least 2 items
 */
function generateCommonIssues(
  cons: string[] | undefined,
  reviewHighlights: ReviewHighlights | undefined
): ReviewsPageData['commonIssues'] | undefined {
  // Priority 1: Use reviewHighlights.commonIssues if available
  if (reviewHighlights?.commonIssues && reviewHighlights.commonIssues.length >= 2) {
    return reviewHighlights.commonIssues.slice(0, 8).map(issue => {
      // Determine evidence type from impact text
      const evidenceType = issue.impact?.toLowerCase().includes('official') || 
                          issue.impact?.toLowerCase().includes('documented')
        ? 'official' 
        : 'user';
      
      // Clean whatToDo text and remove "use case" suffix
      const cleanedAction = issue.whatToDo 
        ? cleanActionText(issue.whatToDo)
        : getDefaultAction(evidenceType);
      
      return {
        point: issue.claim,
        flag: (evidenceType === 'official' ? 'Official' : 'User feedback') as 'Official' | 'User feedback',
        // Store cleaned action in a custom property that gets transformed in the component
        _action: cleanedAction || getDefaultAction(evidenceType)
      };
    });
  }
  
  // Priority 2: Generate from cons (as user feedback)
  if (cons && cons.length >= 2) {
    return cons.slice(0, 8).map(con => {
      return {
        point: con,
        flag: 'User feedback' as const,
        sourceType: 'User feedback',
        _action: getDefaultAction('user')
      };
    });
  }
  
  return undefined;
}

/**
 * Build unified reviews page data from all available sources
 * Implements graceful degradation: only shows sections with sufficient data
 */
export function buildReviewsData(
  tool: Tool,
  content: ToolContent | null,
  reviewsData: ReviewsPageData | null,
  smartFAQs: FAQ[]
): ReviewsPageData {
  // If reviews JSON exists, use it (highest priority) - preserves original data like invideo.json
  if (reviewsData) {
    // Still need to deduplicate FAQs
    const deduplicatedFAQs = deduplicateFAQs(
      reviewsData.faqs?.map(f => ({ question: f.q, answer: f.a })) || []
    );
    
    return {
      ...reviewsData,
      // Preserve original userFeedbackSnapshot from JSON (no modification)
      userFeedbackSnapshot: reviewsData.userFeedbackSnapshot,
      faqs: deduplicatedFAQs.length > 0
        ? deduplicatedFAQs.slice(0, 8).map(f => ({ q: f.question, a: f.answer }))
        : undefined
    };
  }
  
  // Fallback: Build from tool.content and tool data
  const reviewHighlights = content?.reviews?.reviewHighlights || tool.content?.reviews?.reviewHighlights;
  const allCons = [
    ...(content?.cons || []),
    ...(tool.cons || [])
  ];
  
  // Generate feedback snapshot (only if >= 2 items)
  const userFeedbackSnapshot = generateFeedbackSnapshot(tool, content, reviewHighlights);
  
  // Generate common issues (only if >= 2 items)
  const commonIssues = generateCommonIssues(allCons, reviewHighlights);
  
  // Deduplicate and limit FAQs
  const deduplicatedFAQs = deduplicateFAQs(smartFAQs);
  const faqs = deduplicatedFAQs.length >= 3
    ? deduplicatedFAQs.slice(0, 8).map(f => ({ q: f.question, a: f.answer }))
    : undefined;
  
  return {
    userFeedbackSnapshot: userFeedbackSnapshot && userFeedbackSnapshot.length >= 2
      ? userFeedbackSnapshot
      : undefined,
    commonIssues: commonIssues && commonIssues.length >= 2
      ? commonIssues
      : undefined,
    faqs
  };
}

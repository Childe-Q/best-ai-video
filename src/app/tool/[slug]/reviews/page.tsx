import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';
import ReviewsPageTemplate, { ReviewsPageData } from '@/components/reviews/ReviewsPageTemplate';
import { loadReviewsData } from '@/lib/loadReviewsData';
import { loadToolContent } from '@/lib/loadToolContent';
import { generateSmartFAQs } from '@/lib/generateSmartFAQs';
import { buildReviewsData } from '@/lib/reviews/buildReviewsData';

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();

  return {
    title: `${tool.name} Reviews & User Feedback (${seoYear})`,
    description: `Read real user reviews and feedback about ${tool.name}. See what users love and what could be improved.`,
    alternates: {
      canonical: `/tool/${slug}/reviews`,
    },
  };
}

export default async function ReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  // Priority 1: Load from reviews JSON file
  const reviewsData = loadReviewsData(slug);
  
  // Priority 2: Fallback to tool.content or tool data
  const content = loadToolContent(slug);
  const reviewHighlights = content?.reviews?.reviewHighlights || tool.content?.reviews?.reviewHighlights;
  
  // Collect all available FAQs from different sources
  const rawFaqs = [
    ...(content?.reviews?.faqs || []),
    ...(tool.content?.reviews?.faqs || []),
    ...(tool.faqs || [])
  ];
  
  // Use smart FAQ generation to sort and select FAQs
  const smartFAQs = generateSmartFAQs({
    tool,
    content,
    rawFaqs,
    slug
  });

  // Clean "use case" from reviewsData if it exists (before passing to builder)
  if (reviewsData?.commonIssues) {
    reviewsData.commonIssues = reviewsData.commonIssues.map(issue => {
      // Clean any "use case" suffix from point text
      const cleanPoint = issue.point
        .replace(/\s*use\s+case\s*$/i, '')
        .replace(/\s*\{useCase\}\s*/gi, '')
        .replace(/\s*\$?\{use_case\}\s*/gi, '')
        .trim();
      
      return {
        ...issue,
        point: cleanPoint
      };
    });
  }
  
  // Build ReviewsPageData using unified builder (handles all fallbacks and deduplication)
  const pageData = buildReviewsData(tool, content, reviewsData, smartFAQs);

  // A. Dev console logging for data structure inspection
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Reviews Page Data] ${slug}:`, {
      hasReviewsData: !!reviewsData,
      hasReviewHighlights: !!reviewHighlights,
      userFeedbackSnapshot: pageData.userFeedbackSnapshot?.length || 0,
      commonIssues: pageData.commonIssues?.length || 0,
      faqs: pageData.faqs?.length || 0,
      rawFaqsCount: rawFaqs.length,
      smartFAQsCount: smartFAQs.length,
      toolCons: tool.cons?.length || 0,
      contentCons: content?.cons?.length || 0,
      finalData: {
        userFeedbackSnapshot: pageData.userFeedbackSnapshot,
        commonIssues: pageData.commonIssues,
        faqs: pageData.faqs
      }
    });
  }

  return <ReviewsPageTemplate toolSlug={slug} data={pageData} />;
}

import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';
import ReviewsPageTemplate, { ReviewsPageData } from '@/components/reviews/ReviewsPageTemplate';
import { loadReviewsData } from '@/lib/loadReviewsData';
import { loadToolContent } from '@/lib/loadToolContent';
import { generateSmartFAQs } from '@/lib/generateSmartFAQs';

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

  // Build ReviewsPageData from available sources
  const pageData: ReviewsPageData = reviewsData || {
    // Transform reviewHighlights to userFeedbackSnapshot format
    userFeedbackSnapshot: reviewHighlights ? [
      ...(reviewHighlights.likes || []).map(like => ({
        point: like,
        type: 'positive' as const
      })),
      ...(reviewHighlights.complaints || []).map(complaint => ({
        point: complaint,
        type: 'negative' as const
      }))
    ].slice(0, 6) : undefined,
    
    // Transform commonIssues format
    commonIssues: reviewHighlights?.commonIssues && reviewHighlights.commonIssues.length > 0
      ? reviewHighlights.commonIssues.slice(0, 8).map(issue => ({
          point: issue.claim,
          flag: 'User feedback' as const
        }))
      : undefined,
    
    // Use smart FAQs (already sorted and limited to 8)
    faqs: smartFAQs.length > 0
      ? smartFAQs.map(faq => ({
          q: faq.question,
          a: faq.answer
        }))
      : undefined
  };

  return <ReviewsPageTemplate toolSlug={slug} data={pageData} />;
}

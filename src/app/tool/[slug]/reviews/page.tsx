import { notFound } from 'next/navigation';
import { getAllTools, getToolBySlug } from '@/lib/toolData';
import { getSEOCurrentYear } from '@/lib/utils';
import ReviewsPageTemplate from '@/components/reviews/ReviewsPageTemplate';
import { loadReviewsData } from '@/lib/loadReviewsData';
import { generateSmartFAQs } from '@/lib/generateSmartFAQs';
import { buildReviewsData } from '@/lib/reviews/buildReviewsData';
import { buildFaqJsonLd } from '@/lib/jsonLd';
import { isReviewPageThin } from '@/lib/reviews/isReviewPageThin';

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const toolEntry = getToolBySlug(slug);
  const tool = toolEntry?.tool;
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();
  const content = tool.content;
  const thin = isReviewPageThin(tool, content);

  return {
    title: `${tool.name} Reviews & User Feedback (${seoYear})`,
    description: `Read real user reviews and feedback about ${tool.name}. See what users love and what could be improved.`,
    alternates: {
      canonical: `/tool/${slug}/reviews`,
    },
    ...(thin
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}

export default async function ReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const toolEntry = getToolBySlug(slug);
  const tool = toolEntry?.tool;

  if (!tool) notFound();

  // Priority 1: Load from reviews JSON file
  const reviewsData = loadReviewsData(slug);
  
  // Priority 2: Fallback to tool.content or tool data
  const content = tool.content;
  const reviewHighlights = content.reviews?.reviewHighlights;
  
  // Collect all available FAQs from different sources
  const rawFaqs = [
    ...(content.reviews?.faqs || []),
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
      contentCons: tool.cons?.length || 0,
      finalData: {
        userFeedbackSnapshot: pageData.userFeedbackSnapshot,
        commonIssues: pageData.commonIssues,
        faqs: pageData.faqs
      }
    });
  }

  const visibleFaqs = (pageData.faqs ?? [])
    .slice(0, 8)
    .map((faq) => ({ question: faq.q, answer: faq.a }));

  return (
    <>
      {visibleFaqs.length >= 3 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqJsonLd(visibleFaqs)),
          }}
        />
      ) : null}
      <ReviewsPageTemplate toolSlug={slug} data={pageData} />
    </>
  );
}

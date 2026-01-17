import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';
import FAQAccordion from '@/components/FAQAccordion';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

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

  const reviewHighlights = tool.content?.reviews?.reviewHighlights;
  const faqs = tool.content?.reviews?.faqs || tool.faqs || [];

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24 space-y-8">
        {/* What Users Are Saying Section - Pro Insight Card */}
        {tool.user_sentiment && (
          <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border-l-4 border-indigo-500 p-8">
            {/* Header with Quote Icon */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">🤖 AI Summary of User Reviews</h2>
            </div>
            
            {/* Content with Markdown Support */}
            <div 
              className="text-gray-700 leading-relaxed mb-4 prose prose-indigo max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: tool.user_sentiment
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                  .replace(/\n/g, '<br />')
              }} 
            />
            
            {/* Footer */}
            <p className="text-xs text-gray-400 text-right">Summarized from verified reviews on Product Hunt & G2</p>
          </div>
        )}

        {/* User Feedback Snapshot */}
        {reviewHighlights && (reviewHighlights.likes || reviewHighlights.complaints) && (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User feedback snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What users like */}
              {reviewHighlights.likes && reviewHighlights.likes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What users like</h3>
                  <ul className="space-y-2">
                    {reviewHighlights.likes.map((like, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{like}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Common complaints */}
              {reviewHighlights.complaints && reviewHighlights.complaints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Common complaints</h3>
                  <ul className="space-y-2">
                    {reviewHighlights.complaints.map((complaint, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                        <span>{complaint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Common issues to know before you pay */}
        {reviewHighlights?.commonIssues && reviewHighlights.commonIssues.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Common issues to know before you pay</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewHighlights.commonIssues.map((issue, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <p className="text-sm font-medium text-gray-900 mb-2">{issue.claim}</p>
                  <p className="text-xs text-gray-600 mb-3">
                    <span className="font-medium">Impact: </span>{issue.impact}
                  </p>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">What to do: </span>{issue.whatToDo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequently Asked Questions Section */}
        <div className="w-full">
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
            <FAQAccordion faqs={faqs} />
          </div>
        </div>

        {/* Sources */}
        <div className="w-full text-center">
          <p className="text-xs text-gray-500">
            Based on public docs + aggregated user feedback. Limits may vary by account.
          </p>
        </div>
      </div>
    </section>
  );
}

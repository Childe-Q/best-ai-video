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

        {/* Frequently Asked Questions Section */}
        <div className="w-full">
          <FAQAccordion faqs={tool.faqs || []} />
        </div>
      </div>
    </section>
  );
}

import { notFound } from 'next/navigation';
import { getTool, getYouTubeVideoId, extractDetailedReview } from '@/lib/getTool';
import { HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { getSEOCurrentYear } from '@/lib/utils';

export async function generateStaticParams() {
  const { getAllTools } = await import('@/lib/getTool');
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();
  const { getAllTools } = await import('@/lib/getTool');
  const tools = getAllTools();

  return {
    title: `${tool.name} Review, Pricing & Best Alternatives (${seoYear})`,
    description: `Is ${tool.name} worth it? In-depth review of pricing, features, pros & cons, and top competitors like ${tools.find(t => t.id !== tool.id)?.name}.`,
  };
}

export default async function OverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  // Extract video ID from video_url
  const videoId = tool.video_url ? getYouTubeVideoId(tool.video_url) : null;

  // Extract detailed review content
  const detailedReview = extractDetailedReview(tool.review_content || '');

  return (
    <>
      {/* 3. The Video Row (Full Width) */}
      {videoId && (
        <div className="w-full bg-slate-50 py-16">
          <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* 4. Overview Section - Full Width */}
      <section className="w-full bg-slate-50 pt-10 pb-16">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24 space-y-12">
          {/* In-Depth Review */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">In-Depth Review</h2>
            
            {/* Long Review */}
            {tool.long_review && (
              <div 
                className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: tool.long_review }}
              />
            )}

            {/* Detailed Review Content (Why it wins, Pro Insight) */}
            {detailedReview && (
              <div 
                className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: detailedReview }}
              />
            )}

            {/* Fallback if no review content */}
            {!tool.long_review && !detailedReview && (
              <p className="text-gray-700 leading-relaxed">
                <strong>Yes, if you are {tool.best_for || 'looking for this tool'}.</strong> It offers excellent value with its {tool.starting_price || 'competitive'} starting price. 
                However, if you need more advanced features, you might want to consider alternatives below.
              </p>
            )}
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pros Column */}
            <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                <HandThumbUpIcon className="w-5 h-5" />
                Pros
              </h3>
              <ul className="space-y-3">
                {tool.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="text-green-500 font-bold shrink-0">✓</span> {pro}
                  </li>
                ))}
              </ul>
            </div>
            {/* Cons Column */}
            <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
              <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                <HandThumbDownIcon className="w-5 h-5" />
                Cons
              </h3>
              <ul className="space-y-3">
                {tool.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="text-red-500 font-bold shrink-0">✕</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
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
          {/* TL;DR Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">TL;DR</h2>
            <div className="space-y-3 text-gray-700">
              {tool.content?.overview?.tldr ? (
                <>
                  <p className="leading-relaxed">
                    <strong>Best for:</strong> {tool.content.overview.tldr.bestFor}
                  </p>
                  <p className="leading-relaxed">
                    <strong>Not ideal for:</strong> {tool.content.overview.tldr.notFor}
                  </p>
                  <p className="leading-relaxed">
                    <strong>Why we recommend it:</strong> {tool.content.overview.tldr.why}
                  </p>
                </>
              ) : (
                <>
                  <p className="leading-relaxed">
                    <strong>Best for:</strong> {tool.best_for || 'Content creators who need quick video production'} - {tool.tagline || tool.short_description}
                  </p>
                  <p className="leading-relaxed">
                    <strong>Not ideal for:</strong> {tool.cons && tool.cons.length > 0 ? `Users who need ${tool.cons[0].toLowerCase()}` : 'Professional video editors requiring advanced features'}
                  </p>
                  <p className="leading-relaxed">
                    <strong>Why we recommend it:</strong> {tool.pros && tool.pros.length > 0 ? tool.pros[0] : `Strong value proposition with ${tool.starting_price || 'competitive pricing'} and ${tool.features && tool.features.length > 0 ? tool.features[0] : 'key features'} that streamline video creation workflow`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Mini Test Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mini Test</h2>
            {tool.content?.overview?.miniTest ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  {(!tool.content.overview.miniTest.generationTime || 
                    tool.content.overview.miniTest.generationTime.includes('[NEED_TEST') ||
                    tool.content.overview.miniTest.footageMatch?.includes('[NEED_TEST')) ? 
                   'Test pending' : 'Test Results'}
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Test prompt:</strong> &quot;{tool.content.overview.miniTest.prompt}&quot;
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Generation Time:</span>
                    <span className="ml-2 text-gray-500">
                      {tool.content.overview.miniTest.generationTime || 'Not tested yet'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Footage Match:</span>
                    <span className="ml-2 text-gray-500">
                      {tool.content.overview.miniTest.footageMatch || 'Not tested yet'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Subtitle Accuracy:</span>
                    <span className="ml-2 text-gray-500">
                      {tool.content.overview.miniTest.subtitleAccuracy || 'Not tested yet'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Verdict:</span>
                    <span className="ml-2 text-gray-500">
                      {tool.content.overview.miniTest.verdict || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Test pending</p>
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Test prompt:</strong> &quot;Create a 10-second marketing video for a tech product launch with upbeat music and text overlays&quot;
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Speed:</span>
                    <span className="ml-2 text-gray-500">Not tested yet</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Quality:</span>
                    <span className="ml-2 text-gray-500">Not tested yet</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Subtitles:</span>
                    <span className="ml-2 text-gray-500">Not tested yet</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-600">Stock match:</span>
                    <span className="ml-2 text-gray-500">Not tested yet</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Output</h2>
            {videoId ? (
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <p className="text-sm text-gray-600 mb-2">Official demo</p>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="Official demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-8 border border-slate-200 text-center">
                <p className="text-gray-500">Sample output coming soon</p>
              </div>
            )}
          </div>

          {/* Use Cases Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Use Cases</h2>
            <div className="space-y-4">
              {tool.content?.overview?.useCases && tool.content.overview.useCases.length > 0 ? (
                tool.content.overview.useCases.map((useCase, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold shrink-0 mt-1">•</span>
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        <strong>{useCase.title}:</strong> {useCase.why}
                      </p>
                      <Link 
                        href={useCase.linkHref} 
                        className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                      >
                        {useCase.linkText || 'Learn more →'}
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold shrink-0 mt-1">•</span>
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        <strong>YouTube Shorts:</strong> Quickly turn blog posts or scripts into engaging short-form videos with auto-subtitles and stock footage.
                      </p>
                      <Link href={`/vs/${slug}-vs-pictory`} className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block">
                        Compare with alternatives →
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold shrink-0 mt-1">•</span>
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        <strong>Marketing Ads:</strong> Create product promotion videos using the 8M+ stock library and AI script generator for consistent brand messaging.
                      </p>
                      <Link href={`/tool/${slug}/features`} className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block">
                        Explore features →
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold shrink-0 mt-1">•</span>
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        <strong>Blog-to-video:</strong> Automatically convert blog articles into video content with AI-selected visuals and voiceover for content repurposing.
                      </p>
                      <Link href={`/vs/${slug}-vs-fliki`} className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block">
                        See comparison →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

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

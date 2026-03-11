import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTool, getYouTubeVideoId, extractDetailedReview } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';
import { loadToolContent } from '@/lib/loadToolContent';
import { getRelatedComparisons, getAlternativesLink } from '@/lib/getRelatedLinks';
import TldrBlock from '@/components/tool/TldrBlock';
import MiniTestBlock from '@/components/tool/MiniTestBlock';
import UseCaseCards from '@/components/tool/UseCaseCards';
import ProsCons from '@/components/tool/ProsCons';
import EditorialSummary from '@/components/tool/EditorialSummary';
// FeaturesList removed from Overview page (still available for /features route)
// import FeaturesList from '@/components/tool/FeaturesList';
// EvidenceNotes hidden for now, but data preserved for future "Methodology & sources" feature
// import EvidenceNotes from '@/components/tool/EvidenceNotes';
import EvidenceNuggets from '@/components/tool/EvidenceNuggets';
import { ToolContent } from '@/types/toolContent';

const editorialSummaries: Record<
  string,
  {
    bestFor: string;
    notIdealFor: string;
    whyChooseIt: string;
    biggestLimitation: string;
  }
> = {
  invideo: {
    bestFor:
      'Small marketing teams, faceless YouTube operators, and repurposing-heavy creators who want one prompt to produce script, stock footage, captions, and voiceover without opening a full editor.',
    notIdealFor:
      'Editors who constantly tweak scenes after generation or teams that need every shot to feel original. InVideo works best when the draft is close to final before you start regenerating.',
    whyChooseIt:
      'It removes the slowest part of low-cost video production: sourcing footage, assembling scenes, and captioning. If the job is volume output rather than handcrafted editing, that workflow compression matters more than raw polish.',
    biggestLimitation:
      'Iteration is expensive in practice. Credits and minutes can disappear during revisions, so the tool feels efficient when your prompt is disciplined and frustrating when your process is exploratory.',
  },
  heygen: {
    bestFor:
      'Sales, enablement, and localization teams that need a repeatable avatar spokesperson instead of a different stock-footage draft every time. It is strongest when the same message format gets reused across markets or campaigns.',
    notIdealFor:
      'Low-volume buyers who publish a few videos some months and none in others. The plan structure makes more sense for steady usage than for occasional experimentation.',
    whyChooseIt:
      'HeyGen solves a different problem from generic AI video tools: presenter consistency. When your audience expects a person on screen for outreach, onboarding, or multilingual updates, the avatar workflow is the reason to pay more.',
    biggestLimitation:
      'Cost control is the weak point. Credits expire, free output is constrained, and the value drops quickly if you are not shipping avatar-led videos often enough to justify the subscription rhythm.',
  },
};

function hasProsConsContent(content: unknown): content is Pick<ToolContent, 'pros' | 'cons'> {
  if (!content || typeof content !== 'object') {
    return false;
  }

  return 'pros' in content || 'cons' in content;
}

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
    alternates: {
      canonical: `/tool/${slug}`,
    },
  };
}

export default async function OverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  // Load content JSON (preferred) or fallback to tool.content
  const contentJson = loadToolContent(slug);
  const content = contentJson || tool.content;

  // Extract video ID from video_url
  const videoId = tool.video_url ? getYouTubeVideoId(tool.video_url) : null;

  // Extract detailed review content
  const detailedReview = extractDetailedReview(tool.review_content || '');

  // Get related links
  const relatedComparisons = getRelatedComparisons(slug);
  const alternativesLink = getAlternativesLink(slug);
  const editorialSummary = editorialSummaries[slug];
  const contentProsCons = hasProsConsContent(content) ? content : undefined;

  return (
    <>
      {/* 3. The Video Row (Full Width) */}
      {videoId && (
        <div id="mini-test" className="w-full bg-slate-50 py-16 scroll-mt-32">
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
      <section id="overview" className="w-full bg-slate-50 pt-10 pb-16 scroll-mt-32">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24 space-y-12">
          {/* TL;DR Section */}
          {content?.overview?.tldr ? (
            <TldrBlock
              bestFor={content.overview.tldr.bestFor}
              notFor={content.overview.tldr.notFor}
              why={content.overview.tldr.why}
            />
          ) : (
            <TldrBlock
              bestFor={`${tool.best_for || 'Content creators who need quick video production'} - ${tool.tagline || tool.short_description}`}
              notFor={tool.cons && tool.cons.length > 0 ? `Users who need ${tool.cons[0].toLowerCase()}` : 'Professional video editors requiring advanced features'}
              why={tool.pros && tool.pros.length > 0 ? tool.pros[0] : `Strong value proposition with ${tool.starting_price || 'competitive pricing'} and ${tool.features && tool.features.length > 0 ? tool.features[0] : 'key features'} that streamline video creation workflow`}
            />
          )}

          {editorialSummary ? <EditorialSummary {...editorialSummary} /> : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Use-case hub</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">Still choosing by workflow, not just by product?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Browse the feature hub to compare the routes first: presenter-led video, text-to-video, repurposing,
              social publishing, or team buying. It is the fastest way to decide whether this tool is even in the right
              category before you compare it against nearby options.
            </p>
            <Link
              href="/features"
              className="mt-4 inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              Browse AI video tools by workflow
              <span className="ml-2">→</span>
            </Link>
          </div>

          {/* Mini Test Section */}
          {content?.overview?.miniTest ? (
            <div id={videoId ? undefined : 'mini-test'}>
              <MiniTestBlock
                prompt={content.overview.miniTest.prompt}
                generationTime={content.overview.miniTest.generationTime}
                footageMatch={content.overview.miniTest.footageMatch}
                subtitleAccuracy={content.overview.miniTest.subtitleAccuracy}
                verdict={content.overview.miniTest.verdict}
                checklist={'checklist' in content.overview.miniTest ? content.overview.miniTest.checklist : undefined}
              />
            </div>
          ) : (
            <div id={videoId ? undefined : 'mini-test'}>
              <MiniTestBlock
                prompt="Create a 10-second marketing video for a tech product launch with upbeat music and text overlays"
              />
            </div>
          )}

          {/* Use Cases Section */}
          {content?.overview?.useCases && content.overview.useCases.length > 0 ? (
            <UseCaseCards useCases={content.overview.useCases} />
          ) : null}

          {/* In-Depth Review */}
          <div className="bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">In-Depth Review</h2>
            
            {/* Long Review */}
            {tool.long_review && (
              <div 
                className="prose prose-lg prose-blue max-w-none text-gray-700 mb-6"
                style={{ fontSize: '16px', lineHeight: '1.65' }}
                dangerouslySetInnerHTML={{ __html: tool.long_review }}
              />
            )}

            {/* Detailed Review Content - Extract and clean "Why it wins?" section */}
            {detailedReview && (
              <div 
                className="prose prose-lg prose-blue max-w-none text-gray-700"
                style={{ fontSize: '16px', lineHeight: '1.65' }}
                dangerouslySetInnerHTML={{ 
                  __html: detailedReview
                    .replace(/<h3[^>]*>[\s\S]*?Why it wins\?[\s\S]*?<\/h3>/gi, '<h3 class="text-2xl font-bold text-gray-900 mt-8 mb-5">What it does best</h3>')
                    .replace(/content recycler on steroids/gi, 'content recycler')
                    .replace(/frighteningly human/gi, 'natural-sounding')
                }}
              />
            )}

            {/* Fallback if no review content */}
            {!tool.long_review && !detailedReview && (
              <p className="text-gray-700 text-base leading-[1.65]">
                <strong className="font-semibold">Yes, if you are {tool.best_for || 'looking for this tool'}.</strong> It offers excellent value with its {tool.starting_price || 'competitive'} starting price. 
                However, if you need more advanced features, you might want to consider alternatives below.
              </p>
            )}
          </div>

          {/* Pros & Cons */}
          <ProsCons
            pros={contentProsCons?.pros ?? tool.pros ?? []}
            cons={contentProsCons?.cons ?? tool.cons ?? []}
          />

          {/* Evidence Nuggets - Verified facts from official pages */}
          <EvidenceNuggets slug={slug} limit={6} />

          {/* Evidence Notes - Hidden for now, but data preserved for future "Methodology & sources" feature */}
          {/* {content?.sources && <EvidenceNotes sources={content.sources} />} */}

          {/* Related Comparisons & Alternatives */}
          {(relatedComparisons.length > 0 || alternativesLink) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Related Comparisons & Alternatives</h2>
              <div className="space-y-5">
                {relatedComparisons.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Comparisons</h3>
                    <ul className="space-y-2">
                      {relatedComparisons.map((comp) => (
                        <li key={comp.slug}>
                          <Link
                            href={`/vs/${comp.slug}`}
                            className="text-base text-indigo-600 hover:text-indigo-700 font-medium leading-[1.65]"
                          >
                            {comp.title} →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {alternativesLink && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Alternatives</h3>
                    <Link
                      href={alternativesLink.slug}
                      className="text-base text-indigo-600 hover:text-indigo-700 font-medium leading-[1.65]"
                    >
                      {alternativesLink.title} →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

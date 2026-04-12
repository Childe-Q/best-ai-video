import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getYouTubeVideoId, extractDetailedReview } from '@/lib/getTool';
import { getAllTools, getToolBySlug } from '@/lib/toolData';
import { getSEOCurrentYear } from '@/lib/utils';
import { getRelatedComparisons, getAlternativesLink, getMostRelevantWorkflowLink } from '@/lib/getRelatedLinks';
import TldrBlock from '@/components/tool/TldrBlock';
import MiniTestBlock from '@/components/tool/MiniTestBlock';
import UseCaseCards from '@/components/tool/UseCaseCards';
import ProsCons from '@/components/tool/ProsCons';
import EditorialSummary from '@/components/tool/EditorialSummary';
// FeaturesList removed from Overview page (still available for /features route)
// import FeaturesList from '@/components/tool/FeaturesList';
import EvidenceNotes from '@/components/tool/EvidenceNotes';
import EvidenceNuggets from '@/components/tool/EvidenceNuggets';
import { buildSoftwareApplicationJsonLd } from '@/lib/jsonLd';
import { getPageReadiness } from '@/lib/readiness';

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

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug)?.tool;
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();
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
  const toolEntry = getToolBySlug(slug);
  const tool = toolEntry?.tool;

  if (!tool) notFound();

  const content = tool.content;
  const miniTest = toolEntry?.miniTest;

  // Extract video ID from video_url
  const videoId = tool.video_url ? getYouTubeVideoId(tool.video_url) : null;

  // Extract detailed review content
  const detailedReview = extractDetailedReview(tool.review_content || '');

  // Get related links
  const relatedComparisons = getRelatedComparisons(slug);
  const alternativesLink = await getAlternativesLink(slug);
  const workflowLink = getMostRelevantWorkflowLink(slug);
  const [featuresReadiness, reviewsReadiness] = await Promise.all([
    getPageReadiness('toolFeatures', slug),
    getPageReadiness('toolReviews', slug),
  ]);
  const editorialSummary = editorialSummaries[slug];

  return (
    <>
      {/* Structured Data: SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSoftwareApplicationJsonLd(tool)) }}
      />
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
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Workflow handoff</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">Still choosing the workflow before the product?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              {workflowLink
                ? `${tool.name} only makes sense once the job is clear. If you are still deciding the route first, step back to ${workflowLink.title} before you compare it against nearby tools.`
                : 'Browse the feature hub to compare the routes first: presenter-led video, text-to-video, repurposing, social publishing, or team buying. It is the fastest way to decide whether this tool is even in the right category before you compare it against nearby options.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={workflowLink?.href ?? '/features'}
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-bold !text-[#FFFFFF] transition-colors hover:bg-slate-800 hover:!text-[#FFFFFF] active:bg-slate-950 active:!text-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                {workflowLink ? `Back to ${workflowLink.title}` : 'Browse AI video tools by workflow'}
                <span className="ml-2">→</span>
              </Link>
              {workflowLink && (
                <Link
                  href="/features"
                  className="inline-flex items-center rounded-full px-1 text-sm font-semibold !text-[#111111] transition-colors hover:opacity-80 active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
                >
                  Browse all workflow pages
                </Link>
              )}
            </div>
          </div>

          {/* Mini Test Section */}
          {miniTest && (
            <div id={videoId ? undefined : 'mini-test'}>
              <MiniTestBlock
                prompt={miniTest.prompt}
                generationTime={miniTest.generationTime}
                footageMatch={miniTest.footageMatch}
                subtitleAccuracy={miniTest.subtitleAccuracy}
                verdict={miniTest.verdict}
                checklist={miniTest.checklist}
              />
            </div>
          )}

          {/* Use Cases Section */}
          {content?.overview?.useCases && content.overview.useCases.length > 0 ? (
            <UseCaseCards useCases={content.overview.useCases} />
          ) : null}

          {/* In-Depth Review */}
          {(tool.long_review || detailedReview) && (
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
            </div>
          )}

          {/* Pros & Cons */}
          <ProsCons
            pros={tool.pros ?? []}
            cons={tool.cons ?? []}
          />

          {/* Evidence Nuggets - Verified facts from official pages */}
          <EvidenceNuggets slug={slug} limit={6} />

          {/* Evidence Notes — Sources used for this review */}
          {content?.sources && <EvidenceNotes sources={content.sources} />}

          {/* Explore this tool — mini hub links */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Explore {tool.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href={`/tool/${slug}/pricing`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50"
              >
                <span className="text-2xl">💰</span>
                <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">Pricing</span>
                <span className="text-xs text-gray-500">Plans & costs</span>
              </Link>
              {featuresReadiness.ready && (
                <Link
                  href={`/tool/${slug}/features`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <span className="text-2xl">⚡</span>
                  <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">Features</span>
                  <span className="text-xs text-gray-500">Full capabilities</span>
                </Link>
              )}
              {reviewsReadiness.ready && (
                <Link
                  href={`/tool/${slug}/reviews`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <span className="text-2xl">💬</span>
                  <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">Reviews</span>
                  <span className="text-xs text-gray-500">User feedback</span>
                </Link>
              )}
              {alternativesLink && (
                <Link
                  href={`/tool/${slug}/alternatives`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <span className="text-2xl">🔄</span>
                  <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">Alternatives</span>
                  <span className="text-xs text-gray-500">Compare options</span>
                </Link>
              )}
            </div>
          </div>

          {/* Related Comparisons & Alternatives */}
          {(relatedComparisons.length > 0 || alternativesLink) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Next step</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">What should you compare next?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                Use a pairwise compare page when your shortlist is already narrow. Use the alternatives page when you
                still need a wider replacement set around {tool.name}.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {relatedComparisons.length > 0 && (
                  relatedComparisons.map((comp) => (
                    <Link
                      key={comp.slug}
                      href={`/vs/${comp.slug}`}
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pairwise compare</p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-indigo-700">
                        {comp.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Start here if these are the two tools left on the shortlist and you need a tighter decision page.
                      </p>
                      <span className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Compare this pair
                        <span className="ml-2">→</span>
                      </span>
                    </Link>
                  ))
                )}
                {alternativesLink && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wider shortlist</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">Need broader replacements than a single compare?</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Step into the dedicated {tool.name} alternatives page to review replacements by pricing, workflow
                      fit, and trade-offs.
                    </p>
                    <Link
                      href={alternativesLink.slug}
                      className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Open the alternatives shortlist
                      <span className="ml-2">→</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Methodology & Trust */}
          <div className="flex items-center gap-3 text-sm text-gray-500 border-t border-slate-200 pt-6">
            <span>📋</span>
            <span>
              This review follows our{' '}
              <Link href="/methodology" className="text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2">
                review methodology
              </Link>
              . Pricing and features are verified against official sources when available.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

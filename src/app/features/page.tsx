import Link from 'next/link';
import { Metadata } from 'next';
import { getSEOCurrentYear } from '@/lib/utils';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';

const seoYear = getSEOCurrentYear();

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const workflowChecks = [
  {
    eyebrow: 'Check 1',
    title: 'What is the starting asset?',
    body: 'Blank page, prompt, or script points to generation. Existing source points elsewhere.',
    leadsTo: 'Usually text-to-video',
  },
  {
    eyebrow: 'Check 2',
    title: 'Does the format need a presenter?',
    body: 'If the format depends on a visible speaker, start with avatars. If not, stay in generation or editing.',
    leadsTo: 'Usually AI avatar tools',
  },
  {
    eyebrow: 'Check 3',
    title: 'If source material exists, what kind is it?',
    body: 'Long-form source points to repurposing. Clips, footage, or a rough cut point to editors.',
    leadsTo: 'Repurposing or editors',
  },
];

const broadRouteCallout = {
  title: 'Still choosing the right lane?',
  body:
    'Start with the broad shortlist when the job is still ambiguous. It is the best first stop for separating generation, avatar-led delivery, source-to-video conversion, and faster creator routes before you commit to a narrower page.',
  href: '/features/best-ai-video-generators',
  cta: 'Open the broad shortlist',
};

const toolTypeExplainers = [
  {
    kind: 'feature' as const,
    slug: 'text-to-video-ai-tools',
    group: 'primary' as const,
    label: 'Net-new scenes',
    checkRef: 'Usually follows Check 1',
    title: 'Text to video tools',
    bestWhen:
      'Pick this type when there is no source footage yet and the output itself has to be created.',
    wrongFirstStop:
      'Do not start here if you already have a webinar, blog, transcript, or rough cut to work from.',
  },
  {
    kind: 'feature' as const,
    slug: 'ai-avatar-video-generators',
    group: 'primary' as const,
    label: 'Presenter-led output',
    checkRef: 'Usually follows Check 2',
    title: 'AI avatar tools',
    bestWhen:
      'Pick this type when a face, voice, and repeatable presenter format matter more than original scene generation.',
    wrongFirstStop:
      'Do not start here if the real job is cinematic footage, b-roll, or editing existing material.',
  },
  {
    kind: 'feature' as const,
    slug: 'content-repurposing-ai-tools',
    group: 'primary' as const,
    label: 'Source-to-video conversion',
    checkRef: 'Usually follows Check 3',
    title: 'Video repurposing tools',
    bestWhen:
      'Pick this type when the core asset already exists and the job is conversion, clipping, or reformatting.',
    wrongFirstStop:
      'Do not start here if there is no source material yet or if you need a presenter-first format.',
  },
  {
    kind: 'feature' as const,
    slug: 'ai-video-editors',
    group: 'specialist' as const,
    label: 'Improve existing footage',
    checkRef: 'Usually follows Check 3',
    title: 'AI video editors',
    bestWhen:
      'Pick this type when you are improving existing clips rather than generating new scenes or converting long-form content into a fresh format.',
    wrongFirstStop:
      'Do not start here if the real bottleneck is creation from scratch or turning articles and webinars into first-pass videos.',
  },
];

const quickRoutes = [
  {
    title: 'I still do not know the right lane',
    body:
      'Start with the broad shortlist first. It is the fastest route when the choice is still between generation, avatars, repurposing, and creator-first drafting. Once the lane is clear, the next stop is usually a focused compare such as Runway vs Sora, HeyGen vs Synthesia, or Descript vs Veed.io.',
    href: '/features/best-ai-video-generators',
    cta: 'Start with the broad shortlist',
  },
  {
    title: 'I need a presenter, not cinematic footage',
    body:
      'Go straight to avatar tools when the format depends on a visible speaker, repeatable delivery, dubbing, or training-style communication. When avatar fit is clear, the default next compare is usually HeyGen vs Synthesia.',
    href: '/features/ai-avatar-video-generators',
    cta: 'Go to avatar tools',
  },
  {
    title: 'I already have blogs, webinars, or podcasts',
    body:
      'Go to repurposing first when the source already exists and the real job is clipping, script extraction, summarization, or reformatting. The usual next compare there is InVideo vs Pictory once the route is fixed.',
    href: '/features/content-repurposing-ai-tools',
    cta: 'Go to repurposing tools',
  },
  {
    title: 'I already have footage and just need polish',
    body:
      'Use editors when the bottleneck is cleanup, speed, subtitles, templating, or getting an existing cut into publishable shape. Once editing is clearly the lane, move toward Descript vs Veed.io instead of reopening the route choice.',
    href: '/features/ai-video-editors',
    cta: 'Go to AI video editors',
  },
];

const routeGroups = [
  {
    key: 'primary' as const,
    eyebrow: 'Primary routes',
    title: 'Start with the main workflow families first',
    body:
      'Most users should be able to place the job into one of these routes before they compare individual tools.',
  },
  {
    key: 'specialist' as const,
    eyebrow: 'Specialist routes',
    title: 'Use narrower routes only when the workflow is already obvious',
    body:
      'These pages are stronger second stops once the starting asset and delivery format are already clear.',
  },
];

const faqItems = [
  {
    question: 'Should I use avatar tools or text-to-video?',
    answer:
      'Start with avatar tools when the video needs a visible speaker and the message depends on delivery, face, and voice. Start with text-to-video when the output is scene generation from prompts and the speaker is not the core format.',
  },
  {
    question: 'What is the best route for faceless YouTube workflows?',
    answer:
      'Usually the YouTube, social, or repurposing routes. Those paths are better for script-to-video drafting, stock-first production, clipping, and repeatable publishing cadence. Move to avatar tools only if the channel format truly needs an on-screen host.',
  },
  {
    question: 'What if I already have blogs, webinars, or podcasts?',
    answer:
      'Start with repurposing tools first. They are built to ingest existing articles, transcripts, recordings, and long videos. Generators are the wrong first stop when the source material already exists and just needs conversion.',
  },
  {
    question: 'Are repurposing tools the same as AI video editors?',
    answer:
      'AI video editors improve footage you already have. Repurposing tools convert existing long-form assets such as blogs, webinars, podcasts, and transcripts into new video outputs. If the job is cleanup and polish, start with editors. If the job is source-to-video conversion, start with repurposing.',
  },
  {
    question: 'When should I use the broad shortlist instead of a workflow page?',
    answer:
      'Use the broad shortlist when you still do not know whether the job is generation, avatars, repurposing, or editing. Use a workflow page once the route is already clear enough to narrow a real shortlist.',
  },
  {
    question: 'How should teams choose differently from solo creators?',
    answer:
      'Solo creators can usually optimize first for speed, output style, and cost. Teams need to ask earlier about approvals, localization, admin controls, export policy, and procurement fit. That is where the professional and enterprise routes become more useful than creator-first categories.',
  },
];

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export function generateMetadata(): Metadata {
  return {
    title: `Which Type of AI Video Tool Do You Need? Workflow Guide ${seoYear}`,
    description:
      'Use this AI video workflow hub to choose the right route before comparing products. Start with generation, avatars, repurposing, or editing, then move into the strongest feature pages from there.',
    alternates: { canonical: '/features' },
    openGraph: {
      title: `Which Type of AI Video Tool Do You Need? Workflow Guide ${seoYear}`,
      description:
        'A feature hub that routes users into the right AI video workflow before they compare individual tools.',
      url: '/features',
    },
    robots: { index: true, follow: true },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FeaturesHubPage() {
  return (
    <div className="min-h-screen bg-[#FCFBF7] pb-20">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,_rgba(184,245,0,0.12),_transparent_50%),radial-gradient(circle_at_10%_30%,_rgba(246,210,0,0.10),_transparent_35%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-bold tracking-[0.16em] text-black/70 backdrop-blur">
              USE-CASE HUB
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.02em] text-gray-900 md:text-5xl lg:text-6xl">
              Which type of AI video{' '}
              <span className="block">tool do you actually need?</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-gray-600 md:text-lg">
              Use this page to choose the right workflow lane before you compare products. Most AI video tools are solving different jobs, so the first decision is route selection, not brand selection.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/52 md:text-[15px]">
              The fastest split is usually this: create net-new scenes, deliver with a presenter, convert existing source material, or polish footage that already exists. The handoff after that should narrow into a feature shortlist first, then a specific compare inside `/vs`.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">

        {/* ── Editorial Decision Map ─────────────────────────── */}
        <section id="decision-framework" className="border-t border-black/8 pt-10 lg:pt-12">
          <div className="max-w-5xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
              Start here
            </p>
            <h2 className="mt-3 max-w-4xl text-2xl font-black text-gray-900 md:text-3xl lg:text-[2.35rem] lg:leading-[1.1]">
              Use this three-part framework first
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-black/54 lg:text-[15px]">
              These three checks are enough to send most buyers into the right route without reading every feature page in the library.
            </p>
            <div className="mt-4 flex max-w-[52rem] items-start gap-2.5 border-l border-black/8 pl-3 text-[13px] leading-5 text-black/47">
              <span className="mt-0.5 inline-flex shrink-0 rounded-full border border-black/7 bg-[#F7F5EE]/82 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-black/38">
                Maps to
              </span>
              <p className="min-w-0">
                Blank-canvas generation, presenter-led delivery, source-to-video repurposing, and editing existing footage.
              </p>
            </div>
          </div>

            <div className="mt-10 divide-y divide-black/8 border-y border-black/8 md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
              {workflowChecks.map((item) => (
              <div key={item.title} className="py-6 md:px-6 md:py-7 first:md:pl-0 last:md:pr-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">
                  {item.eyebrow}
                </p>
                <p className="mt-2 text-[15px] font-black leading-6 text-gray-900">{item.title}</p>
                <p className="mt-2 max-w-[26rem] text-sm leading-6 text-black/52">{item.body}</p>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/32">
                  Points to
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-gray-900">{item.leadsTo}</p>
              </div>
              ))}
            </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {quickRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-[24px] border border-black/8 bg-white px-5 py-5 no-underline transition-colors hover:border-black/16"
              >
                <h3 className="text-[15px] font-black leading-6 text-gray-900 transition-colors group-hover:text-black/70">
                  {route.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-black/52">{route.body}</p>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/38">
                  {route.cta} →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Workflow type explainer ────────────────────────── */}
        <section className="mt-20 border-t border-black/8 pt-10 lg:mt-24 lg:pt-12">
          <div>
            <div className="max-w-5xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
                Types of AI video tools
              </p>
              <h2 className="mt-3 max-w-4xl text-2xl font-black text-gray-900 md:text-3xl lg:text-[2.35rem] lg:leading-[1.1]">
                The tool families solve different jobs
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-black/54 lg:text-[15px]">
                The categories matter most at the workflow level: what you start from, what you need to produce, and what the tool is actually for.
              </p>
            </div>

            <div className="mt-5 flex max-w-[52rem] items-start gap-3 border-l border-black/8 pl-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">
                If the framework is still inconclusive
                </p>
                <p className="mt-1 text-[15px] font-black leading-6 text-gray-900">
                  {broadRouteCallout.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-black/52">
                  {broadRouteCallout.body}
                </p>
                <Link
                  href={broadRouteCallout.href}
                  className="mt-2 inline-flex items-center text-sm font-bold text-black no-underline transition-colors hover:text-black/65"
                >
                  {broadRouteCallout.cta}
                  <span className="ml-2">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-12">
            {routeGroups.map((group) => {
              const items = toolTypeExplainers.filter((item) => item.group === group.key);

              return (
                <div key={group.key}>
                  <div className="max-w-4xl">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">
                      {group.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-gray-900">{group.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/52">{group.body}</p>
                  </div>

                  <div className="mt-6 lg:grid lg:grid-cols-2 lg:gap-x-12">
                    {items.map((item, index) => (
                      <Link
                        key={item.slug}
                        href={`/features/${item.slug}`}
                        className={`group block py-6 no-underline transition-colors duration-200 hover:text-black/68 ${
                          index > 0 ? 'border-t border-black/8' : ''
                        } ${index < 2 ? 'lg:border-t-0 lg:pt-0' : ''} ${
                          index % 2 === 0 ? 'lg:pr-8' : 'lg:pl-8'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">
                            {item.label}
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/28">
                            {item.checkRef}
                          </p>
                        </div>
                        <h3 className="mt-3 text-xl font-black text-gray-900 transition-colors duration-200 group-hover:text-black/70">
                          {item.title}
                        </h3>
                        <div className="mt-4 grid gap-2 text-sm leading-6 text-black/52">
                          <p>
                            <span className="font-bold text-gray-900">Best when:</span>{' '}
                            {item.bestWhen}
                          </p>
                          <p>
                            <span className="font-bold text-gray-900">Not for:</span>{' '}
                            {item.wrongFirstStop}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section className="mt-20 border-t border-black/8 pt-10 lg:mt-24 lg:pt-12">
          <div>
            <div className="max-w-5xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
                FAQ
              </p>
              <h2 className="mt-3 max-w-4xl text-2xl font-black text-gray-900 md:text-3xl lg:text-[2.35rem] lg:leading-[1.1]">
                Final route checks before you go deeper
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-black/54 lg:text-[15px]">
                These questions cover the route changes and edge cases users still second-guess.
              </p>
            </div>

            <div className="mt-8 min-w-0">
              <FeaturesFAQ items={faqItems} variant="minimal" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

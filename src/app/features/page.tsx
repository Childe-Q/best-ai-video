import Link from 'next/link';
import { Metadata } from 'next';
import { canonicalizeVsHref } from '@/data/vs';
import { categories } from '@/data/categories';
import { getSEOCurrentYear } from '@/lib/utils';

const seoYear = getSEOCurrentYear();

function getFeatureTitle(slug: string): string {
  const cat = categories.find((c) => c.slug === slug);
  if (cat) return cat.title;
  return slug
    .split('-')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const scenarioRoutes = [
  {
    question: 'Need a spokesperson on screen?',
    detail:
      'Start with the avatar hub if the buyer expects a presenter-led video rather than a stock-footage montage.',
    href: '/features/ai-avatar-video-generators',
  },
  {
    question: 'Turning existing content into video?',
    detail:
      'Go here if your raw material is a webinar, article, podcast, or transcript that needs to become short-form output.',
    href: '/features/content-repurposing-ai-tools',
  },
  {
    question: 'Buying for a team, not a solo creator?',
    detail:
      'Use the enterprise route when approvals, governance, translation workflow, or procurement posture matter as much as the editor itself.',
    href: '/features/enterprise-ai-video-solutions',
  },
];

const featureCategories = [
  {
    slug: 'best-ai-video-generators',
    description:
      'The broadest starting point. Separate cinematic, avatar, and social-first tools before picking a niche.',
  },
  {
    slug: 'ai-avatar-video-generators',
    description:
      'Talking-head and presenter-led tools for training, demos, sales, and any workflow where a face carries the message.',
  },
  {
    slug: 'text-to-video-ai-tools',
    description:
      'Prompt-first generation for creators who start from text and need scenes, not a stock montage or transcript editor.',
  },
  {
    slug: 'ai-video-editors',
    description:
      'AI-powered editing when the draft already exists. Transcript cuts, auto-captions, background removal, and smart cleanup.',
  },
  {
    slug: 'fast-ai-video-generators',
    description:
      'Speed-first tools for rapid iteration. Ideal for testing concepts, social publishing, and quick turnaround.',
  },
  {
    slug: 'ai-video-for-social-media',
    description:
      'Templates, captions, and fast turnaround built for Shorts, Reels, TikTok, and daily social cadence.',
  },
  {
    slug: 'viral-ai-video-generators',
    description:
      'Hook-first tools that prioritize clip scoring, trend ideation, and engagement-optimized short-form packaging.',
  },
  {
    slug: 'professional-ai-video-tools',
    description:
      'Business-grade platforms with brand governance, team collaboration, and commercial-ready export pipelines.',
  },
  {
    slug: 'content-repurposing-ai-tools',
    description:
      'Convert blogs, webinars, podcasts, and long recordings into new video formats without starting from scratch.',
  },
  {
    slug: 'budget-friendly-ai-video-tools',
    description:
      'Solid production under $20/month for creators who need real output without enterprise pricing.',
  },
  {
    slug: 'ai-video-for-marketing',
    description:
      'Campaign-ready tools for ads, demos, personalized outbound, and localized marketing content.',
  },
  {
    slug: 'ai-video-for-youtube',
    description:
      'Faceless channel automation and script-to-video workflows built for YouTube publishing volume.',
  },
  {
    slug: 'free-ai-video-no-watermark',
    description:
      'Free tiers with genuinely usable exports. Find which tools stay clean and which force upgrades.',
  },
  {
    slug: 'enterprise-ai-video-solutions',
    description:
      'API, SSO, admin controls, and procurement-ready plans for IT, operations, and large-team rollouts.',
  },
  {
    slug: 'ai-video-generators-comparison',
    description:
      'Side-by-side model comparison on speed, resolution, realism, and API posture across leading generators.',
  },
];

const editorialPicks = [
  {
    useCase: 'Avatar-led sales or training',
    tool: 'HeyGen',
    detail:
      'Best when the message depends on a repeatable presenter, not just scenes and captions.',
    href: '/tool/heygen',
  },
  {
    useCase: 'High-volume faceless publishing',
    tool: 'InVideo',
    detail:
      'Best when you need stock-first drafts for Shorts, explainers, and marketing output at speed.',
    href: '/tool/invideo',
  },
  {
    useCase: 'Blog or script to video',
    tool: 'Fliki',
    detail:
      'Best when the workflow begins with text and speed matters more than having a digital host on screen.',
    href: '/tool/fliki',
  },
];

const faqItems = [
  {
    question: 'When should I start with avatar tools instead of text-to-video tools?',
    answer:
      'Start with avatar tools when the video needs a visible speaker and the message depends on delivery, face, and voice. Start with text-to-video when the output is scene generation from prompts and the speaker is not the core format.',
  },
  {
    question: 'What is the best route for faceless YouTube workflows?',
    answer:
      'Usually the YouTube, social, or repurposing routes. Those paths are better for script-to-video drafting, stock-first production, clipping, and repeatable publishing cadence. Move to avatar tools only if the channel format truly needs an on-screen host.',
  },
  {
    question: 'Which route should I use if I already have blogs, webinars, or podcasts?',
    answer:
      'Start with repurposing tools first. They are built to ingest existing articles, transcripts, recordings, and long videos. Generators are the wrong first stop when the source material already exists and just needs conversion.',
  },
  {
    question: 'How should teams choose differently from solo creators?',
    answer:
      'Solo creators can usually optimize first for speed, output style, and cost. Teams need to ask earlier about approvals, localization, admin controls, export policy, and procurement fit. That is where the professional and enterprise routes become more useful than creator-first categories.',
  },
  {
    question: 'When should I use a VS page instead of a category hub?',
    answer:
      'Use a category hub when you are still deciding which workflow family fits the job. Use a VS page only after the route is already clear and the decision is down to two specific tools with real tradeoffs worth comparing directly.',
  },
];

const toolReviewLinks = [
  { href: '/tool/heygen', label: 'HeyGen' },
  { href: '/tool/invideo', label: 'InVideo' },
  { href: '/tool/pictory', label: 'Pictory' },
  { href: '/tool/runway', label: 'Runway' },
];

const comparisonLinks = [
  { href: canonicalizeVsHref('/vs/heygen-vs-synthesia'), label: 'HeyGen vs Synthesia' },
  { href: canonicalizeVsHref('/vs/heygen-vs-invideo'), label: 'HeyGen vs InVideo' },
  { href: canonicalizeVsHref('/vs/fliki-vs-pictory'), label: 'Fliki vs Pictory' },
];

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export function generateMetadata(): Metadata {
  return {
    title: `Explore AI Video Tools by Use Case ${seoYear}`,
    description:
      'Choose AI video tools by workflow, not by brand. Start with the right route for avatars, text-to-video, repurposing, social publishing, or enterprise buying.',
    alternates: { canonical: '/features' },
    openGraph: {
      title: `Explore AI Video Tools by Use Case ${seoYear}`,
      description:
        'A workflow-first hub for choosing the right AI video route before you compare individual tools, reviews, and VS pages.',
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
    <div className="min-h-screen bg-[#F8F7F3] pb-16 text-gray-900">

      {/* ── 1. Hero ────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Use-case hub
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              Explore AI Video Tools by Use Case
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              This hub organizes every AI video category by workflow, not by brand. Pick the
              route that matches your job, scan the tools inside, then use reviews and comparison
              pages to make the final call.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">

        {/* ── 2. Scenario Router ───────────────────────────────── */}
        <section className="mb-16 rounded-3xl border border-black/10 bg-white p-8 shadow-sm lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Where to go next
          </p>
          <h2 className="mt-2 text-2xl font-black text-gray-900 md:text-3xl">
            Text-first entrances into the strongest sub-hubs
          </h2>

          <div className="mt-8 divide-y divide-gray-100">
            {scenarioRoutes.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex items-start gap-6 py-6 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                    {r.question}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{r.detail}</p>
                </div>
                <span className="mt-1 shrink-0 text-lg text-gray-300 transition-colors group-hover:text-indigo-500">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 3. Category Directory ────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              All categories
            </p>
            <h2 className="mt-2 text-2xl font-black text-gray-900 md:text-3xl">
              Browse every AI video tool category
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/features/${cat.slug}`}
                className="group rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-base font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                  {getFeatureTitle(cat.slug)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-500">{cat.description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                  Explore Tools <span className="ml-1.5">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 4. Editorial Picks ───────────────────────────────── */}
        <section className="mb-16 rounded-3xl border border-black/10 bg-white p-8 shadow-sm lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Best picks by use case
          </p>
          <h2 className="mt-2 text-2xl font-black text-gray-900 md:text-3xl">
            Three fast starting points if you do not want to scan every category
          </h2>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {editorialPicks.map((pick) => (
              <Link
                key={pick.href}
                href={pick.href}
                className="group rounded-2xl border border-black/[0.06] bg-[#FCFBF7] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  {pick.useCase}
                </p>
                <h3 className="mt-2 text-xl font-black text-gray-900">{pick.tool}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-500">{pick.detail}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 5. FAQ ───────────────────────────────────────────── */}
        <section className="mb-16 rounded-3xl border border-black/10 bg-white p-8 shadow-sm lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">FAQ</p>
          <h2 className="mt-2 text-2xl font-black text-gray-900 md:text-3xl">
            Common questions about choosing the right route
          </h2>

          <div className="mt-8 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-gray-200 bg-[#FCFBF7] px-6 py-5"
              >
                <summary className="cursor-pointer select-none list-none text-base font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    <span>{item.question}</span>
                    <span className="shrink-0 text-lg text-gray-400 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── 6. Cross-links ───────────────────────────────────── */}
        <section className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Tool reviews
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {toolReviewLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-gray-700 transition-colors hover:text-indigo-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Comparisons
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {comparisonLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-gray-700 transition-colors hover:text-indigo-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

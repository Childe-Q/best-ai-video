import Link from 'next/link';
import { Metadata } from 'next';
import { canonicalizeVsHref } from '@/data/vs';
import { categories } from '@/data/categories';
import { getSEOCurrentYear } from '@/lib/utils';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';

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

const quickRoutes = [
  {
    question: 'Need a spokesperson on screen?',
    when: 'Use this path when the message depends on face, voice, and delivery.',
    category: 'Avatar tools',
    href: '/features/ai-avatar-video-generators',
  },
  {
    question: 'Repurposing existing content?',
    when: 'Start here if you already have blogs, webinars, podcasts, or transcripts.',
    category: 'Repurposing tools',
    href: '/features/content-repurposing-ai-tools',
  },
  {
    question: 'Buying for a team?',
    when: 'Go here when approvals, admin controls, or localization affect the shortlist.',
    category: 'Enterprise tools',
    href: '/features/enterprise-ai-video-solutions',
  },
];

const primaryCategories = [
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
];

const secondaryCategories = [
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
    <div className="min-h-screen bg-[#FCFBF7] pb-16">

      {/* ── Hero + Quick Routes ──────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-black/10 bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,_rgba(184,245,0,0.12),_transparent_50%),radial-gradient(circle_at_10%_30%,_rgba(246,210,0,0.10),_transparent_35%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-bold tracking-[0.16em] text-black/70 backdrop-blur">
              USE-CASE HUB
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.02em] text-gray-900 md:text-5xl lg:text-6xl">
              Explore AI Video Tools{' '}
              <span className="block">by Use Case</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-gray-600 md:text-lg">
              Pick the route that matches your workflow, then narrow down with reviews and direct comparisons.
            </p>
          </div>

          {/* Quick routes — merged from old Scenario Router */}
          <div className="mt-12 border-t border-black/8 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {quickRoutes.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group no-underline"
              >
                <p className="text-sm font-bold text-black transition-colors duration-200 group-hover:text-black/70">
                  {r.question}
                </p>
                <p className="mt-1.5 max-w-[22rem] text-sm leading-6 text-black/52 transition-colors duration-200 group-hover:text-black/62">
                  {r.when}
                </p>
                <span className="mt-2 inline-flex items-center text-sm font-semibold text-black/45 transition-colors duration-200 group-hover:text-black/70">
                  {r.category}
                  <span className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

        {/* ── Tier 1: Primary Categories ─────────────────────── */}
        <section className="mb-12">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
              Most common starting points
            </p>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">
              Four routes that cover the majority of buyers
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/52">
              These are the best starting hubs when you are still narrowing the workflow, not browsing the full index.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {primaryCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/features/${cat.slug}`}
                className="group rounded-[1.4rem] border border-black/8 bg-white px-6 py-6 no-underline transition-all duration-200 ease-out hover:-translate-y-1 hover:border-black/14 hover:shadow-[0_12px_28px_rgba(0,0,0,0.04)]"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">
                  Feature hub
                </p>
                <h3 className="mt-2 text-lg font-black text-gray-900 transition-colors duration-200 group-hover:text-black/70">
                  {getFeatureTitle(cat.slug)}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-black/55">
                  {cat.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-bold text-black">
                  <span className="border-b border-black/25 transition-colors duration-200 group-hover:border-black">
                    Start here
                  </span>
                  <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Tier 2: All Other Categories ────────────────────── */}
        <section className="mb-12 border-t border-black/6 pt-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
              All categories
            </p>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">
              Browse the full directory
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/52">
              Use this index once you already know the route family you want, or if the curated starting points above are too narrow.
            </p>
          </div>

          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {secondaryCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/features/${cat.slug}`}
                className="group rounded-xl border border-black/8 bg-white/65 px-4 py-3.5 no-underline transition-colors duration-200 hover:border-black/14 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 transition-colors duration-200 group-hover:text-black/70">
                      {getFeatureTitle(cat.slug)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-black/47">
                      {cat.description}
                    </p>
                  </div>
                  <span className="pt-0.5 text-sm font-semibold text-black/30 transition-colors duration-200 group-hover:text-black/55">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section className="mb-12 rounded-2xl bg-[#F3F1EA] px-6 py-8 sm:px-8 sm:py-10">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
            FAQ
          </p>
          <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">
            Common questions about choosing the right route
          </h2>

          <div className="mt-8">
            <FeaturesFAQ items={faqItems} />
          </div>
        </section>

        {/* ── Cross-links ────────────────────────────────────── */}
        <section className="border-t border-black/6 pt-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
            See also
          </p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:gap-12">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-black/50">Tool reviews</p>
                <Link
                  href="/"
                  className="text-xs font-semibold text-black/65 no-underline transition-colors hover:text-black"
                >
                  See all tool reviews
                </Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {toolReviewLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold text-black no-underline transition-colors hover:text-black/55"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-black/50">Comparisons</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {comparisonLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold text-black no-underline transition-colors hover:text-black/55"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

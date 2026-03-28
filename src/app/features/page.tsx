import Link from 'next/link';
import { Metadata } from 'next';
import { canonicalizeVsHref } from '@/data/vs';
import { categories } from '@/data/categories';
import { getSEOCurrentYear } from '@/lib/utils';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import { filterPromoteSafeLinks } from '@/lib/readiness';

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
    kind: 'feature' as const,
    slug: 'best-ai-video-generators',
    question: 'Need the broadest starting point?',
    when: 'Start here when the route is still broad and you need the cleanest shortlist split first.',
    category: 'Best overall picks',
    href: '/features/best-ai-video-generators',
  },
  {
    kind: 'feature' as const,
    slug: 'text-to-video-ai-tools',
    question: 'Creating net-new scenes from prompts?',
    when: 'Use this path when text prompts, scene generation, and cinematic control are the first filters.',
    category: 'Text-to-video tools',
    href: '/features/text-to-video-ai-tools',
  },
  {
    kind: 'feature' as const,
    slug: 'ai-avatar-video-generators',
    question: 'Need a presenter-led workflow?',
    when: 'Go here when the message needs an on-screen host, multilingual delivery, or repeatable avatar-led production.',
    category: 'AI avatar tools',
    href: '/features/ai-avatar-video-generators',
  },
];

const primaryCategories = [
  {
    kind: 'feature' as const,
    slug: 'best-ai-video-generators',
    description:
      'The broadest starting point. Separate cinematic, avatar, and social-first tools before picking a niche.',
    annotation:
      'Choose this route when you haven\u2019t filtered by workflow type yet and need the broadest starting point to separate tool families first.',
  },
  {
    kind: 'feature' as const,
    slug: 'text-to-video-ai-tools',
    description:
      'Prompt-first generation for creators who start from text and need scenes, not a stock montage or transcript editor.',
    annotation:
      'Choose this route when the creative starts from a prompt or script and you need scene generation \u2014 not editing, avatars, or repurposing.',
  },
  {
    kind: 'feature' as const,
    slug: 'ai-avatar-video-generators',
    description:
      'Talking-head and presenter-led tools for training, demos, sales, and any workflow where a face carries the message.',
    annotation:
      'Choose this route when the format requires an on-screen speaker and the constraint is that no one is available to film.',
  },
  {
    kind: 'feature' as const,
    slug: 'content-repurposing-ai-tools',
    description:
      'Convert blogs, webinars, podcasts, and long recordings into new video formats without starting from scratch.',
    annotation:
      'Choose this route when the raw material already exists \u2014 articles, webinars, podcasts \u2014 and the job is conversion, not creation.',
  },
];

const secondaryCategories = [
  {
    kind: 'feature' as const,
    slug: 'ai-video-generators-comparison',
    description:
      'Side-by-side model comparison on speed, resolution, realism, and API posture across leading generators.',
  },
  {
    kind: 'feature' as const,
    slug: 'free-ai-video-no-watermark',
    description:
      'Free tiers with genuinely usable exports. Find which tools stay clean and which force upgrades.',
  },
  {
    kind: 'feature' as const,
    slug: 'enterprise-ai-video-solutions',
    description:
      'API, SSO, admin controls, and procurement-ready plans for IT, operations, and large-team rollouts.',
  },
  {
    kind: 'feature' as const,
    slug: 'fast-ai-video-generators',
    description:
      'Speed-first tools for rapid iteration. Ideal for testing concepts, social publishing, and quick turnaround.',
  },
  {
    kind: 'feature' as const,
    slug: 'ai-video-for-social-media',
    description:
      'Templates, captions, and fast turnaround built for Shorts, Reels, TikTok, and daily social cadence.',
  },
  {
    kind: 'feature' as const,
    slug: 'viral-ai-video-generators',
    description:
      'Hook-first tools that prioritize clip scoring, trend ideation, and engagement-optimized short-form packaging.',
  },
  {
    kind: 'feature' as const,
    slug: 'budget-friendly-ai-video-tools',
    description:
      'Solid production under $20/month for creators who need real output without enterprise pricing.',
  },
  {
    kind: 'feature' as const,
    slug: 'ai-video-for-marketing',
    description:
      'Campaign-ready tools for ads, demos, personalized outbound, and localized marketing content.',
  },
  {
    kind: 'feature' as const,
    slug: 'ai-video-for-youtube',
    description:
      'Faceless channel automation and script-to-video workflows built for YouTube publishing volume.',
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
  { kind: 'tool' as const, slug: 'heygen', href: '/tool/heygen', label: 'HeyGen' },
  { kind: 'tool' as const, slug: 'invideo', href: '/tool/invideo', label: 'InVideo' },
  { kind: 'tool' as const, slug: 'pictory', href: '/tool/pictory', label: 'Pictory' },
  { kind: 'tool' as const, slug: 'runway', href: '/tool/runway', label: 'Runway' },
];

const comparisonLinks = [
  {
    kind: 'vs' as const,
    slug: 'heygen-vs-synthesia',
    href: canonicalizeVsHref('/vs/heygen-vs-synthesia'),
    label: 'HeyGen vs Synthesia',
  },
  {
    kind: 'vs' as const,
    slug: 'heygen-vs-invideo',
    href: canonicalizeVsHref('/vs/heygen-vs-invideo'),
    label: 'HeyGen vs InVideo',
  },
  {
    kind: 'vs' as const,
    slug: 'fliki-vs-pictory',
    href: canonicalizeVsHref('/vs/fliki-vs-pictory'),
    label: 'Fliki vs Pictory',
  },
];

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export function generateMetadata(): Metadata {
  return {
    title: `Which AI Video Tool Do You Need? Use-Case Guide ${seoYear}`,
    description:
      'Figure out which type of AI video tool fits your workflow before comparing products. Decision hub for text-to-video, avatars, repurposing, social, and enterprise.',
    alternates: { canonical: '/features' },
    openGraph: {
      title: `Which AI Video Tool Do You Need? Use-Case Guide ${seoYear}`,
      description:
        'A workflow decision hub that helps you choose the right AI video route before you compare individual tools.',
      url: '/features',
    },
    robots: { index: true, follow: true },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function FeaturesHubPage() {
  const readyQuickRoutes = await filterPromoteSafeLinks(quickRoutes);
  const readyPrimaryCategories = await filterPromoteSafeLinks(primaryCategories);
  const readySecondaryCategories = await filterPromoteSafeLinks(secondaryCategories);
  const readyToolReviewLinks = await filterPromoteSafeLinks(toolReviewLinks);
  const readyComparisonLinks = await filterPromoteSafeLinks(comparisonLinks);

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
              Which type of AI video{' '}
              <span className="block">tool do you actually need?</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-gray-600 md:text-lg">
              Most people start by comparing products. Start by choosing the right workflow instead &mdash; then the shortlist builds itself.
            </p>
          </div>

          {/* Quick routes */}
          <div className="mt-8 border-t border-black/8 pt-5">
            <div className="grid gap-4 md:grid-cols-3">
              {readyQuickRoutes.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group flex items-baseline gap-2 no-underline"
              >
                <span className="text-sm font-bold text-black transition-colors duration-200 group-hover:text-black/70">
                  {r.question}
                </span>
                <span className="whitespace-nowrap text-sm font-semibold text-black/40 transition-colors duration-200 group-hover:text-black/65">
                  {r.category}&nbsp;→
                </span>
              </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">

        {/* ── Editorial Decision Map ─────────────────────────── */}
        <section className="mb-16">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
              HOW TO CHOOSE
            </p>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">
              Start from your situation, not from a tool name
            </h2>
          </div>

          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-black/[0.05] bg-black/[0.03] md:grid-cols-2">
            <div className="bg-[#FCFBF7] px-5 py-4">
              <p className="text-[13px] font-bold text-gray-900">Generating video from scratch with a text prompt?</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-black/48">
                Start with <Link href="/features/text-to-video-ai-tools" className="font-semibold text-black no-underline hover:text-black/65">text-to-video tools</Link>. Built for scene generation when there&#39;s no existing footage.
              </p>
            </div>
            <div className="bg-[#FCFBF7] px-5 py-4">
              <p className="text-[13px] font-bold text-gray-900">Need a visible presenter but not filming anyone?</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-black/48">
                Start with <Link href="/features/ai-avatar-video-generators" className="font-semibold text-black no-underline hover:text-black/65">AI avatar tools</Link>. The right path for training, sales demos, and multilingual delivery.
              </p>
            </div>
            <div className="bg-[#FCFBF7] px-5 py-4">
              <p className="text-[13px] font-bold text-gray-900">Already have blogs, webinars, or recordings?</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-black/48">
                Start with <Link href="/features/content-repurposing-ai-tools" className="font-semibold text-black no-underline hover:text-black/65">repurposing tools</Link>. Generators are the wrong first stop when source material already exists.
              </p>
            </div>
            <div className="bg-[#FCFBF7] px-5 py-4">
              <p className="text-[13px] font-bold text-gray-900">Not sure yet, or the job could go in multiple directions?</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-black/48">
                Start with the <Link href="/features/best-ai-video-generators" className="font-semibold text-black no-underline hover:text-black/65">broadest shortlist</Link>. It separates cinematic, avatar, and social-first tools first.
              </p>
            </div>
          </div>

          <p className="mt-3 text-[13px] leading-6 text-black/38">
            If the primary filter is speed, budget, platform, or team size &mdash; skip to the <a href="#specialized-routes" className="font-semibold text-black/50 no-underline hover:text-black/65">specialized routes</a> below.
          </p>
        </section>

        {/* ── Best starting points by workflow ────────────────── */}
        {readyPrimaryCategories.length > 0 && (
        <section className="mb-14 border-t border-black/6 pt-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
              Best starting points
            </p>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">
              Start with these workflows
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/52">
              Four distinct workflow families &mdash; pick the one that matches your job before you narrow further.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {readyPrimaryCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/features/${cat.slug}`}
                className="group rounded-[1.4rem] border border-black/8 bg-white px-6 py-5 no-underline transition-all duration-200 ease-out hover:-translate-y-1 hover:border-black/14 hover:shadow-[0_12px_28px_rgba(0,0,0,0.04)]"
              >
                <h3 className="text-lg font-black text-gray-900 transition-colors duration-200 group-hover:text-black/70">
                  {getFeatureTitle(cat.slug)}
                </h3>
                <p className="mt-1.5 max-w-sm text-sm leading-6 text-black/55">
                  {cat.description}
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-bold text-black">
                  <span className="border-b border-black/25 transition-colors duration-200 group-hover:border-black">
                    Start here
                  </span>
                  <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
        )}

        {/* ── Specialized routes ──────────────────────────────── */}
        {readySecondaryCategories.length > 0 && (
        <section id="specialized-routes" className="mb-12 border-t border-black/6 pt-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
              Narrow by constraint
            </p>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">
              Specialized routes
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/52">
              Already know the workflow family? Filter further by speed, budget, platform, or team size.
            </p>
          </div>

          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {readySecondaryCategories.map((cat) => (
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
        )}

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
        {(readyToolReviewLinks.length > 0 || readyComparisonLinks.length > 0) && (
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
                {readyToolReviewLinks.map((link) => (
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
                {readyComparisonLinks.map((link) => (
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
        )}
      </main>
    </div>
  );
}

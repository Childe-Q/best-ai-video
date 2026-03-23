import Link from 'next/link';
import { Metadata } from 'next';
import { canonicalizeVsHref } from '@/data/vs';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import { getSEOCurrentYear, getCurrentMonthYear } from '@/lib/utils';
import HomeToolGrid from '@/components/HomeToolGrid';
import GlobalScoringRubric from '@/components/GlobalScoringRubric';
import { filterPromoteSafeLinks, getPageReadiness } from '@/lib/readiness';

// Force cast to Tool[] to ensure type safety if JSON import inference is loose
const tools: Tool[] = toolsData as Tool[];
const flagshipToolSlugs = ['heygen', 'invideo', 'fliki'];

function prioritizeFlagshipTools(allTools: Tool[]): Tool[] {
  const flagshipOrder = new Map(flagshipToolSlugs.map((slug, index) => [slug, index]));
  const flagship = allTools
    .filter((tool) => flagshipOrder.has(tool.slug))
    .sort((a, b) => (flagshipOrder.get(a.slug) ?? 0) - (flagshipOrder.get(b.slug) ?? 0));
  const rest = allTools.filter((tool) => !flagshipOrder.has(tool.slug));
  return [...flagship, ...rest];
}

// Calculate dynamic tool count
const toolCount = tools.length;
const displayCount = toolCount >= 10 ? `${toolCount}+` : '';
const seoYear = getSEOCurrentYear();
const currentMonthYear = getCurrentMonthYear();
type StartPathLink = {
  kind: 'feature' | 'tool' | 'vs';
  slug: string;
  href: string;
  label: string;
};

type HomepagePrimaryPromo = {
  slug: string;
  tool: string;
  href: string;
  reviewLabel: string;
  desc: string;
  compareSlug: string;
  compareHref: string;
  compareLabel: string;
};

// Homepage core promo slots follow business priority, not editorial flagship ordering.
const homepagePrimaryPromotedTools: HomepagePrimaryPromo[] = [
  {
    slug: 'heygen',
    tool: 'HeyGen',
    href: '/tool/heygen',
    reviewLabel: 'HeyGen review',
    desc: 'Top AI avatar platform',
    compareSlug: 'heygen-vs-synthesia',
    compareHref: canonicalizeVsHref('/vs/heygen-vs-synthesia'),
    compareLabel: 'HeyGen vs Synthesia',
  },
  {
    slug: 'invideo',
    tool: 'InVideo',
    href: '/tool/invideo',
    reviewLabel: 'InVideo review',
    desc: 'Fast prompt-to-video pick',
    compareSlug: 'invideo-vs-heygen',
    compareHref: canonicalizeVsHref('/vs/invideo-vs-heygen'),
    compareLabel: 'InVideo vs HeyGen',
  },
  {
    slug: 'fliki',
    tool: 'Fliki',
    href: '/tool/fliki',
    reviewLabel: 'Fliki review',
    desc: 'Fast text-to-video and voiceover pick',
    compareSlug: 'fliki-vs-heygen',
    compareHref: canonicalizeVsHref('/vs/fliki-vs-heygen'),
    compareLabel: 'Fliki vs HeyGen',
  },
];

type StartPath = {
  title: string;
  stage: string;
  verdict: string;
  href: string;
  cta: string;
  links: StartPathLink[];
};

const startPaths: StartPath[] = [
  {
    title: 'Use case',
    stage: 'Early-stage research',
    verdict: 'Start here if you know the workflow but not the shortlist yet.',
    href: '/features',
    cta: 'Open feature hub',
    links: [
      {
        kind: 'feature' as const,
        slug: 'best-ai-video-generators',
        href: '/features/best-ai-video-generators',
        label: 'Best overall picks',
      },
      {
        kind: 'feature' as const,
        slug: 'text-to-video-ai-tools',
        href: '/features/text-to-video-ai-tools',
        label: 'Text-to-video tools',
      },
    ],
  },
  {
    title: 'Tool review',
    stage: 'Shortlist validation',
    verdict: 'Start here if one product is already in play and you need fit fast.',
    href: '/#tools-section',
    cta: 'Browse tool reviews',
    links: homepagePrimaryPromotedTools.slice(0, 2).map((tool) => ({
      kind: 'tool' as const,
      slug: tool.slug,
      href: tool.href,
      label: tool.reviewLabel,
    })),
  },
  {
    title: 'Comparison',
    stage: 'Final decision',
    verdict: 'Start here if the choice is down to two credible options.',
    href: '/vs',
    cta: 'Open VS pages',
    links: [
      {
        kind: 'vs' as const,
        slug: 'heygen-vs-synthesia',
        href: canonicalizeVsHref('/vs/heygen-vs-synthesia'),
        label: 'HeyGen vs Synthesia',
      },
      {
        kind: 'vs' as const,
        slug: 'heygen-vs-invideo',
        href: canonicalizeVsHref('/vs/invideo-vs-heygen'),
        label: 'InVideo vs HeyGen',
      },
    ],
  },
];
const topPicks = homepagePrimaryPromotedTools.map((tool) => ({
  slug: tool.slug,
  tool: tool.tool,
  href: tool.href,
  desc: tool.desc,
  compareSlug: tool.compareSlug,
  compareHref: tool.compareHref,
  compareLabel: tool.compareLabel,
}));

export function generateMetadata(): Metadata {
  return {
    title: `${displayCount ? `${displayCount} ` : ''}Best AI Video Generators & Tools ${seoYear} | Free & Paid Reviews`,
    description: `Discover ${displayCount ? `${displayCount} ` : ''}best AI video generators for ${seoYear}. Free plans, no watermark, text-to-video, 4K export. In-depth reviews, pricing comparisons & alternatives for YouTube creators.`,
  };
}

export default async function Home() {
  const prioritizedTools = prioritizeFlagshipTools(tools);
  const readyStartPaths = await Promise.all(
    startPaths.map(async (path) => ({
      ...path,
      links: await filterPromoteSafeLinks(path.links),
    }))
  );
  const readyTopPicks = (
    await Promise.all(
      topPicks.map(async (item) => {
        const toolReadiness = await getPageReadiness('tool', item.slug);
        if (!toolReadiness.ready) {
          return null;
        }

        const comparisonReadiness = await getPageReadiness('vs', item.compareSlug);
        return {
          ...item,
          compareHref: comparisonReadiness.ready ? item.compareHref : null,
        };
      })
    )
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="min-h-screen bg-[#FCFBF7] pb-20">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-black/10 bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,_rgba(184,245,0,0.18),_transparent_42%),radial-gradient(circle_at_20%_20%,_rgba(246,210,0,0.18),_transparent_28%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8 lg:py-36">
          <div className="mb-10 flex justify-center">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-bold tracking-[0.16em] text-black/70 backdrop-blur">
              ✨ UPDATED {currentMonthYear.toUpperCase()}
            </span>
          </div>

          <h1 className="mx-auto max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-gray-900 md:text-6xl lg:text-7xl">
            <span className="whitespace-nowrap md:whitespace-normal">
              The Ultimate List of {toolCount}+{' '}
              <span
                className="px-2 inline-block"
                style={{
                  backgroundImage: 'linear-gradient(to right, #F6D200, #B8F500)',
                  WebkitBoxDecorationBreak: 'clone',
                  boxDecorationBreak: 'clone',
                }}
              >
                AI Video Generators
              </span>
            </span>
            <span className="block mt-2">in {seoYear}</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base font-medium leading-7 text-gray-600 md:text-lg">
            Stop guessing. Start from the path that matches your decision: use case, tool review, or direct comparison. Then narrow down the top {toolCount}+ tools for YouTube, text-to-video, avatars, and business workflows.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/features"
              className="inline-flex items-center rounded-full border border-black/10 bg-[#B8F500] px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-[#A7E100] no-underline"
            >
              Browse by Use Case
            </Link>
            <Link
              href="/vs"
              className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-[#F6D200] no-underline"
            >
              View Comparisons
            </Link>
          </div>

          <div className="mx-auto mt-14 max-w-4xl border-t border-black/8 pt-6 text-left">
            <div className="grid gap-3 text-sm text-black/60 md:grid-cols-3">
              <p>Start from the workflow when the problem is still broad.</p>
              <p>Start from a tool review when one name is already shortlisted.</p>
              <p>Start from comparison when the decision is down to two.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="mb-16">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Start here</p>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-4xl">
              Pick the route that matches your buying stage
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Three ways in, depending on how far the shortlist has progressed.
            </p>
          </div>
          <div className="mt-8 border-y border-black/6">
            <div className="grid gap-2 xl:grid-cols-3 xl:gap-0">
              {readyStartPaths.map((path) => (
                <article
                  key={path.title}
                  className="group flex flex-col px-1 py-5 sm:px-0 xl:px-4 xl:py-6"
                >
                  <div className="rounded-[1.4rem] border border-transparent px-4 py-5 transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:border-black/8 group-hover:bg-white group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.04)] xl:border-r xl:border-black/8 xl:px-5 xl:group-hover:border-black/12 [&:last-child]:xl:border-r-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/40">{path.stage}</p>
                    <h3 className="mt-2 text-lg font-black text-gray-900 transition-colors duration-200 group-hover:text-black/70">{path.title}</h3>
                    <p className="mt-3 max-w-[19rem] text-sm leading-6 text-gray-600">{path.verdict}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {path.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center rounded-full border border-black/8 bg-[#F7F4EC] px-3 py-1.5 text-xs font-semibold text-black/70 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-black/15 hover:bg-[#F6D200] hover:text-black"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={path.href}
                      className="mt-6 inline-flex items-center text-sm font-bold text-black no-underline"
                    >
                      <span className="border-b border-black/25 transition-colors duration-200 group-hover:border-black">{path.cta}</span>
                      <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-black/6 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">Editorial picks</p>
                <p className="mt-1 text-sm text-black/55">Three quick places to jump in if you want a fast starting point.</p>
              </div>
              <Link
                href="/#tools-section"
                className="group inline-flex items-center self-start text-sm font-bold text-black no-underline"
              >
                <span className="border-b border-black/25 transition-colors duration-200 group-hover:border-black">See all tool reviews</span>
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {readyTopPicks.map((item) => (
              <Link
                key={item.tool}
                href={item.href}
                className="group rounded-2xl border border-black/8 bg-white px-4 py-4 no-underline transition-all duration-200 ease-out hover:-translate-y-1 hover:border-black/14 hover:bg-[#FFFEFB] hover:shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">Pick</p>
                    <p className="mt-2 text-base font-black text-black transition-colors duration-200 group-hover:text-black/70">
                  {item.tool}
                    </p>
                    <p className="mt-1 text-sm text-black/55">{item.desc}</p>
                  </div>
                  <span className="mt-1 text-black/25 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-black/45">→</span>
                </div>
                {item.compareHref ? (
                  <span className="mt-4 inline-flex w-fit items-center rounded-full bg-[#F7F4EC] px-3 py-1.5 text-xs font-semibold text-black/65">
                    {item.compareLabel}
                  </span>
                ) : null}
              </Link>
            ))}
            </div>
          </div>
        </section>

        <div className="mb-8 scroll-mt-20 border-t border-black/10 pt-8">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">All tools</p>
              <h2 id="tools-section" className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-5xl">All AI Video Tools</h2>
            </div>
            <GlobalScoringRubric />
          </div>
          <div className="flex items-center justify-between text-xs text-black/45">
            <span>Updated {currentMonthYear}</span>
            <span>Methodology applies across tools</span>
          </div>
        </div>
        <HomeToolGrid tools={prioritizedTools} />
      </main>
    </div>
  );
}

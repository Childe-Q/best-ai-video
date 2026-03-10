import Link from 'next/link';
import { Metadata } from 'next';
import { canonicalizeVsHref } from '@/data/vs';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import { getSEOCurrentYear, getCurrentMonthYear } from '@/lib/utils';
import HomeToolGrid from '@/components/HomeToolGrid';
import GlobalScoringRubric from '@/components/GlobalScoringRubric';

// Force cast to Tool[] to ensure type safety if JSON import inference is loose
const tools: Tool[] = toolsData as Tool[];

// Calculate dynamic tool count
const toolCount = tools.length;
const displayCount = toolCount >= 10 ? `${toolCount}+` : '';
const seoYear = getSEOCurrentYear();
const currentMonthYear = getCurrentMonthYear();
const popularComparisons = [
  { href: canonicalizeVsHref('/vs/invideo-vs-heygen'), label: 'InVideo vs HeyGen' },
  { href: canonicalizeVsHref('/vs/descript-vs-runway'), label: 'Descript vs Runway' },
  { href: canonicalizeVsHref('/vs/heygen-vs-synthesia'), label: 'HeyGen vs Synthesia' },
  { href: canonicalizeVsHref('/vs/invideo-vs-pictory'), label: 'InVideo vs Pictory' },
  { href: canonicalizeVsHref('/vs/runway-vs-pika'), label: 'Runway vs Pika' },
  { href: canonicalizeVsHref('/vs/fliki-vs-pictory'), label: 'Fliki vs Pictory' },
];
const featuredUseCases = [
  {
    href: '/features/ai-avatar-video-generators',
    title: 'AI Avatar Video',
    desc: 'Find avatar-first tools that already have real internal review coverage.',
  },
  {
    href: '/features/ai-video-for-social-media',
    title: 'Social Media Video',
    desc: 'Browse tools for Shorts, Reels, and quick-turn social publishing.',
  },
  {
    href: '/features/text-to-video-ai-tools',
    title: 'Text to Video',
    desc: 'Compare tools that generate net-new video directly from prompts.',
  },
  {
    href: '/features/content-repurposing-ai-tools',
    title: 'Content Repurposing',
    desc: 'Jump into tools built to turn long-form assets into short videos.',
  },
  {
    href: '/features/enterprise-ai-video-solutions',
    title: 'Enterprise Video',
    desc: 'Review platforms suited for governance, training, and team workflows.',
  },
  {
    href: '/features/professional-ai-video-tools',
    title: 'Professional Tools',
    desc: 'Compare higher-control platforms for business and production teams.',
  },
];
const startPaths = [
  {
    title: 'Start with a use case',
    description: 'Use this path when you know the job to be done but not the tool yet.',
    href: '/features',
    cta: 'Open the feature hub',
    bullets: [
      'Best for narrowing the field before you compare pricing.',
      'Strongest entry point for avatar, social, repurposing, and enterprise workflows.',
    ],
    links: [
      { href: '/features/ai-avatar-video-generators', label: 'Avatar tools' },
      { href: '/features/content-repurposing-ai-tools', label: 'Repurposing tools' },
    ],
  },
  {
    title: 'Start with a tool review',
    description: 'Use this path when one product is already on your shortlist and you need a grounded read on fit and trade-offs.',
    href: '/#tools-section',
    cta: 'Browse tool reviews',
    bullets: [
      'Review best-for, limitations, and related alternatives before paying.',
      'Best for buyers already comparing one or two known tools.',
    ],
    links: [
      { href: '/tool/invideo', label: 'InVideo review' },
      { href: '/tool/heygen', label: 'HeyGen review' },
    ],
  },
  {
    title: 'Start with a head-to-head comparison',
    description: 'Use this path when the shortlist is already clear and the decision is between two formats or two pricing models.',
    href: '/vs',
    cta: 'See VS pages',
    bullets: [
      'Best for deciding between stock-first, text-first, and avatar-first workflows.',
      'Fastest route when stakeholders keep asking "which one should we actually buy?"',
    ],
    links: [
      { href: canonicalizeVsHref('/vs/heygen-vs-synthesia'), label: 'HeyGen vs Synthesia' },
      { href: canonicalizeVsHref('/vs/invideo-vs-heygen'), label: 'InVideo vs HeyGen' },
    ],
  },
];
const topPicks = [
  { tool: 'InVideo', vs: 'vs HeyGen', href: '/tool/invideo', vsHref: canonicalizeVsHref('/vs/invideo-vs-heygen'), desc: 'Best for YouTube automation' },
  { tool: 'HeyGen', vs: 'vs Synthesia', href: '/tool/heygen', vsHref: canonicalizeVsHref('/vs/heygen-vs-synthesia'), desc: 'Top AI avatar platform' },
  { tool: 'Fliki', vs: 'vs Pictory', href: '/tool/fliki', vsHref: canonicalizeVsHref('/vs/fliki-vs-pictory'), desc: 'Fastest text-to-video' },
  { tool: 'Veed.io', vs: 'vs InVideo', href: '/tool/veed-io', vsHref: canonicalizeVsHref('/vs/invideo-vs-veed-io'), desc: 'All-in-one video editor' },
  { tool: 'Zebracat', vs: 'vs Fliki', href: '/tool/zebracat', vsHref: canonicalizeVsHref('/vs/fliki-vs-zebracat'), desc: 'Best for marketing ROI' },
  { tool: 'Synthesia', vs: 'vs HeyGen', href: '/tool/synthesia', vsHref: canonicalizeVsHref('/vs/heygen-vs-synthesia'), desc: 'Enterprise-grade avatars' },
  { tool: 'Elai.io', vs: 'vs Synthesia', href: '/tool/elai-io', vsHref: canonicalizeVsHref('/vs/elai-io-vs-synthesia'), desc: 'Best value avatars' },
  { tool: 'Pika', vs: 'vs Runway', href: '/tool/pika', vsHref: canonicalizeVsHref('/vs/runway-vs-pika'), desc: 'Cinematic AI video' },
];

export function generateMetadata(): Metadata {
  return {
    title: `${displayCount ? `${displayCount} ` : ''}Best AI Video Generators & Tools ${seoYear} | Free & Paid Reviews`,
    description: `Discover ${displayCount ? `${displayCount} ` : ''}best AI video generators for ${seoYear}. Free plans, no watermark, text-to-video, 4K export. In-depth reviews, pricing comparisons & alternatives for YouTube creators.`,
  };
}

export default function Home() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <header className="border-b-2 border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Status Pill - Neo-Brutal Style */}
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-[#F6D200] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ✨ UPDATED {currentMonthYear.toUpperCase()}
            </span>
          </div>
          
          {/* H1 Title - Neo-Brutal Typography */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 mb-8 leading-tight">
            <span className="whitespace-nowrap">
              The Ultimate List of {toolCount}+{' '}
              <span 
                className="px-2 inline-block"
                style={{ 
                  backgroundImage: 'linear-gradient(to right, #F6D200, #B8F500)',
                  WebkitBoxDecorationBreak: 'clone',
                  boxDecorationBreak: 'clone'
                }}
              >
                AI Video Generators
              </span>
            </span>
            <span className="block mt-2">in {seoYear}</span>
          </h1>
          
          {/* Description */}
          <p className="text-xl font-medium text-gray-600 max-w-2xl mx-auto mt-6 leading-relaxed">
            Stop guessing. Start from the path that matches your decision: use case, tool review, or direct comparison. Then narrow down the top {toolCount}+ tools for YouTube, text-to-video, avatars, and business workflows.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/features"
              className="inline-flex items-center px-5 py-2.5 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#B8F500] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              Browse by Use Case
            </Link>
            <Link
              href="/vs"
              className="inline-flex items-center px-5 py-2.5 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              View Comparisons
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16 rounded-xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Start here</p>
            <h2 className="mt-3 text-2xl md:text-4xl font-black text-gray-900 uppercase">
              Pick the route that matches your buying stage
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-gray-600">
              This site works in three distinct ways. If you are still framing the problem, begin in the feature hub. If one product is already under review, go to the tool page. If the shortlist is down to two names, jump straight into the VS pages.
            </p>
          </div>
          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {startPaths.map((path) => (
              <article key={path.title} className="rounded-xl border-2 border-black bg-[#FAF7F0] p-5">
                <h3 className="text-xl font-black text-gray-900">{path.title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-gray-600">{path.description}</p>
                <ul className="mt-4 space-y-2 text-sm font-medium text-gray-700">
                  {path.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-black" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  {path.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center rounded-full border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black no-underline hover:bg-[#F6D200]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <Link
                  href={path.href}
                  className="mt-5 inline-flex items-center border-b-2 border-black text-sm font-black text-black no-underline hover:bg-[#B8F500] px-1"
                >
                  {path.cta} →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* VS Comparison Section */}
        <section className="mb-16 bg-[#FAF7F0] rounded-xl p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-6 text-center uppercase">
            Compare Side-by-Side
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto font-medium">
            Data-driven comparisons with real test results, pricing analysis, and performance metrics
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {popularComparisons.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center px-6 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/vs"
              className="text-lg text-black hover:bg-[#F6D200] px-2 font-bold uppercase border-b-2 border-black no-underline"
          >
              View All Comparisons →
            </Link>
        </div>

        {/* Top Picks Section - Neo-Brutal Update */}
        <details className="mt-12 pt-8 border-t-2 border-black">
          <summary className="text-xl font-black text-gray-900 mb-6 text-center cursor-pointer list-none [&::-webkit-details-marker]:hidden uppercase">
            <span className="hover:bg-[#F6D200] px-2 transition-colors border-2 border-transparent hover:border-black rounded">Top Picks (Click to Expand)</span>
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {topPicks.map((item) => (
              <div key={item.tool} className="flex flex-col rounded-xl border-2 border-black bg-white px-4 py-4 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                <div className="flex justify-between items-center">
                  <Link href={item.href} className="font-bold text-lg text-black hover:bg-[#F6D200] px-1 no-underline">
                    {item.tool}
                  </Link>
                  <Link href={item.vsHref} className="text-xs font-bold px-3 py-1 rounded-full border-2 border-black bg-white text-black hover:bg-[#B8F500] transition-colors no-underline">
                    {item.vs}
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </details>
        </section>

        <section className="mb-16 rounded-xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Browse By Use Case</h2>
              <p className="mt-2 max-w-2xl text-gray-600 font-medium">
                Enter the features cluster directly from the homepage instead of relying on dropdown-only discovery.
              </p>
            </div>
            <Link
              href="/features"
              className="inline-flex items-center self-start px-5 py-2.5 bg-[#B8F500] border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              View All Features
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredUseCases.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border-2 border-black bg-[#FAF7F0] p-5 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
              >
                <p className="text-lg font-bold text-gray-900">{item.title}</p>
                <p className="mt-2 text-sm font-medium text-gray-600">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mb-10 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
            <h2 id="tools-section" className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">All AI Video Tools</h2>
            <GlobalScoringRubric />
          </div>
          <div className="flex items-center justify-between text-xs text-black/50">
            <span>Updated {currentMonthYear}</span>
            <span>Methodology applies across tools</span>
          </div>
        </div>
        <HomeToolGrid tools={tools} />
      </main>
    </div>
  );
}

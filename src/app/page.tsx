import Link from 'next/link';
import { Metadata } from 'next';
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
            Stop guessing. Compare the top {toolCount}+ tools for YouTube, Text-to-Video, and Avatars. Filter by Free Plan, No Watermark, and 4K Export.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* VS Comparison Section */}
        <section className="mb-16 bg-[#FAF7F0] rounded-xl p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-6 text-center uppercase">
            Compare Side-by-Side
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto font-medium">
            Data-driven comparisons with real test results, pricing analysis, and performance metrics
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Popular Comparisons */}
            <Link
              href="/vs/invideo-vs-heygen"
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              InVideo vs HeyGen
            </Link>
            <Link
              href="/vs/descript-vs-runway"
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              Descript vs Runway
            </Link>
            <Link
              href="/vs/heygen-vs-synthesia"
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              HeyGen vs Synthesia
            </Link>
            <Link
              href="/vs/invideo-vs-pictory"
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              InVideo vs Pictory
            </Link>
            <Link
              href="/vs/runway-vs-pika"
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              Runway vs Pika
            </Link>
            <Link
              href="/vs/fliki-vs-pictory"
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black hover:bg-[#F6D200] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
            >
              Fliki vs Pictory
            </Link>
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
            {[
              { tool: 'InVideo', vs: 'vs HeyGen', href: '/tool/invideo', vsHref: '/vs/invideo-vs-heygen', desc: 'Best for YouTube automation' },
              { tool: 'HeyGen', vs: 'vs Synthesia', href: '/tool/heygen', vsHref: '/vs/heygen-vs-synthesia', desc: 'Top AI avatar platform' },
              { tool: 'Fliki', vs: 'vs Pictory', href: '/tool/fliki', vsHref: '/vs/fliki-vs-pictory', desc: 'Fastest text-to-video' },
              { tool: 'Veed.io', vs: 'vs InVideo', href: '/tool/veed-io', vsHref: '/vs/invideo-vs-veed-io', desc: 'All-in-one video editor' },
              { tool: 'Zebracat', vs: 'vs Fliki', href: '/tool/zebracat', vsHref: '/vs/fliki-vs-zebracat', desc: 'Best for marketing ROI' },
              { tool: 'Synthesia', vs: 'vs HeyGen', href: '/tool/synthesia', vsHref: '/vs/heygen-vs-synthesia', desc: 'Enterprise-grade avatars' },
              { tool: 'Elai.io', vs: 'vs Synthesia', href: '/tool/elai-io', vsHref: '/vs/elai-io-vs-synthesia', desc: 'Best value avatars' },
              { tool: 'Pika', vs: 'vs Runway', href: '/tool/pika', vsHref: '/vs/runway-vs-pika', desc: 'Cinematic AI video' },
            ].map((item) => (
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

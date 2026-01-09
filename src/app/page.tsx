import Link from 'next/link';
import { Metadata } from 'next';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import { getSEOCurrentYear, getCurrentMonthYear } from '@/lib/utils';
import HomeToolGrid from '@/components/HomeToolGrid';

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
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Hero Section */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Status Pill */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
              ✨ Updated {currentMonthYear}
            </span>
          </div>
          
          {/* H1 Title with Gradient */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            The Ultimate List of {toolCount}+{' '}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              AI Video Generators
            </span>{' '}
            in {seoYear}
          </h1>
          
          {/* Description */}
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-6">
            Stop guessing. Compare the top {toolCount}+ tools for YouTube, Text-to-Video, and Avatars. Filter by Free Plan, No Watermark, and 4K Export capabilities.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* VS Comparison Section */}
        <section className="mb-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-200">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
            Compare AI Video Tools Side-by-Side
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-2xl mx-auto">
            Data-driven comparisons with real test results, pricing analysis, and performance metrics
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {/* Popular Comparisons */}
            <Link
              href="/vs/invideo-vs-heygen"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              InVideo vs HeyGen
            </Link>
            <Link
              href="/vs/descript-vs-runway"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Descript vs Runway
            </Link>
            <Link
              href="/vs/heygen-vs-synthesia"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              HeyGen vs Synthesia
            </Link>
            <Link
              href="/vs/invideo-vs-pictory"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              InVideo vs Pictory
            </Link>
            <Link
              href="/vs/runway-vs-pika"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Runway vs Pika
            </Link>
            <Link
              href="/vs/fliki-vs-pictory"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Fliki vs Pictory
            </Link>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/vs"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
              View All Comparisons →
            </Link>
        </div>
        </section>

        <h2 id="tools-section" className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 scroll-mt-20">All AI Video Tools</h2>
        <HomeToolGrid tools={tools} />
      </main>
    </div>
  );
}

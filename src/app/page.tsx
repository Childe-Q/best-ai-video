import Link from 'next/link';
import Image from 'next/image';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';

// Force cast to Tool[] to ensure type safety if JSON import inference is loose
const tools: Tool[] = toolsData as Tool[];

export const metadata = {
  title: 'Best AI Video Tools in 2025 | Reviews & Comparisons',
  description: 'Compare features, pricing, pros & cons, and alternatives of top AI video software.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Hero Section */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Best AI Video Tools in 2025
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare features, pricing, and alternatives of top AI video software
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

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">All AI Video Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  {/* Logo - display real logo if available, otherwise show letter placeholder */}
                  {tool.logo_url && tool.logo_url.endsWith('.svg') ? (
                    <div className="h-14 w-14 flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                      <img 
                        src={tool.logo_url} 
                        alt={`${tool.name} Logo`}
                        className="h-full w-full max-h-14 max-w-14 object-contain"
                      />
                    </div>
                  ) : tool.logo_url ? (
                    <div className="relative h-14 w-14 flex-shrink-0" suppressHydrationWarning>
                      <Image
                        src={tool.logo_url}
                        alt={`${tool.name} Logo`}
                        fill
                        className="object-contain"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl flex-shrink-0">
                      {tool.name.charAt(0)}
                    </div>
                  )}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {tool.pricing_model}
                  </span>
                </div>
                
                <Link href={`/tool/${tool.slug}`} className="block group">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                    {tool.name}
                  </h3>
                </Link>
                
                <p className="text-gray-500 text-sm mb-4">
                  {tool.short_description}
                </p>
                
                <div className="text-sm font-medium text-gray-900">
                  {tool.starting_price}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <Link 
                  href={`/tool/${tool.slug}`}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  View Review →
                </Link>
                <a
                  href={`/go/${tool.slug}`}
            target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
                  Visit Website
          </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

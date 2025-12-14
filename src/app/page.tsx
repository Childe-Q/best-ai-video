import Link from 'next/link';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  {/* Logo Placeholder - using a colored div if image fails or for MVP */}
                  <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {tool.name.charAt(0)}
                  </div>
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

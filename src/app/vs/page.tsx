import Link from 'next/link';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';

const tools: Tool[] = toolsData as Tool[];

export const metadata = {
  title: 'AI Video Tools Comparison | Side-by-Side Comparisons 2025',
  description: 'Compare AI video generators side-by-side with data-driven analysis, test results, and performance metrics.',
};

export default function VSIndexPage() {
  // Generate popular comparison pairs
  const topTools = [...tools]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  const comparisonPairs: Array<{ toolA: Tool; toolB: Tool; slug: string }> = [];

  for (let i = 0; i < topTools.length; i++) {
    for (let j = i + 1; j < topTools.length; j++) {
      const toolA = topTools[i];
      const toolB = topTools[j];
      const sharedTags = toolA.tags.filter((tag) => toolB.tags.includes(tag));

      if (sharedTags.length > 2 || (i < 5 && j < 5)) {
        comparisonPairs.push({
          toolA,
          toolB,
          slug: `${toolA.slug}-vs-${toolB.slug}`,
        });
      }
    }
  }

  // Limit to 30 most relevant comparisons
  const popularComparisons = comparisonPairs.slice(0, 30);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 text-center">
            AI Video Tools Comparison
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            Data-driven side-by-side comparisons with real test results, pricing analysis, and performance metrics
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularComparisons.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/vs/${comparison.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-500 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 text-center">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {comparison.toolA.name}
                  </h3>
                </div>
                <div className="px-4 text-gray-400 font-bold">VS</div>
                <div className="flex-1 text-center">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {comparison.toolB.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {comparison.toolA.tags[0] || 'Tool'}
                </span>
                <span className="text-gray-400">vs</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {comparison.toolB.tags[0] || 'Tool'}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {comparison.toolA.starting_price} vs {comparison.toolB.starting_price}
                </span>
                <span className="text-indigo-600 group-hover:text-indigo-700 font-medium">
                  Compare →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to All Tools
          </Link>
        </div>
      </main>
    </div>
  );
}


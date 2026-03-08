import Link from 'next/link';
import { getSEOCurrentYear } from '@/lib/utils';
import { getFeaturedVsCards, getGroupedVsCards, listVsIndexCards } from '@/lib/vsIndex';

const seoYear = getSEOCurrentYear();

export const metadata = {
  title: `AI Video Tools Comparison | Side-by-Side Comparisons ${seoYear}`,
  description: 'Source-backed AI video comparison pages with structured decision tables and explainable scoring.',
};

export default function VSIndexPage() {
  const comparisons = listVsIndexCards();
  const featured = getFeaturedVsCards(comparisons);
  const grouped = getGroupedVsCards(comparisons);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-center text-3xl font-extrabold text-gray-900 md:text-4xl">
            AI Video Tools Comparison
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-gray-600">
            Data-driven VS pages with traceable sources, unified scoring, and reusable decision structure.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-gray-900">Featured comparisons</h2>
            <p className="mt-2 text-sm text-gray-600">
              Highest-priority head-to-head pages. This block stays visible even when a pair would be pushed out of an intent group.
            </p>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {featured.map((comparison) => (
                <Link
                  key={comparison.slug}
                  href={`/vs/${comparison.slug}`}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-500 hover:shadow-md"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    {comparison.toolAName} vs {comparison.toolBName}
                  </h3>
                  <p className="mt-3 text-sm text-gray-700">{comparison.shortA}</p>
                  <p className="mt-1 text-sm text-gray-700">{comparison.shortB}</p>
                  <p className="mt-4 text-xs text-gray-500">Updated {comparison.updatedAt}</p>
                </Link>
              ))}
            </div>
          </section>

          {grouped.map((group) => (
            <section key={group.intent}>
              <h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {group.items.map((comparison) => (
                  <Link
                    key={comparison.slug}
                    href={`/vs/${comparison.slug}`}
                    className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-500 hover:shadow-md"
                  >
                    <h3 className="text-xl font-bold text-gray-900">
                      {comparison.toolAName} vs {comparison.toolBName}
                    </h3>
                    <p className="mt-3 text-sm text-gray-700">{comparison.shortA}</p>
                    <p className="mt-1 text-sm text-gray-700">{comparison.shortB}</p>
                    <p className="mt-4 text-xs text-gray-500">Updated {comparison.updatedAt}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

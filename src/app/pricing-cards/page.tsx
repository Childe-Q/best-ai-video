import Link from 'next/link';
import type { Metadata } from 'next';
import { getCanonicalPricingIndex } from '@/lib/pricingCards';

export const metadata: Metadata = {
  title: 'Pricing Cards Index',
  description: 'Canonical pricing cards index backed by pricing-cards JSON.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PricingCardsIndexPage() {
  const index = getCanonicalPricingIndex();

  return (
    <div className="min-h-screen bg-[#FCFBF7] py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Canonical pricing cards</h1>
          <p className="mt-2 text-sm text-gray-600">
            Reading directly from <code>information/data/pricing-cards/index.json</code>.
          </p>
          <p className="mt-1 text-sm text-gray-600">Total tools: {index.toolCount}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {index.tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/pricing-cards/${tool.slug}`}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">{tool.toolName}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {tool.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">Slug: {tool.slug}</p>
              <p className="mt-1 text-sm text-gray-600">Plans: {tool.planCount}</p>
              <p className="mt-1 text-sm text-gray-600">File: {tool.dataFile}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

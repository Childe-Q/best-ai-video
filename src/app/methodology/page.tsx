import Link from 'next/link';

export const metadata = {
  title: 'Methodology | AI Video Tool Comparisons',
  description:
    'How we run VS comparisons: prompt controls, source policy, scoring weights, and update-date rules.',
  alternates: {
    canonical: 'https://best-ai-video.com/methodology',
  },
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Comparison Methodology</h1>
        <p className="mt-4 text-sm text-gray-700">
          This page explains how we build and maintain VS comparisons so readers can verify assumptions and reuse the same framework.
        </p>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">How We Compare</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>Use one shared test prompt for both tools in each comparison.</li>
            <li>Use a consistent baseline for duration, format, language, and export settings.</li>
            <li>Capture differences in a structured matrix so the same template can be reused across VS pages.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Source Policy</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>Primary source preference: official pricing pages and official product documentation.</li>
            <li>Secondary sources: help center documentation and established review sources when official pages are incomplete.</li>
            <li>Each source-backed claim can include a source link and a checked date.</li>
          </ul>
        </section>

        <section id="scoring" className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Scoring Dimensions</h2>
          <p className="mt-3 text-sm text-gray-700">
            VS pages use an <strong>internal score</strong> (our in-house model), not a third-party authority rating.
            Default weights: pricingValue (25%), ease (20%), speed (20%), output (20%), customization (15%).
          </p>
          <p className="mt-2 text-sm text-gray-700">
            External ratings (when shown elsewhere) are treated as separate third-party signals and are not the same as this internal score.
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Each metric is tagged as <strong>verified</strong> (linked to primary sources) or <strong>estimated</strong> (derived from structured product data when row-level links are still limited). Mixed pages contain both.
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Every score block includes a method note plus per-metric rationale so readers can see why the score moved and what evidence backs it.
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Winner cards are derived from internal score metrics: Price uses pricingValue, Speed uses speed, Quality uses output, and overall recommendation uses weighted total score. If the weighted gap is under 0.2, we mark it as a close call.
          </p>
          <p className="mt-2 text-sm text-gray-700">
            For featured tools, we apply a small internal-score calibration to keep recommendations consistent across the site.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Date Rules</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>
              <strong>Updated</strong>: the date the page structure/content was last revised.
            </li>
            <li>
              <strong>Pricing checked</strong>: the date pricing and source-backed factual rows were last verified.
            </li>
            <li>We avoid conflicting date labels on the same page.</li>
          </ul>
        </section>

        <div className="mt-8">
          <Link href="/vs/fliki-vs-heygen" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View example VS page →
          </Link>
        </div>
      </main>
    </div>
  );
}

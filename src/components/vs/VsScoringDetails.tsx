import Link from 'next/link';

const METRIC_DETAILS = [
  {
    label: 'Pricing value',
    bullets: [
      'Starting price and visible plan entry point',
      'Free plan or free-tier access when clearly documented',
      'Plan limits that change real usable output volume',
    ],
  },
  {
    label: 'Ease',
    bullets: [
      'How quickly a new user can get to first usable output',
      'Template setup and workflow complexity in official docs',
      'Whether the core flow is simple or multi-step',
    ],
  },
  {
    label: 'Speed',
    bullets: [
      'How fast the workflow moves from prompt or script to draft',
      'Whether batch iteration is straightforward',
      'Operational friction from approvals, credits, or setup',
    ],
  },
  {
    label: 'Output',
    bullets: [
      'Documented output type and delivery style',
      'Language, dubbing, or voice support when verified',
      'How strong the final format fit is for the target job',
    ],
  },
  {
    label: 'Customization',
    bullets: [
      'Scene, template, and layout control',
      'API or automation scope when officially documented',
      'Reusable assets, workspace controls, and editing flexibility',
    ],
  },
];

export default function VsScoringDetails() {
  return (
    <details className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-gray-900">Scoring &amp; sources</summary>
      <div className="mt-3 space-y-4 text-sm text-gray-700">
        <p>
          This is an internal scoring model, not a third-party rating. We only score against verified official sources or structured product data that maps back to official product pages.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {METRIC_DETAILS.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="font-medium text-gray-900">{metric.label}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                {metric.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <p>Verified source types: official pricing, features, help center, terms, and other product documentation.</p>
          <p>Unverified claims do not enter the score. They remain outside the scoring model until a verified source is attached.</p>
          <p>If pricing has no verified pricing page attached, the Pricing Value metric stays visible but is excluded from weighted totals and recommendation logic.</p>
        </div>
        <Link href="/methodology#scoring" className="inline-block font-medium text-indigo-600 hover:text-indigo-700">
          Read full scoring methodology →
        </Link>
      </div>
    </details>
  );
}

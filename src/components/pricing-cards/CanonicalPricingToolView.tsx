import Link from 'next/link';
import type { CanonicalPricingTool } from '@/types/pricingCards';
import CanonicalPricingCard from './CanonicalPricingCard';
import { getPlanReactKey } from '@/lib/pricing/planKey';

interface CanonicalPricingToolViewProps {
  tool: CanonicalPricingTool;
}

export default function CanonicalPricingToolView({ tool }: CanonicalPricingToolViewProps) {
  return (
    <div className="min-h-screen bg-[#FCFBF7] py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/pricing-cards" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Back to pricing cards index
          </Link>
        </div>

        <header className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold uppercase tracking-wide text-gray-700">
              {tool.status}
            </span>
            <span>{tool.slug}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{tool.toolName}</h1>
          <p className="mt-2 text-sm text-gray-600">Source type: {tool.sourceType}</p>
        </header>

        {tool.notes.length > 0 && (
          <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="mb-3 text-lg font-bold text-amber-900">Notes</h2>
            <ul className="space-y-2 text-sm text-amber-900">
              {tool.notes.map((note, index) => (
                <li key={`${note}-${index}`} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tool.plans.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-2">
            {tool.plans.map((plan, index) => (
              <CanonicalPricingCard
                key={getPlanReactKey(plan, index, 'canonical-pricing-card')}
                plan={plan}
                status={tool.status}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">No pricing plans available</h2>
            <p className="mt-2 text-sm text-gray-600">
              This canonical record currently has no plan cards. Status is still shown above so the page can render safely.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

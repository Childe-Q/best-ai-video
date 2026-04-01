import type { CanonicalPricingPlan, CanonicalPricingStatus } from '@/types/pricingCards';
import { getCanonicalDisplayValue, isCanonicalMissingValue } from '@/lib/pricingCards';

interface CanonicalPricingCardProps {
  plan: CanonicalPricingPlan;
  status: CanonicalPricingStatus;
}

function renderBullets(bullets: string[]) {
  if (!bullets.length) {
    return <p className="text-sm text-gray-500">No plan bullets available.</p>;
  }

  return (
    <ul className="space-y-2 text-sm text-gray-700">
      {bullets.map((bullet, index) => (
        <li key={`${bullet}-${index}`} className="flex items-start gap-2">
          <span className="mt-0.5 text-gray-400">•</span>
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CanonicalPricingCard({ plan, status }: CanonicalPricingCardProps) {
  const description = getCanonicalDisplayValue(plan.description, 'Description not available.');
  const cta = getCanonicalDisplayValue(plan.cta, 'CTA not available');
  const monthlyDisplayedPrice = getCanonicalDisplayValue(plan.monthlyPriceBlock.displayedPrice, 'Not found');
  const monthlyDisplayUnit = getCanonicalDisplayValue(plan.monthlyPriceBlock.displayUnit, '');
  const monthlyBillingLabel = getCanonicalDisplayValue(plan.monthlyPriceBlock.billingLabel, 'Billing label not available');
  const yearlyDisplayedPrice = getCanonicalDisplayValue(plan.yearlyPriceBlock.displayedPrice, 'Not found');
  const yearlyDisplayUnit = getCanonicalDisplayValue(plan.yearlyPriceBlock.displayUnit, '');
  const yearlyBillingLabel = getCanonicalDisplayValue(plan.yearlyPriceBlock.billingLabel, 'Billing label not available');
  const yearlyTotalPrice = getCanonicalDisplayValue(plan.yearlyPriceBlock.yearlyTotalPrice, 'Yearly total not available');
  const annualNote = getCanonicalDisplayValue(plan.yearlyPriceBlock.annualNote, 'Annual note not available');

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {status}
          </span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly</div>
          <div className="text-2xl font-bold text-gray-900">
            {monthlyDisplayedPrice}
            {monthlyDisplayUnit && !isCanonicalMissingValue(plan.monthlyPriceBlock.displayUnit) ? (
              <span className="ml-1 text-sm font-medium text-gray-500">{monthlyDisplayUnit}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-gray-600">{monthlyBillingLabel}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Yearly</div>
          <div className="text-2xl font-bold text-gray-900">
            {yearlyDisplayedPrice}
            {yearlyDisplayUnit && !isCanonicalMissingValue(plan.yearlyPriceBlock.displayUnit) ? (
              <span className="ml-1 text-sm font-medium text-gray-500">{yearlyDisplayUnit}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-gray-600">{yearlyBillingLabel}</p>
          <p className="mt-2 text-sm text-gray-600">Yearly total: {yearlyTotalPrice}</p>
          <p className="mt-1 text-sm text-gray-600">{annualNote}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">CTA</div>
        <p className="text-sm font-medium text-gray-800">{cta}</p>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Bullets</div>
        {renderBullets(plan.bullets)}
      </div>
    </article>
  );
}

'use client';

import type { ProductizedPricingDetailSection } from '@/lib/pricing/productPageOverrides';
import { getPlanReactKey } from '@/lib/pricing/planKey';

interface PricingDetailsSectionProps {
  detailSection: ProductizedPricingDetailSection;
}

export default function PricingDetailsSection({ detailSection }: PricingDetailsSectionProps) {
  if (!detailSection.plans.length) {
    return null;
  }

  return (
    <div className="mb-16 scroll-mt-32" id="plan-details">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{detailSection.title}</h2>
        {detailSection.intro && <p className="text-gray-600">{detailSection.intro}</p>}
      </div>

      <div className="space-y-4">
        {detailSection.plans.map((plan, planIndex) => (
          <details
            key={getPlanReactKey(plan, planIndex, 'pricing-detail')}
            className="group rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#111111] open:shadow-[6px_6px_0px_0px_#111111]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-black">{plan.name}</h3>
                {plan.summary && <p className="mt-1 text-sm text-gray-600">{plan.summary}</p>}
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500 group-open:text-black">
                View details
              </span>
            </summary>

            <div className="border-t border-gray-200 px-5 py-5">
              <div className="grid gap-5 md:grid-cols-2">
                {plan.sections.map((section) => (
                  <div key={`${plan.name}-${section.title}`}>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">{section.title}</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {section.items.map((item, idx) => (
                        <li key={`${plan.name}-${section.title}-${idx}`} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

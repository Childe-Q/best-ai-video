'use client';

import { useState } from 'react';
import { PricingPlan } from '@/types/tool';
import PricingCard from './PricingCard';

interface PricingCardsGridProps {
  plans: PricingPlan[];
  affiliateLink: string;
  hasFreeTrial: boolean;
}

export default function PricingCardsGrid({ plans, affiliateLink, hasFreeTrial }: PricingCardsGridProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  // Debug: Log plan pricing structure
  console.log("Pricing Plans Debug:", plans.map(p => ({ name: p.name, price: p.price })));
  console.log("hasYearlyPricing:", plans.some(p => {
    if (typeof p.price === 'object' && p.price !== null) {
      return !!(p.price.yearly || (p.price as any).annual);
    }
    return false;
  }));

  // Check if any plan has yearly pricing
  const hasYearlyPricing = plans.some(plan => {
    if (!plan.price || typeof plan.price !== 'object' || plan.price === null) return false;
    // Check if it has monthly/yearly structure with yearly defined
    if ('monthly' in plan.price) {
      return 'yearly' in plan.price && plan.price.yearly !== undefined && plan.price.yearly !== null;
    }
    return false;
  });

  // Determine which plan is popular (for highlighting)
  const getIsPopular = (plan: PricingPlan, index: number): boolean => {
    const badgeText = (plan as any).ribbonText || plan.badge || '';
    return badgeText.includes('Popular') || 
           badgeText.includes('Best Value') || 
           plan.name.includes('Standard') || 
           index === 1;
  };

  // Determine grid columns
  const getGridCols = () => {
    const planCount = plans.length;
    if (planCount === 1) return 'grid-cols-1';
    if (planCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (planCount === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-500">Pricing information coming soon.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Monthly/Yearly Toggle */}
      {hasYearlyPricing && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1 border border-gray-200">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                billing === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 relative ${
                billing === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-green-600 text-xs font-normal">⚡ 40% off</span>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className={`grid ${getGridCols()} gap-8`}>
        {plans.map((plan, index) => (
          <PricingCard
            key={plan.name || index}
            plan={plan}
            isPopular={getIsPopular(plan, index)}
            affiliateLink={affiliateLink}
            billing={billing}
            hasFreeTrial={hasFreeTrial}
            previousPlanName={index > 0 ? plans[index - 1]?.name : undefined}
          />
        ))}
      </div>
    </div>
  );
}

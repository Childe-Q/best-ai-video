'use client';

import { useState } from 'react';
import { PricingPlan, ComparisonTable } from '@/types/tool';
import PricingCard from './PricingCard';

interface PricingCardsGridProps {
  plans: PricingPlan[];
  affiliateLink: string;
  hasFreeTrial: boolean;
  toolSlug?: string;
  comparisonTable?: ComparisonTable;
}

export default function PricingCardsGrid({ plans, affiliateLink, hasFreeTrial, toolSlug, comparisonTable }: PricingCardsGridProps) {
  const isInVideo = toolSlug === 'invideo';
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

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

  // Sort plans: Only for invideo, use special order (Plus, Max, Generative, Team, Free, Enterprise)
  // For other tools, keep original order
  let sortedPlans = [...plans];
  let topRowPlans: PricingPlan[] = [];
  let bottomRowPlans: PricingPlan[] = [];
  
  if (isInVideo) {
    const planOrder = ['Plus', 'Max', 'Generative', 'Team', 'Free', 'Enterprise'];
    sortedPlans = sortedPlans.sort((a, b) => {
      const aIndex = planOrder.indexOf(a.name);
      const bIndex = planOrder.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    
    // Split into top row (4 plans) and bottom row (2 plans) for invideo
    topRowPlans = sortedPlans.filter(p => ['Plus', 'Max', 'Generative', 'Team'].includes(p.name));
    bottomRowPlans = sortedPlans.filter(p => ['Free', 'Enterprise'].includes(p.name));
  } else {
    // For other tools, use all plans in original order
    topRowPlans = sortedPlans;
    bottomRowPlans = [];
  }

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
          <div className={`inline-flex items-center bg-gray-100 rounded-full p-1 gap-1 border ${
            isInVideo ? 'border-gray-200' : 'border-gray-200'
          }`}>
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

      {/* Top Row: Plans */}
      {topRowPlans.length > 0 && (
        <div className={isInVideo 
          ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
        }>
          {topRowPlans.map((plan, index) => {
            const originalIndex = plans.findIndex(p => p.name === plan.name);
            return (
              <div key={plan.name || index} className={isInVideo ? "min-w-[260px]" : ""}>
                <PricingCard
                  plan={plan}
                  isPopular={getIsPopular(plan, originalIndex)}
                  affiliateLink={affiliateLink}
                  isAnnual={billing === 'yearly'}
                  hasFreeTrial={hasFreeTrial}
                  previousPlanName={index > 0 ? topRowPlans[index - 1]?.name : undefined}
                  toolSlug={toolSlug}
                  comparisonTable={comparisonTable}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Row: 2 plans (Free, Enterprise) - Only for invideo */}
      {isInVideo && bottomRowPlans.length > 0 && (
        <div className="mt-6 flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center max-w-[900px] w-full">
            {bottomRowPlans.map((plan, index) => {
              const originalIndex = plans.findIndex(p => p.name === plan.name);
              return (
                <div key={plan.name || index} className="min-w-[260px]">
                  <PricingCard
                    plan={plan}
                    isPopular={getIsPopular(plan, originalIndex)}
                    affiliateLink={affiliateLink}
                    isAnnual={billing === 'yearly'}
                    hasFreeTrial={hasFreeTrial}
                    previousPlanName={index > 0 ? bottomRowPlans[index - 1]?.name : undefined}
                    toolSlug={toolSlug}
                    comparisonTable={comparisonTable}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

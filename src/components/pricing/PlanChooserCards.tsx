'use client';

import { PricingPlan } from '@/types/tool';
import { CheckIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { extractBestFor } from '@/lib/pricing/extractPlanFields';

interface PlanChooserCardsProps {
  pricingPlans: PricingPlan[];
  planPicker?: {
    title?: string;
    bullets?: string[];
  };
  toolData?: {
    key_facts?: string[];
    highlights?: string[];
    best_for?: string;
  };
  snapshotPlans?: Array<{ name: string; bullets: string[] }>;
}

export default function PlanChooserCards({ pricingPlans, planPicker, toolData, snapshotPlans }: PlanChooserCardsProps) {
  // 1. Filter Logic: Only Paid Plans
  const isPaidPlan = (plan: PricingPlan) => {
    const name = (plan.name || '').toLowerCase();
    
    // Exclude Free
    if (name.includes('free')) return false;
    
    // Exclude Enterprise / Contact Sales
    if (name.includes('enterprise') || name.includes('contact')) return false;

    // Check price 0
    if (plan.price && typeof plan.price === 'object' && 'monthly' in plan.price) {
       const amount = (plan.price.monthly as any)?.amount;
       if (amount === 0) return false;
    }

    return true;
  };

  const paidPlans = pricingPlans.filter(isPaidPlan);

  if (paidPlans.length === 0) return null;

  // 2. Selection Logic: Prioritize Popular + limit to 2-3
  // Sort logic: Popular first, then original order
  const isPopular = (plan: PricingPlan) => {
      const badge = (plan.badge || plan.ribbonText || '').toLowerCase();
      return badge.includes('popular') || badge.includes('best value') || plan.isPopular;
  };

  const selectedPlans = [...paidPlans].sort((a, b) => {
      const popA = isPopular(a) ? 1 : 0;
      const popB = isPopular(b) ? 1 : 0;
      return popB - popA; // Descending
  }).slice(0, 3);

  // 3. Content Derivation Helper
  const deriveCardContent = (plan: PricingPlan) => {
      // Best for: Use extractBestFor helper (prioritizes plan description -> snapshot -> tool best_for)
      const bestFor = extractBestFor(plan.name, plan, toolData ? { best_for: toolData.best_for } : null, snapshotPlans);

      // Includes: Top 2-3 distinct features from highlights or featureItems (real data only)
      const allFeatures = [
          ...(plan.highlights || []),
          ...(plan.featureItems?.map(f => f.text) || []),
          ...(plan.features || [])
      ];

      // Filter repetitive usage text (simple version)
      const cleanFeatures = allFeatures.filter(f => {
          const lower = f.toLowerCase();
          return !lower.includes('repeat') && !lower.includes('consum') && !lower.includes('credit');
      });

      // dedupe
      const uniqueFeatures = Array.from(new Set(cleanFeatures));
      // Take top 2-3 real features (not placeholder text)
      const includes = uniqueFeatures
          .filter(f => {
              // Exclude generic placeholder patterns
              const lower = f.toLowerCase();
              return !lower.includes('50 video mins') && 
                     !lower.includes('includes') && 
                     !lower.includes('comes with');
          })
          .slice(0, 3);

      // Watch-outs: Look for explicit limits or watermarks
      // Only show if we find explicit negative/limit keywords
      const limits = uniqueFeatures.filter(f => {
          const lower = f.toLowerCase();
          // Look for "watermark" (if not "no watermark"), "limit", "max"
          if (lower.includes('watermark') && !lower.includes('no watermark') && !lower.includes('remove')) return true;
          // Usually paid plans don't have watermark watchouts, but maybe limits
          // Be careful not to flag "Unlimited" as a limit
          if ((lower.includes('limit') || lower.includes('cap')) && !lower.includes('unlimited')) return true;
          return false;
      }).slice(0, 1); // Max 1 watchout

      return {
          bestFor,
          includes,
          watchouts: limits
      };

  };

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {planPicker?.title || "Which plan should I choose?"}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {selectedPlans.map((plan, idx) => {
            const content = deriveCardContent(plan);
            const popular = isPopular(plan);
            
            return (
                <div 
                    key={idx}
                    className={`
                        bg-white rounded-xl border-2 p-6 flex flex-col h-full
                        ${popular ? 'border-black shadow-[4px_4px_0px_0px_#000]' : 'border-gray-200 shadow-sm'}
                    `}
                >
                    <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            {plan.name}
                            {popular && (
                                <span className="bg-[#B8F500] text-black text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-black">
                                    Popular
                                </span>
                            )}
                        </h3>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Row 1: Best For */}
                        {content.bestFor && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex items-start gap-2">
                                    <SparklesIcon className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Best For</p>
                                        <p className="text-sm font-medium text-gray-900 leading-tight">{content.bestFor}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Row 2: Includes */}
                        {content.includes.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Includes</p>
                                <ul className="space-y-2">
                                    {content.includes.map((feat, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <CheckIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Row 3: Watch-outs (Only if exists) */}
                        {content.watchouts.length > 0 && (
                            <div className="pt-3 border-t border-dashed border-gray-200 mt-auto">
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                    Watch out
                                </p>
                                <ul className="space-y-1">
                                    {content.watchouts.map((warn, i) => (
                                        <li key={i} className="text-sm text-gray-600">
                                            {warn}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { PricingPlan, ComparisonTable } from '@/types/tool';
import PricingSnapshot from './PricingSnapshot';
import PricingUsageExplainer from './PricingUsageExplainer';
import PlanChooserCards from './PlanChooserCards';
import BillingToggle from './BillingToggle';
import PricingCardsGrid from '@/components/PricingCardsGrid';
import PlanComparisonTable from './PlanComparisonTable';
import VerdictSection from './VerdictSection';
import DisclosureSection from '@/components/DisclosureSection';
import DisclosurePopover from '@/components/DisclosurePopover';
import { getStartingPrice } from '@/lib/utils';
import { generatePricingSnapshot } from '@/lib/generatePricingSnapshot';

interface ToolPricingTemplateProps {
  // Tool metadata
  toolName: string;
  toolSlug: string;
  
  // Pricing data
  pricingPlans: PricingPlan[];
  comparisonTable?: ComparisonTable;
  
  // Content data
  pricingSnapshot?: {
    plans: Array<{ name: string; bullets: string[] }>;
    note?: string;
  };
  creditUsage?: {
    title: string;
    bullets: string[];
  };
  planPicker?: {
    title: string;
    bullets: string[];
  };
  verdict?: {
    title: string;
    text: string;
  };
  
  // Meta data
  lastUpdated: string;
  officialPricingUrl?: string | null;
  
  // CTA data
  affiliateLink: string;
  hasFreeTrial: boolean;
  startingPrice: string;
}

export default function ToolPricingTemplate({
  toolName,
  toolSlug,
  pricingPlans,
  comparisonTable,
  pricingSnapshot,
  creditUsage,
  planPicker,
  verdict,
  lastUpdated,
  officialPricingUrl,
  affiliateLink,
  hasFreeTrial,
  startingPrice,
}: ToolPricingTemplateProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  // Check if any plan has yearly pricing
  const hasYearlyPricing = useMemo(() => {
    return pricingPlans.some(plan => {
      if (!plan.price || typeof plan.price !== 'object' || plan.price === null) return false;
      if ('monthly' in plan.price) {
        return 'yearly' in plan.price && plan.price.yearly !== undefined && plan.price.yearly !== null;
      }
      return false;
    });
  }, [pricingPlans]);

  // Calculate yearly discount (average across all plans)
  const yearlyDiscount = useMemo(() => {
    if (!hasYearlyPricing) return undefined;
    
    let totalDiscount = 0;
    let count = 0;
    
    pricingPlans.forEach(plan => {
      if (plan.price && typeof plan.price === 'object' && 'monthly' in plan.price && 'yearly' in plan.price) {
        const monthly = (plan.price.monthly as any)?.amount;
        const yearly = (plan.price.yearly as any)?.amount;
        if (monthly && yearly && monthly > 0) {
          const discount = Math.round(((monthly - yearly) / monthly) * 100);
          totalDiscount += discount;
          count++;
        }
      }
    });
    
    return count > 0 ? Math.round(totalDiscount / count) : undefined;
  }, [pricingPlans, hasYearlyPricing]);

  // Generate pricing snapshot: use provided data or generate from plans
  const snapshotData = pricingSnapshot || (pricingPlans.length > 0 
    ? generatePricingSnapshot(pricingPlans, 3)
    : { plans: [] });
  
  const snapshotPlans = snapshotData.plans;
  const snapshotNote = snapshotData.note;

  // Generate default comparison table data
  const freePlanFeatures = [
    { feature: 'Watermark', value: 'Yes' },
    { feature: 'Export Quality', value: '720p / 1080p (varies by plan)' },
    { feature: 'Usage Limits', value: 'Limited minutes/exports per period' },
  ];
  
  const paidPlanFeatures = [
    { feature: 'Watermark', value: 'No' },
    { feature: 'Export Quality', value: '1080p / 4K' },
    { feature: 'Usage Limits', value: 'Higher limits based on plan' },
  ];

  // Verdict data
  const verdictTitle = verdict?.title?.replace('{price}', startingPrice) || `Is ${toolName} worth ${startingPrice}?`;
  const verdictText = verdict?.text || `If you need to produce videos regularly and want to avoid manual asset sourcing, the time savings can justify the cost. The Free plan works for testing, but watermarks and limits make it unsuitable for publishing. Start with monthly billing to test your actual usage before committing to annual plans.`;

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className="py-8">
          {/* 1. Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              {toolName} Plans & Pricing
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Compare plans, understand credit usage, and find the right tier for your production volume.
            </p>
            
            {/* Trust Bar: Last updated + Source + Disclosure */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
              <span>Last updated: {lastUpdated}</span>
              {officialPricingUrl && (
                <>
                  <span>•</span>
                  <span>
                    Source:{' '}
                    <a 
                      href={officialPricingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Official pricing page
                    </a>
                  </span>
                </>
              )}
              <span>•</span>
              <DisclosurePopover />
            </div>
          </div>

          {/* 2. Pricing Snapshot */}
          {snapshotPlans.length > 0 && (
            <PricingSnapshot 
              plans={snapshotPlans}
              note={snapshotNote || pricingSnapshot?.note || 'Check official pricing for most up-to-date plans and features'}
            />
          )}

          {/* 2a. How credits/minutes get used */}
          <PricingUsageExplainer
            title={creditUsage?.title}
            bullets={creditUsage?.bullets}
            pricingPlans={pricingPlans}
          />

          {/* 2b. Plan chooser cards */}
          <PlanChooserCards
            pricingPlans={pricingPlans}
            planPicker={planPicker}
          />

          {/* 3. Billing Toggle */}
          {hasYearlyPricing && (
            <BillingToggle 
              onBillingChange={setBilling}
              defaultBilling="monthly"
              yearlyDiscount={yearlyDiscount}
            />
          )}

          {/* 4. Pricing Cards Grid */}
          <div className="mb-0">
            {pricingPlans.length > 0 ? (
              <PricingCardsGrid 
                plans={pricingPlans} 
                affiliateLink={affiliateLink}
                hasFreeTrial={hasFreeTrial}
                toolSlug={toolSlug}
                comparisonTable={comparisonTable}
                externalBilling={billing}
              />
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center mb-12">
                <p className="text-gray-500">Pricing information coming soon.</p>
              </div>
            )}
          </div>

          {/* Elegant Spacing */}
          {pricingPlans.length > 0 && (
            <div className={pricingPlans.length > 3 ? "mt-16" : "mt-16"}></div>
          )}

          {/* 5. Free vs Paid Plan Comparison Table */}
          {pricingPlans.length > 0 && (
            <PlanComparisonTable 
              freePlanFeatures={freePlanFeatures}
              paidPlanFeatures={paidPlanFeatures}
            />
          )}

          {/* 6. Verdict / Recommendation */}
          <VerdictSection
            title={verdictTitle}
            text={verdictText}
            affiliateLink={affiliateLink}
            hasFreeTrial={hasFreeTrial}
          />

          {/* 7. Disclosure Section */}
          <DisclosureSection />

          {/* 8. Footer Note */}
          <div className="text-center text-sm text-gray-500 mt-8">
            *Prices subject to change. Check official site for most up-to-date pricing.
          </div>
        </main>
      </div>
    </section>
  );
}

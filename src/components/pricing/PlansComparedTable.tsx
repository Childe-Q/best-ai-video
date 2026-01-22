'use client';

import { PricingPlan } from '@/types/tool';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { isFreePlan } from '@/lib/pricing/filterPaidPlans';
import { extractComparableAttributes, selectAttributesForDisplay, ComparableAttribute } from '@/lib/pricing/extractComparableAttributes';
import { useMemo } from 'react';
import PlanBadge from './PlanBadge';
import { generateStyleProfile } from '@/lib/pricing/generateStyleProfile';

interface PlansComparedTableProps {
  plans: PricingPlan[];
  toolName: string;
  toolSlug?: string;
  toolData?: {
    key_facts?: string[];
    highlights?: string[];
    best_for?: string;
  };
  snapshotPlans?: Array<{ name: string; bullets: string[] }>;
  billing?: 'monthly' | 'yearly';
}

export default function PlansComparedTable({ 
  plans, 
  toolName,
  toolSlug,
  toolData, 
  snapshotPlans,
  billing = 'monthly'
}: PlansComparedTableProps) {
  if (!plans || plans.length === 0) return null;

  // 1. Identify Free plan and filter Enterprise plans (with exception for HeyGen)
  const isEnterprisePlan = (plan: PricingPlan): boolean => {
    // For HeyGen, allow Enterprise in the table (it's a key decision point)
    if (toolName.toLowerCase().includes('heygen')) {
      return false; // Don't filter out Enterprise for HeyGen
    }
    
    const name = (plan.name || '').toLowerCase();
    const ctaText = (plan.ctaText || '').toLowerCase();
    
    // Check name contains enterprise/team/business/contact sales
    if (name.includes('enterprise') || name.includes('team') || name.includes('business') || name.includes('contact')) {
      return true;
    }
    
    // Check CTA text for contact sales
    if (ctaText.includes('contact') || ctaText.includes('sales')) {
      return true;
    }
    
    return false;
  };

  // Check if this is HeyGen (special handling for Enterprise)
  const isHeyGen = toolName.toLowerCase().includes('heygen');
  
  // Find Free plan (first match)
  const freePlan = plans.find(plan => {
    // For HeyGen, don't filter Enterprise when finding Free
    if (!isHeyGen && isEnterprisePlan(plan)) return false;
    const name = (plan.name || '').toLowerCase();
    if (name === 'free') return true;
    
    // Check price
    if (plan.price) {
      if (typeof plan.price === 'string' && plan.price.toLowerCase() === 'free') return true;
      if (typeof plan.price === 'object' && 'monthly' in plan.price) {
        const monthly = plan.price.monthly;
        if (typeof monthly === 'object' && monthly.amount === 0) return true;
        if (typeof monthly === 'string' && monthly.toLowerCase() === 'free') return true;
      }
    }
    return false;
  });

  // Get paid plans (exclude Free, and Enterprise only if not HeyGen)
  const paidPlansForTable = plans.filter(plan => {
    if (isFreePlan(plan)) return false;
    // For HeyGen, include Enterprise; for others, exclude it
    if (!isHeyGen && isEnterprisePlan(plan)) return false;
    return true;
  });
  
  // For HeyGen, find Enterprise plan separately
  const enterprisePlan = isHeyGen ? plans.find(plan => {
    const name = (plan.name || '').toLowerCase();
    return name === 'enterprise';
  }) : null;

  if (paidPlansForTable.length === 0 && !freePlan) return null;

  // 2. Sort plans: Most Popular first, then by price ascending
  const getMonthlyAmount = (plan: PricingPlan): number => {
    if (!plan.price || typeof plan.price !== 'object') return 999999;
    if ('monthly' in plan.price && typeof plan.price.monthly === 'object') {
      return plan.price.monthly.amount ?? 999999;
    }
    return 999999;
  };

  const isPopularPlan = (plan: PricingPlan): boolean => {
    const badge = (plan.badge || plan.ribbonText || '').toLowerCase();
    const name = plan.name.toLowerCase();
    return badge.includes('popular') || badge.includes('best value') || Boolean(plan.isPopular);
  };

  // Sort paid plans: Most Popular first, then by price ascending
  const sortedPaidPlans = [...paidPlansForTable].sort((a, b) => {
    const priceA = getMonthlyAmount(a);
    const priceB = getMonthlyAmount(b);
    
    const popA = isPopularPlan(a) ? 1 : 0;
    const popB = isPopularPlan(b) ? 1 : 0;

    // If one is popular and other is not, prioritize popular
    if (popA !== popB) return popB - popA;

    // Otherwise sort by price
    return priceA - priceB;
  });

  // 3. Build final columns: Free (if exists) + 2~3 paid plans (3-4 columns total)
  // Enterprise/Contact sales only if it has distinct differences
  const selectedPlans: PricingPlan[] = [];
  
  if (isHeyGen) {
    // HeyGen specific: Free + Creator + Business + Enterprise
    if (freePlan) {
      selectedPlans.push(freePlan);
    }
    // Add Creator (should be in sortedPaidPlans)
    const creatorPlan = sortedPaidPlans.find(p => p.name === 'Creator');
    if (creatorPlan) {
      selectedPlans.push(creatorPlan);
    }
    // Add Business
    const businessPlan = sortedPaidPlans.find(p => p.name === 'Business');
    if (businessPlan) {
      selectedPlans.push(businessPlan);
    }
    // Add Enterprise if exists
    if (enterprisePlan) {
      selectedPlans.push(enterprisePlan);
    }
  } else {
    // Other tools: Free (if exists) + 2~3 paid plans
    // Check if Enterprise has distinct differences before including
    const hasDistinctEnterprise = enterprisePlan && (() => {
      // Check if Enterprise has features that differ significantly from other paid plans
      const enterpriseText = [
        ...(enterprisePlan.highlights || []),
        ...(enterprisePlan.featureItems?.map(f => f.text) || []),
        ...(enterprisePlan.features || [])
      ].join(' ').toLowerCase();
      
      // Check for enterprise-specific features
      const hasEnterpriseFeatures = enterpriseText.includes('scim') || 
                                    enterpriseText.includes('saml') ||
                                    enterpriseText.includes('dedicated') ||
                                    enterpriseText.includes('priority support') ||
                                    enterpriseText.includes('custom pricing');
      
      // Check if Enterprise differs from highest paid plan
      if (sortedPaidPlans.length > 0) {
        const highestPaid = sortedPaidPlans[sortedPaidPlans.length - 1];
        const highestPaidText = [
          ...(highestPaid.highlights || []),
          ...(highestPaid.featureItems?.map(f => f.text) || []),
          ...(highestPaid.features || [])
        ].join(' ').toLowerCase();
        
        // Enterprise should have features not in highest paid plan
        return hasEnterpriseFeatures && (
          enterpriseText.includes('scim') && !highestPaidText.includes('scim') ||
          enterpriseText.includes('dedicated') && !highestPaidText.includes('dedicated')
        );
      }
      return hasEnterpriseFeatures;
    })();
    
    // Default: Free + 2-3 paid plans
    const maxPaidColumns = freePlan ? 3 : 4;
    let selectedPaidPlans = sortedPaidPlans.slice(0, maxPaidColumns);
    
    // Only add Enterprise if it has distinct differences and we have space
    if (hasDistinctEnterprise && selectedPaidPlans.length < maxPaidColumns) {
      // Remove last paid plan if needed to make room for Enterprise
      if (selectedPaidPlans.length >= maxPaidColumns) {
        selectedPaidPlans = selectedPaidPlans.slice(0, maxPaidColumns - 1);
      }
      selectedPaidPlans.push(enterprisePlan!);
    }
    
    if (freePlan) {
      selectedPlans.push(freePlan);
    }
    selectedPlans.push(...selectedPaidPlans);
  }

  if (selectedPlans.length === 0) return null;

  // 4. Extract comparable attributes dynamically
  const allAttributes = useMemo(() => {
    return extractComparableAttributes(selectedPlans, billing, toolData?.key_facts);
  }, [selectedPlans, billing, toolData?.key_facts]);

  // 5. Select attributes for display
  // For invideo and heygen: keep current behavior (8-12 rows)
  // For other tools: use more aggressive selection to ensure >= 8 rows
  const displayAttributes = useMemo(() => {
    const normalizedSlug = (toolSlug || toolName.toLowerCase()).toLowerCase();
    const isSpecialTool = normalizedSlug === 'invideo' || normalizedSlug === 'heygen';
    
    if (isSpecialTool) {
      // Keep existing behavior for invideo and heygen
      return selectAttributesForDisplay(allAttributes, 8, 12);
    } else {
      // For other tools: use more aggressive selection to ensure >= 8 rows
      return selectAttributesForDisplay(allAttributes, 8, 12, true); // Pass aggressive flag
    }
  }, [allAttributes, toolSlug, toolName]);

  // 6. Create plan ID map for lookup
  const planIdMap = new Map<PricingPlan, string>();
  selectedPlans.forEach((plan) => {
    planIdMap.set(plan, plan.name || `plan-${selectedPlans.indexOf(plan)}`);
  });

  // Helper to truncate cell value
  const truncateValue = (value: string, maxLength: number = 32): string => {
    if (!value || value === '—') return value;
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength - 3) + '...';
  };

  // Helper to format cell value (avoid showing too many "—")
  const formatCellValue = (attr: ComparableAttribute, plan: PricingPlan): string => {
    const planId = planIdMap.get(plan)!;
    const value = attr.valuesByPlanId[planId] || '';
    
    if (!value || value === '' || value === '—') {
      // Key decision dimensions: use "See plan details"
      const keyDimensions = ['price', 'watermark', 'export_quality', 'max_duration', 
                            'quota_videos', 'minutes', 'credits', 'languages', 
                            'videos_per_month', 'voices', 'scene_limits'];
      if (keyDimensions.includes(attr.key)) {
        return 'See plan details';
      }
      // Optional features: use "Not listed"
      return 'Not listed';
    }
    
    // Special handling for certain dimensions
    if (attr.key === 'watermark') {
      return value; // Already "Yes", "No", or "See plan details"
    }
    
    if (attr.key === 'included_paid') {
      // Only show for paid plans
      if (isFreePlan(plan)) return '—';
      return truncateValue(value);
    }
    
    return truncateValue(value);
  };

  return (
    <div id="plans-compared" className="w-full mb-16 scroll-mt-32">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plans compared</h2>
        <p className="text-gray-600">Compare key limits and what's included across plans.</p>
      </div>
      

      <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
        <div className="min-w-[720px] bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-4 w-1/5 font-bold text-gray-900 sticky left-0 bg-gray-50 z-10">Features</th>
                {selectedPlans.map((plan, idx) => {
                  const planId = planIdMap.get(plan)!;
                  const isFree = isFreePlan(plan);
                  const isPopular = isPopularPlan(plan);
                  
                  return (
                    <th key={idx} className="p-4 w-1/5 font-bold text-gray-900 align-top">
                      <div className="flex flex-col gap-1">
                        <span>{plan.name}</span>
                        {isFree && (
                          <PlanBadge variant="free" className="uppercase w-fit">
                            Free
                          </PlanBadge>
                        )}
                        {isPopular && !isFree && (
                          <PlanBadge variant="popular" className="uppercase w-fit">
                            Popular
                          </PlanBadge>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayAttributes.map((attr, idx) => {
                // Lightweight label variations (don't change meaning)
                const labelVariations: Record<string, string> = {
                  'Export quality': 'Output quality',
                  'Max duration': 'Video length',
                  'Videos per month': 'Monthly videos',
                };
                const displayLabel = labelVariations[attr.label] || attr.label;
                
                return (
                <tr key={attr.key} className="hover:bg-black/[0.02] transition-colors">
                  <td className="p-4 text-sm font-semibold text-gray-700 bg-white sticky left-0 z-10 border-r border-gray-100 md:border-r-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] md:shadow-none">
                    {displayLabel}
                  </td>
                  {selectedPlans.map((plan, idx) => {
                    const value = formatCellValue(attr, plan);
                    const isCheck = value === 'Yes' || value === 'true';
                    const isCross = value === 'No' || value === 'false';
                    
                    return (
                      <td key={idx} className="p-4 text-sm text-gray-600">
                        {attr.key === 'watermark' ? (
                          value === 'No' ? (
                            <span className="font-medium text-green-600">No</span>
                          ) : value === 'Yes' ? (
                            <span className="text-gray-500">Yes</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : attr.key === 'included_paid' && isFreePlan(plan) ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className={attr.key === 'price' ? 'font-bold text-black' : ''}>
                            {value}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

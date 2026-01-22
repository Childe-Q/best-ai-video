'use client';

import { useState, useMemo } from 'react';
import { PricingPlan, ComparisonTable } from '@/types/tool';
import PricingSnapshot from './PricingSnapshot';
import PricingUsageExplainer from './PricingUsageExplainer';
import BillingToggle from './BillingToggle';
import PricingCardsGrid from '@/components/PricingCardsGrid';
import PlansComparedTable from './PlansComparedTable';
import VerdictSection from './VerdictSection';
import DisclosureSection from '@/components/DisclosureSection';
import DisclosurePopover from '@/components/DisclosurePopover';
import CommonPaidFeatures from './CommonPaidFeatures';
import { getStartingPrice } from '@/lib/utils';
import { generatePricingSnapshot } from '@/lib/generatePricingSnapshot';
import { filterPaidPlans, isFreePlan } from '@/lib/pricing/filterPaidPlans';
import { deriveRecommendations } from '@/lib/pricing/deriveRecommendations';
import PricingCard from '@/components/PricingCard';
import CTAButton from '@/components/CTAButton';

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
  
  // Tool data for content derivation
  toolData?: {
    key_facts?: string[];
    highlights?: string[];
    best_for?: string;
  };
  
  // Pre-computed usage notes (from server) to avoid hydration mismatch
  usageNotes: {
    bullets: string[];
    tip: string;
  };
  
  // Pre-computed verdict text (from server) to avoid hydration mismatch
  verdictText?: string;
  
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
  toolData,
  usageNotes,
  verdictText: serverVerdictText,
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

  // Helper to filter repetitive usage text
  const isRepetitiveUsageText = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      (lower.includes('repeat') && lower.includes('edit') && (lower.includes('credit') || lower.includes('minute'))) ||
      (lower.includes('regenerat') && lower.includes('credit')) ||
      (lower.includes('finalize') && lower.includes('script')) ||
      (lower.includes('consum') && lower.includes('credit') && lower.includes('generat'))
    );
  };

  // Filter out Free plans for snapshot
  const paidPlans = filterPaidPlans(pricingPlans);
  
  // For InVideo: Ensure snapshot doesn't include Free and shows all 3 plans (Plus, Max, Generative)
  const isInVideo = toolSlug === 'invideo';
  
  // For InVideo: Filter and select specific plans (Plus, Max, Generative) in order
  let snapshotData;
  if (isInVideo && paidPlans.length > 0) {
    // For InVideo: Select Plus, Max, Generative specifically
    const planOrder = ['Plus', 'Max', 'Generative'];
    const selectedPlans = planOrder
      .map(planName => paidPlans.find(p => p.name === planName))
      .filter((plan): plan is PricingPlan => plan !== undefined);
    
    if (selectedPlans.length > 0) {
      // Generate snapshot with differentiated bullets
      snapshotData = {
        plans: generateDifferentiatedSnapshot(selectedPlans, billing),
        note: generateSnapshotNote(paidPlans) || undefined
      };
    } else {
      // Fallback: use generatePricingSnapshot
      snapshotData = generatePricingSnapshot(paidPlans, 3);
    }
  } else {
    // For other tools: use provided pricingSnapshot if available, otherwise generate
    snapshotData = pricingSnapshot 
      ? {
          ...pricingSnapshot,
          plans: pricingSnapshot.plans.filter(plan => {
            const name = (plan.name || '').toLowerCase();
            return !name.includes('free');
          })
        }
      : (paidPlans.length > 0 
          ? generatePricingSnapshot(paidPlans, 3)
          : { plans: [] });
  }
  
  // Generate differentiated snapshot bullets for InVideo plans
  function generateDifferentiatedSnapshot(plans: PricingPlan[], currentBilling: 'monthly' | 'yearly'): Array<{ name: string; bullets: string[] }> {
    // 1. Collect candidate bullets for each plan
    const planCandidates: Array<{ plan: PricingPlan; candidates: string[] }> = plans.map(plan => {
      const candidates: string[] = [];
      
      // Collect from plan fields (priority order)
      if (plan.highlights) {
        candidates.push(...plan.highlights);
      }
      if (plan.featureItems) {
        candidates.push(...plan.featureItems.map(f => f.text).filter(Boolean));
      }
      if (plan.features) {
        candidates.push(...plan.features);
      }
      if (plan.detailed_features) {
        candidates.push(...plan.detailed_features);
      }
      if (plan.description) {
        candidates.push(plan.description);
      }
      
      // Also extract from structured fields (for fallback)
      const structuredFields: string[] = [];
      
      // Extract credits/minutes
      const allText = candidates.join(' ').toLowerCase();
      const creditsMatch = allText.match(/(\d+)\s*(credits?|credit)/i);
      const minutesMatch = allText.match(/(\d+)\s*(minutes?|min)/i);
      if (creditsMatch) {
        structuredFields.push(`${creditsMatch[1]} credits per period`);
      } else if (minutesMatch) {
        structuredFields.push(`${minutesMatch[1]} minutes per period`);
      }
      
      // Extract duration
      const durationMatch = allText.match(/(\d+)\s*(min|minutes?|duration)/i);
      if (durationMatch) {
        structuredFields.push(`Up to ${durationMatch[1]} minutes`);
      }
      
      // Extract seats/users
      const seatsMatch = allText.match(/(\d+)\s*(seats?|users?|members?)/i);
      if (seatsMatch) {
        structuredFields.push(`${seatsMatch[1]} ${seatsMatch[2] || 'seats'}`);
      }
      
      // Add price as structured field
      const priceText = getPriceTextForPlan(plan, currentBilling);
      if (priceText) {
        structuredFields.push(priceText);
      }
      
      return {
        plan,
        candidates: [...candidates, ...structuredFields].filter(b => b && b.trim().length > 0)
      };
    });
    
    // 2. Normalize and count frequency
    const normalize = (text: string): string => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedToOriginal = new Map<string, Set<string>>();
    const frequency = new Map<string, number>();
    
    planCandidates.forEach(({ candidates }) => {
      candidates.forEach(candidate => {
        const norm = normalize(candidate);
        if (!normalizedToOriginal.has(norm)) {
          normalizedToOriginal.set(norm, new Set());
        }
        normalizedToOriginal.get(norm)!.add(candidate);
        frequency.set(norm, (frequency.get(norm) || 0) + 1);
      });
    });
    
    // 3. Select differentiated bullets for each plan
    const result: Array<{ name: string; bullets: string[] }> = [];
    
    planCandidates.forEach(({ plan, candidates }) => {
      const selected: string[] = [];
      
      // Priority 1: Select unique bullets (freq === 1)
      const uniqueCandidates = candidates.filter(c => {
        const norm = normalize(c);
        return frequency.get(norm) === 1;
      });
      
      // Filter out overly generic bullets
      const filteredUnique = uniqueCandidates.filter(c => {
        const lower = c.toLowerCase();
        // Skip if it's too generic (unless we have no other options)
        if (lower.includes('no watermark') && uniqueCandidates.length > 1) return false;
        if (lower.includes('commercial use allowed') && uniqueCandidates.length > 1) return false;
        return true;
      });
      
      selected.push(...filteredUnique.slice(0, 2));
      
      // Priority 2: If not enough unique bullets, select most informative
      if (selected.length < 2) {
        const remaining = candidates.filter(c => {
          const norm = normalize(c);
          return !selected.some(s => normalize(s) === norm);
        });
        
        // Filter out generic ones
        const informative = remaining.filter(c => {
          const lower = c.toLowerCase();
          const norm = normalize(c);
          // Skip if it appears in all plans
          if (frequency.get(norm) === plans.length && selected.length > 0) return false;
          // Prefer longer, more specific bullets
          return c.length >= 10 && c.length <= 70;
        });
        
        selected.push(...informative.slice(0, 2 - selected.length));
      }
      
      // Priority 3: Fallback - use price if still not enough
      if (selected.length === 0) {
        const priceText = getPriceTextForPlan(plan, currentBilling);
        if (priceText) {
          selected.push(priceText);
        }
      }
      
      // Truncate long bullets
      const truncated = selected.map(b => {
        if (b.length > 70) {
          return b.substring(0, 67) + '...';
        }
        return b;
      }).slice(0, 3); // Max 3 bullets, default 2
      
      // Ensure at least 2 bullets (or 1 if that's all we have)
      const finalBullets = truncated.length >= 2 ? truncated : (truncated.length > 0 ? truncated : ['Plan details']);
      
      result.push({
        name: plan.name || 'Unknown',
        bullets: finalBullets
      });
    });
    
    // 4. Final validation: Ensure bullets are not identical across plans
    const allBullets = result.map(r => r.bullets.join('|'));
    const isAllSame = allBullets.length > 1 && allBullets.every(b => b === allBullets[0]);
    
    if (isAllSame) {
      // Force differentiation by adding price/plan name to first bullet
      result.forEach((item, idx) => {
        const plan = plans[idx];
        const priceText = getPriceTextForPlan(plan, currentBilling);
        
        // Try to find a unique feature for this plan
        const planText = [
          ...(plan.highlights || []),
          ...(plan.featureItems?.map(f => f.text) || []),
          ...(plan.features || [])
        ].join(' ').toLowerCase();
        
        // Look for plan-specific keywords
        let uniqueFeature: string | null = null;
        if (plan.name.toLowerCase().includes('generative')) {
          const genMatch = planText.match(/(generative|ai\s*model|custom\s*avatar)/i);
          if (genMatch) uniqueFeature = genMatch[1];
        } else if (plan.name.toLowerCase().includes('max')) {
          const maxMatch = planText.match(/(unlimited|higher|more|advanced)/i);
          if (maxMatch) uniqueFeature = maxMatch[1];
        } else if (plan.name.toLowerCase().includes('plus')) {
          const plusMatch = planText.match(/(standard|basic|starter)/i);
          if (plusMatch) uniqueFeature = plusMatch[1];
        }
        
        if (priceText && item.bullets.length > 0) {
          // Replace first bullet with plan name + price
          item.bullets[0] = `${plan.name}: ${priceText}`;
        } else if (priceText) {
          item.bullets.unshift(priceText);
        } else if (uniqueFeature && item.bullets.length > 0) {
          item.bullets[0] = `${plan.name}: ${uniqueFeature}`;
        }
      });
    }
    
    return result;
  }
  
  // Helper to get price text for a plan
  function getPriceTextForPlan(plan: PricingPlan, currentBilling: 'monthly' | 'yearly'): string | null {
    if (!plan.price || typeof plan.price !== 'object') return null;
    
    if ('monthly' in plan.price && typeof plan.price.monthly === 'object' && 'amount' in plan.price.monthly) {
      const amount = (plan.price.monthly as any).amount;
      if (amount === 0) return 'Free';
      
      if (currentBilling === 'yearly' && 'yearly' in plan.price && typeof plan.price.yearly === 'object') {
        const yearlyAmount = (plan.price.yearly as any).amount;
        if (yearlyAmount !== undefined && yearlyAmount !== null) {
          return `$${yearlyAmount}/mo (billed yearly)`;
        }
      }
      
      return `$${amount}/mo`;
    }
    
    return null;
  }
  
  // Helper to extract plan bullets (simplified version for InVideo) - kept for fallback
  function extractPlanBulletsForSnapshot(plan: PricingPlan): string[] {
    const bullets: string[] = [];
    const featureTexts: string[] = [];
    
    if (plan.featureItems) {
      plan.featureItems.forEach(item => {
        if (item.text) featureTexts.push(item.text.toLowerCase());
      });
    }
    if (plan.features) {
      plan.features.forEach(f => featureTexts.push(f.toLowerCase()));
    }
    if (plan.highlights) {
      plan.highlights.forEach(h => featureTexts.push(h.toLowerCase()));
    }
    
    const allText = featureTexts.join(' ');
    
    // Watermark
    if (allText.includes('remove watermark') || allText.includes('watermark removal') || allText.includes('no watermark')) {
      bullets.push("Watermark removal");
    } else if (!allText.includes('watermark')) {
      bullets.push("No watermarks");
    }
    
    // Export quality
    const resolutionMatch = allText.match(/(\d+p|720p|1080p|4k|ultra hd)/i);
    if (resolutionMatch) {
      const res = resolutionMatch[1].toUpperCase();
      bullets.push(`${res} export quality`);
    }
    
    // Credits/minutes
    const creditsMatch = allText.match(/(\d+)\s*(credits?|credit)/i);
    const minutesMatch = allText.match(/(\d+)\s*(minutes?|min)/i);
    if (creditsMatch) {
      bullets.push(`${creditsMatch[1]} credits per period`);
    } else if (minutesMatch) {
      bullets.push(`${minutesMatch[1]} minutes per period`);
    }
    
    // Commercial rights
    if (allText.includes('commercial') || allText.includes('commercial use') || allText.includes('commercial license')) {
      bullets.push("Commercial use allowed");
    }
    
    return bullets.slice(0, 4);
  }
  
  function generateSnapshotNote(plans: PricingPlan[]): string | null {
    const allText = plans
      .map(p => [
        ...(p.featureItems || []).map(i => i.text),
        ...(p.features || [])
      ].join(' '))
      .join(' ')
      .toLowerCase();

    if (allText.includes('credit') || allText.includes('minute')) {
      if (allText.includes('edit') || allText.includes('regenerate') || allText.includes('revision')) {
        return "Repeated edits may consume additional credits/minutes. Consider finalizing your script before generating.";
      }
      return "Usage limits apply. Check your plan details for exact credit/minute allocations.";
    }
    return null;
  }
  
  // Filter repetitive text from snapshot bullets
  const snapshotPlans = snapshotData.plans.map(plan => ({
    ...plan,
    bullets: plan.bullets.filter(b => !isRepetitiveUsageText(b))
  }));
  
  const snapshotNote = snapshotData.note;
  
  // For InVideo: Ensure recommendations match snapshotPlans order and plans
  const recommendations = useMemo(() => {
    if (isInVideo && snapshotPlans.length > 0) {
      // Match recommendations to snapshotPlans order
      const recs = snapshotPlans.map(snapshotPlan => {
        const plan = paidPlans.find(p => 
          p.name.toLowerCase() === snapshotPlan.name.toLowerCase()
        );
        if (!plan) return null;
        
        const reason = extractRecommendationReason(plan, toolData?.key_facts);
        if (!reason) return null;
        
        return {
          planName: plan.name,
          reason,
          planSlug: `plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`
        };
      }).filter((rec): rec is NonNullable<typeof rec> => rec !== null);
      
      return recs;
    }
    return deriveRecommendations(paidPlans, toolData?.key_facts);
  }, [isInVideo, snapshotPlans, paidPlans, toolData?.key_facts]);
  
  // Helper function for extracting recommendation reason (same as deriveRecommendations)
  function extractRecommendationReason(plan: PricingPlan, keyFacts?: string[]): string | null {
    if (plan.description && plan.description.length <= 18) {
      return plan.description;
    }
    
    const allFeatures = [
      ...(plan.highlights || []),
      ...(plan.featureItems?.map(f => f.text) || []),
      ...(plan.features || [])
    ];
    
    const priorityKeywords = ['watermark', '4k', 'seats', 'commercial', 'minutes', 'credits', 'export', 'team', 'collaboration'];
    
    for (const keyword of priorityKeywords) {
      const matchingFeature = allFeatures.find(f => 
        f.toLowerCase().includes(keyword)
      );
      if (matchingFeature) {
        let reason = matchingFeature.trim();
        if (reason.length > 18) {
          reason = reason.substring(0, 15) + '...';
        }
        return reason;
      }
    }
    
    if (allFeatures.length > 0) {
      let reason = allFeatures[0].trim();
      if (reason.length > 18) {
        reason = reason.substring(0, 15) + '...';
      }
      return reason;
    }
    
    if (keyFacts) {
      const pricingKeywords = ['watermark', 'credit', 'minute', 'rights', 'export', 'commercial'];
      for (const fact of keyFacts) {
        const lower = fact.toLowerCase();
        if (pricingKeywords.some(k => lower.includes(k))) {
          let reason = fact.trim();
          if (reason.length > 18) {
            const idx = lower.indexOf(pricingKeywords.find(k => lower.includes(k)) || '');
            if (idx >= 0) {
              const start = Math.max(0, idx - 5);
              const end = Math.min(reason.length, idx + 20);
              reason = reason.substring(start, end).trim();
              if (reason.length <= 18) return reason;
            }
            reason = reason.substring(0, 15) + '...';
          }
          return reason;
        }
      }
    }
    
    return null;
  }

  // For InVideo: Identify and extract common paid features
  // Note: isInVideo is already defined above (line 129)
  
  // Known common features for InVideo (all paid plans have these)
  const commonPaidFeatures = isInVideo ? [
    { text: "Image generations", badge: "365 UNLIMITED" },
    { text: "Nano Banana Pro", badge: "365 UNLIMITED" }
  ] : null;
  
  // Filter common features from plans (for InVideo only)
  const filteredPricingPlans = useMemo(() => {
    if (!isInVideo || !commonPaidFeatures) return pricingPlans;
    
    const commonTexts = new Set(commonPaidFeatures.map(f => f.text.toLowerCase()));
    
    return pricingPlans.map(plan => {
      if (!plan.featureItems) return plan;
      
      // Filter out common features
      const filtered = plan.featureItems.filter(item => {
        const itemText = item.text.toLowerCase();
        // Check if this item matches any common feature
        return !commonTexts.has(itemText) && 
               !itemText.includes('image generation') &&
               !itemText.includes('nano banana');
      });
      
      return {
        ...plan,
        featureItems: filtered
      };
    });
  }, [isInVideo, pricingPlans, commonPaidFeatures]);

  // Separate free plans and paid plans for layout
  const { freePlans, paidPlansForGrid } = useMemo(() => {
    const free: PricingPlan[] = [];
    const paid: PricingPlan[] = [];
    
    filteredPricingPlans.forEach(plan => {
      if (isFreePlan(plan)) {
        free.push(plan);
      } else {
        paid.push(plan);
      }
    });
    
    return {
      freePlans: free,
      paidPlansForGrid: paid
    };
  }, [filteredPricingPlans]);

  // Check if we should use special layout (ONLY for InVideo: Free exists + >=3 paid plans)
  const shouldUseSeparateFreeLayout = isInVideo && freePlans.length > 0 && paidPlansForGrid.length >= 3;

  // Verdict data - use pre-computed text from server to avoid hydration mismatch
  const verdictTitle = verdict?.title?.replace('{price}', startingPrice) || `Is ${toolName} worth ${startingPrice}?`;
  // Use server-computed verdict text (deterministic, no hydration issues)
  const verdictText = serverVerdictText || verdict?.text || `If you need to produce videos regularly and want to avoid manual asset sourcing, the time savings can justify the cost. The Free plan works for testing, but watermarks and limits make it unsuitable for publishing. Start with monthly billing to test your actual usage before committing to annual plans.`;

  return (
    <section id="pricing" className="w-full bg-slate-50 py-16 scroll-mt-32">
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
                      className="text-blue-600 hover:text-blue-800 hover:opacity-80 transition-colors"
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
              recommendations={recommendations}
            />
          )}

          {/* 2a. How usage works (Consolidated) */}
          <PricingUsageExplainer 
            usageNotes={usageNotes}
            toolName={toolName}
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
          <div className="mb-16">
            {pricingPlans.length > 0 ? (
              <>
                {/* Paid Plans Grid */}
                {shouldUseSeparateFreeLayout ? (
                  <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {paidPlansForGrid.map((plan, index) => {
                        // Determine if plan is popular (matching PricingCardsGrid logic)
                        const badgeText = (plan as any).ribbonText || plan.badge || '';
                        const isPopular = badgeText.toLowerCase().includes('popular') || 
                                         badgeText.toLowerCase().includes('best value') || 
                                         plan.isPopular ||
                                         index === 1; // Fallback: second plan is popular
                        return (
                          <PricingCard
                            key={plan.name || index}
                            plan={plan}
                            isAnnual={billing === 'yearly'}
                            affiliateLink={affiliateLink}
                            hasFreeTrial={hasFreeTrial}
                            toolSlug={toolSlug}
                            isPopular={isPopular}
                            previousPlanName={index > 0 ? paidPlansForGrid[index - 1]?.name : undefined}
                            comparisonTable={comparisonTable}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <PricingCardsGrid 
                    plans={filteredPricingPlans} 
                    affiliateLink={affiliateLink}
                    hasFreeTrial={hasFreeTrial}
                    toolSlug={toolSlug}
                    comparisonTable={comparisonTable}
                    externalBilling={billing}
                  />
                )}

                {/* Free Plan Section (row banner) */}
                {shouldUseSeparateFreeLayout && freePlans.length > 0 && (
                  <div className="mt-8 mb-8">
                    {freePlans.slice(0, 1).map((plan, index) => {
                      // Extract key limitations from featureItems, deduplicate and prioritize
                      const allItems = (plan.featureItems || plan.features || [])
                        .map(item => typeof item === 'string' ? item : item.text)
                        .filter(Boolean);
                      
                      // Deduplicate: prefer longer/more specific items
                      const uniqueItems: string[] = [];
                      const seen = new Set<string>();
                      
                      // Sort by length (longer first) to prefer specific items
                      const sortedItems = [...allItems].sort((a, b) => b.length - a.length);
                      
                      for (const item of sortedItems) {
                        const normalized = item.toLowerCase().trim();
                        // Skip if we've seen a similar item (contains check)
                        let isDuplicate = false;
                        for (const seenItem of seen) {
                          if (normalized.includes(seenItem) || seenItem.includes(normalized)) {
                            isDuplicate = true;
                            break;
                          }
                        }
                        if (!isDuplicate && uniqueItems.length < 6) {
                          uniqueItems.push(item);
                          seen.add(normalized);
                        }
                      }
                      
                      // Get CTA text from plan or use default
                      const ctaText = plan.ctaText || 'Get Started';
                      
                      return (
                        <div
                          key={plan.name || index}
                          className="w-full bg-white rounded-xl border-2 border-gray-200 p-6"
                        >
                          {/* Top row: Title + Description on left, Button on right */}
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">Free plan (limited)</h3>
                              <p className="text-sm text-gray-600">Try the workflow with strict limits before upgrading.</p>
                            </div>
                            <div className="flex-shrink-0">
                              <CTAButton
                                affiliateLink={affiliateLink}
                                hasFreeTrial={hasFreeTrial}
                                text={ctaText}
                                size="md"
                                className="w-full md:w-auto"
                              />
                            </div>
                          </div>
                          
                          {/* Bottom: Compact list of key limitations */}
                          {uniqueItems.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {uniqueItems.map((limitation, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400 mt-0.5">•</span>
                                    <span>{limitation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center mb-12">
                <p className="text-gray-500">Pricing information coming soon.</p>
              </div>
            )}
          </div>

          {/* 4a. Common Paid Features (InVideo only) */}
          {isInVideo && commonPaidFeatures && commonPaidFeatures.length > 0 && (
            <CommonPaidFeatures features={commonPaidFeatures} />
          )}

          {/* 5. Plans Compared Table (New) */}
          {pricingPlans.length > 0 && (
            <PlansComparedTable 
              plans={pricingPlans} 
              toolName={toolName}
              toolSlug={toolSlug}
              toolData={toolData}
              snapshotPlans={snapshotPlans}
              billing={billing}
            />
          )}

          {/* Elegant Spacing */}
          {pricingPlans.length > 0 && (
            <div className="mt-16"></div>
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

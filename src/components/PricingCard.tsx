'use client';

import { useState, useEffect } from 'react';
import { PricingPlan, ComparisonTable } from '@/types/tool';

// Theme configuration
type Theme = {
  buttonBg: string;
  buttonHover: string;
  border: string;
  shadow: string;
  priceHighlight: string;
  ribbonBg: string;
  focusRing: string;
  iconColor: string;
};

const THEMES: Record<string, Theme> = {
  fliki: {
    buttonBg: 'bg-pink-600',
    buttonHover: 'hover:bg-pink-700',
    border: 'border-pink-500',
    shadow: 'shadow-pink-600/10',
    priceHighlight: 'text-pink-600',
    ribbonBg: 'bg-pink-600',
    focusRing: 'focus:ring-pink-200',
    iconColor: 'text-pink-600',
  },
  invideo: {
    buttonBg: 'bg-indigo-600',
    buttonHover: 'hover:bg-indigo-700',
    border: 'border-indigo-500',
    shadow: 'shadow-indigo-600/10',
    priceHighlight: 'text-indigo-600',
    ribbonBg: 'bg-indigo-600',
    focusRing: 'focus:ring-indigo-200',
    iconColor: 'text-indigo-600',
  },
};

// Default theme (indigo)
const DEFAULT_THEME: Theme = THEMES.invideo;

// Diagonal Ribbon Component - Top right corner
function DiagonalRibbon({ text, theme }: { text: string; theme: Theme }) {
  return (
    <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none z-30">
      <div className={[
        'absolute top-6 -right-10 w-44 rotate-45 text-center',
        theme.ribbonBg,
        'text-white text-xs font-semibold px-3 py-1 rounded-sm shadow-md whitespace-nowrap'
      ].join(' ')}>
        {text}
      </div>
    </div>
  );
}

interface PricingCardProps {
  plan: PricingPlan & {
    // Backward-compatible optional fields (may not exist in current type)
    tagline?: string;
    unitPriceNote?: string;
    ribbonText?: string;
    addonLabel?: string;
    addons?: Array<{ id: string; label: string } | { text: string; badge?: string }>;
    featureItems?: { icon?: string; text: string; badge?: string }[];
    ctaText?: string;
    ctaHref?: string;
    billingNote?: string;
    price?: any;
    period?: string;
  };
  isPopular?: boolean;
  affiliateLink: string;
  billing?: 'monthly' | 'yearly';
  hasFreeTrial: boolean;
  previousPlanName?: string;
  toolSlug?: string;
  comparisonTable?: ComparisonTable;
}

type Billing = 'monthly' | 'yearly';

function formatMoney(price: any, billing: Billing): { amount: string; period: string } {
  // Supports:
  // 1) string: "$35" or "Free" or "Custom"
  // 2) object: { monthly: "$35", yearly: "$300" }
  // 3) object: { monthly: {amount:35,currency:"USD",period:"month"}, yearly: {...} }
  // 4) object: { amount: 35, currency: "USD", period: "month" }
  if (!price) return { amount: '', period: '' };

  // plain string
  if (typeof price === 'string') {
    return { amount: price, period: '' };
  }

  // monthly/yearly container
  if (typeof price === 'object' && (price.monthly != null || price.yearly != null)) {
    const picked = price[billing] ?? price.monthly ?? price.yearly;

    if (typeof picked === 'string') {
      return { amount: picked, period: '' };
    }

    if (typeof picked === 'object' && picked?.amount != null) {
      const currency =
        picked.currency === 'USD' ? '$' : picked.currency === 'EUR' ? '€' : picked.currency === 'GBP' ? '£' : '$';
      const amt = `${currency}${picked.amount}`;
      const per = picked.period === 'month' ? '/month' : picked.period === 'year' ? '/year' : '';
      return { amount: amt, period: per };
    }

    // fallback if picked is weird
    return { amount: String(picked ?? ''), period: '' };
  }

  // { amount, currency, period }
  if (typeof price === 'object' && price.amount != null) {
    const currency = price.currency === 'USD' ? '$' : price.currency === 'EUR' ? '€' : price.currency === 'GBP' ? '£' : '$';
    const amt = `${currency}${price.amount}`;
    const per = price.period === 'month' ? '/month' : price.period === 'year' ? '/year' : '';
    return { amount: amt, period: per };
  }

  return { amount: '', period: '' };
}

function normalizeText(s: string) {
  return (s || '').trim();
}

// Helper function to slugify plan name for matching
function slugifyPlanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Extract features from comparison_table for a specific plan
function extractFeaturesFromComparisonTable(
  comparisonTable: ComparisonTable | undefined,
  planName: string,
  planId?: string
): Array<{ icon?: string; text: string; badge?: string }> {
  if (!comparisonTable) return [];

  // Determine plan key: prefer id, then slugified name
  const planKey = planId 
    ? planId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : slugifyPlanName(planName);
  
  // Also try exact name match (case-insensitive)
  const planNameLower = planName.toLowerCase();
  
  const features: string[] = [];
  const seen = new Set<string>();

  // Get all rows (from feature_groups or flat rows)
  const allRows: Array<{ feature: string; label?: string; values_by_plan?: Record<string, string | boolean | number> }> = [];
  
  if (comparisonTable.feature_groups) {
    comparisonTable.feature_groups.forEach(group => {
      if (group.rows) {
        allRows.push(...group.rows);
      }
    });
  } else if (comparisonTable.rows) {
    allRows.push(...comparisonTable.rows);
  }

  // Extract features from rows
  for (const row of allRows) {
    const featureLabel = row.label || row.feature;
    if (!featureLabel) continue;

    const valuesByPlan = row.values_by_plan;
    if (!valuesByPlan) continue;

    // Try to find value for this plan
    let planValue: string | boolean | number | undefined;
    
    // Try multiple key variations
    const keysToTry = [
      planKey,
      planNameLower,
      planName,
      planId?.toLowerCase(),
    ].filter(Boolean) as string[];

    for (const key of keysToTry) {
      if (key in valuesByPlan) {
        planValue = valuesByPlan[key];
        break;
      }
    }

    // If not found, try case-insensitive match
    if (planValue === undefined) {
      const matchingKey = Object.keys(valuesByPlan).find(
        k => k.toLowerCase() === planKey || k.toLowerCase() === planNameLower
      );
      if (matchingKey) {
        planValue = valuesByPlan[matchingKey];
      }
    }

    // Skip if value is invalid
    if (planValue === undefined || planValue === null) continue;
    
    // Handle boolean true
    if (planValue === true) {
      const featureText = featureLabel;
      if (!seen.has(featureText)) {
        features.push(featureText);
        seen.add(featureText);
      }
    }
    // Handle string/number values
    else if (typeof planValue === 'string' || typeof planValue === 'number') {
      const valueStr = String(planValue).trim();
      // Skip empty values and common "no" indicators
      if (
        valueStr &&
        valueStr !== '-' &&
        valueStr !== '—' &&
        valueStr.toLowerCase() !== 'no' &&
        valueStr.toLowerCase() !== 'false' &&
        valueStr.toLowerCase() !== 'n/a'
      ) {
        const featureText = valueStr === 'true' || valueStr === 'yes'
          ? featureLabel
          : `${featureLabel}: ${valueStr}`;
        
        if (!seen.has(featureText)) {
          features.push(featureText);
          seen.add(featureText);
        }
      }
    }

    // Stop at 6 features
    if (features.length >= 6) break;
  }

  return features.map(text => ({ text }));
}

export default function PricingCard({
  plan,
  isPopular = false,
  affiliateLink,
  billing = 'monthly',
  hasFreeTrial,
  previousPlanName,
  toolSlug,
  comparisonTable,
}: PricingCardProps) {
  // Get theme based on toolSlug
  const theme: Theme = toolSlug && toolSlug in THEMES 
    ? THEMES[toolSlug]
    : DEFAULT_THEME;
  // Link cloaking for veed/cello
  const needsCloaking = affiliateLink.includes('cello.so') || affiliateLink.includes('veed.io');
  const finalHref = needsCloaking ? `/api/visit?url=${encodeURIComponent(affiliateLink)}` : affiliateLink;

  // Extract plan fields first
  const tagline = normalizeText((plan as any).tagline) || normalizeText((plan as any).description) || '';
  const unitPriceNote = normalizeText((plan as any).unitPriceNote);
  const ctaTextRaw = (plan as any).ctaText || (plan as any).btn_text || '';
  const ctaText = normalizeText(ctaTextRaw);
  const billingNote = normalizeText((plan as any).billingNote) || '*Billed monthly until cancelled';
  
  // Check if Custom pricing (must check before extracting price)
  const planId = String((plan as any).id || '').toLowerCase();
  const planName = String(plan.name || '').toLowerCase();
  const unitPriceNoteStr = String((plan as any).unitPriceNote || '').toLowerCase();
  
  // Robust Custom pricing check
  const isCustomPricing =
    planId === 'enterprise' ||
    planName.includes('enterprise') ||
    unitPriceNoteStr.includes('custom pricing') ||
    ctaText.toLowerCase().includes('contact sales') ||
    ctaText.toLowerCase().includes('contact us');

  // Extract price information (only if NOT custom pricing)
  const price = (plan as any).price;
  
  let priceAmount: string = '';
  let pricePeriod: string = '';
  let monthlyAmount: number | null = null;
  let yearlyAmount: number | null = null;
  let showPriceComparison = false;
  let currentPeriod: string = ''; // Dynamic period from price data

  // Only extract price if NOT custom pricing
  if (!isCustomPricing) {
    // Handle new price format: { monthly: {...}, yearly?: {...} }
    if (price && typeof price === 'object' && 'monthly' in price) {
      const monthly = price.monthly;
      const yearly = price.yearly;

      if (typeof monthly === 'object' && monthly !== null) {
        monthlyAmount = monthly.amount ?? null;
        const currency = monthly.currency === 'USD' ? '$' : monthly.currency || '$';
        
        // Determine period from current billing selection
        if (billing === 'yearly' && yearly && typeof yearly === 'object' && yearly !== null) {
          yearlyAmount = yearly.amount ?? null;
          // Use yearly period if available, otherwise fallback to monthly period
          currentPeriod = yearly.period || monthly.period || 'month';
          
          // Show comparison if yearly exists and differs from monthly (but NOT for custom pricing)
          if (!isCustomPricing && yearlyAmount !== null && monthlyAmount !== null && yearlyAmount !== monthlyAmount) {
            showPriceComparison = true;
            priceAmount = `${currency}${yearlyAmount}`;
          } else {
            priceAmount = `${currency}${yearlyAmount ?? monthlyAmount ?? 0}`;
          }
        } else {
          // Monthly billing: use monthly period
          currentPeriod = monthly.period || 'month';
          priceAmount = monthlyAmount !== null ? `${currency}${monthlyAmount}` : 'Free';
        }
        
        // Format period display
        pricePeriod = currentPeriod === 'month' ? '/month' : currentPeriod === 'year' ? '/year' : '';
      } else if (typeof monthly === 'string') {
        // Fallback: old string format
        const { amount, period } = formatMoney(price, billing);
        priceAmount = normalizeText(amount);
        pricePeriod = normalizeText(period || (plan as any).period || '');
        currentPeriod = period || 'month';
      }
    } else {
      // Old format: use formatMoney helper
      const { amount, period } = formatMoney(price, billing);
      priceAmount = normalizeText(amount);
      pricePeriod = normalizeText(period || (plan as any).period || '');
      currentPeriod = period || (billing === 'yearly' ? 'year' : 'month');
    }

    // Fallback period if not set
    if (!pricePeriod && !isCustomPricing) {
      pricePeriod = currentPeriod === 'year' ? '/year' : '/month';
    }
  }
  
  const lower = priceAmount.toLowerCase();
  const isFree = (!isCustomPricing && (lower === 'free' || lower === '$0' || lower === '0'));

  const addonLabel = normalizeText((plan as any).addonLabel) || ((plan as any).addons?.length ? 'Add-ons' : '');
  const addons: { id: string; label: string }[] = (plan as any).addons || [];

  // State for feature expansion
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);

  // Priority order: featureItems > highlights > included_summary > features/detailed_features
  const featureItems: { icon?: string; text: string; badge?: string }[] = (plan as any).featureItems || [];
  const highlights: string[] = (plan as any).highlights || [];
  const includedSummary: string[] = (plan as any).included_summary || [];
  
  // Backward-compatible feature fallback
  const legacyAllFeatures: string[] = (plan as any).features || (plan as any).detailed_features || [];

  // Determine which feature source to use
  let displayFeatures: Array<{ icon?: string; text: string; badge?: string }> = [];
  let isUsingComparisonTable = false;
  
  if (featureItems.length > 0) {
    // Use featureItems if available
    displayFeatures = featureItems;
  } else if (highlights.length > 0) {
    // Convert highlights to featureItems format
    displayFeatures = highlights.map(text => ({ text }));
  } else if (includedSummary.length > 0) {
    // Use included_summary
    displayFeatures = includedSummary.map(text => ({ text }));
  } else if (legacyAllFeatures.length > 0) {
    // Fallback to legacy features
    displayFeatures = legacyAllFeatures.map(text => ({ text }));
  } else if (comparisonTable) {
    // Last resort: extract from comparison_table
    displayFeatures = extractFeaturesFromComparisonTable(
      comparisonTable,
      plan.name,
      (plan as any).id
    );
    isUsingComparisonTable = displayFeatures.length > 0;
  }

  const hasAnyFeatures = displayFeatures.length > 0;
  const maxVisibleFeatures = 8;
  const visibleFeatures = isFeaturesExpanded 
    ? displayFeatures 
    : displayFeatures.slice(0, maxVisibleFeatures);
  const remainingCount = displayFeatures.length - maxVisibleFeatures;
  const isEmptyEnterprise = isCustomPricing && !hasAnyFeatures;

  // Unified ribbon field: ribbonText ?? badge ?? ribbon
  const ribbon = normalizeText((plan as any).ribbonText) || 
                 normalizeText((plan as any).badge) || 
                 normalizeText((plan as any).ribbon) || 
                 null;
  const hasRibbon = !!ribbon;

  // Check if this plan should have bigger price (Standard/Premium only)
  const planIdLower = String((plan as any).id || '').toLowerCase();
  const planNameLower = String(plan.name || '').toLowerCase();
  const isBigPrice = planIdLower === 'standard' || planIdLower === 'premium' || 
                     planNameLower === 'standard' || planNameLower === 'premium';

  // Determine CTA text
  const finalCtaText = ctaText || (isCustomPricing ? 'Contact Sales' : isFree ? 'Get Free' : `Get ${plan.name}`);

  // Price animation state
  const [priceKey, setPriceKey] = useState(0);
  
  useEffect(() => {
    // Trigger animation when billing changes
    setPriceKey(prev => prev + 1);
  }, [billing]);

  return (
    <div
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-5 md:p-7 shadow-sm',
        // Hover effects
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-900/10',
        'active:scale-[0.99]',
        // Recommended card styling
        hasRibbon 
          ? `${theme.border} border-2 shadow-lg ${theme.shadow} ring-2 ${theme.focusRing.replace('focus:', '')} animate-breathing-subtle`
          : 'border-slate-200',
        // Reduced motion support
        'motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:animate-none',
      ].join(' ')}
    >
      {/* Diagonal Ribbon - Top right corner */}
      {hasRibbon && ribbon && (
        <DiagonalRibbon text={ribbon} theme={theme} />
      )}

      {/* Header */}
      <div>
        <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{plan.name}</h3>
        {tagline ? <p className="mt-0.5 text-xs text-slate-500">{tagline}</p> : null}

        {/* Price Block Container - Compact layout */}
        <div className="mt-2 flex flex-col">
          {/* Price */}
          <div>
            {isCustomPricing ? (
              (() => {
                const customLabelRaw = normalizeText((plan as any).unitPriceNote) || normalizeText((plan as any).priceLabel) || 'Custom pricing';
                const customBillingRaw = normalizeText((plan as any).billingNote) || normalizeText((plan as any).billing) || 'billed yearly';

                // Remove leading asterisk from notes like "*Billed yearly"
                const customBilling = customBillingRaw.replace(/^\*/, '').trim();

                return (
                  <div className="flex flex-col items-start leading-none gap-1">
                    <div className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                      {customLabelRaw}
                    </div>
                    {customBilling ? (
                      <div className="text-xs text-slate-500 leading-none">
                        {customBilling}
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ) : (
              // Regular pricing: monthly/yearly number prices with animation
              <div className="flex flex-col items-start leading-none gap-1">
                <div 
                  key={priceKey}
                  className="price-transition-wrapper"
                >
                  {showPriceComparison && monthlyAmount !== null && yearlyAmount !== null ? (
                    // Show comparison: strikethrough monthly + bold yearly
                    <div className="flex items-baseline gap-1.5 leading-none">
                      <span className={`${isBigPrice ? 'text-lg' : 'text-base'} font-bold text-gray-400 line-through leading-none`}>
                        ${monthlyAmount}
                      </span>
                      <span className={`${isBigPrice ? 'text-3xl md:text-4xl' : 'text-2xl'} font-extrabold tracking-tight ${theme.priceHighlight} leading-none`}>
                        {priceAmount}
                      </span>
                    </div>
                  ) : (
                    // Regular price display
                    <div className="flex items-end gap-1 leading-none">
                      <div className={`${isBigPrice ? 'text-3xl md:text-4xl' : 'text-2xl'} font-extrabold tracking-tight text-slate-900 leading-none`}>{priceAmount}</div>
                      {!isFree && pricePeriod && (
                        <div className="pb-0.5 text-sm font-semibold text-slate-500 leading-none">{pricePeriod}</div>
                      )}
                    </div>
                  )}
                </div>
                {!isCustomPricing && showPriceComparison && (
                  // Dynamic period display based on currentPeriod, not hardcoded "per month"
                  <div className="text-xs text-slate-500 leading-none">
                    {currentPeriod === 'year' ? 'per year' : 'per month'}
                  </div>
                )}
              </div>
            )}
            {!isCustomPricing && unitPriceNote ? <div className="mt-0.5 text-xs text-slate-600 leading-none">{unitPriceNote}</div> : null}
            {showPriceComparison && billingNote && !isCustomPricing && (
              <div className="mt-0.5 text-xs text-slate-500 leading-none">{billingNote}</div>
            )}
          </div>

          {/* Add-ons / Team size */}
          {(addonLabel || addons.length > 0) ? (
            <div className="mt-3 rounded-2xl bg-slate-100 p-3">
              {addonLabel ? <div className="text-sm font-semibold text-slate-900">{addonLabel}</div> : null}
              {addons.length > 0 ? (
                <select
                  className={`mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 ${theme.focusRing}`}
                  defaultValue={addons[0]?.id}
                >
                  {addons.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : null}

          {/* CTA - Compact spacing */}
          <div className="mt-3 md:mt-4">
            <a
              href={(plan as any).ctaHref || finalHref}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              referrerPolicy="no-referrer"
              className={[
                'block w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors',
                `${theme.buttonBg} text-white ${theme.buttonHover}`,
              ].join(' ')}
            >
              {finalCtaText}
            </a>
            {/* Affiliate link disclosure */}
            <div className="mt-1 text-center text-xs text-slate-400">Affiliate link</div>
            {!isCustomPricing && <div className="mt-1 text-center text-xs text-slate-500">{billingNote}</div>}
            {hasFreeTrial && !isCustomPricing ? <div className="mt-0.5 text-center text-xs text-slate-500">Free trial available</div> : null}
          </div>
        </div>
      </div>

      {/* Features - Separate bottom section */}
      <div
        className={[
          isEmptyEnterprise ? '' : 'border-t border-slate-100',
          hasAnyFeatures ? 'mt-5 pt-3 flex-1' : isEmptyEnterprise ? 'mt-3' : 'mt-4 pt-4',
        ].join(' ')}
      >
        {hasAnyFeatures ? (
          <>
            {/* "Key features" title only when using comparison_table fallback */}
            {isUsingComparisonTable && (
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">Key features</h4>
            )}
            {/* Feature list with icon */}
            <ul className="space-y-2">
              {visibleFeatures.map((it, idx) => {
                // Normalize text: remove extra whitespace and newlines
                const normalize = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();
                const normalizedText = normalize(it.text);
                const normalizedBadge = normalize(it.badge);
                
                return (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="flex-1 text-sm leading-6 text-slate-700">{normalizedText}</span>
                    {normalizedBadge ? (
                      <span className="ml-2 whitespace-nowrap shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {normalizedBadge}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            
            {/* "+X more" expand button */}
            {!isFeaturesExpanded && remainingCount > 0 && (
              <button
                type="button"
                onClick={() => setIsFeaturesExpanded(true)}
                className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                +{remainingCount} more
              </button>
            )}
          </>
        ) : (
          <div className="text-xs text-slate-500 py-2">
            {isCustomPricing ? 'Contact sales to get the full list of included features.' : 'Features coming soon'}
          </div>
        )}
      </div>
    </div>
  );
}

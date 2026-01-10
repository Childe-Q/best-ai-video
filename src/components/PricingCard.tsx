'use client';

import { PricingPlan } from '@/types/tool';

// Diagonal Ribbon Component
function DiagonalRibbon({ text }: { text: string }) {
  return (
    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden z-10">
      <div className="absolute top-4 -right-8 w-40 bg-indigo-600 text-white text-xs font-bold py-1 px-8 transform rotate-45 shadow-lg">
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
    addons?: { id: string; label: string }[];
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

export default function PricingCard({
  plan,
  isPopular = false,
  affiliateLink,
  billing = 'monthly',
  hasFreeTrial,
  previousPlanName,
}: PricingCardProps) {
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

  // Debug: Log for ALL plans
  console.log(`[PricingCard] ${plan.name} - Custom Check:`, { isCustomPricing, planId, planName });

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

  const featureItems: { icon?: string; text: string; badge?: string }[] = (plan as any).featureItems || [];

  // Backward-compatible feature fallback
  const legacyAllFeatures: string[] = (plan as any).features || (plan as any).detailed_features || [];

  // If we have featureItems, render them; otherwise render legacy features with a split
  const legacyWhatsIncluded = legacyAllFeatures.slice(0, 6);
  const legacyKeyFeatures = legacyAllFeatures.slice(6);

  const ribbonText = normalizeText((plan as any).ribbonText) || (isPopular ? 'Best Value' : '');

  // Check if this plan should have bigger price (Standard/Premium only)
  const planIdLower = String((plan as any).id || '').toLowerCase();
  const planNameLower = String(plan.name || '').toLowerCase();
  const isBigPrice = planIdLower === 'standard' || planIdLower === 'premium' || 
                     planNameLower === 'standard' || planNameLower === 'premium';

  // Determine CTA text
  const finalCtaText = ctaText || (isCustomPricing ? 'Contact Sales' : isFree ? 'Get Free' : `Get ${plan.name}`);

  return (
    <div
      className={[
        'relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-5 md:p-7 shadow-sm transition-all',
        isPopular ? 'border-indigo-600 shadow-lg shadow-indigo-600/10' : 'border-slate-200',
      ].join(' ')}
    >
      {ribbonText ? <DiagonalRibbon text={ribbonText} /> : null}

      {/* Header */}
      <div>
        <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{plan.name}</h3>
        {tagline ? <p className="mt-0.5 text-xs text-slate-500">{tagline}</p> : null}

        {/* Price Block Container - Compact layout */}
        <div className="mt-2 flex flex-col">
          {/* Price */}
          <div>
            {isCustomPricing ? (
              // Custom pricing: Show unitPriceNote or "Custom pricing" + billingNote
              <div className="flex flex-col items-start leading-none gap-1">
                <div className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Custom pricing
                </div>
                <div className="text-xs text-slate-500 leading-none">
                  billed yearly
                </div>
              </div>
            ) : (
              // Regular pricing: monthly/yearly number prices
              <div className="flex flex-col items-start leading-none gap-1">
                {showPriceComparison && monthlyAmount !== null && yearlyAmount !== null ? (
                  // Show comparison: strikethrough monthly + bold yearly
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className={`${isBigPrice ? 'text-lg' : 'text-base'} font-bold text-gray-400 line-through leading-none`}>
                      ${monthlyAmount}
                    </span>
                    <span className={`${isBigPrice ? 'text-3xl md:text-4xl' : 'text-2xl'} font-extrabold tracking-tight text-pink-600 leading-none`}>
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
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
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
                'bg-indigo-600 text-white hover:bg-indigo-700',
              ].join(' ')}
            >
              {finalCtaText}
            </a>
            {!isCustomPricing && <div className="mt-1 text-center text-xs text-slate-500">{billingNote}</div>}
            {hasFreeTrial && !isCustomPricing ? <div className="mt-0.5 text-center text-xs text-slate-500">Free trial available</div> : null}
          </div>
        </div>
      </div>

      {/* Features - Separate bottom section */}
      <div className="mt-5 pt-5 border-t border-slate-100 flex-1">
        {featureItems.length > 0 ? (
          <ul className="space-y-2">
            {featureItems.map((it, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 py-1">
                <div className="flex min-w-0 items-start gap-3">
                  <svg className="mt-0.5 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-6 text-slate-700">{it.text}</span>
                </div>
                {it.badge ? (
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {it.badge}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : legacyAllFeatures.length > 0 ? (
          <>
            {legacyWhatsIncluded.length > 0 ? (
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">What&apos;s included</h4>
                <ul className="space-y-2">
                  {legacyWhatsIncluded.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <svg className="mt-0.5 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {legacyKeyFeatures.length > 0 ? (
              <div className="mt-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
                  {previousPlanName ? `Everything in ${previousPlanName} plus:` : 'Key features'}
                </h4>
                <ul className="space-y-2">
                  {legacyKeyFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <svg className="mt-0.5 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-sm text-slate-500">No features available yet.</div>
        )}
      </div>
    </div>
  );
}

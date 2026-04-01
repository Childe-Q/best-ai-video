import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import CTAButton from './CTAButton';
import { PricingPlan } from '@/types/tool';
import { isExplicitContactSalesPlan, isExplicitFreePlan } from '@/lib/pricing/display';
import { getPricingCardCtaLabel, getPricingCardCtaVariant } from '@/lib/pricing/cta';

interface PricingCardProps {
  plan: PricingPlan;
  isAnnual: boolean;
  affiliateLink?: string;
  hasFreeTrial?: boolean;
  toolSlug?: string;
  isPopular?: boolean;
  previousPlanName?: string;
  comparisonTable?: any;
}

export default function PricingCard({
  plan,
  isAnnual,
  affiliateLink,
  hasFreeTrial,
  toolSlug,
  isPopular: propIsPopular,
  previousPlanName,
  comparisonTable,
}: PricingCardProps) {
  const { name, price, features, featureItems, ctaText, badge, description } = plan;
  const shortUnitNote = plan.unitPriceNote?.trim();
  const shortBillingNote = plan.billingNote?.trim();
  const monthlyPriceDisplayOverride = plan.monthlyPriceDisplay?.trim();
  const yearlyPriceDisplayOverride = plan.yearlyPriceDisplay?.trim();
  const monthlyDisplayUnitOverride = plan.monthlyDisplayUnit?.trim();
  const yearlyDisplayUnitOverride = plan.yearlyDisplayUnit?.trim();
  const monthlyBillingLabelOverride = plan.monthlyBillingLabel?.trim();
  const yearlyBillingLabelOverride = plan.yearlyBillingLabel?.trim();
  const yearlyTotalPriceOverride = plan.yearlyTotalPrice?.trim();
  const annualNoteOverride = plan.annualNote?.trim();
  const hasExplicitCanonicalPriceDisplay = Boolean(monthlyPriceDisplayOverride || yearlyPriceDisplayOverride);
  const hasMeaningfulMonthlyBillingLabel = Boolean(monthlyBillingLabelOverride);
  const hasMeaningfulYearlyBillingLabel = Boolean(yearlyBillingLabelOverride);
  const hasMeaningfulYearlyTotal = Boolean(yearlyTotalPriceOverride);
  const hasMeaningfulAnnualNote = Boolean(annualNoteOverride);

  let monthlyPrice: number | null = null;
  let yearlyPrice: number | null = null;
  let directRecurringPrice: number | null = null;
  let directRecurringPeriod: string | null = null;

  if (typeof price === 'object' && price !== null) {
    if ('monthly' in price && price.monthly) {
      if (typeof price.monthly === 'object' && 'amount' in price.monthly) {
        monthlyPrice = price.monthly.amount ?? null;
      }
    }

    if ('yearly' in price && price.yearly) {
      if (typeof price.yearly === 'object' && 'amount' in price.yearly) {
        yearlyPrice = price.yearly.amount ?? null;
      }
    }

    if (!('monthly' in price) && 'amount' in price) {
      directRecurringPrice = price.amount ?? null;
      directRecurringPeriod = price.period || null;
    }
  }

  const currentPrice = isAnnual
    ? (yearlyPrice ?? monthlyPrice ?? directRecurringPrice ?? 0)
    : (monthlyPrice ?? directRecurringPrice ?? 0);

  let savingsPerMonth: number | null = null;
  let savingsPercent: number | null = null;
  let yearlyTotal: number | null = null;

  if (isAnnual && typeof currentPrice === 'number' && currentPrice > 0 && monthlyPrice !== null && monthlyPrice > 0) {
    savingsPerMonth = monthlyPrice - currentPrice;
    savingsPercent = Math.round((savingsPerMonth / monthlyPrice) * 100);
    yearlyTotal = currentPrice * 12;
  }

  const isContactSales = isExplicitContactSalesPlan(plan);
  const isFreePlan = isExplicitFreePlan(plan);

  const displayUnitOverride = isAnnual ? yearlyDisplayUnitOverride : monthlyDisplayUnitOverride;
  const period = (isContactSales || isFreePlan)
    ? ''
    : hasExplicitCanonicalPriceDisplay
      ? displayUnitOverride || ''
      : typeof currentPrice === 'number' && currentPrice > 0
        ? directRecurringPeriod === 'year'
          ? '/yr'
          : '/mo'
        : '';

  let priceDisplay: string;

  if (isContactSales) {
    priceDisplay =
      typeof price === 'string' && price.toLowerCase().includes('custom')
        ? 'Custom pricing'
        : 'Contact sales';
  } else if (hasExplicitCanonicalPriceDisplay) {
    priceDisplay = isAnnual
      ? yearlyPriceDisplayOverride || monthlyPriceDisplayOverride || 'Price not listed'
      : monthlyPriceDisplayOverride || yearlyPriceDisplayOverride || 'Price not listed';
  } else if (typeof currentPrice === 'number') {
    priceDisplay = currentPrice === 0 ? (isFreePlan ? 'Free' : 'N/A') : `$${currentPrice}`;
  } else if (typeof price === 'string') {
    priceDisplay = price;
  } else {
    priceDisplay = isFreePlan ? 'Free' : 'Contact sales';
  }

  const monthlyPriceDisplay = monthlyPrice !== null && monthlyPrice > 0 ? `$${monthlyPrice}` : null;
  const isPopular =
    propIsPopular ?? (badge || name.toLowerCase().includes('pro') || name.toLowerCase().includes('plus'));

  const isRepetitiveUsageText = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      (lower.includes('repeat') && lower.includes('edit') && (lower.includes('credit') || lower.includes('minute'))) ||
      (lower.includes('regenerat') && lower.includes('credit')) ||
      (lower.includes('finalize') && lower.includes('script')) ||
      (lower.includes('consum') && lower.includes('credit') && lower.includes('generat'))
    );
  };

  const filteredFeatureItems = featureItems?.filter((item) => !isRepetitiveUsageText(item.text));
  const filteredFeatures = features?.filter((feature) => !isRepetitiveUsageText(feature));
  const featureRows = filteredFeatureItems
    ? filteredFeatureItems.map((item) => ({ text: item.text, available: item.available !== false }))
    : filteredFeatures
      ? filteredFeatures.map((feature) => ({ text: feature, available: true }))
      : [];

  const rawPriceMetaLines = [
    !isAnnual && hasMeaningfulMonthlyBillingLabel && !isContactSales ? monthlyBillingLabelOverride : null,
    isAnnual && hasMeaningfulYearlyBillingLabel && !isContactSales ? yearlyBillingLabelOverride : null,
    isAnnual && hasMeaningfulYearlyTotal && !isContactSales ? `Yearly total: ${yearlyTotalPriceOverride}` : null,
    isAnnual && hasMeaningfulAnnualNote && !isContactSales ? annualNoteOverride : null,
    shortUnitNote || null,
    !isAnnual && shortBillingNote && !hasMeaningfulMonthlyBillingLabel ? shortBillingNote : null,
    isAnnual && shortBillingNote && !hasMeaningfulYearlyBillingLabel && !hasMeaningfulAnnualNote ? shortBillingNote : null,
  ].filter((item): item is string => Boolean(item?.trim()));

  const priceMetaLines = rawPriceMetaLines.filter((line, index) => rawPriceMetaLines.indexOf(line) === index);

  const planSlug = `plan-${name.toLowerCase().replace(/\s+/g, '-')}`;
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const handleHighlight = () => {
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 1200);
    };

    const cardElement = document.getElementById(planSlug);
    if (cardElement) {
      cardElement.addEventListener('highlight', handleHighlight);
      return () => cardElement.removeEventListener('highlight', handleHighlight);
    }
  }, [planSlug]);

  const priceModeLabel = isContactSales ? 'Custom plan' : isFreePlan ? 'Free plan' : isAnnual ? 'Yearly billing' : 'Monthly billing';
  const ctaLabel = getPricingCardCtaLabel(plan);
  const ctaVariant = getPricingCardCtaVariant(plan);
  const cardToneClasses = isHighlighted
    ? 'border-blue-500 bg-blue-50/30 shadow-[6px_6px_0px_0px_#3b82f6]'
    : isPopular
      ? 'border-black bg-[#FFFDF3] shadow-[8px_8px_0px_0px_#111111]'
      : 'border-black bg-white shadow-[6px_6px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111]';

  return (
    <div
      id={planSlug}
      className={`
        relative flex h-full flex-col rounded-2xl border-2 p-6 transition-all duration-200
        ${cardToneClasses}
      `}
    >
      <div className="mb-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{priceModeLabel}</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-black">{name}</h3>
          </div>
          {isPopular && (
            <span className="inline-flex shrink-0 rounded-full border-2 border-black bg-[#B8F500] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
              {badge || 'Most Popular'}
            </span>
          )}
        </div>
        {description && <p className="min-h-[2.75rem] text-sm font-medium leading-6 text-gray-600">{description}</p>}
      </div>

      <div className="mb-6 pb-5">
        <div className="flex flex-wrap items-end gap-2">
          {isAnnual && monthlyPriceDisplay && savingsPerMonth !== null && savingsPerMonth > 0 && (
            <span className="text-xl font-bold text-gray-400 line-through">{monthlyPriceDisplay}</span>
          )}
          <span className="text-5xl font-black leading-none tracking-tight text-black">{priceDisplay}</span>
          {period && <span className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{period}</span>}
          {isAnnual && !hasExplicitCanonicalPriceDisplay && savingsPercent !== null && savingsPercent > 0 && (
            <span className="inline-flex items-center rounded-md border border-green-300 bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
              Save {savingsPercent}%
            </span>
          )}
        </div>

        {isAnnual && !hasExplicitCanonicalPriceDisplay && savingsPerMonth !== null && savingsPerMonth > 0 && (
          <p className="mt-2 text-xs font-semibold text-green-600">Save ${savingsPerMonth}/mo</p>
        )}
        {isAnnual && !hasExplicitCanonicalPriceDisplay && typeof currentPrice === 'number' && currentPrice > 0 && yearlyTotal !== null && (
          <p className="mt-2 text-xs font-medium text-gray-600">Billed yearly (${yearlyTotal}/yr)</p>
        )}

        {priceMetaLines.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {priceMetaLines.map((line, index) => (
              <p key={`${name}-price-meta-${index}-${line}`} className="text-xs font-medium leading-5 text-gray-500">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 flex-1 border-t border-black/10 pt-5">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Included</p>
        <ul className="space-y-3">
          {featureRows.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {item.available ? (
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-black" />
              ) : (
                <XMarkIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              )}
              <span className="text-sm font-medium leading-6 text-gray-700">{item.text}</span>
            </li>
          ))}
          {featureRows.length === 0 && (
            <li className="text-sm leading-6 text-gray-500">Plan details not listed.</li>
          )}
        </ul>
      </div>

      <div className="mt-auto border-t border-black/10 pt-5">
        <CTAButton
          affiliateLink={affiliateLink}
          hasFreeTrial={hasFreeTrial}
          text={ctaLabel}
          variant={ctaVariant}
          className="w-full"
        />
      </div>
    </div>
  );
}

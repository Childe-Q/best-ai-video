import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import CTAButton from './CTAButton';
import { PricingPlan } from '@/types/tool';

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
  comparisonTable
}: PricingCardProps) {
  const { name, price, features, featureItems, ctaText, badge, description } = plan;
  
  // Extract monthly and yearly prices
  let monthlyPrice: number | null = null;
  let yearlyPrice: number | null = null;
  let currency = 'USD';
  
  if (typeof price === 'object' && price !== null) {
    // Extract monthly price
    if ('monthly' in price && price.monthly) {
      if (typeof price.monthly === 'object' && 'amount' in price.monthly) {
        monthlyPrice = price.monthly.amount ?? null;
        currency = price.monthly.currency || 'USD';
      }
    }
        
    // Extract yearly price (monthly equivalent)
    if ('yearly' in price && price.yearly) {
      if (typeof price.yearly === 'object' && 'amount' in price.yearly) {
        yearlyPrice = price.yearly.amount ?? null;
        currency = price.yearly.currency || currency;
      }
    }
  }
  
  // Calculate current price based on billing cycle
  const currentPrice = isAnnual 
    ? (yearlyPrice ?? monthlyPrice ?? 0)
    : (monthlyPrice ?? 0);
  
  // Calculate savings for yearly mode
  let savingsPerMonth: number | null = null;
  let savingsPercent: number | null = null;
  let yearlyTotal: number | null = null;
  
  if (isAnnual && typeof currentPrice === 'number' && currentPrice > 0 && monthlyPrice !== null && monthlyPrice > 0) {
    savingsPerMonth = monthlyPrice - currentPrice;
    savingsPercent = Math.round((savingsPerMonth / monthlyPrice) * 100);
    yearlyTotal = currentPrice * 12;
  }
  
  // Check if this is Contact Sales / Enterprise (must check before Free)
  const isContactSales = 
    (name || '').toLowerCase().includes('enterprise') ||
    (name || '').toLowerCase().includes('custom') ||
    (name || '').toLowerCase().includes('contact') ||
    (ctaText || '').toLowerCase().includes('contact sales') ||
    (ctaText || '').toLowerCase().includes('talk to sales') ||
    (plan.unitPriceNote || '').toLowerCase().includes('custom') ||
    (plan.unitPriceNote || '').toLowerCase().includes('enterprise pricing');
  
  const period = typeof currentPrice === 'number' && currentPrice > 0 ? '/mo' : '';
  let priceDisplay: string;
  
  if (isContactSales) {
    priceDisplay = 'Contact sales';
  } else if (typeof currentPrice === 'number') {
    priceDisplay = currentPrice === 0 ? 'Free' : `$${currentPrice}`;
  } else if (typeof price === 'string') {
    priceDisplay = price;
  } else {
    // Fallback: check if name suggests free
    const planName = (name || '').toLowerCase();
    priceDisplay = planName.includes('free') ? 'Free' : 'Contact sales';
  }
  
  const monthlyPriceDisplay = monthlyPrice !== null && monthlyPrice > 0 ? `$${monthlyPrice}` : null;

  // Neo-Brutal Theme Logic - use prop if provided, otherwise calculate
  const isPopular = propIsPopular ?? (badge || name.toLowerCase().includes('pro') || name.toLowerCase().includes('plus'));

  // Helper to filter repetitive usage text (to be consolidated in PricingUsageExplainer)
  const isRepetitiveUsageText = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      (lower.includes('repeat') && lower.includes('edit') && (lower.includes('credit') || lower.includes('minute'))) ||
      (lower.includes('regenerat') && lower.includes('credit')) ||
      (lower.includes('finalize') && lower.includes('script')) ||
      (lower.includes('consum') && lower.includes('credit') && lower.includes('generat'))
    );
  };

  const filteredFeatureItems = featureItems?.filter(item => !isRepetitiveUsageText(item.text));
  const filteredFeatures = features?.filter(feature => !isRepetitiveUsageText(feature));

  // Generate plan slug for scrolling
  const planSlug = `plan-${name.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Check if this card should be highlighted (via data attribute set by PricingSnapshot)
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  useEffect(() => {
    const handleHighlight = () => {
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 1200);
    };
    
    // Listen for custom highlight event
    const cardElement = document.getElementById(planSlug);
    if (cardElement) {
      cardElement.addEventListener('highlight', handleHighlight);
      return () => cardElement.removeEventListener('highlight', handleHighlight);
    }
  }, [planSlug]);

  return (
    <div
      id={planSlug}
      className={`
        relative flex flex-col h-full
        bg-white border-2 rounded-xl p-6
        transition-all duration-200
        ${isHighlighted 
          ? 'border-blue-500 bg-blue-50/30 shadow-[4px_4px_0px_0px_#3b82f6]' 
          : isPopular 
          ? 'border-black shadow-[8px_8px_0px_0px_#111111] translate-x-[-2px] translate-y-[-2px]' 
          : 'border-black shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px]'}
      `}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-block bg-[#B8F500] text-black text-xs font-bold px-3 py-1 rounded-full border-2 border-black uppercase tracking-wide">
            {badge || 'Most Popular'}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-black text-black uppercase tracking-tight">{name}</h3>
        {description && <p className="text-sm text-gray-600 mt-2 font-medium">{description}</p>}
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 flex-wrap">
          {/* Strikethrough monthly price (only in yearly mode) */}
          {isAnnual && monthlyPriceDisplay && savingsPerMonth !== null && savingsPerMonth > 0 && (
            <span className="text-2xl font-bold text-gray-400 line-through">
              {monthlyPriceDisplay}
            </span>
          )}
          {/* Main price */}
          <span className="text-4xl font-black text-black tracking-tight">{priceDisplay}</span>
          {typeof currentPrice === 'number' && currentPrice > 0 && (
            <span className="text-gray-600 font-bold ml-1">{period}</span>
          )}
          {/* Savings badge (only in yearly mode) */}
          {isAnnual && savingsPercent !== null && savingsPercent > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-bold border border-green-300">
              Save {savingsPercent}%
            </span>
          )}
        </div>
        {/* Savings per month (only in yearly mode) */}
        {isAnnual && savingsPerMonth !== null && savingsPerMonth > 0 && (
          <p className="text-xs text-green-600 font-semibold mt-1">
            Save ${savingsPerMonth}/mo
          </p>
        )}
        {/* Billed yearly with total */}
        {isAnnual && typeof currentPrice === 'number' && currentPrice > 0 && yearlyTotal !== null && (
          <p className="text-xs text-gray-600 font-medium mt-1">
            Billed yearly (${yearlyTotal}/yr)
          </p>
        )}
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {/* Render featureItems if available, otherwise features array */}
        {filteredFeatureItems ? (
          filteredFeatureItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {item.available !== false ? (
                <CheckIcon className="w-5 h-5 text-black shrink-0 mt-0.5" />
              ) : (
                <XMarkIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              )}
              <span className="text-sm font-medium text-gray-700">{item.text}</span>
            </li>
          ))
        ) : filteredFeatures ? (
          filteredFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-black shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-gray-700">{feature}</span>
            </li>
          ))
        ) : null}
      </ul>
            
      <div className="mt-auto">
        <CTAButton 
          affiliateLink={affiliateLink} 
          hasFreeTrial={hasFreeTrial}
          text={ctaText}
          className="w-full"
        />
      </div>
    </div>
  );
}

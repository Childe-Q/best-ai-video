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
  
  const period = typeof currentPrice === 'number' && currentPrice > 0 ? '/mo' : '';
  const priceDisplay = typeof currentPrice === 'number' 
    ? (currentPrice === 0 ? 'Free' : `$${currentPrice}`) 
    : (typeof price === 'string' ? price : 'Free');
  
  const monthlyPriceDisplay = monthlyPrice !== null && monthlyPrice > 0 ? `$${monthlyPrice}` : null;

  // Neo-Brutal Theme Logic - use prop if provided, otherwise calculate
  const isPopular = propIsPopular ?? (badge || name.toLowerCase().includes('pro') || name.toLowerCase().includes('plus'));

  return (
    <div
      className={`
        relative flex flex-col h-full
        bg-white border-2 border-black rounded-xl p-6
        transition-all duration-200
        ${isPopular 
          ? 'shadow-[8px_8px_0px_0px_#111111] translate-x-[-2px] translate-y-[-2px]' 
          : 'shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px]'}
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
        {featureItems ? (
          featureItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {item.available !== false ? (
                <CheckIcon className="w-5 h-5 text-black shrink-0 mt-0.5" />
              ) : (
                <XMarkIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              )}
              <span className="text-sm font-medium text-gray-700">{item.text}</span>
            </li>
          ))
        ) : features ? (
          features.map((feature, idx) => (
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

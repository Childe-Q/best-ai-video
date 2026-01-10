'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PricingPlan } from '@/types/tool';
import { CheckIcon } from '@heroicons/react/24/solid';

interface PricingSnapshotProps {
  plans: PricingPlan[];
  affiliateLink: string;
  toolSlug: string;
}

export default function PricingSnapshot({ plans, affiliateLink, toolSlug }: PricingSnapshotProps) {
  // State management for billing cycle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Check if any plan has the new object format (has yearly pricing)
  const hasYearlyPricing = plans.some(plan => {
    if (!plan.price || typeof plan.price !== 'object') return false;
    // Check if it has monthly/yearly structure
    if ('monthly' in plan.price) {
      // Check if yearly exists and is not undefined/null
      return 'yearly' in plan.price && plan.price.yearly !== undefined && plan.price.yearly !== null;
    }
    return false;
  });
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">Pricing information coming soon.</p>
      </div>
    );
  }

  // Helper function to get price string (supports multiple formats)
  const getPriceString = (price: string | { monthly: string | { amount: number; currency: string; period: string }; yearly?: string | { amount: number; currency: string; period: string } } | { amount: number; currency: string; period: string } | undefined, useYearly: boolean = false): string => {
    if (!price) return 'N/A';
    if (typeof price === 'string') {
      return price; // Old format: string
    }
    // New format with monthly/yearly (object structure)
    if ('monthly' in price) {
      const selected = useYearly ? price.yearly : price.monthly;
      if (!selected) return 'N/A';
      
      // If selected is a string (old format)
      if (typeof selected === 'string') {
        return selected;
      }
      
      // If selected is an object (new format)
      if (typeof selected === 'object' && selected !== null) {
        if (selected.amount === 0) {
          return 'Free';
        }
        const currency = selected.currency === 'USD' ? '$' : selected.currency + ' ';
        return `${currency}${selected.amount}`;
      }
    }
    // Old format with amount/currency/period (direct object, not nested)
    if ('amount' in price && 'currency' in price && 'period' in price && !('monthly' in price)) {
      if (price.amount === 0) {
        return (price as any).unitPriceNote || 'Free';
      }
      const currency = price.currency === 'USD' ? '$' : price.currency + ' ';
      return `${currency}${price.amount}`;
    }
    return 'N/A';
  };

  // Helper function to check if price is enterprise/custom
  const isEnterprisePrice = (price: string | { monthly: string | { amount: number; currency: string; period: string }; yearly?: string | { amount: number; currency: string; period: string } } | { amount: number; currency: string; period: string } | undefined): boolean => {
    if (!price) return false;
    if (typeof price === 'string') {
      return price.toLowerCase() === 'custom' || price.toLowerCase() === 'contact';
    }
    // Check monthly/yearly format (new object structure)
    if ('monthly' in price) {
      const monthly = price.monthly;
      if (typeof monthly === 'string') {
        return monthly.toLowerCase() === 'custom' || monthly.toLowerCase() === 'contact';
      }
      if (typeof monthly === 'object' && monthly !== null) {
        // Check if it's enterprise (amount is 0 and has custom pricing note)
        const unitPriceNote = (price as any).unitPriceNote;
        if (unitPriceNote && typeof unitPriceNote === 'string' && unitPriceNote.toLowerCase().includes('custom')) {
          return true;
        }
        // Enterprise plans might have amount 0 with period 'year'
        if (monthly.amount === 0 && monthly.period === 'year') {
          return true;
        }
      }
    }
    // Check amount/currency/period format (old format)
    if ('amount' in price && 'currency' in price && 'period' in price && !('monthly' in price)) {
      const unitPriceNote = (price as any).unitPriceNote;
      if (unitPriceNote && typeof unitPriceNote === 'string') {
        return unitPriceNote.toLowerCase().includes('custom');
      }
      // Enterprise plans might have amount 0 with period 'year'
      if (price.amount === 0 && price.period === 'year') {
        return true;
      }
      return false;
    }
    return false;
  };

  // Helper function to check if price is free
  const isFreePrice = (price: string | { monthly: string | { amount: number; currency: string; period: string }; yearly?: string | { amount: number; currency: string; period: string } } | { amount: number; currency: string; period: string } | undefined): boolean => {
    if (!price) return false;
    if (typeof price === 'string') {
      return price.toLowerCase() === 'free' || price === '$0';
    }
    // Check monthly/yearly format (new object structure)
    if ('monthly' in price) {
      const monthly = price.monthly;
      if (typeof monthly === 'string') {
        return monthly.toLowerCase() === 'free' || monthly === '$0';
      }
      if (typeof monthly === 'object' && monthly !== null) {
        return monthly.amount === 0 && monthly.period !== 'year'; // Free plan, not Enterprise
      }
    }
    // Check amount/currency/period format (old format)
    if ('amount' in price && 'currency' in price && 'period' in price && !('monthly' in price)) {
      return price.amount === 0 && price.period !== 'year'; // Free plan, not Enterprise
    }
    return false;
  };

  // Determine background color based on plan type
  const getBackgroundColor = (plan: PricingPlan): string => {
    const isEnterprise = isEnterprisePrice(plan.price);
    const isFree = isFreePrice(plan.price);
    
    // Free & Enterprise: Light gray background
    if (isFree || isEnterprise) {
      return 'bg-[#F2F4F7]';
    }
    // Standard & Premium: White background
    return 'bg-white';
  };

  // Determine border style
  const getBorderStyle = (plan: PricingPlan, index: number): string => {
    const badgeText = (plan as any).ribbonText || plan.badge || '';
    const popular = badgeText.includes('Popular') || badgeText.includes('Best Value') || plan.name.includes('Standard') || index === 1;
    if (popular) {
      return 'border-2 border-pink-600';
    }
    // Free & Enterprise: transparent or very subtle gray
    const isEnterprise = isEnterprisePrice(plan.price);
    const isFree = isFreePrice(plan.price);
    if (isFree || isEnterprise) {
      return 'border border-transparent';
    }
    return 'border border-gray-200';
  };

  // Format price for display
  const formatPrice = (plan: PricingPlan, useYearly: boolean = false): string => {
    const priceStr = getPriceString(plan.price, useYearly);
    if (!priceStr || priceStr === 'N/A') return 'N/A';
    
    // Handle string format
    if (typeof priceStr === 'string') {
      const isEnterprise = priceStr.toLowerCase() === 'custom' || priceStr.toLowerCase() === 'contact';
      const isFree = priceStr.toLowerCase() === 'free' || priceStr === '$0';
      
      if (isEnterprise) return 'Custom';
      if (isFree) return '$0';
      return priceStr;
    }
    
    return priceStr;
  };

  // Determine grid columns based on plan count
  const getGridCols = () => {
    const planCount = plans.length;
    if (planCount === 3) {
      return 'grid-cols-1 md:grid-cols-3';
    } else if (planCount === 4) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    } else if (planCount === 2) {
      return 'grid-cols-1 md:grid-cols-2';
    } else {
      // Default: responsive grid for other counts
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Billing Cycle Toggle - Top Center */}
      {hasYearlyPricing && (
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-green-600 text-xs font-normal">⚡️40% off</span>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid - Wide layout, cards float independently */}
      <div className={`grid ${getGridCols()} gap-6 lg:gap-8 w-full items-stretch`}>
      {plans.map((plan, index) => {
        // Get badge text (support both old and new format)
        const badgeText = (plan as any).ribbonText || plan.badge || '';
        // Force highlight if it's the 2nd card (Standard) - Index-based fallback
        const isPopular = (badgeText.includes('Popular') || badgeText.includes('Best Value') || plan.name.includes('Standard') || index === 1);
        const isEnterprise = isEnterprisePrice(plan.price);
        const isFree = isFreePrice(plan.price);
        
        // Check if Custom pricing (same logic as PricingCard)
        const planId = String((plan as any).id || '').toLowerCase();
        const planName = String(plan.name || '').toLowerCase();
        const unitPriceNote = String((plan as any).unitPriceNote || '').toLowerCase();
        const ctaText = String((plan as any).ctaText || '').toLowerCase();
        
        const isCustomPricing =
          planId === 'enterprise' ||
          planName.includes('enterprise') ||
          unitPriceNote.includes('custom pricing') ||
          ctaText.includes('contact sales') ||
          ctaText.includes('contact us');
        
        const billingNote = (plan as any).billingNote || '';

        return (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-5 md:p-7 transition-all duration-300 ${getBackgroundColor(plan)} ${getBorderStyle(plan, index)} ${
              isPopular ? 'shadow-xl scale-105 z-10' : 'shadow-sm'
            }`}
          >
            {/* Badge - Inside the card, orange/pink text */}
            {badgeText && (
              <div className={`mb-4 text-left ${
                isPopular ? 'text-orange-600' : 'text-gray-600'
              }`}>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {badgeText}
                </span>
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {plan.name}
            </h3>

            {/* Description */}
            <p className="text-xs text-gray-500 h-10 mb-3 flex items-center">
              {plan.description || 'General use'}
            </p>

            {/* Price - Vertical Stack - Compact layout */}
            <div className="mb-2 flex flex-col items-start">
              {isCustomPricing ? (
                // Custom pricing: Show "Custom pricing" + "billed yearly"
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-xl font-bold text-gray-900 leading-none">
                    Custom pricing
                  </span>
                  <span className="text-xs text-gray-500 font-medium leading-none">
                    {billingNote ? billingNote.replace(/^\*?\s*/, '').toLowerCase() : 'billed yearly'}
                  </span>
                </div>
              ) : (() => {
                // Check if we should show strikethrough (only when yearly is selected and prices differ)
                const showStrikethrough = !isCustomPricing && billingCycle === 'yearly' && 
                  typeof plan.price === 'object' && 
                  plan.price !== null &&
                  'monthly' in plan.price &&
                  'yearly' in plan.price &&
                  plan.price.yearly !== undefined &&
                  plan.price.yearly !== null &&
                  (() => {
                    const monthly = plan.price.monthly;
                    const yearly = plan.price.yearly;
                    // Compare amounts if both are objects
                    if (typeof monthly === 'object' && typeof yearly === 'object' && monthly !== null && yearly !== null) {
                      return monthly.amount !== yearly.amount;
                    }
                    // Compare strings if both are strings
                    if (typeof monthly === 'string' && typeof yearly === 'string') {
                      return monthly !== yearly;
                    }
                    return false;
                  })();

                if (showStrikethrough) {
                  // Yearly: Show crossed-out monthly price + bold yearly price
                  return (
                    <div className="flex flex-col items-start leading-none gap-1">
                      <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-base font-bold text-gray-400 line-through leading-none">
                          {formatPrice(plan, false)}
                        </span>
                        <span className="text-2xl font-bold text-[#E91E63] leading-none">
                          {formatPrice(plan, true)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium leading-none">
                        per month, billed yearly
                      </span>
                    </div>
                  );
                } else {
                  // Monthly or same price: Show regular price
                  return (
                    <div className="flex flex-col items-start leading-none gap-1">
                      <div className="flex items-end gap-1 leading-none">
                        <span className="text-2xl font-bold text-gray-900 leading-none">
                          {formatPrice(plan, billingCycle === 'yearly')}
                        </span>
                        <span className="text-xs text-gray-500 font-medium pb-0.5 leading-none">
                          per month
                        </span>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* THE BUTTON - Compact spacing */}
            <div className="mt-3 md:mt-4 mb-6">
              <a
                href={affiliateLink || '#'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                referrerPolicy="no-referrer"
                className={`
                  flex items-center justify-center w-full px-6 py-2.5 text-base font-bold rounded-full transition-all duration-200
                  ${isPopular
                    ? '!bg-pink-600 !text-white hover:!bg-pink-700 shadow-lg' // Force Pink
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {((plan as any).ctaText || plan.btn_text || 'Get Started').replace(/→/g, '').trim()}
                <span className="ml-2">→</span>
              </a>
            </div>

            {/* Features List - Separate bottom section */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              {(() => {
                // Support both old format (features array) and new format (featureItems array)
                const features = (plan as any).featureItems 
                  ? (plan as any).featureItems.map((item: any) => typeof item === 'string' ? item : item.text)
                  : (plan.features || []);
                
                return features && features.length > 0 ? (
                  <ul className="space-y-2">
                    {features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckIcon 
                          className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400"
                        />
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null;
              })()}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

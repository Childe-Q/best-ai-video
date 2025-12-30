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
  const hasYearlyPricing = plans.some(plan => 
    plan.price && typeof plan.price === 'object' && 'yearly' in plan.price
  );
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">Pricing information coming soon.</p>
      </div>
    );
  }

  // Helper function to get price string (supports both old string format and new object format)
  const getPriceString = (price: string | { monthly: string; yearly: string } | undefined, useYearly: boolean = false): string => {
    if (!price) return 'N/A';
    if (typeof price === 'string') {
      return price; // Old format
    }
    // New format: object with monthly and yearly
    return useYearly ? price.yearly : price.monthly;
  };

  // Helper function to check if price is enterprise/custom
  const isEnterprisePrice = (price: string | { monthly: string; yearly: string } | undefined): boolean => {
    if (!price) return false;
    const priceStr = typeof price === 'string' ? price : price.monthly;
    return priceStr.toLowerCase() === 'custom' || priceStr.toLowerCase() === 'contact';
  };

  // Helper function to check if price is free
  const isFreePrice = (price: string | { monthly: string; yearly: string } | undefined): boolean => {
    if (!price) return false;
    const priceStr = typeof price === 'string' ? price : price.monthly;
    return priceStr.toLowerCase() === 'free' || priceStr === '$0';
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
    const popular = (plan.badge?.includes('Popular') ?? false) || plan.name.includes('Standard') || index === 1;
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
    
    const isEnterprise = priceStr.toLowerCase() === 'custom' || priceStr.toLowerCase() === 'contact';
    const isFree = priceStr.toLowerCase() === 'free' || priceStr === '$0';
    
    if (isEnterprise) return 'Custom';
    if (isFree) return '$0';
    return priceStr;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {plans.map((plan, index) => {
        // Force highlight if it's the 2nd card (Standard) - Index-based fallback
        const isPopular = (plan.badge?.includes('Popular') ?? false) || plan.name.includes('Standard') || index === 1;
        const isEnterprise = isEnterprisePrice(plan.price);
        const isFree = isFreePrice(plan.price);

        return (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-6 transition-all duration-300 ${getBackgroundColor(plan)} ${getBorderStyle(plan, index)} ${
              isPopular ? 'shadow-xl scale-105 z-10' : 'shadow-sm'
            }`}
          >
            {/* Badge - Inside the card, orange/pink text */}
            {plan.badge && (
              <div className={`mb-4 text-left ${
                isPopular ? 'text-orange-600' : 'text-gray-600'
              }`}>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {plan.badge}
                </span>
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-500 h-12 mb-4 flex items-center">
              {plan.description || 'General use'}
            </p>

            {/* Price - Vertical Stack */}
            <div className="mb-6 flex flex-col items-start">
              {(() => {
                // Check if we should show strikethrough (only when yearly is selected and prices differ)
                const showStrikethrough = billingCycle === 'yearly' && 
                  typeof plan.price === 'object' && 
                  'yearly' in plan.price &&
                  plan.price.monthly !== plan.price.yearly;

                if (showStrikethrough) {
                  // Yearly: Show crossed-out monthly price + bold yearly price
                  return (
                    <div className="flex flex-col items-start">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-400 line-through">
                          {formatPrice(plan, false)}
                        </span>
                        <span className="text-5xl font-bold text-[#E91E63]">
                          {formatPrice(plan, true)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 font-medium mt-1">
                        per month, billed yearly
                      </span>
                    </div>
                  );
                } else {
                  // Monthly or same price: Show regular price
                  return (
                    <div className="flex flex-col items-start">
                      <span className="text-5xl font-bold text-gray-900">
                        {formatPrice(plan, billingCycle === 'yearly')}
                      </span>
                      <span className="text-sm text-gray-500 font-medium mt-1">
                        per month
                      </span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* THE BUTTON */}
            <div className="mt-8 mb-6">
              <a
                href={affiliateLink || '#'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                referrerPolicy="no-referrer"
                className={`
                  flex items-center justify-center w-full px-6 py-3 text-base font-bold rounded-full transition-all duration-200
                  ${isPopular
                    ? '!bg-pink-600 !text-white hover:!bg-pink-700 shadow-lg' // Force Pink
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {(plan.btn_text || 'Get Started').replace(/→/g, '').trim()}
                <span className="ml-2">→</span>
              </a>
            </div>

            {/* Features List - Show ALL features, no slice */}
            {plan.features && plan.features.length > 0 && (
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckIcon 
                      className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { PricingPlan } from '@/types/tool';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

interface PricingTableProps {
  plans: PricingPlan[];
  affiliateLink: string;
  hasFreeTrial: boolean;
}

export default function PricingTable({ plans, affiliateLink, hasFreeTrial }: PricingTableProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // Track expanded state for each card individually
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Check if link needs cloaking (Veed.io or cello.so links)
  const needsCloaking = affiliateLink.includes('cello.so') || affiliateLink.includes('veed.io');
  const finalHref = needsCloaking 
    ? `/api/visit?url=${encodeURIComponent(affiliateLink)}`
    : affiliateLink;

  // Helper function to get price as string (handles both string and object types)
  const getPriceString = (price: string | { monthly: string; yearly: string } | undefined): string => {
    if (!price) return '';
    if (typeof price === 'string') return price;
    // If it's an object, return monthly price by default
    return price.monthly || '';
  };

  // Calculate yearly price (20% discount)
  const getYearlyPrice = (monthlyPrice: string): string => {
    if (!monthlyPrice) return monthlyPrice;
    const priceMatch = monthlyPrice.match(/\$?(\d+)/);
    if (!priceMatch) return monthlyPrice;
    const monthly = parseInt(priceMatch[1]);
    if (isNaN(monthly)) return monthlyPrice;
    const yearly = Math.round(monthly * 12 * 0.8); // 20% discount
    return `$${yearly}/yr`;
  };

  const formatPrice = (plan: PricingPlan): { price: string; period: string } => {
    if (!plan || !plan.price) {
      return { price: 'N/A', period: '' };
    }
    
    const priceStr = getPriceString(plan.price as any);
    const isEnterprise = priceStr.toLowerCase() === 'custom' || priceStr.toLowerCase() === 'contact';
    const isFree = priceStr.toLowerCase() === 'free';

    if (isEnterprise) {
      return { price: "Let's Talk", period: '' };
    }

    if (isFree) {
      return { price: '$0', period: '/Mo' };
    }

    if (isYearly && plan.period === '/mo') {
      return { price: getYearlyPrice(priceStr), period: '' };
    }

    return { price: priceStr || 'N/A', period: plan.period || '' };
  };

  // Get highlights and detailed features
  const getFeatureSections = (plan: PricingPlan, index: number, allPlans: PricingPlan[]) => {
    // Use new structure if available, fallback to old structure for backward compatibility
    const highlights = plan.highlights || plan.features?.slice(0, 6) || [];
    const detailedFeatures = plan.detailed_features || plan.features?.slice(6) || [];
    const previousPlan = index > 0 ? allPlans[index - 1] : null;
    
    return { highlights, detailedFeatures, previousPlanName: previousPlan?.name };
  };

  // Toggle expanded state for a specific card
  const toggleCardExpanded = (planName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [planName]: !prev[planName]
    }));
  };

  // Handle empty or invalid plans
  if (!plans || !Array.isArray(plans) || plans.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-500">Pricing information coming soon.</p>
      </div>
    );
  }

  // Determine which plans to show
  // Layout: Display first 3 plans + 1 Static Enterprise = 4 cards total
  // Button Logic: ONLY count JSON plans, NOT the static Enterprise card
  // If plans.length = 3 -> NO BUTTON (3 JSON + 1 Static = 4, all visible)
  // If plans.length > 3 -> SHOW BUTTON (has hidden JSON plans)
  // Render Order: Always render Static Enterprise LAST (never replace it)
  // Filter: Remove any Enterprise plans from JSON data to avoid duplicates
  const filteredPlans = plans.filter(plan => !plan.name.toLowerCase().includes('enterprise'));
  const visiblePlans = filteredPlans.slice(0, 3); // First 3 plans (always visible)
  const hiddenPlans = filteredPlans.slice(3); // Remaining plans (index 3+)

  // Static Enterprise card data (used when collapsed and has more than 3 plans)
  const staticEnterpriseCard: PricingPlan = {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Custom-built AI video solutions for enterprises',
    highlights: [
      'Unlimited AI Videos',
      'Unlimited Video Duration',
      'Unlimited Custom Avatars',
      'Flexible Generative Credits',
      '4K Video Export',
      'Priority Video Processing'
    ],
    detailed_features: [
      'Enterprise-grade SAML SSO',
      'SCORM Export',
      'Bulk Video Generation',
      'Voice Cloning with Audio Upload',
      'Video Production Support',
      '24/7 Priority Technical Support',
      'Dedicated Account Manager',
      'Marketing Link'
    ],
    badge: '💎 Custom Scale',
    btn_text: 'Contact Us'
  };

  // Render badge with dynamic styles
  const renderBadge = (badge: string | null | undefined) => {
    if (!badge) return null;

    let badgeClasses = '';
    
    if (badge === '🔥 Most Popular') {
      badgeClasses = 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/50';
    } else if (badge === '⭐ Best Value') {
      badgeClasses = 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg shadow-blue-400/50';
    } else if (badge === '🏢 For Teams') {
      badgeClasses = 'bg-slate-800 text-white font-bold';
    } else if (badge === '🚀 Power User') {
      badgeClasses = 'bg-purple-100 text-purple-700 border border-purple-200 font-bold';
    } else if (badge === 'Risk-Free Entry') {
      badgeClasses = 'bg-emerald-50 text-emerald-700 border-transparent font-bold';
    } else if (badge === '💎 Custom Scale') {
      badgeClasses = 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold shadow-lg shadow-yellow-500/50';
    } else if (badge === '✨ Featured') {
      badgeClasses = 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow-lg shadow-indigo-400/50';
    } else {
      // Default fallback
      badgeClasses = 'bg-gray-100 text-gray-700 font-bold';
    }

    return (
      <div className={`text-xs sm:text-sm py-2 px-4 text-center rounded-t-3xl ${badgeClasses}`} style={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {badge}
      </div>
    );
  };

  // Render a single pricing card
  const renderCard = (plan: PricingPlan, index: number, allPlans: PricingPlan[], isStaticEnterprise = false) => {
    if (!plan || !plan.name) return null;
    
    const priceStr = getPriceString(plan.price as any);
    const isEnterprise = plan.name.toLowerCase().includes('enterprise') || 
                         priceStr.toLowerCase() === 'custom' || 
                         priceStr.toLowerCase() === 'contact';
    const isFree = priceStr.toLowerCase() === 'free';
    const { price, period } = formatPrice(plan);
    const { highlights, detailedFeatures, previousPlanName } = getFeatureSections(plan, index, allPlans);
    
    // Check if this card is expanded
    const isCardExpanded = expandedCards[plan.name] || false;
    
    // Show only first 4 highlights by default
    const visibleHighlights = isCardExpanded ? highlights : highlights.slice(0, 4);
    const hasMoreFeatures = highlights.length > 4 || detailedFeatures.length > 0;

    // Determine card styles based on type
    let cardClasses = '';
    let textClasses = '';
    let buttonClasses = '';
    let checkmarkColor = '';

    if (isEnterprise) {
      // Enterprise: Dark Blue Gradient
      cardClasses = 'bg-gradient-to-b from-blue-900 to-blue-800 border-2 border-blue-700 hover:border-blue-500';
      textClasses = 'text-white';
      buttonClasses = 'bg-white text-blue-900 hover:bg-gray-100 hover:opacity-90';
      checkmarkColor = 'text-white';
    } else {
      // Standard: Free & Personal - Clean white background
      cardClasses = 'bg-white border border-gray-200 hover:border-indigo-300';
      textClasses = 'text-gray-900';
      buttonClasses = 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent';
      checkmarkColor = 'text-indigo-600';
    }

    return (
      <div
        key={isStaticEnterprise ? 'static-enterprise' : plan.name}
        className={`relative rounded-2xl ${cardClasses} shadow-lg overflow-hidden flex flex-col h-full transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:z-10 border border-gray-200`}
      >
        {/* Badge at the top */}
        {renderBadge(plan.badge)}

        <div className={`p-8 flex flex-col flex-1`}>
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className={`text-2xl font-bold mb-2 ${isEnterprise ? 'text-white' : textClasses}`}>
              {plan.name}
            </h3>
            <p className={`text-sm mb-6 leading-relaxed ${
              isEnterprise ? 'text-slate-200' : 'text-gray-600'
            }`}>
              {plan.description}
            </p>

            {/* Price */}
            <div className="mb-6">
              <div className={`text-5xl font-bold leading-tight ${
                isEnterprise ? 'text-white' : 'text-gray-900'
              }`}>
                {price}
                {period && (
                  <span className={`text-2xl font-semibold ${
                    isEnterprise ? 'text-slate-200' : 'text-gray-500'
                  }`}>
                    {period}
                  </span>
                )}
              </div>
            </div>

            {/* Seat Selector (Only for Team plans) */}
            {plan.badge === '🏢 For Teams' && plan.name.toLowerCase().includes('team') && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center justify-center text-sm font-bold"
                  disabled
                >
                  -
                </button>
                <span className="text-sm font-medium text-gray-700">1 Seat</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center justify-center text-sm font-bold"
                  disabled
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Features Section - With min-height and expandable */}
          <div className="flex flex-col flex-1 min-h-[200px] mb-6">
            {/* Highlights - What's Included */}
            {visibleHighlights.length > 0 && (
              <div className="mb-4">
                <h4 className={`text-xs font-bold mb-3 uppercase tracking-wider ${
                  isEnterprise ? 'text-slate-200' : 'text-gray-900'
                }`}>
                  What&apos;s included
                </h4>
                <ul className="space-y-2.5">
                  {visibleHighlights.map((highlight, idx) => (
                    <li key={idx} className={`flex items-start text-sm leading-relaxed ${
                      isEnterprise ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      <CheckIcon className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${checkmarkColor}`} />
                      <span className="flex-1">{highlight}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Show More/Less Toggle */}
                {hasMoreFeatures && (
                  <button
                    type="button"
                    onClick={() => toggleCardExpanded(plan.name)}
                    className={`mt-3 text-xs font-medium flex items-center gap-1 transition-colors ${
                      isEnterprise ? 'text-slate-300 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {isCardExpanded ? (
                      <>
                        <ChevronUpIcon className="w-4 h-4" />
                        View less features
                      </>
                    ) : (
                      <>
                        <ChevronDownIcon className="w-4 h-4" />
                        View all features
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Additional Highlights (when expanded, show remaining highlights) */}
            {isCardExpanded && highlights.length > 4 && (
              <ul className="space-y-2.5 mb-4">
                {highlights.slice(4).map((highlight, idx) => (
                  <li key={`extra-${idx}`} className={`flex items-start text-sm leading-relaxed ${
                    isEnterprise ? 'text-slate-200' : 'text-gray-700'
                  }`}>
                    <CheckIcon className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${checkmarkColor}`} />
                    <span className="flex-1">{highlight}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Detailed Features - Only show when expanded */}
            {isCardExpanded && detailedFeatures.length > 0 && (
              <div className={`border-t pt-4 mt-4 ${
                isEnterprise ? 'border-blue-700' : 'border-gray-200'
              }`}>
                <h4 className={`text-xs font-bold mb-3 uppercase tracking-wider ${
                  isEnterprise ? 'text-slate-200' : 'text-gray-900'
                }`}>
                  {previousPlanName ? `Everything in ${previousPlanName} plus:` : 'Key features'}
                </h4>
                <ul className="space-y-2">
                  {detailedFeatures.map((feature, idx) => (
                    <li key={idx} className={`flex items-start text-xs leading-relaxed ${
                      isEnterprise ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      <CheckIcon className={`w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5 ${checkmarkColor}`} />
                      <span className="flex-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA Button - Pinned to bottom */}
          <a
            href={finalHref}
            target="_blank"
            rel="nofollow noopener noreferrer"
            referrerPolicy="no-referrer"
            className={`block w-full py-3 px-6 rounded-xl font-bold text-base text-center transition-all duration-200 mt-auto ${buttonClasses}`}
          >
            {plan.btn_text || (isEnterprise ? 'Contact Us' : 'Get Started')}
          </a>
        </div>
      </div>
    );
  };

  // Calculate total visible plans count (including static Enterprise)
  const totalVisiblePlans = isExpanded 
    ? filteredPlans.length + 1 // All filtered plans + static Enterprise
    : visiblePlans.length + 1; // First 3 plans + static Enterprise

  // Determine grid columns based on plan count
  const getGridCols = () => {
    if (totalVisiblePlans === 2) {
      return 'grid-cols-1 md:grid-cols-2';
    } else if (totalVisiblePlans === 3) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    } else {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Monthly/Yearly Toggle - Pill Shape */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex rounded-full bg-gray-100 p-1 border border-gray-200">
          <button
            type="button"
            onClick={() => setIsYearly(false)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              !isYearly
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsYearly(true)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
              isYearly
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            {!isYearly && (
              <span className="ml-2 text-xs font-bold text-green-600">-20% off</span>
            )}
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid - Full Width with Dynamic Columns */}
      <div className={`grid ${getGridCols()} gap-8 mt-0`}>
        {/* Step 1: Render first 3 plans (always visible) */}
        {visiblePlans.map((plan, index) => 
          renderCard(plan, index, filteredPlans)
        )}
        
        {/* Step 2: Render hidden plans (only when expanded) */}
        {isExpanded && hiddenPlans.map((plan, index) => 
          renderCard(plan, index + 3, filteredPlans)
        )}
        
        {/* Step 3: ALWAYS render Static Enterprise card LAST (never replace it, only push it) */}
        {renderCard(staticEnterpriseCard, filteredPlans.length, filteredPlans, true)}
      </div>

      {/* Expand/Collapse Button - ONLY show if filteredPlans.length > 3 (DO NOT count static Enterprise) */}
      {filteredPlans.length > 3 && (
        <div className="flex justify-center mt-12 mb-8">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            {isExpanded ? (
              <>
                Show Less Plans
                <ChevronUpIcon className="w-5 h-5" />
              </>
            ) : (
              <>
                See All {plans.length + 1} Plans
                <ChevronDownIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

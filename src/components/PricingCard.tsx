'use client';

import { PricingPlan } from '@/types/tool';
import Link from 'next/link';

interface PricingCardProps {
  plan: PricingPlan;
  isPopular?: boolean;
  affiliateLink: string;
  hasFreeTrial: boolean;
  previousPlanName?: string; // For "Everything in X" feature
}

export default function PricingCard({ 
  plan, 
  isPopular = false, 
  affiliateLink,
  hasFreeTrial,
  previousPlanName
}: PricingCardProps) {
  const isEnterprise = plan.price.toLowerCase() === 'custom' || plan.price.toLowerCase() === 'contact';
  const isFree = plan.price.toLowerCase() === 'free';
  
  // Split features into "What's included" (first 6) and "Key features" (rest)
  // Use features if available, otherwise fallback to detailed_features or empty array
  const allFeatures = plan.features || plan.detailed_features || [];
  const whatsIncluded = allFeatures.slice(0, 6);
  const keyFeatures = allFeatures.slice(6);

  return (
    <div className={`relative bg-white rounded-2xl border-2 ${isPopular ? 'border-indigo-500 shadow-xl md:scale-105' : 'border-gray-200 shadow-lg'} overflow-hidden flex flex-col h-full transition-transform`}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold py-2 px-4 text-center z-10">
          Best Value +
        </div>
      )}

      <div className={`p-6 ${isPopular ? 'pt-12' : ''} flex flex-col flex-1`}>
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{plan.description}</p>
          
          {/* Price */}
          <div className="mb-6">
            {isEnterprise ? (
              <div className="text-3xl font-bold text-gray-900">Let&apos;s Talk</div>
            ) : (
              <>
                <div className="text-5xl font-extrabold text-gray-900 leading-tight">
                  {plan.price}
                  {!isFree && <span className="text-2xl font-semibold text-gray-600">{plan.period}</span>}
                </div>
              </>
            )}
          </div>

          {/* CTA Button */}
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`block w-full py-3.5 px-6 rounded-lg font-bold text-base text-center transition-all duration-200 ${
              isPopular
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                : isEnterprise
                ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                : isFree
                ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            {plan.btn_text || (isEnterprise ? 'Contact Us' : 'Get Started')}
          </a>
        </div>

        {/* What's Included */}
        {whatsIncluded.length > 0 && (
          <div className="mb-6 flex-1">
            <h4 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider">What&apos;s included</h4>
            <ul className="space-y-3">
              {whatsIncluded.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700 leading-relaxed">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="flex-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Features */}
        {keyFeatures.length > 0 && (
          <div className="border-t border-gray-200 pt-6 mt-auto">
            <h4 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider">
              {previousPlanName ? `Everything in ${previousPlanName} plus:` : 'Key features'}
            </h4>
            <ul className="space-y-3">
              {keyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700 leading-relaxed">
                  <svg className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="flex-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


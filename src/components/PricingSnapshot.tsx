'use client';

import Link from 'next/link';
import { PricingPlan } from '@/types/tool';

interface PricingSnapshotProps {
  plans: PricingPlan[];
  affiliateLink: string;
  toolSlug: string;
}

export default function PricingSnapshot({ plans, affiliateLink, toolSlug }: PricingSnapshotProps) {
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">Pricing information coming soon.</p>
      </div>
    );
  }

  // Only show top 3 plans
  const topPlans = plans.slice(0, 3);

  // Format price for display
  const formatPrice = (plan: PricingPlan): string => {
    if (!plan.price) return 'N/A';
    const isEnterprise = plan.price.toLowerCase() === 'custom' || plan.price.toLowerCase() === 'contact';
    const isFree = plan.price.toLowerCase() === 'free';
    
    if (isEnterprise) return "Let's Talk";
    if (isFree) return '$0/mo';
    return `${plan.price}${plan.period || '/mo'}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Plan
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Price
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Best For
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {topPlans.map((plan, index) => (
            <tr
              key={plan.name}
              className={`hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <td className="px-4 py-3">
                <span className="font-semibold text-gray-900">{plan.name}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600">{formatPrice(plan)}</span>
              </td>
              <td className="hidden md:table-cell px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {plan.description || 'General use'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <a
                  href={affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Visit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Footer with link to full pricing */}
      {plans.length > 3 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <Link
            href={`/tool/${toolSlug}/pricing`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View full pricing details →
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

interface BillingToggleProps {
  onBillingChange: (billing: 'monthly' | 'yearly') => void;
  defaultBilling?: 'monthly' | 'yearly';
  yearlyDiscount?: number; // Percentage discount for yearly (e.g., 40 for 40%)
}

export default function BillingToggle({ 
  onBillingChange, 
  defaultBilling = 'monthly',
  yearlyDiscount 
}: BillingToggleProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(defaultBilling);

  const handleChange = (newBilling: 'monthly' | 'yearly') => {
    setBilling(newBilling);
    onBillingChange(newBilling);
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1 border border-gray-200">
        <button
          type="button"
          onClick={() => handleChange('monthly')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            billing === 'monthly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => handleChange('yearly')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 relative ${
            billing === 'yearly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Yearly
          {yearlyDiscount && billing === 'monthly' && (
            <span className="ml-2 text-green-600 text-xs font-normal">⚡ {yearlyDiscount}% off</span>
          )}
        </button>
      </div>
    </div>
  );
}

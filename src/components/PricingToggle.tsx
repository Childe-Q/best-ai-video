'use client';

import { useState } from 'react';

export default function PricingToggle() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
        Monthly
      </span>
      <button
        type="button"
        onClick={() => setIsYearly(!isYearly)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isYearly ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={isYearly}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            isYearly ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
        Yearly <span className="text-green-600 font-bold">-20% off</span>
      </span>
    </div>
  );
}


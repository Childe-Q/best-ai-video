'use client';

import type { ProductizedPricingUsageGroup } from '@/lib/pricing/productPageOverrides';

interface UsageNotes {
  bullets: string[];
  tip: string;
}

interface PricingUsageExplainerProps {
  title?: string;
  toolName?: string;
  usageNotes: UsageNotes; // Pre-computed on server to avoid hydration mismatch (required)
  groups?: ProductizedPricingUsageGroup[];
}

export default function PricingUsageExplainer({ 
  title, 
  toolName,
  usageNotes,
  groups
}: PricingUsageExplainerProps) {
  
  return (
    <div id="usage" className="mb-16 bg-white rounded-2xl border-2 border-gray-200 p-6 md:p-8 scroll-mt-32">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {title || "How usage works"}
      </h2>
      <ul className="text-sm text-gray-700 space-y-3 mb-6">
        {usageNotes.bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-gray-400 font-bold mt-0.5">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {groups && groups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {groups.map((group) => (
            <div key={group.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2">{group.title}</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {group.bullets.map((bullet, idx) => (
                  <li key={`${group.title}-${idx}`} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
        <p className="text-sm font-medium text-gray-900">
          <span className="font-bold text-blue-700">Tip:</span> {usageNotes.tip}
        </p>
      </div>
    </div>
  );
}

'use client';

interface PricingSnapshotProps {
  plans: Array<{
    name: string;
    bullets: string[];
  }>;
  note?: string;
  recommendations?: Array<{
    planName: string;
    reason: string;
    planSlug: string;
  }>;
}

export default function PricingSnapshot({ plans, note, recommendations }: PricingSnapshotProps) {

  if (!plans || plans.length === 0) return null;

  const gridCols = plans.length === 2 
    ? 'md:grid-cols-2' 
    : plans.length === 3 
    ? 'md:grid-cols-3' 
    : 'md:grid-cols-4';

  const handleRecommendationClick = (planSlug: string) => {
    const element = document.getElementById(planSlug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Trigger highlight event
      const highlightEvent = new CustomEvent('highlight');
      element.dispatchEvent(highlightEvent);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Snapshot</h2>
      
      {/* Recommendations pills */}
      {recommendations && recommendations.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {recommendations.map((rec, idx) => (
            <button
              key={idx}
              onClick={() => handleRecommendationClick(rec.planSlug)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              <span className="font-semibold text-gray-900">{rec.planName}</span>
              <span className="text-gray-500">—</span>
              <span>{rec.reason}</span>
            </button>
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 ${gridCols} gap-4 mb-4`}>
        {plans.map((plan, idx) => (
          <div 
            key={idx} 
            className={`border-2 ${idx === 1 ? 'border-black bg-indigo-50/30' : 'border-black'} rounded-xl p-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] transition-all duration-200`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {plan.bullets.map((bullet, bulletIdx) => (
                <li key={bulletIdx} className="list-disc list-inside">{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {note && (
        <p className="text-xs text-gray-500 text-center">
          {note}
        </p>
      )}
    </div>
  );
}

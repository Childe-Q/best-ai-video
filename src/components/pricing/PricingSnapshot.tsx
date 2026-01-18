interface PricingSnapshotProps {
  plans: Array<{
    name: string;
    bullets: string[];
  }>;
  note?: string;
}

export default function PricingSnapshot({ plans, note }: PricingSnapshotProps) {
  if (!plans || plans.length === 0) return null;

  const gridCols = plans.length === 2 
    ? 'md:grid-cols-2' 
    : plans.length === 3 
    ? 'md:grid-cols-3' 
    : 'md:grid-cols-4';

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Snapshot</h2>
      <div className={`grid grid-cols-1 ${gridCols} gap-4 mb-4`}>
        {plans.map((plan, idx) => (
          <div 
            key={idx} 
            className={`border-2 ${idx === 1 ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'} rounded-xl p-4`}
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

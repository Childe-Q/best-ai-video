import PlanBadge from './PlanBadge';

interface CommonPaidFeaturesProps {
  features: Array<{ text: string; badge?: string }>;
}

export default function CommonPaidFeatures({ features }: CommonPaidFeaturesProps) {
  if (!features || features.length === 0) return null;

  return (
    <div className="mb-12 bg-gray-50 rounded-xl border-2 border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Included in all paid plans</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-green-600 font-bold">✓</span>
            <span className="font-medium">{feature.text}</span>
            {feature.badge && (
              <PlanBadge variant="feature" className="ml-2 uppercase">
                {feature.badge}
              </PlanBadge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

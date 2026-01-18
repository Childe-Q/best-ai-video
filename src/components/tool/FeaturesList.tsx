interface FeaturesListProps {
  features: string[];
  maxItems?: number;
}

export default function FeaturesList({ features, maxItems = 10 }: FeaturesListProps) {
  if (!features || features.length === 0) return null;

  const displayFeatures = features.slice(0, maxItems);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
      <ul className="space-y-3">
        {displayFeatures.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-gray-700">
            <span className="text-indigo-600 font-bold shrink-0 mt-1">•</span>
            <span className="leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

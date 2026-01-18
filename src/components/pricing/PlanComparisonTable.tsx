interface PlanComparisonTableProps {
  freePlanFeatures: Array<{ feature: string; value: string }>;
  paidPlanFeatures: Array<{ feature: string; value: string }>;
}

export default function PlanComparisonTable({ 
  freePlanFeatures, 
  paidPlanFeatures 
}: PlanComparisonTableProps) {
  // Merge features from both plans to create a unified table
  const allFeatures = new Set<string>();
  freePlanFeatures.forEach(f => allFeatures.add(f.feature));
  paidPlanFeatures.forEach(f => allFeatures.add(f.feature));
  
  const features = Array.from(allFeatures);

  if (features.length === 0) {
    // Default comparison if no data provided
    return (
      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Free vs Paid Plan</h2>
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden max-w-4xl mx-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-blue-50/50 border-b-2 border-gray-200">
                <th className="p-6 text-sm font-bold text-gray-500 w-1/3">Feature</th>
                <th className="p-6 text-sm font-bold text-gray-900 w-1/3 border-l-2 border-gray-200">Free</th>
                <th className="p-6 text-sm font-bold text-indigo-600 w-1/3 border-l-2 border-gray-200 bg-indigo-50/30">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100">
              <tr>
                <td className="p-6 text-sm text-gray-700 font-medium">Watermark</td>
                <td className="p-6 text-sm text-gray-900 font-medium border-l-2 border-gray-100">Yes</td>
                <td className="p-6 text-sm text-indigo-600 font-bold border-l-2 border-gray-100 bg-indigo-50/10">No</td>
              </tr>
              <tr>
                <td className="p-6 text-sm text-gray-700 font-medium">Export Quality</td>
                <td className="p-6 text-sm text-gray-900 font-medium border-l-2 border-gray-100">720p / 1080p (varies by plan)</td>
                <td className="p-6 text-sm text-indigo-600 font-bold border-l-2 border-gray-100 bg-indigo-50/10">1080p / 4K</td>
              </tr>
              <tr>
                <td className="p-6 text-sm text-gray-700 font-medium">Usage Limits</td>
                <td className="p-6 text-sm text-gray-900 font-medium border-l-2 border-gray-100">Limited minutes/exports per period</td>
                <td className="p-6 text-sm text-indigo-600 font-bold border-l-2 border-gray-100 bg-indigo-50/10">Higher limits based on plan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Free vs Paid Plan</h2>
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden max-w-4xl mx-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-blue-50/50 border-b-2 border-gray-200">
              <th className="p-6 text-sm font-bold text-gray-500 w-1/3">Feature</th>
              <th className="p-6 text-sm font-bold text-gray-900 w-1/3 border-l-2 border-gray-200">Free</th>
              <th className="p-6 text-sm font-bold text-indigo-600 w-1/3 border-l-2 border-gray-200 bg-indigo-50/30">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-100">
            {features.map((feature, idx) => {
              const freeValue = freePlanFeatures.find(f => f.feature === feature)?.value || '—';
              const paidValue = paidPlanFeatures.find(f => f.feature === feature)?.value || '—';
              
              return (
                <tr key={idx}>
                  <td className="p-6 text-sm text-gray-700 font-medium">{feature}</td>
                  <td className="p-6 text-sm text-gray-900 font-medium border-l-2 border-gray-100">{freeValue}</td>
                  <td className="p-6 text-sm text-indigo-600 font-bold border-l-2 border-gray-100 bg-indigo-50/10">{paidValue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

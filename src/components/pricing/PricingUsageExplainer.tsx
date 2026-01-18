interface PricingUsageExplainerProps {
  title?: string;
  bullets?: string[];
  // Fallback: generate from plans if no bullets provided
  pricingPlans?: Array<{
    name: string;
    featureItems?: Array<{ text: string }>;
  }>;
}

export default function PricingUsageExplainer({ 
  title, 
  bullets,
  pricingPlans 
}: PricingUsageExplainerProps) {
  // If no data provided, show placeholder
  if (!bullets || bullets.length === 0) {
    // Try to generate generic bullets from plans
    const hasCredits = pricingPlans?.some(p => 
      p.featureItems?.some(f => f.text.toLowerCase().includes('credit'))
    );
    const hasMinutes = pricingPlans?.some(p => 
      p.featureItems?.some(f => f.text.toLowerCase().includes('minute'))
    );
    
    const defaultBullets = [
      hasCredits 
        ? "Generating a video consumes credits from your quota"
        : hasMinutes
        ? "Generating a video consumes minutes from your quota"
        : "Generating a video consumes credits or minutes from your quota",
      "Re-generating or regenerating after edits also consumes credits/minutes",
      "Heavy iteration (multiple revisions, scene swaps) can burn through usage quickly",
      "Exporting itself typically doesn't consume credits, but the generation process does"
    ];
    
    bullets = defaultBullets;
  }

  // Filter out [NEED VERIFICATION] bullets or replace with placeholder
  const processedBullets = bullets.map(bullet => {
    if (bullet.includes('[NEED VERIFICATION]')) {
      return bullet.replace('[NEED VERIFICATION]', 'Needs verification');
    }
    return bullet;
  });

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {title || "How credits/minutes get used (what surprises people)"}
      </h2>
      <ul className="text-sm text-gray-700 space-y-2">
        {processedBullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

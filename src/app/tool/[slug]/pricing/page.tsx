import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import PricingCardsGrid from '@/components/PricingCardsGrid';
import CTAButton from '@/components/CTAButton';
import { getSEOCurrentYear, hasFreePlan, getStartingPrice } from '@/lib/utils';

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();

  return {
    title: `${tool.name} Plans & Pricing ${seoYear}`,
    description: `Choose a plan that fits best for ${tool.name}. Compare pricing, features, and find the perfect plan for your needs.`,
  };
}

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  const seoYear = getSEOCurrentYear();
  const pricingPlans = tool.pricing_plans || [];

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24">
        <main className="py-8">
        
        {/* 1. Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {tool.name} Plans & Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose a plan that fits best now and join thousands of happy users who have saved more than 80% on time and costs by creating videos with {tool.name}.
          </p>
        </div>

        {/* 2. Pricing Cards Grid */}
        <div className="mb-0">
          {pricingPlans.length > 0 ? (
            <PricingCardsGrid 
              plans={pricingPlans} 
              affiliateLink={tool.affiliate_link}
              hasFreeTrial={tool.has_free_trial}
            />
          ) : (
            <div className="bg-white rounded-xl p-8 text-center mb-12">
              <p className="text-gray-500">Pricing information coming soon.</p>
            </div>
          )}
        </div>

        {/* Elegant Spacing - Pure Whitespace (connected but airy feel) */}
        {pricingPlans.length > 0 && (
          <div className={pricingPlans.length > 3 ? "mt-16" : "mt-16"}></div>
        )}

        {/* 4. Free vs Paid Plan Comparison Table */}
        {pricingPlans.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Free vs Paid Plan</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-blue-50/50 border-b border-gray-200">
                    <th className="p-6 text-sm font-bold text-gray-500 w-1/3">Feature</th>
                    <th className="p-6 text-sm font-bold text-gray-900 w-1/3 border-l border-gray-200">Free</th>
                    <th className="p-6 text-sm font-bold text-indigo-600 w-1/3 border-l border-gray-200 bg-indigo-50/30">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-6 text-sm text-gray-700 font-medium">Watermark</td>
                    <td className="p-6 text-sm text-gray-900 font-medium border-l border-gray-100">Yes</td>
                    <td className="p-6 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">No</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm text-gray-700 font-medium">Export Quality</td>
                    <td className="p-6 text-sm text-gray-900 font-medium border-l border-gray-100">720p</td>
                    <td className="p-6 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">1080p / 4K</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm text-gray-700 font-medium">Storage</td>
                    <td className="p-6 text-sm text-gray-900 font-medium border-l border-gray-100">Limited</td>
                    <td className="p-6 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">High / Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. Verdict / Recommendation */}
        <section className="bg-indigo-50 rounded-xl p-8 border border-indigo-100 text-center max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            Is {tool.name} worth {getStartingPrice(tool)}?
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed text-base md:text-lg">
            If you are serious about {tool.best_for.toLowerCase()}, then <strong>yes</strong>. The time saved by its AI features justifies the monthly cost. 
            {hasFreePlan(tool) ? ' Plus, you can start for free to test it out.' : ' Plus, the free trial lets you test it risk-free.'}
          </p>
          <CTAButton affiliateLink={tool.affiliate_link} hasFreeTrial={tool.has_free_trial} />
        </section>

        {/* 6. Footer Note */}
        <div className="text-center text-sm text-gray-500 mt-8">
          *Prices subject to change. Check official site for most up-to-date pricing.
        </div>

        </main>
      </div>
    </section>
  );
}


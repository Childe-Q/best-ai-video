import Link from 'next/link';
import { notFound } from 'next/navigation';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import CTAButton from '@/components/CTAButton';
import ToolNav from '@/components/ToolNav';

const tools: Tool[] = toolsData as Tool[];

function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export async function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  return {
    title: `${tool.name} Pricing 2025: Is It Free?`,
    description: `Complete guide to ${tool.name} pricing. Is it free? How much does it cost? Compare free vs paid plans.`,
  };
}

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-sm">
           <Link href={`/tool/${tool.slug}`} className="text-gray-500 hover:text-indigo-600">
             ← Back to Review
           </Link>
        </div>
      </nav>

      <ToolNav toolSlug={tool.slug} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* 1. Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
            {tool.name} Pricing 2025: Is It Free?
          </h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about {tool.name}'s cost and plans.
          </p>
        </div>

        {/* 2. Pricing Card (Core) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden text-center relative">
          {tool.pricing.free_plan && (
            <div className="bg-green-100 text-green-800 text-sm font-bold py-2 uppercase tracking-wide">
              Free Plan Available
            </div>
          )}
          <div className="p-8 md:p-12">
            <div className="text-sm font-bold text-gray-400 uppercase mb-2">Starting At</div>
            <div className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-2">
              {tool.pricing.currency}{tool.pricing.starting_price}
              <span className="text-xl text-gray-500 font-medium ml-1">/mo</span>
            </div>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Simple pricing for {tool.best_for}. No hidden fees.
            </p>
            <CTAButton affiliateLink={`/go/${tool.slug}`} hasFreeTrial={tool.has_free_trial} size="lg" className="w-full md:w-auto" />
            <p className="text-xs text-gray-400 mt-4">Prices subject to change. Check official site.</p>
          </div>
        </div>

        {/* 3. Comparison Table (Mock) */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Free vs Paid Plan</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-sm font-bold text-gray-500 w-1/3">Feature</th>
                  <th className="p-4 text-sm font-bold text-gray-900 w-1/3 border-l border-gray-200">Free</th>
                  <th className="p-4 text-sm font-bold text-indigo-600 w-1/3 border-l border-gray-200 bg-indigo-50/30">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-4 text-sm text-gray-700">Watermark</td>
                  <td className="p-4 text-sm text-gray-900 font-medium border-l border-gray-100">Yes</td>
                  <td className="p-4 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">No</td>
                </tr>
                <tr>
                  <td className="p-4 text-sm text-gray-700">Export Quality</td>
                  <td className="p-4 text-sm text-gray-900 font-medium border-l border-gray-100">720p</td>
                  <td className="p-4 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">1080p / 4K</td>
                </tr>
                 <tr>
                  <td className="p-4 text-sm text-gray-700">Storage</td>
                  <td className="p-4 text-sm text-gray-900 font-medium border-l border-gray-100">Limited</td>
                  <td className="p-4 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">High / Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Verdict */}
        <section className="bg-indigo-50 rounded-xl p-8 border border-indigo-100 text-center">
           <h2 className="text-xl font-bold text-gray-900 mb-3">Is {tool.name} worth {tool.pricing.currency}{tool.pricing.starting_price}?</h2>
           <p className="text-gray-700 mb-6 leading-relaxed">
             If you are serious about {tool.best_for.toLowerCase()}, then <strong>yes</strong>. The time saved by its AI features justifies the monthly cost. 
             {tool.pricing.free_plan ? ' Plus, you can start for free to test it out.' : ' Plus, the free trial lets you test it risk-free.'}
           </p>
           <CTAButton affiliateLink={`/go/${tool.slug}`} hasFreeTrial={tool.has_free_trial} />
        </section>

      </main>
    </div>
  );
}


import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';

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
    title: `${tool.name} Features & Capabilities (${seoYear})`,
    description: `Explore all features and capabilities of ${tool.name}. See what makes it stand out and who it's best for.`,
  };
}

export default async function FeaturesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24 space-y-8">
        {/* Key Features */}
        {tool.features && tool.features.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tool.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-700">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards (if available) */}
        {tool.featureCards && tool.featureCards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tool.featureCards.map((card: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.description}</p>
                  {card.href && (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block"
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Who is Using (Target Audience) */}
        {tool.target_audience_list && tool.target_audience_list.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Who is Using {tool.name}?</h2>
            <div className="flex flex-wrap gap-2">
              {tool.target_audience_list.map((audience, idx) => (
                <span 
                  key={idx}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  {audience}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

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
    <div className="min-h-screen bg-[#F9FAFB] pb-24 font-sans">
      {/* Hero Section */}
      <header className="bg-white border-b border-gray-200 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            {tool.name} Features
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
            {slug === 'invideo' 
              ? "Prompt-to-video with built-in stock, captions, and voice. Fast drafts, but usage limits matter."
              : tool.tagline || `Everything you need to know about ${tool.name}'s capabilities.`}
          </p>
          
          {/* Key Takeaways (InVideo-specific) */}
          {slug === 'invideo' && (
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span className="mr-1.5">✓</span>
                Built for: faceless Shorts + quick social drafts
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-800 border border-orange-200">
                <span className="mr-1.5">⚠</span>
                Watch for: credits/minutes can drop fast when you iterate
              </div>
            </div>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {slug === 'invideo' ? (
              <>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Prompt-to-Video
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Stock Assets
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Auto Captions
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Usage Limits
                </span>
              </>
            ) : (
              tool.tags && tool.tags.length > 0 && tool.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {tag}
                </span>
              ))
            )}
          </div>
          
          {/* Anchor link to deep dives */}
          {tool.feature_groups && tool.feature_groups.length > 0 && (
            <a 
              href="#feature-deep-dives" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Jump to deep dives ↓
            </a>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Key Features (Chips/Grid) */}
        {tool.features && tool.features.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Key Capabilities</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tool.features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors group"
                >
                  <div className="flex-shrink-0 h-2 w-2 rounded-full bg-indigo-500 mr-3 group-hover:scale-125 transition-transform"></div>
                  <span className="text-sm font-medium text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feature Deep Dives */}
        {tool.feature_groups && tool.feature_groups.length > 0 ? (
          <section id="feature-deep-dives">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Feature Deep Dives</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tool.feature_groups.map((group: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col h-full hover:shadow-md transition-shadow duration-200"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{group.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed border-b border-gray-100 pb-4">
                    {group.summary}
                  </p>
                  <ul className="space-y-3 flex-1">
                    {group.bullets.map((bullet: string, bIdx: number) => {
                      const isVerificationNeeded = bullet.includes('[NEED VERIFICATION]');
                      const cleanBullet = bullet.replace('[NEED VERIFICATION]', '').trim();
                      
                      return (
                        <li key={bIdx} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2.5">
                          <span className="text-indigo-500 mt-1.5 font-bold text-[10px]">●</span>
                          <span>
                            {cleanBullet}
                            {isVerificationNeeded && (
                              <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                                Verification needed
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* Fallback if no feature_groups (using featureCards for Detailed Features) */
          tool.featureCards && tool.featureCards.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detailed Features</h2>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tool.featureCards.map((card: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )
        )}

        {/* Extra Utilities (Accordion) - Only if feature_groups exists (to avoid duplication if fallback used featureCards) */}
        {tool.feature_groups && tool.featureCards && tool.featureCards.length > 0 && (
          <section>
            <details className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                <span className="text-lg font-bold text-gray-900">Additional Utilities</span>
                <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 border-t border-gray-100 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                  {tool.featureCards.map((card: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{card.title}</h4>
                      {/* Truncate description for utilities */}
                      <p className="text-xs text-gray-500 line-clamp-2">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </section>
        )}

        {/* Who it's best for */}
        {(() => {
          // InVideo-specific audience segments
          const invideoAudiences = slug === 'invideo' 
            ? [
                'Faceless YouTube Shorts creators',
                'Social media managers (high volume)',
                'Small marketing teams (ads & promos)'
              ]
            : tool.target_audience_list || [];
          
          if (invideoAudiences.length === 0) return null;
          
          return (
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Who it's best for</h2>
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                {invideoAudiences.map((audience, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white text-slate-900 border border-gray-300 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 hover:text-slate-900 transition-colors duration-200"
                  >
                    {audience}
                  </span>
                ))}
              </div>
              {slug === 'invideo' && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Based on pricing limits + user reports (credits burn on edits).
                </p>
              )}
            </section>
          );
        })()}
      </main>
    </div>
  );
}
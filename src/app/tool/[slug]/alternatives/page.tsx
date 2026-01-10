import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTool, getAllTools, findBestAlternatives } from '@/lib/getTool';
import CTAButton from '@/components/CTAButton';
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
    title: `Top 3 ${tool.name} Alternatives & Competitors (${seoYear})`,
    description: `Looking for better than ${tool.name}? Here are the 3 best alternatives for features, pricing, and ease of use.`,
  };
}

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  // Use weighted matching to find top 3 alternatives
  const tools = getAllTools();
  const alternativesWithTags = findBestAlternatives(tool, tools, 3);

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24">
        <main className="max-w-3xl mx-auto space-y-12">
        
        {/* 1. Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            Top 3 Alternatives to {tool.name} You Should Try
          </h1>
          <p className="text-xl text-gray-600">
             Is {tool.name} too expensive or hard to use? Check out these top competitors.
          </p>
        </div>

        {/* 2. Alternatives List */}
        <div className="space-y-8">
           {alternativesWithTags.map(({ tool: alt, sharedTags }) => {
             // Pick the first matching tag to display as the reason
             const bestTag = sharedTags.length > 0 ? sharedTags[0] : null;
             
             return (
               <div key={alt.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                  <div className="p-6 md:p-8 flex-1">
                     <div className="flex items-center gap-4 mb-4">
                        {(() => {
                          const logoSrc = alt.logo_url || (alt as any).logoUrl || (alt as any).logo || (alt as any).image_url || (alt as any).imageUrl || (alt as any).icon_url || (alt as any).iconUrl;
                          return (
                            <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                              {logoSrc ? (
                                <Image
                                  src={logoSrc}
                                  alt={`${alt.name} logo`}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-contain"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-slate-700 font-semibold">{alt.name?.slice(0, 1) ?? '?'}</span>
                              )}
                            </div>
                          );
                        })()}
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{alt.name}</h2>
                          <div className="text-sm text-gray-500">{alt.starting_price}</div>
                        </div>
                     </div>
                     <p className="text-gray-600 mb-6">
                       {alt.short_description}
                     </p>
                     
                     {/* 3. Why Section with Shared Tag Badge */}
                     {bestTag && (
                       <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
                         <p className="text-sm text-yellow-800 font-medium">
                           <strong>Best for {bestTag}:</strong> {alt.name} shares the same {bestTag.toLowerCase()} capabilities as {tool.name}.
                         </p>
                       </div>
                     )}

                     <CTAButton affiliateLink={alt.affiliate_link} hasFreeTrial={alt.has_free_trial} />
                  </div>
               </div>
             );
           })}
        </div>

        {/* Bottom Section */}
        <div className="text-center pt-8 border-t border-gray-200">
           <h3 className="text-lg font-bold text-gray-900 mb-4">Still not sure?</h3>
           <p className="text-gray-600 mb-6">
             Stick with the market leader if you want stability.
           </p>
           <Link href={`/tool/${tool.slug}`} className="text-indigo-600 font-bold hover:underline">
             Read full {tool.name} Review →
           </Link>
        </div>

        </main>
      </div>
    </section>
  );
}


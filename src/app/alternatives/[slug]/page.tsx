import Link from 'next/link';
import { notFound } from 'next/navigation';
import toolsData from '@/data/tools.json';
import alternativesData from '@/data/alternatives.json';
import { Tool, AlternativePageData } from '@/types/tool';

const tools: Tool[] = toolsData as Tool[];
const altPages: AlternativePageData[] = alternativesData as AlternativePageData[];

// Helper to get tool details
function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

// Helper to get page data
function getAltPage(slug: string): AlternativePageData | undefined {
  return altPages.find((p) => p.slug === slug);
}

export async function generateStaticParams() {
  return altPages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getAltPage(slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.subtitle,
  };
}

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getAltPage(slug);

  if (!page) {
    notFound();
  }

  const targetTool = getTool(page.target_tool_slug);
  
  // Resolve Top Pick Tools
  const bestOverall = getTool(page.top_picks.best_overall);
  const bestValue = getTool(page.top_picks.best_value);
  const bestSpecific = getTool(page.top_picks.best_specific);

  // Resolve Comparison Table Tools
  const comparisonTools = page.comparison_table.headers
    .map(slug => getTool(slug))
    .filter((t): t is Tool => t !== undefined);

  // Resolve List Tools
  const listTools = page.alternatives_list
    .map(slug => getTool(slug))
    .filter((t): t is Tool => t !== undefined);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      
      {/* 1. Header & Hero */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <nav className="flex justify-center mb-6">
            <Link href="/" className="text-indigo-600 font-medium hover:text-indigo-800 text-sm">
              ← Back to Home
            </Link>
          </nav>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            {page.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {page.subtitle}
          </p>
          <div className="text-sm text-gray-400 font-medium">
            Last Updated: {page.updated_at} • Independent Review
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* 2. Top Picks Summary (The "Quick Answer") */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Answer: Top Picks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pick 1: Best Overall */}
            {bestOverall && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-600 p-6 relative flex flex-col">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Best Overall
                </div>
                <div className="text-center mb-4 mt-2">
                  <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl mx-auto mb-3">
                    {bestOverall.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{bestOverall.name}</h3>
                  <div className="text-sm text-gray-500">{bestOverall.starting_price}</div>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2">✓ No editing skills needed</li>
                  <li className="flex items-center gap-2">✓ Huge stock library</li>
                </ul>
                <a href={bestOverall.affiliate_link} target="_blank" rel="nofollow noopener noreferrer" referrerPolicy="no-referrer" className="block text-center bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
                  Try {bestOverall.name}
                </a>
              </div>
            )}

            {/* Pick 2: Best Value */}
            {bestValue && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative flex flex-col hover:border-indigo-300 transition-colors">
                 <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Best Value
                </div>
                <div className="text-center mb-4 mt-2">
                  <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 font-bold text-xl mx-auto mb-3">
                    {bestValue.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{bestValue.name}</h3>
                   <div className="text-sm text-gray-500">{bestValue.starting_price}</div>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-1">
                   <li className="flex items-center gap-2">✓ Cheapest paid plan</li>
                   <li className="flex items-center gap-2">✓ Generous free tier</li>
                </ul>
                <a href={bestValue.affiliate_link} target="_blank" rel="nofollow noopener noreferrer" referrerPolicy="no-referrer" className="block text-center bg-white border border-indigo-600 text-indigo-600 py-2 rounded-lg font-bold hover:bg-indigo-50 transition">
                  Try {bestValue.name}
                </a>
              </div>
            )}

            {/* Pick 3: Best Specific */}
            {bestSpecific && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative flex flex-col hover:border-indigo-300 transition-colors">
                 <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  {page.top_picks.specific_label}
                </div>
                <div className="text-center mb-4 mt-2">
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xl mx-auto mb-3">
                    {bestSpecific.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{bestSpecific.name}</h3>
                   <div className="text-sm text-gray-500">{bestSpecific.starting_price}</div>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-1">
                   <li className="flex items-center gap-2">✓ Best AI Avatars</li>
                   <li className="flex items-center gap-2">✓ 40+ Languages</li>
                </ul>
                 <a href={bestSpecific.affiliate_link} target="_blank" rel="nofollow noopener noreferrer" referrerPolicy="no-referrer" className="block text-center bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 transition">
                  Try {bestSpecific.name}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* 3. Comparison Table */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">InVideo vs Competitors: At a Glance</h2>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider w-1/4">Feature</th>
                  <th className="p-4 text-sm font-bold text-gray-900 w-1/5 bg-indigo-50/50 border-x border-indigo-100">
                    {targetTool?.name}
                  </th>
                  {comparisonTools.map(tool => (
                    <th key={tool.id} className="p-4 text-sm font-bold text-gray-900 w-1/5 border-l border-gray-100">
                      {tool.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {page.comparison_table.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-600">{row.feature}</td>
                    <td className="p-4 text-sm font-bold text-gray-900 bg-indigo-50/30 border-x border-indigo-50">
                      {row.target_tool_value}
                    </td>
                    {comparisonTools.map(tool => (
                      <td key={tool.id} className="p-4 text-sm text-gray-700 border-l border-gray-100">
                        {String(row.others[tool.slug] || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Review Links Row */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="p-4"></td>
                  <td className="p-4 text-center border-x border-indigo-100 bg-indigo-50/50">
                    <span className="text-xs text-gray-400">Current Tool</span>
                  </td>
                  {comparisonTools.map(tool => (
                    <td key={tool.id} className="p-4 text-center border-l border-gray-100">
                      <Link href={`/tool/${tool.slug}`} className="text-xs font-bold text-indigo-600 hover:underline">
                        Read Review
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Deep Dive List */}
        <section className="space-y-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Detailed Breakdown of Best Alternatives</h2>
          
          {listTools.map((tool, index) => (
            <div key={tool.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id={tool.slug}>
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                
                {/* Left: Tool Info */}
                <div className="md:w-1/3 flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 font-bold text-2xl">
                      {tool.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {index + 1}. {tool.name}
                      </h3>
                      <div className="text-yellow-500 text-sm font-medium">
                        {'★'.repeat(Math.round(tool.rating))} {tool.rating}/5
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-6 flex-1">
                    {tool.short_description}
                  </p>
                  <div className="mt-auto">
                    <div className="text-sm font-bold text-gray-900 mb-1">{tool.starting_price}</div>
                    <div className="text-xs text-gray-500 mb-4">{tool.pricing_model}</div>
                    <a 
                      href={tool.affiliate_link}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="block w-full text-center bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md"
                    >
                      Visit Website
                    </a>
                     <Link href={`/tool/${tool.slug}`} className="block w-full text-center text-sm text-gray-500 mt-3 hover:text-gray-900">
                      Read Full Review
                    </Link>
                  </div>
                </div>

                {/* Right: Analysis */}
                <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-gray-100 md:pl-8 pt-6 md:pt-0">
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Why it's a great alternative</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {/* Using the tagline as a proxy for 'why' for MVP. In real app, add a specific field. */}
                      {tool.name} is a strong competitor because it offers {tool.features.join(', ')}. 
                      Compared to {targetTool?.name}, users often find it better for {tool.pros[0].toLowerCase()}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-green-700 uppercase mb-2">Pros</h4>
                      <ul className="space-y-1">
                        {tool.pros.slice(0, 3).map((p, i) => (
                           <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                             <span className="text-green-500 font-bold">✓</span> {p}
                           </li>
                        ))}
                      </ul>
                    </div>
                     <div>
                      <h4 className="text-xs font-bold text-red-700 uppercase mb-2">Cons</h4>
                      <ul className="space-y-1">
                        {tool.cons.slice(0, 2).map((c, i) => (
                           <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                             <span className="text-red-500 font-bold">✕</span> {c}
                           </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 5. FAQ */}
        <section className="bg-gray-50 rounded-2xl p-8 border border-gray-200 mt-16">
           <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Questions</h2>
           <div className="space-y-6">
             {page.faqs.map((faq, idx) => (
               <div key={idx}>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                 <p className="text-gray-600">{faq.answer}</p>
               </div>
             ))}
           </div>
        </section>

      </main>
    </div>
  );
}

import { permanentRedirect } from 'next/navigation';
import { getTool } from '@/lib/getTool';

/**
 * Redirect /alternatives/[slug] to /tool/[slug]/alternatives
 * Canonical URL is /tool/{slug}/alternatives
 */
export async function generateStaticParams() {
  const { getAllTools } = await import('@/lib/getTool');
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export default async function AlternativesRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  
  if (!tool) {
    // If tool doesn't exist, redirect to 404 via notFound
    const { notFound } = await import('next/navigation');
    notFound();
  }

  // 301 permanent redirect to canonical URL
  permanentRedirect(`/tool/${slug}/alternatives`);
}

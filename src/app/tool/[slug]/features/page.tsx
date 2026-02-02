import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';
import ToolFeaturesPageTemplate from '@/components/features/ToolFeaturesPageTemplate';

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
    alternates: {
      canonical: `/tool/${slug}/features`,
    },
  };
}

export default async function FeaturesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  return <ToolFeaturesPageTemplate tool={tool} slug={slug} />;
}

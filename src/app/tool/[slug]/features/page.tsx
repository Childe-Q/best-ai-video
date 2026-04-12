import { notFound } from 'next/navigation';
import { getAllTools, getToolBySlug } from '@/lib/toolData';
import { getSEOCurrentYear } from '@/lib/utils';
import ToolFeaturesPageTemplate from '@/components/features/ToolFeaturesPageTemplate';
import { isFeaturePageThinBySlug } from '@/lib/features/isFeaturePageThin';

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug)?.tool;
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();
  const thin = isFeaturePageThinBySlug(tool, slug);

  return {
    title: `${tool.name} Features & Capabilities (${seoYear})`,
    description: `Explore all features and capabilities of ${tool.name}. See what makes it stand out and who it's best for.`,
    alternates: {
      canonical: `/tool/${slug}/features`,
    },
    ...(thin
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}

export default async function FeaturesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug)?.tool;

  if (!tool) notFound();

  return <ToolFeaturesPageTemplate tool={tool} slug={slug} />;
}

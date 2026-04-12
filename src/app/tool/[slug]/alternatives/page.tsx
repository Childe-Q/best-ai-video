import { notFound } from 'next/navigation';
import { getAllTools, getToolBySlug } from '@/lib/toolData';
import AlternativesLongformTemplate from '@/components/alternatives/longform/AlternativesLongformTemplate';
import {
  buildToolAlternativesLongformData,
  isAlternativesPageThin,
} from '@/lib/alternatives/buildLongformData';

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug)?.tool;

  if (!tool) return {};

  const data = await buildToolAlternativesLongformData(slug);
  const thin = isAlternativesPageThin(data);

  return {
    title: data?.title || `${tool.name} Alternatives: Best Replacements by Use Case`,
    description: `Looking for better than ${tool.name}? Compare top alternatives based on cost control, output quality, workflow speed, and control features.`,
    alternates: {
      canonical: `/tool/${slug}/alternatives`,
    },
    robots: thin
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug)?.tool;

  if (!tool) {
    notFound();
  }

  const data = await buildToolAlternativesLongformData(slug);

  if (!data) {
    notFound();
  }

  return <AlternativesLongformTemplate data={data} />;
}

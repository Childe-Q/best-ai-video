import { notFound } from 'next/navigation';
import AlternativesLongformTemplate from '@/components/alternatives/longform/AlternativesLongformTemplate';
import {
  buildTopicAlternativesLongformData,
  getTopicAlternativesSlugs,
  isAlternativesPageThin,
} from '@/lib/alternatives/buildLongformData';

export async function generateStaticParams() {
  return getTopicAlternativesSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = buildTopicAlternativesLongformData(slug);

  if (!data) return {};

  const thin = isAlternativesPageThin(data);

  return {
    title: data.title,
    description: data.heroConclusion,
    alternates: {
      canonical: data.canonicalPath,
    },
    robots: thin
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}

export default async function TopicAlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = buildTopicAlternativesLongformData(slug);

  if (!data) {
    notFound();
  }

  return <AlternativesLongformTemplate data={data} />;
}

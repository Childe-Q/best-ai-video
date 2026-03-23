import AlternativesHubClient from '@/components/alternatives/longform/AlternativesHubClient';
import { getAlternativesHubData } from '@/lib/alternatives/buildLongformData';
import { getSEOCurrentYear } from '@/lib/utils';

export async function generateMetadata() {
  const seoYear = getSEOCurrentYear();

  return {
    title: `Alternatives Hub (${seoYear}): Find by Tool or Topic`,
    description:
      'Search alternatives by exact tool or by workflow topic. Compare options with one consistent long-form evaluation template.',
    alternates: {
      canonical: '/alternatives',
    },
  };
}

export default async function AlternativesHubPage() {
  const data = await getAlternativesHubData();

  return <AlternativesHubClient tools={data.tools} topics={data.topics} />;
}

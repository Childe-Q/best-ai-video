import AlternativesHubClient from '@/components/alternatives/longform/AlternativesHubClient';
import { getAlternativesHubData } from '@/lib/alternatives/buildLongformData';
import { buildCollectionPageJsonLd } from '@/lib/jsonLd';
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildCollectionPageJsonLd({
              name: 'Alternatives hub',
              description:
                'Browse alternatives pages by exact tool or workflow topic using one consistent evaluation template.',
              href: '/alternatives',
              items: [
                ...data.tools.slice(0, 6).map((tool) => ({
                  name: `${tool.name} alternatives`,
                  href: tool.href,
                })),
                ...data.topics.slice(0, 4).map((topic) => ({
                  name: topic.title,
                  href: topic.href,
                })),
              ],
            })
          ),
        }}
      />
      <AlternativesHubClient tools={data.tools} topics={data.topics} />
    </>
  );
}

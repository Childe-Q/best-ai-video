import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FeatureHubPage from '@/components/features/FeatureHubPage';
import { getTool } from '@/lib/getTool';
import { getFeaturePageSlugs, readFeaturePageData } from '@/lib/features/readFeaturePageData';
import { FeaturePageData, FeatureRecommendedReadingLink } from '@/types/featurePage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getFeaturePageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = readFeaturePageData(slug);

  if (!pageData) {
    return { title: 'Feature Not Found' };
  }

  return {
    title: pageData.hero.h1,
    description: pageData.hero.subheadline,
    alternates: {
      canonical: `/features/${slug}`,
    },
  };
}

function titleizeSlug(slug: string): string {
  return slug
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' / ');
}

function buildRecommendedReadingLinks(pageData: FeaturePageData): FeatureRecommendedReadingLink[] {
  if (!pageData?.recommendedReading) {
    return [];
  }

  const links: FeatureRecommendedReadingLink[] = [];

  for (const toolSlug of pageData.recommendedReading.tools || []) {
    const tool = getTool(toolSlug);
    if (!tool) {
      continue;
    }
    links.push({
      href: `/tool/${toolSlug}`,
      label: `${tool.name} review`,
      linkType: 'tool',
      destinationSlug: toolSlug,
    });
  }

  for (const entry of pageData.recommendedReading.alternativesPages || []) {
    const toolSlug = entry.replace(/\/alternatives$/, '');
    const tool = getTool(toolSlug);
    if (!tool) {
      continue;
    }
    links.push({
      href: `/tool/${toolSlug}/alternatives`,
      label: `${tool.name} alternatives`,
      linkType: 'tool_alternatives',
      destinationSlug: entry,
    });
  }

  for (const vsSlug of pageData.recommendedReading.vsPages || []) {
    links.push({
      href: `/vs/${vsSlug}`,
      label: titleizeSlug(vsSlug.replace(/-vs-/g, ' vs ')),
      linkType: 'vs',
      destinationSlug: vsSlug,
    });
  }

  for (const guideSlug of pageData.recommendedReading.guides || []) {
    links.push({
      href: guideSlug.startsWith('/') ? guideSlug : `/guides/${guideSlug}`,
      label: titleizeSlug(guideSlug.replace(/^\/+/, '')),
      linkType: 'guide',
      destinationSlug: guideSlug,
    });
  }

  return links;
}

export default async function FeatureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const pageData = readFeaturePageData(slug);

  if (!pageData) {
    notFound();
  }

  const groups = pageData.groups.map((group) => ({
    ...group,
    tools: group.tools.map((tool) => {
      const matchedTool = getTool(tool.toolSlug);
      const hasReviewPage = tool.hasReviewPage ?? Boolean(matchedTool);
      const reviewUrl = tool.reviewUrl ?? (hasReviewPage ? `/tool/${tool.toolSlug}` : null);

      return {
        ...tool,
        displayName: tool.name || matchedTool?.name || titleizeSlug(tool.toolSlug),
        resolvedLogoUrl: tool.logoUrl || matchedTool?.logo_url || null,
        hasReviewPage,
        reviewUrl,
        officialUrl: tool.officialUrl ?? null,
      };
    }),
  }));

  const recommendedReadingLinks = buildRecommendedReadingLinks(pageData);

  return (
    <FeatureHubPage
      featureSlug={slug}
      pageData={pageData}
      groups={groups}
      recommendedReadingLinks={recommendedReadingLinks}
    />
  );
}

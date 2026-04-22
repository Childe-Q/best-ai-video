import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FeatureHubPage from '@/components/features/FeatureHubPage';
import { getCanonicalVsSlug } from '@/data/vs';
import { getTool } from '@/lib/getTool';
import { getFeaturePageSlugs, readFeaturePageData } from '@/lib/features/readFeaturePageData';
import { buildBreadcrumbJsonLd } from '@/lib/jsonLd';
import { isFeaturePageIndexable } from '@/lib/features/indexability';
import { filterPromoteSafeLinks, getPageReadiness } from '@/lib/readiness';
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
    ...(isFeaturePageIndexable(slug)
      ? {}
      : {
          robots: {
            index: false,
            follow: true,
          },
        }),
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

async function buildRecommendedReadingLinks(pageData: FeaturePageData): Promise<FeatureRecommendedReadingLink[]> {
  if (!pageData?.recommendedReading) {
    return [];
  }

  type PromoteSafeReadingLink = FeatureRecommendedReadingLink & {
    kind: 'tool' | 'toolAlternatives' | 'vs' | 'feature';
    slug: string;
  };

  const links: Array<FeatureRecommendedReadingLink | PromoteSafeReadingLink> = [];
  const featurePageSlugs = new Set(getFeaturePageSlugs());

  for (const toolSlug of pageData.recommendedReading.tools || []) {
    const tool = getTool(toolSlug);
    if (!tool) {
      continue;
    }
    links.push({
      kind: 'tool',
      slug: toolSlug,
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
      kind: 'toolAlternatives',
      slug: toolSlug,
      href: `/tool/${toolSlug}/alternatives`,
      label: `${tool.name} alternatives`,
      linkType: 'tool_alternatives',
      destinationSlug: entry,
    });
  }

  for (const vsSlug of pageData.recommendedReading.vsPages || []) {
    const canonicalVsSlug = getCanonicalVsSlug(vsSlug) ?? vsSlug;
    links.push({
      kind: 'vs',
      slug: canonicalVsSlug,
      href: `/vs/${canonicalVsSlug}`,
      label: titleizeSlug(canonicalVsSlug.replace(/-vs-/g, ' vs ')),
      linkType: 'vs',
      destinationSlug: canonicalVsSlug,
    });
  }

  for (const guideSlug of pageData.recommendedReading.guides || []) {
    const normalizedGuideSlug = guideSlug.replace(/^\/+/, '');
    const featureSlug = normalizedGuideSlug.startsWith('features/')
      ? normalizedGuideSlug.replace(/^features\//, '')
      : normalizedGuideSlug;

    if (featurePageSlugs.has(featureSlug)) {
      links.push({
        kind: 'feature',
        slug: featureSlug,
        href: `/${normalizedGuideSlug}`,
        label: titleizeSlug(featureSlug),
        linkType: 'guide',
        destinationSlug: guideSlug,
      });
      continue;
    }

    links.push({
      href: guideSlug.startsWith('/') ? guideSlug : `/guides/${guideSlug}`,
      label: titleizeSlug(normalizedGuideSlug),
      linkType: 'guide',
      destinationSlug: guideSlug,
    });
  }

  const gatedLinks = await filterPromoteSafeLinks(
    links.filter((link): link is PromoteSafeReadingLink => 'kind' in link && 'slug' in link)
  );
  const promoteSafeKeys = new Set(gatedLinks.map((link) => `${link.linkType}:${link.destinationSlug}`));

  return links
    .filter((link) => !('kind' in link) || promoteSafeKeys.has(`${link.linkType}:${link.destinationSlug}`))
    .map((link) => {
      if ('kind' in link) {
        return {
          href: link.href,
          label: link.label,
          linkType: link.linkType,
          destinationSlug: link.destinationSlug,
        };
      }
      return link;
    });
}

export default async function FeatureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const pageData = readFeaturePageData(slug);

  if (!pageData) {
    notFound();
  }

  const uniqueToolSlugs = Array.from(
    new Set(pageData.groups.flatMap((group) => group.tools.map((tool) => tool.toolSlug)))
  );
  const readyToolSlugs = new Set(
    (
      await Promise.all(
        uniqueToolSlugs.map(async (toolSlug) => {
          const readiness = await getPageReadiness('tool', toolSlug);
          return readiness.ready ? toolSlug : null;
        })
      )
    ).filter((toolSlug): toolSlug is string => Boolean(toolSlug))
  );

  const groups = pageData.groups.map((group) => ({
    ...group,
    tools: group.tools.map((tool) => {
      const matchedTool = getTool(tool.toolSlug);
      const hasReviewPage = (tool.hasReviewPage ?? Boolean(matchedTool)) && readyToolSlugs.has(tool.toolSlug);
      const reviewUrl = hasReviewPage ? (tool.reviewUrl ?? `/tool/${tool.toolSlug}`) : null;

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

  const recommendedReadingLinks = await buildRecommendedReadingLinks(pageData);
  const promoteSafeFeatureHrefs = (
    await Promise.all(
      getFeaturePageSlugs().map(async (featurePageSlug) => {
        const readiness = await getPageReadiness('feature', featurePageSlug);
        return readiness.ready ? `/features/${featurePageSlug}` : null;
      })
    )
  ).filter((href): href is string => Boolean(href));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Features', href: '/features' },
              { name: pageData.hero.h1 },
            ])
          ),
        }}
      />
      <FeatureHubPage
        featureSlug={slug}
        pageData={pageData}
        groups={groups}
        recommendedReadingLinks={recommendedReadingLinks}
        promoteSafeFeatureHrefs={promoteSafeFeatureHrefs}
      />
    </>
  );
}

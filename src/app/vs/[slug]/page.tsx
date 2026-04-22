import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import VsPageTemplate from '@/components/vs/VsPageTemplate';
import { getCanonicalVsSlug, getVsComparisonWithStatus, listVsSlugs, parseVsSlug } from '@/data/vs';
import { buildBreadcrumbJsonLd } from '@/lib/jsonLd';
import { getToolBySlug } from '@/lib/toolData';
import { buildVsFaqJsonLd } from '@/lib/vsPageModel';
import { getSEOCurrentYear } from '@/lib/utils';
import { isComparisonReady } from '@/lib/vsComparisonReady';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDisplayToolName(slug?: string): string {
  if (!slug) return 'AI Video Tool';
  const tool = getToolBySlug(slug)?.tool;
  return tool?.name ?? toTitleCase(slug);
}
export const dynamicParams = true;

export async function generateStaticParams() {
  return listVsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const load = getVsComparisonWithStatus(resolved.slug);
  const parsed = load.parsed ?? parseVsSlug(resolved.slug);
  const canonicalSlug = getCanonicalVsSlug(resolved.slug) ?? resolved.slug;

  if (!parsed) {
    return {
      title: 'VS Comparison',
      description: 'AI video tool comparison page using our unified VS template.',
    };
  }

  const toolAName = getDisplayToolName(parsed.slugA);
  const toolBName = getDisplayToolName(parsed.slugB);
  const seoYear = getSEOCurrentYear();
  const ready = isComparisonReady(load.comparison);

  if (!ready) {
    return {
      title: `${toolAName} vs ${toolBName} ${seoYear}: Comparison in Progress`,
      description: `This ${toolAName} vs ${toolBName} comparison is shown in template mode while we finalize the full verified dataset.`,
      alternates: {
        canonical: `/vs/${canonicalSlug}`,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    title: `${toolAName} vs ${toolBName} ${seoYear}: Detailed Comparison & Verdict`,
    description: `Side-by-side comparison of ${toolAName} vs ${toolBName}: pricing, workflow differences, source-backed matrix, and clear verdict.`,
    alternates: {
      canonical: `/vs/${canonicalSlug}`,
    },
    openGraph: {
      title: `${toolAName} vs ${toolBName} ${seoYear} Comparison`,
      description: `${load.comparison?.shortAnswer.a ?? ''} ${load.comparison?.shortAnswer.b ?? ''}`.trim(),
    },
  };
}

export const revalidate = 86400;

export default async function ComparisonPage({ params, searchParams }: PageProps) {
  const resolved = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const canonicalSlug = getCanonicalVsSlug(resolved.slug);
  if (canonicalSlug && canonicalSlug !== resolved.slug) {
    redirect(`/vs/${canonicalSlug}`);
  }
  const load = getVsComparisonWithStatus(resolved.slug);
  const debugParam = resolvedSearchParams?.debug;
  const debugFlag = Array.isArray(debugParam) ? debugParam[0] : debugParam;
  const showDebug = process.env.NODE_ENV === 'development' && debugFlag === '1';

  if (process.env.NODE_ENV === 'development') {
    console.info('[vs-page] render status', {
      slug: resolved.slug,
      status: load.status,
      source: load.source ?? 'none',
      reason: load.reason ?? null,
      normalizedSlug: load.normalizedSlug ?? null,
      indexHit: load.indexHit ?? false,
      hitSource: load.hitSource ?? 'none',
      schemaErrorSummary: load.schemaErrorSummary ?? [],
      errors: load.errors ?? [],
    });
  }

  const toolAName = load.parsed ? getDisplayToolName(load.parsed.slugA) : 'AI Video Tool';
  const toolBName = load.parsed ? getDisplayToolName(load.parsed.slugB) : 'AI Video Tool';
  const faqJsonLd = load.comparison ? buildVsFaqJsonLd(load.comparison, toolAName, toolBName) : null;

  return (
    <>
      {load.parsed ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildBreadcrumbJsonLd([
                { name: 'Home', href: '/' },
                { name: 'VS', href: '/vs' },
                { name: `${toolAName} vs ${toolBName}` },
              ])
            ),
          }}
        />
      ) : null}
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <VsPageTemplate load={load} resolved={resolved} showDebug={showDebug} />
    </>
  );
}

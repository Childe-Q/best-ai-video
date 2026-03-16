'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/features/ToolCard';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import { track } from '@/lib/features/track';
import {
  FeatureFaqItem,
  FeatureGroupDisplay,
  FeaturePageData,
  FeatureRecommendedReadingLink,
} from '@/types/featurePage';

interface PolicyThresholdFeaturePageProps {
  featureSlug: string;
  pageData: FeaturePageData;
  groups: FeatureGroupDisplay[];
  recommendedReadingLinks: FeatureRecommendedReadingLink[];
}

type PolicySummaryCard = {
  eyebrow: string;
  title: string;
  summary: string;
  href?: string;
  external?: boolean;
  cta?: string;
};

type PolicyBucketCard = {
  title: string;
  summary: string;
  compareFirst: string;
  whenToSkip: string;
  href: string;
  label: string;
};

type BucketMatrixRow = {
  label: string;
  values: Record<string, string>;
};

type BucketOverride = {
  startHereWhen: string;
  watchFor: string;
  nextStepHref: string;
  nextStepLabel: string;
  nextStepNote: string;
};

type PolicyThresholdOverride = {
  summaryCards: PolicySummaryCard[];
  bucketCards: PolicyBucketCard[];
  matrixRows: BucketMatrixRow[];
  faqItems: FeatureFaqItem[];
  bucketOverrides: Record<string, BucketOverride>;
};

type ReadingGroup = {
  title: string;
  items: FeatureRecommendedReadingLink[];
};

function getRecommendedSectionTitle(linkType: FeatureRecommendedReadingLink['linkType']): string {
  switch (linkType) {
    case 'tool':
      return 'Related reviews';
    case 'tool_alternatives':
      return 'Related alternatives';
    case 'vs':
      return 'Related comparisons';
    case 'guide':
      return 'Related guides';
    default:
      return 'Related';
  }
}

const readingOrder: FeatureRecommendedReadingLink['linkType'][] = ['tool', 'tool_alternatives', 'vs', 'guide'];

const policyThresholdOverrides: Partial<Record<string, PolicyThresholdOverride>> = {
  'free-ai-video-no-watermark': {
    summaryCards: [
      {
        eyebrow: 'Best truly free editor',
        title: 'FlexClip',
        summary: 'Strongest first check if you need genuinely watermark-free exports on a free plan and want a familiar browser editor rather than a pure generation toy.',
        href: '/tool/flexclip',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best truly free motion experiment',
        title: 'Leonardo AI',
        summary: 'Best fit if you want watermark-free AI motion clips and can tolerate daily token limits instead of a broad editing workflow.',
        href: 'https://leonardo.ai/ai-video-generator',
        external: true,
        cta: 'Visit official site',
      },
      {
        eyebrow: 'Best conditional free option',
        title: 'Kapwing',
        summary: 'Most relevant if you can live with strict export limits and mostly need quick short clips rather than unlimited free no-watermark use.',
        href: 'https://www.kapwing.com/',
        external: true,
        cta: 'Visit official site',
      },
      {
        eyebrow: 'Cheapest upgrade path',
        title: 'Clipclip',
        summary: 'The cleanest starting point if you already know a cheap paid removal is acceptable and you care more about low entry cost than staying fully free.',
      },
    ],
    bucketCards: [
      {
        title: 'Need truly free no-watermark now',
        summary: 'Start with the truly free bucket when the rule is non-negotiable: free exports must stay clean without hidden upgrade steps.',
        compareFirst: 'Export cap, resolution, and how quickly free credits run out',
        whenToSkip: 'Skip this bucket if 720p caps, tiny credit allowances, or limited templates make “free” unusable in practice.',
        href: '#truly-free',
        label: 'Go to Truly Free',
      },
      {
        title: 'Okay with limits if the free export stays clean',
        summary: 'Start with conditional free when you can tolerate export count or duration caps as long as the tool occasionally gives you watermark-free output.',
        compareFirst: 'Time limits, export counts, and what happens after the cap',
        whenToSkip: 'Skip this bucket if you need the no-watermark rule to hold consistently across every export, not just under a narrow condition.',
        href: '#conditional-free',
        label: 'Go to Conditional Free',
      },
      {
        title: 'Okay paying a little to remove branding',
        summary: 'Start with low-cost removal when free is only for evaluation and your real question is which tool becomes clean at the cheapest acceptable upgrade.',
        compareFirst: 'Upgrade price, output quality after upgrade, and whether the tool is worth paying for at all',
        whenToSkip: 'Skip this bucket if staying at $0 is the whole point or if the paid tier quickly stops being budget-friendly.',
        href: '#low-cost-removal',
        label: 'Go to Low-Cost Removal',
      },
    ],
    matrixRows: [
      {
        label: 'Watermark rule',
        values: {
          'Truly Free': 'Free exports stay watermark-free by default',
          'Conditional Free': 'No watermark only if you stay inside strict limits',
          'Low-Cost Removal': 'Free exports carry branding; upgrade removes it',
        },
      },
      {
        label: 'Typical limit',
        values: {
          'Truly Free': 'Usually lower resolution, tiny credits, or short clip duration',
          'Conditional Free': 'Export-count or duration caps decide whether the watermark stays off',
          'Low-Cost Removal': 'No clean output until you move to a paid plan',
        },
      },
      {
        label: 'Who should start here',
        values: {
          'Truly Free': 'People who really mean free and clean, even with compromises',
          'Conditional Free': 'People who only need occasional short free exports',
          'Low-Cost Removal': 'People who mainly want the cheapest path to clean output',
        },
      },
      {
        label: 'Main risk',
        values: {
          'Truly Free': 'The allowance may be too small to matter in practice',
          'Conditional Free': 'The no-watermark promise breaks the moment your usage expands',
          'Low-Cost Removal': 'You may end up paying for a tool that is only mediocre overall',
        },
      },
      {
        label: 'First tools to check',
        values: {
          'Truly Free': 'FlexClip · Leonardo AI · Hailuo AI · Jogg.ai',
          'Conditional Free': 'Kapwing',
          'Low-Cost Removal': 'Clipclip · Lumen5',
        },
      },
    ],
    faqItems: [
      {
        question: 'What actually counts as truly free and watermark-free?',
        answer: 'It only counts as truly free if the export stays clean on the free tier without requiring an upgrade and without a hidden cap that immediately breaks the promise. This is why the page separates Truly Free from Conditional Free instead of treating every “free” claim as equivalent.',
      },
      {
        question: 'Which bucket should I check first?',
        answer: 'Start with Truly Free if staying at $0 is non-negotiable. Start with Conditional Free if occasional clean exports are enough. Start with Low-Cost Removal if you already know a small paid upgrade is acceptable and you mainly want the cheapest clean-output path.',
      },
      {
        question: 'Which free tools are strongest if commercial use matters?',
        answer: 'This page is not the best place to assume commercial safety from the watermark rule alone. Free and watermark-free does not automatically mean commercially safe. If commercial use is decisive, treat it as a second-pass filter and verify the terms before publishing.',
      },
      {
        question: 'When is a cheap upgrade better than chasing a fully free tool?',
        answer: 'A cheap upgrade is better when the free bucket keeps failing on resolution, credits, or reliability. If you already know the free allowance is too small for real use, a low-cost clean-output plan is often more practical than optimizing around a fragile free promise.',
      },
      {
        question: 'Should I use this page, or go back to the broader generators shortlist?',
        answer: 'Use this page only if watermark rule and free-tier eligibility are the real constraints. If you care more about the overall best tool than about staying free and watermark-free, go back to the broader generators shortlist.',
      },
    ],
    bucketOverrides: {
      'Truly Free': {
        startHereWhen: 'Start here when the rule is simple: you need clean exports on the free tier and do not want the answer to become “upgrade first.” This is the strongest bucket if staying at $0 matters more than polish.',
        watchFor: 'The bucket is still full of practical constraints. Most tools here trade away output resolution, duration, or usable volume. Treat the no-watermark rule as the first filter, not the whole answer.',
        nextStepHref: '/features/best-ai-video-generators',
        nextStepLabel: 'Watermark rule no longer the main filter?',
        nextStepNote: 'Go back to the broader shortlist if you are ready to optimize for overall tool quality instead.',
      },
      'Conditional Free': {
        startHereWhen: 'Start here when you only need occasional free clean exports and can genuinely stay inside a narrow cap such as a short duration or a tiny number of monthly renders.',
        watchFor: 'This bucket fails quickly once usage becomes regular. The moment your videos get longer or your export volume rises, the no-watermark promise effectively disappears.',
        nextStepHref: '/features/budget-friendly-ai-video-tools',
        nextStepLabel: 'Ready to pay a little for cleaner output?',
        nextStepNote: 'The budget-friendly page is the better next step once strict free limits become a bottleneck.',
      },
      'Low-Cost Removal': {
        startHereWhen: 'Start here when free is just for testing and the real question is which tool becomes usable after the smallest possible payment.',
        watchFor: 'A cheap upgrade is not automatically good value. If the tool remains weak after watermark removal, paying a little can still be a bad deal.',
        nextStepHref: '/features/budget-friendly-ai-video-tools',
        nextStepLabel: 'Need a stronger paid shortlist instead?',
        nextStepNote: 'Go there if you are willing to pay and want the better overall sub-$20 options rather than just the cheapest removal.',
      },
    },
  },
};

export default function PolicyThresholdFeaturePage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
}: PolicyThresholdFeaturePageProps) {
  const override = policyThresholdOverrides[pageData.slug];

  useEffect(() => {
    track('page_view', {
      page_type: 'feature_policy_threshold',
      feature_slug: featureSlug,
    });
  }, [featureSlug]);

  if (!override) {
    return null;
  }

  const recommendedGroups: ReadingGroup[] = readingOrder
    .map((linkType) => ({
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      className="min-h-screen bg-[#F9FAFB] pb-24 text-gray-900"
      data-feature-page-type={pageData.meta.pageType}
      data-feature-primary-surface={pageData.meta.modules.primarySurface}
    >
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
              <li>
                <Link href="/" className="transition-colors hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">→</li>
              <li>
                <Link href="/features" className="transition-colors hover:text-gray-900">
                  Features
                </Link>
              </li>
              <li className="text-gray-400">→</li>
              <li className="font-medium text-gray-900">{pageData.hero.h1}</li>
            </ol>
          </nav>

          <div className="rounded-[28px] border-2 border-black bg-[#FFE9C7] p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-700">Policy guide</p>
              <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                Free-tier rule and eligibility first
              </span>
            </div>

            <h1 className="mt-4 max-w-5xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {pageData.hero.h1}
            </h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-gray-700">{pageData.hero.subheadline}</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Scope and classification rule</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">
                  {pageData.meta.primaryClassificationRule}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pageData.hero.definitionBullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Wrong fit?</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">
                  If the real question is not “free and no watermark” but simply “which AI video tool is best overall,” this page is too narrow. Go back to the broader shortlist first.
                </p>
                <div className="mt-5">
                  <Link
                    href="/features/best-ai-video-generators"
                    className="inline-flex items-center rounded-xl border-2 border-black bg-[#FFF16A] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-[3px_3px_0px_0px_#000]"
                  >
                    Go back to the broader generators shortlist
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-black/15 bg-white/85 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">What matters most</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  'watermark rule',
                  'free-tier eligibility',
                  'export limits',
                  'resolution cap',
                  'commercial-use risk',
                ].map((axis) => (
                  <span
                    key={axis}
                    className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700"
                  >
                    {axis}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Bucket summary</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Start with the bucket that matches the rule you can live with</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {override.summaryCards.map((card) => {
              const inner = (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">{card.eyebrow}</p>
                  <h3 className="mt-3 text-lg font-bold text-gray-900">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{card.summary}</p>
                  {card.cta ? (
                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600">
                      {card.cta}
                      <span className="ml-2">→</span>
                    </span>
                  ) : null}
                </div>
              );

              if (!card.href) {
                return <div key={`${card.eyebrow}-${card.title}`}>{inner}</div>;
              }

              return card.external ? (
                <a key={`${card.eyebrow}-${card.title}`} href={card.href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <Link key={`${card.eyebrow}-${card.title}`} href={card.href}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Eligibility checklist</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Check the free-tier rule before you compare tools</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {(pageData.howToChoose?.criteria ?? []).map((criterion) => (
              <div key={criterion.title} className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Checklist item</p>
                <h3 className="mt-3 text-lg font-bold text-gray-900">{criterion.title}</h3>
                {criterion.desc ? <p className="mt-3 text-sm leading-7 text-gray-600">{criterion.desc}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Bucket matrix</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">See the real free-tier rule before you scroll to tools</h2>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-gray-200 bg-white px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                    Threshold
                  </th>
                  {groups.map((group) => (
                    <th
                      key={group.groupTitle}
                      className="border-b border-gray-200 bg-white px-4 py-3 text-left text-sm font-bold text-gray-900"
                    >
                      {group.groupTitle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {override.matrixRows.map((row) => (
                  <tr key={row.label}>
                    <th className="sticky left-0 z-10 border-b border-gray-200 bg-[#F9FAFB] px-4 py-4 text-left text-sm font-semibold text-gray-900">
                      {row.label}
                    </th>
                    {groups.map((group) => (
                      <td key={`${row.label}-${group.groupTitle}`} className="border-b border-gray-200 px-4 py-4 text-sm leading-6 text-gray-700">
                        {row.values[group.groupTitle]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Choose your policy bucket</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Pick the free-tier rule you can actually tolerate</h2>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {override.bucketCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-gray-200 bg-[#FCFBF7] p-5">
                <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-gray-700">{card.summary}</p>
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Compare first</p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">{card.compareFirst}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Skip this bucket when</p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">{card.whenToSkip}</p>
                </div>
                <div className="mt-4">
                  <Link href={card.href} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                    {card.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Buckets</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Look at tools only after the bucket is clear</h2>
          </div>

          {groups.map((group) => {
            const bucketOverride = override.bucketOverrides[group.groupTitle];
            const bucketId = group.groupTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return (
              <section key={group.groupTitle} id={bucketId} className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Policy bucket</p>
                <h3 className="mt-3 text-3xl font-bold text-gray-900">{group.groupTitle}</h3>
                {group.groupSummary ? (
                  <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">{group.groupSummary}</p>
                ) : null}

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Start here when</p>
                    <p className="mt-2 text-sm leading-7 text-gray-700">{bucketOverride?.startHereWhen}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">What to watch for</p>
                    <p className="mt-2 text-sm leading-7 text-gray-700">{bucketOverride?.watchFor}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {group.tools.map((tool, index) => (
                    <ToolCard
                      key={`${group.groupTitle}-${tool.toolSlug}`}
                      tool={tool}
                      featureSlug={featureSlug}
                      groupTitle={group.groupTitle}
                      position={index + 1}
                      policyLabel="Watermark policy"
                    />
                  ))}
                </div>

                <div className="mt-8 border-t border-gray-200 pt-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Contextual next steps</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={bucketOverride?.nextStepHref ?? '/features/best-ai-video-generators'}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                    >
                      {bucketOverride?.nextStepLabel ?? 'Go back to the broader shortlist'}
                    </Link>
                    <span className="self-center text-sm text-gray-500">{bucketOverride?.nextStepNote}</span>
                  </div>
                </div>
              </section>
            );
          })}
        </section>

        {override.faqItems.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-[#F3F1EA] p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Questions that usually decide the policy shortlist</h2>
            </div>

            <div className="mt-8">
              <FeaturesFAQ items={override.faqItems} />
            </div>
          </section>
        )}

        {recommendedGroups.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Further reading</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Keep it light after the threshold is clear</h2>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              {recommendedGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-lg font-bold text-gray-900">{group.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {group.items.map((item) => (
                      <Link
                        key={`${item.linkType}-${item.destinationSlug}`}
                        href={item.href}
                        onClick={() =>
                          track('click_internal_link', {
                            link_type: item.linkType,
                            destination_slug: item.destinationSlug,
                            feature_slug: featureSlug,
                          })
                        }
                        className="rounded-full border border-gray-200 bg-[#F9FAFB] px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import FeatureNextSteps from '@/components/features/FeatureNextSteps';
import ToolCard from '@/components/features/ToolCard';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import { resolvePromoteSafeFeatureHref } from '@/components/features/filterPromoteSafeFeatureHrefs';
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
  promoteSafeFeatureHrefs: string[];
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
  href: string;
  label: string;
};

type BucketMatrixRow = {
  label: string;
  values: Record<string, string>;
};

type PolicyThresholdOverride = {
  heroPill: string;
  keyAxes: string[];
  toolPolicyLabel: string;
  summaryCards: PolicySummaryCard[];
  bucketCards: PolicyBucketCard[];
  matrixRows: BucketMatrixRow[];
  summaryLead?: string;
  matrixLead?: string;
  bucketLead?: string;
  shortlistLead?: string;
  faqLead?: string;
  faqItems: FeatureFaqItem[];
};

type ReadingGroup = {
  title: string;
  items: FeatureRecommendedReadingLink[];
};

const SAFE_FEATURE_EXIT = {
  href: '/features',
  label: 'Browse feature hub',
  note: 'Return to the feature hub if this narrower route is not promote-safe yet.',
} as const;

function hasDisplayText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

function getLookupValue(values: Record<string, string>, key: string): string | null {
  if (hasDisplayText(values[key])) {
    return values[key].trim();
  }

  const normalizedKey = normalizeLookupKey(key);
  const matchedEntry = Object.entries(values).find(([candidateKey]) => normalizeLookupKey(candidateKey) === normalizedKey);
  const matchedValue = matchedEntry?.[1];

  return hasDisplayText(matchedValue) ? matchedValue.trim() : null;
}

function buildRenderableMatrixRows(matrixRows: BucketMatrixRow[], groups: FeatureGroupDisplay[]) {
  return matrixRows
    .map((row) => {
      if (!hasDisplayText(row.label)) {
        return null;
      }

      const cells = groups.map((group) => ({
        groupTitle: group.groupTitle,
        value: getLookupValue(row.values, group.groupTitle),
      }));

      if (cells.some((cell) => !hasDisplayText(cell.value))) {
        return null;
      }

      return {
        label: row.label.trim(),
        cells,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

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
    heroPill: 'Free-tier rule and eligibility first',
    keyAxes: ['watermark rule', 'free-tier eligibility', 'export limits', 'resolution cap', 'commercial-use risk'],
    toolPolicyLabel: 'Watermark policy',
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
        href: '#truly-free',
        label: 'Go to Truly Free',
      },
      {
        title: 'Okay with limits if the free export stays clean',
        summary: 'Start with conditional free when you can tolerate export count or duration caps as long as the tool occasionally gives you watermark-free output.',
        compareFirst: 'Time limits, export counts, and what happens after the cap',
        href: '#conditional-free',
        label: 'Go to Conditional Free',
      },
      {
        title: 'Okay paying a little to remove branding',
        summary: 'Start with low-cost removal when free is only for evaluation and your real question is which tool becomes clean at the cheapest acceptable upgrade.',
        compareFirst: 'Upgrade price, output quality after upgrade, and whether the tool is worth paying for at all',
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
        answer: 'It counts only if the free export stays clean without an upgrade and without a hidden cap that immediately breaks the promise. That is why this page separates Truly Free from Conditional Free.',
      },
      {
        question: 'Which bucket should I check first?',
        answer: 'Start with Truly Free if staying at $0 is non-negotiable. Use Conditional Free for occasional clean exports, and Low-Cost Removal if a small paid upgrade is acceptable.',
      },
      {
        question: 'Which free tools are strongest if commercial use matters?',
        answer: 'Do not infer commercial safety from watermark policy alone. If commercial use is decisive, verify the terms before publishing even when the export is free and clean.',
      },
    ],
  },
  'budget-friendly-ai-video-tools': {
    heroPill: 'Budget cap and paid-tier value first',
    keyAxes: ['monthly cap', 'credits per dollar', 'watermark removal', 'usable output volume', 'workflow fit'],
    toolPolicyLabel: 'Budget threshold',
    summaryCards: [
      {
        eyebrow: 'Best overall under $20',
        title: 'Runway',
        summary:
          'Strongest first check if you want the cleanest blend of sub-$20 pricing, watermark-free output, and a tool that still feels serious beyond the entry tier.',
        href: '/tool/runway',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best quality-to-price ratio',
        title: 'Kling AI',
        summary:
          'Most relevant if you want the highest motion quality you can get around the $10 mark and can live inside a credit-based generation model.',
        href: 'https://klingai.com/',
        external: true,
        cta: 'Visit official site',
      },
      {
        eyebrow: 'Best low-cost social generator',
        title: 'Pika',
        summary:
          'Best fit if you care more about fast social experiments and creative effects than about the most cinematic output at the price band.',
        href: '/tool/pika',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best daily creator workflow',
        title: 'Magic Hour',
        summary:
          'The cleanest starting point if the budget cap matters, but the real job is producing short-form content frequently without heavier creative tooling.',
        href: 'https://magichour.ai/',
        external: true,
        cta: 'Visit official site',
      },
    ],
    bucketCards: [
      {
        title: 'Need the strongest generator under $20',
        summary:
          'Start with budget generators when the rule is simple: stay under the monthly cap, keep clean exports, and still get a serious generative tool.',
        compareFirst: 'Credits per month, watermark removal on the entry tier, and whether the output still feels usable after the budget cap',
        href: '#budget-generators',
        label: 'Go to Budget Generators',
      },
      {
        title: 'Need a daily workflow that stays cheap',
        summary:
          'Start with daily creator workflows when the threshold is not pure model quality but repeatable short-form output at a price you can keep paying every month.',
        compareFirst: 'How much output the tier supports, how simple the workflow is, and whether speed matters more than creative control',
        href: '#daily-creator-workflows',
        label: 'Go to Daily Creator Workflows',
      },
    ],
    matrixRows: [
      {
        label: 'Threshold rule',
        values: {
          'Budget Generators': 'Stay under $20 while keeping a real generative model and clean exports',
          'Daily Creator Workflows': 'Stay under $20 while keeping repeatable short-form output practical',
        },
      },
      {
        label: 'Typical tradeoff',
        values: {
          'Budget Generators': 'Credit caps usually limit volume before they limit creativity',
          'Daily Creator Workflows': 'Speed and simplicity improve, but advanced creative control usually drops',
        },
      },
      {
        label: 'Who should start here',
        values: {
          'Budget Generators': 'People who want the best-looking generator they can afford monthly',
          'Daily Creator Workflows': 'People who publish frequently and care more about affordable throughput',
        },
      },
      {
        label: 'Main risk',
        values: {
          'Budget Generators': 'The plan looks cheap until credits run out faster than expected',
          'Daily Creator Workflows': 'The workflow may stay cheap only by capping quality or creative range',
        },
      },
      {
        label: 'First tools to check',
        values: {
          'Budget Generators': 'Runway · Kling AI · Pika',
          'Daily Creator Workflows': 'Magic Hour',
        },
      },
    ],
    faqItems: [
      {
        question: 'What actually counts as budget-friendly on this page?',
        answer:
          'It counts only if the paid plan stays under $20 per month, removes the watermark, and still gives meaningful output. A cheap tier that immediately forces an upgrade does not qualify in practice.',
      },
      {
        question: 'Which bucket should I check first?',
        answer:
          'Start with Budget Generators if you want the strongest generative quality under the cap. Start with Daily Creator Workflows if repeatable short-form throughput matters more than model depth.',
      },
      {
        question: 'What matters more here: sticker price, credits, or watermark removal?',
        answer:
          'Start with usable output after the cap, not sticker price alone. Credits and watermark removal usually decide whether the plan is viable before the monthly price does.',
      },
    ],
  },
  'fast-ai-video-generators': {
    heroPill: 'Latency, queue time, and throughput first',
    keyAxes: ['queue time', 'render latency', 'API concurrency', 'quality tradeoff', 'commercial readiness'],
    toolPolicyLabel: 'Speed threshold',
    summaryCards: [
      {
        eyebrow: 'Fastest overall first check',
        title: 'Luma Dream Machine',
        summary:
          'Strongest first check if the job is pure turnaround speed and high-volume prompt iteration, especially when queue time matters more than the last bit of polish.',
        href: 'https://lumalabs.ai/',
        external: true,
        cta: 'Visit official site',
      },
      {
        eyebrow: 'Best low-cost fast testing',
        title: 'Minimax Hailuo',
        summary:
          'Most relevant if you want fast concept testing and care about keeping the cost per second low while staying in a speed-first workflow.',
        href: 'https://hailuoai.com/',
        external: true,
        cta: 'Visit official site',
      },
      {
        eyebrow: 'Best fast option with a clearer paid path',
        title: 'Pika',
        summary:
          'Best fit if you want near real-time effects and a clearer commercial-ready upgrade path instead of only chasing absolute render speed.',
        href: '/tool/pika',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best if speed stops being the only rule',
        title: 'Go broader',
        summary:
          'The fastest tool is not always the right tool. If quality, control, or broader workflow fit matter more than raw turnaround, this page should stop being your main frame.',
        href: '/features/ai-video-generators-comparison',
        cta: 'Open comparison',
      },
    ],
    summaryLead:
      'This page is intentionally narrow: all of these starting points still collapse back into the same speed-first market. The job here is to decide which kind of speed pressure is real before you scroll into tools.',
    bucketCards: [
      {
        title: 'Need the fastest feedback loop now',
        summary:
          'Start here when the rule is simple: a few extra seconds or minutes matter, and the real workflow depends on fast iteration more than maximum visual polish.',
        compareFirst: 'Real render latency, queue behavior on your tier, and whether the fast mode still gives usable output',
        href: '#rapid-prototyping',
        label: 'Go to Rapid Prototyping',
      },
    ],
    matrixRows: [
      {
        label: 'Threshold rule',
        values: {
          'Rapid prototyping': 'Stay here only if fast render time or queue avoidance is the real first filter',
        },
      },
      {
        label: 'Typical tradeoff',
        values: {
          'Rapid prototyping': 'You usually get faster turnaround by giving up some polish, control, or predictability',
        },
      },
      {
        label: 'Who should start here',
        values: {
          'Rapid prototyping': 'People who iterate constantly and care about feedback speed more than maximum fidelity',
        },
      },
      {
        label: 'Main risk',
        values: {
          'Rapid prototyping': 'The fastest generator can still be the wrong tool once quality or commercial use becomes the bigger constraint',
        },
      },
      {
        label: 'First tools to check',
        values: {
          'Rapid prototyping': 'Luma Dream Machine · Minimax Hailuo · Pika',
        },
      },
    ],
    matrixLead:
      'Even on a single-bucket page, speed can fail in different places: the queue, the render itself, or the throughput after you start scaling. Read the matrix as a reality check, not just a label table.',
    faqItems: [
      {
        question: 'What actually counts as fast enough to belong on this page?',
        answer:
          'It belongs here only if render speed, queue time, or throughput is the real first filter. The tool has to change the workflow by producing output in seconds or low minutes.',
      },
      {
        question: 'Which speed constraint should I check first: queue time, render time, or API concurrency?',
        answer:
          'Start with the bottleneck that breaks your workflow. Manual creative work usually fails on queue time and render latency; batch workflows can fail on concurrency and rate limits.',
      },
      {
        question: 'Which fast option is strongest once paid use or commercial work matters?',
        answer:
          'Pika is the clearest starting point when you want fast output with a more explicit paid path and commercial-use context. Luma and Hailuo remain useful when absolute speed or low-cost testing matters more.',
      },
    ],
    bucketLead:
      'These bucket cards do not create three separate tool sections. They clarify which speed threshold you are really optimizing for before you enter the same rapid-prototyping shortlist.',
    shortlistLead:
      'This section is intentionally single-bucket. Once speed is confirmed as the first filter, the remaining job is deciding which fast generator still survives real usage, paid work, and repeated iteration.',
    faqLead:
      'If the page is doing its job, the questions below should feel like the continuation of the shortlist rather than a second guide layered underneath it.',
  },
};

export default function PolicyThresholdFeaturePage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
  promoteSafeFeatureHrefs,
}: PolicyThresholdFeaturePageProps) {
  const rawOverride = policyThresholdOverrides[pageData.slug];
  const promoteSafeFeatureHrefSet = new Set(promoteSafeFeatureHrefs ?? []);
  const resolveFeatureExit = (href: string) =>
    resolvePromoteSafeFeatureHref(href, promoteSafeFeatureHrefSet, SAFE_FEATURE_EXIT.href);
  const safeOverride = rawOverride
    ? {
        ...rawOverride,
        summaryCards: rawOverride.summaryCards.map((card) => {
          if (!card.href) {
            return card;
          }

          const resolved = resolveFeatureExit(card.href);
          return resolved.usedFallback
            ? {
                ...card,
                href: SAFE_FEATURE_EXIT.href,
                cta: SAFE_FEATURE_EXIT.label,
                external: false,
              }
            : {
                ...card,
                href: resolved.href ?? card.href,
              };
        }),
        bucketCards: rawOverride.bucketCards.map((card) => {
          const resolved = resolveFeatureExit(card.href);
          return resolved.usedFallback
            ? { ...card, href: SAFE_FEATURE_EXIT.href, label: SAFE_FEATURE_EXIT.label }
            : { ...card, href: resolved.href ?? card.href };
        }),
      }
    : null;

  useEffect(() => {
    track('page_view', {
      page_type: 'feature_policy_threshold',
      feature_slug: featureSlug,
    });
  }, [featureSlug]);

  if (!safeOverride) {
    return null;
  }

  const override = safeOverride;

  const recommendedGroups: ReadingGroup[] = readingOrder
    .map((linkType) => ({
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType),
    }))
    .filter((group) => group.items.length > 0);
  const matrixRows = buildRenderableMatrixRows(override.matrixRows, groups);

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
                {override.heroPill}
              </span>
            </div>

            <h1 className="mt-4 max-w-5xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {pageData.hero.h1}
            </h1>
            <p className="mt-4 max-w-4xl text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">
              Pick the hard constraint first, then compare the shortlist.
            </p>
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
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">What matters most</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {override.keyAxes.map((axis) => (
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
        </div>
      </header>

      <main
        className={`mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 ${
          groups.length === 1 ? 'space-y-12' : 'space-y-14'
        }`}
      >
        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Threshold summary</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Start with the bucket that matches the rule you can live with</h2>
            {override.summaryLead ? <p className="mt-4 text-base leading-8 text-gray-600">{override.summaryLead}</p> : null}
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

        {matrixRows.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Threshold matrix</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Compare the threshold tradeoffs</h2>
              {override.matrixLead ? <p className="mt-4 text-base leading-8 text-gray-600">{override.matrixLead}</p> : null}
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
                  {matrixRows.map((row) => (
                    <tr key={row.label}>
                      <th className="sticky left-0 z-10 border-b border-gray-200 bg-[#F9FAFB] px-4 py-4 text-left text-sm font-semibold text-gray-900">
                        {row.label}
                      </th>
                      {row.cells.map((cell) => (
                        <td key={`${row.label}-${cell.groupTitle}`} className="border-b border-gray-200 px-4 py-4 text-sm leading-6 text-gray-700">
                          {cell.value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Choose your policy bucket</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Pick the bucket that matches the constraint you can actually tolerate</h2>
            {override.bucketLead ? <p className="mt-4 text-base leading-8 text-gray-600">{override.bucketLead}</p> : null}
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Threshold shortlist</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Look at tools only after the bucket is clear</h2>
            {override.shortlistLead ? <p className="mt-4 text-base leading-8 text-gray-600">{override.shortlistLead}</p> : null}
          </div>

          {groups.map((group) => {
            const bucketId = group.groupTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return (
              <section key={group.groupTitle} id={bucketId} className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Policy bucket</p>
                <h3 className="mt-3 text-3xl font-bold text-gray-900">{group.groupTitle}</h3>
                {group.groupSummary ? (
                  <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">{group.groupSummary}</p>
                ) : null}

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {group.tools.map((tool, index) => (
                    <ToolCard
                      key={`${group.groupTitle}-${tool.toolSlug}`}
                      tool={tool}
                      featureSlug={featureSlug}
                      groupTitle={group.groupTitle}
                      position={index + 1}
                      policyLabel={override.toolPolicyLabel}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </section>

        {override.faqItems.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-[#F3F1EA] p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Questions that usually decide the threshold shortlist</h2>
              {override.faqLead ? <p className="mt-4 text-base leading-8 text-gray-600">{override.faqLead}</p> : null}
            </div>

            <div className="mt-8">
              <FeaturesFAQ items={override.faqItems} />
            </div>
          </section>
        )}

        {recommendedGroups.length > 0 && (
          <FeatureNextSteps
            featureSlug={featureSlug}
            title="Keep going only if the threshold still matters"
            intro="These paths help only after the rule on this page still deserves to lead the decision. If the threshold has stopped being the main filter, move back to the broader workflow pages."
            groups={recommendedGroups}
          />
        )}
      </main>
    </div>
  );
}

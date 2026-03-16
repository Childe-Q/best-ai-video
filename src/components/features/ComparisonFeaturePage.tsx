'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import { track } from '@/lib/features/track';
import {
  FeatureFaqItem,
  FeatureGroupDisplay,
  FeaturePageData,
  FeatureRecommendedReadingLink,
  FeatureToolCardDisplay,
} from '@/types/featurePage';

interface ComparisonFeaturePageProps {
  featureSlug: string;
  pageData: FeaturePageData;
  groups: FeatureGroupDisplay[];
  recommendedReadingLinks: FeatureRecommendedReadingLink[];
}

type ComparisonSummaryCard = {
  eyebrow: string;
  title: string;
  winner: string;
  summary: string;
  href?: string;
  external?: boolean;
  cta?: string;
};

type ComparisonPriorityCard = {
  title: string;
  winner: string;
  compareFirst: string;
  summary: string;
  whenToSkip: string;
  href: string;
  label: string;
  external?: boolean;
};

type ComparisonMatrixRow = {
  axis: string;
  values: Record<string, string>;
};

type ComparisonLaneOverride = {
  whenToUse: string;
  watchFor: string;
  nextStepHref: string;
  nextStepLabel: string;
  nextStepNote: string;
};

type ComparisonPageOverride = {
  summaryCards: ComparisonSummaryCard[];
  priorityCards: ComparisonPriorityCard[];
  matrixRows: ComparisonMatrixRow[];
  faqItems: FeatureFaqItem[];
  laneOverrides: Record<string, ComparisonLaneOverride>;
};

type ComparisonToolGroup = {
  title: string;
  items: FeatureRecommendedReadingLink[];
};

function hasDisplayValue(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function compactJoin(values: string[]): string {
  return values.filter(Boolean).join(' · ');
}

function getToolHref(tool: FeatureToolCardDisplay): { href: string | null; external: boolean } {
  if (hasDisplayValue(tool.reviewUrl)) {
    return { href: tool.reviewUrl, external: false };
  }

  if (hasDisplayValue(tool.officialUrl)) {
    return { href: tool.officialUrl, external: true };
  }

  return { href: null, external: false };
}

const comparisonReadingOrder: FeatureRecommendedReadingLink['linkType'][] = ['tool', 'tool_alternatives', 'vs', 'guide'];

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

const comparisonPageOverrides: Partial<Record<string, ComparisonPageOverride>> = {
  'ai-video-generators-comparison': {
    summaryCards: [
      {
        eyebrow: 'Best for cinematic realism',
        title: 'Sora',
        winner: 'Sora',
        summary: 'Strongest first check if the comparison starts with physics-aware realism, longer native clips, and scene-first cinematic output.',
        href: '/tool/sora',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best for creator workflow',
        title: 'Runway',
        winner: 'Runway',
        summary: 'Best fit when generation has to live inside a broader creative workflow, not just a single model benchmark.',
        href: '/tool/runway',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best for fast social clips',
        title: 'Pika',
        winner: 'Pika',
        summary: 'Most practical first stop for low-friction social experimentation when speed and usability matter more than frontier-level fidelity.',
        href: '/tool/pika',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best if pricing is first',
        title: 'Kling 3.0',
        winner: 'Kling 3.0',
        summary: 'Best starting point when API cost and high-resolution volume are the first filters, not the broadest editing workflow.',
        href: 'https://klingai.com/',
        external: true,
        cta: 'Visit official site',
      },
    ],
    priorityCards: [
      {
        title: 'Prioritize cinematic realism',
        winner: 'Sora',
        compareFirst: 'Realism, clip length, and scene control',
        summary: 'Start with Sora if the model benchmark is visual fidelity first. Move to Runway if you need a stronger surrounding workflow once the footage quality is close enough.',
        whenToSkip: 'Skip this lane if what you really need is avatar delivery, daily short-form output, or the cheapest API cost.',
        href: '/tool/sora',
        label: 'Open Sora review',
      },
      {
        title: 'Prioritize creator workflow',
        winner: 'Runway',
        compareFirst: 'Editing integration, team fit, and overall creative stack',
        summary: 'Start with Runway when the best model is the one that fits into an end-to-end creative workflow rather than winning a raw benchmark in isolation.',
        whenToSkip: 'Skip this lane if you only care about the absolute frontier on fidelity, or if a lighter social-first tool is already enough.',
        href: '/tool/runway',
        label: 'Open Runway review',
      },
      {
        title: 'Prioritize fast social output',
        winner: 'Pika',
        compareFirst: 'Speed, ease of use, and short-form iteration',
        summary: 'Start with Pika if the real question is how quickly you can make usable social clips. Check Kling if API cost and native 4K volume matter more than beginner friendliness.',
        whenToSkip: 'Skip this lane if cinematic realism or a more governed creative workflow matters more than short-form speed.',
        href: '/tool/pika',
        label: 'Open Pika review',
      },
      {
        title: 'Prioritize API or technical control',
        winner: 'Veo 3.1',
        compareFirst: 'Official API access, audio, and input flexibility',
        summary: 'Start with Veo if you need a more official developer path and native audio sync. Check Seedance if multimodal input depth matters more than clean platform access.',
        whenToSkip: 'Skip this lane if the buyer is a solo creator choosing a UI tool rather than an engineering or technical workflow.',
        href: 'https://deepmind.google/models/veo/',
        label: 'Open Veo overview',
        external: true,
      },
    ],
    matrixRows: [
      {
        axis: 'Best fit',
        values: {
          sora: 'Cinematic realism and longer prompt-based scenes',
          veo: 'Developer API workflows with native audio sync',
          seedance: 'Multimodal control and experimental input-heavy generation',
          runway: 'Creative teams that need generation plus workflow tooling',
          'kling-ai': 'High-resolution volume and lower API cost',
          pika: 'Fast social clips and low-friction experimentation',
        },
      },
      {
        axis: 'Cinematic realism',
        values: {
          sora: 'Strongest headline choice',
          veo: 'Strong, but shorter clips',
          seedance: 'More control-focused than realism-first',
          runway: 'Strong motion quality with workflow advantages',
          'kling-ai': 'Good at high-res speed, less premium on realism',
          pika: 'Good enough for social, not the realism leader',
        },
      },
      {
        axis: 'Avatar-led output',
        values: {
          sora: 'Not a core strength',
          veo: 'Not a core strength',
          seedance: 'Not a core strength',
          runway: 'Not a core strength',
          'kling-ai': 'Not a core strength',
          pika: 'Not a core strength',
        },
      },
      {
        axis: 'Short-form speed',
        values: {
          sora: 'Moderate',
          veo: 'Moderate',
          seedance: 'Moderate',
          runway: 'Moderate',
          'kling-ai': 'Strong',
          pika: 'Strongest low-friction option',
        },
      },
      {
        axis: 'Pricing / access',
        values: {
          sora: 'Plus subscription or API pricing',
          veo: 'API pricing with limited UI access',
          seedance: 'Free credits, but third-party API path',
          runway: 'Creator-access monthly plans',
          'kling-ai': 'Cheapest API cost in this set',
          pika: 'Free tier and low paid entry',
        },
      },
      {
        axis: 'Commercial readiness',
        values: {
          sora: 'Paid path required before serious production use',
          veo: 'Best for teams already comfortable with API workflows',
          seedance: 'Promising, but rougher production posture',
          runway: 'Most practical creator-ready route',
          'kling-ai': 'Best when cost matters more than workflow polish',
          pika: 'Best for experiments before heavier production demands',
        },
      },
      {
        axis: 'What to watch for',
        values: {
          sora: 'No free tier and no native audio',
          veo: 'Shorter clips and limited preview access',
          seedance: 'Third-party API dependency and rougher access model',
          runway: 'Less of a pure benchmark winner on price',
          'kling-ai': 'No native audio generation',
          pika: 'Ceiling is lower for premium cinematic use cases',
        },
      },
    ],
    faqItems: [
      {
        question: 'Which generator is the strongest for cinematic realism?',
        answer: 'Start with Sora if realism and scene quality are the headline criteria. Runway is the next practical check when you want strong motion quality but also need a broader creative workflow around the model.',
      },
      {
        question: 'Which one is best for avatar-led video?',
        answer: 'None of the tools on this page are the right first stop if avatar-led delivery is the actual requirement. This page is for direct generator comparison. If a speaker or presenter matters, go back to the broader shortlist and then into the avatar guide.',
      },
      {
        question: 'When is Pika enough, and when should I move up to Runway or Sora?',
        answer: 'Pika is enough when fast short-form clips and low-friction social output are the real job. Move up to Runway or Sora when visual quality, scene control, or a more serious production workflow becomes the deciding factor.',
      },
      {
        question: 'Which tool is the better first choice if pricing matters most?',
        answer: 'Start with Pika if you want the lightest creator-facing entry point. Start with Kling if your comparison is more API-cost driven and high-resolution output volume matters more than interface polish.',
      },
      {
        question: 'Should I use this page, or go back to the broader generators shortlist?',
        answer: 'Use this page only if you are already comparing generator-to-generator tradeoffs. If you are still deciding between cinematic generation, avatar workflows, or social-first tools, go back to the broader shortlist first.',
      },
    ],
    laneOverrides: {
      'Frontier models': {
        whenToUse: 'Use this lane when your comparison starts with technical ceiling: realism, multimodal input, native audio, or model-level capability rather than ease of onboarding.',
        watchFor: 'These tools tend to have rougher access paths, higher cost, or more technical constraints. They are stronger as head-to-head benchmarks than as default first choices for most creators.',
        nextStepHref: '/features/best-ai-video-generators',
        nextStepLabel: 'Need a broader shortlist first?',
        nextStepNote: 'Go back if you are not yet sure that frontier-model benchmarking is the right stage of the decision.',
      },
      'Creator-access tools': {
        whenToUse: 'Use this lane when the winning tool has to be practical to adopt: lower entry cost, faster onboarding, and a clearer day-to-day workflow for working creators or small teams.',
        watchFor: 'These tools are easier to live with, but they may not be the absolute ceiling on fidelity or cutting-edge capability. Choose this lane only if usability is part of the decision, not a footnote.',
        nextStepHref: '/features/best-ai-video-generators',
        nextStepLabel: 'Need the broader generator routes again?',
        nextStepNote: 'Go back if you realize the comparison is too early and you still need route-level guidance.',
      },
    },
  },
};

function getComparisonOverride(slug: string): ComparisonPageOverride | null {
  return comparisonPageOverrides[slug] ?? null;
}

function renderComparisonSummaryCard(card: ComparisonSummaryCard) {
  const body = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">{card.eyebrow}</p>
      <h3 className="mt-3 text-lg font-bold text-gray-900">{card.title}</h3>
      <p className="mt-2 text-sm leading-7 text-gray-600">{card.summary}</p>
      <p className="mt-4 text-sm font-semibold text-gray-800">Start with {card.winner}</p>
      {card.cta ? (
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600">
          {card.cta}
          <span className="ml-2">→</span>
        </span>
      ) : null}
    </div>
  );

  if (!card.href) {
    return body;
  }

  if (card.external) {
    return (
      <a href={card.href} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:border-indigo-300">
        {body}
      </a>
    );
  }

  return (
    <Link href={card.href} className="block transition-colors hover:border-indigo-300">
      {body}
    </Link>
  );
}

function renderToolLink(
  tool: FeatureToolCardDisplay,
  featureSlug: string,
  laneTitle: string,
) {
  const { href, external } = getToolHref(tool);

  const content = (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <h4 className="text-base font-bold text-gray-900">{tool.displayName}</h4>
      <p className="mt-2 text-sm leading-6 text-gray-600">{tool.reasonLine1}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
        {compactJoin([tool.bestFor ?? '', tool.pricingStartAt ?? ''])}
      </p>
    </div>
  );

  if (!href) {
    return <div key={`${laneTitle}-${tool.toolSlug}`}>{content}</div>;
  }

  if (external) {
    return (
      <a
        key={`${laneTitle}-${tool.toolSlug}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          track('click_outbound', {
            tool_slug: tool.toolSlug,
            destination_url: href,
            group_title: laneTitle,
            feature_slug: featureSlug,
          })
        }
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      key={`${laneTitle}-${tool.toolSlug}`}
      href={href}
      onClick={() =>
        track('click_tool_card', {
          tool_slug: tool.toolSlug,
          group_title: laneTitle,
          feature_slug: featureSlug,
        })
      }
    >
      {content}
    </Link>
  );
}

export default function ComparisonFeaturePage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
}: ComparisonFeaturePageProps) {
  const override = getComparisonOverride(pageData.slug);
  const recommendedGroups: ComparisonToolGroup[] = comparisonReadingOrder
    .map((linkType) => ({
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    track('page_view', {
      page_type: 'feature_comparison',
      feature_slug: featureSlug,
    });
  }, [featureSlug]);

  if (!override) {
    return null;
  }

  const matrixToolOrder = groups.flatMap((group) => group.tools);
  const matrixToolSlugs = matrixToolOrder.map((tool) => tool.toolSlug);

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

          <div className="rounded-[28px] border-2 border-black bg-[#DFF3FF] p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-700">Comparison guide</p>
              <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                Head-to-head generator comparison
              </span>
            </div>

            <h1 className="mt-4 max-w-5xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {pageData.hero.h1}
            </h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-gray-700">{pageData.hero.subheadline}</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Comparison scope</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">
                  {pageData.meta.primaryClassificationRule} This page assumes you are already comparing generator-to-generator tradeoffs, not still deciding between broad workflows.
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
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Not ready for head-to-head?</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">
                  If you are still deciding between cinematic generation, avatar workflows, or social-first tools, this page is too narrow. Go back to the broader shortlist first.
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
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Compare by axis</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ...pageData.meta.comparisonAxes,
                  'cinematic realism',
                  'avatar / presenter fit',
                  'commercial readiness',
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Best by priority</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Start with the axis that matters most</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {override.summaryCards.map((card) => (
              <div key={`${card.eyebrow}-${card.title}`}>{renderComparisonSummaryCard(card)}</div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Comparison matrix</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">See the tradeoffs before you read the narrative</h2>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-gray-200 bg-white px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                    Axis
                  </th>
                  {matrixToolOrder.map((tool) => (
                    <th
                      key={tool.toolSlug}
                      className="border-b border-gray-200 bg-white px-4 py-3 text-left text-sm font-bold text-gray-900"
                    >
                      {tool.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {override.matrixRows.map((row) => (
                  <tr key={row.axis}>
                    <th className="sticky left-0 z-10 border-b border-gray-200 bg-[#F9FAFB] px-4 py-4 text-left text-sm font-semibold text-gray-900">
                      {row.axis}
                    </th>
                    {matrixToolSlugs.map((slug) => (
                      <td key={`${row.axis}-${slug}`} className="border-b border-gray-200 px-4 py-4 text-sm leading-6 text-gray-700">
                        {row.values[slug]}
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Choose by what matters most</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Use the priority lane that matches the real decision</h2>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {override.priorityCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-gray-200 bg-[#FCFBF7] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                    Compare first: {card.compareFirst}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-900">Start with {card.winner}</p>
                <p className="mt-2 text-sm leading-7 text-gray-700">{card.summary}</p>
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Skip this lane when</p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">{card.whenToSkip}</p>
                </div>
                <div className="mt-4">
                  {card.external ? (
                    <a href={card.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                      {card.label}
                    </a>
                  ) : (
                    <Link href={card.href} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                      {card.label}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Lane explainer</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Read the comparison lanes only after the table is clear</h2>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {groups.map((group) => {
              const laneOverride = override.laneOverrides[group.groupTitle];

              return (
                <section key={group.groupTitle} className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Comparison lane</p>
                  <h3 className="mt-3 text-2xl font-bold text-gray-900">{group.groupTitle}</h3>
                  <p className="mt-4 text-base leading-8 text-gray-600">{group.groupSummary}</p>

                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">When this lane makes sense</p>
                      <p className="mt-2 text-sm leading-7 text-gray-700">{laneOverride?.whenToUse}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">What to watch for</p>
                      <p className="mt-2 text-sm leading-7 text-gray-700">{laneOverride?.watchFor}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    {group.tools.map((tool) => renderToolLink(tool, featureSlug, group.groupTitle))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
                    <Link href={laneOverride?.nextStepHref ?? '/features/best-ai-video-generators'} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                      {laneOverride?.nextStepLabel ?? 'Go back to the broader shortlist'}
                    </Link>
                    <span className="text-xs leading-6 text-gray-500">{laneOverride?.nextStepNote}</span>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Next steps</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Go narrower only after the comparison stage is clear</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/tool/sora" className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
              <p className="text-sm font-bold text-gray-900">Already leaning Sora?</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">Open the review if realism is already winning the decision.</p>
            </Link>
            <Link href="/tool/runway" className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
              <p className="text-sm font-bold text-gray-900">Already leaning Runway?</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">Open the review if workflow fit matters as much as raw model quality.</p>
            </Link>
            <Link href="/tool/pika" className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
              <p className="text-sm font-bold text-gray-900">Already leaning Pika?</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">Open the review if fast social experimentation is the real requirement.</p>
            </Link>
            <Link href="/features/best-ai-video-generators" className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
              <p className="text-sm font-bold text-gray-900">Not ready for head-to-head?</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">Go back to the broad shortlist if you still need route-level guidance.</p>
            </Link>
          </div>
        </section>

        {override.faqItems.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-[#F3F1EA] p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Questions that usually decide the comparison</h2>
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
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Keep it light after the comparison is done</h2>
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

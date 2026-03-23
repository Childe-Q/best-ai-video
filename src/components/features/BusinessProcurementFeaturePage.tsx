'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/features/ToolCard';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import { isPromoteSafeFeatureHref, toPromoteSafeFeatureHref } from '@/components/features/filterPromoteSafeFeatureHrefs';
import { track } from '@/lib/features/track';
import {
  FeatureCriteriaItem,
  FeatureFaqItem,
  FeatureGroupDisplay,
  FeaturePageData,
  FeatureRecommendedReadingLink,
} from '@/types/featurePage';

interface BusinessProcurementFeaturePageProps {
  featureSlug: string;
  pageData: FeaturePageData;
  groups: FeatureGroupDisplay[];
  recommendedReadingLinks: FeatureRecommendedReadingLink[];
  promoteSafeFeatureHrefs: string[];
}

type BusinessProcurementMode = 'business-light' | 'procurement-heavy';

type FitCheckCard = {
  title: string;
  summary: string;
  href: string;
  label: string;
};

type CapabilityMatrixRow = {
  label: string;
  values: Record<string, string>;
};

type SectionOverride = {
  title?: string;
  summary?: string;
  displayToolSlugs?: string[];
  startHereWhen: string;
  verifyFirst: string;
  contextualExits: Array<{
    href: string;
    label: string;
    note: string;
  }>;
};

type BusinessProcurementOverride = {
  mode: BusinessProcurementMode;
  heroLabel: string;
  heroPill: string;
  heroDefinition: string;
  keyAxes: string[];
  wrongFitText: string;
  wrongFitHref: string;
  wrongFitLabel: string;
  fitHeading: string;
  fitSummary: string;
  fitCards: FitCheckCard[];
  checklistLabel: string;
  checklistHeading: string;
  checklistIntro: string;
  checklistItems?: FeatureCriteriaItem[];
  matrixLabel: string;
  matrixHeading: string;
  matrixIntro: string;
  matrixRows: CapabilityMatrixRow[];
  groupLabels?: Record<string, string>;
  shortlistLabel: string;
  sectionsHeading: string;
  sectionsIntro: string;
  laneLabel: string;
  exitOptionsLabel: string;
  verifyLabel: string;
  faqHeading: string;
  furtherReadingHeading: string;
  faqItems: FeatureFaqItem[];
  sectionOverrides: Record<string, SectionOverride>;
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

const businessProcurementOverrides: Partial<Record<string, BusinessProcurementOverride>> = {
  'professional-ai-video-tools': {
    mode: 'business-light',
    heroLabel: 'Business guide',
    heroPill: 'Team rollout, brand control, and commercial use first',
    heroDefinition:
      'Use this page if a business team needs a tool it can adopt, govern lightly, and use for real work without enterprise procurement becoming the main decision.',
    keyAxes: ['team collaboration', 'brand governance', 'commercial output', 'rollout ease', 'workflow fit'],
    wrongFitText:
      'If the real question is procurement readiness, security review, SSO or SCORM, or governed deployment across a larger organization, this page is too light. Go to the enterprise solutions page first.',
    wrongFitHref: '/features/enterprise-ai-video-solutions',
    wrongFitLabel: 'Go to enterprise solutions',
    fitHeading: 'Stay here only if a business team needs a tool it can actually roll out',
    fitSummary:
      'Use this page only if the buyer is a team or department lead who needs collaboration, brand control, and commercially usable output without turning the decision into a procurement-heavy platform search. If deployment, security, or integration requirements already decide the shortlist, exit early.',
    fitCards: [
      {
        title: 'Stay here if the real job is team production and business rollout',
        summary:
          'This is the right route when a business team needs repeatable video production, shared brand controls, and a tool that can be adopted without enterprise procurement becoming the whole project.',
        href: '#team-video-production',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for enterprise if deployment and governance decide the deal',
        summary:
          'If SSO, SCORM, integration posture, or procurement review decide whether the vendor can move forward at all, the enterprise page is the better first route.',
        href: '/features/enterprise-ai-video-solutions',
        label: 'Go to enterprise solutions',
      },
      {
        title: 'Leave for broader workflow pages if the team is still choosing the lane',
        summary:
          'If you are still deciding between avatars, repurposing, or general video generation rather than choosing a business-ready team tool, start with the broader features pages instead.',
        href: '/features/best-ai-video-generators',
        label: 'Go to the broader shortlist',
      },
    ],
    checklistLabel: 'Team checklist',
    checklistHeading: 'Check team fit before you over-read the shortlist',
    checklistIntro:
      'Use lightweight business filters first. If the tool cannot support the team workflow, the rest of the page usually stops mattering.',
    checklistItems: [
      {
        title: 'Can the team actually collaborate inside the tool?',
        desc:
          'Check whether the platform supports shared workspaces, handoffs, and repeatable production instead of assuming one power user will do everything alone.',
      },
      {
        title: 'Does it keep output on-brand without enterprise overhead?',
        desc:
          'Brand kits, reusable templates, and role clarity matter early here. The goal is team consistency, not procurement-grade governance.',
      },
      {
        title: 'Is the business tier good enough without turning into a custom-quote process?',
        desc:
          'If the practical version of the tool only appears after an enterprise sales motion, this page has probably stopped being the right frame.',
      },
    ],
    matrixLabel: 'Decision matrix',
    matrixHeading: 'See which business-team path matches the workload',
    matrixIntro:
      'This compact matrix exists to separate team production from structured content reuse before you scroll into individual tools.',
    matrixRows: [
      {
        label: 'Best fit',
        values: {
          'Team video production': 'Teams producing internal or external business video with collaboration and brand control',
          'Structured content reuse': 'Teams converting scripts, articles, and recordings into repeatable video output',
        },
      },
      {
        label: 'Compare first',
        values: {
          'Team video production': 'Collaboration workflow, brand kits, ease of adoption, and business-tier quality',
          'Structured content reuse': 'How efficiently existing content becomes usable video without heavy manual work',
        },
      },
      {
        label: 'First tools to check',
        values: {
          'Team video production': 'Visla',
          'Structured content reuse': 'Pictory',
        },
      },
    ],
    groupLabels: {
      'Governed training platforms': 'Team video production',
      'Repurposing for teams': 'Structured content reuse',
    },
    shortlistLabel: 'Business shortlist',
    sectionsHeading: 'Shortlist by the business team job, not by enterprise posture',
    sectionsIntro:
      'The sections below assume the buyer is a team or department lead, not a procurement committee. If that stops being true, this page should stop being the main frame.',
    laneLabel: 'Shortlist lane',
    exitOptionsLabel: 'Exit options',
    verifyLabel: 'Check before rollout',
    faqHeading: 'Questions that usually decide the business-team shortlist',
    furtherReadingHeading: 'Keep going only if the business-team fit still holds',
    faqItems: [
      {
        question: 'Do I actually need this page, or an enterprise solutions page?',
        answer:
          'Use this page when a business team needs collaboration, brand control, and commercial-ready output without procurement-heavy deployment becoming the first filter. Use the enterprise page when security review, SSO, SCORM, procurement gating, or rollout governance decide the shortlist.',
      },
      {
        question: 'What matters first here: collaboration, brand governance, or commercial quality?',
        answer:
          'Start with the team workflow. If the tool cannot support how the team actually produces and hands off work, brand governance and export quality matter less. Then check brand consistency, then output quality.',
      },
      {
        question: 'When is Visla the better business-team starting point?',
        answer:
          'Start with Visla when the team needs an all-in-one production workspace with collaboration, editing, and brand management in one place rather than a more specialized repurposing workflow.',
      },
      {
        question: 'When is Pictory the better business-team route?',
        answer:
          'Start with Pictory when the real job is structured content reuse: turning scripts, articles, recordings, or knowledge assets into repeatable video output for a team.',
      },
      {
        question: 'When should I leave this page and move to enterprise solutions?',
        answer:
          'Leave when procurement posture becomes the main blocker: security review, SSO or SCORM, API readiness, or governed rollout across a larger organization. At that point the enterprise page is the cleaner frame.',
      },
    ],
    sectionOverrides: {
      'Team video production': {
        summary:
          'These tools fit business teams that need a shared video workspace for explainers, demos, training, and ongoing content production without turning the tool search into an enterprise deployment decision.',
        displayToolSlugs: ['visla'],
        startHereWhen:
          'Start here when the team needs a collaborative environment for business video production, internal explainers, demos, or ongoing content operations that can be rolled out by a department lead.',
        verifyFirst:
          'Verify collaboration flow, brand controls, export quality, and whether the business tier already does the real job without escalating into procurement-only requirements.',
        contextualExits: [
          {
            href: '/features/enterprise-ai-video-solutions',
            label: 'Need procurement-ready deployment instead?',
            note: 'Go there if SSO, SCORM, security review, or admin rollout have become the real blockers instead of team adoption.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Still choosing a presenter workflow?',
            note: 'Use the broader avatar page if the real decision is still about synthetic hosts rather than a business-team tool.',
          },
          {
            href: 'https://www.visla.us/',
            label: 'Open the official product',
            note: 'Go straight to the product once the business-team lane is clear and you need feature-level confirmation.',
          },
        ],
      },
      'Structured content reuse': {
        summary:
          'This lane fits business teams that already have scripts, articles, or recordings and need a repeatable way to turn those assets into video without building an enterprise rollout project around it.',
        displayToolSlugs: ['pictory'],
        startHereWhen:
          'Start here when the team already has source material and wants a cleaner path from content library to repeatable video output with business-ready controls and handoffs.',
        verifyFirst:
          'Verify whether the business workflow is already strong enough before you start caring about enterprise APIs, seat minimums, or larger procurement signals.',
        contextualExits: [
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Need workflow discovery first?',
            note: 'Go there if the team is still deciding how repurposing should work rather than selecting a business-ready tool.',
          },
          {
            href: '/features/enterprise-ai-video-solutions',
            label: 'Need enterprise-scale deployment instead?',
            note: 'Use the enterprise page if governance, API posture, or organization-wide rollout have become the first filter instead of team reuse.',
          },
          {
            href: '/tool/pictory',
            label: 'Open a representative review',
            note: 'Use the review once the team-reuse lane is clear and you want tool-level detail.',
          },
        ],
      },
    },
  },
  'enterprise-ai-video-solutions': {
    mode: 'procurement-heavy',
    heroLabel: 'Procurement guide',
    heroPill: 'Deployment, governance, and enterprise fit first',
    heroDefinition:
      'Use this page if procurement, deployment, or enterprise controls decide whether a vendor can move forward at all.',
    keyAxes: ['security posture', 'SSO and admin controls', 'SCORM or API depth', 'deployment fit', 'global rollout risk'],
    wrongFitText:
      'If the real question is not procurement readiness but simply which tool a business team should adopt and run, this page is too heavy. Go to the professional tools page first.',
    wrongFitHref: '/features/professional-ai-video-tools',
    wrongFitLabel: 'Go to professional tools',
    fitHeading: 'Stay here only if enterprise deployment is the real constraint',
    fitSummary:
      'Use this page only if the buying process is shaped by procurement, security review, admin rollout, or enterprise integration requirements. If you mainly need a business team tool with collaboration and brand control, exit early instead of treating enterprise signals as normal.',
    fitCards: [
      {
        title: 'Stay here if security, admin, and rollout requirements decide the shortlist',
        summary:
          'This is the right route when SSO, SCORM, API access, role-based controls, or enterprise rollout posture decide whether a vendor can even be evaluated.',
        href: '#governed-training-and-communications',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for professional tools if you need a business team solution',
        summary:
          'If the buyer is a department lead and the main question is collaboration, brand governance, and commercial output, the professional page is the better first route.',
        href: '/features/professional-ai-video-tools',
        label: 'Go to professional tools',
      },
      {
        title: 'Leave for the broader shortlist if you are still choosing the lane',
        summary:
          'If you have not yet decided between avatars, repurposing, or broader generator routes, do not start with an enterprise deployment page.',
        href: '/features/best-ai-video-generators',
        label: 'Go to the broader shortlist',
      },
    ],
    checklistLabel: 'Procurement checklist',
    checklistHeading: 'Check enterprise fit before you compare vendors',
    checklistIntro:
      'Use procurement filters first. If these fail, the rest of the shortlist usually stops mattering.',
    matrixLabel: 'Capability matrix',
    matrixHeading: 'See which deployment path actually matches the organization',
    matrixIntro:
      'Use the matrix to separate governed training rollout from API-led repurposing before you over-read vendors.',
    matrixRows: [
      {
        label: 'Primary buyer',
        values: {
          'Governed training and communications': 'L&D, HR enablement, internal communications, procurement',
          'Programmatic repurposing and knowledge ops': 'Knowledge ops, content systems, platform owners, procurement',
        },
      },
      {
        label: 'Core deployment need',
        values: {
          'Governed training and communications': 'Governed avatar delivery, multilingual rollout, admin control',
          'Programmatic repurposing and knowledge ops': 'Programmatic content transformation, API-led reuse, system integration',
        },
      },
      {
        label: 'Must verify first',
        values: {
          'Governed training and communications': 'SSO/SAML, SCORM or LMS posture, language coverage, admin controls',
          'Programmatic repurposing and knowledge ops': 'API depth, workflow automation, SSO, brand governance, integration limits',
        },
      },
      {
        label: 'Main procurement risk',
        values: {
          'Governed training and communications': 'Looks enterprise-ready until SCORM, SSO, or governance is locked to a higher tier',
          'Programmatic repurposing and knowledge ops': 'Looks flexible until API, scale, or admin controls are too thin for real deployment',
        },
      },
      {
        label: 'First tools to check',
        values: {
          'Governed training and communications': 'Synthesia · DeepBrain AI',
          'Programmatic repurposing and knowledge ops': 'Pictory',
        },
      },
    ],
    shortlistLabel: 'Enterprise shortlist',
    sectionsHeading: 'Shortlist only after procurement fit is clear',
    sectionsIntro:
      'The sections below assume procurement fit is already established. If that is still not true, this page should stop being the main frame.',
    laneLabel: 'Shortlist lane',
    exitOptionsLabel: 'Exit options',
    verifyLabel: 'Check before procurement',
    faqHeading: 'Questions that usually decide enterprise procurement fit',
    furtherReadingHeading: 'Keep going only if deployment fit still holds',
    faqItems: [
      {
        question: 'Do I actually need an enterprise page, or just a business team tool?',
        answer:
          'Use this page only when procurement, security review, SSO, SCORM, API access, or governed rollout are the real blockers. If the buyer is mainly a department lead choosing a team tool, the professional page is the better first stop.',
      },
      {
        question: 'What should I verify first: security posture, SCORM, or API access?',
        answer:
          'Start with the requirement that can disqualify a vendor fastest. For L&D and internal enablement, that is often SSO, SCORM, and governance. For programmatic repurposing, that is usually API depth, automation limits, and admin posture.',
      },
      {
        question: 'When is the training and communications route the right enterprise lane?',
        answer:
          'Use it when the platform will support internal training, multilingual communications, or governed avatar rollout across teams. It is the right lane when delivery control matters more than content transformation pipelines.',
      },
      {
        question: 'When is repurposing and knowledge ops the better enterprise lane?',
        answer:
          'Use it when the enterprise need is turning existing knowledge assets, recordings, or documents into video at scale through a more programmatic workflow. It is the better lane when integration and transformation matter more than avatar-led delivery.',
      },
      {
        question: 'When should I leave this page and move back to the professional page?',
        answer:
          'Leave when the decision is no longer about procurement readiness or governed deployment. If a business team could realistically self-serve the tool and rollout without enterprise controls, the professional page is the cleaner frame.',
      },
    ],
    sectionOverrides: {
      'Governed training and communications': {
        title: 'Governed training and communications',
        startHereWhen:
          'Start here when the organization needs governed avatar delivery for training, internal communications, HR enablement, or multilingual rollout across teams and regions, and procurement will scrutinize the platform.',
        verifyFirst:
          'Verify SSO/SAML, admin controls, language coverage, SCORM or LMS fit, and how much governance is actually available on the enterprise tier rather than assumed from marketing copy.',
        contextualExits: [
          {
            href: '/features/professional-ai-video-tools',
            label: 'Need a business-team tool instead?',
            note: 'Go there if collaboration and brand control matter, but procurement-heavy deployment is not the real bottleneck.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Still choosing the avatar lane?',
            note: 'Use the broader avatar page if you are not yet making a procurement or deployment decision.',
          },
          {
            href: '/tool/synthesia',
            label: 'Open a representative review',
            note: 'Use a direct review once the deployment lane is clear and you need tool-level detail.',
          },
        ],
      },
      'Programmatic repurposing and knowledge ops': {
        title: 'Programmatic repurposing and knowledge ops',
        startHereWhen:
          'Start here when the enterprise job is turning existing content systems, recordings, or documents into video through a scalable, integrated workflow rather than through a business-team content workflow.',
        verifyFirst:
          'Verify API posture, automation limits, admin governance, brand controls, and whether the workflow really supports programmatic reuse instead of only light business-team repurposing.',
        contextualExits: [
          {
            href: '/features/professional-ai-video-tools',
            label: 'Only need business-team repurposing?',
            note: 'Go there if the buyer is still a team lead and the main need is structured content reuse without heavy procurement overhead.',
          },
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Need workflow discovery before deployment?',
            note: 'Use the narrower repurposing page if you are still deciding the workflow rather than evaluating enterprise rollout.',
          },
          {
            href: '/tool/pictory',
            label: 'Open a representative review',
            note: 'Move to the tool review once you know this is the right enterprise lane.',
          },
        ],
      },
    },
  },
};

export default function BusinessProcurementFeaturePage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
  promoteSafeFeatureHrefs,
}: BusinessProcurementFeaturePageProps) {
  const rawOverride = businessProcurementOverrides[pageData.slug];
  const promoteSafeFeatureHrefSet = new Set(promoteSafeFeatureHrefs);
  const safeOverride = rawOverride
    ? {
        ...rawOverride,
        wrongFitHref: toPromoteSafeFeatureHref(rawOverride.wrongFitHref, promoteSafeFeatureHrefSet),
        fitCards: rawOverride.fitCards.filter((card) => isPromoteSafeFeatureHref(card.href, promoteSafeFeatureHrefSet)),
        sectionOverrides: Object.fromEntries(
          Object.entries(rawOverride.sectionOverrides).map(([sectionTitle, sectionOverride]) => [
            sectionTitle,
            {
              ...sectionOverride,
              contextualExits: sectionOverride.contextualExits.filter((item) =>
                isPromoteSafeFeatureHref(item.href, promoteSafeFeatureHrefSet)
              ),
            },
          ])
        ),
      }
    : null;

  useEffect(() => {
    track('page_view', {
      page_type: 'feature_business_procurement',
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
  const isBusinessLight = override.mode === 'business-light';
  const isProcurementHeavy = override.mode === 'procurement-heavy';

  return (
    <div
      className="min-h-screen bg-[#F9FAFB] pb-24 text-gray-900"
      data-feature-page-type={pageData.meta.pageType}
      data-feature-primary-surface={pageData.meta.modules.primarySurface}
      data-feature-mode={override.mode}
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

          <div
            className={`rounded-[28px] border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10 ${
              isBusinessLight ? 'bg-[#E7F7DA]' : 'bg-[#E3F0FF]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-700">{override.heroLabel}</p>
              <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                {override.heroPill}
              </span>
            </div>

            <h1 className="mt-4 max-w-5xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {pageData.hero.h1}
            </h1>
            <p className="mt-4 max-w-4xl text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">
              {override.heroDefinition}
            </p>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-gray-700">{pageData.hero.subheadline}</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Scope and classification rule</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">{pageData.meta.primaryClassificationRule}</p>
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
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Leave this page if...</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">{override.wrongFitText}</p>
                <div className="mt-5">
                <Link
                  href={safeOverride.wrongFitHref ?? '/features'}
                    className="inline-flex items-center rounded-xl border-2 border-black bg-[#FFF16A] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-[3px_3px_0px_0px_#000]"
                  >
                    {safeOverride.wrongFitLabel}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-black/15 bg-white/85 p-5">
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
      </header>

      <main
        className={`mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 ${
          isProcurementHeavy ? 'space-y-12' : 'space-y-14'
        }`}
      >
        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Fit check</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">{override.fitHeading}</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">{override.fitSummary}</p>
          </div>

          <div className={`mt-6 grid gap-3 ${isBusinessLight ? 'xl:grid-cols-3' : 'lg:grid-cols-3'}`}>
            {safeOverride.fitCards.map((card) => (
              <article
                key={card.title}
                className={`rounded-2xl border border-gray-200 bg-[#FCFBF7] ${isProcurementHeavy ? 'p-4' : 'p-5'}`}
              >
                <h3 className={`${isProcurementHeavy ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{card.title}</h3>
                <p className={`mt-2.5 text-sm ${isProcurementHeavy ? 'leading-6' : 'leading-7'} text-gray-700`}>
                  {card.summary}
                </p>
                <div className="mt-3">
                  <Link href={card.href} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                    {card.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{override.checklistLabel}</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">{override.checklistHeading}</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">{override.checklistIntro}</p>
          </div>

          <div className={`mt-6 grid gap-3 ${isBusinessLight ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
            {(override.checklistItems ?? pageData.howToChoose?.criteria ?? []).map((criterion) => (
              <div
                key={criterion.title}
                className={`rounded-2xl border border-gray-200 bg-[#F9FAFB] ${isProcurementHeavy ? 'p-4' : 'p-5'}`}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Checklist item</p>
                <h3 className={`mt-2.5 ${isProcurementHeavy ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>
                  {criterion.title}
                </h3>
                {criterion.desc ? (
                  <p className={`mt-2.5 text-sm ${isProcurementHeavy ? 'leading-6' : 'leading-7'} text-gray-600`}>
                    {criterion.desc}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{override.matrixLabel}</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">{override.matrixHeading}</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">{override.matrixIntro}</p>
          </div>

          <div className={`mt-6 overflow-x-auto ${isBusinessLight ? 'max-w-5xl' : ''}`}>
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-gray-200 bg-white px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                    Capability
                  </th>
                  {groups.map((group) => {
                    const groupLabel = override.groupLabels?.[group.groupTitle] ?? group.groupTitle;

                    return (
                    <th
                      key={group.groupTitle}
                      className="border-b border-gray-200 bg-white px-4 py-3 text-left text-sm font-bold text-gray-900"
                    >
                      {groupLabel}
                    </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {override.matrixRows.map((row) => (
                  <tr key={row.label}>
                    <th className="sticky left-0 z-10 border-b border-gray-200 bg-[#F9FAFB] px-4 py-4 text-left text-sm font-semibold text-gray-900">
                      {row.label}
                    </th>
                    {groups.map((group) => {
                      const groupLabel = override.groupLabels?.[group.groupTitle] ?? group.groupTitle;

                      return (
                        <td
                          key={`${row.label}-${group.groupTitle}`}
                          className={`border-b border-gray-200 px-4 ${isProcurementHeavy ? 'py-3.5' : 'py-4'} text-sm ${isProcurementHeavy ? 'leading-6' : 'leading-6'} text-gray-700`}
                        >
                          {row.values[groupLabel] ?? row.values[group.groupTitle]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-5">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{override.shortlistLabel}</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">{override.sectionsHeading}</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">{override.sectionsIntro}</p>
          </div>

          {groups.map((group) => {
                const sectionOverride = safeOverride.sectionOverrides[group.groupTitle];
            const sectionId = group.groupTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return (
              <section key={group.groupTitle} id={sectionId} className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{override.laneLabel}</p>
                <h3 className="mt-3 text-3xl font-bold text-gray-900">{sectionOverride?.title ?? override.groupLabels?.[group.groupTitle] ?? group.groupTitle}</h3>
                {sectionOverride?.summary ?? group.groupSummary ? (
                  <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">{sectionOverride?.summary ?? group.groupSummary}</p>
                ) : null}

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className={`rounded-2xl border border-gray-200 bg-[#F9FAFB] ${isProcurementHeavy ? 'p-4' : 'p-5'}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Start here when</p>
                    <p className={`mt-2 text-sm ${isProcurementHeavy ? 'leading-6' : 'leading-7'} text-gray-700`}>
                      {sectionOverride?.startHereWhen}
                    </p>
                  </div>
                  <div className={`rounded-2xl border border-gray-200 bg-[#F9FAFB] ${isProcurementHeavy ? 'p-4' : 'p-5'}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">{override.verifyLabel}</p>
                    <p className={`mt-2 text-sm ${isProcurementHeavy ? 'leading-6' : 'leading-7'} text-gray-700`}>
                      {sectionOverride?.verifyFirst}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {group.tools
                    .filter((tool) =>
                      sectionOverride?.displayToolSlugs?.length
                        ? sectionOverride.displayToolSlugs.includes(tool.toolSlug)
                        : true,
                    )
                    .map((tool, index) => (
                    <ToolCard
                      key={`${group.groupTitle}-${tool.toolSlug}`}
                      tool={tool}
                      featureSlug={featureSlug}
                      groupTitle={group.groupTitle}
                      position={index + 1}
                    />
                    ))}
                </div>

                {sectionOverride?.contextualExits?.length ? (
                  <div className="mt-8 border-t border-gray-200 pt-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">{override.exitOptionsLabel}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {sectionOverride.contextualExits.map((item) => (
                        <Link
                          key={`${group.groupTitle}-${item.href}`}
                          href={item.href}
                          onClick={() =>
                            track('click_internal_link', {
                              link_type: 'guide',
                              destination_slug: item.href.replace(/^\/+/, ''),
                              feature_slug: featureSlug,
                            })
                          }
                          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2">
                      {sectionOverride.contextualExits.map((item) => (
                        <p key={`${group.groupTitle}-${item.note}`} className="text-sm text-gray-500">
                          {item.note}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </section>

        {override.faqItems.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-[#F3F1EA] p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{override.faqHeading}</h2>
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
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{override.furtherReadingHeading}</h2>
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

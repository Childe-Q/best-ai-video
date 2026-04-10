'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/features/ToolCard';
import BusinessProcurementFeaturePage from '@/components/features/BusinessProcurementFeaturePage';
import ComparisonFeaturePage from '@/components/features/ComparisonFeaturePage';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import FeatureNextSteps from '@/components/features/FeatureNextSteps';
import NarrowWorkflowFeaturePage from '@/components/features/NarrowWorkflowFeaturePage';
import PolicyThresholdFeaturePage from '@/components/features/PolicyThresholdFeaturePage';
import { resolvePromoteSafeFeatureHref } from '@/components/features/filterPromoteSafeFeatureHrefs';
import { track } from '@/lib/features/track';
import {
  FeatureFaqItem,
  FeatureGroupDisplay,
  FeaturePageData,
  FeaturePageType,
  FeatureRecommendedReadingLink,
} from '@/types/featurePage';

interface FeatureHubPageProps {
  featureSlug: string;
  pageData: FeaturePageData;
  groups: FeatureGroupDisplay[];
  recommendedReadingLinks: FeatureRecommendedReadingLink[];
  promoteSafeFeatureHrefs: string[];
}

const narrowWorkflowSampleSlugs = new Set([
  'text-to-video-ai-tools',
  'content-repurposing-ai-tools',
  'ai-video-for-youtube',
  'ai-video-for-social-media',
  'ai-video-for-marketing',
  'ai-video-editors',
  'viral-ai-video-generators',
]);

const policyThresholdSampleSlugs = new Set([
  'free-ai-video-no-watermark',
  'budget-friendly-ai-video-tools',
  'fast-ai-video-generators',
]);

type RouteRedirect = {
  href: string;
  label: string;
  note: string;
};

type AtGlanceCard = {
  eyebrow: string;
  title: string;
  summary: string;
  support?: string | null;
  href?: string | null;
  cta?: string | null;
  external?: boolean;
};

type DecisionCard = {
  title: string;
  whenWins: string;
  whenDisappoints: string;
  compareHint?: string | null;
  redirect: RouteRedirect;
};

type GroupOverride = {
  chooseWhen: string;
  disappoints: string;
  redirect: RouteRedirect;
};

type FeaturePageOverride = {
  atGlanceCards?: AtGlanceCard[];
  decisionCards?: DecisionCard[];
  faqItems?: FeatureFaqItem[];
  groupOverrides?: Record<string, GroupOverride>;
  compactFrontHalf?: boolean;
};

const SAFE_FEATURE_HUB_REDIRECT: RouteRedirect = {
  href: '/features',
  label: 'Browse feature hub',
  note: 'Return to the feature hub to continue through promote-safe routes only.',
};

const faqQuestionOverrides: Partial<Record<string, Partial<Record<string, string>>>> = {
  'ai-video-editors': {
    qualifies: 'Do I need an AI editor, or a generator that starts from scratch?',
    compareFirst: 'Should I start with transcript editing, timeline editing, or clip-first editing?',
  },
  'fast-ai-video-generators': {
    qualifies: 'When is a speed-first generator actually the right route?',
    compareFirst: 'Is speed really the main bottleneck, or do quality and cost matter more?',
  },
  'budget-friendly-ai-video-tools': {
    qualifies: 'When should price be the first filter, and when should it not?',
    compareFirst: 'What matters more under $20: credits, watermark removal, or workflow fit?',
  },
  'text-to-video-ai-tools': {
    qualifies: 'Do I need text-to-video, or a different route like repurposing or avatars?',
    compareFirst: 'What should I compare first: prompt adherence, clip length, or commercial rights?',
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function firstSentence(value?: string | null): string {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1].trim() : trimmed;
}

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function compactJoin(values: string[]): string {
  return values.filter(Boolean).join(' · ');
}

function getPageTypeEyebrow(pageType: FeaturePageType): string {
  switch (pageType) {
    case 'broad-chooser':
      return 'Broad chooser';
    case 'comparison':
      return 'Comparison guide';
    case 'policy-threshold':
      return 'Policy guide';
    case 'business-procurement':
      return 'Business guide';
    default:
      return 'Workflow guide';
  }
}

function getHeroDefinition(pageType: FeaturePageType): string {
  switch (pageType) {
    case 'broad-chooser':
      return 'Use this page if you still need route-level guidance before you commit to a narrower shortlist.';
    case 'comparison':
      return 'Use this page if the route is already clear and the next job is direct tool-to-tool tradeoffs.';
    case 'policy-threshold':
      return 'Use this page if a threshold, bucket, or hard rule is the first filter.';
    case 'business-procurement':
      return 'Use this page if the buyer is choosing a business-ready tool rather than a broad workflow.';
    default:
      return 'Use this page if the route is mostly clear and the next job is narrowing a shortlist quickly.';
  }
}

function getFaqHeading(pageType: FeaturePageType): string {
  switch (pageType) {
    case 'broad-chooser':
      return 'Questions that usually decide the route';
    case 'comparison':
      return 'Questions that usually decide the direct comparison';
    case 'policy-threshold':
      return 'Questions that usually decide the threshold shortlist';
    default:
      return 'Questions that usually decide the shortlist';
  }
}

function getFurtherReadingHeading(pageType: FeaturePageType): string {
  if (pageType === 'broad-chooser') {
    return 'Keep going only after the route is clear';
  }

  return 'Keep going only if the fit still holds';
}

function getAtAGlanceTitle(pageType: FeaturePageType, groupCount: number): string {
  if (pageType === 'comparison') {
    return 'At a glance: start with the comparison lane that fits the decision';
  }

  if (pageType === 'policy-threshold') {
    return 'At a glance: know which policy bucket to check first';
  }

  if (groupCount === 1) {
    return 'At a glance: three quick shortlist checks before you scroll';
  }

  return 'At a glance: the strongest routes to check first';
}

function getDecisionTitle(pageType: FeaturePageType, routeSplitMode: 'full' | 'compact', groupCount: number): string {
  if (pageType === 'comparison') {
    return 'Choose the comparison route that matches the tradeoff you care about';
  }

  if (pageType === 'policy-threshold') {
    return 'Choose the policy bucket that matches the free-tier rule you can live with';
  }

  if (routeSplitMode === 'compact') {
    return groupCount === 1
      ? 'Quick route split: stay here only if this is the real constraint'
      : 'Quick route split';
  }

  if (groupCount === 1) {
    return 'Choose this route only if these checks match your real constraint';
  }

  return 'Choose your route before you compare individual tools';
}

function getResearchBasisLabel(pageData: FeaturePageData): string | null {
  if (pageData.meta.generatedFrom === 'research-raw') {
    return 'Built from normalized research data';
  }

  if (pageData.meta.generatedFrom === 'existing-feature-page') {
    return 'Adapted from existing reviewed feature data';
  }

  if (pageData.meta.generatedFrom === 'direct-json') {
    return 'Built from current feature page data';
  }

  return null;
}

function normalizeFaqItems(
  pageData: FeaturePageData,
  groups: FeatureGroupDisplay[],
): FeatureFaqItem[] {
  const overrideItems = featurePageOverrides[pageData.slug]?.faqItems;
  if (overrideItems?.length) {
    return overrideItems;
  }

  const questionOverrides = faqQuestionOverrides[pageData.slug];
  const baseItems = pageData.faq ?? [];
  const normalized = baseItems
    .map((item) => {
      if (/which tools already have internal review coverage/i.test(item.question)) {
        return null;
      }

      if (/what qualifies a tool for/i.test(item.question)) {
        return {
          question: questionOverrides?.qualifies ?? 'What actually belongs on this page, and what does not?',
          answer: item.answer,
        };
      }

      if (/what should readers compare first on this page/i.test(item.question)) {
        return {
          question:
            questionOverrides?.compareFirst ??
            (groups.length > 1
              ? 'What should I compare first when narrowing these routes?'
              : 'What should I compare first before using this shortlist?'),
          answer: item.answer,
        };
      }

      return item;
    })
    .filter((item): item is FeatureFaqItem => Boolean(item));

  const density = pageData.meta.modules.faqDensity;

  if (density === 'hidden') {
    return [];
  }

  return normalized.slice(0, density === 'light' ? 3 : 4);
}

const featurePageOverrides: Partial<Record<string, FeaturePageOverride>> = {
  'best-ai-video-generators': {
    compactFrontHalf: true,
    atGlanceCards: [
      {
        eyebrow: 'Best first check for cinematic clips',
        title: 'Runway',
        summary:
          'Start with Runway when you need prompt-based scenes you can actually ship for paid work without narrowing into a frontier-model rabbit hole first.',
        support: 'Best for controlled cinematic clips, creative iteration, and clearer commercial-use posture',
        href: '/tool/runway',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best first check for presenter-led video',
        title: 'HeyGen',
        summary:
          'Start with HeyGen if the real job is a person on screen: multilingual explainers, sales outreach, or fast avatar-led campaign content.',
        support: 'Best for external-facing avatar workflows before enterprise governance becomes the deciding factor',
        href: '/tool/heygen',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best governed avatar route',
        title: 'Synthesia',
        summary:
          'Move to Synthesia first when the buyer is L&D, HR, or operations and rollout discipline matters more than creative flexibility.',
        support: 'Best for training, internal communications, and teams that need a more governed presenter workflow',
        href: '/tool/synthesia',
        cta: 'Open review',
      },
      {
        eyebrow: 'Fastest social-effects route',
        title: 'Pika',
        summary:
          'Use Pika as the first check when the goal is fast TikTok or Reels-style output, not the most realistic scenes or the strongest presenter workflow.',
        support: 'Best for lightweight social effects and quick creative iteration',
        href: '/tool/pika',
        cta: 'Open review',
      },
    ],
    decisionCards: [
      {
        title: 'Cinematic generation',
        whenWins:
          'Choose this route when the video itself is the product: cinematic B-roll, product beauty shots, stylized prompt-based scenes, or short visual sequences where camera feel and realism matter more than a visible presenter.',
        whenDisappoints:
          'Skip this route if you really need an on-screen spokesperson, multilingual delivery, or fast daily social output. It is the wrong lane when message delivery matters more than scene generation.',
        compareHint: 'Compare visual control, clip realism, and commercial-use posture first',
        redirect: {
          href: '#cinematic-generation',
          label: 'Go to cinematic route',
          note: 'Start there if the buyer is judging footage quality before workflow automation.',
        },
      },
      {
        title: 'Avatar workflows',
        whenWins:
          'Choose this route when a speaker has to carry the message: training, explainers, localization, product walkthroughs, outreach, or faceless presenter-led content that would otherwise require filming.',
        whenDisappoints:
          'Skip this route if the output needs to feel like generated scenes, effects, or motion-heavy social clips. Avatar tools solve delivery and localization, not cinematic prompt generation.',
        compareHint: 'Compare delivery format, language coverage, and governance before price',
        redirect: {
          href: '#avatar-workflows',
          label: 'Go to avatar route',
          note: 'Use this lane if the decision starts with presenter format, not scene fidelity.',
        },
      },
      {
        title: 'Short-form effects',
        whenWins:
          'Choose this route when speed, trend fit, and repeatable short-form output matter more than deep control. It is the right lane for creators iterating on TikTok, Reels, and effect-led social content.',
        whenDisappoints:
          'Skip this route if you need polished cinematic shots, longer-form structure, or a believable presenter. Fast social generation is useful, but it is a narrower job than “best overall AI video.”',
        compareHint: 'Compare turnaround speed, social fit, and how much polish you actually need',
        redirect: {
          href: '#short-form-effects',
          label: 'Go to social-effects route',
          note: 'Start there if cadence and experimentation matter more than realism or governance.',
        },
      },
    ],
    faqItems: [
      {
        question: 'How do I decide between cinematic generation and avatar workflows?',
        answer:
          'Use cinematic generation when the footage itself has to carry the message: B-roll, scenes, product shots, or stylized visuals. Use avatar workflows when the message depends on a speaker, localization, training delivery, or a presenter-led format.',
      },
      {
        question: 'When should I shortlist Pika instead of Runway or Sora?',
        answer:
          'Shortlist Pika when the real goal is fast social iteration and effects-driven clips. Start with Runway or Sora when you care more about cinematic control, higher-end visual output, or a route that can justify a deeper creative workflow.',
      },
      {
        question: 'When should I leave this page for a narrower guide?',
        answer:
          'Leave this page once the route is clear. If you already know you need avatars, go narrower into the avatar page. If you are already comparing top text-to-video models directly, the comparison page becomes more useful than this broad chooser.',
      },
      {
        question: 'What should I compare first after I pick the right route?',
        answer:
          'Start with the one constraint that can break the workflow. For cinematic tools, that is usually output quality and rights. For avatars, it is workflow fit, language support, and governance. For social effects, it is speed, ease of iteration, and whether the output quality is good enough for the channel.',
      },
    ],
    groupOverrides: {
      'Cinematic generation': {
        chooseWhen:
          'Choose this route when you need the model to create the actual footage: prompt-based scenes, cinematic B-roll, product visuals, or short clips where realism, motion, and framing matter more than having a presenter on screen.',
        disappoints:
          'Choose something else when the job is really localization, training, or a fast social content engine. This lane is strongest when image quality and scene control justify a more generation-first workflow.',
        redirect: {
          href: '/features/ai-video-generators-comparison',
          label: 'Already down to leading generation models?',
          note: 'Use the comparison page once you are choosing between top cinematic models rather than between routes.',
        },
      },
      'Avatar workflows': {
        chooseWhen:
          'Choose this route when delivery matters more than scene invention. It is the right lane for explainers, training, multilingual communications, or any workflow where a presenter has to speak directly to the audience.',
        disappoints:
          'Choose something else when you need prompt-driven scenes or effects-led social content. Avatar tools solve speaker-led communication better than they solve raw visual generation.',
        redirect: {
          href: '/features/ai-avatar-video-generators',
          label: 'Need the full avatar shortlist?',
          note: 'The dedicated avatar page is the better next step once you know presenter-led output is the real job.',
        },
      },
      'Short-form effects': {
        chooseWhen:
          'Choose this route when the goal is short, fast, platform-native content: TikTok hooks, Reels experiments, and effect-led clips that need to ship quickly and often.',
        disappoints:
          'Choose something else when your buyer expects more polished cinematic output, a structured long-form workflow, or a more believable presenter-led format. Speed-first social generation is useful, but narrow.',
        redirect: {
          href: '/features/ai-video-for-social-media',
          label: 'Need the narrower social-media guide?',
          note: 'Go there once you know the workflow is social-first and you want a more specialized shortlist.',
        },
      },
    },
  },
  'ai-avatar-video-generators': {
    compactFrontHalf: true,
    atGlanceCards: [
      {
        eyebrow: 'Default once avatar fit is clear',
        title: 'HeyGen',
        summary: 'Strongest first check once you know the message needs a presenter on screen and the job is not really enterprise training, API delivery, or photo animation.',
        support: 'Best for fast talking-head delivery, multilingual spokesperson output, and presenter-led explainers',
        href: '/tool/heygen',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best if governance drives the choice',
        title: 'Synthesia',
        summary: 'Best starting point when governance, training rollout, and predictable seat-based deployment matter more than campaign flexibility.',
        support: 'Best for corporate training, compliance, and L&D teams',
        href: '/tool/synthesia',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best if interactivity is the real need',
        title: 'Colossyan',
        summary: 'Most relevant if branching scenarios and quiz-style training are what actually justify using an avatar platform.',
        support: 'Best for instructional design and structured learning flows',
        href: '/tool/colossyan',
        cta: 'Open review',
      },
      {
        eyebrow: 'Best if delivery is technical or photo-based',
        title: 'D-ID',
        summary: 'Best fit when the job is animating an image or plugging avatar generation into a product workflow, not picking a stock presenter.',
        support: 'Best for API delivery and photo-to-avatar use cases',
        href: '/tool/d-id',
        cta: 'Open review',
      },
    ],
    decisionCards: [
      {
        title: 'Marketing and social avatars',
        whenWins:
          'Choose this route only after you know a presenter has to carry the message. It is the right fit for outreach, product explainers, and multilingual spokesperson content where speed, language coverage, and believable lip-sync matter more than procurement controls.',
        whenDisappoints:
          'It disappoints when the real buyer is still choosing a broader marketing workflow, or when L&D, HR, and compliance need stronger governance than a lighter presenter stack provides.',
        compareHint: 'Presenter realism, lip-sync, and delivery speed',
        redirect: {
          href: '#marketing-and-social-avatars',
          label: 'Go to marketing/social route',
          note: 'Start there only after presenter-led outward-facing delivery is clearly the job.',
        },
      },
      {
        title: 'Training and enterprise avatars',
        whenWins:
          'Choose this route after avatar fit is clear and the workflow is structured training, onboarding, compliance, or global internal communications. These tools win when repeatability, governance, and controlled avatar rollout matter more than creative flexibility.',
        whenDisappoints:
          'It disappoints when you mainly need campaign iteration, lighter marketing output, or broader commercial workflow tooling. The overhead makes less sense if the job is growth content rather than governed speaker-led enablement.',
        compareHint: 'Governance, admin controls, and custom-avatar policy',
        redirect: {
          href: '#training-and-enterprise-avatars',
          label: 'Go to training/enterprise route',
          note: 'Start there when approvals, repeatability, and internal speaker-led rollout matter more than campaign flexibility.',
        },
      },
      {
        title: 'Image and API avatar tools',
        whenWins:
          'Choose this route after avatar fit is clear and you specifically need still-image animation or avatar output through an API. It is for product builders and specialized delivery workflows, not general-purpose spokesperson video.',
        whenDisappoints:
          'It disappoints when you really want a ready-made presenter library, enterprise training stack, or a broad avatar studio for non-technical teams. The format is narrower by design.',
        compareHint: 'API delivery, photo animation, and custom-input flexibility',
        redirect: {
          href: '#image-and-api-avatar-tools',
          label: 'Go to image/API route',
          note: 'Start there if the differentiator is technical delivery or photo-based animation rather than a stock presenter studio.',
        },
      },
    ],
    faqItems: [
      {
        question: 'Do I actually need avatar tools, or would text-to-video be better?',
        answer:
          'Use avatar tools when the message depends on a presenter speaking on screen. Use text-to-video when scenes, B-roll, or visual storytelling carry the message without a human-like host.',
      },
      {
        question: 'I need a talking presenter for marketing. Do I start with HeyGen or something else?',
        answer:
          'Start with HeyGen if the job is outreach, product explanation, or multilingual presenter content and you need faster iteration. Move elsewhere only if the real constraint is enterprise governance or API/photo-animation delivery.',
      },
      {
        question: 'I need training videos. Should I start with Synthesia, Colossyan, or a lighter avatar tool?',
        answer:
          'Start with Synthesia when governance, repeatability, and structured rollout are the main constraints. Start with Colossyan when interactive training is the reason you are buying. Use a lighter avatar tool when the job is external-facing presenter delivery rather than training ops.',
      },
      {
        question: 'When is Colossyan worth it over the bigger avatar platforms?',
        answer:
          'Colossyan is the better route when branching scenarios and quiz-based learning are the real reason you need avatars. If interactivity is not central, broader avatar platforms are usually the cleaner first stop.',
      },
      {
        question: 'What if I need a custom likeness, photo animation, or API delivery?',
        answer:
          'Start with the image and API route if you need photo animation or a technical delivery path. If you need a governed custom avatar for internal rollout, the enterprise route is usually more relevant. Treat custom likeness as an early filter because eligibility changes a lot by vendor and plan.',
      },
      {
        question: 'What should I compare first after I know avatar tools are the right route?',
        answer:
          'Start with avatar workflow fit, then compare the one constraint most likely to break the rollout. For outward-facing presenter teams that is usually language coverage, voice quality, and speed. For L&D and compliance teams it is governance and admin structure. Cost per minute matters, but only after you know a presenter-led workflow is really the job.',
      },
      {
        question: 'When does this page stop being the right frame?',
        answer:
          'Leave this page when the real decision is no longer presenter-led delivery. If you mainly need prompt-generated scenes, source-content conversion, or a broader marketing workflow, another route will usually answer the question faster.',
      },
    ],
    groupOverrides: {
      'Marketing and social avatars': {
        chooseWhen:
          'Choose this route when the video has to be carried by a presenter: personalized outreach, multilingual product messaging, spokesperson explainers, or fast external-facing delivery where lip-sync and language breadth are the main levers.',
        disappoints:
          'Choose something else when the workflow is formal training, compliance, or controlled internal rollout. It is also the wrong lane when campaign governance and commercialization strategy matter more than the presenter format itself.',
        redirect: {
          href: '#training-and-enterprise-avatars',
          label: 'Need the enterprise training route?',
          note: 'The next section is a better fit when the buyer is L&D, HR, or operations instead of growth or content.',
        },
      },
      'Training and enterprise avatars': {
        chooseWhen:
          'Choose this route when repeatability, admin structure, and training workflow matter more than creative experimentation. This is the right lane for internal enablement, compliance, onboarding, and formal multilingual communications that still depend on a speaker-led format.',
        disappoints:
          'Choose something else when you mainly need fast campaign personalization or lighter-weight social content. The structure helps enterprise teams, but can feel heavy when the main decision is just a lighter presenter format for external use.',
        redirect: {
          href: '#marketing-and-social-avatars',
          label: 'Need a lighter marketing route?',
          note: 'Go back to the marketing and social section if speed and outward-facing content matter more than governance.',
        },
      },
      'Image and API avatar tools': {
        chooseWhen:
          'Choose this route when the differentiator is custom-photo animation or API delivery. It makes sense when you are building a product workflow, embedding avatar output, or animating a specific image, not when you just need a library of ready-made presenters for a campaign.',
        disappoints:
          'Choose something else when non-technical teams need an easier studio, stronger governance, or broader stock-avatar choice. This lane is more specialized and narrower by intent.',
        redirect: {
          href: '#marketing-and-social-avatars',
          label: 'Need a broader avatar studio instead?',
          note: 'Move back to the main avatar routes if you are not solving a photo-animation or API problem.',
        },
      },
    },
  },
};

function getGroupRedirect(pageData: FeaturePageData, groupTitle: string): RouteRedirect {
  const title = groupTitle.toLowerCase();

  if (pageData.meta.pageType === 'comparison') {
    return {
      href: '/features/best-ai-video-generators',
      label: 'Need a broader generator shortlist first?',
      note: 'Use the broader generators page before forcing a model-vs-model decision.',
    };
  }

  if (pageData.meta.pageType === 'policy-threshold') {
    if (title.includes('truly free')) {
      return {
        href: '/features/budget-friendly-ai-video-tools',
        label: 'Can pay a little for better output instead?',
        note: 'Use the budget page once free export quality matters more than staying at $0.',
      };
    }

    return {
      href: '/features/best-ai-video-generators',
      label: 'Need the best overall tools, not just free-tier policy?',
      note: 'The broader generators page is a better fit if watermark policy is not the main constraint.',
    };
  }

  if (title.includes('avatar') || title.includes('presenter') || title.includes('training and communications')) {
    return {
      href: '/features/text-to-video-ai-tools',
      label: 'Need prompt-based scenes instead?',
      note: 'Go there if the output does not need a visible speaker.',
    };
  }

  if (title.includes('repurpos') || title.includes('article') || title.includes('script conversion') || title.includes('clipping')) {
    return {
      href: '/features/text-to-video-ai-tools',
      label: 'Starting from a blank prompt instead?',
      note: 'Use the text-to-video page if you do not already have source material to convert.',
    };
  }

  if (
    title.includes('social') ||
    title.includes('short-form') ||
    title.includes('rapid') ||
    title.includes('youtube') ||
    title.includes('viral')
  ) {
    return {
      href: '/features/ai-avatar-video-generators',
      label: 'Need a presenter-led route instead?',
      note: 'Move there if message delivery matters more than throughput, hooks, or clip velocity.',
    };
  }

  if (title.includes('enterprise') || title.includes('team') || title.includes('governed') || title.includes('knowledge ops')) {
    return {
      href: '/features/best-ai-video-generators',
      label: 'Choosing as a solo creator instead?',
      note: 'The broader generators page is a better first stop when governance and procurement do not matter.',
    };
  }

  if (
    title.includes('cinematic') ||
    title.includes('frontier') ||
    title.includes('text-to-video') ||
    title.includes('generator') ||
    title.includes('creator-access')
  ) {
    return {
      href: '/features/content-repurposing-ai-tools',
      label: 'Already have content to convert instead?',
      note: 'Use the repurposing page when the job is conversion, not generation from scratch.',
    };
  }

  if (title.includes('budget')) {
    return {
      href: '/features/best-ai-video-generators',
      label: 'Need the strongest overall tools instead?',
      note: 'Use the broader generators page if price ceiling is no longer the primary filter.',
    };
  }

  return {
    href: '/features/best-ai-video-generators',
    label: 'Need a broader route instead?',
    note: 'Use the main generators page if this group feels too narrow for the job.',
  };
}

function getWhenDisappoints(pageData: FeaturePageData, groupTitle: string): string {
  const title = groupTitle.toLowerCase();

  if (pageData.meta.pageType === 'comparison') {
    return 'This route disappoints if you still need broad discovery rather than direct model-vs-model tradeoffs.';
  }

  if (pageData.meta.pageType === 'policy-threshold') {
    if (title.includes('truly free')) {
      return 'This route disappoints if you need higher resolution, more credits, or predictable commercial output at scale.';
    }

    if (title.includes('conditional')) {
      return 'This route disappoints if you need the no-watermark rule to hold consistently across every export.';
    }

    return 'This route disappoints if paying anything at all defeats the point of the shortlist.';
  }

  if (title.includes('avatar') || title.includes('presenter')) {
    return 'This route disappoints if the content does not need a visible speaker or if you mainly need prompt-generated scenes.';
  }

  if (title.includes('repurpos') || title.includes('article') || title.includes('clipping')) {
    return 'This route disappoints if you are starting from a blank brief instead of existing source material.';
  }

  if (
    title.includes('social') ||
    title.includes('short-form') ||
    title.includes('rapid') ||
    title.includes('youtube') ||
    title.includes('viral')
  ) {
    return 'This route disappoints if long-form control, presenter realism, or enterprise governance matters more than speed and publishing cadence.';
  }

  if (title.includes('enterprise') || title.includes('team') || title.includes('governed')) {
    return 'This route disappoints if you are a solo creator and do not need admin controls, governance, or procurement features.';
  }

  if (
    title.includes('cinematic') ||
    title.includes('frontier') ||
    title.includes('text-to-video') ||
    title.includes('generator') ||
    title.includes('creator-access')
  ) {
    return 'This route disappoints if you already have content to convert or if the job depends on a presenter-led format.';
  }

  if (title.includes('budget')) {
    return 'This route disappoints if price is not the real constraint and output quality or workflow fit matters more.';
  }

  return 'This route disappoints if its core workflow is not the main job you need to solve.';
}

const pageRedirectOverrides: Partial<Record<string, RouteRedirect[]>> = {
  'best-ai-video-generators': [
    {
      href: '/features/ai-avatar-video-generators',
      label: 'Need a presenter-led route instead?',
      note: 'Use the avatar page if a face and voice are central to the message.',
    },
    {
      href: '/features/ai-video-for-social-media',
      label: 'Optimizing for social volume instead?',
      note: 'The social page is a better fit when cadence matters more than broad discovery.',
    },
    {
      href: '/features/ai-video-generators-comparison',
      label: 'Already down to leading models?',
      note: 'Move to the comparison page once the shortlist is small enough for direct tradeoffs.',
    },
  ],
  'text-to-video-ai-tools': [
    {
      href: '/features/content-repurposing-ai-tools',
      label: 'Already have source material to convert?',
      note: 'Use the repurposing page if the job starts with articles, webinars, podcasts, or long-form recordings.',
    },
    {
      href: '/features/ai-avatar-video-generators',
      label: 'Need a speaker on screen instead?',
      note: 'Move to the avatar page if delivery and lip-sync matter more than prompt-only generation.',
    },
    {
      href: '/features/ai-video-generators-comparison',
      label: 'Need direct model-vs-model tradeoffs?',
      note: 'Use the comparison page if the shortlist is already limited to top generation models.',
    },
  ],
  'ai-video-for-youtube': [
    {
      href: '/features/ai-video-for-social-media',
      label: 'Publishing mainly short-form social instead?',
      note: 'The social page is a better route when Shorts, Reels, and TikTok-style cadence dominate the workflow.',
    },
    {
      href: '/features/content-repurposing-ai-tools',
      label: 'Repurposing long-form content into clips?',
      note: 'Go there if you already have webinars, interviews, or podcasts and need clipping more than channel automation.',
    },
    {
      href: '/features/ai-avatar-video-generators',
      label: 'Need a realistic host instead of faceless automation?',
      note: 'The avatar page is the better route when the channel format depends on a presenter.',
    },
  ],
  'fast-ai-video-generators': [
    {
      href: '/features/budget-friendly-ai-video-tools',
      label: 'Price ceiling matters more than speed?',
      note: 'Use the budget page if low monthly cost is the main filter rather than render time.',
    },
    {
      href: '/features/ai-video-generators-comparison',
      label: 'Need deeper quality and spec tradeoffs instead?',
      note: 'The comparison page is stronger when motion quality, resolution, and API posture matter more than raw speed.',
    },
    {
      href: '/features/ai-video-for-social-media',
      label: 'Really optimizing for social output?',
      note: 'Move there if publishing cadence, captions, and platform fit matter more than the raw render benchmark.',
    },
  ],
  'free-ai-video-no-watermark': [
    {
      href: '/features/budget-friendly-ai-video-tools',
      label: 'Willing to pay a little for cleaner output?',
      note: 'The budget page is a better route once free-tier constraints are too limiting.',
    },
    {
      href: '/features/best-ai-video-generators',
      label: 'Need the best overall tools instead?',
      note: 'Use the broader generators page if watermark policy is not the main decision rule.',
    },
  ],
  'ai-video-generators-comparison': [
    {
      href: '/features/best-ai-video-generators',
      label: 'Need a broader generator shortlist first?',
      note: 'Go there if you are still narrowing the field before doing direct model tradeoffs.',
    },
    {
      href: '/features/text-to-video-ai-tools',
      label: 'Need a more practical text-to-video shortlist?',
      note: 'Use the text-to-video page if you care more about workflow fit than model-level comparison.',
    },
  ],
};

function getPageRedirects(pageData: FeaturePageData): RouteRedirect[] {
  return pageRedirectOverrides[pageData.slug] ?? [];
}

function buildAtGlanceCards(
  pageData: FeaturePageData,
  groups: FeatureGroupDisplay[],
): AtGlanceCard[] {
  const override = featurePageOverrides[pageData.slug];
  if (override?.atGlanceCards?.length) {
    return override.atGlanceCards;
  }

  if (groups.length === 1) {
    return groups[0].tools.slice(0, 3).map((tool) => ({
      eyebrow: 'Shortlist pick',
      title: tool.displayName,
      summary: tool.reasonLine1,
      support: tool.bestFor ?? tool.pricingStartAt ?? tool.watermarkPolicy ?? null,
      href: tool.reviewUrl ?? tool.officialUrl ?? null,
      external: !tool.reviewUrl && Boolean(tool.officialUrl),
      cta: tool.reviewUrl ? 'Open review' : tool.officialUrl ? 'Visit official site' : null,
    }));
  }

  if (pageData.meta.pageType === 'broad-chooser') {
    return groups.slice(0, 4).map((group) => {
      const leadTool = group.tools[0];

      return {
        eyebrow: `Start with ${group.groupTitle.toLowerCase()}`,
        title: leadTool?.displayName ?? group.groupTitle,
        summary:
          leadTool?.reasonLine1 ??
          firstSentence(group.groupSummary) ??
          `Start with ${group.groupTitle.toLowerCase()} if that is the strongest match for the workflow.`,
        support: leadTool?.bestFor ?? group.groupSummary ?? null,
        href: leadTool?.reviewUrl ?? leadTool?.officialUrl ?? `#${slugify(group.groupTitle)}`,
        external: !leadTool?.reviewUrl && Boolean(leadTool?.officialUrl),
        cta: leadTool?.reviewUrl ? 'Open review' : leadTool?.officialUrl ? 'Visit official site' : 'Open route',
      };
    });
  }

  return groups.slice(0, 3).map((group) => ({
    eyebrow:
      pageData.meta.pageType === 'comparison'
        ? 'Comparison lane'
        : pageData.meta.pageType === 'policy-threshold'
          ? 'Policy bucket'
          : 'Route',
    title: group.groupTitle,
    summary: firstSentence(group.groupSummary) || `Start with ${group.groupTitle.toLowerCase()} if that is the strongest match for the workflow.`,
    support: `Tools to check: ${compactJoin(group.tools.slice(0, 3).map((tool) => tool.displayName))}`,
    href: `#${slugify(group.groupTitle)}`,
    cta: pageData.meta.pageType === 'comparison' ? 'Open lane' : 'Open route',
  }));
}

function buildDecisionCards(
  pageData: FeaturePageData,
  groups: FeatureGroupDisplay[],
): DecisionCard[] {
  const override = featurePageOverrides[pageData.slug];
  if (override?.decisionCards?.length) {
    return override.decisionCards;
  }

  const criteria = pageData.howToChoose?.criteria ?? [];

  if (groups.length > 1) {
    return groups.slice(0, 4).map((group, index) => ({
      title: group.groupTitle,
      whenWins:
        firstSentence(group.groupSummary) ||
        `Choose this route when ${group.groupTitle.toLowerCase()} is the best match for the job.`,
      whenDisappoints: getWhenDisappoints(pageData, group.groupTitle),
      compareHint: criteria[index]?.title ?? pageData.meta.comparisonAxes[index] ?? null,
      redirect: getGroupRedirect(pageData, group.groupTitle),
    }));
  }

  const redirects = getPageRedirects(pageData);
  const cardsFromCriteria = criteria.slice(0, 3).map((criterion, index) => ({
    title: criterion.title,
    whenWins: criterion.desc ?? pageData.hero.subheadline,
    whenDisappoints:
      index === 0
        ? 'If this is not the main constraint, this page may be too narrow for the job.'
        : 'If this check is secondary, you may need a different route before choosing a tool.',
    compareHint: pageData.meta.comparisonAxes[index] ?? null,
    redirect: redirects[index] ?? redirects[0] ?? SAFE_FEATURE_HUB_REDIRECT,
  }));

  return cardsFromCriteria.length > 0
    ? cardsFromCriteria
    : [
        {
          title: 'Start with the core constraint',
          whenWins: pageData.hero.subheadline,
          whenDisappoints: 'This page disappoints if its main constraint is not actually what drives the decision.',
          compareHint: pageData.meta.comparisonAxes[0] ?? null,
          redirect: redirects[0] ?? SAFE_FEATURE_HUB_REDIRECT,
        },
      ];
}

function getContextLinksForGroup(
  pageData: FeaturePageData,
  group: FeatureGroupDisplay,
  recommendedReadingLinks: FeatureRecommendedReadingLink[],
  promoteSafeFeatureHrefs: Set<string>,
): FeatureRecommendedReadingLink[] {
  const toolSlugs = new Set(group.tools.map((tool) => tool.toolSlug));

  const matched = recommendedReadingLinks.filter((item) => {
    if (item.linkType === 'tool' && toolSlugs.has(item.destinationSlug)) {
      return true;
    }

    if (item.linkType === 'tool_alternatives') {
      const rootSlug = item.destinationSlug.replace(/\/alternatives$/, '');
      return toolSlugs.has(rootSlug);
    }

    return false;
  });

  if (pageData.slug === 'ai-avatar-video-generators') {
    const matchedReviews = matched.filter((item) => item.linkType === 'tool');
    if (matchedReviews.length > 0) {
      return matchedReviews.slice(0, 2);
    }
  }

  if (matched.length > 0) {
    return matched.slice(0, 3);
  }

  const redirects = getPageRedirects(pageData);
  if (redirects.length === 0) {
    return [];
  }

  return redirects.slice(0, 1).map((redirect) => {
    const safeRedirect = sanitizeRouteRedirect(redirect, promoteSafeFeatureHrefs);

    return {
      href: safeRedirect.href,
      label: safeRedirect.label,
      linkType: 'guide',
      destinationSlug: safeRedirect.href.replace(/^\/+/, ''),
    };
  });
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

const recommendedReadingOrder: FeatureRecommendedReadingLink['linkType'][] = ['tool', 'vs', 'guide', 'tool_alternatives'];

function buildRecommendedGroups(
  pageData: FeaturePageData,
  recommendedReadingLinks: FeatureRecommendedReadingLink[],
) {
  if (pageData.slug === 'ai-avatar-video-generators') {
    return (['tool', 'vs'] as const)
      .map((linkType) => ({
        linkType,
        title: getRecommendedSectionTitle(linkType),
        items: recommendedReadingLinks.filter((item) => item.linkType === linkType).slice(0, 2),
      }))
      .filter((group) => group.items.length > 0);
  }

  return recommendedReadingOrder
    .map((linkType) => ({
      linkType,
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType),
    }))
    .filter((group) => group.items.length > 0);
}

function getPolicyLabel(pageData: FeaturePageData): string {
  return pageData.meta.pageType === 'policy-threshold' ? 'Watermark policy' : 'Policy';
}

function sanitizeRouteRedirect(redirect: RouteRedirect, promoteSafeFeatureHrefs: Set<string>): RouteRedirect {
  const resolved = resolvePromoteSafeFeatureHref(redirect.href, promoteSafeFeatureHrefs, SAFE_FEATURE_HUB_REDIRECT.href);

  if (!resolved.usedFallback) {
    return {
      ...redirect,
      href: resolved.href ?? redirect.href,
    };
  }

  return SAFE_FEATURE_HUB_REDIRECT;
}

function sanitizeAtGlanceCard(card: AtGlanceCard, promoteSafeFeatureHrefs: Set<string>): AtGlanceCard {
  if (!card.href) {
    return card;
  }

  const resolved = resolvePromoteSafeFeatureHref(card.href, promoteSafeFeatureHrefs, SAFE_FEATURE_HUB_REDIRECT.href);

  if (!resolved.usedFallback) {
    return {
      ...card,
      href: resolved.href,
    };
  }

  return {
    ...card,
    href: SAFE_FEATURE_HUB_REDIRECT.href,
    cta: SAFE_FEATURE_HUB_REDIRECT.label,
    external: false,
  };
}

function sanitizeDecisionCard(card: DecisionCard, promoteSafeFeatureHrefs: Set<string>): DecisionCard {
  return {
    ...card,
    redirect: sanitizeRouteRedirect(card.redirect, promoteSafeFeatureHrefs),
  };
}

function renderAtGlanceCard(card: AtGlanceCard, compact = false) {
  const wrapperClass = compact
    ? 'block rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-300'
    : 'block rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-indigo-300';
  const staticWrapperClass = compact
    ? 'rounded-2xl border border-gray-200 bg-white p-4'
    : 'rounded-2xl border border-gray-200 bg-white p-5';
  const summary = compact ? firstSentence(card.summary) : card.summary;

  if (card.href) {
    if (card.external) {
      return (
        <a
          href={card.href}
          target="_blank"
          rel="noopener noreferrer"
          className={wrapperClass}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">{card.eyebrow}</p>
          <h3 className="mt-2.5 text-lg font-bold text-gray-900">{card.title}</h3>
          <p className="mt-2.5 text-sm leading-6 text-gray-600">{summary}</p>
          {card.support ? (
            <p className={`mt-2.5 ${compact ? 'text-xs leading-6 text-gray-700' : 'text-sm font-medium text-gray-800'}`}>
              {card.support}
            </p>
          ) : null}
          {card.cta ? (
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600">
              {card.cta}
              <span className="ml-2">→</span>
            </span>
          ) : null}
        </a>
      );
    }

    return (
      <Link
        href={card.href}
        className={wrapperClass}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">{card.eyebrow}</p>
        <h3 className="mt-2.5 text-lg font-bold text-gray-900">{card.title}</h3>
        <p className="mt-2.5 text-sm leading-6 text-gray-600">{summary}</p>
        {card.support ? (
          <p className={`mt-2.5 ${compact ? 'text-xs leading-6 text-gray-700' : 'text-sm font-medium text-gray-800'}`}>
            {card.support}
          </p>
        ) : null}
        {card.cta ? (
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600">
            {card.cta}
            <span className="ml-2">→</span>
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <div className={staticWrapperClass}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">{card.eyebrow}</p>
      <h3 className="mt-2.5 text-lg font-bold text-gray-900">{card.title}</h3>
      <p className="mt-2.5 text-sm leading-6 text-gray-600">{summary}</p>
      {card.support ? (
        <p className={`mt-2.5 ${compact ? 'text-xs leading-6 text-gray-700' : 'text-sm font-medium text-gray-800'}`}>
          {card.support}
        </p>
      ) : null}
    </div>
  );
}

function getGroupSectionEyebrow(pageType: FeaturePageType): string {
  if (pageType === 'comparison') {
    return 'Comparison lane';
  }

  if (pageType === 'policy-threshold') {
    return 'Policy bucket';
  }

  if (pageType === 'broad-chooser') {
    return 'Workflow route';
  }

  return 'Workflow section';
}

export default function FeatureHubPage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
  promoteSafeFeatureHrefs,
}: FeatureHubPageProps) {
  const promoteSafeFeatureHrefSet = new Set(promoteSafeFeatureHrefs);
  const recommendedGroups = buildRecommendedGroups(pageData, recommendedReadingLinks);

  const { pageType, modules } = pageData.meta;
  const isBroadChooser = pageType === 'broad-chooser';
  const isCompactRouteSplit = modules.routeSplit === 'compact';
  const atGlanceCards = buildAtGlanceCards(pageData, groups).map((card) =>
    sanitizeAtGlanceCard(card, promoteSafeFeatureHrefSet)
  );
  const decisionCards = buildDecisionCards(pageData, groups).map((card) =>
    sanitizeDecisionCard(card, promoteSafeFeatureHrefSet)
  );
  const compactFrontHalf = featurePageOverrides[pageData.slug]?.compactFrontHalf === true;
  const lastReviewedLabel = formatDate(pageData.meta.lastReviewed);
  const researchBasisLabel = getResearchBasisLabel(pageData);
  const faqItems = normalizeFaqItems(pageData, groups);

  useEffect(() => {
    if (
      pageType === 'comparison' ||
      (pageType === 'policy-threshold' && policyThresholdSampleSlugs.has(pageData.slug)) ||
      pageType === 'business-procurement' ||
      (pageType === 'narrow-workflow' && narrowWorkflowSampleSlugs.has(pageData.slug))
    ) {
      return;
    }

    track('page_view', {
      page_type: 'feature_hub',
      feature_slug: featureSlug,
    });
  }, [featureSlug, pageData.slug, pageType]);

  if (pageType === 'comparison') {
    return (
      <ComparisonFeaturePage
        featureSlug={featureSlug}
        pageData={pageData}
        groups={groups}
        recommendedReadingLinks={recommendedReadingLinks}
        promoteSafeFeatureHrefs={promoteSafeFeatureHrefs}
      />
    );
  }

  if (pageType === 'policy-threshold' && policyThresholdSampleSlugs.has(pageData.slug)) {
    return (
      <PolicyThresholdFeaturePage
        featureSlug={featureSlug}
        pageData={pageData}
        groups={groups}
        recommendedReadingLinks={recommendedReadingLinks}
        promoteSafeFeatureHrefs={promoteSafeFeatureHrefs}
      />
    );
  }

  if (pageType === 'business-procurement') {
    return (
      <BusinessProcurementFeaturePage
        featureSlug={featureSlug}
        pageData={pageData}
        groups={groups}
        recommendedReadingLinks={recommendedReadingLinks}
        promoteSafeFeatureHrefs={promoteSafeFeatureHrefs}
      />
    );
  }

  if (pageType === 'narrow-workflow' && narrowWorkflowSampleSlugs.has(pageData.slug)) {
    return (
      <NarrowWorkflowFeaturePage
        featureSlug={featureSlug}
        pageData={pageData}
        groups={groups}
        recommendedReadingLinks={recommendedReadingLinks}
        promoteSafeFeatureHrefs={promoteSafeFeatureHrefs}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F9FAFB] pb-24 text-gray-900"
      data-feature-page-type={pageType}
      data-feature-primary-surface={modules.primarySurface}
    >
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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

          <div className="rounded-[28px] border-2 border-black bg-[#D9F99D] p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-700">
                {getPageTypeEyebrow(pageType)}
              </p>
              {lastReviewedLabel ? (
                <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                  Last reviewed {lastReviewedLabel}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {pageData.hero.h1}
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">
              {getHeroDefinition(pageType)}
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700">{pageData.hero.subheadline}</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Scope and rule</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">
                  {pageData.meta.primaryClassificationRule ||
                    pageData.hero.definitionBullets[0] ||
                    'Use the route and comparison scope on this page before deciding which tool deserves a closer look.'}
                </p>
                {pageData.meta.needsManualReview ? (
                  <p className="mt-3 text-xs leading-6 text-gray-600">
                    {pageData.meta.reviewNotes?.[0] ??
                      'Some claims on this page still rely on rolling source verification. Treat vendor-reported data as directional where noted.'}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">What matters most</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(pageData.meta.comparisonAxes.length > 0
                    ? pageData.meta.comparisonAxes
                    : pageData.hero.definitionBullets).slice(0, 5).map((axis) => (
                    <span
                      key={axis}
                      className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700"
                    >
                      {axis}
                    </span>
                  ))}
                </div>
                {researchBasisLabel ? (
                  <p className="mt-4 text-xs leading-6 text-gray-600">
                    {researchBasisLabel}
                    {pageData.meta.sourceCount ? ` · ${pageData.meta.sourceCount} source sets` : ''}
                    {pageData.meta.uniqueToolCount ? ` · ${pageData.meta.uniqueToolCount} tools in scope` : ''}
                  </p>
                ) : null}
              </div>
            </div>

            {pageData.hero.definitionBullets.length > 0 &&
              (compactFrontHalf ? (
                <div className="mt-7 flex flex-wrap gap-2.5">
                  {pageData.hero.definitionBullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="rounded-full border border-black/10 bg-white/85 px-3 py-1.5 text-xs font-semibold text-gray-700"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {pageData.hero.definitionBullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]"
                    >
                      <p className="text-sm font-medium leading-6 text-gray-800">{bullet}</p>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </header>

      <main
        className={`mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 ${
          compactFrontHalf ? 'space-y-12' : 'space-y-14'
        }`}
      >
        {modules.atGlance !== 'hidden' && atGlanceCards.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Best picks at a glance</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{getAtAGlanceTitle(pageType, groups.length)}</h2>
            </div>

            <div className={`mt-8 grid md:grid-cols-2 xl:grid-cols-3 ${compactFrontHalf ? 'gap-3' : 'gap-4'}`}>
              {atGlanceCards.map((card) => (
                <div key={`${card.eyebrow}-${card.title}`}>{renderAtGlanceCard(card, compactFrontHalf)}</div>
              ))}
            </div>
          </section>
        )}

        {modules.routeSplit !== 'hidden' && decisionCards.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Choose your route</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                {getDecisionTitle(pageType, modules.routeSplit, groups.length)}
              </h2>
            </div>

            <div
              className={`mt-8 grid ${
                isBroadChooser
                  ? 'lg:grid-cols-3'
                  : isCompactRouteSplit
                    ? 'md:grid-cols-2 xl:grid-cols-3'
                    : 'xl:grid-cols-2'
              } ${compactFrontHalf ? 'gap-3' : 'gap-4'}`}
            >
              {decisionCards.map((card) => (
                <article key={card.title} className="rounded-2xl border border-gray-200 bg-[#FCFBF7] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                    {card.compareHint ? (
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                        {isBroadChooser ? `Compare first: ${card.compareHint}` : card.compareHint}
                      </span>
                    ) : null}
                  </div>

                  {isBroadChooser ? (
                    <>
                      <div className={`mt-5 ${compactFrontHalf ? 'space-y-3' : 'space-y-4'}`}>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Start here when</p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">
                            {compactFrontHalf ? firstSentence(card.whenWins) : card.whenWins}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Leave this route if...</p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">
                            {compactFrontHalf ? firstSentence(card.whenDisappoints) : card.whenDisappoints}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
                        <Link href={card.redirect.href} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                          {card.redirect.label}
                        </Link>
                        {!compactFrontHalf ? <span className="text-xs leading-6 text-gray-500">{card.redirect.note}</span> : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`mt-4 grid gap-4 ${isCompactRouteSplit ? '' : 'md:grid-cols-2'}`}>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                            {isCompactRouteSplit ? 'Best for' : 'Best when'}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">
                            {isCompactRouteSplit ? firstSentence(card.whenWins) : card.whenWins}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                            Leave this route if...
                          </p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">
                            {isCompactRouteSplit ? firstSentence(card.whenDisappoints) : card.whenDisappoints}
                          </p>
                        </div>
                      </div>

                      {!isCompactRouteSplit && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Link href={card.redirect.href} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                            {card.redirect.label}
                          </Link>
                          <span className="text-xs text-gray-500">{card.redirect.note}</span>
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {groups.map((group) => {
          const contextualLinks = getContextLinksForGroup(
            pageData,
            group,
            recommendedReadingLinks,
            promoteSafeFeatureHrefSet
          );
          const displayContextualLinks =
            isCompactRouteSplit ? contextualLinks.slice(0, 2) : contextualLinks;
          const groupOverride = featurePageOverrides[pageData.slug]?.groupOverrides?.[group.groupTitle];
          const redirect = sanitizeRouteRedirect(
            groupOverride?.redirect ?? getGroupRedirect(pageData, group.groupTitle),
            promoteSafeFeatureHrefSet
          );
          const chooseWhenText =
            groupOverride?.chooseWhen ??
            (firstSentence(group.groupSummary) ||
              `Use this route when ${group.groupTitle.toLowerCase()} is the closest match for the job.`);
          const disappointsText =
            groupOverride?.disappoints ?? getWhenDisappoints(pageData, group.groupTitle);

          return (
            <section
              key={group.groupTitle}
              id={slugify(group.groupTitle)}
              className={compactFrontHalf ? 'space-y-5' : 'space-y-6'}
            >
              <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    {getGroupSectionEyebrow(pageType)}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-gray-900">{group.groupTitle}</h2>
                  {group.groupSummary ? (
                    <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">{group.groupSummary}</p>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Use this shortlist when</p>
                    <p className="mt-2 text-sm leading-7 text-gray-700">
                      {isCompactRouteSplit || compactFrontHalf ? firstSentence(chooseWhenText) : chooseWhenText}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Leave this route if...</p>
                    <p className="mt-2 text-sm leading-7 text-gray-700">
                      {isCompactRouteSplit || compactFrontHalf ? firstSentence(disappointsText) : disappointsText}
                    </p>
                  </div>
                </div>

                {!isCompactRouteSplit && !compactFrontHalf && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link href={redirect.href} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                      {redirect.label}
                    </Link>
                    <span className="text-sm text-gray-500">{redirect.note}</span>
                  </div>
                )}

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {group.tools.map((tool, index) => (
                    <ToolCard
                      key={`${group.groupTitle}-${tool.toolSlug}`}
                      tool={tool}
                      featureSlug={featureSlug}
                      groupTitle={group.groupTitle}
                      position={index + 1}
                      policyLabel={getPolicyLabel(pageData)}
                    />
                  ))}
                </div>

                {displayContextualLinks.length > 0 && (
                  <div className="mt-8 border-t border-gray-200 pt-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                      If this route stops fitting
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {displayContextualLinks.map((item) => (
                        <Link
                          key={`${group.groupTitle}-${item.linkType}-${item.destinationSlug}`}
                          href={item.href}
                          onClick={() =>
                            track('click_internal_link', {
                              link_type: item.linkType,
                              destination_slug: item.destinationSlug,
                              feature_slug: featureSlug,
                            })
                          }
                          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {modules.faqDensity !== 'hidden' && faqItems.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-[#F3F1EA] p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{getFaqHeading(pageType)}</h2>
            </div>

            <div className="mt-8">
              <FeaturesFAQ items={faqItems} />
            </div>
          </section>
        )}

        {modules.furtherReading !== 'hidden' && recommendedGroups.length > 0 && (
          <FeatureNextSteps
            featureSlug={featureSlug}
            title={getFurtherReadingHeading(pageType)}
            intro={
              isBroadChooser
                ? 'These links help only after the route is clear. They are next steps, not substitutes for the decision this page is trying to make.'
                : 'These links help only after the current route still looks right. Treat them as the next layer of research, not as a new starting point.'
            }
            groups={recommendedGroups.map((group) => ({
              title: group.title,
              items: group.items,
            }))}
          />
        )}
      </main>
    </div>
  );
}

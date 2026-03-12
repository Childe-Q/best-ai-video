import fs from 'node:fs';
import path from 'node:path';
import { flikiVsHeygen } from '@/data/vs/fliki-vs-heygen';
import { invideoVsHeygen } from '@/data/vs/invideo-vs-heygen';
import { getAllTools, getTool } from '@/lib/getTool';
import { buildDecisionTableRows, toVsDiffRows } from '@/lib/vsDecisionTable';
import { buildLegacyBestFor, buildLegacyKeyDiffs, buildLegacyNotFor } from '@/lib/vsDifferentiation';
import { applyIntentProfileOverride, buildIntentProfile } from '@/lib/vsIntent';
import { normalizeSourceUrlList } from '@/lib/vsSources';
import {
  applyFeaturedCalibration,
  buildInferredScoreProvenance,
  getScoreMetricKeys,
  mergeScoreProvenance,
  normalizeInternalScore,
} from '@/lib/vsScore';
import { buildPreferredRowSources, getStrictPricingSources, getToolSourceDomains } from '@/lib/vsToolSources';
import { Tool } from '@/types/tool';
import { VsComparison, VsDiffRow, VsPromptVariant, VsSide } from '@/types/vs';

const DEV_LOG = process.env.NODE_ENV === 'development';

const explicitCanonicalComparisons: VsComparison[] = [flikiVsHeygen, invideoVsHeygen];

type VsAuthoredOverride = {
  decisionSummary?: string;
  shortAnswer?: Partial<VsComparison['shortAnswer']>;
  bestFor?: Partial<VsComparison['bestFor']>;
  notFor?: Partial<VsComparison['notFor']>;
  keyDiffs?: VsDiffRow[];
  matrixRows?: Array<Partial<VsDiffRow>>;
  decisionCases?: VsComparison['decisionCases'];
  editorialNotes?: VsComparison['editorialNotes'];
  faq?: NonNullable<VsComparison['faq']>;
  promptBox?: {
    helperText?: string;
  };
  verdict?: {
    recommendation?: string;
  };
};

const AUTHORED_VS_OVERRIDES: Record<string, VsAuthoredOverride> = {
  'invideo-vs-pictory': {
    decisionSummary:
      'Choose InVideo when you are creating new stock-scene drafts for ads, explainers, and shorts. Choose Pictory when you are cutting existing webinars, podcasts, or articles into clips.',
    shortAnswer: {
      a: 'InVideo is the better fit for faceless explainers, ad creatives, and from-scratch visual drafts.',
      b: 'Pictory is the better fit for repurposing webinars, podcasts, Zoom recordings, and long-form clips.',
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'InVideo is stronger when the team is starting from prompts, scripts, and a blank draft rather than existing footage.',
        b: 'Pictory is stronger when the team already has webinars, podcasts, articles, or recordings that need to be cut into clips.',
      },
      {
        label: 'Editing model',
        a: 'InVideo is closer to from-scratch visual drafting, where scenes and pacing are built for a new video concept.',
        b: 'Pictory is closer to transcript and highlight extraction, where the job is condensing what already exists.',
      },
      {
        label: 'Use case fit',
        a: 'InVideo fits ad creatives, faceless explainers, and short-form batches when the team needs fresh output volume.',
        b: 'Pictory fits webinar, podcast, and thought-leadership teams that want more mileage from long-form assets.',
      },
      {
        label: 'Where each tool saves time',
        a: 'InVideo saves more time when there is no source footage and the team needs new drafts quickly.',
        b: 'Pictory saves more time when the source material already exists and the bottleneck is cutting it down.',
      },
    ],
    bestFor: {
      a: [
        'Teams creating new stock-scene drafts for ads, explainers, and shorts',
        'Marketers testing multiple visual concepts before they have source footage',
        'Faceless video workflows that start from prompts or scripts',
      ],
      b: [
        'Teams turning webinars, podcasts, and recordings into short clips',
        'Content programs built around repurposing long-form assets',
        'Workflows that begin with existing articles or video rather than a blank draft',
      ],
    },
    notFor: {
      a: [
        'Teams whose best source material already exists in long-form recordings',
        'Transcript-first repurposing workflows',
        'Projects where highlight extraction matters more than draft generation',
      ],
      b: [
        'Teams that need fresh ad concepts from prompts rather than repurposing',
        'Stock-scene drafting from scratch',
        'Faceless social output when there is no long-form source to cut down',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'New stock-scene drafts for ads, explainers, and shorts', b: 'Repurposing webinars, podcasts, and articles into clips' },
      { label: 'Output type', a: 'Prompt-led stock-scene videos with captions and voiceover', b: 'Clip-first videos built from existing long-form source material' },
      { label: 'Workflow speed', a: 'Fast for batch drafts', b: 'Fast for short iterations' },
      { label: 'Pricing starting point', a: '$28/mo', b: '$19/mo' },
      { label: 'Free plan', a: 'Free plan', b: 'Free plan' },
    ],
    decisionCases: [
      {
        label: 'Start from scratch',
        keywords: ['social', 'shorts', 'ads', 'stock', 'drafts'],
        winner: 'a',
        verdict: 'InVideo is the better fit when the team is building new scenes, captions, and visual drafts from prompts or scripts rather than trimming existing long-form footage.',
      },
      {
        label: 'Repurpose webinars & podcasts',
        keywords: ['webinar', 'podcast', 'zoom', 'clips', 'repurpose'],
        winner: 'b',
        verdict: 'Pictory is the better fit when the input already exists as webinars, podcasts, Zoom recordings, or long-form clips.',
      },
      {
        label: 'Repurpose existing content',
        keywords: ['article', 'blog', 'script', 'repurpose', 'clips'],
        winner: 'b',
        verdict: 'Pictory is the stronger choice when the input is existing articles or long-form source material that needs to be condensed.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare InVideo and Pictory because both promise to speed up AI video production and both can end in short publishable clips. The confusion is understandable. One is closer to generation from scratch, while the other is closer to repurposing from existing material.',
      looksSimilarButActuallyDifferent:
        'They overlap at the output layer: both can help teams publish short videos faster. The real split is upstream. InVideo is usually chosen when the team is creating new drafts from prompts, scripts, and stock footage. Pictory is usually chosen when the team already has webinars, podcasts, articles, or recordings that need to be turned into clips.',
      realDecision:
        'The real decision is whether you are starting from zero or starting from long-form source material. If the workflow begins with prompts and fresh drafts, InVideo is usually the better fit. If the workflow begins with existing content that needs trimming, Pictory is usually the better fit.',
      hiddenTradeOff:
        'InVideo is faster when the job is new content volume, but it asks the team to shape the story from scratch. Pictory saves time when long-form source material already exists, but it is less useful if there is nothing substantial to repurpose.',
      whoWillRegretTheWrongChoice:
        'Performance teams regret Pictory when they needed fresh ad or short-form concepts, not repurposing. Webinar, podcast, and thought-leadership teams regret InVideo when they end up recreating assets that already existed in longer form.',
    },
    faq: [
      {
        question: 'InVideo vs Pictory: which should I choose first?',
        answer:
          'Choose InVideo if the team needs from-scratch visual drafts built from prompts or scripts. Choose Pictory if the team is repurposing webinars, podcasts, articles, or recordings into clips.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'InVideo is generation-first. Pictory is repurposing-first.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Teams making new ad or explainer concepts regret Pictory when there is not enough source material to repurpose. Teams sitting on webinars, podcasts, articles, or recordings regret InVideo when they really needed a repurposing workflow instead of from-scratch visual drafting.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same brief in both tools to compare generation from scratch against repurposing from existing long-form content.',
    },
  },
  'heygen-vs-synthesia': {
    decisionSummary:
      'Choose HeyGen for avatar-led outreach, spokesperson videos, and faster presenter experimentation. Choose Synthesia for structured training, internal communication, and enterprise rollout.',
    bestFor: {
      a: [
        'Sales outreach, product explainers, and spokesperson-style videos',
        'Teams experimenting with presenter-led communication outside formal training ops',
        'Customer-facing avatar videos that need to feel more campaign-like than instructional',
      ],
      b: [
        'Structured training programs and internal communication rollout',
        'Enterprise teams prioritizing governance and repeatable learning workflows',
        'Localization-heavy training content delivered at organizational scale',
      ],
    },
    notFor: {
      a: [
        'Organizations buying primarily for formal training rollout',
        'Teams that need heavier enterprise governance than creative flexibility',
        'Lesson-library workflows centered on structured internal education',
      ],
      b: [
        'Fast-moving outreach or spokesperson video teams',
        'Revenue teams that want lighter presenter iteration',
        'Use cases where campaign agility matters more than rollout structure',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'Outreach, spokesperson videos, and avatar-led explainers', b: 'Corporate training, internal communication, and enterprise rollout' },
      { label: 'Output type', a: 'Presenter-led avatar videos for customer-facing communication', b: 'Avatar videos built for training and internal business communication' },
      { label: 'Workflow speed', a: 'Depends on workflow setup', b: 'Depends on workflow setup' },
      { label: 'Languages & dubbing', a: 'Multilingual presenter delivery with voice cloning options', b: 'Broad language coverage for enterprise training localization' },
      { label: 'Pricing starting point', a: '$29/mo', b: '$29/mo' },
      { label: 'Free plan', a: 'Free plan', b: 'Free trial' },
    ],
    decisionCases: [
      {
        label: 'Sales outreach & spokesperson videos',
        keywords: ['sales', 'outreach', 'spokesperson', 'avatar', 'presenter'],
        winner: 'a',
        verdict: 'HeyGen is the better fit when the video is closer to sales, outreach, or spokesperson-style delivery than formal training.',
      },
      {
        label: 'Corporate training rollout',
        keywords: ['training', 'enterprise', 'internal', 'learning', 'rollout'],
        winner: 'b',
        verdict: 'Synthesia is the better fit when the workflow is centered on structured training and enterprise internal communication.',
      },
      {
        label: 'Multilingual internal updates',
        keywords: ['multilingual', 'language', 'internal', 'localization', 'training'],
        winner: 'b',
        verdict: 'Synthesia is the stronger choice when localization is tied to formal internal communication and training rollout.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare HeyGen and Synthesia because both sit in the same avatar-video category and both can replace traditional talking-head production. On a feature checklist they look close. In buying context, they tend to serve different teams.',
      looksSimilarButActuallyDifferent:
        'Both tools create avatar-led video without a film crew. The difference is where the workflow naturally lives. HeyGen is often pulled into growth, sales, and customer-facing communication. Synthesia is often pulled into training, internal communication, and enterprise rollout.',
      realDecision:
        'The real decision is not avatar quality in isolation. It is whether the workflow is closer to campaign communication or structured training operations.',
      hiddenTradeOff:
        'HeyGen tends to feel lighter and more flexible for presenter-led communication, but that can matter less when the organization needs more formal rollout structure. Synthesia fits that structure better, but some teams will feel the workflow is heavier than the content requires.',
      whoWillRegretTheWrongChoice:
        'Growth and revenue teams regret Synthesia when every presenter video starts to feel heavier than the ask. Enterprise learning and internal comms teams regret HeyGen when governance and rollout discipline matter more than iteration speed.',
    },
    faq: [
      {
        question: 'HeyGen vs Synthesia: which should I choose first?',
        answer:
          'Choose HeyGen for avatar-led outreach and presenter-style communication. Choose Synthesia for training, internal communication, and enterprise rollout.',
      },
      {
        question: 'What is the practical difference?',
        answer:
          'HeyGen is usually the lighter choice for communication-led workflows. Synthesia is usually the steadier choice for structured training and enterprise deployment.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Revenue teams regret Synthesia when the workflow becomes too heavy for sales-style video. Enterprise learning teams regret HeyGen when rollout, governance, and training structure matter more than flexibility.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same avatar brief in both tools to compare campaign-style presenter delivery against training-led enterprise rollout.',
    },
  },
  'fliki-vs-invideo': {
    decisionSummary:
      'Choose Fliki when the workflow is text-first and narration-led. Choose InVideo when the team needs faster stock-scene drafts for ads, explainers, and short-form production.',
    bestFor: {
      a: [
        'Blog-to-video and narration-led explainers',
        'Teams turning scripts or articles into voice-led videos quickly',
        'Workflows where the story is carried mostly by narration rather than scene design',
      ],
      b: [
        'Faceless explainers, ad creatives, and stock-scene drafts',
        'Teams producing short-form marketing output at higher volume',
        'Workflows where scene assembly matters more than narration-first conversion',
      ],
    },
    notFor: {
      a: [
        'Teams that need broader stock-scene variation from scratch',
        'Projects that depend on more visual assembly than voice-led conversion',
        'Ad workflows centered on scene-driven iteration rather than narration',
      ],
      b: [
        'Text-first teams mainly converting blogs or scripts into narrated videos',
        'Narration-led explainers where a lighter workflow would do',
        'Projects where the voiceover carries most of the value',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'Blog-to-video and narration-led explainers', b: 'Faceless explainers and stock-scene marketing drafts' },
      { label: 'Output type', a: 'Narrated videos built from scripts, articles, and voiceover', b: 'Prompt-led stock-scene videos with captions and voiceover' },
      { label: 'Workflow speed', a: 'Fast for short iterations', b: 'Fast for batch drafts' },
      { label: 'Languages & dubbing', a: 'Voice cloning and multilingual narration workflows', b: 'Multilingual voiceover and caption workflows for stock-scene output' },
      { label: 'Pricing starting point', a: '$28/mo', b: '$28/mo' },
      { label: 'Free plan', a: 'Free plan', b: 'Free plan' },
    ],
    decisionCases: [
      {
        label: 'Blog or article to video',
        keywords: ['blog', 'article', 'voiceover', 'narrated', 'script'],
        winner: 'a',
        verdict: 'Fliki is the better fit when the source material already exists as text and the job is turning it into a narrated video quickly.',
      },
      {
        label: 'Faceless explainers & ad drafts',
        keywords: ['faceless', 'ads', 'stock', 'social', 'drafts'],
        winner: 'b',
        verdict: 'InVideo is the better fit when the workflow depends on faster stock-scene drafts for explainers, social clips, and ad variants.',
      },
      {
        label: 'Narration-first explainers',
        keywords: ['voiceover', 'narration', 'script', 'blog', 'explainer'],
        winner: 'a',
        verdict: 'Fliki is the stronger choice when the voiceover is doing most of the communication work.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Fliki and InVideo because both reduce editing overhead and both can turn written ideas into finished video. The overlap is real, especially for teams trying to publish quickly without filming.',
      looksSimilarButActuallyDifferent:
        'They look similar if you only ask whether text can become video. The split is in format. Fliki is usually a narration-led conversion workflow. InVideo is usually a scene-assembly workflow built for faster visual drafting and broader short-form output.',
      realDecision:
        'The real decision is whether the video is carried by narration or by scene assembly. If voiceover and scripts do most of the work, Fliki is usually cleaner. If the team needs more stock-scene output and faster ad-style iteration, InVideo is usually stronger.',
      hiddenTradeOff:
        'Fliki is lighter when the team already thinks in scripts, articles, and voiceover. InVideo is broader for visual drafting, but it can be heavier than necessary if the message did not need that extra scene-assembly layer.',
      whoWillRegretTheWrongChoice:
        'Text-first teams regret InVideo when the workflow becomes more visual-production-heavy than the brief requires. Social and ad teams regret Fliki when narrated conversion is not enough and they need more scene-driven output variety.',
    },
    faq: [
      {
        question: 'Fliki vs InVideo: which should I choose first?',
        answer:
          'Choose Fliki for text-first, narration-led video. Choose InVideo for stock-scene drafts, faceless explainers, and faster ad-style output.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'Fliki turns scripts or articles into narrated videos. InVideo assembles stock scenes and captions more like a production workflow for short-form output.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Text-first teams regret InVideo when it adds more visual production work than they needed. Social teams regret Fliki when a narration-led workflow is too narrow for the output mix.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same script in both tools to compare a narration-first workflow against a broader scene-assembly workflow.',
    },
  },
  'invideo-vs-zebracat': {
    decisionSummary:
      'Choose InVideo when you need broader stock-scene drafts and faceless explainers. Choose Zebracat when the job is short-form social clips, ad variants, and trend-driven output.',
    bestFor: {
      a: [
        'Broader stock-scene drafts and faceless explainers',
        'Teams that need one tool to cover shorts plus general explainer output',
        'Prompt-led video workflows that extend beyond quick social clips',
      ],
      b: [
        'Short-form social clips, ad variants, and trend-driven output',
        'Teams shipping high-volume marketing cuts for Shorts, Reels, and ads',
        'Workflows that prioritize speed for social publishing over broader explainer coverage',
      ],
    },
    notFor: {
      a: [
        'Teams that only need a tight short-form social clip engine',
        'Trend-led output where broader explainer capability adds little value',
        'Pure social workflows optimized around rapid short-form publishing',
      ],
      b: [
        'Broader faceless explainer pipelines',
        'Teams that need more mixed-format output than short-form social clips',
        'Prompt-led workflows that also need general-purpose stock-scene coverage',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'Broader stock-scene drafts and faceless explainers', b: 'Short-form social clips and ad-style marketing output' },
      { label: 'Output type', a: 'Prompt-led stock-scene videos for explainers and mixed-format output', b: 'Short-form marketing clips optimized for social publishing' },
      { label: 'Workflow speed', a: 'Fast for batch drafts', b: 'Fast for batch drafts' },
      { label: 'Pricing starting point', a: '$28/mo', b: '$19/mo' },
      { label: 'Free plan', a: 'Free plan', b: 'Free trial' },
    ],
    decisionCases: [
      {
        label: 'Faceless explainers',
        keywords: ['explainers', 'stock', 'script', 'faceless', 'drafts'],
        winner: 'a',
        verdict: 'InVideo is the better fit when the team needs broader faceless explainers and stock-scene drafts, not just short-form social cuts.',
      },
      {
        label: 'Short-form social ads',
        keywords: ['social', 'shorts', 'reels', 'ads', 'clips'],
        winner: 'b',
        verdict: 'Zebracat is the better fit when the workflow is centered on short-form social ads, Reels, Shorts, and quick marketing clips.',
      },
      {
        label: 'Trend-driven marketing clips',
        keywords: ['trend', 'marketing', 'clips', 'shorts', 'social'],
        winner: 'b',
        verdict: 'Zebracat is the stronger choice when speed for trend-driven short-form marketing matters more than broader explainer coverage.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare InVideo and Zebracat because both are fast AI video tools aimed at teams that need output volume rather than handcrafted edits. They often show up in the same social-content and ad-production searches.',
      looksSimilarButActuallyDifferent:
        'Both help teams publish quickly, but they do not aim at the same center of gravity. InVideo covers a broader stock-scene and faceless-explainer workflow. Zebracat is tighter around short-form social cuts and trend-driven marketing output.',
      realDecision:
        'The real decision is whether the team needs broader visual drafting or a more short-form-native social clip engine.',
      hiddenTradeOff:
        'InVideo gives more room for broader explainer and stock-scene production, but that can be more workflow than a short-form social team actually needs. Zebracat is faster for social-style clips, but it is narrower if the team also needs more general explainer output.',
      whoWillRegretTheWrongChoice:
        'Broader content teams regret Zebracat when the workflow is too narrow for explainers and mixed-format publishing. Short-form ad teams regret InVideo when they wanted a tighter social clip workflow and got a broader tool instead.',
    },
    faq: [
      {
        question: 'InVideo vs Zebracat: which should I choose first?',
        answer:
          'Choose InVideo for broader stock-scene drafts and faceless explainers. Choose Zebracat for short-form social clips and ad-style marketing output.',
      },
      {
        question: 'What is the practical difference?',
        answer:
          'InVideo is broader. Zebracat is narrower but more social-first.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Mixed-format content teams regret Zebracat when they need broader explainer coverage. Short-form social teams regret InVideo when they wanted a more focused clip workflow.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same short-form brief in both tools to compare broader stock-scene drafting against a tighter social-clip workflow.',
    },
  },
};

const SUPPLEMENTAL_VS_CANDIDATES: Array<[string, string]> = [
  ['descript', 'veed-io'],
  ['runway', 'sora'],
  ['colossyan', 'heygen'],
  ['deepbrain-ai', 'heygen'],
  ['colossyan', 'synthesia'],
  ['deepbrain-ai', 'synthesia'],
  ['fliki', 'pictory'],
  ['descript', 'pictory'],
  ['descript', 'fliki'],
  ['pictory', 'zebracat'],
];

const SLUG_ALIAS_MAP: Record<string, string> = {
  invideoai: 'invideo',
  'invideo-ai': 'invideo',
  veed: 'veed-io',
  veedio: 'veed-io',
  elai: 'elai-io',
  'elaiio': 'elai-io',
  'elai-io-ai': 'elai-io',
  heygenai: 'heygen',
  'hey-gen': 'heygen',
  synthesiaai: 'synthesia',
  flikiai: 'fliki',
  zebracatai: 'zebracat',
  runwayml: 'runway',
  'runway-ml': 'runway',
};

let canonicalBySlugCache: Map<string, VsComparison> | null = null;

export type ParsedVsSlug = {
  slugA: string;
  slugB: string;
};

export type VsDuplicateRedirect = {
  from: string;
  to: string;
};

export type VsCandidateSkip = {
  slug: string;
  reason: string;
};

export type VsLoadStatus = 'FULL' | 'PARTIAL' | 'MISSING';

export type VsLoadResult = {
  status: VsLoadStatus;
  comparison: VsComparison | null;
  reason?: string;
  errors?: string[];
  indexHit?: boolean;
  hitSource?: 'canonical' | 'legacy' | 'none';
  schemaErrorSummary?: string[];
  source?: 'canonical' | 'legacy-adapter' | 'none';
  normalizedSlug?: string;
  parsed?: ParsedVsSlug | null;
};

function logDebug(message: string, payload?: Record<string, unknown>) {
  if (!DEV_LOG) return;
  if (payload) {
    console.info(`[vs-loader] ${message}`, payload);
    return;
  }
  console.info(`[vs-loader] ${message}`);
}

function summarizeErrors(errors?: string[]): string[] {
  return (errors ?? []).slice(0, 3);
}

function finalizeVsResult(result: VsLoadResult, debug: boolean): VsLoadResult {
  const hitSource =
    result.hitSource ??
    (result.source === 'canonical' ? 'canonical' : result.source === 'legacy-adapter' ? 'legacy' : 'none');

  const finalResult: VsLoadResult = {
    ...result,
    hitSource,
    indexHit: result.indexHit ?? hitSource !== 'none',
    schemaErrorSummary: result.schemaErrorSummary ?? summarizeErrors(result.errors),
  };

  if (debug) {
    logDebug('resolution', {
      normalizedSlug: finalResult.normalizedSlug ?? null,
      indexHit: finalResult.indexHit ?? false,
      hitSource: finalResult.hitSource ?? 'none',
      schemaErrorSummary: finalResult.schemaErrorSummary ?? [],
      status: finalResult.status,
      reason: finalResult.reason ?? null,
    });
  }

  return finalResult;
}

function normalizeSlugPart(rawValue: string): string {
  const normalized = decodeURIComponent(rawValue || '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return SLUG_ALIAS_MAP[normalized] ?? normalized;
}

export function parseVsSlug(slug: string): ParsedVsSlug | null {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const cleaned = decodeURIComponent(slug)
    .trim()
    .replace(/^\/+/, '')
    .replace(/^vs\//i, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');

  const match = cleaned.match(/^(.+?)-?vs-?(.+)$/);
  if (!match) {
    return null;
  }

  const slugA = normalizeSlugPart(match[1] || '');
  const slugB = normalizeSlugPart(match[2] || '');
  if (!slugA || !slugB) {
    return null;
  }

  return { slugA, slugB };
}

export function toVsSlug(slugA: string, slugB: string): string {
  return `${normalizeSlugPart(slugA)}-vs-${normalizeSlugPart(slugB)}`;
}

function canonicalizePair(slugA: string, slugB: string): ParsedVsSlug {
  const normalizedA = normalizeSlugPart(slugA);
  const normalizedB = normalizeSlugPart(slugB);
  if (normalizedA <= normalizedB) {
    return { slugA: normalizedA, slugB: normalizedB };
  }
  return { slugA: normalizedB, slugB: normalizedA };
}

export function toCanonicalVsSlug(slugA: string, slugB: string): string {
  const canonicalPair = canonicalizePair(slugA, slugB);
  return toVsSlug(canonicalPair.slugA, canonicalPair.slugB);
}

export function canonicalSlug(slugA: string, slugB: string): string {
  return toCanonicalVsSlug(slugA, slugB);
}

export function getCanonicalVsSlug(slug: string): string | null {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;
  return toCanonicalVsSlug(parsed.slugA, parsed.slugB);
}

export function canonicalizeVsHref(href: string): string {
  const match = href.match(/^\/vs\/([^?#]+)([?#].*)?$/);
  if (!match) {
    return href;
  }

  const canonicalSlug = getCanonicalVsSlug(match[1]);
  if (!canonicalSlug) {
    return href;
  }

  return `/vs/${canonicalSlug}${match[2] ?? ''}`;
}

function getCanonicalComparisonMap(): Map<string, VsComparison> {
  if (canonicalBySlugCache) return canonicalBySlugCache;
  canonicalBySlugCache = new Map<string, VsComparison>(
    explicitCanonicalComparisons.map((comparison) => [toCanonicalVsSlug(comparison.slugA, comparison.slugB), comparison]),
  );
  return canonicalBySlugCache;
}

export function normalizeVsSlug(slug: string): string | null {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;
  return toVsSlug(parsed.slugA, parsed.slugB);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractVsSlugFromHref(href?: string): string | null {
  if (!href) return null;
  const normalized = href.trim();
  if (!normalized.startsWith('/vs/')) return null;
  const slug = normalized.replace('/vs/', '').replace(/^\/+|\/+$/g, '');
  return slug || null;
}

function getInferredSlugsFromToolContent(): string[] {
  const allTools = getAllTools();
  const inferred: string[] = [];

  for (const tool of allTools) {
    const useCases = tool.content?.overview?.useCases ?? [];
    for (const useCase of useCases) {
      const extracted = extractVsSlugFromHref(useCase.linkHref);
      if (extracted) {
        const parsed = parseVsSlug(extracted);
        if (parsed) {
          inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
        }
      }
    }

    const alternatives = tool.content?.alternatives?.topAlternatives ?? [];
    for (const item of alternatives) {
      const extracted = extractVsSlugFromHref(item.linkHref);
      if (extracted) {
        const parsed = parseVsSlug(extracted);
        if (parsed) {
          inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
        }
      }
    }
  }

  return dedupe(inferred);
}

function getInferredSlugsFromContentDirectory(): string[] {
  const inferred: string[] = [];
  const contentToolsDir = path.join(process.cwd(), 'content', 'tools');

  try {
    if (!fs.existsSync(contentToolsDir)) {
      return [];
    }

    const files = fs.readdirSync(contentToolsDir).filter((file) => file.endsWith('.json'));
    for (const fileName of files) {
      try {
        const filePath = path.join(contentToolsDir, fileName);
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
          overview?: {
            useCases?: Array<{ linkHref?: string }>;
          };
          alternatives?: {
            topAlternatives?: Array<{ linkHref?: string }>;
          };
          content?: {
            overview?: {
              useCases?: Array<{ linkHref?: string }>;
            };
            alternatives?: {
              topAlternatives?: Array<{ linkHref?: string }>;
            };
          };
        };

        const useCases = raw.content?.overview?.useCases ?? raw.overview?.useCases ?? [];
        for (const useCase of useCases) {
          const extracted = extractVsSlugFromHref(useCase.linkHref);
          if (!extracted) continue;
          const parsed = parseVsSlug(extracted);
          if (parsed) {
            inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
          }
        }

        const alternatives = raw.content?.alternatives?.topAlternatives ?? raw.alternatives?.topAlternatives ?? [];
        for (const item of alternatives) {
          const extracted = extractVsSlugFromHref(item.linkHref);
          if (!extracted) continue;
          const parsed = parseVsSlug(extracted);
          if (parsed) {
            inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
          }
        }
      } catch (error) {
        if (DEV_LOG) {
          console.error('[vs-loader] failed to parse content/tools json for inferred vs slugs', {
            fileName,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  } catch (error) {
    if (DEV_LOG) {
      console.error('[vs-loader] failed to scan content/tools for inferred vs slugs', {
        contentToolsDir,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return dedupe(inferred);
}

type VsDiscoveryCache = {
  slugsFromFiles: string[];
  tsOnlySlugs: Set<string>;
  tsComparisonsBySlug: Map<string, VsComparison>;
  tsErrorsBySlug: Map<string, string[]>;
  tsRawBySlug: Map<string, unknown>;
  jsonComparisonsBySlug: Map<string, VsComparison>;
  jsonErrorsBySlug: Map<string, string[]>;
  jsonRawBySlug: Map<string, unknown>;
};

let discoveryCache: VsDiscoveryCache | null = null;

function getVsDataDirectories(): string[] {
  const dirs = [
    path.join(process.cwd(), 'src', 'data', 'vs'),
    path.join(process.cwd(), 'data', 'vs'),
  ];

  return dirs.filter((dirPath) => fs.existsSync(dirPath));
}

type TsVsParseResult = {
  raw: unknown | null;
  comparison: VsComparison | null;
  reason?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function parseSide(value: unknown, fallback: VsSide): VsSide {
  return value === 'a' || value === 'b' ? value : fallback;
}

function parseDiffRows(value: unknown): VsDiffRow[] {
  if (!Array.isArray(value)) return [];
  const rows: VsDiffRow[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = asString(item.label);
    const a = asString(item.a) ?? asString(item.aText);
    const b = asString(item.b) ?? asString(item.bText);
    if (!label || !a || !b) continue;
    const aText = asString(item.aText);
    const bText = asString(item.bText);
    const sourceUrl = asString(item.sourceUrl);
    const rawSources =
      isRecord(item.sources)
        ? {
            a: normalizeSourceUrlList(item.sources.a),
            b: normalizeSourceUrlList(item.sources.b),
          }
        : undefined;
    rows.push({
      label,
      a,
      b,
      ...(aText ? { aText } : {}),
      ...(bText ? { bText } : {}),
      ...(rawSources ? { sources: rawSources } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
    });
  }

  return rows;
}

function parsePromptVariants(value: unknown): VsPromptVariant[] {
  if (!Array.isArray(value)) return [];
  const variants: VsPromptVariant[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const key = asString(item.key);
    const title = asString(item.title);
    const prompt = asString(item.prompt);
    const settings = asStringArray(item.settings);
    if (!key || !title || !prompt || settings.length === 0) continue;
    variants.push({ key, title, prompt, settings });
  }

  return variants;
}

function parseFaqItems(value: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return [];
  const items: Array<{ question: string; answer: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const question = asString(item.question);
    const answer = asString(item.answer);
    if (!question || !answer) continue;
    items.push({ question, answer });
  }
  return items;
}

function parseDecisionCases(
  value: unknown,
): Array<{ label: string; keywords?: string[]; winner?: VsSide; verdict?: string }> {
  if (!Array.isArray(value)) return [];
  const items: Array<{ label: string; keywords?: string[]; winner?: VsSide; verdict?: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = asString(item.label);
    if (!label) continue;
    items.push({
      label,
      ...(asStringArray(item.keywords).length > 0 ? { keywords: asStringArray(item.keywords) } : {}),
      ...(item.winner === 'a' || item.winner === 'b' ? { winner: item.winner } : {}),
      ...(asString(item.verdict) ? { verdict: asString(item.verdict) } : {}),
    });
  }
  return items;
}

function parseEditorialNotes(value: unknown): VsComparison['editorialNotes'] | undefined {
  if (!isRecord(value)) return undefined;
  const notes = {
    whyPeopleCompareTheseTools: asString(value.whyPeopleCompareTheseTools),
    looksSimilarButActuallyDifferent: asString(value.looksSimilarButActuallyDifferent),
    realDecision: asString(value.realDecision),
    editorsTake: asString(value.editorsTake),
    chooseAIf: asString(value.chooseAIf),
    chooseBIf: asString(value.chooseBIf),
    hiddenTradeOff: asString(value.hiddenTradeOff),
    whoWillRegretTheWrongChoice: asString(value.whoWillRegretTheWrongChoice),
  };
  return Object.values(notes).some(Boolean) ? notes : undefined;
}

function normalizeRelatedPath(value: string, kind: 'tool' | 'alternative' | 'comparison'): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;

  if (kind === 'comparison') {
    const parsed = parseVsSlug(trimmed);
    if (!parsed) return '';
    return `/vs/${toCanonicalVsSlug(parsed.slugA, parsed.slugB)}`;
  }

  const slug = normalizeSlugPart(trimmed.replace(/^tool\//, '').replace(/\/alternatives$/, ''));
  if (!slug) return '';
  return kind === 'alternative' ? `/tool/${slug}/alternatives` : `/tool/${slug}`;
}

function deriveFileDataSlugs(fileSlug: string, raw: unknown): string[] {
  const slugs = new Set<string>([getCanonicalVsSlug(fileSlug) ?? fileSlug]);
  if (isRecord(raw)) {
    const rawSlugA = asString(raw.slugA);
    const rawSlugB = asString(raw.slugB);
    if (rawSlugA && rawSlugB) {
      slugs.add(toCanonicalVsSlug(rawSlugA, rawSlugB));
    }
  }
  return Array.from(slugs);
}

function extractObjectLiteralAt(source: string, startIndex: number): string | null {
  let depth = 0;
  let mode: 'code' | 'single' | 'double' | 'template' | 'line-comment' | 'block-comment' = 'code';
  let escaped = false;
  let templateExprDepth = 0;

  for (let i = startIndex; i < source.length; i += 1) {
    const current = source[i];
    const next = source[i + 1];

    if (mode === 'line-comment') {
      if (current === '\n') mode = 'code';
      continue;
    }

    if (mode === 'block-comment') {
      if (current === '*' && next === '/') {
        mode = 'code';
        i += 1;
      }
      continue;
    }

    if (mode === 'single') {
      if (!escaped && current === "'") mode = 'code';
      escaped = !escaped && current === '\\';
      continue;
    }

    if (mode === 'double') {
      if (!escaped && current === '"') mode = 'code';
      escaped = !escaped && current === '\\';
      continue;
    }

    if (mode === 'template') {
      if (!escaped && current === '`' && templateExprDepth === 0) {
        mode = 'code';
        continue;
      }
      if (!escaped && current === '$' && next === '{') {
        templateExprDepth += 1;
        i += 1;
        continue;
      }
      if (!escaped && current === '}' && templateExprDepth > 0) {
        templateExprDepth -= 1;
        continue;
      }
      escaped = !escaped && current === '\\';
      continue;
    }

    if (current === '/' && next === '/') {
      mode = 'line-comment';
      i += 1;
      continue;
    }
    if (current === '/' && next === '*') {
      mode = 'block-comment';
      i += 1;
      continue;
    }
    if (current === "'") {
      mode = 'single';
      escaped = false;
      continue;
    }
    if (current === '"') {
      mode = 'double';
      escaped = false;
      continue;
    }
    if (current === '`') {
      mode = 'template';
      escaped = false;
      templateExprDepth = 0;
      continue;
    }

    if (current === '{') {
      depth += 1;
      continue;
    }

    if (current === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

function extractVsObjectLiteral(source: string): string | null {
  const exportDefaultIndex = source.search(/export\s+default\s+/);
  if (exportDefaultIndex >= 0) {
    const start = source.indexOf('{', exportDefaultIndex);
    if (start >= 0) {
      return extractObjectLiteralAt(source, start);
    }
  }

  const assignmentMatch = source.match(/=\s*{/);
  if (assignmentMatch?.index !== undefined) {
    const start = assignmentMatch.index + assignmentMatch[0].indexOf('{');
    if (start >= 0) {
      return extractObjectLiteralAt(source, start);
    }
  }

  return null;
}

function parseTsVsComparisonFile(filePath: string): TsVsParseResult {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const objectLiteral = extractVsObjectLiteral(source);
    if (!objectLiteral) {
      return {
        raw: null,
        comparison: null,
        reason: 'Unable to extract object literal from TS file.',
      };
    }

    const raw = new Function(`return (${objectLiteral});`)();
    if (!isRecord(raw)) {
      return {
        raw,
        comparison: null,
        reason: 'Extracted TS object is not a plain object.',
      };
    }

    return {
      raw,
      comparison: raw as VsComparison,
    };
  } catch (error) {
    return {
      raw: null,
      comparison: null,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function discoverVsDataFiles(): VsDiscoveryCache {
  if (discoveryCache) {
    return discoveryCache;
  }

  const jsonComparisonsBySlug = new Map<string, VsComparison>();
  const tsComparisonsBySlug = new Map<string, VsComparison>();
  const tsErrorsBySlug = new Map<string, string[]>();
  const tsRawBySlug = new Map<string, unknown>();
  const tsOnlySlugs = new Set<string>();
  const jsonErrorsBySlug = new Map<string, string[]>();
  const jsonRawBySlug = new Map<string, unknown>();
  const slugsFromFiles: string[] = [];
  const dataDirs = getVsDataDirectories();

  try {
    if (dataDirs.length === 0) {
      discoveryCache = {
        slugsFromFiles: [],
        tsOnlySlugs,
        tsComparisonsBySlug,
        tsErrorsBySlug,
        tsRawBySlug,
        jsonComparisonsBySlug,
        jsonErrorsBySlug,
        jsonRawBySlug,
      };
      return discoveryCache;
    }

    for (const dataDir of dataDirs) {
      const files = fs.readdirSync(dataDir);
      for (const fileName of files) {
        if (fileName === 'index.ts') continue;

        const match = fileName.match(/^(.+)\.(ts|json)$/i);
        if (!match) continue;

        const baseName = match[1];
        const ext = match[2].toLowerCase();
        const parsed = parseVsSlug(baseName);
        if (!parsed) continue;

        const slug = toVsSlug(parsed.slugA, parsed.slugB);
        slugsFromFiles.push(slug);

        if (ext === 'json') {
          try {
            const filePath = path.join(dataDir, fileName);
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
            const comparison = isRecord(raw) ? (raw as VsComparison) : null;
            const errors = comparison ? validateVsComparison(comparison) : ['JSON file root must be an object.'];
            const candidateSlugs = deriveFileDataSlugs(slug, raw);
            for (const candidateSlug of candidateSlugs) {
              jsonRawBySlug.set(candidateSlug, raw);
            }

            if (errors.length === 0) {
              for (const candidateSlug of candidateSlugs) {
                jsonComparisonsBySlug.set(candidateSlug, comparison as VsComparison);
              }
            } else if (DEV_LOG) {
              console.error('[vs-loader] schema validation failed (json file)', {
                fileName,
                dataDir,
                errors,
              });
            }

            if (errors.length > 0) {
              for (const candidateSlug of candidateSlugs) {
                jsonErrorsBySlug.set(candidateSlug, errors);
              }
            }
          } catch (error) {
            if (DEV_LOG) {
              console.error('[vs-loader] failed to parse json vs file', {
                fileName,
                dataDir,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        } else if (!getCanonicalComparisonMap().has(slug)) {
          const filePath = path.join(dataDir, fileName);
          const tsParse = parseTsVsComparisonFile(filePath);

          const candidateSlugs = deriveFileDataSlugs(slug, tsParse.raw);
          if (tsParse.raw !== null) {
            for (const candidateSlug of candidateSlugs) {
              tsRawBySlug.set(candidateSlug, tsParse.raw);
            }
          }

          if (tsParse.comparison) {
            const schemaErrors = validateVsComparison(tsParse.comparison);
            if (schemaErrors.length === 0) {
              for (const candidateSlug of candidateSlugs) {
                tsComparisonsBySlug.set(candidateSlug, tsParse.comparison);
              }
            } else {
              for (const candidateSlug of candidateSlugs) {
                tsErrorsBySlug.set(candidateSlug, schemaErrors);
              }
            }
          } else {
            for (const candidateSlug of candidateSlugs) {
              tsErrorsBySlug.set(candidateSlug, [tsParse.reason ?? 'Unknown TS parse error.']);
            }
            tsOnlySlugs.add(slug);
          }
        }
      }
    }
  } catch (error) {
    if (DEV_LOG) {
      console.error('[vs-loader] failed to discover vs data files', {
        dataDirs,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  discoveryCache = {
    slugsFromFiles: dedupe(slugsFromFiles).sort(),
    tsOnlySlugs,
    tsComparisonsBySlug,
    tsErrorsBySlug,
    tsRawBySlug,
    jsonComparisonsBySlug,
    jsonErrorsBySlug,
    jsonRawBySlug,
  };

  return discoveryCache;
}

function getSeedVsSlugs(): string[] {
  return dedupe([
    ...getRawKnownVsSlugs().map((slug) => getCanonicalVsSlug(slug) ?? slug),
    ...Array.from(getSupplementalCanonicalComparisons().keys()),
  ])
    .filter((slug) => {
      const parsed = parseVsSlug(slug);
      if (!parsed) return false;
      const swapped = toCanonicalVsSlug(parsed.slugB, parsed.slugA);

      if (getCanonicalComparisonMap().has(slug) || getCanonicalComparisonMap().has(swapped)) return true;
      if (getSupplementalCanonicalComparisons().has(slug) || getSupplementalCanonicalComparisons().has(swapped)) return true;

      const discovery = discoverVsDataFiles();
      if (discovery.jsonComparisonsBySlug.has(slug) || discovery.jsonComparisonsBySlug.has(swapped)) return true;
      if (discovery.tsComparisonsBySlug.has(slug) || discovery.tsComparisonsBySlug.has(swapped)) return true;
      if (discovery.jsonErrorsBySlug.has(slug) || discovery.jsonErrorsBySlug.has(swapped)) return true;
      if (discovery.tsErrorsBySlug.has(slug) || discovery.tsErrorsBySlug.has(swapped)) return true;

      return Boolean(getTool(parsed.slugA) && getTool(parsed.slugB));
    })
    .sort();
}

function getRawKnownVsSlugs(): string[] {
  const discovery = discoverVsDataFiles();
  const canonicalSlugs = explicitCanonicalComparisons.map((comparison) => toVsSlug(comparison.slugA, comparison.slugB));
  const inferredSlugs = getInferredSlugsFromToolContent();
  const inferredFromContentFiles = getInferredSlugsFromContentDirectory();
  const discoveredFileSlugs = discovery.slugsFromFiles;
  return dedupe([...canonicalSlugs, ...inferredSlugs, ...inferredFromContentFiles, ...discoveredFileSlugs]).sort();
}

function validateVsComparison(data: VsComparison): string[] {
  const errors: string[] = [];

  if (!data.slugA || !data.slugB) errors.push('Missing slugA/slugB.');
  if (!data.updatedAt) errors.push('Missing updatedAt.');
  if (!data.pricingCheckedAt) errors.push('Missing pricingCheckedAt.');

  if (!data.shortAnswer?.a || !data.shortAnswer?.b) {
    errors.push('Missing shortAnswer.a/shortAnswer.b.');
  }

  if (!Array.isArray(data.matrixRows) || data.matrixRows.length === 0) {
    errors.push('matrixRows must contain at least 1 row.');
  }

  if (!data.verdict?.recommendation) {
    errors.push('Missing verdict.recommendation.');
  }

  if (!data.related?.toolPages || data.related.toolPages.length < 2) {
    errors.push('related.toolPages must contain at least 2 links.');
  }

  if (!data.related?.alternatives || data.related.alternatives.length < 2) {
    errors.push('related.alternatives must contain at least 2 links.');
  }

  if (!data.related?.comparisons || data.related.comparisons.length < 1) {
    errors.push('related.comparisons must contain at least 1 link.');
  }

  return errors;
}

function normalizeCanonicalComparison(data: VsComparison): VsComparison {
  const normalizedSlugA = normalizeSlugPart(data.slugA);
  const normalizedSlugB = normalizeSlugPart(data.slugB);
  const matrixRows = toVsDiffRows(buildDecisionTableRows(data.matrixRows, normalizedSlugA, normalizedSlugB));
  const scoreMetrics = getScoreMetricKeys({ weights: data.score.weights, a: data.score.a, b: data.score.b });
  const scoreProvenance = mergeScoreProvenance(data.score.provenance, scoreMetrics, [...matrixRows, ...data.keyDiffs]);
  const normalizedScore = normalizeInternalScore(
    {
      ...data.score,
      provenance: scoreProvenance,
    },
    [...matrixRows, ...data.keyDiffs],
    normalizedSlugA,
    normalizedSlugB,
  );

  return {
    ...data,
    slugA: normalizedSlugA,
    slugB: normalizedSlugB,
    intentProfile: applyIntentProfileOverride(
      data.intentProfile ?? buildIntentProfile(getTool(normalizedSlugA), getTool(normalizedSlugB), data),
      normalizedSlugA,
      normalizedSlugB,
    ),
    matrixRows,
    score: applyFeaturedCalibration(normalizedScore, normalizedSlugA, normalizedSlugB),
  };
}

function getMapValue<T>(map: Map<string, T>, slug: string, swappedSlug: string): T | undefined {
  return map.get(slug) ?? map.get(swappedSlug);
}

function applyAuthoredVsOverride(base: VsComparison, parsed: ParsedVsSlug): VsComparison {
  const override = AUTHORED_VS_OVERRIDES[toCanonicalVsSlug(parsed.slugA, parsed.slugB)];
  if (!override) return base;

  const mergedMatrixRows =
    override.matrixRows && override.matrixRows.length > 0
      ? toVsDiffRows(buildDecisionTableRows(override.matrixRows as VsDiffRow[], parsed.slugA, parsed.slugB))
      : base.matrixRows;

  return {
    ...base,
    ...(override.decisionSummary ? { decisionSummary: override.decisionSummary } : {}),
    shortAnswer: {
      a: override.shortAnswer?.a ?? base.shortAnswer.a,
      b: override.shortAnswer?.b ?? base.shortAnswer.b,
    },
    bestFor: {
      a: override.bestFor?.a ?? base.bestFor.a,
      b: override.bestFor?.b ?? base.bestFor.b,
    },
    notFor: {
      a: override.notFor?.a ?? base.notFor.a,
      b: override.notFor?.b ?? base.notFor.b,
    },
    keyDiffs: override.keyDiffs?.length ? override.keyDiffs : base.keyDiffs,
    matrixRows: mergedMatrixRows,
    ...(override.decisionCases?.length ? { decisionCases: override.decisionCases } : {}),
    ...(override.editorialNotes ? { editorialNotes: override.editorialNotes } : {}),
    ...(override.faq?.length ? { faq: override.faq } : {}),
    promptBox: {
      ...base.promptBox,
      ...(override.promptBox?.helperText ? { helperText: override.promptBox.helperText } : {}),
    },
    verdict: {
      ...base.verdict,
      ...(override.verdict?.recommendation ? { recommendation: override.verdict.recommendation } : {}),
    },
  };
}

function adaptComparisonFromRaw(raw: unknown, parsed: ParsedVsSlug): VsComparison | null {
  const legacy = buildLegacyComparison(parsed).comparison;
  if (!legacy) return null;
  if (!isRecord(raw)) return legacy;

  const normalizedSlugA = normalizeSlugPart(asString(raw.slugA) ?? parsed.slugA);
  const normalizedSlugB = normalizeSlugPart(asString(raw.slugB) ?? parsed.slugB);

  const shortAnswer = isRecord(raw.shortAnswer) ? raw.shortAnswer : null;
  const bestFor = isRecord(raw.bestFor) ? raw.bestFor : null;
  const notFor = isRecord(raw.notFor) ? raw.notFor : null;
  const score = isRecord(raw.score) ? raw.score : null;
  const scoreA = score && isRecord(score.a) ? score.a : null;
  const scoreB = score && isRecord(score.b) ? score.b : null;
  const verdict = isRecord(raw.verdict) ? raw.verdict : null;
  const related = isRecord(raw.related) ? raw.related : null;
  const promptBox = isRecord(raw.promptBox) ? raw.promptBox : null;
  const editorialNotes = parseEditorialNotes(raw.editorialNotes);
  const decisionCases = parseDecisionCases(raw.decisionCases);
  const faq = parseFaqItems(raw.faq);
  const parsedKeyDiffs = parseDiffRows(raw.keyDiffs);
  const parsedMatrixRows = parseDiffRows(raw.matrixRows);

  const scoreFields = dedupe([
    ...Object.keys(legacy.score.weights ?? {}),
    ...Object.keys(legacy.score.a ?? {}),
    ...Object.keys(legacy.score.b ?? {}),
    ...Object.keys((isRecord(score?.weights) ? score.weights : {}) as Record<string, unknown>),
    ...Object.keys(scoreA ?? {}),
    ...Object.keys(scoreB ?? {}),
  ]);
  const mergedScoreA: Record<string, number> = { ...legacy.score.a };
  const mergedScoreB: Record<string, number> = { ...legacy.score.b };
  for (const field of scoreFields) {
    if (typeof scoreA?.[field] === 'number') mergedScoreA[field] = scoreA[field] as number;
    if (typeof scoreB?.[field] === 'number') mergedScoreB[field] = scoreB[field] as number;
  }

  const mergedWeights =
    isRecord(score?.weights) && Object.keys(score.weights).length > 0
      ? Object.fromEntries(
          Object.entries(score.weights).filter(([, value]) => typeof value === 'number') as Array<[string, number]>,
        )
      : legacy.score.weights;
  const mergedKeyDiffs = parsedKeyDiffs.length > 0 ? parsedKeyDiffs : legacy.keyDiffs;
  const mergedMatrixRows = toVsDiffRows(
    buildDecisionTableRows(parsedMatrixRows.length > 0 ? parsedMatrixRows : legacy.matrixRows, normalizedSlugA, normalizedSlugB),
  );
  const scoreMetrics = getScoreMetricKeys({ weights: mergedWeights, a: mergedScoreA, b: mergedScoreB });
  const scoreProvenance = mergeScoreProvenance(score?.provenance, scoreMetrics, [...mergedMatrixRows, ...mergedKeyDiffs]);
  const normalizedScore = normalizeInternalScore(
    {
      methodNote: asString(score?.methodNote) ?? legacy.score.methodNote,
      weights: mergedWeights,
      a: mergedScoreA,
      b: mergedScoreB,
      provenance: scoreProvenance,
    },
    [...mergedMatrixRows, ...mergedKeyDiffs],
    normalizedSlugA,
    normalizedSlugB,
  );
  const calibratedScore = applyFeaturedCalibration(normalizedScore, normalizedSlugA, normalizedSlugB);

  const merged: VsComparison = {
    ...legacy,
    slugA: normalizedSlugA,
    slugB: normalizedSlugB,
    updatedAt: asString(raw.updatedAt) ?? legacy.updatedAt,
    pricingCheckedAt: asString(raw.pricingCheckedAt) ?? legacy.pricingCheckedAt,
    intentProfile: applyIntentProfileOverride(
      legacy.intentProfile ?? buildIntentProfile(getTool(normalizedSlugA), getTool(normalizedSlugB), legacy),
      normalizedSlugA,
      normalizedSlugB,
    ),
    shortAnswer: {
      a: asString(shortAnswer?.a) ?? legacy.shortAnswer.a,
      b: asString(shortAnswer?.b) ?? legacy.shortAnswer.b,
    },
    bestFor: {
      a: chooseTopItems(asStringArray(bestFor?.a), legacy.bestFor.a),
      b: chooseTopItems(asStringArray(bestFor?.b), legacy.bestFor.b),
    },
    notFor: {
      a: chooseTopItems(asStringArray(notFor?.a), legacy.notFor.a),
      b: chooseTopItems(asStringArray(notFor?.b), legacy.notFor.b),
    },
    keyDiffs: mergedKeyDiffs,
    matrixRows: mergedMatrixRows,
    score: calibratedScore,
    promptBox: {
      prompt: asString(promptBox?.prompt) ?? legacy.promptBox.prompt,
      settings: chooseTopItems(asStringArray(promptBox?.settings), legacy.promptBox.settings),
      ...(asString(promptBox?.helperText) ? { helperText: asString(promptBox?.helperText) } : {}),
      variants:
        parsePromptVariants(promptBox?.variants).length > 0
          ? parsePromptVariants(promptBox?.variants)
          : legacy.promptBox.variants ?? [],
    },
    ...(asString(raw.decisionSummary) ? { decisionSummary: asString(raw.decisionSummary) } : {}),
    ...(editorialNotes ? { editorialNotes } : {}),
    ...(decisionCases.length > 0 ? { decisionCases } : {}),
    verdict: {
      winnerPrice: parseSide(verdict?.winnerPrice, legacy.verdict.winnerPrice),
      winnerQuality: parseSide(verdict?.winnerQuality, legacy.verdict.winnerQuality),
      winnerSpeed: parseSide(verdict?.winnerSpeed, legacy.verdict.winnerSpeed),
      recommendation: asString(verdict?.recommendation) ?? legacy.verdict.recommendation,
    },
    ...(faq.length > 0 ? { faq } : {}),
    related: {
      toolPages: chooseTopItems(
        asStringArray(related?.toolPages).map((item) => normalizeRelatedPath(item, 'tool')).filter(Boolean),
        legacy.related.toolPages,
      ),
      alternatives: chooseTopItems(
        asStringArray(related?.alternatives)
          .map((item) => normalizeRelatedPath(item, 'alternative'))
          .filter(Boolean),
        legacy.related.alternatives,
      ),
      comparisons: dedupe([
        ...asStringArray(related?.comparisons)
          .map((item) => normalizeRelatedPath(item, 'comparison'))
          .filter(Boolean),
        ...legacy.related.comparisons,
      ]).slice(0, 6),
    },
    disclosure: asString(raw.disclosure) ?? legacy.disclosure,
  };

  return merged;
}

function parsePriceValue(startingPrice: string): number {
  const match = startingPrice.match(/(\d+(\.\d+)?)/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number.parseFloat(match[1]);
}

function toLegacyNeedPhrase(value: string, toolName: string): string {
  const normalizedToolName = toolName.toLowerCase();
  return value
    .trim()
    .replace(/[.?!]+$/g, '')
    .replace(new RegExp(`^${normalizedToolName}\\s+`, 'i'), '')
    .replace(/^is the better fit for\s+/i, '')
    .replace(/^is a strong fit for\s+/i, '')
    .replace(/^fits teams that need\s+/i, '')
    .replace(/^works best for\s+/i, '')
    .replace(/^best when the job is\s+/i, '')
    .replace(/^useful for\s+/i, '')
    .replace(/^stronger if you want a workflow that\s+/i, 'a workflow that ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(10, score));
}

function withOneDecimal(score: number): number {
  return Number(clampScore(score).toFixed(1));
}

function deriveScoreFromTool(tool: Tool) {
  const price = parsePriceValue(tool.starting_price || '');
  const priceScore =
    Number.isFinite(price)
      ? price <= 10
        ? 9.5
        : price <= 20
          ? 8.5
          : price <= 30
            ? 7.5
            : price <= 50
              ? 6.5
              : 5.5
      : 6;

  const speedSignal = `${tool.pros.join(' ')} ${tool.cons.join(' ')}`.toLowerCase();
  const speedHeuristic = speedSignal.includes('slow') ? 6.3 : speedSignal.includes('fast') ? 8.6 : 7.4;

  const featureText = tool.features.join(' ').toLowerCase();
  const customizationHeuristic =
    6.5 +
    (featureText.includes('template') ? 0.8 : 0) +
    (featureText.includes('custom') ? 1.0 : 0) +
    (featureText.includes('api') ? 0.8 : 0);

  return {
    pricingValue: withOneDecimal(tool.price_score ?? priceScore),
    ease: withOneDecimal(tool.ease_of_use_score ?? (tool.rating * 1.8)),
    speed: withOneDecimal(tool.speed_score ?? speedHeuristic),
    output: withOneDecimal(tool.output_quality_score ?? (tool.rating * 2)),
    customization: withOneDecimal(customizationHeuristic),
  };
}

function chooseTopItems(values: string[], fallback: string[]): string[] {
  const cleaned = values
    .map((value) => value.trim())
    .filter(Boolean);
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 3);
  }

  return dedupe([...cleaned, ...fallback]).slice(0, 3);
}

function buildRowSources(
  slugA: string,
  slugB: string,
  type: 'pricing' | 'docs' | 'help' | 'examples',
  rowLabel?: string,
): { a: string[]; b: string[] } {
  const rowSources = buildPreferredRowSources(slugA, slugB, type);

  if (process.env.NODE_ENV === 'development') {
    const aDomains = rowSources.a.map((url) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    });
    const bDomains = rowSources.b.map((url) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    });

    const aHasB = aDomains.some((domain) => getToolSourceDomains(slugB).includes(domain));
    const bHasA = bDomains.some((domain) => getToolSourceDomains(slugA).includes(domain));
    if (aHasB || bHasA) {
      console.error('[vs][sources] cross-bound sources detected', {
        rowLabel: rowLabel ?? null,
        slugA,
        slugB,
        rowSources,
      });
    }
  }

  return {
    a: rowSources.a.slice(),
    b: rowSources.b.slice(),
  };
}

function describeWorkflowSpeed(tool: Tool): string {
  const signal = `${tool.best_for} ${tool.pros.join(' ')} ${tool.tags.join(' ')}`.toLowerCase();
  if (/(batch|bulk|quick|fast|rapid|auto|automate|shorts)/.test(signal)) {
    return 'Fast for batch drafts (see docs)';
  }
  if (/(advanced|complex|manual|learning curve)/.test(signal)) {
    return 'Moderate setup before repeatable output (see docs)';
  }
  return 'Fast for short iterations (see docs)';
}

function findRelatedComparisonSlugs(slugA: string, slugB: string): string[] {
  const current = toCanonicalVsSlug(slugA, slugB);
  const seeds = getSeedVsSlugs();
  const fromSeeds = seeds.filter(
    (slug) =>
      slug !== current &&
      (slug.startsWith(`${slugA}-vs-`) ||
        slug.endsWith(`-vs-${slugA}`) ||
        slug.startsWith(`${slugB}-vs-`) ||
        slug.endsWith(`-vs-${slugB}`)),
  );

  const related = dedupe(fromSeeds);
  if (related.length >= 4) {
    return related.slice(0, 4).map((slug) => `/vs/${slug}`);
  }

  const toolA = getTool(slugA);
  const toolB = getTool(slugB);
  const allTools = getAllTools().filter((tool) => tool.slug !== slugA && tool.slug !== slugB);

  const tagPool = dedupe([...(toolA?.tags ?? []), ...(toolB?.tags ?? [])]).map((tag) => tag.toLowerCase());
  const scored = allTools.map((tool) => {
    const overlap = tool.tags.filter((tag) => tagPool.includes(tag.toLowerCase())).length;
    return { slug: tool.slug, overlap };
  });

  scored
    .sort((left, right) => right.overlap - left.overlap)
    .slice(0, 8)
    .forEach((item) => {
      related.push(toCanonicalVsSlug(slugA, item.slug));
      related.push(toCanonicalVsSlug(slugB, item.slug));
    });

  return dedupe(related)
    .filter((slug) => slug !== current)
    .slice(0, 4)
    .map((slug) => `/vs/${slug}`);
}

function buildLegacyComparison(parsed: ParsedVsSlug): { comparison: VsComparison | null; reason?: string } {
  const toolA = getTool(parsed.slugA);
  const toolB = getTool(parsed.slugB);
  if (!toolA || !toolB) {
    return {
      comparison: null,
      reason: `Legacy adapter missing tool data: toolA=${Boolean(toolA)} toolB=${Boolean(toolB)}.`,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const scoreA = deriveScoreFromTool(toolA);
  const scoreB = deriveScoreFromTool(toolB);
  const intentProfile = applyIntentProfileOverride(buildIntentProfile(toolA, toolB), parsed.slugA, parsed.slugB);
  const pairSlug = toCanonicalVsSlug(parsed.slugA, parsed.slugB);

  const priceA = parsePriceValue(toolA.starting_price || '');
  const priceB = parsePriceValue(toolB.starting_price || '');

  const keyDiffs: VsDiffRow[] = buildLegacyKeyDiffs(toolA, toolB, intentProfile, (type, rowLabel) =>
    buildRowSources(parsed.slugA, parsed.slugB, type, rowLabel),
  );
  const legacyBestForA = chooseTopItems(buildLegacyBestFor(toolA, toolB, pairSlug), [toolA.best_for, ...(toolA.tags ?? [])]);
  const legacyBestForB = chooseTopItems(buildLegacyBestFor(toolB, toolA, pairSlug), [toolB.best_for, ...(toolB.tags ?? [])]);
  const legacyNeedA = toLegacyNeedPhrase(legacyBestForA[0] ?? toolA.best_for, toolA.name);
  const legacyNeedB = toLegacyNeedPhrase(legacyBestForB[0] ?? toolB.best_for, toolB.name);
  const legacyNotForA = chooseTopItems(
    buildLegacyNotFor(toolA, toolB, pairSlug),
    ['Advanced manual editing-centric workflows', 'Strict enterprise governance', 'Ultra-high customization needs'],
  );
  const legacyNotForB = chooseTopItems(
    buildLegacyNotFor(toolB, toolA, pairSlug),
    ['Advanced manual editing-centric workflows', 'Strict enterprise governance', 'Ultra-high customization needs'],
  );

  const matrixRows: VsDiffRow[] = toVsDiffRows(buildDecisionTableRows([
    {
      label: 'Best for',
      a: toolA.best_for,
      b: toolB.best_for,
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'docs', 'Best for'),
    },
    {
      label: 'Output type',
      a: toolA.tagline,
      b: toolB.tagline,
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'docs', 'Output type'),
    },
    {
      label: 'Workflow speed',
      a: describeWorkflowSpeed(toolA),
      b: describeWorkflowSpeed(toolB),
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'help', 'Workflow speed'),
    },
    {
      label: 'Languages & dubbing',
      a: toolA.features.find((item) => /language|dubb|voice/i.test(item)) ?? 'See product docs',
      b: toolB.features.find((item) => /language|dubb|voice/i.test(item)) ?? 'See product docs',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'help', 'Languages & dubbing'),
    },
    {
      label: 'Templates',
      a: toolA.features.find((item) => /template/i.test(item)) ?? 'Template support not explicitly listed',
      b: toolB.features.find((item) => /template/i.test(item)) ?? 'Template support not explicitly listed',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'examples', 'Templates'),
    },
    {
      label: 'API',
      a: toolA.features.find((item) => /api/i.test(item)) ?? 'API availability depends on plan',
      b: toolB.features.find((item) => /api/i.test(item)) ?? 'API availability depends on plan',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'docs', 'API'),
    },
    {
      label: 'Pricing starting point',
      a: toolA.starting_price,
      b: toolB.starting_price,
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'pricing', 'Pricing starting point'),
    },
    {
      label: 'Free plan',
      a: toolA.pricing_model.toLowerCase().includes('free') ? 'Yes (check limits)' : 'Not clearly listed',
      b: toolB.pricing_model.toLowerCase().includes('free') ? 'Yes (check limits)' : 'Not clearly listed',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'pricing', 'Free plan'),
    },
  ], parsed.slugA, parsed.slugB));

  const scoreWeights = {
    pricingValue: 25,
    ease: 20,
    speed: 20,
    output: 20,
    customization: 15,
  };
  const scoreMetrics = getScoreMetricKeys({ weights: scoreWeights, a: scoreA, b: scoreB });
  const scoreProvenance = buildInferredScoreProvenance(scoreMetrics, [...matrixRows, ...keyDiffs]);
  const normalizedScore = normalizeInternalScore(
    {
      methodNote:
        'Internal score computed from pricingValue (25%), ease (20%), speed (20%), output (20%), and customization (15%), using structured product data when verified source rows are limited.',
      weights: scoreWeights,
      a: scoreA,
      b: scoreB,
      provenance: scoreProvenance,
    },
    [...matrixRows, ...keyDiffs],
    parsed.slugA,
    parsed.slugB,
  );
  const calibratedScore = applyFeaturedCalibration(normalizedScore, parsed.slugA, parsed.slugB);

  const comparison: VsComparison = {
    slugA: parsed.slugA,
    slugB: parsed.slugB,
    updatedAt: today,
    pricingCheckedAt: today,
    intentProfile,
    shortAnswer: {
      a: `Choose ${toolA.name} if you need ${legacyNeedA}.`,
      b: `Choose ${toolB.name} if you need ${legacyNeedB}.`,
    },
    bestFor: {
      a: legacyBestForA,
      b: legacyBestForB,
    },
    notFor: {
      a: legacyNotForA,
      b: legacyNotForB,
    },
    keyDiffs,
    matrixRows,
    score: calibratedScore,
    promptBox: {
      prompt:
        'Create a 45-second product update video for a B2B SaaS launch. Include one hook, three key benefits, and one CTA with on-screen captions.',
      settings: ['Duration: 45s', 'Format: 16:9', 'Language: English', 'Output: MP4 1080p', 'Tone: professional'],
      variants: [],
    },
    verdict: {
      winnerPrice: priceA <= priceB ? 'a' : 'b',
      winnerQuality: scoreA.output >= scoreB.output ? 'a' : 'b',
      winnerSpeed: scoreA.speed >= scoreB.speed ? 'a' : 'b',
      recommendation: `Start with ${toolA.name} if you need ${legacyNeedA}. Start with ${toolB.name} if you need ${legacyNeedB}.`,
    },
    related: {
      toolPages: [`/tool/${parsed.slugA}`, `/tool/${parsed.slugB}`],
      alternatives: [`/tool/${parsed.slugA}/alternatives`, `/tool/${parsed.slugB}/alternatives`],
      comparisons: findRelatedComparisonSlugs(parsed.slugA, parsed.slugB),
    },
    disclosure:
      'This VS page is assembled from structured product data with ongoing source linking. For scoring rules and source policy, see /methodology.',
  };

  return { comparison };
}

let supplementalCanonicalCache: Map<string, VsComparison> | null = null;
let supplementalSkipCache: VsCandidateSkip[] | null = null;
let isBuildingSupplementalCanonicals = false;

function hasStrictPricingCoverage(slugA: string, slugB: string): boolean {
  return getStrictPricingSources(slugA).length > 0 && getStrictPricingSources(slugB).length > 0;
}

function getExistingCanonicalPairSet(): Set<string> {
  const pairs = new Set<string>();
  for (const slug of getRawKnownVsSlugs()) {
    const canonicalSlug = getCanonicalVsSlug(slug);
    if (canonicalSlug) pairs.add(canonicalSlug);
  }
  return pairs;
}

function getSupplementalCanonicalComparisons(): Map<string, VsComparison> {
  if (supplementalCanonicalCache) return supplementalCanonicalCache;
  if (isBuildingSupplementalCanonicals) return new Map();

  isBuildingSupplementalCanonicals = true;
  try {
    const existingPairs = getExistingCanonicalPairSet();
    const generated = new Map<string, VsComparison>();
    const skipped: VsCandidateSkip[] = [];

    for (const [left, right] of SUPPLEMENTAL_VS_CANDIDATES) {
      const canonicalSlug = toCanonicalVsSlug(left, right);
      if (existingPairs.has(canonicalSlug) || getCanonicalComparisonMap().has(canonicalSlug)) {
        continue;
      }

      const parsed = parseVsSlug(canonicalSlug);
      if (!parsed) {
        skipped.push({ slug: canonicalSlug, reason: 'Candidate slug could not be parsed.' });
        continue;
      }

      if (!hasStrictPricingCoverage(parsed.slugA, parsed.slugB)) {
        skipped.push({ slug: canonicalSlug, reason: 'Strict pricing source missing for one or both tools.' });
        continue;
      }

      const built = buildLegacyComparison(parsed).comparison;
      if (!built) {
        skipped.push({ slug: canonicalSlug, reason: 'Legacy comparison generator returned null.' });
        continue;
      }

      const normalized = normalizeCanonicalComparison(built);
      const errors = validateVsComparison(normalized);
      if (errors.length > 0) {
        skipped.push({ slug: canonicalSlug, reason: `Generated comparison failed schema validation: ${errors.join(' | ')}` });
        continue;
      }

      generated.set(canonicalSlug, normalized);
    }

    supplementalCanonicalCache = generated;
    supplementalSkipCache = skipped;
    return supplementalCanonicalCache;
  } finally {
    isBuildingSupplementalCanonicals = false;
  }
}

export function getSupplementalVsGenerationReport(): {
  added: string[];
  skipped: VsCandidateSkip[];
} {
  const generated = getSupplementalCanonicalComparisons();
  return {
    added: Array.from(generated.keys()).sort(),
    skipped: supplementalSkipCache ? [...supplementalSkipCache] : [],
  };
}

export function listVsDuplicateRedirects(): VsDuplicateRedirect[] {
  return getRawKnownVsSlugs()
    .map((slug) => {
      const canonicalSlug = getCanonicalVsSlug(slug);
      if (!canonicalSlug || canonicalSlug === slug) return null;
      return {
        from: slug,
        to: canonicalSlug,
      };
    })
    .filter((item): item is VsDuplicateRedirect => Boolean(item))
    .sort((left, right) => left.from.localeCompare(right.from));
}

function resolveVsComparison(slug: string, options?: { debug?: boolean }): VsLoadResult {
  const debug = options?.debug ?? false;
  const parsed = parseVsSlug(slug);
  const discovery = discoverVsDataFiles();
  const availableSlugs = getSeedVsSlugs();
  const slugSample = availableSlugs.slice(0, 20);

  if (debug) {
    logDebug('slug requested', { slugRequested: slug });
    logDebug('available slugs', { count: availableSlugs.length, sample: slugSample });
  }

  if (!parsed) {
    if (debug) {
      logDebug('entry hit', { hit: false, reason: 'slug parse failed' });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      reason: 'Slug parse failed. Expected format: {a}-vs-{b}.',
      errors: ['Slug parse failed. Expected format: {a}-vs-{b}.'],
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      parsed: null,
    }, debug);
  }

  const normalizedSlug = toVsSlug(parsed.slugA, parsed.slugB);
  const canonicalSlug = toCanonicalVsSlug(parsed.slugA, parsed.slugB);
  const isSeeded = availableSlugs.includes(canonicalSlug);
  const fromCanonical = getCanonicalComparisonMap().get(canonicalSlug);
  if (fromCanonical) {
    const errors = validateVsComparison(fromCanonical);
    if (errors.length === 0) {
      const normalizedCanonical = applyAuthoredVsOverride(normalizeCanonicalComparison(fromCanonical), parsed);
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'registered canonical data' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: normalizedCanonical,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }

    if (debug) {
      console.error('[vs-loader] schema validation failed (canonical)', {
        normalizedSlug,
        errors,
      });
    }

    const adaptedComparison = adaptComparisonFromRaw(fromCanonical, parsed) ?? buildLegacyComparison(parsed).comparison;
    if (adaptedComparison) {
      const adaptedErrors = validateVsComparison(adaptedComparison);
      if (adaptedErrors.length === 0) {
        return finalizeVsResult({
          status: 'PARTIAL',
          comparison: adaptedComparison,
          source: 'legacy-adapter',
          indexHit: true,
          hitSource: 'legacy',
          normalizedSlug,
          reason: `Canonical schema invalid. Adapter fallback applied: ${errors.join(' | ')}`,
          errors,
          parsed,
        }, debug);
      }
      return finalizeVsResult({
        status: 'PARTIAL',
        comparison: adaptedComparison,
        source: 'legacy-adapter',
        indexHit: true,
        hitSource: 'legacy',
        normalizedSlug,
        reason: `Canonical + adapter schema invalid: ${[...errors, ...adaptedErrors].join(' | ')}`,
        errors: [...errors, ...adaptedErrors],
        parsed,
      }, debug);
    }
  }

  const supplementalCanonical = getSupplementalCanonicalComparisons().get(canonicalSlug);
  if (supplementalCanonical) {
    const mergedSupplementalCanonical = applyAuthoredVsOverride(supplementalCanonical, parsed);
    if (debug) {
      logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'supplemental canonical generated' });
    }
    return finalizeVsResult({
      status: 'FULL',
      comparison: mergedSupplementalCanonical,
      indexHit: true,
      hitSource: 'canonical',
      source: 'canonical',
      normalizedSlug,
      parsed,
    }, debug);
  }

  const authoredOverride = AUTHORED_VS_OVERRIDES[canonicalSlug];
  if (authoredOverride) {
    const authoredComparison = adaptComparisonFromRaw(authoredOverride, parsed);
    if (authoredComparison) {
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'authored override merged onto legacy base' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: authoredComparison,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const fromJson = discovery.jsonComparisonsBySlug.get(canonicalSlug);
  if (fromJson) {
    const errors = validateVsComparison(fromJson);
    if (errors.length === 0) {
      const normalizedJson = applyAuthoredVsOverride(normalizeCanonicalComparison(fromJson), parsed);
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'json file loaded' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: normalizedJson,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const fromTs = discovery.tsComparisonsBySlug.get(canonicalSlug);
  if (fromTs) {
    const errors = validateVsComparison(fromTs);
    if (errors.length === 0) {
      const normalizedTs = applyAuthoredVsOverride(normalizeCanonicalComparison(fromTs), parsed);
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'ts file auto-loaded' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: normalizedTs,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const jsonSchemaErrors = discovery.jsonErrorsBySlug.get(canonicalSlug);
  const tsSchemaErrors = discovery.tsErrorsBySlug.get(canonicalSlug);
  const schemaErrors = dedupe([...(jsonSchemaErrors ?? []), ...(tsSchemaErrors ?? [])]);

  if (schemaErrors.length > 0) {
    const rawFromFile =
      discovery.jsonRawBySlug.get(canonicalSlug) ??
      discovery.tsRawBySlug.get(canonicalSlug);

    if (debug) {
      console.error('[vs-loader] schema validation failed (file discovered)', {
        normalizedSlug,
        errors: schemaErrors,
      });
    }

    const adaptedComparison = adaptComparisonFromRaw(rawFromFile, parsed) ?? buildLegacyComparison(parsed).comparison;
    if (adaptedComparison) {
      const adaptedErrors = validateVsComparison(adaptedComparison);
      if (adaptedErrors.length === 0) {
        return finalizeVsResult({
          status: 'PARTIAL',
          comparison: adaptedComparison,
          source: 'legacy-adapter',
          indexHit: true,
          hitSource: 'legacy',
          normalizedSlug,
          reason: `VS file exists but schema is invalid. Adapter fallback applied: ${schemaErrors.join(' | ')}`,
          errors: schemaErrors,
          parsed,
        }, debug);
      }

      return finalizeVsResult({
        status: 'PARTIAL',
        comparison: adaptedComparison,
        source: 'legacy-adapter',
        indexHit: true,
        hitSource: 'legacy',
        normalizedSlug,
        reason: `VS file schema invalid and adapter still has gaps: ${[...schemaErrors, ...adaptedErrors].join(' | ')}`,
        errors: [...schemaErrors, ...adaptedErrors],
        parsed,
      }, debug);
    }

    return finalizeVsResult({
      status: 'PARTIAL',
      comparison: null,
      source: 'none',
      indexHit: true,
      hitSource: 'none',
      normalizedSlug,
      reason: `VS file schema invalid and adapter unavailable: ${schemaErrors.join(' | ')}`,
      errors: schemaErrors,
      parsed,
    }, debug);
  }

  if (!isSeeded) {
    if (debug) {
      logDebug('entry hit', {
        hit: false,
        source: 'none',
        normalizedSlug,
        reason: 'Slug not in indexed VS data set.',
      });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      normalizedSlug,
      reason: 'Slug not in indexed VS data set.',
      errors: ['Slug not in indexed VS data set.'],
      parsed,
    }, debug);
  }

  const tsFileExistsButUnregistered =
    discovery.tsOnlySlugs.has(normalizedSlug) || discovery.tsOnlySlugs.has(canonicalSlug);
  if (debug && tsFileExistsButUnregistered) {
    console.error('[vs-loader] ts file detected but not registered in canonical imports', {
      normalizedSlug,
      hint: 'Add file export to src/data/vs/index.ts canonicalComparisons or provide .json file for auto-load.',
    });
  }

  const adapted = buildLegacyComparison(parsed);
  if (!adapted.comparison) {
    if (debug) {
      logDebug('entry hit', {
        hit: false,
        source: 'none',
        normalizedSlug,
        reason: adapted.reason ?? 'No canonical entry and no adapter data.',
      });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      normalizedSlug,
      reason: adapted.reason ?? 'No canonical entry and no adapter data.',
      errors: [adapted.reason ?? 'No canonical entry and no adapter data.'],
      parsed,
    }, debug);
  }

  const adapterErrors = validateVsComparison(adapted.comparison);
  if (adapterErrors.length > 0) {
    if (debug) {
      console.error('[vs-loader] schema validation failed (adapter)', {
        normalizedSlug,
        errors: adapterErrors,
      });
    }
    return finalizeVsResult({
      status: 'PARTIAL',
      comparison: null,
      source: 'none',
      indexHit: true,
      hitSource: 'none',
      normalizedSlug,
      reason: `Adapter schema invalid: ${adapterErrors.join(' | ')}`,
      errors: adapterErrors,
      parsed,
    }, debug);
  }

  return finalizeVsResult({
    status: 'PARTIAL',
    comparison: adapted.comparison,
    source: 'legacy-adapter',
    indexHit: true,
    hitSource: 'legacy',
    normalizedSlug,
    reason: 'No dedicated VS dataset found. Rendered with legacy adapter.',
    parsed,
  }, debug);
}

export function listVsSlugs(): string[] {
  return getSeedVsSlugs();
}

export function listRawVsSlugs(): string[] {
  return getRawKnownVsSlugs();
}

export function getVsComparisonWithStatus(slug: string): VsLoadResult {
  return resolveVsComparison(slug, { debug: DEV_LOG });
}

export function getVsComparison(slug: string): VsComparison | null {
  const result = resolveVsComparison(slug, { debug: DEV_LOG });
  return result.comparison;
}

export function getAllVsComparisons(): VsComparison[] {
  return listVsSlugs()
    .map((slug) => resolveVsComparison(slug, { debug: false }).comparison)
    .filter((comparison): comparison is VsComparison => Boolean(comparison));
}

// Backward-compatible alias for existing imports.
export function getVsComparisonBySlug(slug: string): VsComparison | undefined {
  return getVsComparison(slug) ?? undefined;
}

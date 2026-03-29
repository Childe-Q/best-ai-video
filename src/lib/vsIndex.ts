import { getVsComparison, listVsSlugs } from '@/data/vs';
import { getTool } from '@/lib/getTool';
import { getPageReadinessSync } from '@/lib/readiness';
import { buildVsPairCopy } from '@/lib/vsPairType';
import { VsComparison, VsIntent } from '@/types/vs';

export type VsIndexCard = {
  slug: string;
  comparisonName: string;
  toolAName: string;
  toolBName: string;
  hubDistinction: string;
  decisionLine: string;
  startingPointReason?: string;
  updatedAt: string;
  intent: VsIntent;
  intentLabel: string;
};

export type VsIndexGroup = {
  intent: VsIntent;
  title: string;
  helper: string;
  anchorId: string;
  items: VsIndexCard[];
};

type VsStartingPointSignals = {
  pairIntentClarity: number;
  marketFamiliarity: number;
  entryPointUsefulness: number;
  internalLinkPriority: number;
};

type VsStartingPointScore = VsStartingPointSignals & {
  evidenceCompleteness: number;
  total: number;
};

export const VS_INDEX_INTENT_ORDER: VsIntent[] = ['avatar', 'editor', 'text', 'repurpose'];

export const VS_INDEX_INTENT_LABELS: Record<VsIntent, string> = {
  avatar: 'Avatar comparisons',
  editor: 'Editing comparisons',
  text: 'Text-to-video comparisons',
  repurpose: 'Repurposing comparisons',
};

export const VS_INDEX_INTENT_HELPERS: Record<VsIntent, string> = {
  avatar:
    'For presenter-led buying decisions. Not the right track for stock-scene generation, repurposing long-form content, or post-draft cleanup.',
  editor:
    'For post-draft editing decisions. Not the right track when you still need a visible presenter, net-new scene generation, or content repurposing.',
  text:
    'For net-new video created from prompts, scripts, or narration. Not the right track for editing an existing cut or turning long-form source material into clips.',
  repurpose:
    'For turning existing webinars, podcasts, articles, or recordings into clips. Not the right track for prompt-led generation or presenter-led avatar workflows.',
};

export const VS_INDEX_TRACK_GUIDES: Record<VsIntent, { useWhen: string; notFor: string }> = {
  avatar: {
    useWhen: 'Best for presenter-led videos: demos, outreach, training, and avatar explainers.',
    notFor: 'Not for prompt-led scene generation, repurposing, or post-draft editing.',
  },
  editor: {
    useWhen: 'Best for fixing or refining an existing draft: edits, subtitles, cleanup, and polish.',
    notFor: 'Not for avatar delivery, net-new generation, or turning long-form content into clips.',
  },
  text: {
    useWhen: 'Best for net-new video from prompts, scripts, or narration.',
    notFor: 'Not for avatar-led delivery, editing an existing cut, or repurposing source content.',
  },
  repurpose: {
    useWhen: 'Best for turning webinars, podcasts, articles, or recordings into clips.',
    notFor: 'Not for net-new generation, avatar workflows, or hands-on editing decisions.',
  },
};

export const VS_INDEX_STARTING_POINT_RULES = [
  'pair intent clarity',
  'market familiarity',
  'evidence completeness',
  'internal linking priority',
  'entry-point usefulness',
] as const;

const VS_INDEX_DECISION_LINE_OVERRIDES: Record<string, string> = {
  'descript-vs-fliki':
    'Pick Fliki if the bottleneck is making the first draft. Pick Descript if the work starts after the draft exists.',
  'descript-vs-veed-io':
    'Start with Veed.io if the job is reaching a usable draft faster. Start with Descript if the draft already exists and needs refinement.',
  'elai-io-vs-heygen':
    'Pick Elai.io for slide-led explainers and presentation conversion. Pick HeyGen for outreach, spokesperson videos, and avatar explainers.',
  'fliki-vs-invideo':
    'Pick Fliki for text-first narration workflows. Pick InVideo for stock-scene drafting and broader visual assembly.',
  'fliki-vs-pictory':
    'Pick Fliki if the input is mostly text. Pick Pictory if the input is already a webinar, podcast, article, or recording.',
  'fliki-vs-zebracat':
    'Pick Fliki when narration carries the message. Pick Zebracat when short-form output needs more visual range.',
  'fliki-vs-heygen':
    'Pick Fliki for blog, text, and voiceover-led batches. Pick HeyGen when the message needs an on-screen presenter.',
  'heygen-vs-invideo':
    'Pick HeyGen when a visible presenter changes trust. Pick InVideo when the job is volume output for ads or shorts.',
  'heygen-vs-synthesia':
    'Pick HeyGen for outreach and spokesperson videos. Pick Synthesia for training, internal comms, and governed rollout.',
  'invideo-vs-pictory':
    'Pick InVideo if the workflow starts from a fresh idea. Pick Pictory if it starts from existing long-form content.',
  'invideo-vs-veed-io':
    'Pick InVideo to reach a first draft faster. Pick Veed.io when the draft exists and needs cleanup or edits.',
  'invideo-vs-zebracat':
    'Pick InVideo for broader stock-scene explainers. Pick Zebracat for fast social clips and ad variants.',
  'pictory-vs-zebracat':
    'Pick Zebracat when starting from a prompt or script. Pick Pictory when starting from a webinar, podcast, article, or recording.',
};

const VS_INDEX_STARTING_POINT_REASONS: Record<string, string> = {
  'heygen-vs-synthesia':
    'Why start here: it is the clearest first stop when the avatar decision is really outreach flexibility versus governed training rollout.',
  'descript-vs-veed-io':
    'Why start here: it separates fast browser editing from deeper post-draft refinement before smaller editing differences matter.',
  'fliki-vs-invideo':
    'Why start here: it exposes the core text-to-video split between narration-led creation and broader visual assembly.',
  'invideo-vs-pictory':
    'Why start here: it is the fastest way to tell whether the job is new-draft creation or repurposing existing long-form content.',
};

// Home-page starting points should be explainable, not editorially arbitrary.
const VS_INDEX_STARTING_POINT_SIGNALS: Record<string, VsStartingPointSignals> = {
  'heygen-vs-synthesia': {
    pairIntentClarity: 5,
    marketFamiliarity: 5,
    entryPointUsefulness: 5,
    internalLinkPriority: 5,
  },
  'elai-io-vs-heygen': {
    pairIntentClarity: 4,
    marketFamiliarity: 3,
    entryPointUsefulness: 3,
    internalLinkPriority: 3,
  },
  'heygen-vs-invideo': {
    pairIntentClarity: 3,
    marketFamiliarity: 5,
    entryPointUsefulness: 3,
    internalLinkPriority: 4,
  },
  'descript-vs-veed-io': {
    pairIntentClarity: 5,
    marketFamiliarity: 4,
    entryPointUsefulness: 5,
    internalLinkPriority: 4,
  },
  'invideo-vs-veed-io': {
    pairIntentClarity: 4,
    marketFamiliarity: 4,
    entryPointUsefulness: 4,
    internalLinkPriority: 3,
  },
  'fliki-vs-invideo': {
    pairIntentClarity: 5,
    marketFamiliarity: 4,
    entryPointUsefulness: 5,
    internalLinkPriority: 4,
  },
  'invideo-vs-zebracat': {
    pairIntentClarity: 4,
    marketFamiliarity: 3,
    entryPointUsefulness: 4,
    internalLinkPriority: 4,
  },
  'fliki-vs-zebracat': {
    pairIntentClarity: 4,
    marketFamiliarity: 3,
    entryPointUsefulness: 3,
    internalLinkPriority: 3,
  },
  'descript-vs-fliki': {
    pairIntentClarity: 4,
    marketFamiliarity: 4,
    entryPointUsefulness: 3,
    internalLinkPriority: 3,
  },
  'invideo-vs-pictory': {
    pairIntentClarity: 5,
    marketFamiliarity: 5,
    entryPointUsefulness: 5,
    internalLinkPriority: 5,
  },
  'fliki-vs-pictory': {
    pairIntentClarity: 4,
    marketFamiliarity: 4,
    entryPointUsefulness: 4,
    internalLinkPriority: 3,
  },
  'pictory-vs-zebracat': {
    pairIntentClarity: 4,
    marketFamiliarity: 3,
    entryPointUsefulness: 3,
    internalLinkPriority: 3,
  },
  'fliki-vs-heygen': {
    pairIntentClarity: 3,
    marketFamiliarity: 4,
    entryPointUsefulness: 3,
    internalLinkPriority: 3,
  },
};

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeDecisionLine(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^Reach for /, 'Pick ')
    .replace(/^Go with /, 'Pick ')
    .replace(/^Use /, 'Pick ')
    .replace(/^Choose /, 'Pick ');
}

function getEvidenceCompletenessScore(comparison: VsComparison): number {
  let score = 1;

  if ((comparison.decisionCases?.length ?? 0) >= 3) score += 1;
  if (comparison.keyDiffs.length >= 4) score += 1;
  if (comparison.matrixRows.length >= 5) score += 1;
  if ((comparison.externalValidation?.length ?? 0) >= 2) score += 1;

  return Math.min(score, 5);
}

function getStartingPointScore(slug: string, comparison: VsComparison): VsStartingPointScore {
  const signals = VS_INDEX_STARTING_POINT_SIGNALS[slug] ?? {
    pairIntentClarity: 2,
    marketFamiliarity: 2,
    entryPointUsefulness: 2,
    internalLinkPriority: 2,
  };
  const evidenceCompleteness = getEvidenceCompletenessScore(comparison);

  return {
    ...signals,
    evidenceCompleteness,
    total:
      signals.pairIntentClarity +
      signals.marketFamiliarity +
      evidenceCompleteness +
      signals.internalLinkPriority +
      signals.entryPointUsefulness,
  };
}

function compareCardsByPriority(left: VsIndexCard, right: VsIndexCard): number {
  const leftComparison = getVsComparison(left.slug);
  const rightComparison = getVsComparison(right.slug);

  if (leftComparison && rightComparison) {
    const scoreDiff =
      getStartingPointScore(right.slug, rightComparison).total -
      getStartingPointScore(left.slug, leftComparison).total;
    if (scoreDiff !== 0) return scoreDiff;
  }

  return left.comparisonName.localeCompare(right.comparisonName);
}

function isVsIndexCard(card: VsIndexCard | null | undefined): card is VsIndexCard {
  return Boolean(card);
}

export function listVsIndexCards(): VsIndexCard[] {
  return listVsSlugs()
    .map((slug): VsIndexCard | null => {
      if (!getPageReadinessSync('vs', slug).ready) {
        return null;
      }

      const comparison = getVsComparison(slug);
      if (!comparison) return null;

      const toolA = getTool(comparison.slugA);
      const toolB = getTool(comparison.slugB);
      const pairCopy = toolA && toolB ? buildVsPairCopy(toolA, toolB, comparison.intentProfile) : null;
      const toolAName = toolA?.name ?? toTitleCase(comparison.slugA);
      const toolBName = toolB?.name ?? toTitleCase(comparison.slugB);
      const intent = comparison.intentProfile?.primary ?? 'text';
      const baseCard = {
        slug,
        comparisonName: `${toolAName} vs ${toolBName}`,
        toolAName,
        toolBName,
        hubDistinction:
          comparison.decisionSummary ?? pairCopy?.decisionSummary ?? comparison.shortAnswer.a,
        decisionLine: normalizeDecisionLine(
          VS_INDEX_DECISION_LINE_OVERRIDES[slug] ??
            comparison.verdict.recommendation ??
            pairCopy?.recommendation ??
            comparison.shortAnswer.b,
        ),
        updatedAt: comparison.updatedAt,
        intent,
        intentLabel: VS_INDEX_INTENT_LABELS[intent],
      } satisfies Omit<VsIndexCard, 'startingPointReason'>;

      const startingPointReason = VS_INDEX_STARTING_POINT_REASONS[slug];

      return startingPointReason
        ? {
            ...baseCard,
            startingPointReason,
          }
        : baseCard;
    })
    .filter(isVsIndexCard)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getPrimaryStartingPointCards(cards: VsIndexCard[]): VsIndexCard[] {
  return VS_INDEX_INTENT_ORDER.map((intent) =>
    cards.filter((card) => card.intent === intent).sort(compareCardsByPriority)[0] ?? null,
  ).filter(isVsIndexCard);
}

export function getGroupedVsCards(cards: VsIndexCard[]): VsIndexGroup[] {
  return VS_INDEX_INTENT_ORDER.map((intent) => ({
    intent,
    title: VS_INDEX_INTENT_LABELS[intent],
    helper: VS_INDEX_INTENT_HELPERS[intent],
    anchorId: `workflow-${intent}`,
    items: cards.filter((card) => card.intent === intent).sort(compareCardsByPriority),
  })).filter((group) => group.items.length > 0);
}

export function getComparisonLibraryCards(cards: VsIndexCard[]): VsIndexCard[] {
  return [...cards].sort((left, right) => left.comparisonName.localeCompare(right.comparisonName));
}

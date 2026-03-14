import { getVsComparison, listVsSlugs, canonicalSlug } from '@/data/vs';
import { getTool } from '@/lib/getTool';
import { buildVsPairCopy } from '@/lib/vsPairType';
import { VsIntent } from '@/types/vs';

export type VsIndexCard = {
  slug: string;
  toolAName: string;
  toolBName: string;
  hubDistinction: string;
  hubSelection: string;
  updatedAt: string;
  intent: VsIntent;
};

export type VsIndexGroup = {
  intent: VsIntent;
  title: string;
  helper: string;
  items: VsIndexCard[];
};

export const VS_INDEX_FEATURED_SLUGS = [
  canonicalSlug('heygen', 'invideo'),
  canonicalSlug('heygen', 'synthesia'),
  canonicalSlug('fliki', 'heygen'),
  canonicalSlug('invideo', 'pictory'),
  canonicalSlug('invideo', 'veed-io'),
  canonicalSlug('descript', 'veed-io'),
  canonicalSlug('runway', 'sora'),
  canonicalSlug('deepbrain-ai', 'heygen'),
];

export const VS_INDEX_INTENT_ORDER: VsIntent[] = ['avatar', 'editor', 'text', 'repurpose'];

export const VS_INDEX_INTENT_LABELS: Record<VsIntent, string> = {
  avatar: 'Avatar comparisons',
  editor: 'Editing comparisons',
  text: 'Text-to-video comparisons',
  repurpose: 'Repurposing comparisons',
};

export const VS_INDEX_FEATURED_HELPER =
  'Start here if you already know the pair you are deciding between. These are the highest-priority head-to-head pages and the strongest entry points into the comparison library.';

export const VS_INDEX_INTENT_HELPERS: Record<VsIntent, string> = {
  avatar:
    'Use this group when the real question is rollout model: lighter spokesperson workflows versus more structured avatar deployment, governance, or enterprise posture.',
  editor:
    'Use this group when the bottleneck sits after generation. These comparisons separate first-draft creation from revision control, cleanup, and editing leverage.',
  text:
    'Use this group when the choice is really about how video starts: narration-first conversion, broader scene assembly, or format-driven communication.',
  repurpose:
    'Use this group when existing source material changes the buying decision. These pages help separate blank-page drafting from repurposing webinars, podcasts, articles, or recordings.',
};

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function listVsIndexCards(): VsIndexCard[] {
  return listVsSlugs()
    .map((slug) => {
      const comparison = getVsComparison(slug);
      if (!comparison) return null;

      const toolA = getTool(comparison.slugA);
      const toolB = getTool(comparison.slugB);
      const pairCopy = toolA && toolB ? buildVsPairCopy(toolA, toolB, comparison.intentProfile) : null;

      return {
        slug,
        toolAName: toolA?.name ?? toTitleCase(comparison.slugA),
        toolBName: toolB?.name ?? toTitleCase(comparison.slugB),
        hubDistinction: comparison.decisionSummary ?? pairCopy?.decisionSummary ?? comparison.shortAnswer.a,
        hubSelection: comparison.verdict.recommendation ?? pairCopy?.recommendation ?? comparison.shortAnswer.b,
        updatedAt: comparison.updatedAt,
        intent: comparison.intentProfile?.primary ?? 'text',
      } satisfies VsIndexCard;
    })
    .filter((item): item is VsIndexCard => Boolean(item))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getFeaturedVsCards(cards: VsIndexCard[]): VsIndexCard[] {
  const cardMap = new Map(cards.map((card) => [card.slug, card]));
  return VS_INDEX_FEATURED_SLUGS.map((slug) => cardMap.get(slug)).filter((card): card is VsIndexCard => Boolean(card));
}

export function getGroupedVsCards(cards: VsIndexCard[]): VsIndexGroup[] {
  return VS_INDEX_INTENT_ORDER
    .map((intent) => ({
      intent,
      title: VS_INDEX_INTENT_LABELS[intent],
      helper: VS_INDEX_INTENT_HELPERS[intent],
      items: cards.filter((card) => card.intent === intent).slice(0, 6),
    }))
    .filter((group) => group.items.length > 0);
}

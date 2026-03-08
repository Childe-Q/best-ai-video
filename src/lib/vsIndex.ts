import { getVsComparison, listVsSlugs, canonicalSlug } from '@/data/vs';
import { getTool } from '@/lib/getTool';
import { VsIntent } from '@/types/vs';

export type VsIndexCard = {
  slug: string;
  toolAName: string;
  toolBName: string;
  shortA: string;
  shortB: string;
  updatedAt: string;
  intent: VsIntent;
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

      return {
        slug,
        toolAName: toolA?.name ?? toTitleCase(comparison.slugA),
        toolBName: toolB?.name ?? toTitleCase(comparison.slugB),
        shortA: comparison.shortAnswer.a,
        shortB: comparison.shortAnswer.b,
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

export function getGroupedVsCards(cards: VsIndexCard[]): Array<{ intent: VsIntent; title: string; items: VsIndexCard[] }> {
  return VS_INDEX_INTENT_ORDER
    .map((intent) => ({
      intent,
      title: VS_INDEX_INTENT_LABELS[intent],
      items: cards.filter((card) => card.intent === intent).slice(0, 6),
    }))
    .filter((group) => group.items.length > 0);
}

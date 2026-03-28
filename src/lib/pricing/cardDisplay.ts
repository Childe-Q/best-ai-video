import colossyanRecord from '@/data/pricing/normalized/colossyan.json';
import dIdRecord from '@/data/pricing/normalized/d-id.json';
import deepbrainAiRecord from '@/data/pricing/normalized/deepbrain-ai.json';
import heygenRecord from '@/data/pricing/normalized/heygen.json';
import lumen5Record from '@/data/pricing/normalized/lumen5.json';
import soraRecord from '@/data/pricing/normalized/sora.json';
import steveAiRecord from '@/data/pricing/normalized/steve-ai.json';
import synthesysRecord from '@/data/pricing/normalized/synthesys.json';
import { buildResolverPreview, type NormalizedPricingRecord } from '@/lib/pricing/types';
import { getPricingDisplay } from '@/lib/pricing/display';
import { isTryNowTool } from '@/lib/alternatives/affiliateWhitelist';

type ToolLike = { slug: string } | string;

export interface ToolCardPricingDisplay {
  displayText: string;
  hintText: string | null;
  source: 'legacy-accepted' | 'candidate-exact' | 'candidate-coarse' | 'fallback';
  tagLabel: 'Paid' | 'Custom pricing' | 'Pricing unverified' | 'Free';
}

const CANDIDATE_RECORDS: Record<string, NormalizedPricingRecord> = {
  colossyan: colossyanRecord as unknown as NormalizedPricingRecord,
  'd-id': dIdRecord as unknown as NormalizedPricingRecord,
  'deepbrain-ai': deepbrainAiRecord as unknown as NormalizedPricingRecord,
  heygen: heygenRecord as unknown as NormalizedPricingRecord,
  lumen5: lumen5Record as unknown as NormalizedPricingRecord,
  sora: soraRecord as unknown as NormalizedPricingRecord,
  'steve-ai': steveAiRecord as unknown as NormalizedPricingRecord,
  synthesys: synthesysRecord as unknown as NormalizedPricingRecord,
};

const MAIN_TOOL_CANDIDATE_EXACT_SLUGS = new Set(['heygen']);

function getSlug(input: ToolLike): string {
  return typeof input === 'string' ? input : input.slug;
}

function getTagLabel(displayText: string): ToolCardPricingDisplay['tagLabel'] {
  if (displayText === 'Custom pricing') {
    return 'Custom pricing';
  }
  if (displayText === 'Pricing not verified') {
    return 'Pricing unverified';
  }
  if (displayText === 'Free') {
    return 'Free';
  }
  return 'Paid';
}

function buildCandidateCardDisplay(record: NormalizedPricingRecord): ToolCardPricingDisplay {
  const preview = buildResolverPreview(record);
  const hasCandidateExact = preview.exactPriceAllowed.display && Boolean(preview.displayText);
  const hasUsefulCoarse =
    preview.coarseDisplayText === 'Paid plans available' || preview.coarseDisplayText === 'Custom pricing';

  if (hasCandidateExact) {
    return {
      displayText: preview.displayText,
      hintText: null,
      source: 'candidate-exact',
      tagLabel: getTagLabel(preview.displayText),
    };
  }

  if (hasUsefulCoarse) {
    return {
      displayText: preview.coarseDisplayText,
      hintText: null,
      source: 'candidate-coarse',
      tagLabel: getTagLabel(preview.coarseDisplayText),
    };
  }

  return {
    displayText: 'Pricing not verified',
    hintText: null,
    source: 'fallback',
    tagLabel: 'Pricing unverified',
  };
}

export function getToolCardPricingDisplay(input: ToolLike): ToolCardPricingDisplay {
  const slug = getSlug(input).toLowerCase().trim();
  const legacyDisplay = getPricingDisplay(input);
  const candidateRecord = CANDIDATE_RECORDS[slug];

  if (candidateRecord) {
    const candidateDisplay = buildCandidateCardDisplay(candidateRecord);

    if (MAIN_TOOL_CANDIDATE_EXACT_SLUGS.has(slug) && candidateDisplay.source === 'candidate-exact') {
      return candidateDisplay;
    }

    if (
      candidateDisplay.source === 'candidate-exact' ||
      candidateDisplay.source === 'candidate-coarse'
    ) {
      return candidateDisplay;
    }
  }

  if (isTryNowTool(slug) && legacyDisplay.displayText !== 'Pricing not verified') {
    return {
      displayText: legacyDisplay.displayText,
      hintText: legacyDisplay.hintText,
      source: 'legacy-accepted',
      tagLabel: getTagLabel(legacyDisplay.displayText),
    };
  }

  if (legacyDisplay.displayText !== 'Pricing not verified') {
    return {
      displayText: legacyDisplay.displayText,
      hintText: legacyDisplay.hintText,
      source: 'legacy-accepted',
      tagLabel: getTagLabel(legacyDisplay.displayText),
    };
  }

  return {
    displayText: 'Pricing not verified',
    hintText: null,
    source: 'fallback',
    tagLabel: 'Pricing unverified',
  };
}

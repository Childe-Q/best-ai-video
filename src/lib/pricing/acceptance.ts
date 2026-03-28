import deepbrainAiAuditData from '@/data/pricing/audits/deepbrain-ai.json';
import dIdAuditData from '@/data/pricing/audits/d-id.json';
import steveAiAuditData from '@/data/pricing/audits/steve-ai.json';
import deepbrainAiRecordData from '@/data/pricing/normalized/deepbrain-ai.json';
import dIdRecordData from '@/data/pricing/normalized/d-id.json';
import steveAiRecordData from '@/data/pricing/normalized/steve-ai.json';
import {
  buildResolverPreview,
  type CoarseDisplayText,
  type NormalizedPricingRecord,
  type PricingAuditRecord,
  type PricingVerification,
} from '@/lib/pricing/types';

type ToolLike = { slug: string } | string;

export interface PricingAcceptanceResult {
  slug: string;
  displayText: string;
  coarseDisplayText: CoarseDisplayText;
  exactPriceAllowed: boolean;
  verification: PricingVerification;
  reason: string | null;
  reviewWarning: string | null;
  summaryLabel: string;
}

const PROOF_SET_RECORDS: Record<string, NormalizedPricingRecord> = {
  'deepbrain-ai': deepbrainAiRecordData as NormalizedPricingRecord,
  'd-id': dIdRecordData as NormalizedPricingRecord,
  'steve-ai': steveAiRecordData as NormalizedPricingRecord,
};

const PROOF_SET_AUDITS: Record<string, PricingAuditRecord> = {
  'deepbrain-ai': deepbrainAiAuditData as PricingAuditRecord,
  'd-id': dIdAuditData as PricingAuditRecord,
  'steve-ai': steveAiAuditData as PricingAuditRecord,
};

function getSlug(input: ToolLike): string {
  return typeof input === 'string' ? input : input.slug;
}

function getPrimaryReason(record: NormalizedPricingRecord): string | null {
  return record.recommendedDisplayPrice?.reason ?? record.verifiedStartingPrice.reason ?? null;
}

function getReviewWarning(record: NormalizedPricingRecord, audit: PricingAuditRecord): string | null {
  if (record.verification === 'partial') {
    return record.notes.find((note) => note.toLowerCase().includes('manual review')) ?? record.notes[0] ?? null;
  }

  if (record.governance.reviewRequired) {
    return audit.manualReviewChecklist[0] ?? record.notes[record.notes.length - 1] ?? null;
  }

  return null;
}

function getSummaryLabel(result: {
  exactPriceAllowed: boolean;
  verification: PricingVerification;
}): string {
  if (result.exactPriceAllowed) {
    return 'Pricing reviewed';
  }

  if (result.verification === 'partial') {
    return 'Pricing under review';
  }

  if (result.verification === 'verified') {
    return 'Pricing reviewed';
  }

  return 'Pricing unverified';
}

export function getPricingAcceptanceResult(input: ToolLike): PricingAcceptanceResult | null {
  const slug = getSlug(input).toLowerCase().trim();
  const record = PROOF_SET_RECORDS[slug];
  const audit = PROOF_SET_AUDITS[slug];

  if (!record || !audit) {
    return null;
  }

  const preview = buildResolverPreview(record);
  const exactPriceAllowed = preview.exactPriceAllowed.display;
  const verification = record.verification;

  return {
    slug,
    displayText: preview.displayText,
    coarseDisplayText: preview.coarseDisplayText,
    exactPriceAllowed,
    verification,
    reason: getPrimaryReason(record),
    reviewWarning: getReviewWarning(record, audit),
    summaryLabel: getSummaryLabel({ exactPriceAllowed, verification }),
  };
}

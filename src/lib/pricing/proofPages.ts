import dIdAuditData from '@/data/pricing/audits/d-id.json';
import deepbrainAiAuditData from '@/data/pricing/audits/deepbrain-ai.json';
import steveAiAuditData from '@/data/pricing/audits/steve-ai.json';
import dIdRecordData from '@/data/pricing/normalized/d-id.json';
import deepbrainAiRecordData from '@/data/pricing/normalized/deepbrain-ai.json';
import steveAiRecordData from '@/data/pricing/normalized/steve-ai.json';
import {
  type NormalizedPlanBullet,
  type NormalizedPricingPlan,
  type NormalizedPricingRecord,
  type PricingAuditRecord,
} from '@/lib/pricing/types';
import { getPricingAcceptanceResult } from '@/lib/pricing/acceptance';
import { shouldUseProductizedPricingPage } from '@/lib/pricing/productPageOverrides';

type ProofSlug = 'deepbrain-ai' | 'd-id' | 'steve-ai';

export interface ProofPricingPlanSection {
  title: string | null;
  bullets: string[];
}

export interface ProofPricingPlanView {
  planId: string;
  name: string;
  planType: NormalizedPricingPlan['planType'];
  badge: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  displayedPrice: string | null;
  qualifier: string | null;
  sections: ProofPricingPlanSection[];
}

export interface ProofPricingPageData {
  slug: ProofSlug;
  record: NormalizedPricingRecord;
  audit: PricingAuditRecord;
  summary: Exclude<ReturnType<typeof getPricingAcceptanceResult>, null>;
  officialPricingUrl: string | null;
  plans: ProofPricingPlanView[];
}

const PROOF_RECORDS: Record<ProofSlug, NormalizedPricingRecord> = {
  'deepbrain-ai': deepbrainAiRecordData as NormalizedPricingRecord,
  'd-id': dIdRecordData as NormalizedPricingRecord,
  'steve-ai': steveAiRecordData as NormalizedPricingRecord,
};

const PROOF_AUDITS: Record<ProofSlug, PricingAuditRecord> = {
  'deepbrain-ai': deepbrainAiAuditData as PricingAuditRecord,
  'd-id': dIdAuditData as PricingAuditRecord,
  'steve-ai': steveAiAuditData as PricingAuditRecord,
};

function isProofSlug(slug: string): slug is ProofSlug {
  return slug === 'deepbrain-ai' || slug === 'd-id' || slug === 'steve-ai';
}

function normalizeQualifier(plan: NormalizedPricingPlan): string | null {
  if (plan.displayedQualifier) {
    return plan.displayedQualifier;
  }
  if (plan.billingQualifier) {
    return plan.billingQualifier;
  }
  return null;
}

function groupCoreBullets(bullets: NormalizedPlanBullet[]): ProofPricingPlanSection[] {
  const grouped = new Map<string, string[]>();

  for (const bullet of bullets) {
    const title = bullet.sectionTitle ?? 'Included';
    const existing = grouped.get(title) ?? [];
    if (!existing.includes(bullet.text)) {
      existing.push(bullet.text);
    }
    grouped.set(title, existing);
  }

  return Array.from(grouped.entries()).map(([title, sectionBullets]) => ({
    title: title === 'Included' ? null : title,
    bullets: sectionBullets,
  }));
}

function toPlanView(plan: NormalizedPricingPlan): ProofPricingPlanView {
  return {
    planId: plan.planId,
    name: plan.name,
    planType: plan.planType,
    badge: plan.badge,
    ctaText: plan.cta.text,
    ctaHref: plan.cta.href,
    displayedPrice: plan.displayedPrice,
    qualifier: normalizeQualifier(plan),
    sections: groupCoreBullets(plan.coreBullets ?? []),
  };
}

export function getProofPricingPageData(slug: string): ProofPricingPageData | null {
  if (shouldUseProductizedPricingPage(slug)) {
    return null;
  }

  if (!isProofSlug(slug)) {
    return null;
  }

  const record = PROOF_RECORDS[slug];
  const audit = PROOF_AUDITS[slug];
  const summary = getPricingAcceptanceResult(slug);

  if (!record || !audit || !summary) {
    return null;
  }

  return {
    slug,
    record,
    audit,
    summary,
    officialPricingUrl: record.sourceUrls[0] ?? null,
    plans: record.plans.map(toPlanView),
  };
}

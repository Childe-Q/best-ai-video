#!/usr/bin/env tsx

import * as path from 'path';
import type {
  NormalizedPricingPlan,
  NormalizedPricingRecord,
  RawPricingCaptureFile,
  RawPricingFact,
} from '../../src/lib/pricing/types';
import { resolveCoarseDisplayText } from '../../src/lib/pricing/types';
import {
  NORMALIZED_OUTPUT_DIR,
  RAW_OUTPUT_DIR,
  ensureOutputDirs,
  parseArgs,
  readJson,
  writeJson,
} from './shared';

type TrialProfile = (capture: RawPricingCaptureFile) => NormalizedPricingRecord;

function factsForPlan(facts: RawPricingFact[], planName: string): RawPricingFact[] {
  return facts.filter((fact) => fact.planName?.toLowerCase() === planName.toLowerCase());
}

function makePlan(name: string, facts: RawPricingFact[]): NormalizedPricingPlan {
  const priceFact = facts.find((fact) => fact.kind === 'price-point');
  const enterpriseFact = facts.find((fact) => fact.kind === 'enterprise');
  const planType =
    name.toLowerCase() === 'free'
      ? 'free'
      : enterpriseFact
        ? 'enterprise'
        : priceFact
          ? 'paid'
          : 'unknown';

  return {
    name,
    headlinePriceText: priceFact?.valueText || enterpriseFact?.valueText || null,
    billingQualifier:
      priceFact?.valueText.toLowerCase().includes('billed yearly') || priceFact?.valueText.toLowerCase().includes('billed annually')
        ? 'billed yearly'
        : priceFact?.unit === 'seat'
          ? 'per seat'
          : null,
    unit: priceFact?.unit || 'unknown',
    planType,
    sourceUrls: Array.from(new Set(facts.flatMap((fact) => fact.evidence.map((evidence) => evidence.sourceUrl)))),
    evidence: facts.map((fact) => fact.valueText),
  };
}

function buildHeygenRecord(capture: RawPricingCaptureFile): NormalizedPricingRecord {
  const plans = ['Free', 'Creator', 'Team', 'Enterprise'].map((planName) => makePlan(planName, factsForPlan(capture.facts, planName)));
  const record: NormalizedPricingRecord = {
    toolSlug: capture.toolSlug,
    capturedAt: capture.capturedAt,
    sourceUrls: capture.sourceUrls,
    governance: {
      origin: 'newly-captured',
      safeToShow: true,
      reviewRequired: true,
    },
    verification: 'verified',
    status: 'paid',
    coarseDisplayText: 'Paid plans available',
    hasFreePlan: true,
    hasFreeTrial: null,
    hasSelfServePaid: true,
    hasEnterprise: true,
    hasInteractivePricing: true,
    interactiveReasons: ['pricing page requires monthly/yearly toggle handling'],
    plans,
    verifiedStartingPrice: {
      amount: 29,
      currency: 'USD',
      cadence: 'month',
      displayText: 'Starts at $29/mo',
      safeToShow: true,
      reason: 'Official pricing page shows a self-serve Creator monthly price of $29/mo.',
    },
    notes: [
      'Captured from cached Playwright HTML plus official FAQ.',
      'Annual pricing is also present, but display-safe preview uses the explicit monthly Creator price.',
      'Review required because this run reused cached source captures rather than refreshing live HTML.',
    ],
  };
  record.coarseDisplayText = resolveCoarseDisplayText(record);
  return record;
}

function buildLumen5Record(capture: RawPricingCaptureFile): NormalizedPricingRecord {
  const plans = ['Free', 'Basic', 'Starter', 'Pro', 'Team'].map((planName) => makePlan(planName, factsForPlan(capture.facts, planName)));
  const record: NormalizedPricingRecord = {
    toolSlug: capture.toolSlug,
    capturedAt: capture.capturedAt,
    sourceUrls: capture.sourceUrls,
    governance: {
      origin: 'newly-captured',
      safeToShow: true,
      reviewRequired: true,
    },
    verification: 'verified',
    status: 'paid',
    coarseDisplayText: 'Paid plans available',
    hasFreePlan: true,
    hasFreeTrial: null,
    hasSelfServePaid: true,
    hasEnterprise: true,
    hasInteractivePricing: false,
    interactiveReasons: [],
    plans,
    verifiedStartingPrice: {
      amount: 19,
      currency: 'USD',
      cadence: 'month',
      displayText: 'Starts at $19/mo billed yearly',
      safeToShow: true,
      reason: 'Official pricing page explicitly lists the Basic plan at $19/month billed yearly.',
    },
    notes: [
      'Pricing page shows annual-billed monthly-equivalent prices for Basic, Starter, and Pro.',
      'Display-safe price keeps the billing qualifier instead of flattening it to ordinary monthly pricing.',
      'Review required because this run reused cached source captures rather than refreshing live HTML.',
    ],
  };
  record.coarseDisplayText = resolveCoarseDisplayText(record);
  return record;
}

function buildColossyanRecord(capture: RawPricingCaptureFile): NormalizedPricingRecord {
  const plans = ['Free', 'Starter', 'Business', 'Enterprise'].map((planName) => makePlan(planName, factsForPlan(capture.facts, planName)));
  const record: NormalizedPricingRecord = {
    toolSlug: capture.toolSlug,
    capturedAt: capture.capturedAt,
    sourceUrls: capture.sourceUrls,
    governance: {
      origin: 'newly-captured',
      safeToShow: false,
      reviewRequired: true,
    },
    verification: 'partial',
    status: 'paid',
    coarseDisplayText: 'Paid plans available',
    hasFreePlan: true,
    hasFreeTrial: true,
    hasSelfServePaid: true,
    hasEnterprise: true,
    hasInteractivePricing: true,
    interactiveReasons: [
      'pricing page contains monthly/annual toggles',
      'pricing page contains minute-based pricing calculator',
      'top-card prices use from-pricing language',
    ],
    plans,
    verifiedStartingPrice: {
      amount: null,
      currency: 'USD',
      cadence: 'month',
      displayText: null,
      safeToShow: false,
      reason: 'The page mixes from-pricing with annual toggles and interactive minute pricing, so exact price is not treated as display-safe in this trial.',
    },
    notes: [
      'Official pricing page exposes multiple self-serve prices, but they are tied to monthly/annual mode and interactive minute selectors.',
      'The capture is sufficient to confirm paid plans exist, but not stable enough for exact display in this conservative trial.',
      'Review required because this run reused cached source captures rather than refreshing live HTML.',
    ],
  };
  record.coarseDisplayText = resolveCoarseDisplayText(record);
  return record;
}

const TRIAL_PROFILES: Record<string, TrialProfile> = {
  heygen: buildHeygenRecord,
  lumen5: buildLumen5Record,
  colossyan: buildColossyanRecord,
};

export async function normalizeTool(slug: string): Promise<NormalizedPricingRecord> {
  ensureOutputDirs();
  const capturePath = path.join(RAW_OUTPUT_DIR, `${slug}.json`);
  const capture = readJson<RawPricingCaptureFile>(capturePath);
  const profile = TRIAL_PROFILES[slug];

  if (!profile) {
    throw new Error(`No trial normalization profile defined for ${slug}`);
  }

  const record = profile(capture);
  const outPath = path.join(NORMALIZED_OUTPUT_DIR, `${slug}.json`);
  writeJson(outPath, record);
  return record;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = String(args.slug || '');

  if (!slug) {
    throw new Error('Usage: tsx scripts/pricing/normalize-tool.ts --slug <slug>');
  }

  const record = await normalizeTool(slug);
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

#!/usr/bin/env tsx

import * as path from 'path';
import type { NormalizedPricingRecord, RawPricingCaptureFile } from '../../src/lib/pricing/types';
import {
  NORMALIZED_OUTPUT_DIR,
  RAW_OUTPUT_DIR,
  ensureOutputDirs,
  normalizeStateAwareCapture,
  parseArgs,
  readJson,
  writeJson,
} from './shared';

type NormalizeOverride = {
  verification?: NormalizedPricingRecord['verification'];
  notes?: string[];
};

const NORMALIZE_OVERRIDES: Record<string, NormalizeOverride> = {
  'deepbrain-ai': {
    verification: 'partial',
    notes: [
      'State-aware candidate generated from plan cards and billing states.',
      'Manual review should confirm whether the default visible state on the live page is monthly or annual at capture time.',
      'Current candidate depends on cache-fallback annual cards while the live default-visible monthly state did not yield stable plan cards.',
    ],
  },
  'd-id': {
    verification: 'verified',
    notes: [
      'Trial was preserved as trial-only and not normalized as a free plan.',
      'Lite remains classified as trial-like because the public card still inherits Trial language and should not seed the public start price without manual confirmation.',
      'Annual-billed qualifier is preserved whenever an annual state price point is selected.',
    ],
  },
  'steve-ai': {
    verification: 'partial',
    notes: [
      'Core plan prices were separated from upgrade and add-on pricing.',
      'Manual review should confirm which Steve AI plan family is the primary public pricing surface if the page changes.',
    ],
  },
};

export async function normalizeTool(slug: string): Promise<NormalizedPricingRecord> {
  ensureOutputDirs();
  const capturePath = path.join(RAW_OUTPUT_DIR, `${slug}.json`);
  const capture = readJson<RawPricingCaptureFile>(capturePath);
  const override = NORMALIZE_OVERRIDES[slug] || {};

  const record = normalizeStateAwareCapture(capture, {
    verification: override.verification,
    notes: override.notes,
  });

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

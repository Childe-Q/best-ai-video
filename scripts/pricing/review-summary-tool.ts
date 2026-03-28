#!/usr/bin/env tsx

import * as path from 'path';
import type { NormalizedPricingRecord } from '../../src/lib/pricing/types';
import {
  NORMALIZED_OUTPUT_DIR,
  REVIEW_OUTPUT_DIR,
  buildReviewSummaryMarkdown,
  buildReviewSummaryRecord,
  ensureOutputDirs,
  parseArgs,
  readJson,
  writeJson,
} from './shared';
import * as fs from 'fs';

export async function reviewSummaryTool(slug: string) {
  ensureOutputDirs();
  const normalizedPath = path.join(NORMALIZED_OUTPUT_DIR, `${slug}.json`);
  const record = readJson<NormalizedPricingRecord>(normalizedPath);
  const summary = buildReviewSummaryRecord(record);
  const jsonPath = path.join(REVIEW_OUTPUT_DIR, `${slug}.json`);
  const mdPath = path.join(REVIEW_OUTPUT_DIR, `${slug}.md`);
  writeJson(jsonPath, summary);
  fs.writeFileSync(mdPath, buildReviewSummaryMarkdown(summary), 'utf-8');
  return { summary, jsonPath, mdPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = String(args.slug || '');

  if (!slug) {
    throw new Error('Usage: tsx scripts/pricing/review-summary-tool.ts --slug <slug>');
  }

  const { summary } = await reviewSummaryTool(slug);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

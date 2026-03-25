#!/usr/bin/env tsx

import * as path from 'path';
import type { NormalizedPricingRecord } from '../../src/lib/pricing/types';
import {
  AUDIT_OUTPUT_DIR,
  NORMALIZED_OUTPUT_DIR,
  buildAuditRecord,
  ensureOutputDirs,
  parseArgs,
  readJson,
  writeJson,
} from './shared';

export async function auditTool(slug: string) {
  ensureOutputDirs();
  const normalizedPath = path.join(NORMALIZED_OUTPUT_DIR, `${slug}.json`);
  const record = readJson<NormalizedPricingRecord>(normalizedPath);
  const audit = buildAuditRecord(record);
  const outPath = path.join(AUDIT_OUTPUT_DIR, `${slug}.json`);
  writeJson(outPath, audit);
  return audit;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = String(args.slug || '');

  if (!slug) {
    throw new Error('Usage: tsx scripts/pricing/audit-tool.ts --slug <slug>');
  }

  const audit = await auditTool(slug);
  process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

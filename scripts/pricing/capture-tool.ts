#!/usr/bin/env tsx

import * as path from 'path';
import type {
  PricingSourceType,
  RawPricingCaptureFile,
  RawPricingCard,
  RawPricingFact,
  RawPricingState,
} from '../../src/lib/pricing/types';
import { captureDynamicSource } from './capture-dynamic';
import { captureStaticSource } from './capture-static';
import {
  RAW_OUTPUT_DIR,
  ensureOutputDirs,
  getToolSource,
  loadCachedPage,
  parseArgs,
  summarizeCapture,
  writeJson,
} from './shared';

function shouldUseDynamicFallback(sourceType: PricingSourceType, fallbackReasons: string[]): boolean {
  if (sourceType !== 'pricing') {
    return false;
  }
  return fallbackReasons.length > 0;
}

async function captureSource(
  slug: string,
  sourceType: PricingSourceType,
  useCache: boolean,
): Promise<{
  page: RawPricingCaptureFile['pages'][number];
  states: RawPricingState[];
  cards: RawPricingCard[];
  facts: RawPricingFact[];
}> {
  let staticResult;
  try {
    staticResult = await captureStaticSource(slug, sourceType, useCache);
  } catch (error) {
    const source = getToolSource(slug, sourceType);
    if (sourceType === 'pricing' && source?.mode === 'dynamic') {
      const reason = error instanceof Error ? error.message : String(error);
      return captureDynamicSource(slug, sourceType, useCache, ['static-fetch-failed', reason]);
    }
    throw error;
  }
  if (!shouldUseDynamicFallback(sourceType, staticResult.page.fallbackReasons)) {
    return staticResult;
  }

  return captureDynamicSource(slug, sourceType, useCache, staticResult.page.fallbackReasons);
}

export async function captureTool(slug: string, useCache: boolean): Promise<RawPricingCaptureFile> {
  ensureOutputDirs();

  const pages = [];
  const states: RawPricingState[] = [];
  const cards: RawPricingCard[] = [];
  const facts: RawPricingFact[] = [];
  const notes: string[] = [];

  for (const sourceType of ['pricing', 'faq'] as PricingSourceType[]) {
    const source = getToolSource(slug, sourceType);
    if (!source) continue;
    if (useCache && !loadCachedPage(slug, sourceType) && sourceType !== 'pricing') {
      notes.push(`Skipped ${sourceType}: no cached capture available for this trial run.`);
      continue;
    }
    try {
      const result = await captureSource(slug, sourceType, useCache);
      pages.push(result.page);
      states.push(...result.states);
      cards.push(...result.cards);
      facts.push(...result.facts);
      if (result.page.captureLayer === 'playwright' && result.page.fallbackReasons.length > 0) {
        notes.push(`${sourceType} upgraded to Playwright: ${result.page.fallbackReasons.join(', ')}`);
      }
    } catch (error) {
      if (sourceType === 'pricing') {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      notes.push(`Skipped ${sourceType}: ${message}`);
    }
  }

  if (pages.length === 0) {
    throw new Error(`No pricing-capable sources found for ${slug}`);
  }

  const capture = summarizeCapture(slug, pages, states, cards, facts, notes);
  const outPath = path.join(RAW_OUTPUT_DIR, `${slug}.json`);
  writeJson(outPath, capture);
  return capture;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = String(args.slug || '');
  const useCache = args['no-cache'] ? false : true;

  if (!slug) {
    throw new Error('Usage: tsx scripts/pricing/capture-tool.ts --slug <slug> [--no-cache]');
  }

  const capture = await captureTool(slug, useCache);
  process.stdout.write(`${JSON.stringify(capture, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

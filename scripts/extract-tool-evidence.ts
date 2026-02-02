#!/usr/bin/env node

/**
 * Extract Tool Evidence Script v2
 *
 * Generates evidence JSON from cached page snapshots.
 * Features: filtering, deduplication, theme remapping, source weighting
 *
 * Usage:
 *   pnpm exec tsx scripts/extract-tool-evidence.ts --slug invideo
 *   pnpm exec tsx scripts/extract-tool-evidence.ts --slug all
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadSnapshot, listSnapshots } from './cache';
import { extractNuggets, mergeNuggets } from '../src/lib/evidence/extractNuggets';
import { extractModelClaims, mergeModelClaims } from '../src/lib/evidence/extractModelClaims';
import { extractExamples } from '../src/lib/evidence/extractExamples';
import type { ToolEvidence, EvidenceNugget, EvidenceExample, ModelClaim, EvidenceTheme } from '../src/data/evidence/schema';

// ============================================================================
// Configuration
// ============================================================================

const EVIDENCE_DIR = path.join(__dirname, '../data/evidence');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// Source types that should trigger example extraction
const EXAMPLE_SOURCE_TYPES = ['examples', 'templates', 'showcase', 'gallery', 'demo'];

// Priority themes for coverage check
const PRIORITY_THEMES: EvidenceTheme[] = ['pricing', 'usage', 'export', 'licensing', 'security', 'models'];

// ============================================================================
// Utility Functions
// ============================================================================

function loadSources(): any[] {
  const sourcesFile = path.join(__dirname, '../src/data/sources/tools.sources.json');
  return JSON.parse(fs.readFileSync(sourcesFile, 'utf-8'));
}

function mapCacheTypeToSourceType(type: string): string {
  if (type.startsWith('examples')) return 'examples';
  return type;
}

function normalizeForDedupe(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getThemesCovered(nuggets: EvidenceNugget[]): EvidenceTheme[] {
  const themes = new Set<EvidenceTheme>();
  for (const nugget of nuggets) {
    themes.add(nugget.theme);
  }
  return Array.from(themes);
}

function checkQualityGate(
  nuggets: EvidenceNugget[],
  modelClaims: ModelClaim,
  examples: EvidenceExample[]
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check nuggets count
  if (nuggets.length < 10) {
    issues.push(`Only ${nuggets.length} nuggets (need >= 10)`);
  }
  if (nuggets.length > 30) {
    issues.push(`${nuggets.length} nuggets exceeds limit of 30`);
  }

  // Check theme coverage
  const themes = getThemesCovered(nuggets);
  const coveredPriority = PRIORITY_THEMES.filter(t => themes.includes(t));
  if (coveredPriority.length < 2) {
    issues.push(`Only ${coveredPriority.length} priority themes: ${coveredPriority.join(', ') || 'none'}`);
  }

  // Check model claims have sources
  if (modelClaims.models_supported && modelClaims.models_supported.length > 0) {
    if (modelClaims.sources.length === 0) {
      issues.push('Model claims found but no sources');
    }
  }

  // Check examples have required fields
  const validExamples = examples.filter(e => e.sourceUrl && e.snippet);
  if (validExamples.length < Math.min(2, examples.length)) {
    issues.push(`${validExamples.length}/${examples.length} examples have sourceUrl+snippet`);
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

// ============================================================================
// Main Evidence Generation
// ============================================================================

function generateEvidence(slug: string): ToolEvidence {
  console.log(`\n📊 Generating evidence for: ${slug}`);

  const snapshots = listSnapshots(slug);
  const sources = loadSources();
  const toolSource = (sources as any[]).find(s => s.slug === slug);

  let allNuggets: EvidenceNugget[] = [];
  let allExamples: EvidenceExample[] = [];
  let allModelClaims: ModelClaim[] = [];

  const sourceUrls: any = {};

  // Process all snapshots
  for (const snapshotInfo of snapshots) {
    const snapshot = loadSnapshot(slug, snapshotInfo.type, snapshotInfo.urlHash);
    if (!snapshot) continue;

    const { type } = snapshotInfo;
    const { text, rawHtml, sourceUrl, extractedTextLen } = snapshot;
    const sourceType = mapCacheTypeToSourceType(type);

    console.log(`  Processing ${type} (${extractedTextLen} chars)`);

    // Track source URLs
    if (sourceType === 'pricing') sourceUrls.pricing = sourceUrl;
    else if (sourceType === 'features') sourceUrls.features = sourceUrl;
    else if (sourceType === 'help') sourceUrls.help = sourceUrl;
    else if (sourceType === 'faq') sourceUrls.faq = sourceUrl;
    else if (sourceType === 'terms') sourceUrls.terms = sourceUrl;
    else if (sourceType === 'privacy') sourceUrls.privacy = sourceUrl;
    else if (sourceType === 'examples') {
      if (!sourceUrls.examples) sourceUrls.examples = [];
      sourceUrls.examples.push(sourceUrl);
    }

    // Extract nuggets
    const nuggets = extractNuggets(text, rawHtml, sourceUrl, sourceType);
    console.log(`    Extracted ${nuggets.length} nuggets`);
    allNuggets.push(...nuggets);

    // Extract examples from example pages
    if (EXAMPLE_SOURCE_TYPES.includes(sourceType)) {
      const examples = extractExamples(text, rawHtml, sourceUrl, {
        minExamples: 1,
        maxExamples: 3
      });
      console.log(`    Extracted ${examples.length} examples`);
      allExamples.push(...examples);
    }

    // Extract model claims
    const modelClaims = extractModelClaims(nuggets, text, rawHtml, sourceUrl);
    if (modelClaims.models_supported && modelClaims.models_supported.length > 0) {
      console.log(`    Found models: ${modelClaims.models_supported.join(', ')}`);
      allModelClaims.push(modelClaims);
    }
  }

  // Merge with deduplication and source weighting
  const { nuggets: mergedNuggets, specsLimits } = mergeNuggets(allNuggets, {
    maxTotal: 30,
    preferredThemes: PRIORITY_THEMES,
    sourceWeightThreshold: 80  // Only pricing(100)/help(90)/docs(85)/faq(80) for specsLimits
  });

  // Merge examples
  const seenExamples = new Set<string>();
  const mergedExamples = allExamples.filter(ex => {
    const key = normalizeForDedupe(ex.title + ex.sourceUrl);
    if (seenExamples.has(key)) return false;
    seenExamples.add(key);
    return true;
  }).slice(0, 5);

  // Merge model claims
  const mergedModelClaims = mergeModelClaims(allModelClaims);

  // If no models found, ensure modelClaims is properly empty
  if (!mergedModelClaims.models_supported || mergedModelClaims.models_supported.length === 0) {
    mergedModelClaims.models_supported = undefined;
    mergedModelClaims.sources = [];
  }

  // Calculate metadata
  const themes = getThemesCovered(mergedNuggets);
  const minConfidence = mergedNuggets.length > 0
    ? mergedNuggets.reduce((min, n) =>
        n.confidence === 'low' ? 'low' : (min === 'low' ? 'medium' : min), 'high' as 'high' | 'medium' | 'low')
    : 'low';

  const qualityCheck = checkQualityGate(mergedNuggets, mergedModelClaims, mergedExamples);

  console.log(`\n  Summary:`);
  console.log(`    - Nuggets: ${mergedNuggets.length}`);
  console.log(`    - SpecsLimits: ${specsLimits.length}`);
  console.log(`    - Examples: ${mergedExamples.length}`);
  console.log(`    - Models: ${mergedModelClaims.models_supported?.join(', ') || 'none'}`);
  console.log(`    - Themes: ${themes.join(', ') || 'none'}`);
  console.log(`    - Quality gate: ${qualityCheck.passed ? 'PASSED' : 'FAILED'}`);
  if (!qualityCheck.passed) {
    qualityCheck.issues.forEach(issue => console.log(`      ⚠ ${issue}`));
  }

  return {
    slug,
    lastUpdated: new Date().toISOString(),
    nuggets: mergedNuggets,
    examples: mergedExamples,
    modelClaims: mergedModelClaims.models_supported ? mergedModelClaims : { sources: [] },
    specsLimits: {
      nuggets: specsLimits
    },
    sources: sourceUrls,
    metadata: {
      totalNuggets: mergedNuggets.length,
      themesCovered: themes,
      hasModelClaims: !!(mergedModelClaims.models_supported && mergedModelClaims.models_supported.length > 0),
      hasExamples: mergedExamples.length > 0,
      minConfidence
    }
  };
}

function saveEvidence(evidence: ToolEvidence): void {
  const filePath = path.join(EVIDENCE_DIR, `${evidence.slug}.evidence.json`);
  fs.writeFileSync(filePath, JSON.stringify(evidence, null, 2), 'utf-8');
  console.log(`\n✅ Saved evidence to: ${filePath}`);
}

// ============================================================================
// Main
// ============================================================================

function parseArgs(): { slug: string; all: boolean } {
  const args = process.argv.slice(2);
  let slug: string | null = null;
  let all = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && i + 1 < args.length) {
      slug = args[i + 1];
      i++;
    } else if (args[i] === '--all') {
      all = true;
    }
  }

  if (!slug && !all) {
    console.error('Usage: tsx scripts/extract-tool-evidence.ts --slug <slug>');
    console.error('   or: tsx scripts/extract-tool-evidence.ts --all');
    process.exit(1);
  }

  return { slug: slug!, all };
}

async function main() {
  console.log('🎯 Extract Tool Evidence (v2 - Filtered & Weighted)\n');

  const { slug, all } = parseArgs();
  const sources = loadSources();
  const slugs = all
    ? (sources as any[]).map((s: any) => s.slug)
    : [slug];

  for (const toolSlug of slugs) {
    try {
      const snapshots = listSnapshots(toolSlug);
      if (snapshots.length === 0) {
        console.log(`\n⚠ No cached data for ${toolSlug}. Run fetch-and-cache first.`);
        continue;
      }

      const evidence = generateEvidence(toolSlug);
      saveEvidence(evidence);
    } catch (error: any) {
      console.error(`\n❌ Error processing ${toolSlug}: ${error.message}`);
    }
  }

  console.log('\n✨ Done!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

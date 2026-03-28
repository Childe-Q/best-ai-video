#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import {
  CAPABILITY_CATEGORIES,
  CLAIM_TYPES,
  CONFIDENCE_LEVELS,
  SOURCE_TYPES,
  SUPPORT_TYPES,
  type ProductIntelligenceRecord,
} from '../src/data/productIntelligence/schema';

const DATA_DIR = path.join(__dirname, '../data/product-intelligence/samples');

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string,
  issues: string[],
): void {
  if (!isString(value) || !allowed.includes(value)) {
    issues.push(`${label} must be one of: ${allowed.join(', ')}`);
  }
}

function validateUrl(value: unknown, label: string, issues: string[]): void {
  if (!isString(value)) {
    issues.push(`${label} must be a non-empty string`);
    return;
  }

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      issues.push(`${label} must use http/https`);
    }
  } catch {
    issues.push(`${label} must be a valid URL`);
  }
}

function validateBaseEvidenceItem(
  item: Record<string, unknown>,
  prefix: string,
  issues: string[],
): void {
  for (const key of ['rawLabel', 'normalizedLabel', 'value', 'evidenceText']) {
    if (!isString(item[key])) {
      issues.push(`${prefix}.${key} must be a non-empty string`);
    }
  }

  validateEnum(item.supportType, SUPPORT_TYPES, `${prefix}.supportType`, issues);
  validateEnum(item.claimType, CLAIM_TYPES, `${prefix}.claimType`, issues);
  validateEnum(item.confidence, CONFIDENCE_LEVELS, `${prefix}.confidence`, issues);
  validateUrl(item.sourceUrl, `${prefix}.sourceUrl`, issues);
}

function validateArray(
  record: Record<string, unknown>,
  key: keyof ProductIntelligenceRecord,
  issues: string[],
): Record<string, unknown>[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    issues.push(`${String(key)} must be an array`);
    return [];
  }

  const normalized = value.filter((item) => {
    if (!isRecord(item)) {
      issues.push(`${String(key)} must only contain objects`);
      return false;
    }
    return true;
  });

  return normalized;
}

function validateFile(filePath: string): { issues: string[]; summary: string } {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  const issues: string[] = [];

  if (!isRecord(raw)) {
    return { issues: ['root must be an object'], summary: path.basename(filePath) };
  }

  if (!isString(raw.toolSlug)) issues.push('toolSlug must be a non-empty string');

  if (!isRecord(raw.metadata)) {
    issues.push('metadata must be an object');
  } else {
    if (!isString(raw.metadata.collectedAt)) issues.push('metadata.collectedAt must be a string');
    if (!isString(raw.metadata.sampleTrack)) issues.push('metadata.sampleTrack must be a string');
    if (typeof raw.metadata.officialSourceCount !== 'number') {
      issues.push('metadata.officialSourceCount must be a number');
    }
    if (!Array.isArray(raw.metadata.sourceTypes)) {
      issues.push('metadata.sourceTypes must be an array');
    } else {
      raw.metadata.sourceTypes.forEach((item, index) => {
        validateEnum(item, SOURCE_TYPES, `metadata.sourceTypes[${index}]`, issues);
      });
    }
  }

  const sourceBlocks = validateArray(raw, 'sourceBlocks', issues);
  const sourceUrls = new Set<string>();

  sourceBlocks.forEach((block, index) => {
    const prefix = `sourceBlocks[${index}]`;
    if (!isString(block.id)) issues.push(`${prefix}.id must be a non-empty string`);
    if (!isString(block.title)) issues.push(`${prefix}.title must be a non-empty string`);
    validateEnum(block.sourceType, SOURCE_TYPES, `${prefix}.sourceType`, issues);
    validateUrl(block.url, `${prefix}.url`, issues);
    if (typeof block.priorityRank !== 'number') issues.push(`${prefix}.priorityRank must be a number`);
    if (!Array.isArray(block.coverage)) issues.push(`${prefix}.coverage must be an array`);
    if (isString(block.url)) sourceUrls.add(block.url);
  });

  if (sourceBlocks.length < 3) {
    issues.push('sourceBlocks must include at least 3 official pages for sample validation');
  }

  const capabilityFacts = validateArray(raw, 'capabilityFacts', issues);
  capabilityFacts.forEach((item, index) => {
    const prefix = `capabilityFacts[${index}]`;
    validateBaseEvidenceItem(item, prefix, issues);
    validateEnum(item.category, CAPABILITY_CATEGORIES, `${prefix}.category`, issues);
  });

  const modelSupportItems = validateArray(raw, 'modelSupportItems', issues);
  modelSupportItems.forEach((item, index) => {
    const prefix = `modelSupportItems[${index}]`;
    for (const key of ['rawName', 'normalizedName', 'provider', 'scope', 'evidenceText']) {
      if (!isString(item[key])) {
        issues.push(`${prefix}.${key} must be a non-empty string`);
      }
    }
    validateEnum(item.supportType, SUPPORT_TYPES, `${prefix}.supportType`, issues);
    validateEnum(item.claimType, CLAIM_TYPES, `${prefix}.claimType`, issues);
    validateEnum(item.confidence, CONFIDENCE_LEVELS, `${prefix}.confidence`, issues);
    validateUrl(item.sourceUrl, `${prefix}.sourceUrl`, issues);
  });

  for (const key of ['uniqueValueItems', 'differentiationItems', 'useCaseItems', 'userFitItems', 'rawEvidenceBlocks', 'unresolvedQuestions'] as const) {
    const items = validateArray(raw, key, issues);
    items.forEach((item, index) => {
      const prefix = `${key}[${index}]`;

      if (key === 'uniqueValueItems') {
        for (const field of ['theme', 'summary', 'evidenceText']) {
          if (!isString(item[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        }
        validateEnum(item.claimType, CLAIM_TYPES, `${prefix}.claimType`, issues);
        validateEnum(item.confidence, CONFIDENCE_LEVELS, `${prefix}.confidence`, issues);
        validateUrl(item.sourceUrl, `${prefix}.sourceUrl`, issues);
        return;
      }

      if (key === 'differentiationItems') {
        for (const field of ['dimension', 'positioning', 'evidenceText']) {
          if (!isString(item[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        }
        validateEnum(item.claimType, CLAIM_TYPES, `${prefix}.claimType`, issues);
        validateEnum(item.confidence, CONFIDENCE_LEVELS, `${prefix}.confidence`, issues);
        validateUrl(item.sourceUrl, `${prefix}.sourceUrl`, issues);
        return;
      }

      if (key === 'useCaseItems') {
        for (const field of ['useCase', 'audience', 'fit', 'evidenceText']) {
          if (!isString(item[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        }
        validateEnum(item.claimType, CLAIM_TYPES, `${prefix}.claimType`, issues);
        validateEnum(item.confidence, CONFIDENCE_LEVELS, `${prefix}.confidence`, issues);
        validateUrl(item.sourceUrl, `${prefix}.sourceUrl`, issues);
        return;
      }

      if (key === 'userFitItems') {
        for (const field of ['segment', 'fit', 'rationale', 'evidenceText']) {
          if (!isString(item[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        }
        validateEnum(item.claimType, CLAIM_TYPES, `${prefix}.claimType`, issues);
        validateEnum(item.confidence, CONFIDENCE_LEVELS, `${prefix}.confidence`, issues);
        validateUrl(item.sourceUrl, `${prefix}.sourceUrl`, issues);
        return;
      }

      if (key === 'rawEvidenceBlocks') {
        for (const field of ['topic', 'evidenceText']) {
          if (!isString(item[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        }
        validateEnum(item.sourceType, SOURCE_TYPES, `${prefix}.sourceType`, issues);
        validateEnum(item.claimType, CLAIM_TYPES, `${prefix}.claimType`, issues);
        validateEnum(item.confidence, CONFIDENCE_LEVELS, `${prefix}.confidence`, issues);
        validateUrl(item.sourceUrl, `${prefix}.sourceUrl`, issues);
        return;
      }

      if (key === 'unresolvedQuestions') {
        for (const field of ['question', 'reason', 'status']) {
          if (!isString(item[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        }
        if (!Array.isArray(item.recommendedSourceTypes)) {
          issues.push(`${prefix}.recommendedSourceTypes must be an array`);
        } else {
          item.recommendedSourceTypes.forEach((sourceType, sourceIndex) => {
            validateEnum(
              sourceType,
              SOURCE_TYPES,
              `${prefix}.recommendedSourceTypes[${sourceIndex}]`,
              issues,
            );
          });
        }
      }
    });
  }

  for (const key of ['collaborationItems', 'developerItems', 'commercialItems', 'limitationItems'] as const) {
    const items = validateArray(raw, key, issues);
    items.forEach((item, index) => {
      validateBaseEvidenceItem(item, `${key}[${index}]`, issues);
      if (!isString(item.category)) {
        issues.push(`${key}[${index}].category must be a non-empty string`);
      }
    });
  }

  const allEvidenceArrays = [
    capabilityFacts,
    modelSupportItems,
    validateArray(raw, 'uniqueValueItems', []),
    validateArray(raw, 'differentiationItems', []),
    validateArray(raw, 'collaborationItems', []),
    validateArray(raw, 'developerItems', []),
    validateArray(raw, 'commercialItems', []),
    validateArray(raw, 'limitationItems', []),
    validateArray(raw, 'useCaseItems', []),
    validateArray(raw, 'userFitItems', []),
    validateArray(raw, 'rawEvidenceBlocks', []),
  ].flat();

  allEvidenceArrays.forEach((item, index) => {
    if (!isRecord(item)) return;
    const sourceUrl = item.sourceUrl;
    if (isString(sourceUrl) && !sourceUrls.has(sourceUrl)) {
      issues.push(`evidence item ${index} references sourceUrl not present in sourceBlocks: ${sourceUrl}`);
    }
  });

  const summary = [
    raw.toolSlug,
    `${sourceBlocks.length} sources`,
    `${capabilityFacts.length} capability facts`,
    `${modelSupportItems.length} model items`,
  ].join(' | ');

  return { issues, summary };
}

function main(): void {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Missing data directory: ${DATA_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DATA_DIR).filter((file) => file.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error(`No sample files found in ${DATA_DIR}`);
    process.exit(1);
  }

  let hasIssues = false;

  files.forEach((file) => {
    const filePath = path.join(DATA_DIR, file);
    const { issues, summary } = validateFile(filePath);
    console.log(`\n${summary}`);
    if (issues.length === 0) {
      console.log('  OK');
      return;
    }

    hasIssues = true;
    issues.forEach((issue) => console.log(`  - ${issue}`));
  });

  if (hasIssues) {
    process.exit(1);
  }

  console.log(`\nValidated ${files.length} product intelligence samples.`);
}

main();

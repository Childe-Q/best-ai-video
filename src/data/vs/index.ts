import fs from 'node:fs';
import path from 'node:path';
import { flikiVsHeygen } from '@/data/vs/fliki-vs-heygen';
import { getAllTools, getTool } from '@/lib/getTool';
import { Tool } from '@/types/tool';
import { VsComparison, VsDiffRow, VsSide } from '@/types/vs';

const DEV_LOG = process.env.NODE_ENV === 'development';

const canonicalComparisons: VsComparison[] = [flikiVsHeygen];

const canonicalBySlug = new Map<string, VsComparison>(
  canonicalComparisons.map((comparison) => [`${comparison.slugA}-vs-${comparison.slugB}`, comparison]),
);

const SLUG_ALIAS_MAP: Record<string, string> = {
  invideoai: 'invideo',
  'invideo-ai': 'invideo',
  veed: 'veed-io',
  veedio: 'veed-io',
  elai: 'elai-io',
  'elaiio': 'elai-io',
  'elai-io-ai': 'elai-io',
  heygenai: 'heygen',
  'hey-gen': 'heygen',
  synthesiaai: 'synthesia',
  flikiai: 'fliki',
  zebracatai: 'zebracat',
  runwayml: 'runway',
  'runway-ml': 'runway',
};

export type ParsedVsSlug = {
  slugA: string;
  slugB: string;
};

export type VsLoadStatus = 'FULL' | 'PARTIAL' | 'MISSING';

export type VsLoadResult = {
  status: VsLoadStatus;
  comparison: VsComparison | null;
  reason?: string;
  errors?: string[];
  indexHit?: boolean;
  hitSource?: 'canonical' | 'legacy' | 'none';
  schemaErrorSummary?: string[];
  source?: 'canonical' | 'legacy-adapter' | 'none';
  normalizedSlug?: string;
  parsed?: ParsedVsSlug | null;
};

function logDebug(message: string, payload?: Record<string, unknown>) {
  if (!DEV_LOG) return;
  if (payload) {
    console.info(`[vs-loader] ${message}`, payload);
    return;
  }
  console.info(`[vs-loader] ${message}`);
}

function summarizeErrors(errors?: string[]): string[] {
  return (errors ?? []).slice(0, 3);
}

function finalizeVsResult(result: VsLoadResult, debug: boolean): VsLoadResult {
  const hitSource =
    result.hitSource ??
    (result.source === 'canonical' ? 'canonical' : result.source === 'legacy-adapter' ? 'legacy' : 'none');

  const finalResult: VsLoadResult = {
    ...result,
    hitSource,
    indexHit: result.indexHit ?? hitSource !== 'none',
    schemaErrorSummary: result.schemaErrorSummary ?? summarizeErrors(result.errors),
  };

  if (debug) {
    logDebug('resolution', {
      normalizedSlug: finalResult.normalizedSlug ?? null,
      indexHit: finalResult.indexHit ?? false,
      hitSource: finalResult.hitSource ?? 'none',
      schemaErrorSummary: finalResult.schemaErrorSummary ?? [],
      status: finalResult.status,
      reason: finalResult.reason ?? null,
    });
  }

  return finalResult;
}

function normalizeSlugPart(rawValue: string): string {
  const normalized = decodeURIComponent(rawValue || '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return SLUG_ALIAS_MAP[normalized] ?? normalized;
}

export function parseVsSlug(slug: string): ParsedVsSlug | null {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const cleaned = decodeURIComponent(slug)
    .trim()
    .replace(/^\/+/, '')
    .replace(/^vs\//i, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');

  const match = cleaned.match(/^(.+?)-?vs-?(.+)$/);
  if (!match) {
    return null;
  }

  const slugA = normalizeSlugPart(match[1] || '');
  const slugB = normalizeSlugPart(match[2] || '');
  if (!slugA || !slugB) {
    return null;
  }

  return { slugA, slugB };
}

export function toVsSlug(slugA: string, slugB: string): string {
  return `${normalizeSlugPart(slugA)}-vs-${normalizeSlugPart(slugB)}`;
}

export function normalizeVsSlug(slug: string): string | null {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;
  return toVsSlug(parsed.slugA, parsed.slugB);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractVsSlugFromHref(href?: string): string | null {
  if (!href) return null;
  const normalized = href.trim();
  if (!normalized.startsWith('/vs/')) return null;
  const slug = normalized.replace('/vs/', '').replace(/^\/+|\/+$/g, '');
  return slug || null;
}

function getInferredSlugsFromToolContent(): string[] {
  const allTools = getAllTools();
  const inferred: string[] = [];

  for (const tool of allTools) {
    const useCases = tool.content?.overview?.useCases ?? [];
    for (const useCase of useCases) {
      const extracted = extractVsSlugFromHref(useCase.linkHref);
      if (extracted) {
        const parsed = parseVsSlug(extracted);
        if (parsed) {
          inferred.push(toVsSlug(parsed.slugA, parsed.slugB));
        }
      }
    }

    const alternatives = tool.content?.alternatives?.topAlternatives ?? [];
    for (const item of alternatives) {
      const extracted = extractVsSlugFromHref(item.linkHref);
      if (extracted) {
        const parsed = parseVsSlug(extracted);
        if (parsed) {
          inferred.push(toVsSlug(parsed.slugA, parsed.slugB));
        }
      }
    }
  }

  return dedupe(inferred);
}

function getInferredSlugsFromContentDirectory(): string[] {
  const inferred: string[] = [];
  const contentToolsDir = path.join(process.cwd(), 'content', 'tools');

  try {
    if (!fs.existsSync(contentToolsDir)) {
      return [];
    }

    const files = fs.readdirSync(contentToolsDir).filter((file) => file.endsWith('.json'));
    for (const fileName of files) {
      try {
        const filePath = path.join(contentToolsDir, fileName);
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
          overview?: {
            useCases?: Array<{ linkHref?: string }>;
          };
          alternatives?: {
            topAlternatives?: Array<{ linkHref?: string }>;
          };
          content?: {
            overview?: {
              useCases?: Array<{ linkHref?: string }>;
            };
            alternatives?: {
              topAlternatives?: Array<{ linkHref?: string }>;
            };
          };
        };

        const useCases = raw.content?.overview?.useCases ?? raw.overview?.useCases ?? [];
        for (const useCase of useCases) {
          const extracted = extractVsSlugFromHref(useCase.linkHref);
          if (!extracted) continue;
          const parsed = parseVsSlug(extracted);
          if (parsed) {
            inferred.push(toVsSlug(parsed.slugA, parsed.slugB));
          }
        }

        const alternatives = raw.content?.alternatives?.topAlternatives ?? raw.alternatives?.topAlternatives ?? [];
        for (const item of alternatives) {
          const extracted = extractVsSlugFromHref(item.linkHref);
          if (!extracted) continue;
          const parsed = parseVsSlug(extracted);
          if (parsed) {
            inferred.push(toVsSlug(parsed.slugA, parsed.slugB));
          }
        }
      } catch (error) {
        if (DEV_LOG) {
          console.error('[vs-loader] failed to parse content/tools json for inferred vs slugs', {
            fileName,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  } catch (error) {
    if (DEV_LOG) {
      console.error('[vs-loader] failed to scan content/tools for inferred vs slugs', {
        contentToolsDir,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return dedupe(inferred);
}

type VsDiscoveryCache = {
  slugsFromFiles: string[];
  tsOnlySlugs: Set<string>;
  tsComparisonsBySlug: Map<string, VsComparison>;
  tsErrorsBySlug: Map<string, string[]>;
  tsRawBySlug: Map<string, unknown>;
  jsonComparisonsBySlug: Map<string, VsComparison>;
  jsonErrorsBySlug: Map<string, string[]>;
  jsonRawBySlug: Map<string, unknown>;
};

let discoveryCache: VsDiscoveryCache | null = null;

function getVsDataDirectories(): string[] {
  const dirs = [
    path.join(process.cwd(), 'src', 'data', 'vs'),
    path.join(process.cwd(), 'data', 'vs'),
  ];

  return dirs.filter((dirPath) => fs.existsSync(dirPath));
}

type TsVsParseResult = {
  raw: unknown | null;
  comparison: VsComparison | null;
  reason?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function parseSide(value: unknown, fallback: VsSide): VsSide {
  return value === 'a' || value === 'b' ? value : fallback;
}

function parseDiffRows(value: unknown): VsDiffRow[] {
  if (!Array.isArray(value)) return [];
  const rows: VsDiffRow[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = asString(item.label);
    const a = asString(item.a);
    const b = asString(item.b);
    if (!label || !a || !b) continue;
    const sourceUrl = asString(item.sourceUrl);
    rows.push({ label, a, b, ...(sourceUrl ? { sourceUrl } : {}) });
  }

  return rows;
}

function normalizeRelatedPath(value: string, kind: 'tool' | 'alternative' | 'comparison'): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;

  if (kind === 'comparison') {
    const parsed = parseVsSlug(trimmed);
    if (!parsed) return '';
    return `/vs/${toVsSlug(parsed.slugA, parsed.slugB)}`;
  }

  const slug = normalizeSlugPart(trimmed.replace(/^tool\//, '').replace(/\/alternatives$/, ''));
  if (!slug) return '';
  return kind === 'alternative' ? `/tool/${slug}/alternatives` : `/tool/${slug}`;
}

function deriveFileDataSlugs(fileSlug: string, raw: unknown): string[] {
  const slugs = new Set<string>([fileSlug]);
  if (isRecord(raw)) {
    const rawSlugA = asString(raw.slugA);
    const rawSlugB = asString(raw.slugB);
    if (rawSlugA && rawSlugB) {
      slugs.add(toVsSlug(rawSlugA, rawSlugB));
    }
  }
  return Array.from(slugs);
}

function extractObjectLiteralAt(source: string, startIndex: number): string | null {
  let depth = 0;
  let mode: 'code' | 'single' | 'double' | 'template' | 'line-comment' | 'block-comment' = 'code';
  let escaped = false;
  let templateExprDepth = 0;

  for (let i = startIndex; i < source.length; i += 1) {
    const current = source[i];
    const next = source[i + 1];

    if (mode === 'line-comment') {
      if (current === '\n') mode = 'code';
      continue;
    }

    if (mode === 'block-comment') {
      if (current === '*' && next === '/') {
        mode = 'code';
        i += 1;
      }
      continue;
    }

    if (mode === 'single') {
      if (!escaped && current === "'") mode = 'code';
      escaped = !escaped && current === '\\';
      continue;
    }

    if (mode === 'double') {
      if (!escaped && current === '"') mode = 'code';
      escaped = !escaped && current === '\\';
      continue;
    }

    if (mode === 'template') {
      if (!escaped && current === '`' && templateExprDepth === 0) {
        mode = 'code';
        continue;
      }
      if (!escaped && current === '$' && next === '{') {
        templateExprDepth += 1;
        i += 1;
        continue;
      }
      if (!escaped && current === '}' && templateExprDepth > 0) {
        templateExprDepth -= 1;
        continue;
      }
      escaped = !escaped && current === '\\';
      continue;
    }

    if (current === '/' && next === '/') {
      mode = 'line-comment';
      i += 1;
      continue;
    }
    if (current === '/' && next === '*') {
      mode = 'block-comment';
      i += 1;
      continue;
    }
    if (current === "'") {
      mode = 'single';
      escaped = false;
      continue;
    }
    if (current === '"') {
      mode = 'double';
      escaped = false;
      continue;
    }
    if (current === '`') {
      mode = 'template';
      escaped = false;
      templateExprDepth = 0;
      continue;
    }

    if (current === '{') {
      depth += 1;
      continue;
    }

    if (current === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

function extractVsObjectLiteral(source: string): string | null {
  const exportDefaultIndex = source.search(/export\s+default\s+/);
  if (exportDefaultIndex >= 0) {
    const start = source.indexOf('{', exportDefaultIndex);
    if (start >= 0) {
      return extractObjectLiteralAt(source, start);
    }
  }

  const assignmentMatch = source.match(/=\s*{/);
  if (assignmentMatch?.index !== undefined) {
    const start = assignmentMatch.index + assignmentMatch[0].indexOf('{');
    if (start >= 0) {
      return extractObjectLiteralAt(source, start);
    }
  }

  return null;
}

function parseTsVsComparisonFile(filePath: string): TsVsParseResult {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const objectLiteral = extractVsObjectLiteral(source);
    if (!objectLiteral) {
      return {
        raw: null,
        comparison: null,
        reason: 'Unable to extract object literal from TS file.',
      };
    }

    const raw = new Function(`return (${objectLiteral});`)();
    if (!isRecord(raw)) {
      return {
        raw,
        comparison: null,
        reason: 'Extracted TS object is not a plain object.',
      };
    }

    return {
      raw,
      comparison: raw as VsComparison,
    };
  } catch (error) {
    return {
      raw: null,
      comparison: null,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function discoverVsDataFiles(): VsDiscoveryCache {
  if (discoveryCache) {
    return discoveryCache;
  }

  const jsonComparisonsBySlug = new Map<string, VsComparison>();
  const tsComparisonsBySlug = new Map<string, VsComparison>();
  const tsErrorsBySlug = new Map<string, string[]>();
  const tsRawBySlug = new Map<string, unknown>();
  const tsOnlySlugs = new Set<string>();
  const jsonErrorsBySlug = new Map<string, string[]>();
  const jsonRawBySlug = new Map<string, unknown>();
  const slugsFromFiles: string[] = [];
  const dataDirs = getVsDataDirectories();

  try {
    if (dataDirs.length === 0) {
      discoveryCache = {
        slugsFromFiles: [],
        tsOnlySlugs,
        tsComparisonsBySlug,
        tsErrorsBySlug,
        tsRawBySlug,
        jsonComparisonsBySlug,
        jsonErrorsBySlug,
        jsonRawBySlug,
      };
      return discoveryCache;
    }

    for (const dataDir of dataDirs) {
      const files = fs.readdirSync(dataDir);
      for (const fileName of files) {
        if (fileName === 'index.ts') continue;

        const match = fileName.match(/^(.+)\.(ts|json)$/i);
        if (!match) continue;

        const baseName = match[1];
        const ext = match[2].toLowerCase();
        const parsed = parseVsSlug(baseName);
        if (!parsed) continue;

        const slug = toVsSlug(parsed.slugA, parsed.slugB);
        slugsFromFiles.push(slug);

        if (ext === 'json') {
          try {
            const filePath = path.join(dataDir, fileName);
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
            const comparison = isRecord(raw) ? (raw as VsComparison) : null;
            const errors = comparison ? validateVsComparison(comparison) : ['JSON file root must be an object.'];
            const candidateSlugs = deriveFileDataSlugs(slug, raw);
            for (const candidateSlug of candidateSlugs) {
              jsonRawBySlug.set(candidateSlug, raw);
            }

            if (errors.length === 0) {
              for (const candidateSlug of candidateSlugs) {
                jsonComparisonsBySlug.set(candidateSlug, comparison as VsComparison);
              }
            } else if (DEV_LOG) {
              console.error('[vs-loader] schema validation failed (json file)', {
                fileName,
                dataDir,
                errors,
              });
            }

            if (errors.length > 0) {
              for (const candidateSlug of candidateSlugs) {
                jsonErrorsBySlug.set(candidateSlug, errors);
              }
            }
          } catch (error) {
            if (DEV_LOG) {
              console.error('[vs-loader] failed to parse json vs file', {
                fileName,
                dataDir,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        } else if (!canonicalBySlug.has(slug)) {
          const filePath = path.join(dataDir, fileName);
          const tsParse = parseTsVsComparisonFile(filePath);

          const candidateSlugs = deriveFileDataSlugs(slug, tsParse.raw);
          if (tsParse.raw !== null) {
            for (const candidateSlug of candidateSlugs) {
              tsRawBySlug.set(candidateSlug, tsParse.raw);
            }
          }

          if (tsParse.comparison) {
            const schemaErrors = validateVsComparison(tsParse.comparison);
            if (schemaErrors.length === 0) {
              for (const candidateSlug of candidateSlugs) {
                tsComparisonsBySlug.set(candidateSlug, tsParse.comparison);
              }
            } else {
              for (const candidateSlug of candidateSlugs) {
                tsErrorsBySlug.set(candidateSlug, schemaErrors);
              }
            }
          } else {
            for (const candidateSlug of candidateSlugs) {
              tsErrorsBySlug.set(candidateSlug, [tsParse.reason ?? 'Unknown TS parse error.']);
            }
            tsOnlySlugs.add(slug);
          }
        }
      }
    }
  } catch (error) {
    if (DEV_LOG) {
      console.error('[vs-loader] failed to discover vs data files', {
        dataDirs,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  discoveryCache = {
    slugsFromFiles: dedupe(slugsFromFiles).sort(),
    tsOnlySlugs,
    tsComparisonsBySlug,
    tsErrorsBySlug,
    tsRawBySlug,
    jsonComparisonsBySlug,
    jsonErrorsBySlug,
    jsonRawBySlug,
  };

  return discoveryCache;
}

function getSeedVsSlugs(): string[] {
  const discovery = discoverVsDataFiles();
  const canonicalSlugs = Array.from(canonicalBySlug.keys());
  const inferredSlugs = getInferredSlugsFromToolContent();
  const inferredFromContentFiles = getInferredSlugsFromContentDirectory();
  const discoveredFileSlugs = discovery.slugsFromFiles;

  return dedupe([...canonicalSlugs, ...inferredSlugs, ...inferredFromContentFiles, ...discoveredFileSlugs])
    .filter((slug) => {
      const parsed = parseVsSlug(slug);
      if (!parsed) return false;
      const swapped = toVsSlug(parsed.slugB, parsed.slugA);

      if (canonicalBySlug.has(slug) || canonicalBySlug.has(swapped)) return true;
      if (discovery.jsonComparisonsBySlug.has(slug) || discovery.jsonComparisonsBySlug.has(swapped)) return true;
      if (discovery.tsComparisonsBySlug.has(slug) || discovery.tsComparisonsBySlug.has(swapped)) return true;
      if (discovery.jsonErrorsBySlug.has(slug) || discovery.jsonErrorsBySlug.has(swapped)) return true;
      if (discovery.tsErrorsBySlug.has(slug) || discovery.tsErrorsBySlug.has(swapped)) return true;

      return Boolean(getTool(parsed.slugA) && getTool(parsed.slugB));
    })
    .sort();
}

function validateVsComparison(data: VsComparison): string[] {
  const errors: string[] = [];

  if (!data.slugA || !data.slugB) errors.push('Missing slugA/slugB.');
  if (!data.updatedAt) errors.push('Missing updatedAt.');
  if (!data.pricingCheckedAt) errors.push('Missing pricingCheckedAt.');

  if (!data.shortAnswer?.a || !data.shortAnswer?.b) {
    errors.push('Missing shortAnswer.a/shortAnswer.b.');
  }

  if (!Array.isArray(data.matrixRows) || data.matrixRows.length === 0) {
    errors.push('matrixRows must contain at least 1 row.');
  }

  if (!data.verdict?.recommendation) {
    errors.push('Missing verdict.recommendation.');
  }

  if (!data.related?.toolPages || data.related.toolPages.length < 2) {
    errors.push('related.toolPages must contain at least 2 links.');
  }

  if (!data.related?.alternatives || data.related.alternatives.length < 2) {
    errors.push('related.alternatives must contain at least 2 links.');
  }

  if (!data.related?.comparisons || data.related.comparisons.length < 1) {
    errors.push('related.comparisons must contain at least 1 link.');
  }

  return errors;
}

function getMapValue<T>(map: Map<string, T>, slug: string, swappedSlug: string): T | undefined {
  return map.get(slug) ?? map.get(swappedSlug);
}

function adaptComparisonFromRaw(raw: unknown, parsed: ParsedVsSlug): VsComparison | null {
  const legacy = buildLegacyComparison(parsed).comparison;
  if (!legacy) return null;
  if (!isRecord(raw)) return legacy;

  const normalizedSlugA = normalizeSlugPart(asString(raw.slugA) ?? parsed.slugA);
  const normalizedSlugB = normalizeSlugPart(asString(raw.slugB) ?? parsed.slugB);

  const shortAnswer = isRecord(raw.shortAnswer) ? raw.shortAnswer : null;
  const bestFor = isRecord(raw.bestFor) ? raw.bestFor : null;
  const notFor = isRecord(raw.notFor) ? raw.notFor : null;
  const score = isRecord(raw.score) ? raw.score : null;
  const scoreA = score && isRecord(score.a) ? score.a : null;
  const scoreB = score && isRecord(score.b) ? score.b : null;
  const verdict = isRecord(raw.verdict) ? raw.verdict : null;
  const related = isRecord(raw.related) ? raw.related : null;
  const promptBox = isRecord(raw.promptBox) ? raw.promptBox : null;

  const scoreFields = ['pricingValue', 'ease', 'speed', 'output', 'customization'];
  const mergedScoreA: Record<string, number> = { ...legacy.score.a };
  const mergedScoreB: Record<string, number> = { ...legacy.score.b };
  for (const field of scoreFields) {
    if (typeof scoreA?.[field] === 'number') mergedScoreA[field] = scoreA[field] as number;
    if (typeof scoreB?.[field] === 'number') mergedScoreB[field] = scoreB[field] as number;
  }

  const merged: VsComparison = {
    ...legacy,
    slugA: normalizedSlugA,
    slugB: normalizedSlugB,
    updatedAt: asString(raw.updatedAt) ?? legacy.updatedAt,
    pricingCheckedAt: asString(raw.pricingCheckedAt) ?? legacy.pricingCheckedAt,
    shortAnswer: {
      a: asString(shortAnswer?.a) ?? legacy.shortAnswer.a,
      b: asString(shortAnswer?.b) ?? legacy.shortAnswer.b,
    },
    bestFor: {
      a: chooseTopItems(asStringArray(bestFor?.a), legacy.bestFor.a),
      b: chooseTopItems(asStringArray(bestFor?.b), legacy.bestFor.b),
    },
    notFor: {
      a: chooseTopItems(asStringArray(notFor?.a), legacy.notFor.a),
      b: chooseTopItems(asStringArray(notFor?.b), legacy.notFor.b),
    },
    keyDiffs: parseDiffRows(raw.keyDiffs).length > 0 ? parseDiffRows(raw.keyDiffs) : legacy.keyDiffs,
    matrixRows: parseDiffRows(raw.matrixRows).length > 0 ? parseDiffRows(raw.matrixRows) : legacy.matrixRows,
    score: {
      methodNote: asString(score?.methodNote) ?? legacy.score.methodNote,
      weights: isRecord(score?.weights)
        ? Object.fromEntries(
            Object.entries(score.weights).filter(([, value]) => typeof value === 'number') as Array<[string, number]>,
          )
        : legacy.score.weights,
      a: mergedScoreA,
      b: mergedScoreB,
    },
    promptBox: {
      prompt: asString(promptBox?.prompt) ?? legacy.promptBox.prompt,
      settings: chooseTopItems(asStringArray(promptBox?.settings), legacy.promptBox.settings),
    },
    verdict: {
      winnerPrice: parseSide(verdict?.winnerPrice, legacy.verdict.winnerPrice),
      winnerQuality: parseSide(verdict?.winnerQuality, legacy.verdict.winnerQuality),
      winnerSpeed: parseSide(verdict?.winnerSpeed, legacy.verdict.winnerSpeed),
      recommendation: asString(verdict?.recommendation) ?? legacy.verdict.recommendation,
    },
    related: {
      toolPages: chooseTopItems(
        asStringArray(related?.toolPages).map((item) => normalizeRelatedPath(item, 'tool')).filter(Boolean),
        legacy.related.toolPages,
      ),
      alternatives: chooseTopItems(
        asStringArray(related?.alternatives)
          .map((item) => normalizeRelatedPath(item, 'alternative'))
          .filter(Boolean),
        legacy.related.alternatives,
      ),
      comparisons: dedupe([
        ...asStringArray(related?.comparisons)
          .map((item) => normalizeRelatedPath(item, 'comparison'))
          .filter(Boolean),
        ...legacy.related.comparisons,
      ]).slice(0, 6),
    },
    disclosure: asString(raw.disclosure) ?? legacy.disclosure,
  };

  return merged;
}

function parsePriceValue(startingPrice: string): number {
  const match = startingPrice.match(/(\d+(\.\d+)?)/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number.parseFloat(match[1]);
}

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(10, score));
}

function withOneDecimal(score: number): number {
  return Number(clampScore(score).toFixed(1));
}

function deriveScoreFromTool(tool: Tool) {
  const price = parsePriceValue(tool.starting_price || '');
  const priceScore =
    Number.isFinite(price)
      ? price <= 10
        ? 9.5
        : price <= 20
          ? 8.5
          : price <= 30
            ? 7.5
            : price <= 50
              ? 6.5
              : 5.5
      : 6;

  const speedSignal = `${tool.pros.join(' ')} ${tool.cons.join(' ')}`.toLowerCase();
  const speedHeuristic = speedSignal.includes('slow') ? 6.3 : speedSignal.includes('fast') ? 8.6 : 7.4;

  const featureText = tool.features.join(' ').toLowerCase();
  const customizationHeuristic =
    6.5 +
    (featureText.includes('template') ? 0.8 : 0) +
    (featureText.includes('custom') ? 1.0 : 0) +
    (featureText.includes('api') ? 0.8 : 0);

  return {
    pricingValue: withOneDecimal(tool.price_score ?? priceScore),
    ease: withOneDecimal(tool.ease_of_use_score ?? (tool.rating * 1.8)),
    speed: withOneDecimal(tool.speed_score ?? speedHeuristic),
    output: withOneDecimal(tool.output_quality_score ?? (tool.rating * 2)),
    customization: withOneDecimal(customizationHeuristic),
  };
}

function chooseTopItems(values: string[], fallback: string[]): string[] {
  const cleaned = values
    .map((value) => value.trim())
    .filter(Boolean);
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 3);
  }

  return dedupe([...cleaned, ...fallback]).slice(0, 3);
}

function findRelatedComparisonSlugs(slugA: string, slugB: string): string[] {
  const current = toVsSlug(slugA, slugB);
  const seeds = getSeedVsSlugs();
  const fromSeeds = seeds.filter(
    (slug) =>
      slug !== current &&
      (slug.startsWith(`${slugA}-vs-`) ||
        slug.endsWith(`-vs-${slugA}`) ||
        slug.startsWith(`${slugB}-vs-`) ||
        slug.endsWith(`-vs-${slugB}`)),
  );

  const related = dedupe(fromSeeds);
  if (related.length >= 4) {
    return related.slice(0, 4).map((slug) => `/vs/${slug}`);
  }

  const toolA = getTool(slugA);
  const toolB = getTool(slugB);
  const allTools = getAllTools().filter((tool) => tool.slug !== slugA && tool.slug !== slugB);

  const tagPool = dedupe([...(toolA?.tags ?? []), ...(toolB?.tags ?? [])]).map((tag) => tag.toLowerCase());
  const scored = allTools.map((tool) => {
    const overlap = tool.tags.filter((tag) => tagPool.includes(tag.toLowerCase())).length;
    return { slug: tool.slug, overlap };
  });

  scored
    .sort((left, right) => right.overlap - left.overlap)
    .slice(0, 8)
    .forEach((item) => {
      related.push(toVsSlug(slugA, item.slug));
      related.push(toVsSlug(slugB, item.slug));
    });

  return dedupe(related)
    .filter((slug) => slug !== current)
    .slice(0, 4)
    .map((slug) => `/vs/${slug}`);
}

function buildLegacyComparison(parsed: ParsedVsSlug): { comparison: VsComparison | null; reason?: string } {
  const toolA = getTool(parsed.slugA);
  const toolB = getTool(parsed.slugB);
  if (!toolA || !toolB) {
    return {
      comparison: null,
      reason: `Legacy adapter missing tool data: toolA=${Boolean(toolA)} toolB=${Boolean(toolB)}.`,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const scoreA = deriveScoreFromTool(toolA);
  const scoreB = deriveScoreFromTool(toolB);

  const priceA = parsePriceValue(toolA.starting_price || '');
  const priceB = parsePriceValue(toolB.starting_price || '');

  const comparison: VsComparison = {
    slugA: parsed.slugA,
    slugB: parsed.slugB,
    updatedAt: today,
    pricingCheckedAt: today,
    shortAnswer: {
      a: `Choose ${toolA.name} when your priority is ${toolA.best_for.toLowerCase()}.`,
      b: `Choose ${toolB.name} when your priority is ${toolB.best_for.toLowerCase()}.`,
    },
    bestFor: {
      a: chooseTopItems(toolA.pros, [toolA.best_for, ...(toolA.tags ?? [])]),
      b: chooseTopItems(toolB.pros, [toolB.best_for, ...(toolB.tags ?? [])]),
    },
    notFor: {
      a: chooseTopItems(toolA.cons, ['Advanced manual editing-centric workflows', 'Strict enterprise governance', 'Ultra-high customization needs']),
      b: chooseTopItems(toolB.cons, ['Advanced manual editing-centric workflows', 'Strict enterprise governance', 'Ultra-high customization needs']),
    },
    keyDiffs: [
      {
        label: 'Positioning',
        a: toolA.best_for,
        b: toolB.best_for,
      },
      {
        label: 'Starting price',
        a: toolA.starting_price,
        b: toolB.starting_price,
      },
      {
        label: 'Core workflow',
        a: toolA.tagline,
        b: toolB.tagline,
      },
      {
        label: 'Free trial / free plan',
        a: toolA.has_free_trial ? 'Available' : 'Not clearly listed',
        b: toolB.has_free_trial ? 'Available' : 'Not clearly listed',
      },
    ],
    matrixRows: [
      { label: 'Best for', a: toolA.best_for, b: toolB.best_for },
      { label: 'Output type', a: toolA.tagline, b: toolB.tagline },
      {
        label: 'Workflow speed',
        a: `${scoreA.speed.toFixed(1)}/10 (dataset)`,
        b: `${scoreB.speed.toFixed(1)}/10 (dataset)`,
      },
      {
        label: 'Languages & dubbing',
        a: toolA.features.find((item) => /language|dubb|voice/i.test(item)) ?? 'See product docs',
        b: toolB.features.find((item) => /language|dubb|voice/i.test(item)) ?? 'See product docs',
      },
      {
        label: 'Templates',
        a: toolA.features.find((item) => /template/i.test(item)) ?? 'Template support not explicitly listed',
        b: toolB.features.find((item) => /template/i.test(item)) ?? 'Template support not explicitly listed',
      },
      {
        label: 'API',
        a: toolA.features.find((item) => /api/i.test(item)) ?? 'API availability depends on plan',
        b: toolB.features.find((item) => /api/i.test(item)) ?? 'API availability depends on plan',
      },
      { label: 'Pricing starting point', a: toolA.starting_price, b: toolB.starting_price },
      {
        label: 'Free plan',
        a: toolA.pricing_model.toLowerCase().includes('free') ? 'Yes (check limits)' : 'Not clearly listed',
        b: toolB.pricing_model.toLowerCase().includes('free') ? 'Yes (check limits)' : 'Not clearly listed',
      },
      {
        label: 'Ease of use',
        a: `${scoreA.ease.toFixed(1)}/10`,
        b: `${scoreB.ease.toFixed(1)}/10`,
      },
      {
        label: 'Output quality',
        a: `${scoreA.output.toFixed(1)}/10`,
        b: `${scoreB.output.toFixed(1)}/10`,
      },
    ],
    score: {
      methodNote:
        'Score computed from pricingValue (25%), ease (20%), speed (20%), output (20%), and customization (15%), using structured tool attributes when direct row-level data is limited.',
      weights: {
        pricingValue: 25,
        ease: 20,
        speed: 20,
        output: 20,
        customization: 15,
      },
      a: scoreA,
      b: scoreB,
    },
    promptBox: {
      prompt:
        'Create a 45-second product update video for a B2B SaaS launch. Include one hook, three key benefits, and one CTA with on-screen captions.',
      settings: ['Duration: 45s', 'Format: 16:9', 'Language: English', 'Output: MP4 1080p', 'Tone: professional'],
    },
    verdict: {
      winnerPrice: priceA <= priceB ? 'a' : 'b',
      winnerQuality: scoreA.output >= scoreB.output ? 'a' : 'b',
      winnerSpeed: scoreA.speed >= scoreB.speed ? 'a' : 'b',
      recommendation: `Use ${toolA.name} if ${toolA.best_for.toLowerCase()}. Use ${toolB.name} if ${toolB.best_for.toLowerCase()}.`,
    },
    related: {
      toolPages: [`/tool/${parsed.slugA}`, `/tool/${parsed.slugB}`],
      alternatives: [`/tool/${parsed.slugA}/alternatives`, `/tool/${parsed.slugB}/alternatives`],
      comparisons: findRelatedComparisonSlugs(parsed.slugA, parsed.slugB),
    },
    disclosure:
      'This VS page is assembled from structured product data with ongoing source linking. For scoring rules and source policy, see /methodology.',
  };

  return { comparison };
}

function resolveVsComparison(slug: string, options?: { debug?: boolean }): VsLoadResult {
  const debug = options?.debug ?? false;
  const parsed = parseVsSlug(slug);
  const discovery = discoverVsDataFiles();
  const availableSlugs = getSeedVsSlugs();
  const slugSample = availableSlugs.slice(0, 20);

  if (debug) {
    logDebug('slug requested', { slugRequested: slug });
    logDebug('available slugs', { count: availableSlugs.length, sample: slugSample });
  }

  if (!parsed) {
    if (debug) {
      logDebug('entry hit', { hit: false, reason: 'slug parse failed' });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      reason: 'Slug parse failed. Expected format: {a}-vs-{b}.',
      errors: ['Slug parse failed. Expected format: {a}-vs-{b}.'],
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      parsed: null,
    }, debug);
  }

  const normalizedSlug = toVsSlug(parsed.slugA, parsed.slugB);
  const swappedSlug = toVsSlug(parsed.slugB, parsed.slugA);
  const isSeeded = availableSlugs.includes(normalizedSlug) || availableSlugs.includes(swappedSlug);
  const fromCanonical = getMapValue(canonicalBySlug, normalizedSlug, swappedSlug);
  if (fromCanonical) {
    const errors = validateVsComparison(fromCanonical);
    if (errors.length === 0) {
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'registered canonical data' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: fromCanonical,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }

    if (debug) {
      console.error('[vs-loader] schema validation failed (canonical)', {
        normalizedSlug,
        errors,
      });
    }

    const adaptedComparison = adaptComparisonFromRaw(fromCanonical, parsed) ?? buildLegacyComparison(parsed).comparison;
    if (adaptedComparison) {
      const adaptedErrors = validateVsComparison(adaptedComparison);
      if (adaptedErrors.length === 0) {
        return finalizeVsResult({
          status: 'PARTIAL',
          comparison: adaptedComparison,
          source: 'legacy-adapter',
          indexHit: true,
          hitSource: 'legacy',
          normalizedSlug,
          reason: `Canonical schema invalid. Adapter fallback applied: ${errors.join(' | ')}`,
          errors,
          parsed,
        }, debug);
      }
      return finalizeVsResult({
        status: 'PARTIAL',
        comparison: adaptedComparison,
        source: 'legacy-adapter',
        indexHit: true,
        hitSource: 'legacy',
        normalizedSlug,
        reason: `Canonical + adapter schema invalid: ${[...errors, ...adaptedErrors].join(' | ')}`,
        errors: [...errors, ...adaptedErrors],
        parsed,
      }, debug);
    }
  }

  const fromJson = getMapValue(discovery.jsonComparisonsBySlug, normalizedSlug, swappedSlug);
  if (fromJson) {
    const errors = validateVsComparison(fromJson);
    if (errors.length === 0) {
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'json file loaded' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: fromJson,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const fromTs = getMapValue(discovery.tsComparisonsBySlug, normalizedSlug, swappedSlug);
  if (fromTs) {
    const errors = validateVsComparison(fromTs);
    if (errors.length === 0) {
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'ts file auto-loaded' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: fromTs,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const jsonSchemaErrors = getMapValue(discovery.jsonErrorsBySlug, normalizedSlug, swappedSlug);
  const tsSchemaErrors = getMapValue(discovery.tsErrorsBySlug, normalizedSlug, swappedSlug);
  const schemaErrors = dedupe([...(jsonSchemaErrors ?? []), ...(tsSchemaErrors ?? [])]);

  if (schemaErrors.length > 0) {
    const rawFromFile =
      getMapValue(discovery.jsonRawBySlug, normalizedSlug, swappedSlug) ??
      getMapValue(discovery.tsRawBySlug, normalizedSlug, swappedSlug);

    if (debug) {
      console.error('[vs-loader] schema validation failed (file discovered)', {
        normalizedSlug,
        errors: schemaErrors,
      });
    }

    const adaptedComparison = adaptComparisonFromRaw(rawFromFile, parsed) ?? buildLegacyComparison(parsed).comparison;
    if (adaptedComparison) {
      const adaptedErrors = validateVsComparison(adaptedComparison);
      if (adaptedErrors.length === 0) {
        return finalizeVsResult({
          status: 'PARTIAL',
          comparison: adaptedComparison,
          source: 'legacy-adapter',
          indexHit: true,
          hitSource: 'legacy',
          normalizedSlug,
          reason: `VS file exists but schema is invalid. Adapter fallback applied: ${schemaErrors.join(' | ')}`,
          errors: schemaErrors,
          parsed,
        }, debug);
      }

      return finalizeVsResult({
        status: 'PARTIAL',
        comparison: adaptedComparison,
        source: 'legacy-adapter',
        indexHit: true,
        hitSource: 'legacy',
        normalizedSlug,
        reason: `VS file schema invalid and adapter still has gaps: ${[...schemaErrors, ...adaptedErrors].join(' | ')}`,
        errors: [...schemaErrors, ...adaptedErrors],
        parsed,
      }, debug);
    }

    return finalizeVsResult({
      status: 'PARTIAL',
      comparison: null,
      source: 'none',
      indexHit: true,
      hitSource: 'none',
      normalizedSlug,
      reason: `VS file schema invalid and adapter unavailable: ${schemaErrors.join(' | ')}`,
      errors: schemaErrors,
      parsed,
    }, debug);
  }

  if (!isSeeded) {
    if (debug) {
      logDebug('entry hit', {
        hit: false,
        source: 'none',
        normalizedSlug,
        reason: 'Slug not in indexed VS data set.',
      });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      normalizedSlug,
      reason: 'Slug not in indexed VS data set.',
      errors: ['Slug not in indexed VS data set.'],
      parsed,
    }, debug);
  }

  const tsFileExistsButUnregistered =
    discovery.tsOnlySlugs.has(normalizedSlug) || discovery.tsOnlySlugs.has(swappedSlug);
  if (debug && tsFileExistsButUnregistered) {
    console.error('[vs-loader] ts file detected but not registered in canonical imports', {
      normalizedSlug,
      hint: 'Add file export to src/data/vs/index.ts canonicalComparisons or provide .json file for auto-load.',
    });
  }

  const adapted = buildLegacyComparison(parsed);
  if (!adapted.comparison) {
    if (debug) {
      logDebug('entry hit', {
        hit: false,
        source: 'none',
        normalizedSlug,
        reason: adapted.reason ?? 'No canonical entry and no adapter data.',
      });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      normalizedSlug,
      reason: adapted.reason ?? 'No canonical entry and no adapter data.',
      errors: [adapted.reason ?? 'No canonical entry and no adapter data.'],
      parsed,
    }, debug);
  }

  const adapterErrors = validateVsComparison(adapted.comparison);
  if (adapterErrors.length > 0) {
    if (debug) {
      console.error('[vs-loader] schema validation failed (adapter)', {
        normalizedSlug,
        errors: adapterErrors,
      });
    }
    return finalizeVsResult({
      status: 'PARTIAL',
      comparison: null,
      source: 'none',
      indexHit: true,
      hitSource: 'none',
      normalizedSlug,
      reason: `Adapter schema invalid: ${adapterErrors.join(' | ')}`,
      errors: adapterErrors,
      parsed,
    }, debug);
  }

  return finalizeVsResult({
    status: 'PARTIAL',
    comparison: adapted.comparison,
    source: 'legacy-adapter',
    indexHit: true,
    hitSource: 'legacy',
    normalizedSlug,
    reason: 'No dedicated VS dataset found. Rendered with legacy adapter.',
    parsed,
  }, debug);
}

export function listVsSlugs(): string[] {
  return getSeedVsSlugs();
}

export function getVsComparisonWithStatus(slug: string): VsLoadResult {
  return resolveVsComparison(slug, { debug: DEV_LOG });
}

export function getVsComparison(slug: string): VsComparison | null {
  const result = resolveVsComparison(slug, { debug: DEV_LOG });
  return result.comparison;
}

export function getAllVsComparisons(): VsComparison[] {
  return listVsSlugs()
    .map((slug) => resolveVsComparison(slug, { debug: false }).comparison)
    .filter((comparison): comparison is VsComparison => Boolean(comparison));
}

// Backward-compatible alias for existing imports.
export function getVsComparisonBySlug(slug: string): VsComparison | undefined {
  return getVsComparison(slug) ?? undefined;
}

import {
  canonicalSlug,
  getSupplementalVsGenerationReport,
  getVsComparisonWithStatus,
  listRawVsSlugs,
  listVsDuplicateRedirects,
  listVsSlugs,
  parseVsSlug,
} from '@/data/vs';
import { buildDecisionTableRowEntries, countPlaceholderCells, hasDecisionRow } from '@/lib/vsDecisionTable';
import { computeKeyDiffUniquenessScore } from '@/lib/vsDifferentiation';
import { getFeaturedVsCards, getGroupedVsCards, listVsIndexCards } from '@/lib/vsIndex';
import { getDecisionRowLabelsForIntent, VS_INTENT_OVERRIDES } from '@/lib/vsIntent';
import { resolveRowSourcesForTools } from '@/lib/vsToolSources';
import { VsDiffRow } from '@/types/vs';

type AuditRow = {
  label: string;
  hasSource: boolean;
};

type AuditPage = {
  slug: string;
  title: string;
  status: string;
  missingDecisionRows: string[];
  missingKeyDiffs: string[];
  pricingRowVerified: boolean;
  freePlanStrict: boolean;
  apiStrict: boolean;
  placeholderCells: number;
  ambiguityPoints: number;
  keydiffUniquenessScore: number;
};

function hasVerifiedSource(row: { sources?: { a?: string[]; b?: string[] } }): boolean {
  return Boolean((row.sources?.a?.length ?? 0) > 0 || (row.sources?.b?.length ?? 0) > 0);
}

function getDecisionEntries(slug: string) {
  const load = getVsComparisonWithStatus(slug);
  const comparison = load.comparison;
  if (!comparison) return [];
  const preferredRows = getDecisionRowLabelsForIntent(comparison.intentProfile);
  return buildDecisionTableRowEntries(
    comparison.matrixRows,
    comparison.slugA,
    comparison.slugB,
    preferredRows.length > 0 ? preferredRows : undefined,
  );
}

function auditDecisionRows(slug: string): AuditRow[] {
  return getDecisionEntries(slug)
    .filter((row) => !row.hidden)
    .map((row) => ({
      label: row.label,
      hasSource: hasVerifiedSource(row),
    }));
}

function auditKeyDiffs(rows: VsDiffRow[], slugA: string, slugB: string): AuditRow[] {
  return rows.map((row) => ({
    label: row.label,
    hasSource: hasVerifiedSource({ sources: resolveRowSourcesForTools(row, slugA, slugB) }),
  }));
}

function tokenizeText(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
}

function getTextSimilarity(left: string, right: string): number {
  const a = tokenizeText(left);
  const b = tokenizeText(right);
  if (a.size === 0 || b.size === 0) return 1;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size || 1;
  return intersection / union;
}

function getKeyDiffContrastBonus(rows: VsDiffRow[]): number {
  const strongContrastRows = rows.filter((row) => getTextSimilarity(row.a, row.b) <= 0.45).length;
  if (strongContrastRows >= 3) return 2;
  if (strongContrastRows >= 2) return 1;
  return 0;
}

function isFreePlanStrict(entries: ReturnType<typeof getDecisionEntries>): boolean {
  if (!hasDecisionRow(entries, 'Free plan')) return true;
  const row = entries.find((item) => item.label === 'Free plan' && !item.hidden);
  return Boolean(row && ['Free plan', 'Free trial'].includes(row.aText) && ['Free plan', 'Free trial'].includes(row.bText));
}

function isApiStrict(entries: ReturnType<typeof getDecisionEntries>): boolean {
  if (!hasDecisionRow(entries, 'API')) return true;
  const row = entries.find((item) => item.label === 'API' && !item.hidden);
  return Boolean(
    row &&
      ['Public API', 'Enterprise / API on request'].includes(row.aText) &&
      ['Public API', 'Enterprise / API on request'].includes(row.bText),
  );
}

function getAmbiguityPoints(
  entries: ReturnType<typeof getDecisionEntries>,
  placeholderCells: number,
  keydiffUniquenessScore: number,
  keyDiffContrastBonus: number,
): number {
  const hiddenLabels = new Set(entries.filter((row) => row.hidden).map((row) => row.label));
  const base =
    placeholderCells * 2 +
    (hiddenLabels.has('Workflow speed') ? 3 : 0) +
    (hiddenLabels.has('Templates') ? 2 : 0) +
    (hiddenLabels.has('Languages & dubbing') ? 2 : 0) +
    (hiddenLabels.has('API') ? 1 : 0) +
    (hiddenLabels.has('Free plan') ? 1 : 0);
  const uniquenessBonus = keydiffUniquenessScore <= 0.45 ? 3 : keydiffUniquenessScore <= 0.65 ? 2 : keydiffUniquenessScore <= 0.8 ? 1 : 0;
  return Math.max(0, base - uniquenessBonus - keyDiffContrastBonus);
}

export function buildVsAuditReport(): string {
  const keydiffCorpus = listVsSlugs().map((slug) => {
    const comparison = getVsComparisonWithStatus(slug).comparison;
    return {
      slug,
      rows: comparison?.keyDiffs ?? [],
    };
  });

  const pages: AuditPage[] = listVsSlugs().map((slug) => {
    const load = getVsComparisonWithStatus(slug);
    const comparison = load.comparison;
    const parsed = comparison ? { slugA: comparison.slugA, slugB: comparison.slugB } : parseVsSlug(slug);
    const title = parsed ? `${parsed.slugA} vs ${parsed.slugB}` : slug;
    const decisionRows = auditDecisionRows(slug);
    const decisionEntries = getDecisionEntries(slug);
    const visibleRows = decisionEntries.filter((row) => !row.hidden);
    const keyDiffs = comparison ? auditKeyDiffs(comparison.keyDiffs, comparison.slugA, comparison.slugB) : [];
    const placeholderCells = countPlaceholderCells(visibleRows);
    const keydiffUniquenessScore = comparison
      ? computeKeyDiffUniquenessScore(slug, comparison.keyDiffs, keydiffCorpus)
      : 0;
    const keyDiffContrastBonus = comparison ? getKeyDiffContrastBonus(comparison.keyDiffs) : 0;

    return {
      slug,
      title,
      status: load.status,
      missingDecisionRows: decisionRows.filter((row) => !row.hasSource).map((row) => row.label),
      missingKeyDiffs: keyDiffs.filter((row) => !row.hasSource).map((row) => row.label),
      pricingRowVerified: decisionRows.some((row) => row.label === 'Pricing starting point' && row.hasSource),
      freePlanStrict: isFreePlanStrict(decisionEntries),
      apiStrict: isApiStrict(decisionEntries),
      placeholderCells,
      ambiguityPoints: getAmbiguityPoints(decisionEntries, placeholderCells, keydiffUniquenessScore, keyDiffContrastBonus),
      keydiffUniquenessScore,
    };
  });

  const pagesWithGaps = pages.filter((page) => page.missingDecisionRows.length > 0 || page.missingKeyDiffs.length > 0);
  const totalDecisionGaps = pages.reduce((total, page) => total + page.missingDecisionRows.length, 0);
  const totalKeyDiffGaps = pages.reduce((total, page) => total + page.missingKeyDiffs.length, 0);
  const pricingRowVerifiedCount = pages.filter((page) => page.pricingRowVerified).length;
  const freePlanStrictCount = pages.filter((page) => page.freePlanStrict).length;
  const apiStrictCount = pages.filter((page) => page.apiStrict).length;
  const placeholderCellsRemaining = pages.reduce((total, page) => total + page.placeholderCells, 0);
  const outlierOverridesApplied = Object.keys(VS_INTENT_OVERRIDES).filter((slug) => {
    const comparison = getVsComparisonWithStatus(slug).comparison;
    return comparison?.intentProfile?.primary === VS_INTENT_OVERRIDES[slug];
  }).length;
  const avatarPages = pages.filter((page) => getVsComparisonWithStatus(page.slug).comparison?.intentProfile?.primary === 'avatar');
  const avatarGroupAvgUniqueness =
    avatarPages.length > 0
      ? Number((avatarPages.reduce((total, page) => total + page.keydiffUniquenessScore, 0) / avatarPages.length).toFixed(2))
      : 0;
  const avatarGroupMaxAmbiguity =
    avatarPages.length > 0 ? Math.max(...avatarPages.map((page) => page.ambiguityPoints)) : 0;
  const topRiskPages = [...pages]
    .sort((left, right) => right.ambiguityPoints - left.ambiguityPoints || left.slug.localeCompare(right.slug))
    .slice(0, 10);

  const lines: string[] = [
    '# VS Sources Audit',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Summary',
    '',
    `- Pages audited: ${pages.length}`,
    `- Pages with missing verified sources: ${pagesWithGaps.length}`,
    `- Decision rows missing verified sources: ${totalDecisionGaps}`,
    `- Key differences missing verified sources: ${totalKeyDiffGaps}`,
    `- pricing_row_verified_coverage: ${pricingRowVerifiedCount}/${pages.length}`,
    `- free_plan_row_strict_coverage: ${freePlanStrictCount}/${pages.length}`,
    `- api_row_strict_coverage: ${apiStrictCount}/${pages.length}`,
    `- placeholder_cells_remaining: ${placeholderCellsRemaining}`,
    `- outlier_overrides_applied: ${outlierOverridesApplied}/${Object.keys(VS_INTENT_OVERRIDES).length}`,
    '',
    '## Avatar group',
    '',
    `- avatar_group_pages: ${avatarPages.length}`,
    `- avatar_group_avg_uniqueness: ${avatarGroupAvgUniqueness}`,
    `- avatar_group_max_ambiguity: ${avatarGroupMaxAmbiguity}`,
    '',
    '## Top risk pages after strict pass',
    '',
  ];

  if (topRiskPages.every((page) => page.ambiguityPoints === 0)) {
    lines.push('- None');
  } else {
    for (const page of topRiskPages) {
      if (page.ambiguityPoints <= 0) continue;
      lines.push(
        `- /vs/${page.slug}: ambiguity_points=${page.ambiguityPoints}, placeholder_cells=${page.placeholderCells}, keydiff_uniqueness_score=${page.keydiffUniquenessScore}`,
      );
    }
  }

  lines.push('', '## Pages with missing verified sources', '');

  if (pagesWithGaps.length === 0) {
    lines.push('- None');
  } else {
    for (const page of pagesWithGaps) {
      lines.push(`### /vs/${page.slug}`);
      lines.push('');
      lines.push(`- Status: ${page.status}`);
      lines.push(`- Missing decision rows: ${page.missingDecisionRows.length > 0 ? page.missingDecisionRows.join(', ') : 'None'}`);
      lines.push(`- Missing key differences: ${page.missingKeyDiffs.length > 0 ? page.missingKeyDiffs.join(', ') : 'None'}`);
      lines.push('');
    }
  }

  lines.push('## Per-page row coverage', '');
  for (const page of pages) {
    lines.push(`### /vs/${page.slug}`);
    lines.push('');
    lines.push(`- Decision rows missing sources: ${page.missingDecisionRows.length > 0 ? page.missingDecisionRows.join(', ') : 'None'}`);
    lines.push(`- Key differences missing sources: ${page.missingKeyDiffs.length > 0 ? page.missingKeyDiffs.join(', ') : 'None'}`);
    lines.push(`- Pricing row verified: ${page.pricingRowVerified ? 'Yes' : 'No'}`);
    lines.push(`- Free plan strict: ${page.freePlanStrict ? 'Yes' : 'No'}`);
    lines.push(`- API strict: ${page.apiStrict ? 'Yes' : 'No'}`);
    lines.push(`- Placeholder cells remaining: ${page.placeholderCells}`);
    lines.push(`- keydiff_uniqueness_score: ${page.keydiffUniquenessScore}`);
    lines.push(`- Ambiguity points: ${page.ambiguityPoints}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function buildVsMatrixReport(): string {
  const rawSlugs = listRawVsSlugs();
  const canonicalSlugs = listVsSlugs();
  const duplicates = listVsDuplicateRedirects();
  const supplemental = getSupplementalVsGenerationReport();
  const afterReport = buildVsAuditReport();
  const pricingCoverageMatch = afterReport.match(/pricing_row_verified_coverage:\s+([0-9]+\/[0-9]+)/);
  const pricingCoverage = pricingCoverageMatch?.[1] ?? 'unknown';

  const lines: string[] = [
    '# VS Matrix Report',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Summary',
    '',
    `- Total pages before dedupe: ${rawSlugs.length}`,
    `- Total pages after dedupe: ${canonicalSlugs.length}`,
    `- Duplicate redirects: ${duplicates.length}`,
    `- Added canonical comparisons: ${supplemental.added.length}`,
    `- Skipped candidates: ${supplemental.skipped.length}`,
    `- pricing_row_verified_coverage: ${pricingCoverage}`,
    '',
    '## Existing canonical pairs',
    '',
    ...canonicalSlugs.map((slug) => `- ${slug}`),
    '',
    '## Duplicate mappings',
    '',
  ];

  if (duplicates.length === 0) {
    lines.push('- None', '');
  } else {
    for (const duplicate of duplicates) {
      lines.push(`- ${duplicate.from} -> ${duplicate.to}`);
    }
    lines.push('');
  }

  lines.push('## Added comparisons', '');
  if (supplemental.added.length === 0) {
    lines.push('- None', '');
  } else {
    for (const slug of supplemental.added) {
      lines.push(`- ${slug}`);
    }
    lines.push('');
  }

  lines.push('## Skipped candidates', '');
  if (supplemental.skipped.length === 0) {
    lines.push('- None', '');
  } else {
    for (const item of supplemental.skipped) {
      lines.push(`- ${item.slug}: ${item.reason}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

type CanonicalPairAudit = {
  canonical: string;
  seenSlugs: string[];
  indexHasCanonical: boolean;
  indexHasNonCanonical: boolean;
};

export function buildVsCanonicalConsistencyReport(): string {
  const rawSlugs = listRawVsSlugs();
  const displaySlugs = listVsSlugs();
  const displaySet = new Set(displaySlugs);
  const rawPairMap = new Map<string, CanonicalPairAudit>();
  const parseErrors: string[] = [];

  for (const slug of rawSlugs) {
    const parsed = parseVsSlug(slug);
    if (!parsed) {
      parseErrors.push(slug);
      continue;
    }

    const canonical = canonicalSlug(parsed.slugA, parsed.slugB);
    const existing = rawPairMap.get(canonical) ?? {
      canonical,
      seenSlugs: [],
      indexHasCanonical: false,
      indexHasNonCanonical: false,
    };
    existing.seenSlugs.push(slug);
    if (displaySet.has(canonical)) {
      existing.indexHasCanonical = true;
    }
    if (slug !== canonical && displaySet.has(slug)) {
      existing.indexHasNonCanonical = true;
    }
    rawPairMap.set(canonical, existing);
  }

  const rawPairs = Array.from(rawPairMap.values()).sort((left, right) => left.canonical.localeCompare(right.canonical));
  const finalPairs = displaySlugs.map((slug) => ({
    canonical: slug,
    seenSlugs: rawPairMap.get(slug)?.seenSlugs ?? [slug],
    indexHasCanonical: true,
    indexHasNonCanonical: false,
  }));
  const missingCanonicalInIndex = rawPairs.filter((pair) => !pair.indexHasCanonical);
  const bothDirectionsInIndex = rawPairs.filter((pair) => pair.indexHasCanonical && pair.indexHasNonCanonical);
  const wrongRedirectRisk = rawPairs.filter((pair) => pair.seenSlugs.some((slug) => slug !== pair.canonical));
  const redirects = listVsDuplicateRedirects();

  const lines: string[] = [
    '# VS Canonical Consistency',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Summary',
    '',
    `- Raw source pair count: ${rawPairs.length}`,
    `- Final canonical pair count: ${finalPairs.length}`,
    `- Raw slug count: ${rawSlugs.length}`,
    `- Canonical display count: ${displaySlugs.length}`,
    `- Parse errors: ${parseErrors.length}`,
    `- missingCanonicalInIndex: ${missingCanonicalInIndex.length}`,
    `- bothDirectionsInIndex: ${bothDirectionsInIndex.length}`,
    `- wrongRedirectRisk: ${wrongRedirectRisk.length}`,
    `- redirect mappings: ${redirects.length}`,
    '',
    '## Pre-fix findings',
    '',
  ];

  lines.push(`- missingCanonicalInIndex: ${missingCanonicalInIndex.length > 0 ? missingCanonicalInIndex.map((pair) => pair.canonical).join(', ') : 'None'}`);
  lines.push(`- bothDirectionsInIndex: ${bothDirectionsInIndex.length > 0 ? bothDirectionsInIndex.map((pair) => pair.canonical).join(', ') : 'None'}`);
  lines.push(`- wrongRedirectRisk: ${wrongRedirectRisk.length > 0 ? wrongRedirectRisk.map((pair) => pair.canonical).join(', ') : 'None'}`);
  lines.push('');

  lines.push('## Final canonical pairs', '');
  for (const pair of finalPairs) {
    lines.push(`- ${pair.canonical}`);
  }
  lines.push('');

  lines.push('## Redirect mappings', '');
  if (redirects.length === 0) {
    lines.push('- None', '');
  } else {
    for (const redirect of redirects) {
      lines.push(`- ${redirect.from} -> ${redirect.to}`);
    }
    lines.push('');
  }

  lines.push('## Pair details', '');
  for (const pair of finalPairs) {
    lines.push(`### ${pair.canonical}`);
    lines.push('');
    lines.push(`- seenSlugs: ${pair.seenSlugs.join(', ')}`);
    lines.push(`- canonicalSlug: ${pair.canonical}`);
    lines.push(`- canonicalInDisplayIndex: ${pair.indexHasCanonical ? 'Yes' : 'No'}`);
    lines.push(`- nonCanonicalInDisplayIndex: ${pair.indexHasNonCanonical ? 'Yes' : 'No'}`);
    lines.push(`- canonicalRouteResolvable: ${getVsComparisonWithStatus(pair.canonical).comparison ? 'Yes' : 'No'}`);
    lines.push('');
  }

  lines.push('## Errors', '');
  if (parseErrors.length === 0) {
    lines.push('- None');
  } else {
    for (const errorSlug of parseErrors) {
      lines.push(`- Failed to parse: ${errorSlug}`);
    }
  }

  return lines.join('\n');
}

export function buildVsIndexVisibilityReport(): string {
  const cards = listVsIndexCards();
  const featured = getFeaturedVsCards(cards);
  const grouped = getGroupedVsCards(cards);

  const lines: string[] = [
    '# VS Index Visibility',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Summary',
    '',
    `- Canonical index count: ${cards.length}`,
    `- Featured count: ${featured.length}`,
    `- Group count: ${grouped.length}`,
    '',
    '## Canonical slugs in index',
    '',
    ...cards.map((card) => `- ${card.slug}`),
    '',
    '## Featured slugs',
    '',
    ...featured.map((card) => `- ${card.slug}`),
    '',
    '## Grouped visibility',
    '',
  ];

  for (const group of grouped) {
    lines.push(`### ${group.title}`);
    lines.push('');
    for (const item of group.items) {
      lines.push(`- ${item.slug}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

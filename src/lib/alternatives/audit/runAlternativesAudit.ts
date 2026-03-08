import fs from 'fs';
import path from 'path';
import { getAllTools } from '../../../lib/getTool';
import { buildToolAlternativesLongformData } from '../buildLongformData';

const FEATURED_POOL = new Set(['fliki', 'heygen', 'invideo', 'veed-io', 'zebracat', 'synthesia']);
const CORE_ANCHORS = new Set(['fliki', 'heygen', 'invideo']);
const PLACEHOLDER_PATTERNS = [
  /\btbd\b/i,
  /\bverify\b/i,
  /\bneed(?:s)? verification\b/i,
  /export\/download documentation needs verification/i,
];
const REPRESENTATIVE_SLUGS = [
  'invideo',
  'heygen',
  'fliki',
  'synthesia',
  'veed-io',
  'runway',
  'sora',
  'pictory',
  'descript',
  'colossyan',
];

type PageAudit = {
  slug: string;
  title?: string;
  top6: string[];
  top6_has_core_anchor: boolean;
  top6_core_anchor_slug: string | null;
  top6_featured_count: number;
  top6_featured_slug: string | null;
  featured_in_top3_count: number;
  featured_total_count: number;
  featured_all_in_top3: boolean;
  baseline_featured_count: number | null;
  featuredCountTop6: number;
  pictoryIsTop1: boolean;
};

type PairSimilarity = {
  a: string;
  b: string;
  jaccard: number;
  exactSameOrder: boolean;
};

type DataQualityWarning = {
  pageSlug: string;
  fieldPath: string;
  snippet: string;
};

type AuditSummary = {
  pageCount: number;
  pictoryTop1Count: number;
  pictoryTop1Ratio: number;
  jaccardMean: number;
  jaccardMax: number;
  exactSameOrderPairCount: number;
  constraint_missed_core_pages: string[];
  constraint_missed_featured_pages: string[];
  constraint_featured_not_all_in_top3_pages: string[];
  baseline_featured_fill_fail_pages: string[];
  content_quality_warnings_count: number;
  content_quality_top_offending_pages: string[];
};

type AuditReport = {
  generatedAt: string;
  pages: PageAudit[];
  pairwise: PairSimilarity[];
  dataQualityWarnings?: DataQualityWarning[];
  summary: AuditSummary;
};

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractTop6(data: any): string[] {
  const deepDiveTop: string[] = Array.isArray(data?.deepDives)
    ? data.deepDives
        .slice(0, 6)
        .map((item: any) => normalizeSlug(String(item?.toolSlug || item?.toolName || '')))
        .filter((slug: string): slug is string => Boolean(slug))
    : [];

  return Array.from(new Set(deepDiveTop)).slice(0, 6);
}

function containsPlaceholderText(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function pushContentWarning(warnings: DataQualityWarning[], pageSlug: string, fieldPath: string, rawValue: unknown) {
  const snippet = String(rawValue || '').trim();
  if (!snippet) return;
  if (!containsPlaceholderText(snippet)) return;
  warnings.push({ pageSlug, fieldPath, snippet });
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((item) => setB.has(item)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

function buildPairwise(pages: PageAudit[]): PairSimilarity[] {
  const pairs: PairSimilarity[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    for (let j = i + 1; j < pages.length; j += 1) {
      const a = pages[i];
      const b = pages[j];
      const exactSameOrder = a.top6.length === b.top6.length && a.top6.every((value, idx) => value === b.top6[idx]);
      pairs.push({
        a: a.slug,
        b: b.slug,
        jaccard: jaccard(a.top6, b.top6),
        exactSameOrder,
      });
    }
  }
  return pairs;
}

function summarize(
  pages: PageAudit[],
  pairwise: PairSimilarity[],
  dataQualityWarnings: DataQualityWarning[] = []
): AuditSummary {
  const pictoryTop1Count = pages.filter((page) => page.pictoryIsTop1).length;
  const jaccardMean = pairwise.length
    ? pairwise.reduce((sum, pair) => sum + pair.jaccard, 0) / pairwise.length
    : 0;
  const jaccardMax = pairwise.length ? Math.max(...pairwise.map((pair) => pair.jaccard)) : 0;
  const exactSameOrderPairCount = pairwise.filter((pair) => pair.exactSameOrder).length;
  const constraint_missed_core_pages = pages
    .filter((page) => !page.top6_has_core_anchor)
    .map((page) => page.slug);
  const constraint_missed_featured_pages = pages
    .filter((page) => page.top6_featured_count < 1)
    .map((page) => page.slug);
  const constraint_featured_not_all_in_top3_pages = pages
    .filter((page) => page.featured_total_count > 0 && !page.featured_all_in_top3)
    .map((page) => page.slug);
  const baseline_featured_fill_fail_pages = pages
    .filter((page) => {
      if (page.baseline_featured_count === 1) return page.top6_featured_count !== 2;
      if ((page.baseline_featured_count || 0) >= 2) return page.top6_featured_count > (page.baseline_featured_count || 0);
      return false;
    })
    .map((page) => page.slug);
  const content_quality_offenderCount = new Map<string, number>();
  for (const warning of dataQualityWarnings) {
    content_quality_offenderCount.set(warning.pageSlug, (content_quality_offenderCount.get(warning.pageSlug) || 0) + 1);
  }
  const content_quality_top_offending_pages = [...content_quality_offenderCount.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 20)
    .map(([pageSlug]) => pageSlug);

  return {
    pageCount: pages.length,
    pictoryTop1Count,
    pictoryTop1Ratio: pages.length ? pictoryTop1Count / pages.length : 0,
    jaccardMean,
    jaccardMax,
    exactSameOrderPairCount,
    constraint_missed_core_pages,
    constraint_missed_featured_pages,
    constraint_featured_not_all_in_top3_pages,
    baseline_featured_fill_fail_pages,
    content_quality_warnings_count: dataQualityWarnings.length,
    content_quality_top_offending_pages,
  };
}

function isSuspiciousLabel(value: string): boolean {
  const cleaned = value.trim();
  if (!cleaned) return false;
  if (/^[A-Za-z]$/.test(cleaned)) return true;
  return cleaned.length < 3;
}

function readBeforeReport(outDir: string): AuditReport | null {
  const candidates = [
    path.join(outDir, 'before-report.json'),
    path.join(outDir, 'report.json'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (parsed && Array.isArray(parsed.pages) && parsed.summary) {
        return parsed as AuditReport;
      }

      // Backward compatibility with old audit array format.
      if (Array.isArray(parsed)) {
        const pages: PageAudit[] = parsed
          .map((item: any) => {
            const top6: string[] = Array.isArray(item.topPicks)
              ? item.topPicks
                  .slice(0, 6)
                  .map((slug: unknown) => normalizeSlug(String(slug || '')))
                  .filter((slug: string): slug is string => Boolean(slug))
              : [];
            return {
              slug: normalizeSlug(item.slug || ''),
              title: item.slug,
              top6,
              top6_has_core_anchor: top6.some((slug) => CORE_ANCHORS.has(slug)),
              top6_core_anchor_slug: top6.find((slug) => CORE_ANCHORS.has(slug)) || null,
              top6_featured_count: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
              top6_featured_slug: top6.find((slug) => FEATURED_POOL.has(slug)) || null,
              featured_in_top3_count: top6.slice(0, 3).filter((slug) => FEATURED_POOL.has(slug)).length,
              featured_total_count: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
              featured_all_in_top3: (() => {
                const featuredTotal = top6.filter((slug) => FEATURED_POOL.has(slug)).length;
                const featuredInTop3 = top6.slice(0, 3).filter((slug) => FEATURED_POOL.has(slug)).length;
                return featuredTotal === 0 || featuredInTop3 === featuredTotal;
              })(),
              baseline_featured_count: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
              featuredCountTop6: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
              pictoryIsTop1: top6[0] === 'pictory',
            };
          })
          .filter((page) => Boolean(page.slug));

        const pairwise = buildPairwise(pages);
        return {
          generatedAt: new Date().toISOString(),
          pages,
          pairwise,
          summary: summarize(pages, pairwise, []),
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fmtNum(value: number): string {
  return value.toFixed(3);
}

function renderComparisonMarkdown(before: AuditReport | null, after: AuditReport): string {
  const lines: string[] = [];
  lines.push('# Alternatives Sorting Audit (After)');
  lines.push('');
  lines.push(`Generated at: ${after.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Pages audited: ${after.summary.pageCount}`);
  lines.push(`- Pictory Top1: ${after.summary.pictoryTop1Count}/${after.summary.pageCount} (${fmtPct(after.summary.pictoryTop1Ratio)})`);
  lines.push(`- Top6 Jaccard mean: ${fmtNum(after.summary.jaccardMean)}`);
  lines.push(`- Top6 Jaccard max: ${fmtNum(after.summary.jaccardMax)}`);
  lines.push(`- Top6 exact-same-order pairs: ${after.summary.exactSameOrderPairCount}`);
  if (after.summary.exactSameOrderPairCount > 3) {
    lines.push('- **ALERT**: Top6 exact same-order pairs > 3 (homogenization risk)');
  }

  if (before) {
    lines.push('');
    lines.push('## Before vs After');
    lines.push('');
    lines.push(`- Pictory Top1 ratio: ${fmtPct(before.summary.pictoryTop1Ratio)} -> ${fmtPct(after.summary.pictoryTop1Ratio)}`);
    lines.push(`- Jaccard mean: ${fmtNum(before.summary.jaccardMean)} -> ${fmtNum(after.summary.jaccardMean)}`);
    lines.push(`- Jaccard max: ${fmtNum(before.summary.jaccardMax)} -> ${fmtNum(after.summary.jaccardMax)}`);
    lines.push(`- Exact-same-order pairs: ${before.summary.exactSameOrderPairCount} -> ${after.summary.exactSameOrderPairCount}`);
  } else {
    lines.push('');
    lines.push('## Before vs After');
    lines.push('');
    lines.push('- Before report not found. Only after metrics are available.');
  }

  lines.push('');
  lines.push('## Constraints Summary');
  lines.push('');
  lines.push(`- top6_has_core_anchor hit: ${after.summary.pageCount - after.summary.constraint_missed_core_pages.length}/${after.summary.pageCount}`);
  lines.push(`- top6_featured_count>=1 hit: ${after.summary.pageCount - after.summary.constraint_missed_featured_pages.length}/${after.summary.pageCount}`);
  lines.push(`- featured_all_in_top3 hit: ${after.summary.pageCount - after.summary.constraint_featured_not_all_in_top3_pages.length}/${after.summary.pageCount}`);
  lines.push(`- baseline_featured_fill_fail_pages: ${after.summary.baseline_featured_fill_fail_pages.length}`);
  if (after.summary.constraint_missed_core_pages.length > 0) {
    lines.push(`- constraint_missed_core_pages: ${after.summary.constraint_missed_core_pages.slice(0, 20).join(', ')}`);
  } else {
    lines.push('- constraint_missed_core_pages: none');
  }
  if (after.summary.constraint_missed_featured_pages.length > 0) {
    lines.push(`- constraint_missed_featured_pages: ${after.summary.constraint_missed_featured_pages.slice(0, 20).join(', ')}`);
  } else {
    lines.push('- constraint_missed_featured_pages: none');
  }
  if (after.summary.constraint_featured_not_all_in_top3_pages.length > 0) {
    lines.push(`- constraint_featured_not_all_in_top3_pages: ${after.summary.constraint_featured_not_all_in_top3_pages.slice(0, 20).join(', ')}`);
  } else {
    lines.push('- constraint_featured_not_all_in_top3_pages: none');
  }
  if (after.summary.baseline_featured_fill_fail_pages.length > 0) {
    lines.push(`- baseline_featured_fill_fail_pages: ${after.summary.baseline_featured_fill_fail_pages.slice(0, 20).join(', ')}`);
  } else {
    lines.push('- baseline_featured_fill_fail_pages: none');
  }
  lines.push(`- content_quality_warnings_count: ${after.summary.content_quality_warnings_count}`);
  if (after.summary.content_quality_top_offending_pages.length > 0) {
    lines.push(`- content_quality_top_offending_pages: ${after.summary.content_quality_top_offending_pages.join(', ')}`);
  } else {
    lines.push('- content_quality_top_offending_pages: none');
  }

  lines.push('');
  lines.push('## Representative 10 Pages');
  lines.push('');

  const beforeBySlug = new Map((before?.pages || []).map((page) => [page.slug, page]));
  const afterBySlug = new Map(after.pages.map((page) => [page.slug, page]));

  for (const slug of REPRESENTATIVE_SLUGS) {
    const beforePage = beforeBySlug.get(slug);
    const afterPage = afterBySlug.get(slug);
    if (!afterPage) continue;

    lines.push(`### /tool/${slug}/alternatives`);
    lines.push(`- Before Top6: ${beforePage ? beforePage.top6.join(', ') : 'N/A'}`);
    lines.push(`- After Top6: ${afterPage.top6.join(', ')}`);
    lines.push(`- Core anchor (after): ${afterPage.top6_core_anchor_slug || 'None'}`);
    lines.push(`- Baseline featured count: ${beforePage?.top6_featured_count ?? 'N/A'}`);
    lines.push(`- Featured count (after): ${afterPage.top6_featured_count}`);
    lines.push(`- Featured slug (after): ${afterPage.top6_featured_slug || 'None'}`);
    lines.push(`- Featured in Top3 (after): ${afterPage.featured_in_top3_count}/${afterPage.featured_total_count}`);
    lines.push(`- Featured all in Top3 (after): ${afterPage.featured_all_in_top3 ? 'Yes' : 'No'}`);
    lines.push(`- Pictory Top1 (after): ${afterPage.pictoryIsTop1 ? 'Yes' : 'No'}`);
    lines.push('');
  }

  lines.push('');
  lines.push('## Baseline Featured Diff');
  lines.push('');
  for (const page of after.pages.filter((item) => item.baseline_featured_count !== null).slice(0, 20)) {
    lines.push(`- ${page.slug}: baseline=${page.baseline_featured_count} current=${page.top6_featured_count}`);
  }

  lines.push('');
  lines.push('## Data quality warnings');
  lines.push('');
  if ((after.dataQualityWarnings || []).length === 0) {
    lines.push('- none');
  } else {
    for (const warning of (after.dataQualityWarnings || []).slice(0, 40)) {
      lines.push(`- /tool/${warning.pageSlug}/alternatives -> ${warning.fieldPath}: "${warning.snippet}"`);
    }
  }

  return lines.join('\n');
}

async function run() {
  process.env.ALT_AUDIT = '1';

  const outDir = path.join(process.cwd(), '_audit', 'alternatives-sort');
  fs.mkdirSync(outDir, { recursive: true });
  const beforeReport = readBeforeReport(outDir);
  const beforeBySlug = new Map((beforeReport?.pages || []).map((page) => [page.slug, page]));

  const pages: PageAudit[] = [];
  const dataQualityWarnings: DataQualityWarning[] = [];
  for (const tool of getAllTools()) {
    const data = await buildToolAlternativesLongformData(tool.slug);
    if (!data) continue;

    const top6 = extractTop6(data);
    const baselineFeaturedCount = beforeBySlug.get(tool.slug)?.top6_featured_count ?? null;
    pages.push({
      slug: tool.slug,
      title: data.title,
      top6,
      top6_has_core_anchor: top6.some((slug) => CORE_ANCHORS.has(slug)),
      top6_core_anchor_slug: top6.find((slug) => CORE_ANCHORS.has(slug)) || null,
      top6_featured_count: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
      top6_featured_slug: top6.find((slug) => FEATURED_POOL.has(slug)) || null,
      featured_in_top3_count: top6.slice(0, 3).filter((slug) => FEATURED_POOL.has(slug)).length,
      featured_total_count: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
      featured_all_in_top3: (() => {
        const featuredTotal = top6.filter((slug) => FEATURED_POOL.has(slug)).length;
        const featuredInTop3 = top6.slice(0, 3).filter((slug) => FEATURED_POOL.has(slug)).length;
        return featuredTotal === 0 || featuredInTop3 === featuredTotal;
      })(),
      baseline_featured_count: baselineFeaturedCount,
      featuredCountTop6: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
      pictoryIsTop1: top6[0] === 'pictory',
    });

    (data.topPicks || []).forEach((item: any, index: number) => {
      pushContentWarning(dataQualityWarnings, tool.slug, `topPicks[${index}].toolName`, item?.toolName);
    });
    (data.tldrBuckets || []).forEach((bucket: any, bucketIndex: number) => {
      pushContentWarning(dataQualityWarnings, tool.slug, `tldrBuckets[${bucketIndex}].title`, bucket?.title);
      (bucket?.items || []).forEach((item: any, itemIndex: number) => {
        pushContentWarning(dataQualityWarnings, tool.slug, `tldrBuckets[${bucketIndex}].items[${itemIndex}].why`, item?.why);
      });
    });
    (data.deepDives || []).forEach((deepDive: any, index: number) => {
      const bestFor = String(deepDive?.bestFor || '').trim();
      if (bestFor && isSuspiciousLabel(bestFor)) {
        dataQualityWarnings.push({
          pageSlug: tool.slug,
          fieldPath: `deepDives[${index}].bestFor`,
          snippet: bestFor,
        });
      }
      pushContentWarning(dataQualityWarnings, tool.slug, `deepDives[${index}].pricingStarting`, deepDive?.pricingStarting);
      (deepDive?.strengths || []).forEach((value: string, bulletIndex: number) => {
        pushContentWarning(dataQualityWarnings, tool.slug, `deepDives[${index}].strengths[${bulletIndex}]`, value);
      });
      (deepDive?.tradeoffs || []).forEach((value: string, bulletIndex: number) => {
        pushContentWarning(dataQualityWarnings, tool.slug, `deepDives[${index}].tradeoffs[${bulletIndex}]`, value);
      });
    });
    (data.comparisonRows || []).forEach((row: any, index: number) => {
      pushContentWarning(dataQualityWarnings, tool.slug, `comparisonRows[${index}].price`, row?.price);
      pushContentWarning(dataQualityWarnings, tool.slug, `comparisonRows[${index}].freeVersion`, row?.freeVersion);
      pushContentWarning(dataQualityWarnings, tool.slug, `comparisonRows[${index}].watermark`, row?.watermark);
      pushContentWarning(dataQualityWarnings, tool.slug, `comparisonRows[${index}].exportLimits`, row?.exportLimits);
      pushContentWarning(dataQualityWarnings, tool.slug, `comparisonRows[${index}].editingControl`, row?.editingControl);
      pushContentWarning(dataQualityWarnings, tool.slug, `comparisonRows[${index}].bestFor`, row?.bestFor);
      pushContentWarning(dataQualityWarnings, tool.slug, `comparisonRows[${index}].mainTradeoff`, row?.mainTradeoff);
    });
  }

  const pairwise = buildPairwise(pages);
  const afterReport: AuditReport = {
    generatedAt: new Date().toISOString(),
    pages,
    pairwise,
    dataQualityWarnings,
    summary: summarize(pages, pairwise, dataQualityWarnings),
  };

  const markdown = renderComparisonMarkdown(beforeReport, afterReport);

  fs.writeFileSync(
    path.join(outDir, 'after-report.json'),
    JSON.stringify({ before: beforeReport?.summary || null, beforeData: beforeReport || null, after: afterReport }, null, 2)
  );
  fs.writeFileSync(path.join(outDir, 'after-report.md'), markdown);

  console.log('Wrote: _audit/alternatives-sort/after-report.json');
  console.log('Wrote: _audit/alternatives-sort/after-report.md');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

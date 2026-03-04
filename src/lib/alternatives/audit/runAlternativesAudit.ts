import fs from 'fs';
import path from 'path';
import { getAllTools } from '../../../lib/getTool';
import { buildToolAlternativesLongformData } from '../buildLongformData';

const FEATURED_POOL = new Set(['fliki', 'heygen', 'invideo', 'veed-io', 'zebracat', 'synthesia']);
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
  featuredCountTop6: number;
  pictoryIsTop1: boolean;
};

type PairSimilarity = {
  a: string;
  b: string;
  jaccard: number;
  exactSameOrder: boolean;
};

type AuditSummary = {
  pageCount: number;
  pictoryTop1Count: number;
  pictoryTop1Ratio: number;
  jaccardMean: number;
  jaccardMax: number;
  exactSameOrderPairCount: number;
};

type AuditReport = {
  generatedAt: string;
  pages: PageAudit[];
  pairwise: PairSimilarity[];
  summary: AuditSummary;
};

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractTop6(data: any): string[] {
  const deepDiveTop = (data?.deepDives || [])
    .slice(0, 6)
    .map((item: any) => normalizeSlug(item?.toolSlug || item?.toolName || ''))
    .filter(Boolean);
  return Array.from(new Set(deepDiveTop)).slice(0, 6);
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

function summarize(pages: PageAudit[], pairwise: PairSimilarity[]): AuditSummary {
  const pictoryTop1Count = pages.filter((page) => page.pictoryIsTop1).length;
  const jaccardMean = pairwise.length
    ? pairwise.reduce((sum, pair) => sum + pair.jaccard, 0) / pairwise.length
    : 0;
  const jaccardMax = pairwise.length ? Math.max(...pairwise.map((pair) => pair.jaccard)) : 0;
  const exactSameOrderPairCount = pairwise.filter((pair) => pair.exactSameOrder).length;

  return {
    pageCount: pages.length,
    pictoryTop1Count,
    pictoryTop1Ratio: pages.length ? pictoryTop1Count / pages.length : 0,
    jaccardMean,
    jaccardMax,
    exactSameOrderPairCount,
  };
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
            const top6 = Array.isArray(item.topPicks)
              ? item.topPicks.slice(0, 6).map((slug: string) => normalizeSlug(slug)).filter(Boolean)
              : [];
            return {
              slug: normalizeSlug(item.slug || ''),
              title: item.slug,
              top6,
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
          summary: summarize(pages, pairwise),
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
    lines.push(`- Featured count (after): ${afterPage.featuredCountTop6}`);
    lines.push(`- Pictory Top1 (after): ${afterPage.pictoryIsTop1 ? 'Yes' : 'No'}`);
    lines.push('');
  }

  return lines.join('\n');
}

async function run() {
  process.env.ALT_AUDIT = '1';

  const pages: PageAudit[] = [];
  for (const tool of getAllTools()) {
    const data = await buildToolAlternativesLongformData(tool.slug);
    if (!data) continue;

    const top6 = extractTop6(data);
    pages.push({
      slug: tool.slug,
      title: data.title,
      top6,
      featuredCountTop6: top6.filter((slug) => FEATURED_POOL.has(slug)).length,
      pictoryIsTop1: top6[0] === 'pictory',
    });
  }

  const pairwise = buildPairwise(pages);
  const afterReport: AuditReport = {
    generatedAt: new Date().toISOString(),
    pages,
    pairwise,
    summary: summarize(pages, pairwise),
  };

  const outDir = path.join(process.cwd(), '_audit', 'alternatives-sort');
  fs.mkdirSync(outDir, { recursive: true });

  const beforeReport = readBeforeReport(outDir);
  const markdown = renderComparisonMarkdown(beforeReport, afterReport);

  fs.writeFileSync(path.join(outDir, 'after-report.json'), JSON.stringify({ before: beforeReport?.summary || null, after: afterReport }, null, 2));
  fs.writeFileSync(path.join(outDir, 'after-report.md'), markdown);

  console.log('Wrote: _audit/alternatives-sort/after-report.json');
  console.log('Wrote: _audit/alternatives-sort/after-report.md');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

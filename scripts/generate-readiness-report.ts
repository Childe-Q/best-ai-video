import fs from 'node:fs';
import path from 'node:path';
import { getReadinessInventory, PageKind, ReadinessReason } from '@/lib/readiness';

type GapRecommendation = {
  reason: ReadinessReason;
  label: string;
  action: string;
};

const REPORT_DIR = path.join(process.cwd(), 'reports');
const JSON_PATH = path.join(REPORT_DIR, 'readiness-report.json');
const MARKDOWN_PATH = path.join(REPORT_DIR, 'readiness-report.md');

const KIND_LABELS: Record<PageKind, string> = {
  hub: 'Hub',
  tool: 'Tool overview',
  toolAlternatives: 'Tool alternatives',
  toolFeatures: 'Tool features',
  toolReviews: 'Tool reviews',
  feature: 'Feature hub',
  vs: 'VS comparison',
  alternativesTopic: 'Alternatives topic',
};

const GAP_RECOMMENDATIONS: GapRecommendation[] = [
  {
    reason: 'manual_review_pending',
    label: 'Manual review pending',
    action: 'Clear `needsManualReview` after reviewing grouping, coverage, and destination links.',
  },
  {
    reason: 'thin_features',
    label: 'Thin features page',
    action: 'Add enough feature evidence to pass `isFeaturePageThin`.',
  },
  {
    reason: 'thin_reviews',
    label: 'Thin reviews page',
    action: 'Add review highlights, common issues, or FAQ coverage to pass `isReviewPageThin`.',
  },
  {
    reason: 'alternatives_content_gap',
    label: 'Alternatives content gap',
    action: 'Add enough TL;DR buckets, comparison rows, deep dives, and FAQs to satisfy `contentReady`.',
  },
  {
    reason: 'missing_editorial_pack',
    label: 'Missing editorial pack',
    action: 'Add or complete the content pack / structured dataset required by the readiness rule.',
  },
  {
    reason: 'placeholder_signal',
    label: 'Placeholder signal',
    action: 'Remove `[NEED VERIFICATION]`, `TBD`, or placeholder markers from the content pack.',
  },
  {
    reason: 'not_found',
    label: 'Not found',
    action: 'Add the missing route data or remove the link target from promote-safe consideration.',
  },
];

function groupByKind<T extends { kind: PageKind }>(items: T[]): Record<PageKind, T[]> {
  return items.reduce(
    (acc, item) => {
      acc[item.kind].push(item);
      return acc;
    },
    {
      hub: [],
      tool: [],
      toolAlternatives: [],
      toolFeatures: [],
      toolReviews: [],
      feature: [],
      vs: [],
      alternativesTopic: [],
    } as Record<PageKind, T[]>,
  );
}

async function main() {
  const inventory = await getReadinessInventory();
  const ready = inventory.filter((item) => item.ready);
  const excluded = inventory.filter((item) => !item.ready);
  const readyByKind = groupByKind(ready);
  const excludedByKind = groupByKind(excluded);

  const gaps = GAP_RECOMMENDATIONS.map((recommendation) => {
    const items = excluded.filter((item) => item.reasons.includes(recommendation.reason));
    return {
      ...recommendation,
      count: items.length,
      pages: items.map((item) => ({
        kind: item.kind,
        slug: item.slug,
        href: item.href,
        notes: item.notes ?? [],
      })),
    };
  }).filter((item) => item.count > 0);

  const payload = {
    generatedAt: new Date().toISOString(),
    totals: {
      total: inventory.length,
      ready: ready.length,
      excluded: excluded.length,
    },
    promoteSafeByKind: readyByKind,
    excludedByKind,
    gaps,
  };

  const lines: string[] = [
    '# Readiness Report',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total pages checked: ${payload.totals.total}`,
    `- Promote-safe pages: ${payload.totals.ready}`,
    `- Excluded pages: ${payload.totals.excluded}`,
    '',
    '## Promote-safe Pages',
    '',
  ];

  (Object.keys(readyByKind) as PageKind[]).forEach((kind) => {
    const items = readyByKind[kind];
    if (items.length === 0) return;
    lines.push(`### ${KIND_LABELS[kind]} (${items.length})`);
    lines.push('');
    items.forEach((item) => {
      lines.push(`- ${item.href}`);
    });
    lines.push('');
  });

  lines.push('## Excluded Pages');
  lines.push('');
  (Object.keys(excludedByKind) as PageKind[]).forEach((kind) => {
    const items = excludedByKind[kind];
    if (items.length === 0) return;
    lines.push(`### ${KIND_LABELS[kind]} (${items.length})`);
    lines.push('');
    items.forEach((item) => {
      const reasonList = item.reasons.join(', ');
      const noteList = item.notes && item.notes.length > 0 ? ` | ${item.notes.join(' | ')}` : '';
      lines.push(`- ${item.href}: ${reasonList}${noteList}`);
    });
    lines.push('');
  });

  lines.push('## What Is Needed To Promote More Pages');
  lines.push('');
  gaps.forEach((gap) => {
    lines.push(`### ${gap.label} (${gap.count})`);
    lines.push('');
    lines.push(`- Action: ${gap.action}`);
    if (gap.pages.length > 0) {
      lines.push(`- Examples: ${gap.pages.slice(0, 8).map((page) => page.href).join(', ')}`);
    }
    lines.push('');
  });

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(MARKDOWN_PATH, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Wrote ${JSON_PATH}`);
  console.log(`Wrote ${MARKDOWN_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { Tool } from '@/types/tool';
import { VsComparison, VsDiffRow, VsIntent, VsIntentProfile } from '@/types/vs';

const INTENT_ORDER: VsIntent[] = ['avatar', 'editor', 'text', 'repurpose'];

const INTENT_SIGNALS: Record<VsIntent, string[]> = {
  avatar: ['avatar', 'spokesperson', 'presenter', 'digital human', 'talking head', 'synthetic human'],
  editor: ['editor', 'editing', 'captions', 'subtitles', 'trim', 'timeline', 'social ads', 'shorts'],
  text: ['text-to-video', 'blog', 'script', 'article', 'text first', 'voiceover', 'narrated'],
  repurpose: ['repurpose', 'repurposing', 'webinar', 'podcast', 'long-form', 'transcript', 'clips'],
};

const INTENT_DECISION_ROWS: Record<VsIntent, string[]> = {
  avatar: ['Best for', 'Output type', 'Workflow speed', 'Languages & dubbing', 'Templates', 'API', 'Pricing starting point'],
  editor: ['Best for', 'Output type', 'Workflow speed', 'Templates', 'API', 'Pricing starting point', 'Free plan'],
  text: ['Best for', 'Output type', 'Workflow speed', 'Languages & dubbing', 'Templates', 'Pricing starting point', 'Free plan'],
  repurpose: ['Best for', 'Output type', 'Workflow speed', 'Languages & dubbing', 'Templates', 'Pricing starting point', 'Free plan'],
};

const INTENT_USE_CASE_PRIORITY: Record<VsIntent, string[]> = {
  avatar: ['Avatar spokesperson', 'Localization & dubbing', 'Team workflows', 'Script/blog → video'],
  editor: ['Editing & captions', 'Shorts & social ads', 'Team workflows', 'Localization & dubbing'],
  text: ['Script/blog → video', 'Shorts & social ads', 'Localization & dubbing', 'Repurpose long-form'],
  repurpose: ['Repurpose long-form', 'Editing & captions', 'Script/blog → video', 'Shorts & social ads'],
};

const INTENT_KEY_DIFF_PRIORITY: Record<VsIntent, string[]> = {
  avatar: ['Core workflow', 'Output style', 'Output style and use case fit', 'Team operations', 'Team/workspace', 'Pricing and usage posture'],
  editor: ['Core workflow', 'Workflow', 'Templates', 'Output style and use case fit', 'Pricing and usage posture'],
  text: ['Core workflow', 'Output style and use case fit', 'Pricing and usage posture', 'Team operations'],
  repurpose: ['Core workflow', 'Workflow', 'Output style and use case fit', 'Pricing and usage posture'],
};

export const VS_INTENT_OVERRIDES: Record<string, VsIntent> = {
  'fliki-vs-invideo': 'text',
  'heygen-vs-invideo': 'avatar',
  'invideo-vs-pictory': 'repurpose',
  'invideo-vs-zebracat': 'text',
  'runway-vs-sora': 'text',
};

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getToolIntentText(tool?: Tool): string {
  if (!tool) return '';
  const values = [
    tool.name,
    tool.tagline,
    tool.short_description,
    tool.best_for,
    ...(tool.tags ?? []),
    ...(tool.categories ?? []),
    ...(tool.features ?? []),
    ...(tool.pros ?? []),
    ...(tool.target_audience_list ?? []),
    ...(tool.content?.overview?.useCases?.map((item) => `${item.title} ${item.why}`) ?? []),
  ];
  return normalizeText(values.filter(Boolean).join(' '));
}

function getComparisonIntentText(comparison?: VsComparison | null): string {
  if (!comparison) return '';
  return normalizeText(
    [
      comparison.shortAnswer.a,
      comparison.shortAnswer.b,
      ...comparison.bestFor.a,
      ...comparison.bestFor.b,
      ...comparison.keyDiffs.map((row) => `${row.label} ${row.a} ${row.b}`),
      ...comparison.matrixRows.map((row) => `${row.label} ${row.a} ${row.b}`),
    ].join(' '),
  );
}

export function buildIntentProfile(toolA?: Tool, toolB?: Tool, comparison?: VsComparison | null): VsIntentProfile {
  const signals = `${getToolIntentText(toolA)} ${getToolIntentText(toolB)} ${getComparisonIntentText(comparison)}`;
  const scored = INTENT_ORDER.map((intent) => ({
    intent,
    score: INTENT_SIGNALS[intent].reduce((total, keyword) => total + (signals.includes(keyword) ? 1 : 0), 0),
  }));
  const ranked = [...scored].sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    return INTENT_ORDER.indexOf(left.intent) - INTENT_ORDER.indexOf(right.intent);
  });
  const intents = ranked.filter((item) => item.score > 0).map((item) => item.intent);
  const primary = (ranked[0]?.score ?? 0) > 0 ? ranked[0].intent : 'text';

  return applyIntentProfileOverride(
    {
      primary,
      intents: dedupe([primary, ...intents]).slice(0, 3),
    },
    comparison?.slugA ?? toolA?.slug,
    comparison?.slugB ?? toolB?.slug,
  );
}

export function applyIntentProfileOverride(
  profile: VsIntentProfile,
  slugA?: string,
  slugB?: string,
): VsIntentProfile {
  if (!slugA || !slugB) return profile;
  const key = [slugA, slugB].sort((left, right) => left.localeCompare(right)).join('-vs-');
  const override = VS_INTENT_OVERRIDES[key];
  if (!override) return profile;
  return {
    primary: override,
    intents: dedupe([override, ...profile.intents.filter((intent) => intent !== override)]).slice(0, 3),
  };
}

export function getDecisionRowLabelsForIntent(profile?: VsIntentProfile | null): string[] {
  if (!profile) return [];
  const labels = profile.intents.flatMap((intent) => INTENT_DECISION_ROWS[intent]);
  return dedupe(labels).slice(0, 8);
}

export function orderKeyDiffsForIntent(rows: VsDiffRow[], profile?: VsIntentProfile | null): VsDiffRow[] {
  if (!profile || rows.length <= 1) return rows;
  const priority = profile.intents.flatMap((intent) => INTENT_KEY_DIFF_PRIORITY[intent]);
  return [...rows].sort((left, right) => {
    const leftIndex = priority.findIndex((label) => label.toLowerCase() === left.label.toLowerCase());
    const rightIndex = priority.findIndex((label) => label.toLowerCase() === right.label.toLowerCase());
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
    return left.label.localeCompare(right.label);
  });
}

export function getKeyDiffLead(profile: VsIntentProfile | undefined, toolAName: string, toolBName: string): string {
  if (!profile) {
    return `The biggest differences between ${toolAName} and ${toolBName} come down to workflow, output style, and pricing posture.`;
  }
  if (profile.primary === 'avatar') {
    return `${toolAName} and ${toolBName} separate fastest on presenter workflow, dubbing depth, and team handoff.`;
  }
  if (profile.primary === 'repurpose') {
    return `${toolAName} and ${toolBName} separate fastest on repurposing speed, edit control, and how much cleanup the workflow needs.`;
  }
  return `${toolAName} and ${toolBName} separate fastest on how they turn scripts into output, how quickly teams can iterate, and where pricing friction appears.`;
}

export function getPreferredUseCaseLabels(profile?: VsIntentProfile | null): string[] {
  if (!profile) return [];
  return dedupe(profile.intents.flatMap((intent) => INTENT_USE_CASE_PRIORITY[intent]));
}

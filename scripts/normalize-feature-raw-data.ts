import fs from 'fs';
import path from 'path';
import { categories } from '../src/data/categories';
import toolsData from '../src/data/tools.json';
import { FeaturePageData } from '../src/types/featurePage';
import { NormalizedFeaturePage, NormalizedFeatureTool } from '../src/types/normalizedFeaturePage';
import { Tool } from '../src/types/tool';

type RawToolMention = {
  toolName?: string;
  toolSlugGuess?: string;
  bestFor?: string;
  keyClaims?: string[];
  pricingClaims?: string[];
  watermarkRules?: string[];
  exportRules?: string[];
  refundRules?: string[];
  limitations?: string[];
  proofSnippets?: string[];
  confidence?: number;
};

type RawSource = {
  sourceUrl?: string;
  fetchedAt?: string;
  title?: string;
  toolMentions?: RawToolMention[];
};

type RawFeaturePage = {
  pageTopic: string;
  generatedAt?: string;
  featurePageUrl?: string;
  topicDefinition?: {
    oneLiner?: string;
    boundaries?: string[];
  };
  howToChoose?: Array<{ title?: string; desc?: string }>;
  sources?: RawSource[];
};

type AggregatedTool = {
  slug: string;
  name: string;
  bestFor: string[];
  keyClaims: string[];
  pricingClaims: string[];
  watermarkRules: string[];
  exportRules: string[];
  limitations: string[];
  sourceUrls: string[];
  rawMentionCount: number;
};

type PageConfig = {
  classificationRule: string;
  groups: Array<{
    id: string;
    title: string;
    rule: string;
    toolSlugs: string[];
  }>;
};

const NOW_ISO = '2026-03-08T00:00:00.000Z';
const SCHEMA_VERSION = 1;
const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, 'src', 'data', 'research', 'features');
const OUTPUT_DIR = path.join(ROOT, 'src', 'data', 'features', 'normalized');
const REPORT_PATH = path.join(OUTPUT_DIR, '_audit.report.json');
const EXISTING_FEATURE_DIR = path.join(ROOT, 'src', 'data', 'features');
const rawFileNames = fs.existsSync(RAW_DIR) ? fs.readdirSync(RAW_DIR).filter((file) => file.endsWith('.raw.json')).sort() : [];
const toolBySlug = new Map<string, Tool>((toolsData as Tool[]).map((tool) => [tool.slug, tool]));

const SLUG_ALIASES: Record<string, string> = {
  'minimax-hailuo': 'hailuo-ai',
};

const MANUAL_TOOL_META: Record<string, { officialUrl?: string; logoUrl?: string }> = {
  'adobe-premiere-pro': { officialUrl: 'https://www.adobe.com/products/premiere.html' },
  'capcut': { officialUrl: 'https://www.capcut.com/' },
  'syllaby': { officialUrl: 'https://syllaby.io/' },
  'kling-ai': { officialUrl: 'https://klingai.com/' },
  'veo': { officialUrl: 'https://deepmind.google/models/veo/' },
  'magic-hour': { officialUrl: 'https://magichour.ai/' },
  'hailuo-ai': { officialUrl: 'https://hailuoai.com/' },
  'jogg-ai': { officialUrl: 'https://www.jogg.ai/' },
  'kapwing': { officialUrl: 'https://www.kapwing.com/' },
  'leonardo-ai': { officialUrl: 'https://leonardo.ai/ai-video-generator' },
};

const PAGE_CONFIGS: Record<string, PageConfig> = {
  'best-ai-video-generators': {
    classificationRule: 'Group by primary generation workflow.',
    groups: [
      {
        id: 'cinematic-generation',
        title: 'Cinematic generation',
        rule: 'Tools centered on photorealistic or controlled scene generation.',
        toolSlugs: ['sora', 'runway'],
      },
      {
        id: 'avatar-workflows',
        title: 'Avatar workflows',
        rule: 'Tools built around presenters, training, or talking-head output.',
        toolSlugs: ['heygen', 'synthesia'],
      },
      {
        id: 'short-form-effects',
        title: 'Short-form effects',
        rule: 'Tools optimized for fast creative effects or social clips.',
        toolSlugs: ['pika'],
      },
    ],
  },
  'free-ai-video-no-watermark': {
    classificationRule: 'Group by free-tier watermark policy.',
    groups: [
      { id: 'truly-free', title: 'Truly Free', rule: 'Free exports stay watermark-free.', toolSlugs: ['flexclip', 'leonardo-ai', 'hailuo-ai', 'jogg-ai'] },
      { id: 'conditional-free', title: 'Conditional Free', rule: 'Watermark-free only under stated limits.', toolSlugs: ['kapwing'] },
      { id: 'low-cost-removal', title: 'Low-Cost Removal', rule: 'Free tier adds branding; upgrade removes it.', toolSlugs: ['clipclip', 'lumen5'] },
    ],
  },
  'ai-avatar-video-generators': {
    classificationRule: 'Group by avatar workflow and deployment context.',
    groups: [
      {
        id: 'marketing-and-social',
        title: 'Marketing and social avatars',
        rule: 'Tools tailored to multilingual avatars, personalization, and campaign output.',
        toolSlugs: ['heygen'],
      },
      {
        id: 'training-and-enterprise',
        title: 'Training and enterprise avatars',
        rule: 'Tools focused on compliance, governance, or structured learning workflows.',
        toolSlugs: ['synthesia', 'colossyan', 'deepbrain-ai'],
      },
      {
        id: 'image-and-api-avatar',
        title: 'Image and API avatar tools',
        rule: 'Tools oriented toward animating still images or API-driven avatar delivery.',
        toolSlugs: ['d-id'],
      },
    ],
  },
  'ai-video-editors': {
    classificationRule: 'Group by editing workflow depth.',
    groups: [
      {
        id: 'full-editing-suites',
        title: 'Full editing suites',
        rule: 'Tools suited to detailed timeline editing or transcript-first editing.',
        toolSlugs: ['adobe-premiere-pro', 'descript'],
      },
      {
        id: 'clip-and-social-editing',
        title: 'Clip and social editing',
        rule: 'Tools focused on fast short-form clipping, templates, or effects.',
        toolSlugs: ['opus-clip', 'capcut'],
      },
    ],
  },
  'fast-ai-video-generators': {
    classificationRule: 'Group by rapid generation workflow.',
    groups: [
      {
        id: 'rapid-prototyping',
        title: 'Rapid prototyping',
        rule: 'Tools optimized for fast prompt-to-video turnaround.',
        toolSlugs: ['luma-dream-machine', 'hailuo-ai', 'pika'],
      },
    ],
  },
  'ai-video-for-social-media': {
    classificationRule: 'Group by social publishing workflow.',
    groups: [
      {
        id: 'template-and-clip-workflows',
        title: 'Template and clip workflows',
        rule: 'Tools aimed at repeatable posts, clip generation, or short-form edits.',
        toolSlugs: ['capcut', 'reelbase', 'invideo'],
      },
      {
        id: 'avatar-and-presentation-social',
        title: 'Avatar and presentation social',
        rule: 'Tools for presenter-led social posts or polished talking-head output.',
        toolSlugs: ['deepbrain-ai'],
      },
    ],
  },
  'viral-ai-video-generators': {
    classificationRule: 'Group by virality workflow.',
    groups: [
      {
        id: 'repurposing-and-clipping',
        title: 'Repurposing and clipping',
        rule: 'Tools that turn long videos into short clips with hook or highlight logic.',
        toolSlugs: ['opus-clip', 'vizard', 'munch'],
      },
      {
        id: 'trend-led-creation',
        title: 'Trend-led creation',
        rule: 'Tools framed around trend discovery or viral content ideation.',
        toolSlugs: ['hooked', 'gen-pro'],
      },
    ],
  },
  'professional-ai-video-tools': {
    classificationRule: 'Group by team and governance needs.',
    groups: [
      {
        id: 'governed-training-platforms',
        title: 'Governed training platforms',
        rule: 'Tools focused on controlled team workflows, governance, or corporate training.',
        toolSlugs: ['synthesia', 'visla'],
      },
      {
        id: 'repurposing-for-teams',
        title: 'Repurposing for teams',
        rule: 'Tools suited to structured content reuse across teams.',
        toolSlugs: ['pictory'],
      },
    ],
  },
  'content-repurposing-ai-tools': {
    classificationRule: 'Group by source content type.',
    groups: [
      {
        id: 'article-and-script-conversion',
        title: 'Article and script conversion',
        rule: 'Tools that turn blogs, scripts, or documents into videos.',
        toolSlugs: ['pictory', 'lumen5'],
      },
      {
        id: 'long-form-video-clipping',
        title: 'Long-form video clipping',
        rule: 'Tools that pull highlights or shorts from existing recordings.',
        toolSlugs: ['munch', 'opus-clip'],
      },
    ],
  },
  'budget-friendly-ai-video-tools': {
    classificationRule: 'Group by low-cost output style.',
    groups: [
      {
        id: 'budget-generators',
        title: 'Budget generators',
        rule: 'Lower-cost tools for generative output or effects.',
        toolSlugs: ['kling-ai', 'pika', 'runway'],
      },
      {
        id: 'daily-creator-workflows',
        title: 'Daily creator workflows',
        rule: 'Lower-cost tools for repeatable everyday social output.',
        toolSlugs: ['magic-hour'],
      },
    ],
  },
  'ai-video-for-marketing': {
    classificationRule: 'Group by marketing production workflow.',
    groups: [
      {
        id: 'personalization-and-variants',
        title: 'Personalization and variants',
        rule: 'Tools built for campaign variants, personalization, or multilingual output.',
        toolSlugs: ['abyssale', 'heygen'],
      },
      {
        id: 'generative-brand-storytelling',
        title: 'Generative brand storytelling',
        rule: 'Tools focused on cinematic or prompt-led marketing asset creation.',
        toolSlugs: ['runway', 'mootion'],
      },
    ],
  },
  'text-to-video-ai-tools': {
    classificationRule: 'Group by text-to-video control and fidelity.',
    groups: [
      {
        id: 'cinematic-text-to-video',
        title: 'Cinematic text-to-video',
        rule: 'Models optimized for controlled scene generation or higher fidelity output.',
        toolSlugs: ['sora', 'runway', 'kling-ai'],
      },
    ],
  },
  'ai-video-for-youtube': {
    classificationRule: 'Group by YouTube production workflow.',
    groups: [
      {
        id: 'channel-automation',
        title: 'Channel automation',
        rule: 'Tools focused on scripted channel output, automation, or end-to-end publishing.',
        toolSlugs: ['invideo', 'syllaby'],
      },
      {
        id: 'avatar-support',
        title: 'Avatar support',
        rule: 'Tools used when a faceless or avatar-led host is part of the workflow.',
        toolSlugs: ['heygen'],
      },
    ],
  },
  'ai-video-generators-comparison': {
    classificationRule: 'Group by market position and access model.',
    groups: [
      {
        id: 'frontier-models',
        title: 'Frontier models',
        rule: 'Higher-end or closed model systems positioned around fidelity or novelty.',
        toolSlugs: ['sora', 'veo', 'seedance'],
      },
      {
        id: 'creator-access-tools',
        title: 'Creator-access tools',
        rule: 'Tools that are more accessible to working creators or smaller teams.',
        toolSlugs: ['runway', 'pika', 'kling-ai'],
      },
    ],
  },
  'enterprise-ai-video-solutions': {
    classificationRule: 'Group by enterprise deployment use case.',
    groups: [
      {
        id: 'training-and-communications',
        title: 'Training and communications',
        rule: 'Platforms aimed at internal enablement, training, or global communications.',
        toolSlugs: ['synthesia', 'deepbrain-ai'],
      },
      {
        id: 'repurposing-and-knowledge-ops',
        title: 'Repurposing and knowledge ops',
        rule: 'Tools used for scalable content transformation inside larger organizations.',
        toolSlugs: ['pictory'],
      },
    ],
  },
};

const AFFILIATE_HOST_BLACKLIST = ['sjv.io'];
const THIRD_PARTY_SOURCE_HOST_BLACKLIST = [
  'toolworthy.ai',
  'ventureharbour.com',
  'deckoholic.ai',
  'buffer.com',
  'vidwave.ai',
  'meetsona.ai',
  'tryhooked.ai',
  'magichour.ai',
];

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function cleanText(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const cleaned = value.replace(/\s+/g, ' ').replace(/\u2019/g, "'").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSlug(rawSlug: string | null | undefined, fallbackName: string): string {
  const base = cleanText(rawSlug) || slugify(fallbackName);
  return SLUG_ALIASES[base] || base;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    if (!cleaned) {
      continue;
    }
    if (seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    result.push(cleaned);
  }

  return result;
}

function compactCleaned(values: Array<string | null | undefined>): string[] {
  return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function isWeakClaim(value: string): boolean {
  return /\b(best|leading|perfect|excellent|ultimate|all-rounder)\b/i.test(value);
}

function safeClaim(values: string[]): string | null {
  return values.find((value) => !isWeakClaim(value)) || values[0] || null;
}

function aggregateRawTools(rawPage: RawFeaturePage): { tools: AggregatedTool[]; duplicateSlugs: string[] } {
  const aggregated = new Map<string, AggregatedTool>();
  const mentionCounts = new Map<string, number>();

  for (const source of rawPage.sources || []) {
    for (const mention of source.toolMentions || []) {
      const name = cleanText(mention.toolName) || 'Unknown Tool';
      const slug = normalizeSlug(mention.toolSlugGuess, name);
      const current = aggregated.get(slug) || {
        slug,
        name,
        bestFor: [],
        keyClaims: [],
        pricingClaims: [],
        watermarkRules: [],
        exportRules: [],
        limitations: [],
        sourceUrls: [],
        rawMentionCount: 0,
      };

      current.name = current.name || name;
      current.bestFor.push(...compactCleaned([cleanText(mention.bestFor)]));
      current.keyClaims.push(...compactCleaned((mention.keyClaims || []).map(cleanText)));
      current.pricingClaims.push(...compactCleaned((mention.pricingClaims || []).map(cleanText)));
      current.watermarkRules.push(...compactCleaned((mention.watermarkRules || []).map(cleanText)));
      current.exportRules.push(...compactCleaned((mention.exportRules || []).map(cleanText)));
      current.limitations.push(...compactCleaned((mention.limitations || []).map(cleanText)));
      current.sourceUrls.push(...compactCleaned([cleanText(source.sourceUrl)]));
      current.rawMentionCount += 1;

      aggregated.set(slug, current);
      mentionCounts.set(slug, (mentionCounts.get(slug) || 0) + 1);
    }
  }

  const duplicateSlugs = Array.from(mentionCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug)
    .sort();

  return {
    tools: Array.from(aggregated.values()).map((tool) => ({
      ...tool,
      bestFor: uniqueStrings(tool.bestFor),
      keyClaims: uniqueStrings(tool.keyClaims),
      pricingClaims: uniqueStrings(tool.pricingClaims),
      watermarkRules: uniqueStrings(tool.watermarkRules),
      exportRules: uniqueStrings(tool.exportRules),
      limitations: uniqueStrings(tool.limitations),
      sourceUrls: uniqueStrings(tool.sourceUrls),
    })),
    duplicateSlugs,
  };
}

function normalizeHowToChoose(rawPage: RawFeaturePage): Array<{ title: string; desc: string }> {
  const seeds = (rawPage.howToChoose || [])
    .map((item) => {
      const title = cleanText(item.title);
      const desc = cleanText(item.desc);
      if (!title || !desc) {
        return null;
      }
      return { title, desc };
    })
    .filter((item): item is { title: string; desc: string } => item !== null);

  return seeds;
}

function inferComparisonAxes(rawPage: RawFeaturePage, howToChooseSeeds: Array<{ title: string; desc: string }>): string[] {
  const axes = new Set<string>();
  const combined = [
    cleanText(rawPage.topicDefinition?.oneLiner),
    ...howToChooseSeeds.flatMap((item) => [item.title, item.desc]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/price|cost|budget|credit/.test(combined)) axes.add('pricing and credit limits');
  if (/watermark/.test(combined)) axes.add('watermark policy');
  if (/resolution|4k|1080p|export/.test(combined)) axes.add('export quality');
  if (/commercial|license/.test(combined)) axes.add('commercial rights');
  if (/api|workflow|automation/.test(combined)) axes.add('workflow fit and automation');
  if (/team|enterprise|governance|security/.test(combined)) axes.add('team and governance requirements');
  if (/speed|fast/.test(combined)) axes.add('generation speed');

  return Array.from(axes);
}

function canonicalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const normalizedPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
    return `${parsed.origin}${normalizedPath || '/'}`;
  } catch {
    return null;
  }
}

function inferOfficialUrlFromToolDataset(tool: Tool | undefined): string | null {
  if (!tool?.affiliate_link) {
    return null;
  }

  try {
    const parsed = new URL(tool.affiliate_link);
    if (AFFILIATE_HOST_BLACKLIST.some((host) => parsed.hostname.includes(host))) {
      return null;
    }
    return canonicalizeUrl(tool.affiliate_link);
  } catch {
    return null;
  }
}

function inferOfficialUrlFromSources(tool: AggregatedTool): string | null {
  const slugTokens = tool.slug.split('-').filter(Boolean);
  const nameTokens = slugify(tool.name).split('-').filter(Boolean);

  for (const sourceUrl of tool.sourceUrls) {
    try {
      const parsed = new URL(sourceUrl);
      const hostname = parsed.hostname.replace(/^www\./, '');
      if (THIRD_PARTY_SOURCE_HOST_BLACKLIST.includes(hostname)) {
        continue;
      }

      const hostText = hostname.toLowerCase();
      const matchesSlug = slugTokens.some((token) => token.length > 2 && hostText.includes(token));
      const matchesName = nameTokens.some((token) => token.length > 2 && hostText.includes(token));

      if (matchesSlug || matchesName) {
        return `${parsed.origin}/`;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildVerdictSeed(tool: AggregatedTool, datasetTool: Tool | undefined): string | null {
  const bestFor = tool.bestFor[0] || cleanText(datasetTool?.best_for);
  const claim = safeClaim(tool.keyClaims);

  if (bestFor && claim) {
    return `${bestFor}. Reported strength: ${claim}.`;
  }

  if (bestFor) {
    return `Best-for seed: ${bestFor}.`;
  }

  if (claim) {
    return `Reported strength: ${claim}.`;
  }

  return null;
}

function buildPricingSeed(tool: AggregatedTool, datasetTool: Tool | undefined): string | null {
  const claims = tool.pricingClaims.filter((claim) => !isWeakClaim(claim));
  if (claims.length > 0) {
    return claims.slice(0, 2).join('; ');
  }

  const startingPrice = cleanText(datasetTool?.starting_price);
  return startingPrice ? `Starting price in tool dataset: ${startingPrice}.` : null;
}

function buildPolicySeed(tool: AggregatedTool): string | null {
  if (tool.watermarkRules.length > 0) {
    return tool.watermarkRules[0];
  }

  return tool.exportRules.find((rule) => /watermark|resolution|export|commercial/i.test(rule)) || null;
}

function buildMainLimitationSeed(tool: AggregatedTool): string | null {
  if (tool.limitations.length > 0) {
    return tool.limitations[0];
  }

  return tool.exportRules.find((rule) => /limit|cap|only|custom pricing|required/i.test(rule)) || null;
}

function buildNormalizedTool(tool: AggregatedTool): NormalizedFeatureTool {
  const datasetTool = toolBySlug.get(tool.slug);
  const officialUrl =
    MANUAL_TOOL_META[tool.slug]?.officialUrl ||
    inferOfficialUrlFromToolDataset(datasetTool) ||
    inferOfficialUrlFromSources(tool) ||
    null;
  const hasReviewPage = Boolean(datasetTool);
  const flags = uniqueStrings([
    tool.rawMentionCount > 1 ? 'duplicate-raw-mentions-merged' : null,
    tool.pricingClaims.length === 0 ? 'missing-pricing-seed' : null,
    tool.watermarkRules.length === 0 ? 'missing-policy-seed' : null,
    tool.limitations.length === 0 ? 'missing-limitation-seed' : null,
    !officialUrl ? 'missing-official-url' : null,
    !datasetTool?.logo_url && !MANUAL_TOOL_META[tool.slug]?.logoUrl ? 'missing-logo-url' : null,
    !hasReviewPage ? 'missing-review-coverage' : null,
  ]);

  return {
    name: cleanText(datasetTool?.name) || tool.name,
    slug: tool.slug,
    verdictSeed: buildVerdictSeed(tool, datasetTool),
    pricingSeed: buildPricingSeed(tool, datasetTool),
    policySeed: buildPolicySeed(tool),
    bestForSeed: tool.bestFor[0] || cleanText(datasetTool?.best_for),
    mainLimitationSeed: buildMainLimitationSeed(tool),
    officialUrl,
    hasReviewPage,
    reviewUrl: hasReviewPage ? `/tool/${tool.slug}` : null,
    logoUrl: datasetTool?.logo_url || MANUAL_TOOL_META[tool.slug]?.logoUrl || null,
    sourceUrls: tool.sourceUrls,
    flags,
  };
}

function buildFaqSeeds(
  title: string,
  classificationRule: string,
  boundaries: string[],
  howToChooseSeeds: Array<{ title: string; desc: string }>,
  tools: NormalizedFeatureTool[]
): NormalizedFeaturePage['faqSeeds'] {
  const coveredTools = tools.filter((tool) => tool.hasReviewPage).map((tool) => tool.slug);
  const coverageAnswer =
    coveredTools.length > 0
      ? `Current internal review coverage in this normalized dataset: ${coveredTools.join(', ')}.`
      : 'No internal review coverage is attached to this normalized dataset yet.';

  return [
    {
      question: `What qualifies a tool for ${title}?`,
      answerSeed: uniqueStrings([classificationRule, ...boundaries]).join(' '),
      sourceToolSlugs: [],
    },
    {
      question: `What should readers compare first on this page?`,
      answerSeed: howToChooseSeeds.slice(0, 2).map((item) => `${item.title}: ${item.desc}`).join(' '),
      sourceToolSlugs: [],
    },
    {
      question: 'Which tools already have internal review coverage?',
      answerSeed: coverageAnswer,
      sourceToolSlugs: coveredTools,
    },
  ];
}

function collectReviewNotes(tools: NormalizedFeatureTool[], extraNotes: string[]): string[] {
  const notes = [...extraNotes];
  if (tools.some((tool) => tool.flags.includes('missing-official-url'))) {
    notes.push('One or more tools still need verified officialUrl coverage.');
  }
  if (tools.some((tool) => tool.flags.includes('missing-logo-url'))) {
    notes.push('One or more tools still need verified logoUrl coverage.');
  }
  if (tools.some((tool) => tool.flags.includes('missing-review-coverage'))) {
    notes.push('One or more tools are missing internal review coverage.');
  }
  return uniqueStrings(notes);
}

function buildRelatedLinks(tools: NormalizedFeatureTool[]): NormalizedFeaturePage['relatedLinks'] {
  const reviewSlugs = tools.filter((tool) => tool.hasReviewPage).map((tool) => tool.slug).slice(0, 4);
  return {
    reviewSlugs,
    alternativesSlugs: reviewSlugs.slice(0, 3),
    vsSlugs: [],
    guideSlugs: [],
  };
}

function buildFromRaw(categorySlug: string, rawPage: RawFeaturePage, sourceFile: string): { page: NormalizedFeaturePage; pageIssues: string[]; duplicateSlugs: string[] } {
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) {
    throw new Error(`Unknown category slug: ${categorySlug}`);
  }

  const config = PAGE_CONFIGS[categorySlug];
  if (!config) {
    throw new Error(`Missing page config for ${categorySlug}`);
  }

  const howToChooseSeeds = normalizeHowToChoose(rawPage);
  const { tools: aggregatedTools, duplicateSlugs } = aggregateRawTools(rawPage);
  const normalizedTools = aggregatedTools.map(buildNormalizedTool);
  const groupedSlugs = new Set(config.groups.flatMap((group) => group.toolSlugs));
  const unassignedToolSlugs = normalizedTools.map((tool) => tool.slug).filter((slug) => !groupedSlugs.has(slug));
  const groups = [...config.groups];

  if (unassignedToolSlugs.length > 0) {
    groups.push({
      id: 'needs-manual-grouping',
      title: 'Needs manual grouping',
      rule: 'These tools were extracted from raw research but are not mapped to a stable group yet.',
      toolSlugs: unassignedToolSlugs,
    });
  }

  const pageIssues = uniqueStrings([
    duplicateSlugs.length > 0 ? `Duplicate raw tool mentions merged: ${duplicateSlugs.join(', ')}` : null,
    howToChooseSeeds.length === 0 ? 'Missing howToChoose seeds after normalization.' : null,
    unassignedToolSlugs.length > 0 ? `Unassigned tool grouping: ${unassignedToolSlugs.join(', ')}` : null,
  ]);

  const lastReviewed = cleanText(rawPage.generatedAt) || NOW_ISO;
  const boundaries = uniqueStrings(rawPage.topicDefinition?.boundaries || []);
  const comparisonAxes = inferComparisonAxes(rawPage, howToChooseSeeds);
  const relatedLinks = buildRelatedLinks(normalizedTools);
  const reviewNotes = collectReviewNotes(normalizedTools, pageIssues);

  return {
    page: {
      schemaVersion: SCHEMA_VERSION,
      slug: category.slug,
      title: category.title,
      summarySeed: {
        oneLiner: cleanText(rawPage.topicDefinition?.oneLiner) || category.description,
        boundaries,
        primaryClassificationRule: config.classificationRule,
        comparisonAxes,
      },
      howToChooseSeeds,
      groups,
      tools: normalizedTools,
      relatedLinks,
      faqSeeds: buildFaqSeeds(category.title, config.classificationRule, boundaries, howToChooseSeeds, normalizedTools),
      lastReviewed,
      reviewMetadata: {
        generatedFrom: 'research-raw',
        sourceFile,
        sourceCount: rawPage.sources?.length || 0,
        uniqueToolCount: normalizedTools.length,
        needsManualReview: reviewNotes.length > 0,
        reviewNotes,
      },
    },
    pageIssues,
    duplicateSlugs,
  };
}

function buildFromExistingFeaturePage(categorySlug: string, filePath: string): { page: NormalizedFeaturePage; pageIssues: string[] } {
  const category = categories.find((item) => item.slug === categorySlug);
  const existingPage = readJson<FeaturePageData>(filePath);
  if (!category) {
    throw new Error(`Unknown category slug: ${categorySlug}`);
  }

  const config = PAGE_CONFIGS[categorySlug];
  if (!config) {
    throw new Error(`Missing page config for ${categorySlug}`);
  }

  const tools = existingPage.groups.flatMap((group) =>
    group.tools.map((tool) => {
      const datasetTool = toolBySlug.get(tool.toolSlug);
      const officialUrl =
        tool.officialUrl ||
        MANUAL_TOOL_META[tool.toolSlug]?.officialUrl ||
        inferOfficialUrlFromToolDataset(datasetTool) ||
        null;
      const hasReviewPage = tool.hasReviewPage ?? Boolean(datasetTool);

      return {
        name: cleanText(tool.name) || cleanText(datasetTool?.name) || tool.toolSlug,
        slug: tool.toolSlug,
        verdictSeed: cleanText(tool.reasonLine1),
        pricingSeed: cleanText(tool.pricingStartAt),
        policySeed: cleanText(tool.watermarkPolicy),
        bestForSeed: cleanText(tool.bestFor),
        mainLimitationSeed: cleanText(tool.mainTradeoff),
        officialUrl,
        hasReviewPage,
        reviewUrl: cleanText(tool.reviewUrl) || (hasReviewPage ? `/tool/${tool.toolSlug}` : null),
        logoUrl: datasetTool?.logo_url || null,
        sourceUrls: [],
        flags: uniqueStrings([
          !officialUrl ? 'missing-official-url' : null,
          !datasetTool?.logo_url ? 'missing-logo-url' : null,
          !hasReviewPage ? 'missing-review-coverage' : null,
        ]),
      } satisfies NormalizedFeatureTool;
    })
  );

  const howToChooseSeeds = (existingPage.howToChoose?.criteria || [])
    .map((item) => {
      const title = cleanText(item.title);
      const desc = cleanText(item.desc);
      return title && desc ? { title, desc } : null;
    })
    .filter((item): item is { title: string; desc: string } => item !== null);
  const boundaries = uniqueStrings(existingPage.hero.definitionBullets || []);
  const comparisonAxes = inferComparisonAxes(
    {
      pageTopic: existingPage.slug,
      topicDefinition: { oneLiner: existingPage.hero.subheadline, boundaries },
      howToChoose: howToChooseSeeds,
      sources: [],
    },
    howToChooseSeeds
  );
  const reviewNotes = collectReviewNotes(tools, ['No raw research file exists for this slug; normalized from existing frontend JSON.']);

  return {
    page: {
      schemaVersion: SCHEMA_VERSION,
      slug: category.slug,
      title: category.title,
      summarySeed: {
        oneLiner: cleanText(existingPage.hero.subheadline) || category.description,
        boundaries,
        primaryClassificationRule: config.classificationRule,
        comparisonAxes,
      },
      howToChooseSeeds,
      groups: config.groups,
      tools,
      relatedLinks: {
        reviewSlugs: (existingPage.recommendedReading?.tools || []).filter((slug) => toolBySlug.has(slug)),
        alternativesSlugs: (existingPage.recommendedReading?.alternativesPages || [])
          .map((item) => item.replace(/\/alternatives$/, ''))
          .filter((slug) => toolBySlug.has(slug)),
        vsSlugs: existingPage.recommendedReading?.vsPages || [],
        guideSlugs: existingPage.recommendedReading?.guides || [],
      },
      faqSeeds: buildFaqSeeds(category.title, config.classificationRule, boundaries, howToChooseSeeds, tools),
      lastReviewed: NOW_ISO,
      reviewMetadata: {
        generatedFrom: 'existing-feature-page',
        sourceFile: path.relative(ROOT, filePath),
        sourceCount: 0,
        uniqueToolCount: tools.length,
        needsManualReview: reviewNotes.length > 0,
        reviewNotes,
      },
    },
    pageIssues: reviewNotes,
  };
}

function main(): void {
  ensureDir(OUTPUT_DIR);

  const report = {
    schemaVersion: SCHEMA_VERSION,
    normalizedFiles: [] as string[],
    sourceAudit: {
      missingRawFiles: [] as string[],
      duplicateMentionsByPage: {} as Record<string, string[]>,
      pagesNeedingManualReview: {} as Record<string, string[]>,
      toolsMissingOfficialUrl: [] as string[],
      toolsMissingLogoUrl: [] as string[],
      toolsMissingReviewCoverage: [] as string[],
    },
  };

  const missingOfficialUrl = new Set<string>();
  const missingLogoUrl = new Set<string>();
  const missingReviewCoverage = new Set<string>();

  for (const category of categories) {
    const rawFileName = `${category.slug}.raw.json`;
    const rawPath = path.join(RAW_DIR, rawFileName);
    let normalizedResult:
      | { page: NormalizedFeaturePage; pageIssues: string[]; duplicateSlugs?: string[] }
      | null = null;

    if (fs.existsSync(rawPath)) {
      normalizedResult = buildFromRaw(category.slug, readJson<RawFeaturePage>(rawPath), path.relative(ROOT, rawPath));
      report.sourceAudit.duplicateMentionsByPage[category.slug] = normalizedResult.duplicateSlugs || [];
    } else {
      report.sourceAudit.missingRawFiles.push(category.slug);
      const existingPath = path.join(EXISTING_FEATURE_DIR, `${category.slug}.json`);
      if (!fs.existsSync(existingPath)) {
        throw new Error(`Missing raw and existing feature JSON for ${category.slug}`);
      }
      normalizedResult = buildFromExistingFeaturePage(category.slug, existingPath);
    }

    const outputPath = path.join(OUTPUT_DIR, `${category.slug}.json`);
    writeJson(outputPath, normalizedResult.page);
    report.normalizedFiles.push(path.relative(ROOT, outputPath));

    if (normalizedResult.page.reviewMetadata.reviewNotes.length > 0) {
      report.sourceAudit.pagesNeedingManualReview[category.slug] = normalizedResult.page.reviewMetadata.reviewNotes;
    }

    for (const tool of normalizedResult.page.tools) {
      if (!tool.officialUrl) missingOfficialUrl.add(tool.slug);
      if (!tool.logoUrl) missingLogoUrl.add(tool.slug);
      if (!tool.hasReviewPage) missingReviewCoverage.add(tool.slug);
    }
  }

  report.sourceAudit.toolsMissingOfficialUrl = Array.from(missingOfficialUrl).sort();
  report.sourceAudit.toolsMissingLogoUrl = Array.from(missingLogoUrl).sort();
  report.sourceAudit.toolsMissingReviewCoverage = Array.from(missingReviewCoverage).sort();

  writeJson(REPORT_PATH, report);
  console.log(`Normalized ${report.normalizedFiles.length} feature datasets into ${path.relative(ROOT, OUTPUT_DIR)}`);
}

main();

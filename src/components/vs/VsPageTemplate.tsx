import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import CTAButton from '@/components/CTAButton';
import ToolLogo from '@/components/ToolLogo';
import DecisionPanel from '@/components/vs/DecisionPanel';
import EditorialDecisionGuide from '@/components/vs/EditorialDecisionGuide';
import PromptBox from '@/components/vs/PromptBox';
import SourceTooltip from './SourceTooltip';
import VsDecisionTable from '@/components/vs/VsDecisionTable';
import VsScoreChart from '@/components/vs/VsScoreChart';
import { canonicalizeVsHref, listVsSlugs, parseVsSlug, toCanonicalVsSlug, VsLoadResult } from '@/data/vs';
import { getAllTools, getTool } from '@/lib/getTool';
import { applyIntentProfileOverride, buildIntentProfile, getKeyDiffLead, getPreferredUseCaseLabels, orderKeyDiffsForIntent } from '@/lib/vsIntent';
import { buildPromptVariants, inferUseCaseKey, UseCaseKey } from '@/lib/promptLibrary';
import { collectComparisonSourceUrls, getSourceDomain } from '@/lib/vsSources';
import { resolveRowSourcesForTools } from '@/lib/vsToolSources';
import { getSEOCurrentYear } from '@/lib/utils';
import { buildDecisionTableRows, DECISION_TABLE_ROWS, toVsDiffRows } from '@/lib/vsDecisionTable';
import { applyFeaturedCalibration, computeInternalScoreVerdict, derivePriceWinnerFromDecisionTable, formatInternalScore, normalizeInternalScore, ScoreWinner } from '@/lib/vsScore';
import { Tool } from '@/types/tool';
import { VsComparison, VsPromptVariant, VsSide } from '@/types/vs';

interface VsPageTemplateProps {
  load: VsLoadResult;
  resolved: {
    slug: string;
  };
  showDebug?: boolean;
}

type ToolMeta = {
  slug: string;
  name: string;
  logoUrl: string | null | undefined;
  affiliateLink: string | undefined;
  hasFreeTrial: boolean;
  data?: Tool;
};

type ScenarioConfig = {
  id: string;
  label: string;
  keywords: string[];
  tieBreaker: VsSide;
  promptKey?: UseCaseKey | null;
  authoredWinner?: VsSide;
  authoredVerdict?: string;
};

type UseCaseCandidate = {
  label: string;
  keywords: string[];
};

type UseCaseSeed = UseCaseCandidate & {
  winner?: VsSide;
  verdict?: string;
};

const GENERIC_BEST_FOR = ['quick drafts', 'simple edits', 'solo creators'];
const GENERIC_NOT_FOR = ['highly regulated enterprise workflows', 'frame-level editing control needs', 'complex multi-step production pipelines'];
const EMOJI_REGEX = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;

const editorialDecisionGuides: Record<
  string,
  {
    realDecision: string;
    chooseAIf: string;
    chooseBIf: string;
    hiddenTradeoff: string;
    wrongChoiceRegret: string;
  }
> = {
  'heygen-vs-invideo': {
    realDecision:
      'This is a workflow choice, not a generic winner-takes-all comparison. InVideo is built for volume drafts assembled from prompts, stock footage, captions, and voiceover. HeyGen is built for message delivery through a repeatable on-screen presenter.',
    chooseAIf:
      'Choose HeyGen if the viewer needs to see a consistent spokesperson: outbound sales, product education, onboarding, or multilingual updates where presenter continuity matters more than raw content volume.',
    chooseBIf:
      'Choose InVideo if the brief is social output at scale: shorts, faceless explainers, ad variations, or blog-to-video production where speed and media assembly matter more than avatar realism.',
    hiddenTradeoff:
      'HeyGen produces stronger presenter-led output, but you are paying for a narrower format. InVideo covers more content types, but revision-heavy teams can lose efficiency once credits and draft cleanup start piling up.',
    wrongChoiceRegret:
      'Teams regret HeyGen when they only needed captioned stock-video production and end up with higher recurring cost than the workflow requires. They regret InVideo when customer-facing videos later need a believable presenter and stock-first output starts to feel generic.',
  },
  'heygen-vs-synthesia': {
    realDecision:
      'The real split here is agility versus operational stability. HeyGen is usually the more flexible choice for growth, marketing, and fast localization loops. Synthesia is the stronger fit when avatar video is part of a governed training or enterprise communication system.',
    chooseAIf:
      'Choose HeyGen if you want faster iteration across campaigns, more experimentation in avatar-led content, and a workflow owned by revenue or content teams rather than centralized learning ops.',
    chooseBIf:
      'Choose Synthesia if you care more about predictable enterprise rollout: structured training libraries, formal approvals, compliance posture, and a platform that feels designed for scaled business use.',
    hiddenTradeoff:
      'HeyGen can feel more modern and flexible, but cost control becomes important because usage patterns and credits matter. Synthesia is steadier for structured deployment, yet some teams will find it less accommodating when they want social-style experimentation.',
    wrongChoiceRegret:
      'Lean teams regret choosing Synthesia when every small request starts to feel heavier than the content itself. Enterprise teams regret choosing HeyGen when governance, procurement, and repeatable training operations become more important than creative speed.',
  },
  'fliki-vs-heygen': {
    realDecision:
      'This page is really deciding whether your video starts from text or from a presenter. Fliki is a text-first conversion workflow for turning scripts, blogs, and voice-led explainers into video. HeyGen is for when the face on screen changes the message.',
    chooseAIf:
      'Choose Fliki if the source material already exists as text or audio and the priority is getting narrated videos out quickly without paying for an avatar workflow you do not actually need.',
    chooseBIf:
      'Choose HeyGen if the message lands better with a speaker on screen, especially for sales outreach, training, onboarding, or customer communication where presentation style is part of the value.',
    hiddenTradeoff:
      'Fliki is faster and usually cheaper for conversion-style workflows, but the output can feel more like narrated media than a presentation. HeyGen improves presenter-led delivery, but you pay for that format even when a strong voiceover would have been enough.',
    wrongChoiceRegret:
      'Content teams regret HeyGen when the avatar step slows a workflow that should have remained text-first. Sales and training teams regret Fliki when the final video still lacks the credibility and human presence they expected from the project.',
  },
};

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatIsoDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function sanitizeTextForUi(text: string): string {
  return text
    .replace(EMOJI_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeSentence(text: string): string {
  const cleaned = sanitizeTextForUi(text)
    .replace(/^[\s:;.,-]+/g, '')
    .replace(/\s*([.?!,:;])\s*/g, '$1 ')
    .replace(/([.?!,:;]){2,}/g, '$1')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  const sentence = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.?!]$/.test(sentence) ? sentence : `${sentence}.`;
}

function stripLeadChoose(text: string, toolName: string): string {
  return sanitizeTextForUi(text)
    .replace(new RegExp(`^choose\\s+${toolName}\\s+(if|when)\\s+`, 'i'), '')
    .replace(/^use\s+/i, '')
    .replace(/^start with\s+/i, '')
    .trim();
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const normalized = text.toLowerCase();
  return keywords.reduce((total, keyword) => {
    return normalized.includes(keyword.toLowerCase()) ? total + 1 : total;
  }, 0);
}

function pickWinnerForScenario(comparison: VsComparison, scenario: ScenarioConfig): VsSide {
  const textA = [...comparison.bestFor.a, ...comparison.matrixRows.map((row) => row.a)].join(' ').toLowerCase();
  const textB = [...comparison.bestFor.b, ...comparison.matrixRows.map((row) => row.b)].join(' ').toLowerCase();
  const aScore = countKeywordMatches(textA, scenario.keywords);
  const bScore = countKeywordMatches(textB, scenario.keywords);

  if (aScore === bScore) {
    return scenario.tieBreaker;
  }

  return aScore > bScore ? 'a' : 'b';
}

function extractReason(comparison: VsComparison, side: VsSide, keywords: string[]): string {
  const source = comparison.bestFor[side].find((item) => countKeywordMatches(item, keywords) > 0);
  return sanitizeTextForUi(source ?? comparison.bestFor[side][0] ?? 'faster publishing');
}

function normalizeStringArray(values: string[] | undefined, fallbackItems: string[]): string[] {
  const cleaned = (values ?? []).map((item) => sanitizeTextForUi(item)).filter(Boolean);
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 3);
  }
  return dedupe([...cleaned, ...fallbackItems.map((item) => sanitizeTextForUi(item))]).slice(0, 3);
}

function buildToolMeta(slug: string | undefined, fallbackLabel: string): ToolMeta {
  if (!slug) {
    return {
      slug: fallbackLabel.toLowerCase().replace(/\s+/g, '-'),
      name: fallbackLabel,
      logoUrl: null,
      affiliateLink: undefined,
      hasFreeTrial: false,
      data: undefined,
    };
  }

  const tool = getTool(slug);
  return {
    slug,
    name: tool?.name ?? toTitleCase(slug),
    logoUrl: tool?.logo_url,
    affiliateLink: tool?.affiliate_link,
    hasFreeTrial: tool?.has_free_trial ?? false,
    data: tool,
  };
}

function cleanFragment(value: string | undefined): string {
  if (!value) return '';
  return sanitizeTextForUi(value)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.?!;:,]+$/g, '')
    .toLowerCase();
}

function dedupePaths(paths: string[]): string[] {
  return Array.from(new Set(paths.filter(Boolean)));
}

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildPickCardCopy(tool: ToolMeta, bestForList: string[], positioning?: string): string {
  const bestFor = cleanFragment(bestForList[0]);
  const positioningText = cleanFragment(positioning);
  const focus = bestFor || positioningText || 'repeatable video production';

  if (positioningText && positioningText !== focus) {
    return sanitizeSentence(`${tool.name} is a strong fit for ${focus} with a workflow shaped around ${positioningText}`);
  }

  return sanitizeSentence(`${tool.name} is a strong fit for ${focus}`);
}

const USE_CASE_CANDIDATES: UseCaseCandidate[] = [
  { label: 'Avatar spokesperson', keywords: ['avatar', 'spokesperson', 'presenter', 'digital human', 'talking'] },
  { label: 'Editing & captions', keywords: ['editing', 'editor', 'caption', 'subtitles', 'trim'] },
  { label: 'Shorts & social ads', keywords: ['social', 'shorts', 'reels', 'ads', 'template', 'marketing'] },
  { label: 'Script/blog → video', keywords: ['blog', 'script', 'text-to-video', 'article', 'text'] },
  { label: 'Repurpose long-form', keywords: ['repurpose', 'repurposing', 'webinar', 'podcast', 'long-form', 'transcript', 'clips'] },
  { label: 'Localization & dubbing', keywords: ['dubbing', 'localization', 'translate', 'language', 'voiceover'] },
  { label: 'Team workflows', keywords: ['team', 'workspace', 'approval', 'collaboration', 'review'] },
];

function inferKeywordsFromLabel(label: string): string[] {
  const normalized = cleanFragment(label);
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  const mapped = USE_CASE_CANDIDATES.find((candidate) => normalized.includes(cleanFragment(candidate.label)));
  if (mapped) {
    return dedupe([...mapped.keywords, ...tokens]);
  }

  return dedupe(tokens);
}

function getToolSignalText(tool: ToolMeta): string {
  const data = tool.data;
  const parts: string[] = [
    tool.name,
    data?.tagline ?? '',
    data?.short_description ?? '',
    data?.best_for ?? '',
    ...(data?.tags ?? []),
    ...(data?.categories ?? []),
    ...(data?.features ?? []),
    ...(data?.target_audience_list ?? []),
    ...(data?.content?.overview?.useCases?.map((item) => item.title) ?? []),
  ];

  return cleanFragment(parts.join(' '));
}

function buildUseCases(
  toolA: ToolMeta,
  toolB: ToolMeta,
  comparison: VsComparison,
  slugSeed: string,
  tieBreakers: VsSide[],
): ScenarioConfig[] {
  const preferredLabels = getPreferredUseCaseLabels(comparison.intentProfile);

  const fromComparisonRaw: UseCaseSeed[] = [
    ...((comparison.decisionCases ?? []).map((item) => ({
      label: sanitizeTextForUi(item.label),
      keywords: dedupe((item.keywords ?? []).map((keyword) => cleanFragment(keyword)).filter(Boolean)),
      winner: item.winner,
      verdict: item.verdict ? sanitizeTextForUi(item.verdict) : undefined,
    })) ?? []),
    ...((comparison.useCases ?? []).map((label) => ({
      label: sanitizeTextForUi(label),
      keywords: inferKeywordsFromLabel(label),
    })) ?? []),
  ].filter((item) => item.label);

  const directUseCases: UseCaseSeed[] = dedupe(fromComparisonRaw.map((item) => item.label)).map((label) => {
    const found = fromComparisonRaw.find((item) => item.label === label);
    return {
      label,
      keywords: found?.keywords?.length ? found.keywords : inferKeywordsFromLabel(label),
      winner: found?.winner,
      verdict: found?.verdict,
    };
  });

  const toolSignals = `${getToolSignalText(toolA)} ${getToolSignalText(toolB)}`.toLowerCase();
  const matrixSignal = cleanFragment(
    [...comparison.matrixRows.map((row) => `${row.label} ${row.a} ${row.b}`), ...comparison.bestFor.a, ...comparison.bestFor.b].join(
      ' ',
    ),
  );

  const scoredCandidates = USE_CASE_CANDIDATES.map((candidate) => {
    const score = candidate.keywords.reduce((total, keyword) => {
      let points = 0;
      if (toolSignals.includes(keyword)) points += 2;
      if (matrixSignal.includes(keyword)) points += 1;
      return total + points;
    }, 0);
    const tieBreaker = stableHash(`${slugSeed}:${candidate.label}`);
    return { ...candidate, score, tieBreaker };
  })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return left.tieBreaker - right.tieBreaker;
    });

  const fallbackUseCases: UseCaseSeed[] = [
    { label: 'Fast content drafts', keywords: ['fast', 'draft', 'batch', 'output'] },
    { label: 'Polished marketing videos', keywords: ['marketing', 'brand', 'campaign', 'quality'] },
    { label: 'Repeatable publishing workflow', keywords: ['workflow', 'repeatable', 'team', 'process'] },
  ];

  const prioritizedCandidates = preferredLabels
    .map((label) => USE_CASE_CANDIDATES.find((candidate) => candidate.label === label))
    .filter((candidate): candidate is UseCaseSeed => Boolean(candidate));

  const combined: UseCaseSeed[] = [
    ...directUseCases,
    ...prioritizedCandidates,
    ...scoredCandidates.map((item) => ({ label: item.label, keywords: item.keywords })),
    ...fallbackUseCases,
  ];

  const unique: UseCaseSeed[] = [];
  for (const item of combined) {
    if (!item.label) continue;
    const exists = unique.some((existing) => existing.label.toLowerCase() === item.label.toLowerCase());
    if (exists) continue;
    unique.push({
      label: sanitizeTextForUi(item.label),
      keywords: item.keywords.length > 0 ? item.keywords : inferKeywordsFromLabel(item.label),
      ...(item.winner ? { winner: item.winner } : {}),
      ...(item.verdict ? { verdict: item.verdict } : {}),
    });
    if (unique.length === 3) break;
  }

  return unique.map((item, index) => ({
    id: `scenario-use-case-${index + 1}`,
    label: item.label,
    keywords: item.keywords,
    tieBreaker: tieBreakers[index % tieBreakers.length] ?? 'a',
    promptKey: inferUseCaseKey(item.label, item.keywords, `${toolSignals} ${matrixSignal}`),
    authoredWinner: 'winner' in item ? item.winner : undefined,
    authoredVerdict: 'verdict' in item ? item.verdict : undefined,
  }));
}

function normalizePromptVariants(
  variants: VsPromptVariant[] | undefined,
  slugSeed: string,
  toolA: ToolMeta,
  toolB: ToolMeta,
  scenarios: ScenarioConfig[],
): VsPromptVariant[] {
  const fromData = (variants ?? [])
    .map((variant) => ({
      key: sanitizeTextForUi(variant.key),
      title: sanitizeTextForUi(variant.title),
      prompt: sanitizeTextForUi(variant.prompt),
      settings: variant.settings.map((setting) => sanitizeTextForUi(setting)).filter(Boolean),
    }))
    .filter((variant) => variant.key && variant.title && variant.prompt);

  if (fromData.length >= 2) {
    return fromData.slice(0, 3);
  }

  return buildPromptVariants({
    slugSeed,
    toolAName: toolA.name,
    toolBName: toolB.name,
    toolA: toolA.data,
    toolB: toolB.data,
    scenarios,
  });
}

function getFallbackComparisonLinks(currentSlug: string, slugA: string, slugB: string): string[] {
  const existing = listVsSlugs();
  const related = existing.filter(
    (slug) =>
      slug !== currentSlug &&
      (slug.startsWith(`${slugA}-vs-`) ||
        slug.endsWith(`-vs-${slugA}`) ||
        slug.startsWith(`${slugB}-vs-`) ||
        slug.endsWith(`-vs-${slugB}`)),
  );

  if (related.length >= 4) {
    return related.slice(0, 4).map((slug) => `/vs/${slug}`);
  }

  const fallback: string[] = [...related];
  const toolSlugs = getAllTools().map((tool) => tool.slug).filter((slug) => slug !== slugA && slug !== slugB);

  for (const candidate of toolSlugs.slice(0, 8)) {
    fallback.push(toCanonicalVsSlug(slugA, candidate));
    fallback.push(toCanonicalVsSlug(slugB, candidate));
    if (fallback.length >= 10) break;
  }

  return dedupe(fallback)
    .filter((slug) => slug !== currentSlug)
    .slice(0, 4)
    .map((slug) => `/vs/${slug}`);
}

function buildBestForFallback(slug: string): string[] {
  const tool = getTool(slug);
  const fromTool = dedupe([tool?.best_for ?? '', ...(tool?.pros ?? []).slice(0, 2)]);
  return normalizeStringArray(fromTool, GENERIC_BEST_FOR);
}

function buildNotForFallback(slug: string): string[] {
  const tool = getTool(slug);
  const fromTool = dedupe([...(tool?.cons ?? []).slice(0, 3)]);
  return normalizeStringArray(fromTool, GENERIC_NOT_FOR);
}

function normalizeDomainForMatch(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, '');
}

function extractSourceDomainItems(comparison: VsComparison): Array<{ domain: string; url: string }> {
  const domainToUrl = new Map<string, string>();
  for (const url of collectComparisonSourceUrls(comparison)) {
    const domain = getSourceDomain(url);
    if (!domainToUrl.has(domain)) {
      domainToUrl.set(domain, url);
    }
  }

  return Array.from(domainToUrl.entries()).map(([domain, url]) => ({ domain, url }));
}

function getToolDomainCandidates(tool: ToolMeta): string[] {
  const candidates = new Set<string>();
  const normalizedSlug = tool.slug.toLowerCase();
  const slugNoHyphen = normalizedSlug.replace(/-/g, '');
  const nameNoSpace = tool.name.toLowerCase().replace(/\s+/g, '');

  candidates.add(normalizedSlug);
  candidates.add(slugNoHyphen);
  candidates.add(nameNoSpace);

  if (tool.affiliateLink) {
    try {
      const host = new URL(tool.affiliateLink).hostname.replace(/^www\./, '');
      candidates.add(host);
    } catch {
      // Ignore malformed URLs from dataset.
    }
  }

  return Array.from(candidates).filter(Boolean);
}

function rankDomainAgainstTool(domain: string, tool: ToolMeta): number {
  const normalizedDomain = normalizeDomainForMatch(domain);
  const candidates = getToolDomainCandidates(tool);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeDomainForMatch(candidate);
    if (!normalizedCandidate) continue;
    if (normalizedDomain === normalizedCandidate) return 3;
    if (normalizedDomain.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedDomain)) return 2;
  }

  const slugToken = tool.slug.toLowerCase().replace(/-/g, '');
  if (slugToken && normalizedDomain.replace(/[-.]/g, '').includes(slugToken)) return 1;
  return 0;
}

function sortSourceDomainsByRelevance(
  sourceItems: Array<{ domain: string; url: string }>,
  toolA: ToolMeta,
  toolB: ToolMeta,
): Array<{ domain: string; url: string }> {
  return [...sourceItems].sort((left, right) => {
    const leftA = rankDomainAgainstTool(left.domain, toolA);
    const leftB = rankDomainAgainstTool(left.domain, toolB);
    const rightA = rankDomainAgainstTool(right.domain, toolA);
    const rightB = rankDomainAgainstTool(right.domain, toolB);

    const leftScore = leftA * 10 + leftB;
    const rightScore = rightA * 10 + rightB;

    if (leftScore !== rightScore) return rightScore - leftScore;
    return left.domain.localeCompare(right.domain);
  });
}

function ensureTemplateComparison(base: VsComparison | null, currentSlug: string, toolA: ToolMeta, toolB: ToolMeta): VsComparison {
  const parsed = parseVsSlug(currentSlug);
  const slugA = base?.slugA ?? parsed?.slugA ?? toolA.slug;
  const slugB = base?.slugB ?? parsed?.slugB ?? toolB.slug;
  const sameSlug = toCanonicalVsSlug(slugA, slugB);

  const baseRows = base?.matrixRows ?? [];
  const rowMap = new Map(baseRows.map((row) => [row.label.toLowerCase(), row]));
  const filledRows = DECISION_TABLE_ROWS.map((label) => {
    return (
      rowMap.get(label.toLowerCase()) ?? {
        label,
        a: `See ${toolA.name} docs`,
        b: `See ${toolB.name} docs`,
      }
    );
  });
  const matrixRows = toVsDiffRows(buildDecisionTableRows(filledRows, slugA, slugB));

  const keyDiffs = base?.keyDiffs?.length
    ? base.keyDiffs
    : [
        { label: 'Positioning', a: `${toolA.name} positioning pending`, b: `${toolB.name} positioning pending` },
        { label: 'Pricing', a: 'Pending verification', b: 'Pending verification' },
        { label: 'Workflow', a: 'Pending verification', b: 'Pending verification' },
        { label: 'Output style', a: 'Pending verification', b: 'Pending verification' },
      ];

  const normalizedScore = normalizeInternalScore(
    {
      methodNote:
        base?.score?.methodNote ??
        'Internal score computed from pricing value (25%), ease (20%), speed (20%), output quality (20%), and customization (15%).',
      weights: base?.score?.weights ?? {},
      a: base?.score?.a ?? {},
      b: base?.score?.b ?? {},
      provenance: base?.score?.provenance ?? {
        mode: 'estimated',
        coverage: {},
        rationale: {},
        sources: {},
      },
    },
    [...matrixRows, ...keyDiffs],
    slugA,
    slugB,
  );
  const calibratedScore = applyFeaturedCalibration(normalizedScore, slugA, slugB);

  return {
    slugA,
    slugB,
    updatedAt: base?.updatedAt ?? todayIso(),
    pricingCheckedAt: base?.pricingCheckedAt ?? todayIso(),
    intentProfile: applyIntentProfileOverride(
      base?.intentProfile ?? buildIntentProfile(toolA.data, toolB.data, base),
      slugA,
      slugB,
    ),
    shortAnswer: {
      a: base?.shortAnswer?.a ?? `${toolA.name} is suited to fast-moving content teams and creators.`,
      b: base?.shortAnswer?.b ?? `${toolB.name} is suited to teams prioritizing repeatable video workflows.`,
    },
    bestFor: {
      a: normalizeStringArray(base?.bestFor?.a, buildBestForFallback(slugA)),
      b: normalizeStringArray(base?.bestFor?.b, buildBestForFallback(slugB)),
    },
    notFor: {
      a: normalizeStringArray(base?.notFor?.a, buildNotForFallback(slugA)),
      b: normalizeStringArray(base?.notFor?.b, buildNotForFallback(slugB)),
    },
    keyDiffs,
    matrixRows,
    score: calibratedScore,
    promptBox: {
      prompt:
        base?.promptBox?.prompt ??
        `Create a 45-second product update video comparing ${toolA.name} and ${toolB.name}. Include one hook, three benefits, and one CTA.`,
      settings: base?.promptBox?.settings?.length
        ? base.promptBox.settings
        : ['Duration: 45s', 'Format: 16:9', 'Language: English', 'Output: MP4 1080p', 'Tone: professional'],
      variants: base?.promptBox?.variants ?? [],
    },
    verdict: {
      winnerPrice: base?.verdict?.winnerPrice ?? 'a',
      winnerQuality: base?.verdict?.winnerQuality ?? 'b',
      winnerSpeed: base?.verdict?.winnerSpeed ?? 'a',
      recommendation:
        base?.verdict?.recommendation ??
        `Use ${toolA.name} if you prioritize its strengths in this table, and choose ${toolB.name} when those workflow tradeoffs fit your team better.`,
    },
    related: {
      toolPages: dedupePaths(
        base?.related?.toolPages?.length
          ? base.related.toolPages.slice(0, 2)
          : [`/tool/${slugA}`, `/tool/${slugB}`],
      ),
      alternatives: dedupePaths(
        base?.related?.alternatives?.length
          ? base.related.alternatives.slice(0, 2)
          : [`/tool/${slugA}/alternatives`, `/tool/${slugB}/alternatives`],
      ),
      comparisons:
        dedupePaths(
          (
            base?.related?.comparisons?.length && base.related.comparisons.length >= 4
              ? base.related.comparisons.slice(0, 6)
              : getFallbackComparisonLinks(sameSlug, slugA, slugB)
          ).map((path) => canonicalizeVsHref(path)),
        ),
    },
    disclosure:
      base?.disclosure ??
      'This comparison is generated from structured product data and updated on a rolling basis as source-backed details are attached.',
  };
}

function labelForPath(path: string): string {
  const normalizedPath = canonicalizeVsHref(path);

  if (normalizedPath.startsWith('/tool/')) {
    const [, , slug, subPath] = normalizedPath.split('/');
    const tool = getTool(slug);
    if (subPath === 'alternatives') {
      return `${tool?.name ?? toTitleCase(slug)} Alternatives`;
    }
    return `${tool?.name ?? toTitleCase(slug)} Full Review`;
  }

  if (normalizedPath.startsWith('/vs/')) {
    const slug = normalizedPath.replace('/vs/', '');
    const parsed = parseVsSlug(slug);
    if (!parsed) return toTitleCase(slug);
    const toolA = getTool(parsed.slugA);
    const toolB = getTool(parsed.slugB);
    return `${toolA?.name ?? toTitleCase(parsed.slugA)} vs ${toolB?.name ?? toTitleCase(parsed.slugB)}`;
  }

  return normalizedPath;
}

export default function VsPageTemplate({ load, resolved, showDebug = false }: VsPageTemplateProps) {
  const parsed = load.parsed ?? parseVsSlug(resolved.slug);
  const toolA = buildToolMeta(parsed?.slugA, 'Tool A');
  const toolB = buildToolMeta(parsed?.slugB, 'Tool B');
  const comparison = ensureTemplateComparison(load.comparison, resolved.slug, toolA, toolB);
  const isFull = load.status === 'FULL';
  const seoYear = getSEOCurrentYear();
  const updated = formatIsoDate(comparison.updatedAt);
  const pricingChecked = formatIsoDate(comparison.pricingCheckedAt);
  const verificationDomains = sortSourceDomainsByRelevance(extractSourceDomainItems(comparison), toolA, toolB);
  const slugSeed = toCanonicalVsSlug(comparison.slugA, comparison.slugB);
  const editorialDecisionGuide = editorialDecisionGuides[slugSeed];
  const keyDiffLead = getKeyDiffLead(comparison.intentProfile, toolA.name, toolB.name);
  const orderedKeyDiffs = orderKeyDiffsForIntent(comparison.keyDiffs, comparison.intentProfile);
  const cardTextA = sanitizeSentence(
    isFull && comparison.shortAnswer.a
      ? comparison.shortAnswer.a
      : buildPickCardCopy(toolA, comparison.bestFor.a, toolA.data?.best_for),
  );
  const cardTextB = sanitizeSentence(
    isFull && comparison.shortAnswer.b
      ? comparison.shortAnswer.b
      : buildPickCardCopy(toolB, comparison.bestFor.b, toolB.data?.best_for),
  );

  const priceWinner = derivePriceWinnerFromDecisionTable(comparison.matrixRows, comparison.score);
  const scoreVerdict = computeInternalScoreVerdict(comparison.score, undefined, priceWinner);
  const tieBreakers: VsSide[] = [
    scoreVerdict.winnerQuality === 'tie' ? 'a' : scoreVerdict.winnerQuality,
    scoreVerdict.winnerSpeed === 'tie' ? 'a' : scoreVerdict.winnerSpeed,
    priceWinner === 'tie' ? 'a' : priceWinner,
  ];
  const scenarios = buildUseCases(toolA, toolB, comparison, slugSeed, tieBreakers);
  const promptVariants = normalizePromptVariants(comparison.promptBox.variants, slugSeed, toolA, toolB, scenarios);
  const defaultPromptKey = scenarios[0]?.promptKey ?? promptVariants[0]?.key ?? null;

  const scenarioConclusions = scenarios.map((scenario) => {
    const winner = scenario.authoredWinner ?? pickWinnerForScenario(comparison, scenario);
    const winnerName = winner === 'a' ? toolA.name : toolB.name;
    const reason = extractReason(comparison, winner, scenario.keywords);

    return {
      ...scenario,
      winnerName,
      sentence: sanitizeTextForUi(
        scenario.authoredVerdict ??
          `${winnerName} is the stronger fit here because it is better aligned with ${reason.toLowerCase()}.`,
      ),
    };
  });

  const winnerLabel = (winner: ScoreWinner) => {
    if (winner === 'tie') return 'Both';
    return winner === 'a' ? toolA.name : toolB.name;
  };
  const recommendationText =
    comparison.verdict?.recommendation?.trim()
      ? sanitizeTextForUi(comparison.verdict.recommendation)
      : scoreVerdict.overallWinner === 'close'
        ? `Close call on weighted internal score (${formatInternalScore(scoreVerdict.weightedTotalA)} vs ${formatInternalScore(scoreVerdict.weightedTotalB)}). Choose ${toolA.name} when ${sanitizeTextForUi(
            comparison.shortAnswer.a.toLowerCase(),
          )}. Choose ${toolB.name} when ${sanitizeTextForUi(comparison.shortAnswer.b.toLowerCase())}.`
        : `Our recommendation: ${
            scoreVerdict.overallWinner === 'a' ? toolA.name : toolB.name
          } based on weighted internal score (${formatInternalScore(scoreVerdict.weightedTotalA)} vs ${formatInternalScore(
            scoreVerdict.weightedTotalB,
          )}).`;
  const fallbackFaqItems = [
    {
      question: `${toolA.name} vs ${toolB.name}: which should I choose first?`,
      answer: `Choose ${toolA.name} if you need ${stripLeadChoose(comparison.shortAnswer.a, toolA.name)}. Choose ${toolB.name} if you need ${stripLeadChoose(comparison.shortAnswer.b, toolB.name)}.`,
    },
    {
      question: `What is the main workflow difference?`,
      answer: comparison.keyDiffs[0]
        ? `${toolA.name}: ${sanitizeTextForUi(comparison.keyDiffs[0].a)} ${toolB.name}: ${sanitizeTextForUi(comparison.keyDiffs[0].b)}`
        : `${toolA.name} and ${toolB.name} differ most in workflow, output style, and team fit.`,
    },
    {
      question: `Can a team use both tools in one workflow?`,
      answer: `Yes. Many teams use one tool for volume drafts or stock-scene production and another for presenter-led delivery or higher-trust communication.`,
    },
  ];
  const faqItems =
    comparison.faq && comparison.faq.length >= 3
      ? comparison.faq.slice(0, 6).map((item) => ({
          question: sanitizeTextForUi(item.question),
          answer: sanitizeTextForUi(item.answer),
        }))
      : fallbackFaqItems;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs toolA={toolA.name} toolB={toolB.name} />
          <div className="mb-6 flex items-center justify-center gap-8">
            <ToolLogo logoUrl={toolA.logoUrl} toolName={toolA.name} size="xl" />
            <div className="text-3xl font-bold text-gray-400">VS</div>
            <ToolLogo logoUrl={toolB.logoUrl} toolName={toolB.name} size="xl" />
          </div>
          <h1 className="mx-auto max-w-4xl text-center text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            {comparison.decisionSummary ? `${toolA.name} vs ${toolB.name}: Which should you choose?` : `${toolA.name} vs ${toolB.name}: ${seoYear} AI Video Generator Comparison Report`}
          </h1>
          {comparison.decisionSummary ? (
            <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-7 text-gray-600">
              {comparison.decisionSummary}
            </p>
          ) : null}
          <DecisionPanel scenarios={scenarios.map(({ id, label, promptKey }) => ({ id, label, promptKey }))} />
          <div className="mt-4 flex justify-center">
            <Link
              href="/features"
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 active:translate-y-0"
            >
              Not sure this is the right pair? Browse by workflow first
              <span className="ml-2">→</span>
            </Link>
          </div>
          <div className="mx-auto mt-6 grid max-w-4xl gap-4 md:grid-cols-2">
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700 shadow-sm shadow-gray-100/60">
              <strong>{toolA.name}:</strong> {cardTextA}
            </p>
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700 shadow-sm shadow-gray-100/60">
              <strong>{toolB.name}:</strong> {cardTextB}
            </p>
          </div>
          <p className="mt-4 text-center text-xs text-gray-500">
            Updated {updated}. Pricing checked {pricingChecked}.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {comparison.editorialNotes &&
        (comparison.editorialNotes.whyPeopleCompareTheseTools ||
          comparison.editorialNotes.looksSimilarButActuallyDifferent ||
          comparison.editorialNotes.editorsTake ||
          comparison.editorialNotes.chooseAIf ||
          comparison.editorialNotes.chooseBIf ||
          comparison.editorialNotes.hiddenTradeOff ||
          comparison.editorialNotes.whoWillRegretTheWrongChoice) ? (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {comparison.editorialNotes.whyPeopleCompareTheseTools ? (
                <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Why people compare HeyGen and InVideo</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {comparison.editorialNotes.whyPeopleCompareTheseTools}
                  </p>
                </article>
              ) : null}
              {comparison.editorialNotes.looksSimilarButActuallyDifferent ? (
                <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">They look similar, but the workflow is not</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {comparison.editorialNotes.looksSimilarButActuallyDifferent}
                  </p>
                </article>
              ) : null}
            </div>

            {comparison.editorialNotes.editorsTake ? (
              <article className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Editor&apos;s take</p>
                <p className="mt-3 text-sm leading-6 text-gray-700">{comparison.editorialNotes.editorsTake}</p>
              </article>
            ) : null}

            {(comparison.editorialNotes.chooseAIf || comparison.editorialNotes.chooseBIf) ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {comparison.editorialNotes.chooseAIf ? (
                  <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <h2 className="text-lg font-semibold text-gray-900">Choose {toolA.name} if</h2>
                    <p className="mt-3 text-sm leading-6 text-gray-700">{comparison.editorialNotes.chooseAIf}</p>
                  </article>
                ) : null}
                {comparison.editorialNotes.chooseBIf ? (
                  <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <h2 className="text-lg font-semibold text-gray-900">Choose {toolB.name} if</h2>
                    <p className="mt-3 text-sm leading-6 text-gray-700">{comparison.editorialNotes.chooseBIf}</p>
                  </article>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {comparison.editorialNotes.hiddenTradeOff ? (
                <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Hidden trade-off</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{comparison.editorialNotes.hiddenTradeOff}</p>
                </article>
              ) : null}
              {comparison.editorialNotes.whoWillRegretTheWrongChoice ? (
                <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Who will regret the wrong choice</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {comparison.editorialNotes.whoWillRegretTheWrongChoice}
                  </p>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}

        <VsDecisionTable comparison={comparison} toolAName={toolA.name} toolBName={toolB.name} />

        <section className="grid gap-4 md:grid-cols-3">
          {scenarioConclusions.map((scenario) => (
            <article
              key={scenario.id}
              id={scenario.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-100/60 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md hover:shadow-gray-200/70"
            >
              <p className="text-xs font-semibold tracking-wide text-gray-500">{sanitizeTextForUi(scenario.label)}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">Winner: {scenario.winnerName}</p>
              <p data-conclusion="true" className="mt-2 rounded-md px-1 py-1 text-sm text-gray-700 transition-all">
                {scenario.sentence}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900">Where the workflows split</h2>
          <p className="mt-2 text-sm text-gray-600">{keyDiffLead}</p>
          <div className="mt-5 space-y-4">
            {orderedKeyDiffs.map((diff) => (
              <article key={diff.label} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm shadow-gray-100/50 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md hover:shadow-gray-200/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Difference</p>
                    <h3 className="mt-1 text-base font-semibold text-gray-900">{diff.label}</h3>
                  </div>
                  <SourceTooltip
                    id={`keydiff-${diff.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    label={diff.label}
                    toolAName={toolA.name}
                    toolBName={toolB.name}
                    sources={resolveRowSourcesForTools(diff, comparison.slugA, comparison.slugB)}
                    pricingCheckedAt={comparison.pricingCheckedAt}
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{toolA.name}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{diff.a}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{toolB.name}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{diff.b}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900">Best fit and poor fit</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">{toolA.name}</h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Best for</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
                    {comparison.bestFor.a.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <span>{sanitizeTextForUi(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Not for</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
                    {comparison.notFor.a.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-300" />
                        <span>{sanitizeTextForUi(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
            <article className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">{toolB.name}</h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Best for</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
                    {comparison.bestFor.b.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <span>{sanitizeTextForUi(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Not for</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
                    {comparison.notFor.b.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-300" />
                        <span>{sanitizeTextForUi(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Final recommendation</h2>
            {comparison.score.provenance.mode !== 'verified' ? (
              <Link
                href="/methodology#scoring"
                className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Estimated
              </Link>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm hover:shadow-green-100/70">
              <p className="text-sm font-semibold text-gray-900">Winner for Price</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{winnerLabel(priceWinner)}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm hover:shadow-blue-100/70">
              <p className="text-sm font-semibold text-gray-900">Winner for Quality</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{winnerLabel(scoreVerdict.winnerQuality)}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm hover:shadow-amber-100/70">
              <p className="text-sm font-semibold text-gray-900">Winner for Speed</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{winnerLabel(scoreVerdict.winnerSpeed)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-700">{recommendationText}</p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900">Common buyer questions</h2>
          <div className="mt-4 space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900">{item.question}</h3>
                <p className="mt-2 text-sm text-gray-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {!comparison.editorialNotes && editorialDecisionGuide ? (
          <EditorialDecisionGuide
            toolAName={toolA.name}
            toolBName={toolB.name}
            realDecision={editorialDecisionGuide.realDecision}
            chooseAIf={editorialDecisionGuide.chooseAIf}
            chooseBIf={editorialDecisionGuide.chooseBIf}
            hiddenTradeoff={editorialDecisionGuide.hiddenTradeoff}
            wrongChoiceRegret={editorialDecisionGuide.wrongChoiceRegret}
          />
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white/80 p-5">
          <PromptBox variants={promptVariants} defaultVariantKey={defaultPromptKey} />
        </section>

        <details className="rounded-xl border border-gray-200 bg-gray-50/40 p-5">
          <summary className="cursor-pointer list-none text-lg font-semibold text-gray-900 marker:hidden transition-colors duration-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2">Supporting score model</summary>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Internal score is supporting material only. The editorial verdict above should be the primary buying guide for this pair.
          </p>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <VsScoreChart toolAName={toolA.name} toolBName={toolB.name} score={comparison.score} />
          </div>
        </details>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <details>
            <summary className="cursor-pointer text-base font-semibold text-gray-900">Sources &amp; verification</summary>
            <div className="mt-3 space-y-3 text-sm text-gray-700">
              <p>Pricing checked {pricingChecked}.</p>
              {!isFull ? (
                <p className="text-gray-600">
                  Some rows are inferred from structured tool data. Primary sources are attached row by row.
                </p>
              ) : null}
              {verificationDomains.length > 0 ? (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {verificationDomains.map((item) => (
                    <li key={`${item.domain}-${item.url}`} className="truncate">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-indigo-600 transition-colors duration-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
                      >
                        {item.domain}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No verified source yet.</p>
              )}
              <Link href="/methodology" className="inline-block font-medium text-indigo-600 transition-colors duration-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2">
                Read methodology →
              </Link>
            </div>
          </details>
        </section>

        {showDebug ? (
          <section className="rounded-xl border border-slate-300 bg-slate-50 p-4">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">Debug</summary>
              <div className="mt-3 space-y-1 text-xs text-slate-700">
                <p>
                  <strong>status:</strong> {load.status}
                </p>
                <p>
                  <strong>source:</strong> {load.source ?? 'none'}
                </p>
                <p>
                  <strong>reason:</strong> {load.reason ?? 'none'}
                </p>
                <p>
                  <strong>normalizedSlug:</strong> {load.normalizedSlug ?? 'none'}
                </p>
                <p>
                  <strong>indexHit:</strong> {String(load.indexHit ?? false)}
                </p>
                <p>
                  <strong>hitSource:</strong> {load.hitSource ?? 'none'}
                </p>
                <p>
                  <strong>schemaErrorsCount:</strong> {load.errors?.length ?? 0}
                </p>
                {(load.schemaErrorSummary ?? []).length > 0 ? (
                  <ul className="list-disc pl-5">
                    {(load.schemaErrorSummary ?? []).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>
          </section>
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900">Related Pages</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Tool pages</p>
              <ul className="mt-2 space-y-1">
                {comparison.related.toolPages.slice(0, 2).map((path) => (
                  <li key={path}>
                    <Link href={path} className="inline-flex items-center rounded-md px-1 py-1 text-sm text-indigo-600 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2">
                      {labelForPath(path)} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Alternatives</p>
              <ul className="mt-2 space-y-1">
                {comparison.related.alternatives.slice(0, 2).map((path) => (
                  <li key={path}>
                    <Link href={path} className="inline-flex items-center rounded-md px-1 py-1 text-sm text-indigo-600 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2">
                      {labelForPath(path)} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Comparisons</p>
              <ul className="mt-2 space-y-1">
                {comparison.related.comparisons.slice(0, 6).map((path) => (
                  <li key={path}>
                    <Link href={path} className="inline-flex items-center rounded-md px-1 py-1 text-sm text-indigo-600 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2">
                      {labelForPath(path)} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Disclosure</h2>
          <p className="mt-2 text-sm text-gray-700">{comparison.disclosure}</p>
          <Link href="/methodology" className="mt-3 inline-block rounded-md px-1 py-1 text-sm font-medium text-indigo-600 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2">
            Read our methodology →
          </Link>
        </section>

        <section className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to Choose?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-indigo-100">
            Test each tool directly with your own prompt and workflow constraints.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <ToolLogo logoUrl={toolA.logoUrl} toolName={toolA.name} size="sm" />
              <CTAButton affiliateLink={toolA.affiliateLink} hasFreeTrial={toolA.hasFreeTrial} text={`Try ${toolA.name}`} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <ToolLogo logoUrl={toolB.logoUrl} toolName={toolB.name} size="sm" />
              <CTAButton affiliateLink={toolB.affiliateLink} hasFreeTrial={toolB.hasFreeTrial} text={`Try ${toolB.name}`} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

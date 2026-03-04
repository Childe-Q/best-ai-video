import fs from 'fs';
import path from 'path';
import { getAllTools } from '@/lib/getTool';
import { mapToolNameToSlug } from '@/lib/alternatives/mapToolNameToSlug';
import { AlternativesDeepDive, AlternativesFaq } from '@/types/alternativesLongform';

type ScrapedSection = {
  heading?: string;
  content?: string;
  type?: string;
};

type ScrapedDocument = {
  sourceUrl?: string;
  title?: string;
  sections?: ScrapedSection[];
  rawText?: string;
};

type ScrapedToolSignals = {
  introNotes: string[];
  bestFor: string[];
  capabilities: string[];
  tradeoffs: string[];
  pricing: string[];
  sourceUrls: string[];
};

type ScrapedBaseSignals = {
  tools: Map<string, ScrapedToolSignals>;
  faqs: AlternativesFaq[];
};

type ScrapedIndex = Map<string, ScrapedBaseSignals>;

export type FillLongformFromScrapedInput = {
  baseSlug: string;
  deepDives: AlternativesDeepDive[];
  moreAlternatives?: AlternativesDeepDive[];
  faqs: AlternativesFaq[];
};

export type FillLongformFromScrapedOutput = {
  deepDives: AlternativesDeepDive[];
  moreAlternatives: AlternativesDeepDive[];
  faqs: AlternativesFaq[];
};

const MAX_BULLETS = 3;
const MAX_TRADEOFFS = 2;
const MAX_PRICING_NOTES = 2;
const MAX_SOURCES = 8;
const MAX_FAQS = 10;

const BASE_SLUG_ALIASES: Record<string, string> = {
  did: 'd-id',
  deepbrain: 'deepbrain-ai',
  veed: 'veed-io',
};

const TOOL_SLUG_ALIASES: Record<string, string> = {
  did: 'd-id',
  'd-id': 'd-id',
  'deepbrain ai': 'deepbrain-ai',
  deepbrain: 'deepbrain-ai',
  'veed.io': 'veed-io',
  veedio: 'veed-io',
  veed: 'veed-io',
  'runway ml': 'runway',
  runwayml: 'runway',
  'invideo ai': 'invideo',
  zebra: 'zebracat',
  'zebra cat': 'zebracat',
  'elai.io': 'elai-io',
};

const PLACEHOLDER_PATTERNS = [
  /need verification/i,
  /strong fit for/i,
  /general ai video workflows/i,
  /latest docs and review/i,
  /tbd/i,
  /^verify$/i,
];

let cachedScrapedIndex: ScrapedIndex | null = null;

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cleanText(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => cleanText(line))
    .filter(Boolean);
}

function splitBulletLines(content: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);

  const bullets = lines
    .map((line) => line.replace(/^[-*•\u2022]+\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter((line) => line.length > 0 && line.length <= 220);

  return uniqueStrings(bullets);
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function isPlaceholderText(value?: string | null): boolean {
  const cleaned = cleanText(value);
  if (!cleaned) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(cleaned));
}

function extractToolNameFromHeading(heading: string): string | null {
  const cleaned = cleanText(heading);
  if (!cleaned) return null;

  const numbered = cleaned.match(/^\d+\s*[.)-]?\s*(.+)$/);
  if (!numbered) return null;

  const remainder = numbered[1];
  const candidate = remainder
    .split(/[:\-–—|]/)[0]
    .replace(/\((.*?)\)/g, ' ')
    .trim();

  return candidate.length > 1 ? candidate : null;
}

function looksLikeCapabilityHeading(heading: string): boolean {
  const normalized = normalizeKey(heading);
  return (
    normalized.includes('key feature')
    || normalized.includes('key capabilit')
    || normalized === 'pros'
    || normalized.includes('feature')
  );
}

function looksLikeTradeoffHeading(heading: string): boolean {
  const normalized = normalizeKey(heading);
  return normalized === 'cons' || normalized.includes('weakness') || normalized.includes('trade off');
}

function looksLikeBestForHeading(heading: string): boolean {
  const normalized = normalizeKey(heading);
  return normalized.includes('best use case') || normalized.includes('best for');
}

function looksLikePricingHeading(heading: string): boolean {
  const normalized = normalizeKey(heading);
  return normalized.includes('pricing') || normalized.includes('plan');
}

function normalizeToolSlug(rawValue: string, siteSlugs: Set<string>): string | null {
  const cleaned = cleanText(rawValue);
  if (!cleaned) return null;

  const alias = TOOL_SLUG_ALIASES[normalizeKey(cleaned)] || TOOL_SLUG_ALIASES[normalizeSlug(cleaned)];
  if (alias && siteSlugs.has(alias)) {
    return alias;
  }

  const mapped = mapToolNameToSlug(cleaned);
  if (mapped && siteSlugs.has(mapped)) {
    return mapped;
  }

  const slugCandidate = normalizeSlug(cleaned);
  if (siteSlugs.has(slugCandidate)) {
    return slugCandidate;
  }

  const withoutAi = slugCandidate.replace(/-ai$/g, '');
  if (siteSlugs.has(withoutAi)) {
    return withoutAi;
  }

  const withAi = `${slugCandidate}-ai`;
  if (siteSlugs.has(withAi)) {
    return withAi;
  }

  return null;
}

function parseFaqCandidatesFromDocument(baseToolName: string, doc: ScrapedDocument): AlternativesFaq[] {
  const candidates: AlternativesFaq[] = [];

  for (const section of doc.sections || []) {
    const heading = cleanText(section.heading);
    const content = cleanText(section.content);
    if (!heading || !content) continue;

    if (heading.includes('?')) {
      candidates.push({
        question: heading,
        answer: splitSentences(content).slice(0, 2).join(' '),
      });
      continue;
    }

    const normalized = normalizeKey(heading);
    if (normalized.startsWith('why look for')) {
      candidates.push({
        question: `Why consider alternatives to ${baseToolName}?`,
        answer: splitSentences(content).slice(0, 2).join(' '),
      });
      continue;
    }

    if (normalized.startsWith('what to look for')) {
      candidates.push({
        question: `What should I evaluate when choosing a ${baseToolName} alternative?`,
        answer: splitSentences(content).slice(0, 2).join(' '),
      });
      continue;
    }

    if (normalized.startsWith('which') && normalized.includes('right for you')) {
      candidates.push({
        question: `${heading.replace(/[.\s]+$/g, '')}?`,
        answer: splitSentences(content).slice(0, 2).join(' '),
      });
    }
  }

  return uniqueFaqs(candidates).slice(0, 6);
}

function uniqueFaqs(faqs: AlternativesFaq[]): AlternativesFaq[] {
  const seen = new Set<string>();
  const result: AlternativesFaq[] = [];

  for (const faq of faqs) {
    const question = cleanText(faq.question);
    const answer = cleanText(faq.answer);
    if (!question || !answer) continue;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ question, answer });
  }

  return result;
}

function findScraperOutputDir(): string | null {
  const candidates = [
    path.join(process.cwd(), 'research_scraper', 'output'),
    path.join(process.cwd(), '..', 'research_scraper', 'output'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function createEmptyToolSignals(sourceUrl?: string): ScrapedToolSignals {
  return {
    introNotes: [],
    bestFor: [],
    capabilities: [],
    tradeoffs: [],
    pricing: [],
    sourceUrls: sourceUrl ? [sourceUrl] : [],
  };
}

function mergeToolSignals(target: ScrapedToolSignals, patch: Partial<ScrapedToolSignals>): ScrapedToolSignals {
  return {
    introNotes: uniqueStrings([...(target.introNotes || []), ...(patch.introNotes || [])]),
    bestFor: uniqueStrings([...(target.bestFor || []), ...(patch.bestFor || [])]),
    capabilities: uniqueStrings([...(target.capabilities || []), ...(patch.capabilities || [])]),
    tradeoffs: uniqueStrings([...(target.tradeoffs || []), ...(patch.tradeoffs || [])]),
    pricing: uniqueStrings([...(target.pricing || []), ...(patch.pricing || [])]),
    sourceUrls: uniqueStrings([...(target.sourceUrls || []), ...(patch.sourceUrls || [])]),
  };
}

function parseDocumentToolSignals(doc: ScrapedDocument, siteSlugs: Set<string>): Map<string, ScrapedToolSignals> {
  const byToolSlug = new Map<string, ScrapedToolSignals>();
  const sections = doc.sections || [];

  let currentSlug: string | null = null;

  const appendSignal = (slug: string, patch: Partial<ScrapedToolSignals>) => {
    const existing = byToolSlug.get(slug) || createEmptyToolSignals(doc.sourceUrl);
    byToolSlug.set(slug, mergeToolSignals(existing, patch));
  };

  sections.forEach((section) => {
    const heading = cleanText(section.heading);
    const content = cleanText(section.content);

    if (!heading) return;

    const toolNameCandidate = extractToolNameFromHeading(heading);
    if (toolNameCandidate) {
      const mappedSlug = normalizeToolSlug(toolNameCandidate, siteSlugs);
      currentSlug = mappedSlug;
      if (mappedSlug) {
        const introNotes = content ? splitSentences(content).slice(0, 2) : [];
        appendSignal(mappedSlug, {
          introNotes,
          sourceUrls: doc.sourceUrl ? [doc.sourceUrl] : [],
        });
      }
      return;
    }

    if (!currentSlug) return;

    if (looksLikeCapabilityHeading(heading)) {
      appendSignal(currentSlug, {
        capabilities: splitBulletLines(content),
        sourceUrls: doc.sourceUrl ? [doc.sourceUrl] : [],
      });
      return;
    }

    if (looksLikeTradeoffHeading(heading)) {
      appendSignal(currentSlug, {
        tradeoffs: splitBulletLines(content),
        sourceUrls: doc.sourceUrl ? [doc.sourceUrl] : [],
      });
      return;
    }

    if (looksLikeBestForHeading(heading)) {
      const bestForNotes = splitBulletLines(content);
      appendSignal(currentSlug, {
        bestFor: bestForNotes.length > 0 ? bestForNotes : splitSentences(content).slice(0, 2),
        sourceUrls: doc.sourceUrl ? [doc.sourceUrl] : [],
      });
      return;
    }

    if (looksLikePricingHeading(heading)) {
      const pricingNotes = splitBulletLines(content);
      appendSignal(currentSlug, {
        pricing: pricingNotes.length > 0 ? pricingNotes : splitSentences(content).slice(0, MAX_PRICING_NOTES),
        sourceUrls: doc.sourceUrl ? [doc.sourceUrl] : [],
      });
      return;
    }

    if (section.type === 'tool_details' && content) {
      appendSignal(currentSlug, {
        capabilities: splitBulletLines(content),
        sourceUrls: doc.sourceUrl ? [doc.sourceUrl] : [],
      });
      return;
    }

    if (section.type === 'pricing' && content) {
      appendSignal(currentSlug, {
        pricing: splitBulletLines(content).slice(0, MAX_PRICING_NOTES),
        sourceUrls: doc.sourceUrl ? [doc.sourceUrl] : [],
      });
    }
  });

  return byToolSlug;
}

function loadScrapedSignals(): ScrapedIndex {
  if (cachedScrapedIndex) {
    return cachedScrapedIndex;
  }

  const scrapedIndex: ScrapedIndex = new Map();
  const outputDir = findScraperOutputDir();
  if (!outputDir) {
    cachedScrapedIndex = scrapedIndex;
    return scrapedIndex;
  }

  const siteTools = getAllTools();
  const siteSlugs = new Set(siteTools.map((tool) => tool.slug));
  const siteNamesBySlug = new Map(siteTools.map((tool) => [tool.slug, tool.name]));

  const baseDirs = fs
    .readdirSync(outputDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const baseDirName of baseDirs) {
    const canonicalBaseSlug =
      BASE_SLUG_ALIASES[normalizeSlug(baseDirName)]
      || normalizeToolSlug(baseDirName, siteSlugs)
      || BASE_SLUG_ALIASES[normalizeKey(baseDirName)]
      || null;

    if (!canonicalBaseSlug || !siteSlugs.has(canonicalBaseSlug)) {
      continue;
    }

    const baseSignals: ScrapedBaseSignals = scrapedIndex.get(canonicalBaseSlug) || {
      tools: new Map<string, ScrapedToolSignals>(),
      faqs: [],
    };

    const baseToolName = siteNamesBySlug.get(canonicalBaseSlug) || canonicalBaseSlug;
    const dirPath = path.join(outputDir, baseDirName);
    const files = fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
      .map((entry) => path.join(dirPath, entry.name));

    for (const filePath of files) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as ScrapedDocument;

        const toolSignals = parseDocumentToolSignals(parsed, siteSlugs);
        toolSignals.forEach((signals, toolSlug) => {
          const existing = baseSignals.tools.get(toolSlug) || createEmptyToolSignals();
          baseSignals.tools.set(toolSlug, mergeToolSignals(existing, signals));
        });

        const faqCandidates = parseFaqCandidatesFromDocument(baseToolName, parsed);
        baseSignals.faqs = uniqueFaqs([...baseSignals.faqs, ...faqCandidates]).slice(0, 6);
      } catch {
        continue;
      }
    }

    scrapedIndex.set(canonicalBaseSlug, baseSignals);
  }

  cachedScrapedIndex = scrapedIndex;
  return scrapedIndex;
}

function mergeBulletField(current: string[], incoming: string[], maxItems: number): string[] {
  const currentClean = uniqueStrings(current);
  const incomingClean = uniqueStrings(incoming);

  const shouldReplace = currentClean.length === 0 || currentClean.every((line) => isPlaceholderText(line));

  if (shouldReplace) {
    return incomingClean.slice(0, maxItems);
  }

  return uniqueStrings([...currentClean, ...incomingClean]).slice(0, maxItems);
}

function mergeBestFor(current: string, signals: ScrapedToolSignals): string {
  if (!isPlaceholderText(current)) {
    return current;
  }

  const candidate = signals.bestFor[0] || signals.introNotes[0];
  return candidate || current;
}

function mergePricing(current: string, signals: ScrapedToolSignals): string {
  if (!isPlaceholderText(current)) {
    return current;
  }

  const note = signals.pricing.slice(0, MAX_PRICING_NOTES).join(' ');
  if (note) {
    return note;
  }

  return current;
}

function mergeSourceUrls(current: string[], signals: ScrapedToolSignals): string[] {
  return uniqueStrings([...(current || []), ...(signals.sourceUrls || [])]).slice(0, MAX_SOURCES);
}

function fillDeepDiveContent(item: AlternativesDeepDive, baseSignals: ScrapedBaseSignals): AlternativesDeepDive {
  if (!item.toolSlug) return item;

  const signals = baseSignals.tools.get(item.toolSlug);
  if (!signals) return item;

  const nextStrengths = mergeBulletField(item.strengths || [], signals.capabilities, MAX_BULLETS);
  const nextTradeoffs = mergeBulletField(item.tradeoffs || [], signals.tradeoffs, MAX_TRADEOFFS);

  return {
    ...item,
    bestFor: mergeBestFor(item.bestFor, signals),
    strengths: nextStrengths.length > 0 ? nextStrengths : item.strengths,
    tradeoffs: nextTradeoffs.length > 0 ? nextTradeoffs : item.tradeoffs,
    pricingStarting: mergePricing(item.pricingStarting, signals),
    sourceUrls: mergeSourceUrls(item.sourceUrls || [], signals),
  };
}

function mergeFaqs(currentFaqs: AlternativesFaq[], scrapedFaqs: AlternativesFaq[]): AlternativesFaq[] {
  if (!scrapedFaqs || scrapedFaqs.length === 0) {
    return currentFaqs;
  }

  const merged = uniqueFaqs([...scrapedFaqs, ...currentFaqs]);
  return merged.slice(0, MAX_FAQS);
}

export function fillLongformFromScraped(input: FillLongformFromScrapedInput): FillLongformFromScrapedOutput {
  const scrapedIndex = loadScrapedSignals();
  const baseSignals = scrapedIndex.get(input.baseSlug);

  if (!baseSignals) {
    return {
      deepDives: input.deepDives,
      moreAlternatives: input.moreAlternatives || [],
      faqs: input.faqs,
    };
  }

  return {
    deepDives: input.deepDives.map((item) => fillDeepDiveContent(item, baseSignals)),
    moreAlternatives: (input.moreAlternatives || []).map((item) => fillDeepDiveContent(item, baseSignals)),
    faqs: mergeFaqs(input.faqs, baseSignals.faqs),
  };
}

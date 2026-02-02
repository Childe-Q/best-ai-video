/**
 * Nuggets Extractor v5 - Post-processing Edition
 *
 * Features: fact-level dedupe, terms/privacy strong filtering, pricing structured extraction,
 * marketing text filtering, sentence quality threshold, comprehensive post-processing
 */

import * as cheerio from 'cheerio';
import type { EvidenceNugget, EvidenceTheme } from '../../data/evidence/schema';

// ============================================================================
// Configuration
// ============================================================================

const MIN_NUGGET_LENGTH = 25;
const MAX_NUGGET_LENGTH = 160;
const MAX_TOTAL_NUGGETS = 30;
const MIN_WORDS_PER_SENTENCE = 8;

// Source priority for dedupe (higher = more authoritative)
const SOURCE_PRIORITY: Record<string, number> = {
  pricing: 100,
  help: 90,
  docs: 85,
  faq: 80,
  features: 70,
  terms: 50,
  blog: 40,
  privacy: 30,
  examples: 20,
  templates: 20,
  showcase: 20,
  gallery: 20,
  default: 10
};

// Terms/Privacy relevant keywords (must contain at least one)
const TERMS_PRIVACY_KEYWORDS = [
  'refund', 'cancel', 'renewal', 'trial', 'commercial',
  'license', 'licensing', 'ownership', 'watermark',
  'privacy', 'data', 'retention', 'training',
  'gdpr', 'ccpa', 'consent', 'opt-out'
];

// Footer/navigation patterns to drop
const FOOTER_PATTERNS = [
  /copyright/i,
  /privacy policy/i,
  /terms of (service|use)/i,
  /cookie/i,
  /media kit/i,
  /all rights reserved/i,
  /login/i,
  /sign\s*(in|up)/i,
  /get started/i,
  /about us/i,
  /contact us/i,
  /subscribe/i,
  /newsletter/i,
  /affiliate/i,
  /commission/i,
];

// Navigation keyword count threshold
const NAV_KEYWORDS = ['menu', 'nav', 'sidebar', 'footer', 'header', 'breadcrumb'];

// Marketing/estimation patterns to filter
const MARKETING_PATTERNS = [
  /save\s+\d+/i,
  /effort/i,
  /roi/i,
  /stop wasting/i,
  /dollars/i,
  /ideally speaking/i,
  /\$\d+/,
  /to save over/i,
  /hours? of effort/i,
  /per month/i,
  /% off/i,
  /start (free|now)/i,
  /no credit card/i,
];

// Complete sentence signals
const COMPLETE_SENTENCE_SIGNALS = [
  'supports', 'includes', 'up to', 'requires', 'expires',
  'refund', 'cancel', 'provides', 'offers', 'allows',
  'plan', 'feature', 'limit', 'maximum', 'minimum',
  'export', 'watermark', 'resolution', 'duration',
  'minutes', 'voices', 'languages'
];

// Field keywords for info density
const FIELD_KEYWORDS = [
  'minutes', 'credits', 'hours', 'days', 'months',
  '720p', '1080p', '4k', '2160p', 'resolution',
  'watermark', 'export', 'voices', 'languages', 'dialects',
  'commercial', 'rights', 'video', 'audio', 'mp4', 'mov'
];

// Voice patterns
const VOICE_PATTERNS = [
  /(\d+(?:,\d{3})*(?:\+?)\s*voices)/i,
  /(\d+(?:,\d{3})*(?:\+?)\s*ultra-realistic)/i,
  /(\d+(?:,\d{3})*(?:\+?)\s*studio-quality)/i,
];

// Video duration patterns
const VIDEO_DURATION_PATTERNS = [
  /videos?\s*(?:up to|of length upto|up to)\s*(\d+)\s*minutes/i,
  /audio\/video\s*(?:up to|upto)\s*(\d+)\s*minutes/i,
  /max(?:imum)?\s*duration\s*(\d+)\s*minutes/i,
];

// Pricing patterns to drop (we don't crawl pricing in output)
const PRICING_PATTERNS = [
  /\$\d+/,
  /per month/i,
  /per year/i,
  /mo$/i,
  /% off/i,
  /starts? (at|from)/i,
  /free\s*(?:trial|plan)?$/i,
];

// ============================================================================
// Utility Functions
// ============================================================================

function normalizeForDedupe(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bupto\b/g, 'up to')
    .trim();
}

function generateDedupeKey(text: string, theme: EvidenceTheme): string {
  return `${normalizeForDedupe(text)}::${theme}`;
}

function getSourcePriority(sourceType: string): number {
  return SOURCE_PRIORITY[sourceType] || SOURCE_PRIORITY.default;
}

// ============================================================================
// A) Drop Rules
// ============================================================================

function shouldDrop(text: string, sourceType: string): { drop: boolean; reason?: string } {
  const lower = text.toLowerCase();

  // Footer patterns
  for (const pattern of FOOTER_PATTERNS) {
    if (pattern.test(lower)) {
      return { drop: true, reason: 'footer pattern' };
    }
  }

  // Pricing patterns (we don't output pricing nuggets)
  if (sourceType === 'pricing') {
    for (const pattern of PRICING_PATTERNS) {
      if (pattern.test(lower)) {
        return { drop: true, reason: 'pricing pattern' };
      }
    }
  }

  // Marketing patterns
  for (const pattern of MARKETING_PATTERNS) {
    if (pattern.test(lower)) {
      return { drop: true, reason: 'marketing pattern' };
    }
  }

  // Too short without entities
  if (text.length < 15 && !/\d+/.test(text)) {
    return { drop: true, reason: 'too short' };
  }

  return { drop: false };
}

// ============================================================================
// B) Video Duration Correction
// ============================================================================

function isVideoDuration(text: string): { is: boolean; duration?: number } {
  for (const pattern of VIDEO_DURATION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { is: true, duration: parseInt(match[1]) };
    }
  }
  return { is: false };
}

function normalizeVideoDuration(text: string, sourceUrl: string): EvidenceNugget | null {
  const result = isVideoDuration(text);
  if (!result.is || !result.duration) return null;

  return {
    text: `Max video duration: ${result.duration} minutes`,
    theme: 'usage',
    sourceUrl,
    sourceType: 'limits',
    capturedAt: new Date().toISOString(),
    hasNumber: true,
    keywords: ['max_duration', 'minutes'],
    confidence: 'high'
  };
}

// ============================================================================
// C) Usage Allowance Normalization
// ============================================================================

function normalizeUsageAllowance(text: string, sourceUrl: string): EvidenceNugget | null {
  // Pattern: "N minutes of credits per month/year"
  const monthlyMatch = text.match(/(\d+(?:,\d{3})*)\s*minutes?\s*(?:of)?\s*credits?\s*per\s*month/i);
  const yearlyMatch = text.match(/(\d+(?:,\d{3})*)\s*minutes?\s*(?:of)?\s*credits?\s*per\s*year/i);

  if (monthlyMatch) {
    return {
      text: `Usage allowance: ${monthlyMatch[1].replace(/,/g, '')} minutes/month`,
      theme: 'usage',
      sourceUrl,
      sourceType: 'usage',
      capturedAt: new Date().toISOString(),
      hasNumber: true,
      keywords: ['usage', 'monthly'],
      confidence: 'high'
    };
  }

  if (yearlyMatch) {
    return {
      text: `Usage allowance: ${yearlyMatch[1].replace(/,/g, '')} minutes/year`,
      theme: 'usage',
      sourceUrl,
      sourceType: 'usage',
      capturedAt: new Date().toISOString(),
      hasNumber: true,
      keywords: ['usage', 'yearly'],
      confidence: 'high'
    };
  }

  return null;
}

// ============================================================================
// D) Voice Library Normalization
// ============================================================================

function normalizeVoice(text: string, sourceUrl: string, existing: EvidenceNugget[]): EvidenceNugget | null {
  // Look for voice count patterns
  const match = text.match(/(\d+(?:,\d{3})*(?:\+?)\s*voices)/i);
  if (!match) return null;

  const count = match[1].replace(/,/g, '');
  const theme = remapTheme(text);

  // Check if we already have a higher count
  for (const existingNugget of existing) {
    if (existingNugget.theme === 'voice' && existingNugget.text.includes('voices')) {
      const existingMatch = existingNugget.text.match(/(\d+(?:,\d{3})*(?:\+?)\s*voices)/i);
      if (existingMatch) {
        const existingCount = parseInt(existingMatch[1].replace(/,/g, ''));
        const newCount = parseInt(count);
        // If existing is higher or equal, skip this one
        if (existingCount >= newCount) {
          return null;
        }
      }
    }
  }

  return {
    text: `Voice library: ${count}+ voices`,
    theme,
    sourceUrl,
    sourceType: 'voice',
    capturedAt: new Date().toISOString(),
    hasNumber: true,
    keywords: ['voices', 'library'],
    confidence: 'high'
  };
}

// ============================================================================
// E) Deduplication
// ============================================================================

function deduplicateNuggets(nuggets: EvidenceNugget[]): EvidenceNugget[] {
  const dedupeMap = new Map<string, EvidenceNugget>();
  const dedupeKeys = new Set<string>();

  // Sort by source priority
  const sorted = [...nuggets].sort((a, b) => {
    const priorityA = getSourcePriority(a.sourceType);
    const priorityB = getSourcePriority(b.sourceType);
    return priorityB - priorityA;
  });

  for (const nugget of sorted) {
    const key = generateDedupeKey(nugget.text, nugget.theme);
    if (!dedupeKeys.has(key)) {
      dedupeKeys.add(key);
      dedupeMap.set(key, nugget);
    }
  }

  return Array.from(dedupeMap.values());
}

// ============================================================================
// F) Quality Threshold
// ============================================================================

function meetsQualityThreshold(nugget: EvidenceNugget): boolean {
  // Low confidence without entities -> drop
  if (nugget.confidence === 'low') {
    const hasEntity = FIELD_KEYWORDS.some(kw =>
      nugget.text.toLowerCase().includes(kw)
    ) || /\d+/.test(nugget.text);
    return hasEntity;
  }
  return true;
}

// ============================================================================
// Theme Remapping
// ============================================================================

function remapTheme(text: string): EvidenceTheme {
  const lower = text.toLowerCase();

  if (/watermark|720p|1080p|4k|4K|2160p|mp4|mov|srt|vtt|export|resolution|fps/.test(lower)) {
    return 'export';
  }
  if (/commercial|non-commercial|license|licensing|rights|resale/.test(lower)) {
    return 'licensing';
  }
  if (/refund|money-back|cancel|billing|renewal|expire|rollover/.test(lower)) {
    return 'pricing';
  }
  if (/minutes|quota|limit|per month|per week|per year/.test(lower)) {
    return 'usage';
  }
  if (/soc|sso|scim|pci|security|compliance/.test(lower)) {
    return 'security';
  }
  if (/api|webhook|zapier|integration|batch/.test(lower)) {
    return 'workflow';
  }
  if (/voice|cloning|tts|languages|dialects/.test(lower)) {
    return 'voice';
  }

  return 'general';
}

// ============================================================================
// Sentence Validation
// ============================================================================

function isCompleteSentence(text: string): boolean {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < MIN_WORDS_PER_SENTENCE) return false;

  const lower = text.toLowerCase();
  return COMPLETE_SENTENCE_SIGNALS.some(signal => lower.includes(signal));
}

function isFragment(text: string): boolean {
  if (text.length < 20) return true;
  if (/^[,;\.\-\d\s]+$/.test(text)) return true;
  if (/[,\:]$/.test(text)) return true;
  if (/; \d+$/.test(text)) return true;
  if (/\d+ C$/.test(text)) return true;
  return false;
}

function cleanNuggetText(text: string): string {
  let cleaned = text.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[\d\.\-\*\•\▸\▶\]\s]+/, '');
  if (cleaned.length > MAX_NUGGET_LENGTH) {
    const truncated = cleaned.substring(0, MAX_NUGGET_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > MAX_NUGGET_LENGTH * 0.7) {
      cleaned = truncated.substring(0, lastSpace).trim();
    }
  }
  return cleaned;
}

function hasNumber(text: string): boolean {
  return /\d+/.test(text);
}

// ============================================================================
// Main Extraction Functions
// ============================================================================

function extractNuggetsFromHtml(
  html: string,
  sourceUrl: string,
  sourceType: string
): EvidenceNugget[] {
  const $ = cheerio.load(html);
  const nuggets: EvidenceNugget[] = [];

  // For pricing pages, extract structured data
  if (sourceType === 'pricing') {
    return extractPricingInfo(html, sourceUrl);
  }

  // Terms/Privacy: filter by required keywords
  if (sourceType === 'terms' || sourceType === 'privacy') {
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length < MIN_NUGGET_LENGTH) return;
      if (!hasRequiredKeywords(text)) return;
      processNuggetCandidate(text, sourceUrl, sourceType, nuggets);
    });
    return nuggets;
  }

  // Standard extraction
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length < MIN_NUGGET_LENGTH) return;
    processNuggetCandidate(text, sourceUrl, sourceType, nuggets);
  });

  $('li').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length < 20) return;
    if (!hasFieldKeyword(text) && !hasNumber(text)) return;
    processNuggetCandidate(text, sourceUrl, sourceType, nuggets);
  });

  return nuggets;
}

function hasRequiredKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return TERMS_PRIVACY_KEYWORDS.some(kw => lower.includes(kw));
}

function hasFieldKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return FIELD_KEYWORDS.some(kw => lower.includes(kw));
}

function processNuggetCandidate(
  text: string,
  sourceUrl: string,
  sourceType: string,
  nuggets: EvidenceNugget[]
): void {
  // A) Drop rules
  const dropResult = shouldDrop(text, sourceType);
  if (dropResult.drop) return;

  // Fragment check
  if (isFragment(text)) return;

  // Sentence completeness
  if (!isCompleteSentence(text)) return;

  const cleaned = cleanNuggetText(text);
  if (cleaned.length < MIN_NUGGET_LENGTH) return;

  const theme = remapTheme(cleaned);
  const hasNum = hasNumber(cleaned);

  nuggets.push({
    text: cleaned,
    theme,
    sourceUrl,
    sourceType,
    capturedAt: new Date().toISOString(),
    hasNumber: hasNum,
    keywords: [],
    confidence: hasNum ? 'high' : 'medium'
  });
}

function extractPricingInfo(html: string, sourceUrl: string): EvidenceNugget[] {
  const nuggets: EvidenceNugget[] = [];
  const $ = cheerio.load(html);

  const pricingSelectors = [
    '[class*="pricing"]',
    '[class*="plan"]',
    'table[class*="price"]',
    '[class*="card"][class*="plan"]'
  ];

  for (const selector of pricingSelectors) {
    const $section = $(selector);
    if ($section.length === 0) continue;

    // Plan names
    $section.find('h1, h2, h3, h4').each((_, el) => {
      const planName = $(el).text().trim();
      if (planName.length < 3 || planName.length > 50) return;

      // Skip if plan name looks like a CTA
      if (/start|free|get/i.test(planName)) return;

      const $next = $(el).next();
      const priceText = $next.text().trim();

      // Extract credits/minutes
      const creditsMatch = priceText.match(/(\d+(?:,\d{3})*)\s*minutes?\s*(?:of)?\s*credits?/i);
      if (creditsMatch) {
        // Check if this is actually video duration
        const durationResult = isVideoDuration(`${planName} ${priceText}`);
        if (!durationResult.is) {
          const isYearly = /per\s*year/i.test(priceText);
          nuggets.push({
            text: `Usage allowance: ${creditsMatch[1].replace(/,/g, '')} minutes/${isYearly ? 'year' : 'month'}`,
            theme: 'usage',
            sourceUrl,
            sourceType: 'pricing',
            capturedAt: new Date().toISOString(),
            hasNumber: true,
            keywords: ['usage', isYearly ? 'yearly' : 'monthly'],
            confidence: 'high'
          });
        }
      }
    });

    // Extract features
    $section.find('li, [class*="feature"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length < 10 || text.length > 200) return;

      const lower = text.toLowerCase();

      // Export resolution
      const resMatch = lower.match(/(720p|1080p|4k|2160p)/);
      if (resMatch && !/no\s/i.test(lower)) {
        nuggets.push({
          text: `Export resolution: ${resMatch[1]}`,
          theme: 'export',
          sourceUrl,
          sourceType: 'pricing',
          capturedAt: new Date().toISOString(),
          hasNumber: true,
          keywords: ['resolution', resMatch[1].toLowerCase()],
          confidence: 'high'
        });
      }

      // Watermark
      if (/watermark/i.test(lower)) {
        const hasWatermark = !/no|without|remove/i.test(lower);
        nuggets.push({
          text: hasWatermark ? 'Watermark on free plan' : 'No watermark',
          theme: 'export',
          sourceUrl,
          sourceType: 'pricing',
          capturedAt: new Date().toISOString(),
          hasNumber: false,
          keywords: ['watermark'],
          confidence: 'high'
        });
      }

      // Voices/languages
      const voiceMatch = lower.match(/(\d+(?:,\d{3})*(?:\+?)\s*(?:voices|ultra-realistic|studio-quality))/i);
      if (voiceMatch && !nuggets.some(n => n.theme === 'voice' && n.text.includes('voices'))) {
        nuggets.push({
          text: `Voice library: ${voiceMatch[1].replace(/,/g, '')}+ voices`,
          theme: 'voice',
          sourceUrl,
          sourceType: 'pricing',
          capturedAt: new Date().toISOString(),
          hasNumber: true,
          keywords: ['voices', 'library'],
          confidence: 'high'
        });
      }

      const langMatch = lower.match(/(\d+)\s*(?:languages|dialects)/);
      if (langMatch) {
        const type = /dialects/i.test(lower) ? 'dialects' : 'languages';
        nuggets.push({
          text: `${langMatch[1]} ${type}`,
          theme: 'voice',
          sourceUrl,
          sourceType: 'pricing',
          capturedAt: new Date().toISOString(),
          hasNumber: true,
          keywords: [type],
          confidence: 'high'
        });
      }

      // Export formats
      if (/mp4|mov|video\s*format/i.test(lower)) {
        const formatMatch = lower.match(/(mp4|mov|webm)/i);
        if (formatMatch && !nuggets.some(n => n.theme === 'export' && n.text.includes('format'))) {
          nuggets.push({
            text: `Export format: ${formatMatch[1].toUpperCase()}`,
            theme: 'export',
            sourceUrl,
            sourceType: 'pricing',
            capturedAt: new Date().toISOString(),
            hasNumber: false,
            keywords: ['format', formatMatch[1].toLowerCase()],
            confidence: 'high'
          });
        }
      }
    });

    break;
  }

  return nuggets;
}

// ============================================================================
// Post-Processing: normalizeNuggets()
// ============================================================================

export interface NormalizationResult {
  nuggets: EvidenceNugget[];
  specsLimits: EvidenceNugget[];
  metadata: {
    totalNuggets: number;
    themesCovered: EvidenceTheme[];
    hasModelClaims: boolean;
    hasExamples: boolean;
    minConfidence: 'high' | 'medium' | 'low';
    insufficientCoverage?: boolean;
  };
}

export function normalizeNuggets(
  allNuggets: EvidenceNugget[],
  options: {
    maxTotal?: number;
    preferredThemes?: EvidenceTheme[];
    sourceWeightThreshold?: number;
  } = {}
): NormalizationResult {
  const {
    maxTotal = MAX_TOTAL_NUGGETS,
    preferredThemes = ['export', 'usage', 'voice', 'licensing', 'security'],
    sourceWeightThreshold = 80
  } = options;

  // B) Video duration correction & C) Usage allowance normalization
  const processed: EvidenceNugget[] = [];
  const seenKeys = new Set<string>();

  for (const nugget of allNuggets) {
    // Video duration normalization
    const durationNugget = normalizeVideoDuration(nugget.text, nugget.sourceUrl);
    if (durationNugget) {
      processed.push(durationNugget);
      continue;
    }

    // Usage allowance normalization
    const usageNugget = normalizeUsageAllowance(nugget.text, nugget.sourceUrl);
    if (usageNugget) {
      processed.push(usageNugget);
      continue;
    }

    processed.push(nugget);
  }

  // E) Deduplication
  const deduped = deduplicateNuggets(processed);

  // F) Quality threshold
  const qualityFiltered = deduped.filter(meetsQualityThreshold);

  // Scoring for final selection
  const scored = qualityFiltered.map((n) => {
    let score = 0;
    const priority = getSourcePriority(n.sourceType);

    score += priority;
    if (n.confidence === 'high') score += 10;
    else if (n.confidence === 'medium') score += 5;
    if (n.hasNumber) score += 3;
    if (preferredThemes.includes(n.theme)) score += 5;

    const orderKey = `${n.sourceUrl}-${n.theme}-${n.text}`;
    return { nugget: n, score, orderKey };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.orderKey.localeCompare(b.orderKey);
  });

  const selected = scored.slice(0, maxTotal);

  // SpecsLimits: high-priority sources only, high confidence
  const specsLimits = scored
    .filter(s => s.nugget.sourceType !== 'pricing' && s.nugget.confidence !== 'low')
    .slice(0, MAX_TOTAL_NUGGETS)
    .map(s => s.nugget);

  const themes = [...new Set(selected.map(n => n.nugget.theme))];

  // Check coverage
  const coverageThemes = ['export', 'usage', 'limits', 'voice', 'licensing', 'security'];
  const coveredCount = coverageThemes.filter(t => themes.includes(t as EvidenceTheme)).length;
  const insufficientCoverage = coveredCount < 2;

  return {
    nuggets: selected.map(s => s.nugget),
    specsLimits,
    metadata: {
      totalNuggets: selected.length,
      themesCovered: themes as EvidenceTheme[],
      hasModelClaims: false,
      hasExamples: false,
      minConfidence: selected.length > 0
        ? selected.reduce((min, n) => n.nugget.confidence === 'low' ? 'low' : (min === 'low' ? 'medium' : min), 'high' as 'high' | 'medium' | 'low')
        : 'low',
      insufficientCoverage
    }
  };
}

// ============================================================================
// Main Extraction Function
// ============================================================================

export function extractNuggets(
  text: string,
  html: string,
  sourceUrl: string,
  sourceType: string
): EvidenceNugget[] {
  const htmlNuggets = extractNuggetsFromHtml(html, sourceUrl, sourceType);
  const textNuggets = extractNuggetsFromText(text, sourceUrl, sourceType);
  return [...htmlNuggets, ...textNuggets];
}

function extractNuggetsFromText(
  text: string,
  sourceUrl: string,
  sourceType: string
): EvidenceNugget[] {
  const nuggets: EvidenceNugget[] = [];

  if (sourceType === 'pricing') return nuggets;

  if (sourceType === 'terms' || sourceType === 'privacy') {
    const paragraphs = text.split(/\n\n+/);
    for (const para of paragraphs) {
      if (para.length < MIN_NUGGET_LENGTH) continue;
      if (!hasRequiredKeywords(para)) continue;
      processTextParagraph(para, sourceUrl, sourceType, nuggets);
    }
    return nuggets;
  }

  const paragraphs = text.split(/\n\n+/);
  for (const para of paragraphs) {
    processTextParagraph(para, sourceUrl, sourceType, nuggets);
  }

  return nuggets;
}

function processTextParagraph(
  para: string,
  sourceUrl: string,
  sourceType: string,
  nuggets: EvidenceNugget[]
): void {
  const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < MIN_NUGGET_LENGTH) continue;

    const dropResult = shouldDrop(trimmed, sourceType);
    if (dropResult.drop) continue;

    if (isFragment(trimmed)) continue;
    if (!isCompleteSentence(trimmed)) continue;

    const cleaned = cleanNuggetText(trimmed);
    if (cleaned.length < MIN_NUGGET_LENGTH) continue;

    const theme = remapTheme(cleaned);
    const hasNum = hasNumber(cleaned);

    nuggets.push({
      text: cleaned,
      theme,
      sourceUrl,
      sourceType,
      capturedAt: new Date().toISOString(),
      hasNumber: hasNum,
      keywords: [],
      confidence: hasNum ? 'high' : 'medium'
    });
  }
}

// Export for use in extract-tool-evidence.ts
export function mergeNuggets(
  allNuggets: EvidenceNugget[],
  options?: Parameters<typeof normalizeNuggets>[1]
): NormalizationResult {
  return normalizeNuggets(allNuggets, options);
}

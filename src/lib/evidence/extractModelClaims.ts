/**
 * Model Claims Extractor
 *
 * Extracts AI model support claims from page content.
 * Only records models explicitly mentioned in official pages.
 */

import type { ModelClaim, EvidenceNugget } from '../../data/evidence/schema';

// ============================================================================
// Configuration
// ============================================================================

// Known AI video generation models to check for
const KNOWN_MODELS = [
  { name: 'Veo 3', patterns: [/veo\s*3/i, /google\s+veo\s*3/i] },
  { name: 'Veo 2', patterns: [/veo\s*2/i, /google\s+veo\s*2/i] },
  { name: 'Veo', patterns: [/\bveo\b(?![\s\d])/i, /google\s+veo\b/i] },
  { name: 'Sora', patterns: [/\bsora\b/i, /openai\s+sora/i] },
  { name: 'Runway Gen-3', patterns: [/runway\s*gen\s*3/i, /gen[\s-]*3\s*alpha/i] },
  { name: 'Runway Gen-2', patterns: [/runway\s*gen\s*2/i, /gen[\s-]*2/i] },
  { name: 'Runway', patterns: [/\brunway\b/i] },
  { name: 'Kling', patterns: [/\bkling\b/i, /kling\s*1\.5/i] },
  { name: 'Hailuo', patterns: [/\bhailuo\b/i] },
  { name: 'Luma Dream', patterns: [/\bluma\s*dream\b/i, /dream\s*machine/i] },
  { name: 'Pika', patterns: [/\bpika\b/i, /pika\s*1\.0/i] },
  { name: 'Stable Video', patterns: [/\bstable\s*video\b/i, /svd\b/i] },
  { name: 'Muse', patterns: [/\bmuse\b/i] },
  { name: 'VideoPoet', patterns: [/\bvideopoet\b/i] },
  { name: 'Gen-2', patterns: [/gen[\s-]*2\b/i] },
  { name: 'Gen-3 Alpha', patterns: [/gen[\s-]*3\s*alpha\b/i] },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a model is explicitly mentioned in text
 * Returns the context around the mention if found
 */
function findModelMention(text: string, model: typeof KNOWN_MODELS[0]): { found: boolean; context?: string } {
  for (const pattern of model.patterns) {
    const match = text.match(new RegExp(`.{0,50}${pattern.source}.{0,50}`, 'i'));
    if (match) {
      return { found: true, context: match[0].trim() };
    }
  }
  return { found: false };
}

/**
 * Extract model name with version from text
 */
function extractModelName(text: string): string | null {
  for (const model of KNOWN_MODELS) {
    for (const pattern of model.patterns) {
      if (pattern.test(text)) {
        return model.name;
      }
    }
  }
  return null;
}

/**
 * Check if text explicitly claims model support
 * Returns true only if the text indicates the tool USES/supports the model
 */
function isExplicitSupportClaim(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Explicit support indicators
  const supportPatterns = [
    /powered by/i,
    /built with/i,
    /uses?\s+(?:the\s+)?/i,
    /built on/i,
    /based on/i,
    /trained on/i,
    /integrated with/i,
    /now supports?/i,
    /now available with/i,
    /featuring/i,
    /introducing/i,
    /with\s+\w+\s+model/i,
    /support(?:s)?\s+(?:for\s+)?/i,
    /available on/i,  // "available on Veo" means uses Veo
  ];

  // Negative indicators (not support)
  const negativePatterns = [
    /compare[sd]?\s+to/i,
    /versus/i,
    /vs\.?\s/i,
    /instead of/i,
    /rather than/i,
    /better than/i,
    /unlike/i,
    /competitor/i,
    /alternative/i,
  ];

  // Check for negative patterns first
  for (const pattern of negativePatterns) {
    if (pattern.test(lowerText)) {
      // Need to verify it's actually about the tool, not comparing TO the tool
      if (/\b(veo|sora|runway|kling|hailuo)\b/i.test(lowerText)) {
        const beforeMatch = lowerText.match(new RegExp(`.{0,30}${pattern.source}.{0,30}`, 'i'));
        if (beforeMatch && /\b(our|we|this tool|this platform)\b/i.test(beforeMatch[0])) {
          return false;
        }
      }
    }
  }

  // Check for support patterns
  for (const pattern of supportPatterns) {
    if (pattern.test(lowerText)) {
      // Verify the model is actually mentioned
      if (/\b(veo|sora|runway|kling|hailuo)\b/i.test(text)) {
        return true;
      }
    }
  }

  // Check for "on [Model]" pattern (e.g., "available on Veo")
  const onPattern = /\b(available|now|comes?|built|created?|generated?|made)\s+on\s+(\w+\s+)?(veo|sora|runway|kling|hailuo)/i;
  if (onPattern.test(lowerText)) {
    return true;
  }

  return false;
}

// ============================================================================
// Main Extraction Functions
// ============================================================================

/**
 * Extract model claims from nuggets
 */
export function extractModelClaimsFromNuggets(nuggets: EvidenceNugget[]): ModelClaim {
  const claim: ModelClaim = {
    models_supported: [],
    sources: []
  };

  const seenModels = new Set<string>();

  for (const nugget of nuggets) {
    if (nugget.theme !== 'models') continue;

    // Check each known model
    for (const model of KNOWN_MODELS) {
      if (seenModels.has(model.name)) continue;

      // Check if model is mentioned in nugget text
      const mention = findModelMention(nugget.text, model);
      if (!mention.found) continue;

      // Check if this is an explicit support claim
      if (isExplicitSupportClaim(nugget.text)) {
        seenModels.add(model.name);
        claim.models_supported?.push(model.name);

        // Add source
        const existingSource = claim.sources.find(s => s.url === nugget.sourceUrl);
        if (existingSource) {
          existingSource.facts.push(nugget.text);
        } else {
          claim.sources.push({
            url: nugget.sourceUrl,
            facts: [nugget.text]
          });
        }
      }
    }
  }

  return claim;
}

/**
 * Extract model claims from raw text
 */
export function extractModelClaimsFromText(
  text: string,
  html: string,
  sourceUrl: string
): ModelClaim {
  const claim: ModelClaim = {
    models_supported: [],
    sources: []
  };

  const seenModels = new Set<string>();

  // Search in text
  const contentToSearch = text;

  for (const model of KNOWN_MODELS) {
    if (seenModels.has(model.name)) continue;

    // Check if model is mentioned
    const mention = findModelMention(contentToSearch, model);
    if (!mention.found) continue;

    // Check if this is a support claim
    if (isExplicitSupportClaim(contentToSearch)) {
      seenModels.add(model.name);
      claim.models_supported?.push(model.name);

      claim.sources.push({
        url: sourceUrl,
        facts: [mention.context || `${model.name} mentioned`]
      });
    }
  }

  // Note: HTML parsing skipped - nuggets already contain extracted text from HTML
  // If needed, HTML parsing can be re-added with synchronous cheerio import

  return claim;
}

/**
 * Main extraction function - combine nuggets and text analysis
 */
export function extractModelClaims(
  nuggets: EvidenceNugget[],
  text: string,
  html: string,
  sourceUrl: string
): ModelClaim {
  // Extract from nuggets first
  const nuggetClaims = extractModelClaimsFromNuggets(nuggets);

  // If we found claims in nuggets, use those (they have better context)
  if (nuggetClaims.models_supported && nuggetClaims.models_supported.length > 0) {
    return nuggetClaims;
  }

  // Otherwise, search in raw text
  return extractModelClaimsFromText(text, html, sourceUrl);
}

/**
 * Merge model claims from multiple sources
 */
export function mergeModelClaims(claims: ModelClaim[]): ModelClaim {
  const merged: ModelClaim = {
    models_supported: [],
    sources: []
  };

  const seenModels = new Set<string>();
  const seenUrls = new Set<string>();

  for (const claim of claims) {
    if (!claim.models_supported) continue;

    for (const model of claim.models_supported) {
      if (!seenModels.has(model)) {
        seenModels.add(model);
        merged.models_supported?.push(model);
      }
    }

    for (const source of claim.sources) {
      if (!seenUrls.has(source.url)) {
        seenUrls.add(source.url);
        merged.sources.push({
          url: source.url,
          facts: [...source.facts]
        });
      } else {
        // Add facts to existing source
        const existing = merged.sources.find(s => s.url === source.url);
        if (existing) {
          for (const fact of source.facts) {
            if (!existing.facts.includes(fact)) {
              existing.facts.push(fact);
            }
          }
        }
      }
    }
  }

  return merged;
}

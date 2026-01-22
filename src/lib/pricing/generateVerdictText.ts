import { PricingPlan } from '@/types/tool';

// 6 Style Profiles (Product, Review, Growth, Risk, Minimalist, Enterprise) defined by User
const STYLE_PROFILES = {
  product: {
    name: 'Product',
    hooks: {
      s1: ['Best for', 'Ideal for', 'Built for'],
      s2: ['Note that', 'Keep in mind', 'Heads up'],
      s3: ['Start with', 'Try', 'Begin with']
    }
  },
  review: {
    name: 'Review',
    hooks: {
      s1: ['Top choice for', 'Highly rated for', 'Standout choice for'],
      s2: ['Consider that', 'Be aware that', 'Factor in that'],
      s3: ['Test via', 'Evaluate with', 'Check out']
    }
  },
  growth: {
    name: 'Growth',
    hooks: {
      s1: ['Scales well for', 'Accelerates', 'Powers'],
      s2: ['Remember', 'Note that', 'Be advised that'],
      s3: ['Launch with', 'Grow with', 'Scale with']
    }
  },
  risk: {
    name: 'Risk', // Warning/Limitation focused but neutral
    hooks: {
      s1: ['Choose this when', 'Go with this if', 'Select this for'],
      s2: ['Skip if', 'Avoid if', 'Look elsewhere if'], // Stronger "hook" as requested, neutral framing in content
      s3: ['Verify by', 'Validate with', 'Confirm with']
    }
  },
  minimalist: {
    name: 'Minimalist',
    hooks: {
      s1: ['Perfect for', 'Good for', 'Suited for'],
      s2: ['Note:', 'Limit:', 'Restriction:'],
      s3: ['Go for', 'Pick', 'Select']
    }
  },
  enterprise: {
    name: 'Enterprise',
    hooks: {
      s1: ['Enterprise-ready for', 'Professional solution for', 'Corporate choice for'],
      s2: ['Key requirement:', 'Please note:', 'Prerequisite:'],
      s3: ['Deploy via', 'Implement with', 'Onboard with']
    }
  }
};

/**
 * Deterministically select a style profile based on the slug
 */
function selectStyleProfile(slug: string) {
  const profiles = Object.keys(STYLE_PROFILES);
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % profiles.length;
  const selectedKey = profiles[index];
  return STYLE_PROFILES[selectedKey as keyof typeof STYLE_PROFILES];
}

/**
 * Extract distinct facts from text sources
 * Returns a Set of unique strings that contain numbers or allowed keywords
 */
function extractFacts(sourceText: string): string[] {
  if (!sourceText) return [];

  // Regex to capture "Keyword/Value" phrases
  // Captures: 4K, 1080p, mins, hours, watermark, languages, credits, expire, SCORM, seats, storage, etc.
  const patterns = [
    /\b(4k|1080p|720p)\b/i,
    /\b(\d+)\s*(mins?|minutes?|hrs?|hours?|seconds?)\b/i,
    /\b(watermark|no watermark)\b/i,
    /\b(\d+)\s*(languages?|voices?|avatars?)\b/i,
    /\b(scorm|sso|saml)\b/i,
    /\b(credits?\s*expire)\b/i,
    /\b(\d+)\s*(gb|tb|mb)\b/i,
    /\b(unlimited)\b/i,
    /\b(seats?|users?|members?)\b/i
  ];

  const facts: string[] = [];

  // Split by common delimiters to get phrases/clauses
  const phrases = sourceText.split(/[.,;]|\band\b/);

  for (const phrase of phrases) {
    const cleanPhrase = phrase.trim();
    if (cleanPhrase.length < 5) continue; // Skip strictly short noise

    for (const pattern of patterns) {
      const match = cleanPhrase.match(pattern);
      if (match) {
        // Clean up the phrase to be a nice "fact"
        // We might want to keep the whole phrase but strip mostly noise? 
        // Strategy: Keep the phrase if it matches, but maybe truncate?
        // For now, simple approach: check if not already included (fuzzy match)
        const alreadyExists = facts.some(f => f.includes(match[0]) || cleanPhrase.includes(f));
        if (!alreadyExists) {
          facts.push(cleanPhrase);
        }
        break; // Found a match in this phrase, move to next phrase
      }
    }
  }
  return facts;
}

/**
 * Helper to ensure a sentence ends with a period.
 */
function ensurePeriod(text: string): string {
  return text.trim().endsWith('.') ? text.trim() : text.trim() + '.';
}

/**
 * Helper to find distinctive differences from comparison table
 */
function getContrastFromComparison(comparisonTable: any): string[] {
  const findings: string[] = [];
  if (!comparisonTable || !comparisonTable.rows) return findings;

  // Look for rows where values differ significantly or contain boolean differences
  for (const row of comparisonTable.rows) {
    if (!row.values) continue;
    const values = Object.values(row.values);
    const uniqueValues = new Set(values);

    // If there is variation
    if (uniqueValues.size > 1) {
      // If boolean-ish
      if (values.some(v => v === true || v === 'true' || v === 'Yes') && values.some(v => v === false || v === 'false' || v === 'No')) {
        findings.push(`${row.feature} availability`);
      } else {
        // Pick a value that looks interesting (has numbers or length)
        const interesting = values.find(v => typeof v === 'string' && /\d/.test(v));
        if (interesting) {
          findings.push(`${row.feature} limits (${interesting})`);
        } else {
          findings.push(`${row.feature}`);
        }
      }
    }
  }
  return findings;
}


/**
 * Generate verdict text
 */
export function generateVerdictText(
  toolData: {
    key_facts?: string[];
    highlights?: string[];
    best_for?: string;
  },
  plans: PricingPlan[] | undefined,
  toolName: string,
  toolSlug: string,
  snapshotBullets: string[],
  comparisonTable?: any
): string {

  const style = selectStyleProfile(toolSlug);

  // 1. Collect potential content sources and allow distinctFacts to process them individually
  // We prioritize: snapshot > key_facts > highlights > plan features

  // Helper to extract from array of strings directly
  const extractFromList = (list: string[]) => list.flatMap(item => extractFacts(item));

  const planFeatures = (plans || []).flatMap(p => [
    ...(p.features || []),
    ...(p.highlights || [])
  ]);

  const distinctFacts = [
    ...extractFromList(snapshotBullets || []),
    ...extractFromList(toolData.key_facts || []),
    ...extractFromList(toolData.highlights || []),
    ...extractFromList(planFeatures)
    // We process comparison table separately/later if needed
  ];

  // Unique Set of lowercased facts to prevent reuse
  const usedFacts = new Set<string>();

  function getUniqueFact(options: string[], fallbackContext: string): string {
    for (const fact of options) {
      const lower = fact.toLowerCase();
      // Check against already used keywords/values
      // A "collision" is if the main keyword/number is shared
      const hasCollision = Array.from(usedFacts).some(used => {
        // Simple overlap check for numbers and key terms
        const numbers1 = used.match(/\d+/g) || ([] as string[]);
        const numbers2 = lower.match(/\d+/g) || ([] as string[]);
        const commonNum = numbers1.some(n => numbers2.includes(n));

        // Check keywords
        const keywords = ['4k', 'watermark', 'languages', 'scorm', 'seats', 'minutes', 'hours', 'credits'];
        const commonKey = keywords.some(k => used.includes(k) && lower.includes(k));

        return commonNum || commonKey;
      });

      if (!hasCollision && !usedFacts.has(lower)) {
        usedFacts.add(lower);
        return fact;
      }
    }

    // Fallback: Try to find something from comparison table
    const comparisonFacts = getContrastFromComparison(comparisonTable);
    for (const feat of comparisonFacts) {
      if (!usedFacts.has(feat.toLowerCase())) {
        usedFacts.add(feat.toLowerCase());
        return `differences in ${feat}`;
      }
    }

    // Final Fallback: Generic but varied based on context
    if (fallbackContext === 's1') return 'video creation features';
    if (fallbackContext === 's2') return 'specific plan limits';
    return 'a short-term project';
  }


  // --- Sentence 1: Positioning ---
  // Hook + Fact A.
  // Fact A should ideally be positive capability (resolution, usage, etc)
  const factA = getUniqueFact(distinctFacts, 's1');
  const s1Hook = style.hooks.s1[Math.abs(toolSlug.length) % style.hooks.s1.length]; // Deterministic choice
  // Clean fact: remove leading punctuation/connectors if present
  let cleanFactA = factA.replace(/^(and|but|with|plus)\s+/i, '');
  // Start lowercase unless proper noun (heuristic)
  if (!cleanFactA.match(/^[A-Z0-9]/)) cleanFactA = cleanFactA;

  const sentence1 = ensurePeriod(`${s1Hook} ${toolData.best_for || 'content creators'} seeking ${cleanFactA}`);

  // --- Sentence 2: Caution/Limitation ---
  // Hook + Fact B (must be different).
  // Fact B should ideally be a limit or differentiator
  const factB = getUniqueFact(distinctFacts.reverse(), 's2'); // Reverse to look from end (plans details often)
  const s2Hook = style.hooks.s2[Math.abs(toolSlug.length + 1) % style.hooks.s2.length];
  let cleanFactB = factB.replace(/^(and|but|with|plus)\s+/i, '');

  let sentence2 = '';
  if (style.name === 'Risk') {
    // Risk style requires neutral phrasing for 'Skip if...'
    // "Skip if you need [Fact B] in the lower tier" -> "Skip if [Fact B] is insufficient"
    // But we just append factB for now to match structure.
    sentence2 = ensurePeriod(`${s2Hook} ${cleanFactB} is a constraint`);
    // Improve readability: if factB is "5 mins/mo", -> "Skip if 5 mins/mo is insufficient."
    if (/\d/.test(cleanFactB)) {
      sentence2 = ensurePeriod(`${s2Hook} ${cleanFactB} is insufficient for your needs`);
    } else {
      sentence2 = ensurePeriod(`${s2Hook} you strictly require ${cleanFactB}`);
    }
  } else {
    // Standard styles
    sentence2 = ensurePeriod(`${s2Hook} plans vary by ${cleanFactB}`);
    // If factB looks like a feature "no watermark", -> "Note that no watermark is available on paid plans"
    // Refine heuristics:
    if (cleanFactB.includes('watermark')) {
      sentence2 = ensurePeriod(`${s2Hook} ${cleanFactB} applies to specific tiers`);
    } else if (cleanFactB.includes('export')) {
      sentence2 = ensurePeriod(`${s2Hook} ${cleanFactB} restricts lower plans`);
    } else {
      sentence2 = ensurePeriod(`${s2Hook} access to ${cleanFactB} depends on your tier`);
    }
  }

  // --- Sentence 3: Action ---
  // Hook + Advice.
  const s3Hook = style.hooks.s3[Math.abs(toolSlug.length + 2) % style.hooks.s3.length];

  // Decide advice based on price or free trial
  const hasFreeFn = (plans || []).some(p => p.price && typeof p.price === 'string' && p.price.toLowerCase() === 'free');
  let advice = '';

  if (hasFreeFn) {
    advice = 'the free plan to test the workflow';
  } else {
    advice = 'a monthly subscription before committing annually';
  }

  // If we have a specific starting price/plan data
  const startingPlan = (plans || []).find(p => p.price && typeof p.price === 'string' && p.price !== 'Free');
  if (startingPlan) {
    if (startingPlan.name) {
      advice = `the ${startingPlan.name} to evaluate output quality`;
    }
  }

  const sentence3 = ensurePeriod(`${s3Hook} ${advice}`);

  return `${sentence1} ${sentence2} ${sentence3}`;
}
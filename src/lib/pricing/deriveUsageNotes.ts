import { PricingPlan } from '@/types/tool';
import { generateStyleProfile, StyleProfile, calculateJaccardSimilarity } from './generateStyleProfile';
import { createPageDedupeMap, isDuplicate, addToDedupeMap, DedupeMap } from './pageLevelDedupe';

interface UsageNotes {
  bullets: string[];
  tip: string;
}

/**
 * Rewrite a fact using style profile patterns
 * IMPORTANT: If pattern replacement fails, return original fact to avoid hydration mismatch
 */
function rewriteWithStyleProfile(
  fact: string,
  styleProfile: StyleProfile,
  toolName: string,
  patternType: 'limitation' | 'action' | 'risk' | 'comparison'
): string {
  const pattern = styleProfile.sentencePatterns[patternType];
  if (!pattern) {
    // Fallback: just return the fact
    return fact;
  }
  
  // Extract key information from fact
  const lower = fact.toLowerCase();
  const hasFree = lower.includes('free');
  const hasPaid = lower.includes('paid') || lower.includes('upgrade');
  const hasWatermark = lower.includes('watermark');
  const hasExport = lower.includes('export') || lower.includes('720p') || lower.includes('1080p');
  const hasMinutes = lower.includes('minutes') || lower.includes('mins');
  const hasCredits = lower.includes('credits');
  
  // Try to match pattern and fill in - replace ALL placeholders
  let rewritten = pattern;
  
  // Replace all placeholders systematically
  rewritten = rewritten.replace(/\{free_plan\}/g, hasFree ? 'Free plans' : 'Entry plans');
  rewritten = rewritten.replace(/\{paid_plan\}/g, 'paid plans');
  
  // Determine feature/upgrade based on fact content
  let featureValue = 'advanced features';
  let upgradeValue = 'upgraded features';
  if (hasWatermark) {
    featureValue = 'watermarks';
    upgradeValue = 'watermark removal';
  } else if (hasExport) {
    featureValue = 'higher resolution exports';
    upgradeValue = '1080p or 4K exports';
  }
  rewritten = rewritten.replace(/\{feature\}/g, featureValue);
  rewritten = rewritten.replace(/\{upgrade\}/g, upgradeValue);
  
  // Determine limit based on fact content
  let limitValue = 'limited features';
  if (hasMinutes) {
    limitValue = 'limited minutes';
  } else if (hasCredits) {
    limitValue = 'limited credits';
  }
  rewritten = rewritten.replace(/\{limit\}/g, limitValue);
  
  // Replace action/requirement/resource
  rewritten = rewritten.replace(/\{action\}/g, 'large projects');
  rewritten = rewritten.replace(/\{requirement\}/g, 'a paid plan');
  
  let resourceValue = 'usage';
  if (hasMinutes) {
    resourceValue = 'minutes';
  } else if (hasCredits) {
    resourceValue = 'credits';
  }
  rewritten = rewritten.replace(/\{resource\}/g, resourceValue);
  rewritten = rewritten.replace(/\{limit_type\}/g, resourceValue);
  
  // Replace basic/condition
  rewritten = rewritten.replace(/\{basic\}/g, 'basic features');
  rewritten = rewritten.replace(/\{condition\}/g, 'specific plan features');
  
  // CRITICAL: If pattern replacement didn't work (still has placeholders), use original fact
  // This prevents hydration mismatch
  // Check for ANY remaining placeholders
  const hasPlaceholders = /\{[^}]+\}/.test(rewritten);
  if (hasPlaceholders || rewritten === pattern) {
    // Just use the fact but ensure it has tool-specific terms
    const hasUniqueTerm = styleProfile.uniqueTerms.some(term => lower.includes(term));
    if (!hasUniqueTerm && styleProfile.uniqueTerms.length > 0) {
      return `${fact} ${styleProfile.uniqueTerms[0]} is available in paid plans.`;
    }
    return fact;
  }
  
  return rewritten;
}

/**
 * Derive tool-specific usage notes using style profile
 * Priority: keyFacts -> plan benefits -> snapshot -> tool-specific fallback
 * MUST be tool-specific: at least 2 bullets must contain tool-unique keywords
 */
export function deriveUsageNotes(
  tool: { 
    key_facts?: string[]; 
    highlights?: string[]; 
    category?: string;
    stand_out_metrics?: string[];
  } | null,
  plans: PricingPlan[],
  snapshotText?: string,
  toolName?: string,
  dedupeMap?: DedupeMap
): UsageNotes {
  // Use dedupe map if provided, but don't create one if not provided (to avoid hydration issues)
  // The dedupeMap should be created at the component level and passed down
  const pageDedupeMap = dedupeMap;
  
  // Generate style profile for this tool
  const styleProfile = generateStyleProfile(
    toolName || 'tool',
    {
      category: tool?.category,
      stand_out_metrics: tool?.stand_out_metrics,
      key_facts: tool?.key_facts,
      highlights: tool?.highlights,
    },
    plans
  );
  
  const keywords = [
    'credits', 'minutes', 'quota', 'expire', 'rollover', 'regenerate', 'edit', 
    'export', 'watermark', 'commercial', 'refund', 're-export', 'daily', 
    'per day', 'per month', 'per year', 'hr/mo', 'scene', 'voice', 'subtitle',
    'tts', 'text-to-speech', 'gen-ai', 'studio', 'browser', 'chrome', 'burn rate'
  ];
  
  // Collect 6-10 candidate facts (before rewriting)
  const candidateFacts: string[] = [];
  const toolSpecificKeywords: Set<string> = new Set();
  
  // Collect tool-specific keywords from plans (deterministic order)
  if (plans.length > 0) {
    // Sort plans by name for deterministic processing
    const sortedPlans = [...plans].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    for (const plan of sortedPlans) {
      const allText = [
        ...(plan.highlights || []),
        ...(plan.featureItems?.map(f => f.text) || []),
        ...(plan.features || []),
        plan.description || ''
      ].join(' ').toLowerCase();
      
      // Extract unique terms (numbers, specific features)
      const uniqueTerms = allText.match(/\b(\d+\s*(hr|min|sec|videos?|minutes?|credits?|scenes?|voices?|languages?)\s*(per\s+(day|month|year))?|gen-ai\s+studio|re-export|watermark\s+removal)\b/gi);
      if (uniqueTerms) {
        uniqueTerms.forEach(term => toolSpecificKeywords.add(term.toLowerCase()));
      }
    }
  }
  
  // Priority 1: Extract from tool.key_facts (most specific)
  // IMPORTANT: Process in deterministic order to avoid hydration mismatch
  if (tool?.key_facts) {
    // Sort facts deterministically (by length + first char) to ensure same order on server/client
    const sortedFacts = [...tool.key_facts].sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });
    
    for (const fact of sortedFacts) {
      const lower = fact.toLowerCase();
      // Check if it contains usage-related keywords
      if (keywords.some(k => lower.includes(k)) && fact.length <= 120) {
        // Check forbidden phrases
        const hasForbidden = styleProfile.forbiddenPhrases.some(phrase => 
          lower.includes(phrase.toLowerCase())
        );
        if (hasForbidden) continue;
        
        // Check page-level deduplication (but don't fail if dedupeMap is not provided)
        if (dedupeMap && isDuplicate(fact, dedupeMap)) continue;
        
        // Prefer facts that contain tool-specific terms
        const hasToolSpecific = styleProfile.uniqueTerms.some(term => lower.includes(term));
        
        // Check for semantic duplicates
        const isDuplicateLocal = candidateFacts.some(existing => {
          const existingLower = existing.toLowerCase();
          const factWords = lower.split(/\s+/).filter(w => w.length > 3);
          const existingWords = existingLower.split(/\s+/).filter(w => w.length > 3);
          const commonWords = factWords.filter(w => existingWords.includes(w));
          return commonWords.length >= 4;
        });
        
        if (!isDuplicateLocal && (hasToolSpecific || candidateFacts.length < 6)) {
          candidateFacts.push(fact.trim());
          if (dedupeMap) {
            addToDedupeMap(fact, dedupeMap);
          }
        }
      }
    }
  }
  
  // Priority 2: Extract from plan benefits (tool-specific features)
  // IMPORTANT: Process plans in deterministic order
  if (candidateFacts.length < 10 && plans.length > 0) {
    // Sort plans deterministically by name to ensure same order on server/client
    const sortedPlans = [...plans].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    for (const plan of sortedPlans) {
      const allText = [
        ...(plan.highlights || []),
        ...(plan.featureItems?.map(f => f.text) || []),
        ...(plan.features || [])
      ].join(' ');
      
      // Split into sentences
      const sentences = allText.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
      for (const sentence of sentences) {
        const lower = sentence.toLowerCase();
        if (keywords.some(k => lower.includes(k)) && sentence.length <= 120) {
          // Check forbidden phrases
          const hasForbidden = styleProfile.forbiddenPhrases.some(phrase => 
            lower.includes(phrase.toLowerCase())
          );
          if (hasForbidden) continue;
          
          // Check page-level deduplication (but don't fail if dedupeMap is not provided)
          if (dedupeMap && isDuplicate(sentence, dedupeMap)) continue;
          
          // Check for tool-specific terms
          const hasToolSpecific = styleProfile.uniqueTerms.some(term => lower.includes(term));
          
          // Semantic deduplication
          const isDuplicateLocal = candidateFacts.some(existing => {
            const existingLower = existing.toLowerCase();
            const sentenceWords = lower.split(/\s+/).filter(w => w.length > 3);
            const existingWords = existingLower.split(/\s+/).filter(w => w.length > 3);
            const commonWords = sentenceWords.filter(w => existingWords.includes(w));
            return commonWords.length >= 4;
          });
          
          if (!isDuplicateLocal) {
            candidateFacts.push(sentence.trim());
            if (dedupeMap) {
              addToDedupeMap(sentence, dedupeMap);
            }
          }
        }
        if (candidateFacts.length >= 10) break;
      }
      if (candidateFacts.length >= 10) break;
    }
  }
  
  // Priority 3: Extract from snapshot text (if provided)
  if (snapshotText && candidateFacts.length < 10) {
    const sentences = snapshotText.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (keywords.some(k => lower.includes(k)) && sentence.length <= 120) {
        // Check forbidden phrases
        const hasForbidden = styleProfile.forbiddenPhrases.some(phrase => 
          lower.includes(phrase.toLowerCase())
        );
        if (hasForbidden) continue;
        
        // Check page-level deduplication (but don't fail if dedupeMap is not provided)
        if (dedupeMap && isDuplicate(sentence, dedupeMap)) continue;
        
        const hasToolSpecific = styleProfile.uniqueTerms.some(term => lower.includes(term));
        const isDuplicateLocal = candidateFacts.some(existing => {
          const existingLower = existing.toLowerCase();
          const sentenceWords = lower.split(/\s+/).filter(w => w.length > 3);
          const existingWords = existingLower.split(/\s+/).filter(w => w.length > 3);
          const commonWords = sentenceWords.filter(w => existingWords.includes(w));
          return commonWords.length >= 4;
        });
        if (!isDuplicateLocal) {
          candidateFacts.push(sentence.trim());
          if (dedupeMap) {
            addToDedupeMap(sentence, dedupeMap);
          }
        }
      }
      if (candidateFacts.length >= 10) break;
    }
  }
  
  // Now rewrite candidate facts using style profile patterns
  // Ensure variety: limitation, action, risk patterns
  // IMPORTANT: Use deterministic pattern selection to avoid hydration mismatch
  const patternTypes: Array<'limitation' | 'action' | 'risk' | 'comparison'> = 
    ['limitation', 'action', 'risk'];
  
  const rewrittenBullets: string[] = [];
  
  // Use first 3 candidate facts deterministically
  for (let i = 0; i < Math.min(3, candidateFacts.length); i++) {
    const fact = candidateFacts[i];
    // Use deterministic pattern selection based on index
    const patternType = patternTypes[i % patternTypes.length];
    
    // Rewrite using style profile
    let rewritten = rewriteWithStyleProfile(fact, styleProfile, toolName || 'tool', patternType);
    
    // CRITICAL: If rewritten still contains placeholders, use original fact to avoid hydration mismatch
    const hasPlaceholders = /\{[^}]+\}/.test(rewritten);
    if (hasPlaceholders) {
      rewritten = fact; // Use original fact if replacement failed
    }
    
    // Normalize and truncate for stability
    rewritten = rewritten.trim();
    if (rewritten.length > 120) {
      rewritten = rewritten.substring(0, 117) + '...';
    }
    
    // Ensure it contains at least one unique term
    const lower = rewritten.toLowerCase();
    const hasUniqueTerm = styleProfile.uniqueTerms.some(term => lower.includes(term));
    if (!hasUniqueTerm && styleProfile.uniqueTerms.length > 0) {
      // Inject a unique term naturally
      const uniqueTerm = styleProfile.uniqueTerms[0];
      const planMatch = rewritten.match(/(plan|feature)/i);
      if (planMatch) {
        rewritten = rewritten.replace(/(plan|feature)/i, `$1 with ${uniqueTerm}`);
      } else {
        rewritten = `${rewritten} ${uniqueTerm} is available in paid plans.`;
      }
    }
    
    rewrittenBullets.push(rewritten);
  }
  
  // Tool-specific fallback: inject tool name and known features (using style profile)
  const bullets: string[] = [];
  if (rewrittenBullets.length > 0) {
    bullets.push(...rewrittenBullets);
  } else {
    // Build tool-specific fallback using style profile patterns
    const toolNameStr = toolName || 'this tool';
    const freePlan = plans.find(p => (p.name || '').toLowerCase().includes('free'));
    const paidPlans = plans.filter(p => !(p.name || '').toLowerCase().includes('free'));
    
    // Extract known features from plans
    const hasWatermark = plans.some(p => {
      const text = [...(p.featureItems?.map(f => f.text) || [])].join(' ').toLowerCase();
      return text.includes('watermark');
    });
    const has720p = plans.some(p => {
      const text = [...(p.featureItems?.map(f => f.text) || [])].join(' ').toLowerCase();
      return text.includes('720p');
    });
    const has1080p = plans.some(p => {
      const text = [...(p.featureItems?.map(f => f.text) || [])].join(' ').toLowerCase();
      return text.includes('1080p') || text.includes('1080');
    });
    
    // Use style profile patterns for fallback
    const limitationPattern = styleProfile.sentencePatterns.limitation || "{free_plan} includes {feature}";
    const actionPattern = styleProfile.sentencePatterns.action || "To {action}, you need {requirement}";
    const riskPattern = styleProfile.sentencePatterns.risk || "Note that {action} may consume {resource}";
    
    // Determine usage tracking type
    let usageType = 'usage';
    for (const p of plans) {
      const text = [...(p.featureItems?.map(f => f.text) || [])].join(' ').toLowerCase();
      if (text.includes('minutes')) {
        usageType = 'minutes';
        break;
      } else if (text.includes('credits')) {
        usageType = 'credits';
        break;
      }
    }
    
    bullets.push(
      limitationPattern
        .replace(/\{free_plan\}/g, freePlan ? 'Free plans' : 'Entry plans')
        .replace(/\{feature\}/g, has720p ? '720p exports' : 'limited features')
        .replace(/\{upgrade\}/g, hasWatermark ? 'watermark removal' : 'higher quality')
        .replace(/\{paid_plan\}/g, 'paid plans'),
      paidPlans.length > 0 
        ? actionPattern
            .replace(/\{action\}/g, has1080p ? 'export at 1080p or 4K' : 'remove limitations')
            .replace(/\{requirement\}/g, 'a paid plan')
        : riskPattern
            .replace(/\{action\}/g, 'large projects')
            .replace(/\{resource\}/g, usageType),
      riskPattern
        .replace(/\{action\}/g, 're-generations and major edits')
        .replace(/\{resource\}/g, 'additional usage credits or minutes')
    );
  }
  
  // Ensure at least 2 bullets contain tool-specific terms
  const toolSpecificCount = bullets.filter(b => {
    const lower = b.toLowerCase();
    return styleProfile.uniqueTerms.some(term => lower.includes(term)) ||
           (toolName && lower.includes(toolName.toLowerCase()));
  }).length;
  
  // Generate tool-specific tip (must NOT repeat bullets content)
  let tip = '';
  const bulletsText = bullets.join(' ').toLowerCase();
  
  // Find tip from remaining candidate facts (not used in bullets)
  const remainingFacts = candidateFacts.slice(3);
  for (const fact of remainingFacts) {
    const lower = fact.toLowerCase();
    
    // Check if it's too similar to any bullet
    const isSimilarToBullet = bullets.some(b => {
      const bLower = b.toLowerCase();
      const fWords = lower.split(/\s+/).filter(w => w.length > 3);
      const bWords = bLower.split(/\s+/).filter(w => w.length > 3);
      const commonWords = fWords.filter(w => bWords.includes(w));
      return commonWords.length >= 4; // 4+ common words = too similar
    });
    
    if (!isSimilarToBullet && fact.length <= 100) {
      // Check forbidden phrases
      const hasForbidden = styleProfile.forbiddenPhrases.some(phrase => 
        lower.includes(phrase.toLowerCase())
      );
      if (!hasForbidden) {
        tip = fact;
        break;
      }
    }
  }
  
  // Fallback: generate tip from tool-specific keywords (if not already set)
  if (!tip) {
    if (styleProfile.uniqueTerms.length > 0) {
      const keywordsArray = styleProfile.uniqueTerms.slice(0, 2);
      // Use different tip patterns based on tone
      if (styleProfile.tone === 'technical') {
        tip = `Verify ${keywordsArray.join(' and ')} compatibility before starting production workflows.`;
      } else if (styleProfile.tone === 'casual') {
        tip = `Try a quick test with ${keywordsArray.join(' and ')} to see how they work for you.`;
      } else {
        tip = `Start with a small project to test ${keywordsArray.join(' and ')} limits before scaling up.`;
      }
    } else {
      // Generic but tool-specific fallback
      const toolNameStr = toolName || 'this tool';
      if (styleProfile.tone === 'direct') {
        tip = `Check ${toolNameStr} plan limits and browser requirements before large projects.`;
      } else {
        tip = `Test ${toolNameStr} with a short project first to understand your actual usage patterns.`;
      }
    }
  }
  
  // Final check: ensure tip doesn't repeat bullets (using Jaccard similarity)
  const tipLower = tip.toLowerCase();
  const hasSignificantOverlap = bullets.some(b => {
    const similarity = calculateJaccardSimilarity(tip, b);
    return similarity >= 0.5; // Jaccard threshold
  });
  
  if (hasSignificantOverlap && toolName) {
    // Regenerate tip to avoid overlap (use different pattern)
    if (styleProfile.tone === 'technical') {
      tip = `Review ${toolName} documentation for browser compatibility and export settings.`;
    } else if (styleProfile.tone === 'casual') {
      tip = `Quick tip: Check your ${toolName} plan details before exporting long videos.`;
    } else {
      tip = `For best results with ${toolName}, verify browser compatibility and plan limits before starting large projects.`;
    }
  }
  
  // Final normalization and stability checks
  // CRITICAL: This ensures same input always produces same output (no hydration mismatch)
  const normalizeText = (text: string): string => {
    let normalized = text.trim();
    
    // Remove any remaining placeholders (safety check)
    if (/\{[^}]+\}/.test(normalized)) {
      normalized = normalized.replace(/\{[^}]+\}/g, '').trim();
      // If too short after removing placeholders, use a deterministic fallback
      if (normalized.length < 10) {
        normalized = `Usage rules vary by plan. Check plan details for specific limits.`;
      }
    }
    
    // Normalize whitespace (multiple spaces to single space)
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Truncate if too long (deterministic truncation)
    if (normalized.length > 120) {
      normalized = normalized.substring(0, 117) + '...';
    }
    
    return normalized;
  };
  
  // Process bullets with normalization
  const finalBullets = bullets.slice(0, 3)
    .map(normalizeText)
    .filter(b => b.length > 0);
  
  // Ensure we have exactly 3 bullets (pad if needed, using deterministic fallbacks)
  while (finalBullets.length < 3) {
    if (candidateFacts.length > finalBullets.length) {
      const fallbackFact = candidateFacts[finalBullets.length];
      if (fallbackFact) {
        const normalized = normalizeText(fallbackFact);
        if (normalized.length > 0) {
          finalBullets.push(normalized);
          continue;
        }
      }
    }
    // Last resort: use deterministic fallback
    const fallbackIndex = finalBullets.length;
    const fallbacks = [
      `Usage is tracked by plan limits. Check your plan details for specific quotas.`,
      `Re-generations and major edits may consume additional usage credits or minutes.`,
      `Upgrade to paid plans for higher limits and additional features.`
    ];
    if (fallbackIndex < fallbacks.length) {
      finalBullets.push(fallbacks[fallbackIndex]);
    } else {
      break; // Don't add more than 3
    }
  }
  
  // Normalize tip
  let finalTip = normalizeText(tip);
  if (/\{[^}]+\}/.test(finalTip)) {
    finalTip = finalTip.replace(/\{[^}]+\}/g, '').trim();
    if (finalTip.length < 10) {
      finalTip = `Test ${toolName || 'this tool'} with a short project first to understand your actual usage patterns.`;
    }
  }
  if (finalTip.length > 100) {
    finalTip = finalTip.substring(0, 97) + '...';
  }
  
  // Final stability: ensure exactly 3 bullets, all normalized
  const stableBullets = finalBullets.slice(0, 3).map(normalizeText);
  
  return { bullets: stableBullets, tip: normalizeText(finalTip) };
}

import { PricingPlan } from '@/types/tool';

export interface StyleProfile {
  tone: 'direct' | 'helpful' | 'technical' | 'casual';
  sentencePatterns: {
    limitation?: string; // e.g., "Free plans include X, but Y requires upgrade"
    action?: string; // e.g., "To remove watermark, you need to..."
    risk?: string; // e.g., "Note that X may consume additional Y"
    comparison?: string; // e.g., "Paid plans offer X, while free plans only Y"
  };
  forbiddenPhrases: string[]; // Phrases to avoid (e.g., "Free plan...; ...")
  uniqueTerms: string[]; // Tool-specific terms that must appear
}

/**
 * Generate style profile for a tool based on its characteristics
 * Sources: category, stand-out metrics, key_facts, plan bullets
 */
export function generateStyleProfile(
  toolName: string,
  toolData?: {
    category?: string;
    stand_out_metrics?: string[];
    key_facts?: string[];
    highlights?: string[];
  },
  plans?: PricingPlan[]
): StyleProfile {
  const nameLower = toolName.toLowerCase();
  
  // Collect all text for analysis
  const allText: string[] = [];
  if (toolData?.key_facts) allText.push(...toolData.key_facts);
  if (toolData?.highlights) allText.push(...toolData.highlights);
  if (toolData?.stand_out_metrics) allText.push(...toolData.stand_out_metrics);
  
  if (plans) {
    plans.forEach(plan => {
      if (plan.featureItems) {
        allText.push(...plan.featureItems.map(f => f.text));
      }
      if (plan.highlights) allText.push(...plan.highlights);
      if (plan.features) allText.push(...plan.features);
      if (plan.description) allText.push(plan.description);
    });
  }
  
  const combinedText = allText.join(' ').toLowerCase();
  
  // Extract unique terms (tool-specific features)
  const uniqueTerms: string[] = [];
  const termPatterns = [
    /\b(watermark\s+removal|re-export|gen-ai\s+studio)\b/gi,
    /\b(scorm|lms|saml|sso|scim|mfa)\b/gi,
    /\b(brand\s+kit|custom\s+branding|white\s+label)\b/gi,
    /\b(avatars?|voice\s+cloning|photo\s+avatar)\b/gi,
    /\b(subtitles?|tts|text[- ]to[- ]speech)\b/gi,
    /\b(api\s+access|integrations?)\b/gi,
    /\b(scenes?|scene\s+limits?)\b/gi,
    /\b(voices?|languages?)\b/gi,
  ];
  
  termPatterns.forEach(pattern => {
    const matches = combinedText.match(pattern);
    if (matches) {
      matches.forEach(m => {
        const normalized = m.toLowerCase().trim();
        if (!uniqueTerms.includes(normalized)) {
          uniqueTerms.push(normalized);
        }
      });
    }
  });
  
  // Determine tone based on tool characteristics
  let tone: StyleProfile['tone'] = 'helpful';
  if (combinedText.includes('enterprise') || combinedText.includes('saml') || combinedText.includes('scim')) {
    tone = 'technical';
  } else if (combinedText.includes('simple') || combinedText.includes('easy') || combinedText.includes('quick')) {
    tone = 'casual';
  } else if (combinedText.includes('professional') || combinedText.includes('business')) {
    tone = 'direct';
  }
  
  // Determine sentence patterns based on tool type and content
  const sentencePatterns: StyleProfile['sentencePatterns'] = {};
  
  // Pattern selection based on tool characteristics
  if (nameLower.includes('veed') || combinedText.includes('re-export')) {
    sentencePatterns.limitation = "Free plans include {feature}, but {upgrade} requires {paid_plan}";
    sentencePatterns.action = "To {action}, you need to {requirement}";
    sentencePatterns.risk = "Note that {action} may consume additional {resource}";
  } else if (nameLower.includes('fliki') || combinedText.includes('minutes') || combinedText.includes('credits')) {
    sentencePatterns.limitation = "{free_plan} offers {limit}, while paid plans provide {upgrade}";
    sentencePatterns.action = "For {feature}, ensure you have sufficient {resource}";
    sentencePatterns.risk = "Be aware that {action} counts toward your {limit_type} quota";
  } else if (nameLower.includes('synthesia') || combinedText.includes('avatars') || combinedText.includes('cloning')) {
    sentencePatterns.comparison = "Paid plans unlock {feature}, whereas free plans only include {basic}";
    sentencePatterns.action = "To access {feature}, upgrade to a plan that includes {requirement}";
    sentencePatterns.risk = "Keep in mind that {feature} usage is tracked separately";
  } else if (nameLower.includes('zebracat') || combinedText.includes('scorm') || combinedText.includes('lms')) {
    sentencePatterns.comparison = "Enterprise plans feature {feature}, while standard plans offer {basic}";
    sentencePatterns.action = "To enable {feature}, select a plan with {requirement}";
    sentencePatterns.risk = "Important: {feature} requires {condition}";
  } else {
    // Default patterns
    sentencePatterns.limitation = "{free_plan} includes {feature}, but {upgrade} needs {paid_plan}";
    sentencePatterns.action = "To use {feature}, you must have {requirement}";
    sentencePatterns.risk = "Remember that {action} uses {resource}";
  }
  
  // Forbidden phrases (common templates to avoid)
  const forbiddenPhrases: string[] = [
    'free plan outputs include watermark',
    'free plans export at',
    'usage is based on minutes/credits',
    'exact rules vary by plan',
    're-generations and major edits may consume',
  ];
  
  return {
    tone,
    sentencePatterns,
    forbiddenPhrases,
    uniqueTerms: uniqueTerms.slice(0, 10), // Limit to top 10 unique terms
  };
}

/**
 * Calculate Jaccard similarity between two texts
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
  const normalize = (text: string): Set<string> => {
    return new Set(
      text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
  };
  
  const set1 = normalize(text1);
  const set2 = normalize(text2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

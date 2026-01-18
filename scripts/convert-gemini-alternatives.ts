/**
 * Convert Gemini alternatives evidence JSON to internal format
 * 
 * Usage: tsx scripts/convert-gemini-alternatives.ts <input-json-file> <tool-slug>
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load tools data from JSON file
const toolsDataPath = join(process.cwd(), 'src/data/tools.json');
const toolsData = JSON.parse(readFileSync(toolsDataPath, 'utf-8'));

// Mapping from reasonTag to standard switching reason IDs
const REASON_TAG_MAP: Record<string, string> = {
  'Cost control': 'cost-control',
  'Quality issues': 'output-quality',
  'Output limits': 'control-compliance',
  'Workflow speed': 'workflow-speed',
};

// Tool name to slug mapping (case-insensitive)
function getToolSlug(toolName: string): string | null {
  const tools = toolsData as any[];
  const normalizedName = toolName.toLowerCase().trim();
  
  // Direct match
  const tool = tools.find(t => 
    t.name.toLowerCase() === normalizedName ||
    t.slug.toLowerCase() === normalizedName ||
    t.slug.toLowerCase() === normalizedName.replace(/[.\s]+/g, '-').replace(/[^a-z0-9-]/g, '')
  );
  
  if (tool) return tool.slug;
  
  // Manual mappings for tools not in our database
  const manualMap: Record<string, string> = {
    'vidnoz': 'vidnoz',
    'vidboard': 'vidboard',
    'tavus': 'tavus',
    'colossyan': 'colossyan',
    'deepbrain ai': 'deepbrain-ai',
    'ai studios': 'deepbrain-ai',
  };
  
  return manualMap[normalizedName] || null;
}

// Compress text to max 18 words (remove clauses/adjectives, keep verifiable core)
function compressText(text: string, maxWords: number = 18): string {
  if (!text) return '';
  
  // Remove [NEED VERIFICATION] tags
  let cleaned = text.replace(/\[NEED VERIFICATION[^\]]*\]/gi, '').trim();
  
  const words = cleaned.split(/\s+/);
  if (words.length <= maxWords) return cleaned;
  
  // Try to keep the core claim by removing:
  // - Parenthetical clauses
  // - Excessive adjectives
  // - Redundant phrases
  
  // Remove parenthetical content
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
  
  // Split and take first maxWords
  const coreWords = cleaned.split(/\s+/).slice(0, maxWords);
  let result = coreWords.join(' ');
  
  // Remove trailing incomplete sentences
  if (!result.match(/[.!?]$/)) {
    const lastPeriod = result.lastIndexOf('.');
    if (lastPeriod > result.length * 0.7) {
      result = result.substring(0, lastPeriod + 1);
    }
  }
  
  return result.trim();
}

// Check if text contains [NEED VERIFICATION]
function hasVerificationTag(text: string): boolean {
  return /\[NEED VERIFICATION/i.test(text);
}

// Convert external URL to internal path
function convertToInternalPath(url: string, toolSlug: string | null): string | null {
  if (!url) return null;
  
  // Already internal
  if (url.startsWith('/')) return url;
  
  // Extract tool slug from URL if possible
  const urlLower = url.toLowerCase();
  
  // Official help/docs/terms -> map to tool pages
  if (urlLower.includes('help.') || urlLower.includes('/help/') || urlLower.includes('/docs/')) {
    if (toolSlug) return `/tool/${toolSlug}/features`;
  }
  
  if (urlLower.includes('pricing') || urlLower.includes('/pricing')) {
    if (toolSlug) return `/tool/${toolSlug}/pricing`;
  }
  
  if (urlLower.includes('terms') || urlLower.includes('/terms')) {
    if (toolSlug) return `/tool/${toolSlug}`;
  }
  
  // External review sites (reddit/g2/trustpilot) -> map to reviews if tool exists
  if (urlLower.includes('reddit.com') || urlLower.includes('g2.com') || urlLower.includes('trustpilot.com')) {
    if (toolSlug) return `/tool/${toolSlug}/reviews`;
  }
  
  // Other external URLs -> skip (return null)
  return null;
}

// Convert Gemini JSON to internal format
function convertGeminiToInternal(geminiJson: any, targetToolSlug: string): any[] {
  const result: any[] = [];
  
  // Group by tool slug
  const toolsMap = new Map<string, any>();
  
  for (const group of geminiJson.switchReasonGroups || []) {
    const reasonId = REASON_TAG_MAP[group.reasonTag] || group.reasonTag.toLowerCase().replace(/\s+/g, '-');
    
    for (const alt of group.alternatives || []) {
      const toolSlug = getToolSlug(alt.toolName);
      if (!toolSlug) {
        console.warn(`⚠️  Tool "${alt.toolName}" not found, skipping...`);
        continue;
      }
      
      if (!toolsMap.has(toolSlug)) {
        toolsMap.set(toolSlug, {
          tool: toolSlug,
          bestFor: [],
          whySwitch: [],
          tradeoffs: [],
          pricingSignals: {}
        });
      }
      
      const toolData = toolsMap.get(toolSlug)!;
      
      // Best For (max 3)
      const bestFor = (alt.bestFor || [])
        .filter((tag: string) => !hasVerificationTag(tag))
        .map((tag: string) => compressText(tag, 10)) // Shorter for tags
        .slice(0, 3);
      toolData.bestFor.push(...bestFor);
      
      // Why Switch (max 2 per group, but we'll aggregate and take top 2)
      const whySwitch = (alt.whySwitch || [])
        .filter((item: any) => item.claim && !hasVerificationTag(item.claim))
        .map((item: any) => {
          const claim = compressText(item.claim, 18);
          const sources: any[] = [];
          
          for (const source of item.sources || []) {
            const internalPath = convertToInternalPath(source.url, toolSlug);
            if (internalPath) {
              sources.push({
                url: internalPath,
                facts: [source.quote || claim].filter((f: string) => !hasVerificationTag(f))
              });
            }
          }
          
          // If no valid sources, use tool reviews as fallback
          if (sources.length === 0 && toolSlug) {
            sources.push({
              url: `/tool/${toolSlug}/reviews`,
              facts: [claim]
            });
          }
          
          return sources.length > 0 ? { claim, sources } : null;
        })
        .filter((item: any) => item !== null);
      
      toolData.whySwitch.push(...whySwitch);
      
      // Tradeoffs (max 1 per group, but we'll aggregate and take first)
      const tradeoffs = (alt.tradeoffs || [])
        .filter((item: any) => item.claim && !hasVerificationTag(item.claim))
        .map((item: any) => {
          const claim = compressText(item.claim, 18);
          const sources: any[] = [];
          
          for (const source of item.sources || []) {
            const internalPath = convertToInternalPath(source.url, toolSlug);
            if (internalPath) {
              sources.push({
                url: internalPath,
                facts: [source.quote || claim].filter((f: string) => !hasVerificationTag(f))
              });
            }
          }
          
          // If no valid sources, use tool reviews as fallback
          if (sources.length === 0 && toolSlug) {
            sources.push({
              url: `/tool/${toolSlug}/reviews`,
              facts: [claim]
            });
          }
          
          return sources.length > 0 ? { claim, sources } : null;
        })
        .filter((item: any) => item !== null);
      
      toolData.tradeoffs.push(...tradeoffs);
    }
  }
  
  // Finalize each tool data
  for (const [toolSlug, toolData] of toolsMap.entries()) {
    // Deduplicate and limit bestFor
    toolData.bestFor = Array.from(new Set(toolData.bestFor)).slice(0, 3);
    
    // Take top 2 whySwitch
    toolData.whySwitch = toolData.whySwitch.slice(0, 2);
    
    // Take first tradeoff
    toolData.tradeOff = toolData.tradeoffs[0] || null;
    delete toolData.tradeoffs;
    
    // Pricing signals (empty for now, can be filled from other sources)
    toolData.pricingSignals = {};
    
    result.push(toolData);
  }
  
  return result;
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: tsx scripts/convert-gemini-alternatives.ts <input-json-file> <tool-slug>');
  process.exit(1);
}

const inputFile = args[0];
const toolSlug = args[1];

try {
  const geminiJson = JSON.parse(readFileSync(inputFile, 'utf-8'));
  const converted = convertGeminiToInternal(geminiJson, toolSlug);
  
  // Read existing alternativesEvidence.json
  const evidencePath = join(process.cwd(), 'src/data/alternativesEvidence.json');
  let existingData: any[] = [];
  try {
    existingData = JSON.parse(readFileSync(evidencePath, 'utf-8'));
  } catch (e) {
    // File doesn't exist, start fresh
  }
  
  // Merge: remove old entries for converted tools, add new ones
  const convertedSlugs = new Set(converted.map(t => t.tool));
  const merged = [
    ...existingData.filter((item: any) => !convertedSlugs.has(item.tool)),
    ...converted
  ];
  
  // Write back
  writeFileSync(evidencePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  
  console.log(`✅ Converted ${converted.length} tools:`);
  converted.forEach(t => {
    console.log(`   - ${t.tool}: ${t.whySwitch.length} whySwitch, ${t.bestFor.length} bestFor`);
  });
  console.log(`\n📝 Updated: src/data/alternativesEvidence.json`);
  
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

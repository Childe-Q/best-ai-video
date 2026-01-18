const fs = require('fs');
const path = require('path');

// Map external URLs to internal paths
function mapToInternalUrl(url, toolSlug) {
  if (!url) return toolSlug ? `/tool/${toolSlug}` : '/tool/heygen';
  
  // Already internal
  if (url.startsWith('/')) return url;
  
  const urlLower = url.toLowerCase();
  
  // Official help/docs/terms -> map to tool pages
  if (urlLower.includes('help.heygen.com') || urlLower.includes('heygen.com/help') || urlLower.includes('heygen.com/docs')) {
    return toolSlug ? `/tool/${toolSlug}/features` : '/tool/heygen/features';
  }
  
  if (urlLower.includes('heygen.com/pricing') || urlLower.includes('pricing')) {
    return toolSlug ? `/tool/${toolSlug}/pricing` : '/tool/heygen/pricing';
  }
  
  if (urlLower.includes('heygen.com/moderation') || urlLower.includes('heygen.com/terms')) {
    return toolSlug ? `/tool/${toolSlug}` : '/tool/heygen';
  }
  
  // External review sites -> map to reviews
  if (urlLower.includes('reddit.com') || urlLower.includes('g2.com') || urlLower.includes('trustpilot.com') || 
      urlLower.includes('vidmetoo.com') || urlLower.includes('medium.com') || urlLower.includes('skywork.ai') ||
      urlLower.includes('voomo.ai') || urlLower.includes('aistudios.com') || urlLower.includes('appsumo.com') ||
      urlLower.includes('fahimai.com') || urlLower.includes('aiagentstore.ai') || urlLower.includes('synthesia.io')) {
    return toolSlug ? `/tool/${toolSlug}/reviews` : '/tool/heygen/reviews';
  }
  
  // Synthesia official help
  if (urlLower.includes('help.synthesia.io')) {
    return '/tool/synthesia/features';
  }
  
  // Tavus official
  if (urlLower.includes('tavus.io')) {
    return toolSlug ? `/tool/${toolSlug}` : '/tool/tavus';
  }
  
  // Default: map to tool overview
  return toolSlug ? `/tool/${toolSlug}` : '/tool/heygen';
}

// Convert Gemini claim to internal format
function convertClaim(geminiClaim, toolSlug) {
  const sources = [];
  
  for (const source of geminiClaim.sources || []) {
    const internalUrl = mapToInternalUrl(source.url, toolSlug);
    const facts = [];
    
    // Add quote as fact if available
    if (source.quote) {
      facts.push(source.quote);
    }
    
    // If URL couldn't be mapped properly, add verification tag
    if (!source.url.startsWith('/') && !source.url.includes('heygen.com') && !source.url.includes('synthesia.io') && !source.url.includes('tavus.io')) {
      facts.push('[NEED VERIFICATION: external source, verify on official site]');
    }
    
    // Only add source if we have at least one fact
    if (facts.length > 0) {
      sources.push({
        url: internalUrl,
        facts
      });
    }
  }
  
  // If no sources, add a default one
  if (sources.length === 0) {
    sources.push({
      url: toolSlug ? `/tool/${toolSlug}` : '/tool/heygen',
      facts: ['[NEED VERIFICATION: verify claim on official site]']
    });
  }
  
  return {
    claim: geminiClaim.claim,
    sources
  };
}

// Map tool name to slug
function getToolSlug(toolName, tools) {
  const nameLower = toolName.toLowerCase();
  
  // Direct mappings
  const mappings = {
    'heygen': 'heygen',
    'synthesia': 'synthesia',
    'elai.io': 'elai-io',
    'elai': 'elai-io',
    'vidnoz': 'vidnoz',
    'colossyan': 'colossyan',
    'deepbrain ai': 'deepbrain-ai',
    'deepbrain': 'deepbrain-ai',
    'vidboard': 'vidboard',
    'tavus': 'tavus'
  };
  
  if (mappings[nameLower]) {
    return mappings[nameLower];
  }
  
  // Search in tools.json
  const tool = tools.find(t => 
    t.name.toLowerCase() === nameLower ||
    t.slug.toLowerCase() === nameLower ||
    t.name.toLowerCase().includes(nameLower) ||
    nameLower.includes(t.name.toLowerCase())
  );
  
  return tool ? tool.slug : null;
}

// Convert Gemini JSON to internal format
function convertGeminiEvidence(geminiJson, tools) {
  const result = [];
  const toolEvidenceMap = new Map();
  
  // Process each switch reason group
  for (const group of geminiJson.switchReasonGroups || []) {
    for (const alt of group.alternatives || []) {
      const toolSlug = getToolSlug(alt.toolName, tools);
      if (!toolSlug) {
        console.warn(`⚠️  Tool not found: ${alt.toolName}, skipping...`);
        continue;
      }
      
      if (!toolEvidenceMap.has(toolSlug)) {
        toolEvidenceMap.set(toolSlug, {
          bestFor: new Set(),
          whySwitch: [],
          tradeoffs: []
        });
      }
      
      const evidence = toolEvidenceMap.get(toolSlug);
      
      // Add bestFor tags
      for (const tag of alt.bestFor || []) {
        evidence.bestFor.add(tag);
      }
      
      // Convert whySwitch claims
      for (const claim of alt.whySwitch || []) {
        evidence.whySwitch.push(convertClaim(claim, toolSlug));
      }
      
      // Convert tradeoffs
      for (const claim of alt.tradeoffs || []) {
        evidence.tradeoffs.push(convertClaim(claim, toolSlug));
      }
    }
  }
  
  // Convert to final format
  for (const [toolSlug, evidence] of toolEvidenceMap.entries()) {
    result.push({
      tool: toolSlug,
      bestFor: Array.from(evidence.bestFor),
      whySwitch: evidence.whySwitch,
      tradeoffs: evidence.tradeoffs,
      pricingSignals: {} // Will be populated separately if needed
    });
  }
  
  return result;
}

// Main function
function main() {
  const geminiJsonPath = process.argv[2] || 'temp-heygen-evidence.json';
  const toolsJsonPath = path.join(__dirname, '../src/data/tools.json');
  const evidenceJsonPath = path.join(__dirname, '../src/data/alternativesEvidence.json');
  
  // Read files
  const geminiJson = JSON.parse(fs.readFileSync(geminiJsonPath, 'utf-8'));
  const tools = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  const existingEvidence = JSON.parse(fs.readFileSync(evidenceJsonPath, 'utf-8'));
  
  // Convert Gemini JSON
  const newEvidence = convertGeminiEvidence(geminiJson, tools);
  
  // Start with existing evidence (keep all existing entries)
  const mergedEvidence = [...existingEvidence];
  
  // Add or merge new evidence entries
  for (const evidence of newEvidence) {
    // Check if tool already exists
    const existingIndex = mergedEvidence.findIndex(e => e.tool === evidence.tool);
    if (existingIndex >= 0) {
      // Merge bestFor (deduplicate)
      const existing = mergedEvidence[existingIndex];
      const bestForSet = new Set([...existing.bestFor, ...evidence.bestFor]);
      existing.bestFor = Array.from(bestForSet);
      // Append new claims (don't deduplicate, as they may be different)
      existing.whySwitch.push(...evidence.whySwitch);
      existing.tradeoffs.push(...evidence.tradeoffs);
    } else {
      // Add new tool entry
      mergedEvidence.push(evidence);
    }
  }
  
  // Sort by tool slug
  mergedEvidence.sort((a, b) => a.tool.localeCompare(b.tool));
  
  // Write back
  fs.writeFileSync(evidenceJsonPath, JSON.stringify(mergedEvidence, null, 2) + '\n', 'utf-8');
  
  // Print summary
  console.log('✅ Merged HeyGen evidence successfully!\n');
  console.log('Summary:');
  for (const evidence of newEvidence) {
    console.log(`\n  ${evidence.tool}:`);
    console.log(`    bestFor: ${evidence.bestFor.length} tags`);
    console.log(`    whySwitch: ${evidence.whySwitch.length} claims`);
    console.log(`    tradeoffs: ${evidence.tradeoffs.length} claims`);
  }
  
  // Validate JSON
  try {
    JSON.parse(fs.readFileSync(evidenceJsonPath, 'utf-8'));
    console.log('\n✅ JSON validation passed');
  } catch (e) {
    console.error('\n❌ JSON validation failed:', e);
    process.exit(1);
  }
  
  // Check for duplicate tool slugs
  const toolSlugs = mergedEvidence.map(e => e.tool);
  const duplicates = toolSlugs.filter((slug, index) => toolSlugs.indexOf(slug) !== index);
  if (duplicates.length > 0) {
    console.error('\n❌ Duplicate tool slugs found:', duplicates);
    process.exit(1);
  } else {
    console.log('✅ No duplicate tool slugs');
  }
  
  // Count heygen-specific entries
  const heygenEntry = mergedEvidence.find(e => e.tool === 'heygen');
  if (heygenEntry) {
    console.log('\n📊 HeyGen entry summary:');
    console.log(`   Tool slug: ${heygenEntry.tool}`);
    console.log(`   bestFor: ${heygenEntry.bestFor.length} tags`);
    console.log(`   whySwitch: ${heygenEntry.whySwitch.length} claims`);
    console.log(`   tradeoffs: ${heygenEntry.tradeoffs.length} claims`);
    const pricingSignalsCount = Object.keys(heygenEntry.pricingSignals || {}).length;
    console.log(`   pricingSignals: ${pricingSignalsCount} fields`);
  }
}

if (require.main === module) {
  main();
}

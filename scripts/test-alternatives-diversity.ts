/**
 * Test script to verify alternatives page diversity
 * 
 * Tests:
 * 1. Different slugs (invideo vs heygen vs fliki) should show different tool sets
 * 2. No duplicate tools within a page (each tool appears at most once)
 * 3. Each group should have tools relevant to its intent
 */

import { getAllTools } from '../src/lib/getTool';
import { canonicalAlternativesConfigs } from '../src/data/alternatives/canonical';
import { alternativesEvidence } from '../src/data/alternatives/evidence';
import { mergeCanonicalAndEvidence } from '../src/lib/alternatives/mergeCanonicalAndEvidence';

const testSlugs = ['invideo', 'heygen', 'fliki'];

function testAlternativesDiversity() {
  const allTools = getAllTools();
  
  console.log('='.repeat(80));
  console.log('ALTERNATIVES DIVERSITY TEST');
  console.log('='.repeat(80));
  console.log(`\nTotal tools in pool: ${allTools.length}`);
  console.log(`Candidate tools (excluding current): ${allTools.length - 1}\n`);
  
  const results: Record<string, {
    groups: Array<{
      id: string;
      title: string;
      toolSlugs: string[];
      toolNames: string[];
    }>;
    allSelectedSlugs: string[];
    duplicateCount: number;
  }> = {};
  
  // Test each slug
  for (const slug of testSlugs) {
    const config = canonicalAlternativesConfigs[slug];
    if (!config) {
      console.warn(`⚠️  No canonical config for ${slug}, skipping...`);
      continue;
    }
    
    const evidenceMap = new Map<string, any>();
    Object.entries(alternativesEvidence).forEach(([toolSlug, evidence]) => {
      evidenceMap.set(toolSlug, evidence);
    });
    
    const groups = mergeCanonicalAndEvidence(config, evidenceMap, allTools);
    
    const allSelectedSlugs: string[] = [];
    groups.forEach(g => g.tools.forEach(t => allSelectedSlugs.push(t.slug)));
    
    // Count duplicates
    const slugCounts = new Map<string, number>();
    allSelectedSlugs.forEach(slug => {
      slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
    });
    const duplicateCount = Array.from(slugCounts.values()).filter(count => count > 1).length;
    
    results[slug] = {
      groups: groups.map(g => ({
        id: g.id,
        title: g.title,
        toolSlugs: g.tools.map(t => t.slug),
        toolNames: g.tools.map(t => t.name)
      })),
      allSelectedSlugs: Array.from(new Set(allSelectedSlugs)),
      duplicateCount
    };
  }
  
  // Print results
  for (const [slug, result] of Object.entries(results)) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`SLUG: ${slug.toUpperCase()}`);
    console.log('='.repeat(80));
    console.log(`Total unique tools selected: ${result.allSelectedSlugs.length}`);
    console.log(`Duplicate tools: ${result.duplicateCount} (should be 0)`);
    console.log(`\nGroups:`);
    
    result.groups.forEach((group, idx) => {
      console.log(`\n  ${idx + 1}. ${group.title} (${group.id})`);
      console.log(`     Tools (${group.toolSlugs.length}):`);
      group.toolSlugs.forEach((toolSlug, toolIdx) => {
        const toolName = group.toolNames[toolIdx];
        console.log(`       ${toolIdx + 1}. ${toolName} (${toolSlug})`);
      });
    });
    
    console.log(`\n  All selected tools: ${result.allSelectedSlugs.join(', ')}`);
  }
  
  // Cross-slug comparison
  console.log(`\n${'='.repeat(80)}`);
  console.log('CROSS-SLUG COMPARISON');
  console.log('='.repeat(80));
  
  const slugs = Object.keys(results);
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const slug1 = slugs[i];
      const slug2 = slugs[j];
      const tools1 = new Set(results[slug1].allSelectedSlugs);
      const tools2 = new Set(results[slug2].allSelectedSlugs);
      
      const intersection = new Set([...tools1].filter(x => tools2.has(x)));
      const union = new Set([...tools1, ...tools2]);
      const similarity = intersection.size / union.size;
      const difference = 1 - similarity;
      
      console.log(`\n${slug1} vs ${slug2}:`);
      console.log(`  Common tools: ${intersection.size} (${Array.from(intersection).join(', ')})`);
      console.log(`  Unique to ${slug1}: ${tools1.size - intersection.size}`);
      console.log(`  Unique to ${slug2}: ${tools2.size - intersection.size}`);
      console.log(`  Difference ratio: ${(difference * 100).toFixed(1)}% (should be > 50%)`);
      
      if (difference < 0.5) {
        console.warn(`  ⚠️  WARNING: Difference ratio ${(difference * 100).toFixed(1)}% is below 50% threshold!`);
      }
    }
  }
  
  // Validation summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  
  let allPassed = true;
  
  // Check 1: No duplicates within a page
  for (const [slug, result] of Object.entries(results)) {
    if (result.duplicateCount > 0) {
      console.error(`❌ ${slug}: Has ${result.duplicateCount} duplicate tool(s) within page`);
      allPassed = false;
    } else {
      console.log(`✅ ${slug}: No duplicates within page`);
    }
  }
  
  // Check 2: Different slugs show different tools
  const slugsArray = Object.keys(results);
  for (let i = 0; i < slugsArray.length; i++) {
    for (let j = i + 1; j < slugsArray.length; j++) {
      const slug1 = slugsArray[i];
      const slug2 = slugsArray[j];
      const tools1 = new Set(results[slug1].allSelectedSlugs);
      const tools2 = new Set(results[slug2].allSelectedSlugs);
      const intersection = new Set([...tools1].filter(x => tools2.has(x)));
      const union = new Set([...tools1, ...tools2]);
      const difference = 1 - (intersection.size / union.size);
      
      if (difference < 0.5) {
        console.error(`❌ ${slug1} vs ${slug2}: Difference ratio ${(difference * 100).toFixed(1)}% < 50%`);
        allPassed = false;
      } else {
        console.log(`✅ ${slug1} vs ${slug2}: Difference ratio ${(difference * 100).toFixed(1)}% >= 50%`);
      }
    }
  }
  
  // Check 3: Each group has tools
  for (const [slug, result] of Object.entries(results)) {
    const emptyGroups = result.groups.filter(g => g.toolSlugs.length === 0);
    if (emptyGroups.length > 0) {
      console.error(`❌ ${slug}: Has ${emptyGroups.length} empty group(s)`);
      allPassed = false;
    } else {
      console.log(`✅ ${slug}: All groups have tools`);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('='.repeat(80));
}

// Run the test
testAlternativesDiversity();

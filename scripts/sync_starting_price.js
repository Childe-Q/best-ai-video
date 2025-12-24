#!/usr/bin/env node
/**
 * Script to sync starting_price with the first paid plan in pricing_plans array.
 * Logic:
 * 1. For each tool, find the first PAID plan (skip "Free", "Custom", "Contact")
 * 2. Get its price and period (e.g., "$28" + "/mo" = "$28/mo")
 * 3. Update the starting_price field with this value
 * Goal: Ensure homepage card shows the same price as the detail page "Starter" card
 */

const fs = require('fs');
const path = require('path');

function isPaidPlan(priceStr) {
  if (!priceStr) return false;
  const priceLower = priceStr.toLowerCase().trim();
  return !['free', 'custom', 'contact', ''].includes(priceLower);
}

function findFirstPaidPlan(pricingPlans) {
  if (!pricingPlans || pricingPlans.length === 0) {
    return null;
  }
  
  for (const plan of pricingPlans) {
    const price = plan.price || '';
    if (isPaidPlan(price)) {
      return plan;
    }
  }
  
  return null;
}

function syncStartingPrices(toolsData) {
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const tool of toolsData) {
    const toolName = tool.name || 'Unknown';
    const pricingPlans = tool.pricing_plans || [];
    
    // Find first paid plan
    const paidPlan = findFirstPaidPlan(pricingPlans);
    
    if (!paidPlan) {
      skippedCount++;
      console.log(`⏭️  Skipped ${toolName}: No paid plan found`);
      continue;
    }
    
    // Get price and period
    const price = (paidPlan.price || '').trim();
    const period = (paidPlan.period || '').trim();
    
    // Build new starting_price
    const newStartingPrice = `${price}${period}`;
    
    // Get old starting_price for comparison
    const oldStartingPrice = tool.starting_price || 'N/A';
    
    // Update if different
    if (oldStartingPrice !== newStartingPrice) {
      tool.starting_price = newStartingPrice;
      updatedCount++;
      console.log(`✅ Updated ${toolName}:`);
      console.log(`   Old: ${oldStartingPrice}`);
      console.log(`   New: ${newStartingPrice} (from ${paidPlan.name || 'Unknown'} plan)`);
      console.log();
    } else {
      console.log(`✓ ${toolName}: Already synced (${newStartingPrice})`);
    }
  }
  
  return { updatedCount, skippedCount };
}

function main() {
  // Get the script directory
  const scriptDir = __dirname;
  const projectRoot = path.dirname(scriptDir);
  const toolsJsonPath = path.join(projectRoot, 'src', 'data', 'tools.json');
  
  // Read tools.json
  console.log(`📖 Reading ${toolsJsonPath}...`);
  const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  
  console.log(`Found ${toolsData.length} tools\n`);
  console.log('='.repeat(60));
  console.log('Syncing starting_price with first paid plan...');
  console.log('='.repeat(60));
  console.log();
  
  // Sync prices
  const { updatedCount, skippedCount } = syncStartingPrices(toolsData);
  
  // Write back to file
  console.log('='.repeat(60));
  console.log(`📝 Writing updated data to ${toolsJsonPath}...`);
  fs.writeFileSync(toolsJsonPath, JSON.stringify(toolsData, null, 2), 'utf-8');
  
  console.log();
  console.log('='.repeat(60));
  console.log('✅ Sync Complete!');
  console.log(`   Updated: ${updatedCount} tools`);
  console.log(`   Skipped: ${skippedCount} tools (no paid plans)`);
  console.log(`   Total: ${toolsData.length} tools`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  main();
}

module.exports = { syncStartingPrices, findFirstPaidPlan, isPaidPlan };


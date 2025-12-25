const fs = require('fs');
const path = require('path');

// Read the tools.json file
const toolsPath = path.join(__dirname, '../src/data/tools.json');
const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

// Update each tool with new fields if they don't exist
const updatedTools = tools.map(tool => {
  const updatedTool = { ...tool };
  
  // Add social_links if not exists
  if (!updatedTool.social_links) {
    updatedTool.social_links = {
      twitter: '',
      linkedin: '',
      youtube: '',
      instagram: ''
    };
  }
  
  // Add deal if not exists (nullable)
  if (updatedTool.deal === undefined) {
    updatedTool.deal = null;
  }
  
  // Add review_count if not exists (default to 0)
  if (updatedTool.review_count === undefined) {
    updatedTool.review_count = 0;
  }
  
  // Add is_verified if not exists (default to false)
  if (updatedTool.is_verified === undefined) {
    updatedTool.is_verified = false;
  }
  
  // Add categories if not exists (derive from tags if available)
  if (!updatedTool.categories) {
    // Map tags to categories (you can customize this mapping)
    const tagToCategoryMap = {
      'Text-to-Video': 'Video Generators',
      'Avatar': 'AI Avatars',
      'Editor': 'Video Editors',
      'Repurposing': 'Content Repurposing',
      'Professional': 'Professional Tools',
      'Cheap': 'Budget-Friendly'
    };
    
    updatedTool.categories = updatedTool.tags
      ? updatedTool.tags
          .map(tag => tagToCategoryMap[tag] || tag)
          .filter((cat, index, self) => self.indexOf(cat) === index) // Remove duplicates
      : [];
    
    // If no categories found, add a default
    if (updatedTool.categories.length === 0) {
      updatedTool.categories = ['AI Tools'];
    }
  }
  
  return updatedTool;
});

// Write back to file
fs.writeFileSync(toolsPath, JSON.stringify(updatedTools, null, 2), 'utf8');

console.log(`✅ Successfully added social_links, deal, review_count, is_verified, and categories to ${updatedTools.length} tools`);
console.log(`📊 Fliki data:`);
const fliki = updatedTools.find(t => t.slug === 'fliki');
if (fliki) {
  console.log(`   - Deal: ${fliki.deal}`);
  console.log(`   - Review Count: ${fliki.review_count}`);
  console.log(`   - Verified: ${fliki.is_verified}`);
  console.log(`   - Categories: ${JSON.stringify(fliki.categories)}`);
}


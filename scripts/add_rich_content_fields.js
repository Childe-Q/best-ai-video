const fs = require('fs');
const path = require('path');

// Read the tools.json file
const toolsPath = path.join(__dirname, '../src/data/tools.json');
const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

// Define target audiences for each tool based on their "best_for" field
const getTargetAudience = (tool) => {
  const bestFor = tool.best_for || '';
  const audiences = [];
  
  if (bestFor.includes('Content Creators') || bestFor.includes('Creators')) {
    audiences.push('Content Creators');
  }
  if (bestFor.includes('Marketers') || bestFor.includes('Marketing')) {
    audiences.push('Marketing Teams');
  }
  if (bestFor.includes('Bloggers') || bestFor.includes('Blog')) {
    audiences.push('Content Creators');
    audiences.push('Bloggers');
  }
  if (bestFor.includes('Educators') || bestFor.includes('Education') || bestFor.includes('Training') || bestFor.includes('L&D')) {
    audiences.push('Educators');
  }
  if (bestFor.includes('Enterprise') || bestFor.includes('Corporate') || bestFor.includes('Business')) {
    audiences.push('Enterprise Teams');
  }
  if (bestFor.includes('Social Media') || bestFor.includes('Social')) {
    audiences.push('Social Media Managers');
  }
  if (bestFor.includes('YouTubers') || bestFor.includes('YouTube')) {
    audiences.push('YouTubers');
  }
  if (bestFor.includes('Podcasters') || bestFor.includes('Podcast')) {
    audiences.push('Podcasters');
  }
  if (bestFor.includes('Filmmakers') || bestFor.includes('Filmmaker')) {
    audiences.push('Filmmakers');
  }
  if (bestFor.includes('Small Businesses') || bestFor.includes('Small Business')) {
    audiences.push('Small Businesses');
  }
  
  // Remove duplicates and return
  return [...new Set(audiences)];
};

// Update each tool
const updatedTools = tools.map(tool => {
  const updatedTool = { ...tool };
  
  // Add video_url (only for Fliki, others empty)
  if (tool.slug === 'fliki') {
    // Fliki official YouTube demo video
    updatedTool.video_url = 'https://www.youtube.com/watch?v=example'; // Replace with actual Fliki demo video
  } else {
    updatedTool.video_url = '';
  }
  
  // Add target_audience_list based on best_for field
  updatedTool.target_audience_list = getTargetAudience(tool);
  
  // If no audiences found, add a generic one
  if (updatedTool.target_audience_list.length === 0) {
    updatedTool.target_audience_list = ['Content Creators'];
  }
  
  return updatedTool;
});

// Write back to file
fs.writeFileSync(toolsPath, JSON.stringify(updatedTools, null, 2), 'utf8');

console.log(`✅ Successfully added video_url and target_audience_list to ${updatedTools.length} tools`);
console.log(`📹 Fliki video_url: ${updatedTools.find(t => t.slug === 'fliki').video_url}`);
console.log(`👥 Example target audiences: ${JSON.stringify(updatedTools[0].target_audience_list)}`);


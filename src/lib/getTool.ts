import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';

const tools: Tool[] = toolsData as Tool[];

/**
 * Get a tool by its slug
 */
export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

/**
 * Get all tools
 */
export function getAllTools(): Tool[] {
  return tools;
}

/**
 * Weighted Matching System: Find alternatives based on shared tags
 * Priority: Always show Fliki, Zebracat, or Veed if they match the category
 */
export function findBestAlternatives(currentTool: Tool, allTools: Tool[], count: number = 3) {
  // Define affiliate tools (money tools) to prioritize
  const affiliateTools = ['fliki', 'zebracat', 'veed-io'];
  
  // Filter out the current tool
  const candidates = allTools.filter((t) => t.id !== currentTool.id);
  
  // Step 1: Find affiliate tools that match the category (have shared tags)
  const affiliateMatches: Array<{ tool: Tool; sharedTags: string[]; score: number }> = [];
  
  for (const affiliateSlug of affiliateTools) {
    const affiliateTool = candidates.find((t) => t.slug === affiliateSlug);
    if (affiliateTool) {
      const sharedTags = affiliateTool.tags.filter((tag) => currentTool.tags.includes(tag));
      // Even if they share 0 tags, we still want to show them (force them in)
      // But prioritize those with shared tags
      affiliateMatches.push({
        tool: affiliateTool,
        sharedTags,
        score: sharedTags.length + 10, // Add 10 to ensure they rank higher
      });
    }
  }
  
  // Sort affiliate matches by score (highest first)
  affiliateMatches.sort((a, b) => b.score - a.score);
  
  // Step 2: Get other candidates (excluding affiliate tools)
  const otherCandidates = candidates.filter(
    (t) => !affiliateTools.includes(t.slug.toLowerCase())
  );
  
  // Calculate shared tags for other candidates
  const otherScored = otherCandidates.map((candidate) => {
    const sharedTags = candidate.tags.filter((tag) => currentTool.tags.includes(tag));
    return {
      tool: candidate,
      sharedTags,
      score: sharedTags.length,
    };
  });
  
  // Sort other candidates by number of shared tags (highest first)
  otherScored.sort((a, b) => b.score - a.score);
  
  // Step 3: Combine results - affiliate tools first, then others
  // Always prioritize affiliate tools, even if they have 0 shared tags
  const allAlternatives = [
    ...affiliateMatches.map((item) => ({
      tool: item.tool,
      sharedTags: item.sharedTags,
    })),
    ...otherScored.map((item) => ({
      tool: item.tool,
      sharedTags: item.sharedTags,
    })),
  ];
  
  // Return top N alternatives (affiliate tools will be first)
  return allAlternatives.slice(0, count);
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Extract detailed review content (Why it wins, Pro Insight) from review_content
 * Excludes Bottom Line and Best For sections (those are shown in VerdictCard)
 */
export function extractDetailedReview(reviewContent: string): string {
  if (!reviewContent) return '';
  
  // In a server component, we can't use DOMParser directly
  // Instead, we'll use regex to extract sections
  let detailedContent = '';
  
  // Remove Bottom Line section (🚀 The Bottom Line)
  let cleanedContent = reviewContent.replace(/<h3[^>]*>[\s\S]*?(?:🚀|Bottom Line|The Bottom Line)[\s\S]*?<\/h3>\s*<p[^>]*>[\s\S]*?<\/p>/gi, '');
  
  // Remove Best For section (🎯 Best For:)
  cleanedContent = cleanedContent.replace(/🎯\s*Best For:[\s\S]*?(?=<h3|<div|$)/gi, '');
  cleanedContent = cleanedContent.replace(/<div[^>]*class="bg-green-50[^"]*"[^>]*>[\s\S]*?🎯[\s\S]*?Best For:[\s\S]*?<\/div>/gi, '');
  
  // Extract "Why it wins?" section
  const whyWinsMatch = cleanedContent.match(/<h3[^>]*>.*?Why[^<]*<\/h3>([\s\S]*?)(?=<h3|<div class="bg-blue|<div class='bg-blue|$)/i);
  if (whyWinsMatch) {
    detailedContent += whyWinsMatch[0];
  }
  
  // Extract "Pro Insight" section (blue background box)
  const proInsightMatch = cleanedContent.match(/<div[^>]*class="bg-blue-50[^"]*"[^>]*>[\s\S]*?<\/div>/);
  if (proInsightMatch) {
    detailedContent += proInsightMatch[0];
  }
  
  return detailedContent;
}

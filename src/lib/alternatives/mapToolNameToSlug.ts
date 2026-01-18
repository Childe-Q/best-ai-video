import { getAllTools } from '@/lib/getTool';
import { Tool } from '@/types/tool';

/**
 * Map tool display name to slug
 * Handles various name formats: "InVideo AI" -> "invideo", "ElevenLabs" -> "elevenlabs", etc.
 */
export function mapToolNameToSlug(toolName: string): string | null {
  const allTools = getAllTools();
  
  // Normalize tool name for matching
  const normalizedName = toolName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-ai$/, '')
    .replace(/-io$/, '')
    .replace(/-ai$/, '');
  
  // Try exact slug match first
  let tool = allTools.find(t => t.slug === normalizedName);
  if (tool) return tool.slug;
  
  // Try name match (case-insensitive, partial)
  tool = allTools.find(t => 
    t.name.toLowerCase() === toolName.toLowerCase() ||
    t.name.toLowerCase().includes(toolName.toLowerCase()) ||
    toolName.toLowerCase().includes(t.name.toLowerCase())
  );
  if (tool) return tool.slug;
  
  // Try slug variations
  const variations = [
    normalizedName,
    normalizedName.replace(/-ai$/, ''),
    normalizedName.replace(/-io$/, ''),
    normalizedName + '-ai',
    normalizedName + '-io',
  ];
  
  for (const variant of variations) {
    tool = allTools.find(t => t.slug === variant);
    if (tool) return tool.slug;
  }
  
  // Special cases
  const specialCases: Record<string, string> = {
    'invideo ai': 'invideo',
    'invideo': 'invideo',
    'elevenlabs': 'elevenlabs',
    'deepbrain ai': 'deepbrain-ai',
    'deepbrain': 'deepbrain-ai',
    'aistudios': 'deepbrain-ai', // DeepBrain AI is also known as AI Studios
    'zebracat': 'zebracat',
    'pictory': 'pictory',
    'synthesia': 'synthesia',
    'descript': 'descript',
    'capcut': 'capcut',
    'submagic': 'submagic',
    'captions.ai': 'captions-ai',
    'captions ai': 'captions-ai',
    'riverside': 'riverside',
    'camtasia': 'camtasia',
    'davinci resolve': 'davinci-resolve',
    'davinci': 'davinci-resolve',
    'canva': 'canva',
    'creatify': 'creatify',
    'vidnoz': 'vidnoz',
    'heygen': 'heygen',
    'hour one': 'hour-one',
    'hourone': 'hour-one',
    'd-id': 'd-id',
    'did': 'd-id',
    'colossyan': 'colossyan',
    'vyond': 'vyond',
  };
  
  const specialCase = specialCases[toolName.toLowerCase()];
  if (specialCase) {
    tool = allTools.find(t => t.slug === specialCase);
    if (tool) return tool.slug;
  }
  
  return null;
}

/**
 * Get tool by name (with fallback to slug matching)
 */
export function getToolByNameOrSlug(nameOrSlug: string): Tool | null {
  const allTools = getAllTools();
  
  // Try exact slug match
  let tool = allTools.find(t => t.slug === nameOrSlug.toLowerCase());
  if (tool) return tool;
  
  // Try name match
  tool = allTools.find(t => 
    t.name.toLowerCase() === nameOrSlug.toLowerCase() ||
    t.name.toLowerCase().includes(nameOrSlug.toLowerCase())
  );
  if (tool) return tool;
  
  // Try mapped slug
  const mappedSlug = mapToolNameToSlug(nameOrSlug);
  if (mappedSlug) {
    tool = allTools.find(t => t.slug === mappedSlug);
    if (tool) return tool;
  }
  
  return null;
}

/**
 * Evidence-only data for alternatives pages
 * This file contains ONLY copy/text content, NO structure (groups, tool lists, etc.)
 * 
 * Structure is defined in canonical.ts
 * Evidence only provides:
 * - pickThisIf (whySwitch[0])
 * - extraReason (whySwitch[1], optional)
 * - limitations (tradeoffs[0])
 * - evidenceLinks (sources URLs)
 * 
 * Pricing details are NEVER here - always from internal pricing data
 */

import { ToolEvidence } from '@/types/alternatives';

// Evidence map: toolSlug -> ToolEvidence
export const alternativesEvidence: Record<string, ToolEvidence> = {
  // Fliki alternatives evidence
  'invideo': {
    toolSlug: 'invideo',
    pickThisIf: 'Unlike Fliki, InVideo includes access to over 16 million premium iStock assets without per-asset credit penalties. Specifically tailored for automated content creation with a clear license for commercial use on social platforms.',
    extraReason: 'Fliki penalizes users by burning additional credits when re-processing scripts after a preview, forcing switches to more flexible models.',
    limitations: 'Lacks the depth of non-English accents and dialects found in Fliki\'s localized voice library. Focused on automation/marketing rather than the \'creative physics\' and stylization Pika offers.',
    bestFor: ['YouTube ads', 'Faceless channels', 'High-volume social teams'],
    evidenceLinks: [
      'https://www.vidmetoo.com/fliki-vs-invideo/',
      'https://aloa.co/ai/comparisons/ai-video-comparison/runway-vs-pika-labs'
    ]
  },
  'zebracat': {
    toolSlug: 'zebracat',
    pickThisIf: 'Offers predictable pricing and faster production efficiency for creators who produce high-volume daily content.',
    limitations: 'Primarily focused on social media formats rather than long-form educational or corporate content.',
    evidenceLinks: ['https://www.zebracat.ai/post/best-alternatives-fliki']
  },
  // Pika alternatives evidence
  'runway': {
    toolSlug: 'runway',
    pickThisIf: 'The Unlimited plan eliminates the stress of credit management and \'dud\' generations found in Pika\'s tiers.',
    extraReason: 'Gen-4 significantly leads in photorealism, capturing skin textures and eye reflections that Pika often blurs or \'filters\'. Maintains logo placement and object shapes during rotation, whereas Pika often distorts details mid-motion.',
    limitations: 'Runway\'s entry-level plan is slightly more expensive per video compared to Pika\'s Standard plan. Rendering is roughly 30% slower than Pika\'s optimized Turbo models.',
    bestFor: ['High-volume professional work', 'Unlimited generation', 'Photorealism', 'Consistent textures'],
    evidenceLinks: [
      'https://crepal.ai/blog/aivideo/runway-gen-4-vs-pika-2-benchmark/'
    ]
  },
  // Add more evidence as needed...
  // Note: Extract from dossier JSONs using extractEvidenceFromDossier()
};

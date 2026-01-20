import { CanonicalAlternativesConfig } from '@/types/alternatives';

/**
 * Canonical configuration for alternatives pages
 * This defines the STRUCTURE (groups) that cannot be overridden by evidence
 * 
 * Rules:
 * - Groups define the tabs/sections shown (id, title, description)
 * - toolSlugs is now DEPRECATED and IGNORED - tools are dynamically selected
 *   based on relevance scoring (use case match), NOT hardcoded lists
 * - Evidence can only provide copy (pickThisIf, limitations, etc.)
 * - Non-affiliate tools (runway, sora, veo) are included if relevance is high
 * - Tools are selected from ALL tools in tools.json, sorted by relevance
 * 
 * ⚠️ IMPORTANT: toolSlugs arrays below are kept for reference only.
 * They are NO LONGER USED in the selection logic - tools are selected
 * dynamically based on relevance scoring and group intent matching.
 */
export const canonicalAlternativesConfigs: Record<string, CanonicalAlternativesConfig> = {
  'invideo': {
    toolSlug: 'invideo',
    groups: [
      {
        id: 'editing-control',
        title: 'Editing control',
        description: 'Tools with more manual editing control, timeline precision, or frame-level adjustments.',
        toolSlugs: ['veed-io', 'descript']
      },
      {
        id: 'stock-voice-quality',
        title: 'Stock + voice quality',
        description: 'Alternatives with better stock libraries, higher voice quality, or more realistic audio.',
        toolSlugs: ['pictory', 'fliki']
      },
      {
        id: 'predictable-pricing',
        title: 'Predictable pricing',
        description: 'Tools with clearer pricing, better free tiers, or more predictable credit consumption.',
        toolSlugs: ['heygen', 'synthesia']
      },
      {
        id: 'avatar-videos',
        title: 'Avatar videos',
        description: 'Alternatives with better avatar quality, more natural movements, or larger avatar libraries.',
        toolSlugs: ['deepbrain-ai', 'd-id']
      }
    ]
  },
  'fliki': {
    toolSlug: 'fliki',
    groups: [
      {
        id: 'cost-control',
        title: 'Cost control',
        description: 'Avoiding credits for edits and refund difficulties.',
        toolSlugs: ['invideo', 'zebracat']
      },
      {
        id: 'quality-issues',
        title: 'Quality issues',
        description: 'Escaping stock mismatch and voice quality limitations.',
        toolSlugs: ['pictory', 'veed-io']
      },
      {
        id: 'editing-control',
        title: 'Editing control',
        description: 'Gaining post-generation control and manual editing.',
        toolSlugs: ['descript', 'capcut']
      },
      {
        id: 'workflow-speed',
        title: 'Workflow speed',
        description: 'Accelerated rendering and platform stability.',
        toolSlugs: ['heygen', 'synthesia']
      }
    ]
  },
  'veed-io': {
    toolSlug: 'veed-io',
    groups: [
      {
        id: 'cost-control',
        title: 'Cost control',
        description: 'Avoiding watermark restrictions and upgrade costs.',
        toolSlugs: ['capcut', 'submagic']
      },
      {
        id: 'quality-issues',
        title: 'Quality issues',
        description: 'Escaping export limitations and browser reliability issues.',
        toolSlugs: ['descript', 'riverside']
      },
      {
        id: 'editing-control',
        title: 'Editing control',
        description: 'Gaining advanced timeline and multi-track editing.',
        toolSlugs: ['camtasia', 'davinci-resolve']
      },
      {
        id: 'workflow-speed',
        title: 'Workflow speed',
        description: 'Faster rendering and better stability.',
        toolSlugs: ['captions-ai', 'elevenlabs']
      }
    ]
  },
  'zebracat': {
    toolSlug: 'zebracat',
    groups: [
      {
        id: 'cost-control',
        title: 'Cost control',
        description: 'Avoiding credit volatility and strict refund windows.',
        toolSlugs: ['invideo', 'canva']
      },
      {
        id: 'quality-issues',
        title: 'Quality issues',
        description: 'Escaping distorted AI faces and sync errors.',
        toolSlugs: ['synthesia', 'deepbrain-ai']
      },
      {
        id: 'editing-control',
        title: 'Editing control',
        description: 'Gaining post-generation control and manual editing.',
        toolSlugs: ['pictory', 'capcut']
      },
      {
        id: 'workflow-speed',
        title: 'Workflow speed',
        description: 'Accelerated ad creation and platform stability.',
        toolSlugs: ['creatify']
      }
    ]
  },
  'elai-io': {
    toolSlug: 'elai-io',
    groups: [
      {
        id: 'cost-control',
        title: 'Cost control',
        description: 'Avoiding credit expiration and high volume costs.',
        toolSlugs: ['vidnoz', 'heygen']
      },
      {
        id: 'quality-issues',
        title: 'Quality issues',
        description: 'Escaping stiff avatars and robotic facial dynamics.',
        toolSlugs: ['synthesia', 'hour-one']
      },
      {
        id: 'workflow-speed',
        title: 'Workflow speed',
        description: 'Reducing long wait times and rendering performance.',
        toolSlugs: ['d-id']
      },
      {
        id: 'feature-gap',
        title: 'Feature gap',
        description: 'Accessing advanced SCORM and interactive learning features.',
        toolSlugs: ['colossyan']
      }
    ]
  },
  'synthesia': {
    toolSlug: 'synthesia',
    groups: [
      {
        id: 'cost-control',
        title: 'Cost control',
        description: 'Avoiding expiring credits and high personalization fees.',
        toolSlugs: ['heygen', 'd-id']
      },
      {
        id: 'feature-gap',
        title: 'Feature gap',
        description: 'Accessing interactive quizzes and branching scenarios.',
        toolSlugs: ['colossyan', 'elai-io']
      },
      {
        id: 'quality-issues',
        title: 'Quality issues',
        description: 'Reducing uncanny valley and accented robotic voices.',
        toolSlugs: ['hour-one', 'deepbrain-ai']
      },
      {
        id: 'enterprise-security',
        title: 'Enterprise/security',
        description: 'Unlocking essential corporate features without paywalls.',
        toolSlugs: ['vyond', 'descript']
      }
    ]
  },
  'pika': {
    toolSlug: 'pika',
    groups: [
      {
        id: 'cost-control',
        title: 'Cost control',
        description: 'Avoiding expiring credits and complex cancellations.',
        toolSlugs: ['runway', 'invideo'] // Using tools that exist in tools.json
      },
      {
        id: 'quality-issues',
        title: 'Quality issues',
        description: 'Escaping "melting" physics and visual distortion.',
        toolSlugs: ['runway'] // Using tools that exist in tools.json
      },
      {
        id: 'output-limits',
        title: 'Output limits',
        description: 'Bypassing native 5-second generation limits.',
        toolSlugs: ['invideo'] // Using tools that exist in tools.json
      },
      {
        id: 'licensing-commercial',
        title: 'Licensing/commercial',
        description: 'Securing clear agency-grade commercial rights.',
        toolSlugs: ['invideo']
      }
    ]
  },
  'heygen': {
    toolSlug: 'heygen',
    groups: [
      {
        id: 'cost-control',
        title: 'Cost control',
        description: 'Avoiding expiring credits and refund difficulties.',
      },
      {
        id: 'quality-issues',
        title: 'Quality issues',
        description: 'Escaping avatar limitations and robotic movements.',
      },
      {
        id: 'feature-gap',
        title: 'Feature gap',
        description: 'Accessing advanced features and larger avatar libraries.',
      },
      {
        id: 'workflow-speed',
        title: 'Workflow speed',
        description: 'Faster rendering and better platform stability.',
      }
    ]
  }
};

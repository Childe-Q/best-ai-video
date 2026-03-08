import { VsComparison } from '@/types/vs';

export const invideoVsHeygen: VsComparison = {
  slugA: 'invideo',
  slugB: 'heygen',
  updatedAt: '2026-03-07',
  pricingCheckedAt: '2026-03-07',
  shortAnswer: {
    a: 'Choose InVideo when you need prompt-to-video drafts for shorts, social ads, and caption-first batches.',
    b: 'Choose HeyGen when your output depends on an on-screen avatar spokesperson for outreach, training, or presenter workflows.',
  },
  bestFor: {
    a: [
      'Social video batches with stock footage and auto captions',
      'Prompt-led first drafts for marketing teams',
      'Short-form ad and channel content iteration',
    ],
    b: [
      'Avatar spokesperson videos for customer communication',
      'Sales outreach and training updates with presenter format',
      'Teams standardizing reusable avatar scenes',
    ],
  },
  notFor: {
    a: [
      'Teams that require a consistent digital presenter in every video',
      'Avatar-led training where presenter realism is mandatory',
      'Workflows centered on persona continuity over stock scenes',
    ],
    b: [
      'Teams optimizing for the lowest-cost stock-scene volume production',
      'Prompt-to-stock workflows where avatar output is unnecessary',
      'Simple captioned social batches that do not need presenters',
    ],
  },
  keyDiffs: [
    {
      label: 'Core workflow',
      a: 'InVideo focuses on prompt-to-video assembly with stock scenes, captions, and voiceover.',
      b: 'HeyGen focuses on script-driven avatar presenter videos with scene-level delivery control.',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Output style and use case fit',
      a: 'Stronger fit for shorts, paid social drafts, and media-heavy marketing edits.',
      b: 'Stronger fit for spokesperson communication, onboarding explainers, and presenter-led updates.',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Team operation pattern',
      a: 'Best when teams iterate quickly on templates, stock assets, and caption variants.',
      b: 'Best when teams run repeatable avatar scripts and shared presenter workflows.',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Pricing and usage posture',
      a: 'Generally positioned for volume content workflows with plan-based usage limits.',
      b: 'Generally positioned for avatar-focused workflows with feature depth varying by plan.',
      sourceUrl: 'https://invideo.io/pricing, https://www.heygen.com/pricing',
    },
  ],
  matrixRows: [
    {
      label: 'Best for',
      a: 'Shorts, social ads, and stock-based batch drafts',
      b: 'Avatar spokesperson communication and presenter-led updates',
      aText: 'Shorts, social ads, and stock-based batch drafts',
      bText: 'Avatar spokesperson communication and presenter-led updates',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Output type',
      a: 'Prompt-to-video scenes with stock footage, subtitles, and voiceover',
      b: 'Talking avatar and presenter-style videos',
      aText: 'Prompt-to-video scenes with stock footage, subtitles, and voiceover',
      bText: 'Talking avatar and presenter-style videos',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Workflow speed',
      a: 'Fast for first drafts and batch variants; iteration cost depends on plan usage limits',
      b: 'Fast once avatar templates are set and script workflows are standardized',
      aText: 'Fast for first drafts and batch variants; iteration cost depends on plan usage limits',
      bText: 'Fast once avatar templates are set and script workflows are standardized',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Languages & dubbing',
      a: 'Supports multilingual voice and caption workflows; check current plan limits in docs',
      b: 'Supports multilingual avatar voice workflows and dubbing options; check current plan limits in docs',
      aText: 'Supports multilingual voice and caption workflows; check current plan limits in docs',
      bText: 'Supports multilingual avatar voice workflows and dubbing options; check current plan limits in docs',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Templates',
      a: 'Marketing templates and scene presets for rapid ad-style assembly',
      b: 'Avatar scene layouts and reusable presenter templates',
      aText: 'Marketing templates and scene presets for rapid ad-style assembly',
      bText: 'Avatar scene layouts and reusable presenter templates',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'API',
      a: 'See product docs; API availability depends on current plan and account scope',
      b: 'See product docs; API availability depends on current plan and account scope',
      aText: 'See product docs; API availability depends on current plan and account scope',
      bText: 'See product docs; API availability depends on current plan and account scope',
      sourceUrl: 'https://invideo.io/, https://www.heygen.com/',
    },
    {
      label: 'Pricing starting point',
      a: '$28/mo (check pricing page for billing terms)',
      b: '$29/mo (check pricing page for billing terms)',
      aText: '$28/mo (check pricing page for billing terms)',
      bText: '$29/mo (check pricing page for billing terms)',
      sourceUrl: 'https://invideo.io/pricing, https://www.heygen.com/pricing',
    },
    {
      label: 'Free plan',
      a: 'Free tier is available with limits; check current export and usage constraints',
      b: 'Free tier is available with limits; check current avatar and export constraints',
      aText: 'Free tier is available with limits; check current export and usage constraints',
      bText: 'Free tier is available with limits; check current avatar and export constraints',
      sourceUrl: 'https://invideo.io/pricing, https://www.heygen.com/pricing',
    },
  ],
  score: {
    methodNote:
      'Internal score computed from pricingValue (25%), ease (20%), speed (20%), output (20%), customization (15%). Pricing and product positioning are linked to verified pages checked on 2026-03-07; uncovered metrics are derived from structured product data.',
    weights: {
      pricingValue: 25,
      ease: 20,
      speed: 20,
      output: 20,
      customization: 15,
    },
    a: {
      pricingValue: 8.0,
      ease: 8.3,
      speed: 8.5,
      output: 7.8,
      customization: 7.4,
    },
    b: {
      pricingValue: 6.7,
      ease: 8.1,
      speed: 7.9,
      output: 9.0,
      customization: 8.5,
    },
    provenance: {
      mode: 'mixed',
      coverage: {
        pricingValue: 'verified',
        ease: 'estimated',
        speed: 'estimated',
        output: 'verified',
        customization: 'estimated',
      },
      rationale: {
        pricingValue: 'From official pricing pages and plan-level positioning.',
        ease: 'Derived from structured product data and documented workflow patterns.',
        speed: 'Derived from structured product data and workflow setup assumptions.',
        output: 'From official product pages describing output format and delivery style.',
        customization: 'Derived from structured product data and feature coverage signals.',
      },
      sources: {
        pricingValue: ['https://invideo.io/pricing', 'https://www.heygen.com/pricing'],
        ease: [],
        speed: [],
        output: ['https://invideo.io/', 'https://www.heygen.com/'],
        customization: [],
      },
    },
  },
  promptBox: {
    prompt:
      'Create a 40-second product launch update for a SaaS analytics feature. Include one opening hook, three value points, one customer proof line, and one CTA. Keep tone clear and professional.',
    settings: [
      'Duration target: 40 seconds',
      'Aspect ratio: 9:16 and 16:9 variants',
      'Language: English (US)',
      'Output format: MP4 1080p',
      'Captions: enabled',
    ],
  },
  verdict: {
    winnerPrice: 'a',
    winnerQuality: 'b',
    winnerSpeed: 'a',
    recommendation:
      'Choose InVideo for social-first batch production and faster stock-scene iteration. Choose HeyGen when avatar-led communication quality and presenter consistency are the top priority.',
  },
  faq: [
    {
      question: 'Which tool is better for social ad and shorts volume?',
      answer:
        'InVideo is usually the better fit for high-volume social drafts because its workflow is oriented around prompt-to-scene assembly and captioned stock output.',
    },
    {
      question: 'Which tool is better for spokesperson-style customer communication?',
      answer:
        'HeyGen is usually the better fit when you need a consistent avatar presenter for outreach, onboarding, or recurring announcement videos.',
    },
    {
      question: 'Should a team use both tools together?',
      answer:
        'Many teams do: InVideo for quick campaign draft volume and HeyGen for final avatar-led delivery in customer-facing or training workflows.',
    },
  ],
  related: {
    toolPages: ['/tool/invideo', '/tool/heygen'],
    alternatives: ['/tool/invideo/alternatives', '/tool/heygen/alternatives'],
    comparisons: [
      '/vs/invideo-vs-pictory',
      '/vs/invideo-vs-fliki',
      '/vs/invideo-vs-zebracat',
      '/vs/heygen-vs-synthesia',
      '/vs/fliki-vs-heygen',
    ],
  },
  disclosure:
    'This comparison uses public product information plus a structured internal scoring model. Source policy and scoring rules are documented at /methodology.',
};

export default invideoVsHeygen;

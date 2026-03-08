import { VsComparison } from '@/types/vs';

export const flikiVsHeygen: VsComparison = {
  slugA: 'fliki',
  slugB: 'heygen',
  updatedAt: '2026-03-03',
  pricingCheckedAt: '2026-03-03',
  shortAnswer: {
    a: 'Choose Fliki when your workflow is text-first and you need blog-to-video output in batches.',
    b: 'Choose HeyGen when you need an on-screen avatar spokesperson, team review flow, or approval steps.',
  },
  bestFor: {
    a: [
      'Turning scripts or blog posts into narrated videos quickly',
      'Low-overhead social video batches for creators or solo teams',
      'Voice-first explainers without filming',
    ],
    b: [
      'Avatar-led videos with presenter-style delivery',
      'Teams that need shared workspaces and review loops',
      'Training, onboarding, and customer-facing talking-head content',
    ],
  },
  notFor: {
    a: [
      'Teams that need advanced approval workflows before publish',
      'Use cases where a realistic on-screen presenter is mandatory',
      'Complex enterprise governance requirements',
    ],
    b: [
      'Very cost-sensitive bulk publishing where voice-led output is enough',
      'Simple blog-to-video jobs that prioritize speed over avatar polish',
      'Creators who only need lightweight text-to-video conversion',
    ],
  },
  keyDiffs: [
    {
      label: 'Core workflow',
      a: 'Text/blog script to narrated video',
      b: 'Avatar presentation with script and scene control',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'Team operations',
      a: 'Best for lightweight creator workflows',
      b: 'Built for workspace collaboration and approvals',
      sourceUrl: 'https://www.heygen.com/pricing',
    },
    {
      label: 'Cost posture',
      a: 'Lower entry pricing for voice-first production',
      b: 'Higher entry pricing with avatar-centric capabilities',
      sourceUrl: 'https://www.heygen.com/pricing',
    },
    {
      label: 'Output style',
      a: 'Narrated stock/media style videos',
      b: 'Presenter/avatar style videos',
      sourceUrl: 'https://www.heygen.com/',
    },
  ],
  matrixRows: [
    {
      label: 'Best for',
      a: 'Blog/script to narrated video at volume',
      b: 'Avatar spokesperson and training communication',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'Output type',
      a: 'Voiceover-led video with media scenes',
      b: 'Talking avatar/presenter video',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Workflow speed',
      a: 'Fast for text-to-video batches',
      b: 'Fast once avatar templates are prepared',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'Languages & dubbing',
      a: 'Multilingual AI voices and narration options',
      b: 'Multilingual voice and dubbing for avatar videos',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Templates',
      a: 'Template-driven scenes for quick assembly',
      b: 'Avatar scenes and reusable presentation layouts',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'API',
      a: 'API availability depends on plan and account type',
      b: 'API listed for product integrations on higher tiers',
      sourceUrl: 'https://www.heygen.com/pricing',
    },
    {
      label: 'Pricing starting point',
      a: 'Lower starting point than HeyGen',
      b: 'Higher starting point with avatar feature depth',
      sourceUrl: 'https://www.heygen.com/pricing',
    },
    {
      label: 'Free plan',
      a: 'Free tier available with usage limits',
      b: 'Free tier available with usage limits',
      sourceUrl: 'https://fliki.ai/pricing',
    },
    {
      label: 'Team collaboration',
      a: 'Suitable for small creator teams',
      b: 'Stronger workspace and approval orientation',
      sourceUrl: 'https://www.heygen.com/pricing',
    },
  ],
  score: {
    methodNote:
      'Internal score computed from pricingValue (25%), ease (20%), speed (20%), output (20%), customization (15%). Inputs come from verified product/pricing documentation checked on 2026-03-03.',
    weights: {
      pricingValue: 25,
      ease: 20,
      speed: 20,
      output: 20,
      customization: 15,
    },
    a: {
      pricingValue: 8.8,
      ease: 8.7,
      speed: 8.9,
      output: 7.9,
      customization: 7.6,
    },
    b: {
      pricingValue: 6.6,
      ease: 8.0,
      speed: 7.8,
      output: 9.1,
      customization: 8.6,
    },
    provenance: {
      mode: 'verified',
      coverage: {
        pricingValue: 'verified',
        ease: 'verified',
        speed: 'verified',
        output: 'verified',
        customization: 'verified',
      },
      rationale: {
        pricingValue: 'From official pricing pages and plan-positioning statements for both tools.',
        ease: 'From documented workflow complexity, template setup, and onboarding-related product documentation.',
        speed: 'From documented production flow and speed-related workflow claims on official pages.',
        output: 'From official product descriptions of output formats and delivery style capabilities.',
        customization: 'From feature docs covering templates, scene controls, API scope, and editing flexibility.',
      },
      sources: {
        pricingValue: ['https://fliki.ai/pricing', 'https://www.heygen.com/pricing'],
        ease: ['https://fliki.ai/', 'https://www.heygen.com/'],
        speed: ['https://fliki.ai/', 'https://www.heygen.com/'],
        output: ['https://fliki.ai/', 'https://www.heygen.com/'],
        customization: ['https://fliki.ai/', 'https://www.heygen.com/pricing'],
      },
    },
  },
  promptBox: {
    prompt:
      'Create a 45-second product update video for a B2B SaaS dashboard launch. Tone: clear and professional. Include one hook, three benefit points, one CTA, and on-screen captions.',
    settings: [
      'Duration target: 45 seconds',
      'Aspect ratio: 16:9',
      'Language: English (US)',
      'Voice style: neutral business tone',
      'Output format: MP4 1080p',
    ],
  },
  verdict: {
    winnerPrice: 'a',
    winnerQuality: 'b',
    winnerSpeed: 'a',
    recommendation:
      'Pick Fliki for fast blog/text-to-video batches and cost efficiency. Pick HeyGen when avatar-led communication quality and team workflow controls matter more than entry pricing.',
  },
  related: {
    toolPages: ['/tool/fliki', '/tool/heygen'],
    alternatives: ['/tool/fliki/alternatives', '/tool/heygen/alternatives'],
    comparisons: [
      '/vs/fliki-vs-invideo',
      '/vs/fliki-vs-pictory',
      '/vs/heygen-vs-synthesia',
      '/vs/heygen-vs-elai-io',
    ],
  },
  disclosure:
    'This comparison summarizes public information and structured scoring rules. Method details, source policy, and update rules are documented at /methodology.',
};

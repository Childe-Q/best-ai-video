import { VsComparison } from '@/types/vs';

export const flikiVsHeygen: VsComparison = {
  slugA: 'fliki',
  slugB: 'heygen',
  updatedAt: '2026-03-03',
  pricingCheckedAt: '2026-03-03',
  decisionSummary:
    'Choose Fliki when the job begins with text, blogs, or voiceover. Choose HeyGen when the message needs a visible presenter on screen.',
  shortAnswer: {
    a: 'Choose Fliki when the workflow is text-first and narration does most of the work.',
    b: 'Choose HeyGen when the message needs a visible presenter on screen.',
  },
  decisionCases: [
    {
      label: 'Blog or script to video',
      keywords: ['blog', 'script', 'text', 'voiceover', 'narrated'],
      winner: 'a',
      verdict: 'Fliki is the better fit when the source material already exists as text or audio and the job is fast narrated output.',
    },
    {
      label: 'Avatar-led communication',
      keywords: ['avatar', 'presenter', 'spokesperson', 'training', 'customer communication'],
      winner: 'b',
      verdict: 'HeyGen is the better fit when the viewer needs to see a presenter delivering the message.',
    },
    {
      label: 'Multilingual presenter updates',
      keywords: ['multilingual', 'language', 'dubbing', 'presenter', 'voice'],
      winner: 'b',
      verdict: 'HeyGen is the stronger choice when the output still needs a presenter-led format across multiple languages.',
    },
  ],
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
    helperText:
      'Run the same script in both tools to compare a narration-first workflow against a presenter-led one.',
  },
  editorialNotes: {
    whyPeopleCompareTheseTools:
      'People compare Fliki and HeyGen because both reduce traditional video production work and both can start from a script. The similarity is real at the top of the funnel, especially for teams searching for a fast AI video tool. The split happens once format matters. Fliki is usually considered for text-first, narrated, blog-to-video, or voice-led explainers. HeyGen is usually considered for presenter-led communication where an avatar or spokesperson changes how the message lands.',
    looksSimilarButActuallyDifferent:
      'On the surface, both tools help turn ideas into finished videos without filming. Underneath, they solve different jobs. Fliki is buying fast conversion from text or audio into narrated scenes. HeyGen is buying on-screen delivery through a digital presenter. That is why this comparison often looks closer than it really is.',
    realDecision:
      'The real decision is whether the message can ride on narration alone or whether it needs a speaker on screen. If a voiceover is enough, Fliki is usually the simpler workflow. If seeing the presenter matters, HeyGen is the more sensible buy.',
    chooseAIf:
      'Choose Fliki if the work begins with blog posts, scripts, or voice-led explainers and the priority is getting batches out quickly without adding an avatar layer.',
    chooseBIf:
      'Choose HeyGen if the video needs a spokesperson for outreach, onboarding, training, or customer communication, especially when a visible presenter adds trust.',
    hiddenTradeOff:
      'Fliki is usually faster and lighter for text-first conversion, but the output can feel more like narrated media than a presentation. HeyGen adds presenter presence, but that also adds more format commitment than some teams actually need.',
    whoWillRegretTheWrongChoice:
      'Content teams regret HeyGen when the real job was simple script-to-video conversion and the avatar step adds unnecessary overhead. Sales, enablement, and onboarding teams regret Fliki when the final video still feels too faceless for a message that needed a visible speaker.',
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
  faq: [
    {
      question: 'Fliki vs HeyGen: which should I choose first?',
      answer:
        'Choose Fliki if the workflow is text-first and narration is enough. Choose HeyGen if the message needs a presenter on screen.',
    },
    {
      question: 'What is the actual workflow difference?',
      answer:
        'Fliki turns scripts, blog posts, and voice-led ideas into narrated videos. HeyGen builds around avatar scenes and presenter-led delivery.',
    },
    {
      question: 'Who usually regrets the wrong choice?',
      answer:
        'Text-first content teams regret paying for a presenter workflow they do not need. Customer-facing teams regret Fliki when the message needed more human presence than narration alone could provide.',
    },
  ],
  disclosure:
    'This comparison summarizes public information and structured scoring rules. Method details, source policy, and update rules are documented at /methodology.',
};

import { VsComparison } from '@/types/vs';

export const invideoVsHeygen: VsComparison = {
  slugA: 'heygen',
  slugB: 'invideo',
  updatedAt: '2026-03-07',
  pricingCheckedAt: '2026-03-07',
  decisionSummary:
    'Choose HeyGen when the message needs a visible presenter. Choose InVideo when the job is fast stock-scene production for shorts, ads, and caption-first batches.',
  shortAnswer: {
    a: 'Choose HeyGen when the message works better with an on-screen spokesperson for training, outreach, or multilingual presenter communication.',
    b: 'Choose InVideo when you need prompt-to-video drafts for shorts, social ads, and stock-scene batches at higher output volume.',
  },
  decisionCases: [
    {
      label: 'Avatar outreach & training',
      keywords: ['avatar', 'presenter', 'spokesperson', 'training', 'outreach', 'customer communication'],
      winner: 'a',
      verdict:
        'HeyGen is the better fit when the video needs a spokesperson, trainer, or presenter who can carry the message on screen.',
    },
    {
      label: 'Shorts & social drafts',
      keywords: ['shorts', 'social', 'ads', 'captions', 'stock', 'batch'],
      winner: 'b',
      verdict:
        'InVideo is the better fit when the job is fast batch output for ads, shorts, and stock-scene social content.',
    },
    {
      label: 'Multilingual presenter updates',
      keywords: ['language', 'localization', 'dubbing', 'multilingual', 'presenter', 'voice'],
      winner: 'a',
      verdict:
        'HeyGen is the stronger choice when the same update still needs a presenter-led feel across multiple languages.',
    },
  ],
  bestFor: {
    a: [
      'Avatar-led product explainers, onboarding, and training updates',
      'Sales outreach or customer communication that needs a visible presenter',
      'Multilingual presenter workflows where the speaker is part of the message',
    ],
    b: [
      'Shorts, social ads, and stock-scene video batches',
      'Prompt-led first drafts for marketing teams',
      'Caption-first content operations that optimize for throughput',
    ],
  },
  notFor: {
    a: [
      'High-volume faceless content pipelines where a spokesperson adds extra production overhead',
      'Cheap stock-scene batch output where presenter continuity is irrelevant',
      'Teams that mainly need draft volume rather than message delivery',
    ],
    b: [
      'Presenter-led communication where trust depends on seeing a speaker',
      'Avatar-first training or outreach workflows',
      'Teams that need a consistent digital presenter across recurring videos',
    ],
  },
  keyDiffs: [
    {
      label: 'Core workflow',
      a: 'HeyGen starts from a script and a presenter, so the video is built around who is speaking and how the message is delivered.',
      b: 'InVideo starts from prompts, stock scenes, and captions, so the workflow is optimized for assembling drafts quickly rather than putting a spokesperson on screen.',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'What the finished video feels like',
      a: 'HeyGen is closer to presenter-led communication: product intros, onboarding updates, sales follow-ups, and training where the speaker carries part of the trust.',
      b: 'InVideo is closer to packaged visual content: social clips, ad variants, faceless explainers, and stock-scene drafts where speed matters more than presenter presence.',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'Where the workflow gets expensive',
      a: 'HeyGen becomes heavier when the team needs lots of throwaway variations, because presenter-led content rewards consistency more than sheer volume.',
      b: 'InVideo becomes limiting when the message really needs a person on screen, because faster stock-scene output does not automatically create presenter credibility.',
      sources: {
        a: ['https://www.heygen.com/pricing'],
        b: ['https://invideo.io/pricing'],
      },
    },
    {
      label: 'Who usually chooses each one',
      a: 'HeyGen is usually chosen by teams buying communication format: a presenter for outreach, enablement, internal updates, or multilingual delivery.',
      b: 'InVideo is usually chosen by teams buying output volume: more drafts, more ad variants, more captioned content, and faster stock-scene assembly.',
      sources: {
        a: ['https://www.heygen.com/', 'https://www.heygen.com/pricing'],
        b: ['https://invideo.io/', 'https://invideo.io/pricing'],
      },
    },
  ],
  matrixRows: [
    {
      label: 'Best for',
      a: 'Avatar spokesperson communication, training, and presenter-led updates',
      b: 'Shorts, social ads, and stock-based batch drafts',
      aText: 'Avatar spokesperson communication, training, and presenter-led updates',
      bText: 'Shorts, social ads, and stock-based batch drafts',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'Output type',
      a: 'Talking avatar and presenter-style videos',
      b: 'Prompt-to-video scenes with stock footage, subtitles, and voiceover',
      aText: 'Talking avatar and presenter-style videos',
      bText: 'Prompt-to-video scenes with stock footage, subtitles, and voiceover',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'Workflow speed',
      a: 'Fast once avatar templates, scripts, and presenter scenes are standardized',
      b: 'Fast for first drafts and batch variants when the goal is speed over presenter presence',
      aText: 'Fast once avatar templates, scripts, and presenter scenes are standardized',
      bText: 'Fast for first drafts and batch variants when the goal is speed over presenter presence',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'Languages & dubbing',
      a: 'Multilingual presenter workflows, translated delivery, and avatar voice localization',
      b: 'Multilingual voiceover and caption workflows for stock-scene videos',
      aText: 'Multilingual presenter workflows, translated delivery, and avatar voice localization',
      bText: 'Multilingual voiceover and caption workflows for stock-scene videos',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'Templates',
      a: 'Avatar scene layouts and reusable presenter templates',
      b: 'Marketing templates and scene presets for rapid ad-style assembly',
      aText: 'Avatar scene layouts and reusable presenter templates',
      bText: 'Marketing templates and scene presets for rapid ad-style assembly',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'API',
      a: 'See product docs; API availability depends on current plan and account scope',
      b: 'See product docs; API availability depends on current plan and account scope',
      aText: 'See product docs; API availability depends on current plan and account scope',
      bText: 'See product docs; API availability depends on current plan and account scope',
      sources: {
        a: ['https://www.heygen.com/'],
        b: ['https://invideo.io/'],
      },
    },
    {
      label: 'Pricing starting point',
      a: '$29/mo (check pricing page for billing terms)',
      b: '$28/mo (check pricing page for billing terms)',
      aText: '$29/mo (check pricing page for billing terms)',
      bText: '$28/mo (check pricing page for billing terms)',
      sources: {
        a: ['https://www.heygen.com/pricing'],
        b: ['https://invideo.io/pricing'],
      },
    },
    {
      label: 'Free plan',
      a: 'Free tier is available with limits; check current avatar and export constraints',
      b: 'Free tier is available with limits; check current export and usage constraints',
      aText: 'Free tier is available with limits; check current avatar and export constraints',
      bText: 'Free tier is available with limits; check current export and usage constraints',
      sources: {
        a: ['https://www.heygen.com/pricing'],
        b: ['https://invideo.io/pricing'],
      },
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
      pricingValue: 6.7,
      ease: 8.1,
      speed: 7.9,
      output: 9.0,
      customization: 8.5,
    },
    b: {
      pricingValue: 8.0,
      ease: 8.3,
      speed: 8.5,
      output: 7.8,
      customization: 7.4,
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
        pricingValue: ['https://www.heygen.com/pricing', 'https://invideo.io/pricing'],
        ease: [],
        speed: [],
        output: ['https://www.heygen.com/', 'https://invideo.io/'],
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
  editorialNotes: {
    whyPeopleCompareTheseTools:
      'People compare HeyGen and InVideo because both promise fast AI video without a traditional production stack. On the surface, that sounds like the same purchase. In practice, they are usually solving different problems. HeyGen is considered when a video needs a speaker on screen: outreach, onboarding, product education, internal updates, multilingual presenter communication. InVideo is considered when the team needs content throughput: shorts, ad variants, stock-scene explainers, captioned drafts, and fast campaign iteration. They sit in the same budget line, but the workflow choice is really presenter-led communication versus scale-first content production.',
    looksSimilarButActuallyDifferent:
      'They look similar in search because both can start from a prompt or script and both reduce traditional editing work. The overlap stops there. HeyGen is buying a delivery format: a presenter on screen. InVideo is buying production speed: scenes, captions, stock assets, and batch drafts.',
    editorsTake:
      'This is a format decision, not a generic feature contest. Buy HeyGen for speaker-led communication. Buy InVideo for throughput.',
    chooseAIf:
      'Choose HeyGen if the audience needs to see a speaker explaining, reassuring, training, or pitching. That is where presenter continuity matters more than raw output volume.',
    chooseBIf:
      'Choose InVideo if the team is shipping ad variants, shorts, captioned drafts, or stock-scene explainers where speed, quantity, and quick iteration matter more than spokesperson presence.',
    hiddenTradeOff:
      'The hidden trade-off is message authority versus output efficiency. A presenter-led workflow helps when the audience expects someone to explain, reassure, or sell, because a visible speaker changes how the message lands. It also adds operational drag: scripts need tighter phrasing, presenter consistency matters, and large batches become less forgiving. InVideo flips that trade. It is usually faster when the job is volume, testing, and channel-specific variation, but it gives up some presence because the message is carried by scenes, captions, and voiceover rather than a spokesperson.',
    whoWillRegretTheWrongChoice:
      'The first team likely to regret the wrong choice is a B2B sales-enablement or customer-education team producing outbound explainers, onboarding clips, or update videos. If they pick InVideo just because it is faster, they often get polished visuals but weaker trust because the message has no visible owner. The second is a paid social or content-ops team shipping frequent ad tests, campaign variants, and short-form batches. If they default to HeyGen, they often slow themselves down protecting presenter consistency in a workflow that mostly needs cheap, fast iteration. In both cases, the mistake comes from buying AI video in general instead of buying for the exact communication format.',
  },
  verdict: {
    winnerPrice: 'b',
    winnerQuality: 'a',
    winnerSpeed: 'b',
    recommendation:
      'If the message depends on a speaker being seen and trusted, start with HeyGen. If the job is shipping more shorts, ad drafts, and stock-scene content, start with InVideo.',
  },
  faq: [
    {
      question: 'HeyGen vs InVideo: which should I choose first?',
      answer:
        'Choose HeyGen if the video needs a presenter on screen. Choose InVideo if the goal is faster stock-scene production for shorts, social ads, and caption-first batches.',
    },
    {
      question: 'What is the actual workflow difference?',
      answer:
        'HeyGen is built around presenter delivery. InVideo is built around prompt-to-scene assembly, stock footage, captions, and faster batch drafts.',
    },
    {
      question: 'Who usually regrets the wrong choice?',
      answer:
        'Sales enablement and onboarding teams regret InVideo when the message needed a visible presenter. Content-ops and paid social teams regret HeyGen when the workflow mostly needed cheap, fast variation.',
    },
  ],
  related: {
    toolPages: ['/tool/heygen', '/tool/invideo'],
    alternatives: ['/tool/heygen/alternatives', '/tool/invideo/alternatives'],
    comparisons: [
      '/vs/heygen-vs-synthesia',
      '/vs/fliki-vs-heygen',
      '/vs/invideo-vs-pictory',
      '/vs/fliki-vs-invideo',
      '/vs/invideo-vs-zebracat',
    ],
  },
  disclosure:
    'This comparison uses public product information plus a structured internal scoring model. Source policy and scoring rules are documented at /methodology.',
};

export default invideoVsHeygen;

import { VsComparison } from '@/types/vs';

export const flikiVsHeygen: VsComparison = {
  slugA: 'fliki',
  slugB: 'heygen',
  updatedAt: '2026-04-26',
  pricingCheckedAt: '2026-03-03',
  decisionSummary:
    'Choose Fliki when the job starts from scripts, blogs, PPTs, or PDFs and needs narrated baseline video with pronunciation and automation controls. Choose HeyGen when the job needs presenter-led delivery, proofreader review, governance controls, or SCORM/LMS-style training handoff.',
  shortAnswer: {
    a: 'Choose Fliki when source content already exists as text, blog, PPT, or PDF and the team wants a narrated draft plus manual cleanup.',
    b: 'Choose HeyGen when the video needs a presenter, reviewer-controlled localization, voice direction, or formal training delivery.',
  },
  decisionCases: [
    {
      label: 'PPT, PDF, or blog to narrated draft',
      keywords: ['ppt', 'pdf', 'blog', 'script', 'text', 'voiceover', 'narrated'],
      winner: 'a',
      verdict: 'Fliki is the better fit when the source already exists and the goal is a narrated baseline video that the team can clean up.',
    },
    {
      label: 'Reviewed avatar-led localization',
      keywords: ['avatar', 'presenter', 'proofreader', 'review', 'localization', 'training'],
      winner: 'b',
      verdict: 'HeyGen is the better fit when localization needs a presenter plus proofreader control over wording, phonetics, voice, and glossary choices.',
    },
    {
      label: 'Formal training delivery',
      keywords: ['scorm', 'lms', 'training', 'governance', 'admin', 'delivery'],
      winner: 'b',
      verdict: 'HeyGen is the stronger choice when SCORM-style delivery signals, admin restrictions, and presenter consistency matter more than fast narration.',
    },
  ],
  bestFor: {
    a: [
      'Turning scripts, blogs, PPTs, or PDFs into narrated baseline videos',
      'Teams that value pronunciation mapping and phrase-level B-roll timing',
      'Automation-assisted publishing where setup friction is acceptable',
    ],
    b: [
      'Presenter-led videos that need visible avatar delivery',
      'Localization workflows with proofreader review and voice control',
      'Training and internal communication workflows that need governance or SCORM-style delivery signals',
    ],
  },
  notFor: {
    a: [
      'Teams expecting PPT/PDF import to produce a nearly finished video without cleanup',
      'Organizations that need proofreader-style review gates before final generation',
      'Use cases where a realistic on-screen presenter is mandatory',
    ],
    b: [
      'Simple document-to-narration jobs where an avatar layer adds overhead',
      'Automation pipelines where Template ID, Voice ID, Folder ID, and webhook setup are the main buying reason',
      'Voice-first drafts where scene cleanup matters more than presenter realism',
    ],
  },
  keyDiffs: [
    {
      label: 'Source material entry path',
      a: 'Fliki is stronger when the workflow begins with text, blogs, PPTs, or PDFs and needs a narrated baseline timeline.',
      b: 'HeyGen is stronger when the workflow begins with a presenter-led message and the avatar remains central to delivery.',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'Language control depth',
      a: 'Fliki gives useful spoken-output control through pronunciation mapping, but displayed text and translated media still need separate review.',
      b: 'HeyGen goes deeper on presenter language review through proofreader edits, phonetics, voice choice, glossary mapping, and final-generation control.',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Formal delivery posture',
      a: 'Fliki is better framed as training or creator-content drafting with manual cleanup and publishing setup.',
      b: 'HeyGen has stronger formal delivery signals through SCORM export settings, admin restrictions, and governed avatar access.',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Automation friction',
      a: 'Fliki automation can be valuable, but the stable judgment is that API keys, Template ID, Voice ID, Folder ID, webhooks, and filters add setup friction.',
      b: 'HeyGen is less about pipeline automation here and more about controlled presenter production, review, and delivery governance.',
      sourceUrl: 'https://fliki.ai/',
    },
  ],
  matrixRows: [
    {
      label: 'Best for',
      a: 'Narrated baseline videos from scripts, blogs, PPTs, or PDFs',
      b: 'Reviewed presenter-led training, internal comms, and localization',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'Output type',
      a: 'Voiceover-led video with media scenes and manual cleanup',
      b: 'Avatar/presenter video with stronger review and governance signals',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Document entry maturity',
      a: 'PPT/PDF import is useful for baseline scene, script, and voiceover generation, not guaranteed publish-ready output',
      b: 'Less focused on PPT/PDF conversion; stronger when the presenter format is the core requirement',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'Language control',
      a: 'Pronunciation map helps spoken output, while subtitles and on-screen text still need separate checks',
      b: 'Proofreader workflow supports wording, phonetics, voice, and glossary changes before final generation',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Formal training delivery',
      a: 'Useful for training drafts and presentation-style narration, but LMS-style delivery is not the core evidence',
      b: 'SCORM export settings and admin controls make the training-delivery story stronger',
      sourceUrl: 'https://fliki.ai/',
    },
    {
      label: 'Automation setup',
      a: 'Automation depends on IDs, keys, folders, webhooks, and filters; useful but configuration-heavy',
      b: 'Workflow strength is review, voice control, and governed delivery rather than lightweight automation setup',
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
      'Create a 60-second training update from an existing slide deck or script. Include one translated term, a brand pronunciation requirement, a presenter/narrator choice, and an export-ready handoff note.',
    settings: [
      'Duration target: 45 seconds',
      'Aspect ratio: 16:9',
      'Language: English (US)',
      'Voice style: neutral business tone',
      'Output format: MP4 1080p',
    ],
    helperText:
      'Run the same source in both tools to compare document/text-to-narration drafting against presenter-led localization and delivery review.',
  },
  editorialNotes: {
    whyPeopleCompareTheseTools:
      'People compare Fliki and HeyGen because both reduce traditional video production work and both can start from existing words. The split is not feature count. Fliki is closer to source-material conversion: script, blog, PPT, or PDF into a narrated baseline. HeyGen is closer to presenter-led production where review, voice control, and avatar governance matter.',
    looksSimilarButActuallyDifferent:
      'On the surface, both tools help turn ideas into videos without filming. Underneath, Fliki buys baseline generation plus voice and scene adjustments. HeyGen buys a visible presenter plus proofreader review, voice direction, admin restrictions, and stronger formal-delivery signals.',
    realDecision:
      'The real decision is whether the source material should become a narrated draft, or whether the message needs a controlled presenter workflow. If narration and cleanup are enough, Fliki is the simpler fit. If proofread localization, avatar consistency, or SCORM-style delivery matters, HeyGen is the safer fit.',
    chooseAIf:
      'Choose Fliki if the work begins with scripts, blogs, PPTs, or PDFs and the priority is generating a useful narrated baseline with pronunciation and B-roll controls.',
    chooseBIf:
      'Choose HeyGen if the video needs a presenter, proofreader-controlled localization, voice direction, admin restrictions, or formal training delivery signals.',
    hiddenTradeOff:
      'Fliki can be lighter for document and text conversion, but PPT/PDF output still needs cleanup and automation is configuration-heavy. HeyGen adds stronger presenter review and governance, but that format can be unnecessary overhead for simple narrated drafts.',
    whoWillRegretTheWrongChoice:
      'Content teams regret HeyGen when the real job was PPT, PDF, or blog-to-narrated-video conversion. Training, enablement, and localization teams regret Fliki when the final output needed a reviewed presenter workflow or LMS-style handoff rather than a cleaned-up narrated draft.',
  },
  verdict: {
    winnerPrice: 'a',
    winnerQuality: 'b',
    winnerSpeed: 'a',
    recommendation:
      'Pick Fliki for document, script, and blog-to-narrated-video workflows where cleanup is acceptable. Pick HeyGen when presenter-led review, voice control, governance, and SCORM-style delivery matter more than lightweight conversion.',
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
        'Choose Fliki if the workflow starts from scripts, blogs, PPTs, or PDFs and narration is enough. Choose HeyGen if the message needs a controlled presenter, proofreader review, or formal training handoff.',
    },
    {
      question: 'What is the actual workflow difference?',
      answer:
        'Fliki turns existing source material into narrated baseline videos with cleanup and automation setup. HeyGen builds around avatar scenes, presenter delivery, review controls, and stronger governance signals.',
    },
    {
      question: 'Who usually regrets the wrong choice?',
      answer:
        'Document-first content teams regret paying for a presenter workflow they do not need. Training and localization teams regret Fliki when the output needed proofreader control, presenter consistency, or SCORM-style delivery.',
    },
  ],
  disclosure:
    'This comparison summarizes public information and structured scoring rules. Method details, source policy, and update rules are documented at /methodology.',
};

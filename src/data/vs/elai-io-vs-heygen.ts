import { VsComparison } from '@/types/vs';

export const elaiIoVsHeygen: VsComparison = {
  slugA: 'elai-io',
  slugB: 'heygen',
  updatedAt: '2026-05-13',
  pricingCheckedAt: '2026-05-13',
  intentProfile: {
    primary: 'avatar',
    intents: ['avatar'],
  },
  decisionSummary:
    'Choose Elai.io when the job starts from decks, notes, or structured training content and needs branching microlearning more than presenter polish. Choose HeyGen when reviewed localization, voice control, governance, and SCORM-style delivery matter more than slide-first conversion.',
  shortAnswer: {
    a: 'Choose Elai.io for PPT-first training conversion, branching remediation, and browser-based presenter explainers built from existing course material.',
    b: 'Choose HeyGen for proofreader-controlled localization, stronger voice direction, clearer governance signals, and more formal training delivery posture.',
  },
  decisionCases: [
    {
      label: 'PPT-first training conversion',
      keywords: ['ppt', 'pdf', 'slides', 'notes', 'course', 'training'],
      winner: 'a',
      verdict: 'Elai.io is the better fit when existing decks and presenter notes are the source material and the goal is to turn them into microlearning faster.',
    },
    {
      label: 'Reviewed multilingual presenter delivery',
      keywords: ['proofreader', 'review', 'glossary', 'voice', 'localization', 'presenter'],
      winner: 'b',
      verdict: 'HeyGen is the better fit when the rollout needs reviewer control over wording, phonetics, voice choice, and glossary decisions before final generation.',
    },
    {
      label: 'Formal training handoff',
      keywords: ['scorm', 'lms', 'admin', 'governance', 'delivery', 'training'],
      winner: 'b',
      verdict: 'HeyGen is the stronger choice when SCORM-style delivery, admin restrictions, and governed rollout matter more than slide-first authoring speed.',
    },
  ],
  bestFor: {
    a: [
      'Turning PPTs, PDFs, and presenter notes into avatar-led training videos',
      'Microlearning with remediation-style branching and browser-based authoring',
      'Teams that want brand application and downstream video-platform handoff from a structured content base',
    ],
    b: [
      'Reviewed multilingual presenter videos',
      'Training or internal communications that need stronger governance and admin restrictions',
      'Workflows where voice direction, proofreader review, and SCORM-style delivery matter more than deck conversion',
    ],
  },
  notFor: {
    a: [
      'Teams expecting freeform cinematic generation or deep timeline editing',
      'Buyers who need low-friction custom avatars from casual office or phone footage',
      'Localization workflows that require strong translation review and lip-sync confidence before publishing',
    ],
    b: [
      'Deck-heavy teams that mainly need PPT notes turned into narrated training without an extra presenter-control layer',
      'Organizations that need branching remediation logic inside the authoring workflow more than presenter polish',
      'Use cases where a visible presenter is less important than fast old-asset conversion',
    ],
  },
  keyDiffs: [
    {
      label: 'Workflow anchor',
      a: 'Elai.io is anchored in PPT/PDF import, editable slide objects, notes-to-speech mapping, and branching quiz logic.',
      b: 'HeyGen is anchored in avatar scenes, proofreader review, voice direction, and a more governed presenter workflow.',
      sourceUrl: 'https://elai.io/',
    },
    {
      label: 'Localization control depth',
      a: 'Elai translates editable text objects and speech text, but side-by-side review and stable lip-sync are still weaker evidence.',
      b: 'HeyGen goes deeper on reviewed localization through proofreader edits, phonetics, voice choice, glossary mapping, and final-generation control.',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Interaction model',
      a: 'Elai shows stronger evidence for branching remediation inside microlearning-style slide flows.',
      b: 'HeyGen shows stronger evidence for presenter-led delivery, review, and polished avatar communication rather than branching lesson logic.',
      sourceUrl: 'https://elai.io/',
    },
    {
      label: 'Delivery posture',
      a: 'Elai has enterprise-training handoff signals such as Brand Kit, Workspace, and Export to Panopto, but exported interaction persistence is not proven.',
      b: 'HeyGen has stronger formal delivery signals through SCORM export settings, admin controls, and governed avatar access.',
      sourceUrl: 'https://www.heygen.com/',
    },
  ],
  matrixRows: [
    {
      label: 'Best for',
      a: 'Deck-to-avatar training conversion and branching microlearning',
      b: 'Reviewed multilingual presenter videos and SCORM-style training delivery',
      sourceUrl: 'https://elai.io/',
    },
    {
      label: 'Input starting point',
      a: 'PPT, PDF, and presenter notes are the clearest demonstrated entry path',
      b: 'Script- and presenter-led workflow matters more than deck conversion',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Interaction depth',
      a: 'Branching quiz with wrong-answer jumpback and remediation logic is clearly shown',
      b: 'Presenter review and voice control are stronger than branching lesson logic',
      sourceUrl: 'https://elai.io/',
    },
    {
      label: 'Translation control',
      a: 'Useful for editable text plus speech translation, but review and lip-sync remain weaker evidence',
      b: 'Proofreader workflow supports wording, phonetics, voice, and glossary edits before final generation',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Custom avatar burden',
      a: 'Custom avatar creation depends on tightly controlled source-footage rules and low movement',
      b: 'Custom-avatar and presenter workflows still have quality boundaries, but the official review and voice stack is stronger',
      sourceUrl: 'https://elai.io/',
    },
    {
      label: 'Formal delivery posture',
      a: 'Video-platform handoff is visible, but preserving interactivity after export is unproven',
      b: 'SCORM settings, admin restrictions, and governed rollout signals are clearer',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Governance signals',
      a: 'Workspace and Brand Kit matter, but collaboration depth is still weakly shown',
      b: 'Admin controls and review roles are more concrete and better evidenced',
      sourceUrl: 'https://www.heygen.com/',
    },
    {
      label: 'Buyer posture',
      a: 'Best when the team wants to reactivate old course assets quickly',
      b: 'Best when the team wants a more reviewed, presenter-first communication stack',
      sourceUrl: 'https://elai.io/',
    },
  ],
  score: {
    methodNote:
      'Internal score computed from pricingValue (20%), ease (20%), speed (20%), output (20%), customization (20%). This version leans on official product pages plus official YouTube evidence for workflow depth rather than broad feature-count claims.',
    weights: {
      pricingValue: 20,
      ease: 20,
      speed: 20,
      output: 20,
      customization: 20,
    },
    a: {
      pricingValue: 8.1,
      ease: 8.6,
      speed: 8.2,
      output: 7.7,
      customization: 7.3,
    },
    b: {
      pricingValue: 6.8,
      ease: 8.0,
      speed: 7.9,
      output: 8.9,
      customization: 8.8,
    },
    provenance: {
      mode: 'mixed',
      coverage: {
        pricingValue: 'estimated',
        ease: 'verified',
        speed: 'verified',
        output: 'verified',
        customization: 'verified',
      },
      rationale: {
        pricingValue: 'Relative plan posture is inferred from current local tool pricing content and official product positioning rather than a fresh pricing re-audit in this task.',
        ease: 'From official-body workflow evidence covering PPT conversion, review steps, and presenter authoring flows.',
        speed: 'From documented production friction, review gates, and slide-first versus presenter-first workflow shape.',
        output: 'From official product demos showing branching training versus reviewed presenter delivery and SCORM posture.',
        customization: 'From official demos covering brand kit, branching, avatar setup, proofreader review, and voice controls.',
      },
      sources: {
        pricingValue: ['https://elai.io/pricing', 'https://www.heygen.com/pricing'],
        ease: ['https://elai.io/', 'https://www.heygen.com/'],
        speed: ['https://elai.io/', 'https://www.heygen.com/'],
        output: ['https://elai.io/', 'https://www.heygen.com/'],
        customization: ['https://elai.io/', 'https://www.heygen.com/'],
      },
    },
  },
  promptBox: {
    prompt:
      'Turn a 5-slide onboarding deck into a 60-second training video. Preserve presenter notes as speech, add one remediation quiz, translate one scene, and decide whether the workflow needs branching or proofreader review more.',
    settings: [
      'Duration target: 60 seconds',
      'Aspect ratio: 16:9',
      'Primary language: English',
      'Secondary language check: one translated scene',
      'Output target: training handoff',
    ],
    helperText:
      'Run the same training brief in both tools to compare slide-first microlearning conversion against reviewed presenter-led delivery.',
  },
  editorialNotes: {
    whyPeopleCompareTheseTools:
      'People compare Elai.io and HeyGen because both can put an avatar on screen for training or explainers. The overlap is real, but the real buying split is source workflow: old-asset conversion versus reviewed presenter delivery.',
    looksSimilarButActuallyDifferent:
      'Both tools can create avatar-led explainers. Elai feels more like a deck-to-course system with branching logic and editable-slide translation. HeyGen feels more like a presenter-first system with stronger voice, review, and governance layers.',
    realDecision:
      'The real decision is whether the job starts from slides and notes that need to become microlearning quickly, or whether the job needs a controlled presenter workflow with proofreader review and formal delivery signals.',
    chooseAIf:
      'Choose Elai.io if the content already exists in decks or PDFs and the fastest win is converting structured training material into avatar microlearning with branching and branding.',
    chooseBIf:
      'Choose HeyGen if the final output needs reviewer-controlled localization, stronger voice direction, admin restrictions, or SCORM-style training delivery.',
    hiddenTradeOff:
      'Elai can feel more direct for deck conversion, but translation review, lip-sync confidence, and export-side interactivity are weaker than the top-line narrative suggests. HeyGen brings more review and governance depth, but that extra presenter-control layer is overhead for simple deck conversion jobs.',
    whoWillRegretTheWrongChoice:
      'L&D teams regret HeyGen when the real need was turning decks and notes into branching microlearning quickly. Localization, enablement, and governance teams regret Elai when they actually needed proofreader control, stronger voice direction, and clearer formal-delivery posture.',
  },
  verdict: {
    winnerPrice: 'a',
    winnerQuality: 'b',
    winnerSpeed: 'a',
    recommendation:
      'Pick Elai.io for PPT-first training conversion, branching microlearning, and brand-guided old-asset refresh. Pick HeyGen when review depth, voice control, governance, and SCORM-style delivery matter more than slide-first speed.',
  },
  related: {
    toolPages: ['/tool/elai-io', '/tool/heygen'],
    alternatives: ['/tool/elai-io/alternatives', '/tool/heygen/alternatives'],
    comparisons: [
      '/vs/elai-io-vs-synthesia',
      '/vs/heygen-vs-synthesia',
      '/vs/fliki-vs-heygen',
      '/vs/heygen-vs-invideo',
    ],
  },
  faq: [
    {
      question: 'Elai.io vs HeyGen: which should I choose first?',
      answer:
        'Choose Elai.io if the workflow starts from slides, notes, or training decks and branching microlearning matters. Choose HeyGen if the output needs presenter review, stronger voice control, or SCORM-style delivery.',
    },
    {
      question: 'What is the practical workflow difference?',
      answer:
        'Elai.io is stronger when the source content already exists and needs to become an avatar-led lesson quickly. HeyGen is stronger when localization review, presenter polish, and governance matter more than deck conversion.',
    },
    {
      question: 'Who usually regrets the wrong choice?',
      answer:
        'Deck-heavy training teams regret HeyGen when the work mostly needed old-asset conversion. Review-heavy localization or governed rollout teams regret Elai when they needed proofreader control and stronger formal delivery signals.',
    },
  ],
  disclosure:
    'This comparison summarizes public information and structured scoring rules. Method details, source policy, and update rules are documented at /methodology.',
};

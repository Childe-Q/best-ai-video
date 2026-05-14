import { VsComparison } from '@/types/vs';

export const pikaVsRunway: VsComparison = {
  slugA: 'pika',
  slugB: 'runway',
  updatedAt: '2026-05-13',
  pricingCheckedAt: '2026-05-13',
  intentProfile: {
    primary: 'text',
    intents: ['text'],
  },
  decisionSummary:
    'Choose Pika when the real experiment is live AI selves, persona-led interaction, or agent-style task handling. Choose Runway when the job is still creative video generation, cinematic iteration, and a heavier production workflow.',
  shortAnswer: {
    a: 'Choose Pika when you are testing digital selves, live talking-head agents, or persona-led experiments more than scene-directed creative generation.',
    b: 'Choose Runway when you need a production-oriented creative environment for cinematic concept footage, generated shots, and deeper visual control.',
  },
  decisionCases: [
    {
      label: 'Live AI self experiments',
      keywords: ['agent', 'live', 'persona', 'meeting', 'digital self', 'mcp'],
      winner: 'a',
      verdict: 'Pika is the better fit when the decision is really about live persona interaction and task-taking avatars rather than traditional video creation.',
    },
    {
      label: 'Cinematic concept footage',
      keywords: ['cinematic', 'shot', 'concept', 'ad', 'camera', 'scene'],
      winner: 'b',
      verdict: 'Runway is the better fit when the team needs scene quality, shot shaping, and a workflow closer to production.',
    },
    {
      label: 'Governed creative production',
      keywords: ['brand', 'studio', 'control', 'post', 'workflow', 'team'],
      winner: 'b',
      verdict: 'Runway is the stronger choice when the buyer needs a more professional creative-generation environment rather than an agent-first experiment layer.',
    },
  ],
  bestFor: {
    a: [
      'AI self pilots and live persona demos',
      'Task-taking avatar experiments where MCP or tool actions matter more than scene control',
      'Creator-side digital-self or fan-interaction prototypes',
    ],
    b: [
      'Cinematic concept footage and premium creative drafts',
      'Teams that need stronger control over generated scenes and post-generation workflow depth',
      'Brand or studio teams building on a more conventional creative-video path',
    ],
  },
  notFor: {
    a: [
      'Buyers who need strong safety rails, approval gates, or clear enterprise governance before rollout',
      'Teams expecting deep camera, style, or timeline control in the current official product evidence',
      'Production workflows where live-agent novelty matters less than stable visual output quality',
    ],
    b: [
      'Buyers whose real experiment is digital selves or meeting-style AI personas',
      'Teams that only need a lighter persona-led prototype rather than a heavier creative stack',
      'Simple task-taking demos where generation quality is secondary to agent interaction',
    ],
  },
  keyDiffs: [
    {
      label: 'Core product identity',
      a: 'Pika currently looks more like an AI-self and live-agent platform than a classic short-clip generator.',
      b: 'Runway remains a creative-generation environment built around shot quality, model access, and visual workflow depth.',
      sourceUrl: 'https://pika.art/',
    },
    {
      label: 'Interaction model',
      a: 'Pika shows real-time talking-head interaction and tool-backed task handling through PikaStream and MCP demos.',
      b: 'Runway is still the better fit when the work is generating and refining visual scenes rather than conversational agents.',
      sourceUrl: 'https://runwayml.com/',
    },
    {
      label: 'Control depth',
      a: 'Pika currently exposes more signal around persona configuration and tool hooks than around camera, scene, or style controls.',
      b: 'Runway is stronger when the buyer needs creative control and a workflow closer to production rather than a black-box live persona.',
      sourceUrl: 'https://runwayml.com/',
    },
    {
      label: 'Risk posture',
      a: 'Pika carries weaker evidence for safety boundaries, approval steps, latency handling, and persistent memory reliability.',
      b: 'Runway is still a heavier workflow, but the comparison question is more about creative quality trade-offs than agent safety unknowns.',
      sourceUrl: 'https://pika.art/',
    },
  ],
  matrixRows: [
    {
      label: 'Best for',
      a: 'Live AI selves, persona-led interaction, and task-taking avatar experiments',
      b: 'Cinematic concept footage and premium creative generation',
      sourceUrl: 'https://runwayml.com/',
    },
    {
      label: 'Primary workflow',
      a: 'Live interaction and agent-style task handling',
      b: 'Creative scene generation and visual iteration',
      sourceUrl: 'https://pika.art/',
    },
    {
      label: 'Control center',
      a: 'Persona configuration, voice, personality, and tool hooks',
      b: 'Creative model choice, visual workflow depth, and stronger production posture',
      sourceUrl: 'https://runwayml.com/',
    },
    {
      label: 'Interaction proof',
      a: 'PikaStream and MCP are the clearest current evidence',
      b: 'Runway is less about live interaction and more about visual output quality',
      sourceUrl: 'https://pika.art/',
    },
    {
      label: 'Governance and safety',
      a: 'Approval, undo, takeover, and auth boundaries are weakly evidenced',
      b: 'The trade-off is workflow weight, not a missing live-agent safety story',
      sourceUrl: 'https://runwayml.com/',
    },
    {
      label: 'Buyer posture',
      a: 'Experiment-led and persona-first',
      b: 'Creative-production-led and quality-first',
      sourceUrl: 'https://pika.art/',
    },
  ],
  score: {
    methodNote:
      'Internal score computed from pricingValue (20%), ease (20%), speed (20%), output (20%), customization (20%). This authored version emphasizes the current product split: live agent interaction versus creative-generation quality.',
    weights: {
      pricingValue: 20,
      ease: 20,
      speed: 20,
      output: 20,
      customization: 20,
    },
    a: {
      pricingValue: 7.8,
      ease: 8.1,
      speed: 8.4,
      output: 6.8,
      customization: 6.7,
    },
    b: {
      pricingValue: 6.6,
      ease: 7.2,
      speed: 7.5,
      output: 9.2,
      customization: 8.9,
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
        pricingValue: 'Relative value posture is estimated from current local pricing content and product positioning, not a dedicated fresh pricing re-audit in this task.',
        ease: 'From official-body evidence about how much workflow is live-agent interaction versus heavier creative production.',
        speed: 'From the lighter experiment posture of Pika versus the heavier creative workflow posture of Runway.',
        output: 'From official product positioning around live persona interaction versus premium creative scene generation.',
        customization: 'From persona and tool-hook configuration on Pika versus creative workflow depth on Runway.',
      },
      sources: {
        pricingValue: ['https://pika.art/', 'https://runwayml.com/pricing/'],
        ease: ['https://pika.art/', 'https://runwayml.com/'],
        speed: ['https://pika.art/', 'https://runwayml.com/'],
        output: ['https://pika.art/', 'https://runwayml.com/'],
        customization: ['https://pika.art/', 'https://runwayml.com/'],
      },
    },
  },
  promptBox: {
    prompt:
      'Test one idea both ways: first as a live AI self or persona task flow, then as a cinematic creative brief. Decide whether the real need is agent interaction or premium visual generation.',
    settings: [
      'Primary intent: decide between live persona and creative generation',
      'Output target: prototype only',
      'Interaction check: one live task or conversation',
      'Creative check: one short scene or concept shot',
      'Decision focus: control depth versus novelty',
    ],
    helperText:
      'Run the same concept through both tools only if the real buying question is still ambiguous. In many cases this pair is actually agent-versus-generator, not generator-versus-generator.',
  },
  editorialNotes: {
    whyPeopleCompareTheseTools:
      'People still compare Pika and Runway because both names sit in AI video. The problem is that the current Pika story is no longer centered on the same job as Runway.',
    looksSimilarButActuallyDifferent:
      'Runway is still a creative-generation environment. Pika now looks more like a digital-self and agent platform with video embodiment layered on top.',
    realDecision:
      'The real decision is whether the team is choosing a live persona experiment or a cinematic generation workflow. If the buying question is still about better scenes, Runway is usually the cleaner answer.',
    chooseAIf:
      'Choose Pika if the thing you want to test is a live AI self, a task-taking persona, or an avatar that can speak and act through tool hooks.',
    chooseBIf:
      'Choose Runway if the thing you need is still visual generation quality, shot shaping, and a creative path that can move toward production.',
    hiddenTradeOff:
      'Pika may feel fresher and more differentiated right now, but a lot of its most ambitious claims sit behind weak evidence around memory, authorization, and safety. Runway is heavier, but the uncertainty is more about cost and workflow weight than about whether the core product category is real.',
    whoWillRegretTheWrongChoice:
      'Teams regret Runway when the real goal was an AI self or live persona demo. Teams regret Pika when they still needed a serious creative-generation environment and discovered the official evidence no longer centers on that job.',
  },
  verdict: {
    winnerPrice: 'a',
    winnerQuality: 'b',
    winnerSpeed: 'a',
    recommendation:
      'Pick Pika when the real experiment is live AI selves or tool-using personas. Pick Runway when the job is still creative video generation and premium visual output.',
  },
  related: {
    toolPages: ['/tool/pika', '/tool/runway'],
    alternatives: ['/tool/pika/alternatives', '/tool/runway/alternatives'],
    comparisons: ['/vs/runway-vs-sora', '/vs/heygen-vs-invideo', '/vs/elai-io-vs-heygen'],
  },
  faq: [
    {
      question: 'Pika vs Runway: which should I choose first?',
      answer:
        'Choose Pika if the experiment is really about AI selves, persona interaction, or task-taking avatars. Choose Runway if the job is still about creative scene quality and production-oriented generation.',
    },
    {
      question: 'Why does this comparison feel less direct than other AI video pairs?',
      answer:
        'Because current official Pika material has shifted toward live agents and digital selves, while Runway still sits in the creative-generation lane. The overlap is now smaller than the brand names suggest.',
    },
    {
      question: 'What should buyers verify before choosing?',
      answer:
        'On Pika, verify latency, interruption handling, authorization, and memory stability. On Runway, verify whether the team can justify the heavier creative workflow and cost discipline in exchange for stronger visual control.',
    },
  ],
  disclosure:
    'This comparison summarizes public information and structured scoring rules. Method details, source policy, and update rules are documented at /methodology.',
};

import { Tool } from '@/types/tool';
import { VsFaqItem, VsIntentProfile, VsSide } from '@/types/vs';
import { getAvatarProfile, inferToolSignals, ToolSignals } from '@/lib/vsDifferentiation';

export type VsPairType =
  | 'avatar-vs-avatar'
  | 'from-scratch-vs-repurposing'
  | 'generator-vs-editor'
  | 'model-vs-model'
  | 'narration-first-vs-repurposing'
  | 'narration-first-vs-presenter'
  | 'presenter-vs-scale-generator'
  | 'narration-first-vs-generator'
  | 'broad-generator-vs-social';

type PairCopyResult = {
  pairType: VsPairType;
  decisionSummary: string;
  shortAnswer: {
    a: string;
    b: string;
  };
  recommendation: string;
  faq: VsFaqItem[];
  promptHelperText: string;
  decisionCases: Array<{
    label: string;
    keywords: string[];
    winner: VsSide;
    verdict: string;
  }>;
};

type PairPatternContext = {
  toolA: Tool;
  toolB: Tool;
  roleA: string;
  roleB: string;
};

type PairQuestionContext = {
  toolA: Tool;
  toolB: Tool;
};

function toCanonicalPairSlug(toolA: Tool, toolB: Tool): string {
  return [toolA.slug, toolB.slug].sort((left, right) => left.localeCompare(right)).join('-vs-');
}

function stablePatternIndex(seed: string, size: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return hash % size;
}

function choosePairPattern<T>(pairType: VsPairType, toolA: Tool, toolB: Tool, variants: T[]): T {
  return variants[stablePatternIndex(`${pairType}:${toCanonicalPairSlug(toolA, toolB)}`, variants.length)];
}

function roleSentence(toolName: string, value: string, variants: Array<(tool: string, role: string) => string>): string {
  const role = cleanFragment(value);
  const builder = variants[stablePatternIndex(`${toolName}:${role}`, variants.length)];
  return builder(toolName, role);
}

function buildPairLanguage(
  pairType: VsPairType,
  toolA: Tool,
  toolB: Tool,
  context: PairPatternContext,
  variants: Array<{
    decisionSummary: (ctx: PairPatternContext) => string;
    recommendation: (ctx: PairPatternContext) => string;
    faqFirstAnswer: (ctx: PairPatternContext) => string;
    promptHelperText: (ctx: PairPatternContext) => string;
  }>,
) {
  const variant = choosePairPattern(pairType, toolA, toolB, variants);
  return {
    decisionSummary: variant.decisionSummary(context),
    recommendation: variant.recommendation(context),
    faqFirstAnswer: variant.faqFirstAnswer(context),
    promptHelperText: variant.promptHelperText(context),
  };
}

export function buildVsFaqFirstQuestion(pairType: VsPairType, toolA: Tool, toolB: Tool): string {
  const variant = choosePairPattern(pairType, toolA, toolB, [
    (ctx: PairQuestionContext) => `${ctx.toolA.name} vs ${ctx.toolB.name}: which belongs on the shortlist first?`,
    (ctx: PairQuestionContext) => `What is this ${ctx.toolA.name} vs ${ctx.toolB.name} decision really buying?`,
    (ctx: PairQuestionContext) => `Where should a team start with ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
    (ctx: PairQuestionContext) => `Which side of the ${ctx.toolA.name} vs ${ctx.toolB.name} workflow matters more?`,
  ]);

  const variantsByPairType: Partial<Record<VsPairType, Array<(ctx: PairQuestionContext) => string>>> = {
    'avatar-vs-avatar': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: which avatar workflow belongs on the shortlist first?`,
      (ctx) => `What kind of avatar rollout is ${ctx.toolA.name} vs ${ctx.toolB.name} really buying?`,
      (ctx) => `Where should a team start with ${ctx.toolA.name} vs ${ctx.toolB.name} for avatar deployment?`,
      (ctx) => `Which side of the avatar operating model matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
    ],
    'from-scratch-vs-repurposing': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: where should the team start?`,
      (ctx) => `What kind of project entry is ${ctx.toolA.name} vs ${ctx.toolB.name} really buying?`,
      (ctx) => `Which source-material path matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: are we starting from a blank page or existing assets?`,
    ],
    'generator-vs-editor': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: which side of the workflow is the real bottleneck?`,
      (ctx) => `Should the team optimize for draft creation or post-draft control in ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
      (ctx) => `Where should the team start in ${ctx.toolA.name} vs ${ctx.toolB.name}: generation or refinement?`,
      (ctx) => `What part of the workflow is ${ctx.toolA.name} vs ${ctx.toolB.name} really solving first?`,
    ],
    'model-vs-model': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: which generation workflow belongs on the shortlist first?`,
      (ctx) => `What kind of generation environment is ${ctx.toolA.name} vs ${ctx.toolB.name} really buying?`,
      (ctx) => `Where should a team start with ${ctx.toolA.name} vs ${ctx.toolB.name}: studio workflow or access workflow?`,
      (ctx) => `Which generation posture matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
    ],
    'narration-first-vs-repurposing': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: is this really a narration job or a repurposing job?`,
      (ctx) => `Which source dependence matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
      (ctx) => `Where should the team start with ${ctx.toolA.name} vs ${ctx.toolB.name}: text or long-form assets?`,
      (ctx) => `What kind of input is ${ctx.toolA.name} vs ${ctx.toolB.name} really built around?`,
    ],
    'narration-first-vs-presenter': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: is this really a narration workflow or a presenter workflow?`,
      (ctx) => `Which communication format matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
      (ctx) => `Where should the team start with ${ctx.toolA.name} vs ${ctx.toolB.name}: voice-led delivery or presenter-led delivery?`,
      (ctx) => `What kind of communication is ${ctx.toolA.name} vs ${ctx.toolB.name} really buying?`,
    ],
    'presenter-vs-scale-generator': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: are we buying presenter presence or output volume?`,
      (ctx) => `Which bottleneck matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}: presenter format or batch production?`,
      (ctx) => `Where should the team start with ${ctx.toolA.name} vs ${ctx.toolB.name}: spokesperson delivery or volume drafting?`,
      (ctx) => `What part of the workflow is ${ctx.toolA.name} vs ${ctx.toolB.name} really optimizing?`,
    ],
    'narration-first-vs-generator': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: are we buying narration-first conversion or broader visual drafting?`,
      (ctx) => `Which creative burden matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}: voice-led assembly or scene generation?`,
      (ctx) => `Where should the team start with ${ctx.toolA.name} vs ${ctx.toolB.name}: text and voice or broader visual drafting?`,
      (ctx) => `What kind of workflow is ${ctx.toolA.name} vs ${ctx.toolB.name} really buying first?`,
    ],
    'broad-generator-vs-social': [
      (ctx) => `${ctx.toolA.name} vs ${ctx.toolB.name}: does the team need breadth or short-form specialization?`,
      (ctx) => `Which range problem matters more in ${ctx.toolA.name} vs ${ctx.toolB.name}?`,
      (ctx) => `Where should the team start with ${ctx.toolA.name} vs ${ctx.toolB.name}: broader coverage or tighter social output?`,
      (ctx) => `What is ${ctx.toolA.name} vs ${ctx.toolB.name} really optimizing for first?`,
    ],
  };

  const typeVariants = variantsByPairType[pairType];
  if (!typeVariants?.length) return variant({ toolA, toolB });
  return choosePairPattern(pairType, toolA, toolB, typeVariants)({ toolA, toolB });
}

function cleanFragment(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.?!]+$/g, '')
    .replace(/^(stronger when you need|better suited to|works better for|use it when|choose [a-z0-9.\- ]+ if you need)\s+/i, '')
    .replace(/^(stronger if you want a workflow that|makes more sense when the workflow)\s+/i, '')
    .trim();
}

function sentence(value: string): string {
  const cleaned = cleanFragment(value);
  if (!cleaned) return '';
  const withCapital = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.?!]$/.test(withCapital) ? withCapital : `${withCapital}.`;
}

function isNarrationFirst(signal: ToolSignals, tool: Tool): boolean {
  const text = `${signal.workflow} ${signal.editingModel} ${signal.useCase} ${tool.best_for}`.toLowerCase();
  return /blog-to-video|narrated|voice-led|voiceover|article-to-video|blog urls|scripts or articles/.test(text) || tool.slug === 'fliki';
}

function isRepurposing(signal: ToolSignals): boolean {
  return signal.mode === 'repurpose';
}

function isEditor(signal: ToolSignals): boolean {
  return signal.mode === 'transcript_editor' || signal.mode === 'browser_editor';
}

function isModel(signal: ToolSignals): boolean {
  return signal.mode === 'model_generator';
}

function isAvatar(signal: ToolSignals): boolean {
  return signal.mode === 'avatar';
}

function isSocial(signal: ToolSignals): boolean {
  return signal.mode === 'social_generator';
}

function isFromScratchGenerator(signal: ToolSignals): boolean {
  return signal.mode === 'stock_generator' || signal.mode === 'social_generator';
}

export function classifyVsPairType(toolA: Tool, toolB: Tool, profile?: VsIntentProfile): VsPairType {
  const a = inferToolSignals(toolA);
  const b = inferToolSignals(toolB);

  if (isAvatar(a) && isAvatar(b)) return 'avatar-vs-avatar';
  if (isModel(a) && isModel(b)) return 'model-vs-model';
  if ((isNarrationFirst(a, toolA) && isAvatar(b)) || (isNarrationFirst(b, toolB) && isAvatar(a))) {
    return 'narration-first-vs-presenter';
  }
  if ((isAvatar(a) && isFromScratchGenerator(b)) || (isAvatar(b) && isFromScratchGenerator(a))) {
    return 'presenter-vs-scale-generator';
  }
  if ((isNarrationFirst(a, toolA) && isFromScratchGenerator(b)) || (isNarrationFirst(b, toolB) && isFromScratchGenerator(a))) {
    return 'narration-first-vs-generator';
  }
  if ((isNarrationFirst(a, toolA) && isRepurposing(b)) || (isNarrationFirst(b, toolB) && isRepurposing(a))) {
    return 'narration-first-vs-repurposing';
  }
  if ((isFromScratchGenerator(a) && isRepurposing(b)) || (isFromScratchGenerator(b) && isRepurposing(a))) {
    return 'from-scratch-vs-repurposing';
  }
  if ((isFromScratchGenerator(a) && isEditor(b)) || (isFromScratchGenerator(b) && isEditor(a))) {
    return 'generator-vs-editor';
  }
  if ((isSocial(a) && !isSocial(b)) || (isSocial(b) && !isSocial(a))) {
    return 'broad-generator-vs-social';
  }

  if (profile?.primary === 'avatar') return 'avatar-vs-avatar';
  if (profile?.primary === 'repurpose') return 'from-scratch-vs-repurposing';
  if (profile?.primary === 'editor') return 'generator-vs-editor';
  return 'broad-generator-vs-social';
}

function buildNarrationPresenterCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const aNarration = isNarrationFirst(a, toolA);
  const narrationTool = aNarration ? toolA : toolB;
  const presenterTool = aNarration ? toolB : toolA;
  const narrationWinner: VsSide = aNarration ? 'a' : 'b';
  const presenterWinner: VsSide = aNarration ? 'b' : 'a';
  const language = buildPairLanguage(
    'narration-first-vs-presenter',
    toolA,
    toolB,
    {
      toolA: narrationTool,
      toolB: presenterTool,
      roleA: 'narration-led explainers and text-first video assembly',
      roleB: 'presenter-led communication and visible spokesperson delivery',
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `These tools only look interchangeable because both end in a finished video. ${left.name} works better when narration can carry the message. ${right.name} works better when the video needs a person on screen.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Use ${left.name} when script and voiceover can carry the message. Move to ${right.name} when seeing the speaker changes trust, clarity, or conversion.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense when a text-first, narration-led workflow is enough. ${right.name} makes more sense when the audience needs to see a presenter on screen.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run the same script in ${left.name} and ${right.name} to compare narration-first delivery against a presenter-led version of the same message.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The real split here is not output quality. It is whether the message lands through voiceover or through an on-screen presenter. ${left.name} leans narration-first, while ${right.name} leans presenter-first.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Pick ${left.name} when voice and pacing do the communication work. Pick ${right.name} when the speaker's face is part of the pitch.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} should come first when narration is enough to carry the story. ${right.name} should come first when presenter presence is part of the requirement, not an optional extra.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test the same script in both tools and compare whether voice-led delivery or presenter-led delivery fits the brief better.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `Buyers usually compare these because both can publish explainers. The real decision is whether the viewer mainly listens to a narrator or watches a spokesperson. ${left.name} fits the first case. ${right.name} fits the second.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Go with ${left.name} when you need text-to-video with narration. Go with ${right.name} when the job depends on a visible presenter.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `If narration is enough, ${left.name} is the simpler first choice. If the message loses impact without a speaker on screen, ${right.name} is the stronger first choice.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one brief in both tools to compare a narration-led explainer against the same explainer delivered by a presenter.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The overlap is superficial: both make finished video, but they solve different communication problems. ${left.name} is built for voice-led assembly. ${right.name} is built for presenter-led delivery.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} is the cleaner buy for narration-first teams. ${right.name} is the cleaner buy when the message needs a speaker to be seen.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `Start with ${left.name} when the workflow stays text-first. Start with ${right.name} when the audience still expects to see someone deliver the message.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run an identical script through both tools so the comparison stays focused on narration-first versus presenter-first delivery.`,
      },
    ],
  );

  return {
    pairType: 'narration-first-vs-presenter',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a:
        narrationWinner === 'a'
          ? roleSentence(toolA.name, 'narration-led explainers and text-first video assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the work stays close to ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolA.name, 'presenter-led communication and visible spokesperson delivery', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the work stays close to ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
      b:
        narrationWinner === 'b'
          ? roleSentence(toolB.name, 'narration-led explainers and text-first video assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the work stays close to ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolB.name, 'presenter-led communication and visible spokesperson delivery', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the work stays close to ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('narration-first-vs-presenter', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the main workflow difference?',
        answer: `${narrationTool.name} is narration-first. ${presenterTool.name} is presenter-first.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Content teams regret ${presenterTool.name} when the avatar step slows a workflow that should have stayed text-first. Sales and training teams regret ${narrationTool.name} when the finished video still lacks a visible spokesperson.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Narration-led explainers',
        keywords: ['narration', 'blog', 'script', 'voiceover'],
        winner: narrationWinner,
        verdict: `${narrationTool.name} is the better fit when the story is carried mostly by script and voiceover rather than a presenter.`,
      },
      {
        label: 'Presenter communication',
        keywords: ['presenter', 'spokesperson', 'training', 'outreach'],
        winner: presenterWinner,
        verdict: `${presenterTool.name} is the better fit when the message needs a visible presenter on screen.`,
      },
      {
        label: 'On-screen trust',
        keywords: ['trust', 'speaker', 'customer'],
        winner: presenterWinner,
        verdict: `${presenterTool.name} is the stronger choice when the communication format depends on seeing a speaker rather than hearing a narrator.`,
      },
    ],
  };
}

function buildPresenterVsScaleCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const aPresenter = isAvatar(a);
  const presenterTool = aPresenter ? toolA : toolB;
  const scaleTool = aPresenter ? toolB : toolA;
  const presenterWinner: VsSide = aPresenter ? 'a' : 'b';
  const scaleWinner: VsSide = aPresenter ? 'b' : 'a';
  const language = buildPairLanguage(
    'presenter-vs-scale-generator',
    toolA,
    toolB,
    {
      toolA: presenterTool,
      toolB: scaleTool,
      roleA: 'presenter-led communication, training, and outreach',
      roleB: 'stock-scene drafts, shorts, and faster output volume',
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `This pair is less about features and more about delivery format. ${left.name} is stronger when a visible presenter changes the outcome. ${right.name} is stronger when the workflow is about output volume.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Buy ${left.name} when a speaker on screen changes the outcome. Buy ${right.name} when the bottleneck is output volume, not presenter presence.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} is the clearer first choice when the video needs a visible presenter. ${right.name} is the clearer first choice when the workflow is centered on faster stock-scene or batch draft production.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run the same brief in both tools to compare presenter-led delivery against faster stock-scene production.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `At the top level this is a format decision: spokesperson-style communication versus scalable scene generation. ${left.name} sits on the presenter side. ${right.name} sits on the scale side.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} when trust is tied to a face on screen. Choose ${right.name} when the team needs more drafts, more variants, and less presenter setup.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} belongs first on the shortlist for presenter-led communication. ${right.name} belongs first on the shortlist for batch scene generation.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one campaign brief in both tools so the comparison stays focused on presenter format versus scale format.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `Both tools can publish quickly, but they optimize for different bottlenecks. ${left.name} removes the friction of getting a presenter on screen. ${right.name} removes the friction of producing more visual drafts.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Reach for ${left.name} when the message needs a spokesperson. Reach for ${right.name} when the team mainly needs more content out the door.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `If the message still needs a visible speaker, ${left.name} is the better first move. If the team mostly needs more shorts, ads, and scene variations, ${right.name} is the better first move.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test the same message in both tools and compare whether presenter presence or output volume matters more.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `What separates these tools is not quality but communication shape. ${left.name} is presenter-led. ${right.name} is scene-led and volume-oriented.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense when the message should feel delivered by a person. ${right.name} makes more sense when the job is efficient scene-based production.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `Start with ${left.name} when presenter presence is a requirement. Start with ${right.name} when the requirement is fast scene-based output at higher volume.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run a single campaign brief through both tools to compare presenter-led communication against scene-first batch production.`,
      },
    ],
  );

  return {
    pairType: 'presenter-vs-scale-generator',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a:
        presenterWinner === 'a'
          ? roleSentence(toolA.name, 'presenter-led communication, training, and outreach', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolA.name, 'stock-scene drafts, shorts, and faster output volume', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
      b:
        presenterWinner === 'b'
          ? roleSentence(toolB.name, 'presenter-led communication, training, and outreach', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolB.name, 'stock-scene drafts, shorts, and faster output volume', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('presenter-vs-scale-generator', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the actual buying split?',
        answer: `${presenterTool.name} is presenter-led. ${scaleTool.name} is scale-first and scene-first.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Sales, training, and customer-education teams regret ${scaleTool.name} when the message needed a visible speaker. Content-ops and paid-social teams regret ${presenterTool.name} when the workflow mostly needed cheap, fast variation.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Presenter-led communication',
        keywords: ['presenter', 'training', 'outreach', 'speaker'],
        winner: presenterWinner,
        verdict: `${presenterTool.name} is the better fit when the message needs a visible presenter who can carry the delivery on screen.`,
      },
      {
        label: 'Shorts & batch drafts',
        keywords: ['shorts', 'ads', 'stock', 'batch'],
        winner: scaleWinner,
        verdict: `${scaleTool.name} is the better fit when the job is fast batch output for ads, shorts, and stock-scene content.`,
      },
      {
        label: 'Multilingual presenter updates',
        keywords: ['multilingual', 'localization', 'presenter'],
        winner: presenterWinner,
        verdict: `${presenterTool.name} is the stronger choice when the same update still needs a presenter-led feel across multiple languages.`,
      },
    ],
  };
}

function buildNarrationGeneratorCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const aNarration = isNarrationFirst(a, toolA);
  const narrationTool = aNarration ? toolA : toolB;
  const generatorTool = aNarration ? toolB : toolA;
  const narrationWinner: VsSide = aNarration ? 'a' : 'b';
  const generatorWinner: VsSide = aNarration ? 'b' : 'a';
  const language = buildPairLanguage(
    'narration-first-vs-generator',
    toolA,
    toolB,
    {
      toolA: narrationTool,
      toolB: generatorTool,
      roleA: 'narration-led explainers and text-first assembly',
      roleB: 'broader visual drafts and scene-driven output',
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `Search results make this pair look closer than it is. ${left.name} is better when the workflow begins with text and voice. ${right.name} is better when the team needs broader draft generation and visual assembly.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Lean toward ${left.name} when the workflow begins with scripts, blogs, or voiceover. Lean toward ${right.name} when the team needs broader stock-scene drafts and more visual output variety.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} is the cleaner choice for text-first, narration-led video. ${right.name} is the cleaner choice when the team needs broader scene assembly and visual drafting.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run the same script in both tools to compare a narration-first workflow against a broader scene-assembly workflow.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The overlap here is mostly superficial. ${left.name} stays close to script, voice, and narration. ${right.name} moves toward broader scene building and visual variation.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} when the message is mainly carried by narration. Choose ${right.name} when the output mix needs more visual range than a narration-first workflow can cover.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} belongs first on the shortlist for text-first explainers. ${right.name} belongs first on the shortlist for broader scene-driven drafts.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one script in both tools to compare narration-led assembly against a wider visual drafting workflow.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `These tools can both start from text, but they diverge once the draft needs to become visual. ${left.name} stays narrower and voice-led. ${right.name} stays broader and scene-led.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense when voiceover is doing most of the communication work. ${right.name} makes more sense when the team needs more scenes, more visuals, and more output variety.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `If the brief is mostly a script-to-narration workflow, start with ${left.name}. If the brief needs broader visual drafting around that script, start with ${right.name}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test the same source script in both tools so the comparison stays focused on narration-first versus broader visual assembly.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The decision is less about features than about where the creative burden sits. ${left.name} keeps the workflow close to text and voice. ${right.name} pushes further into visual drafting and scene generation.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Use ${left.name} when text and narration are doing the heavy lifting. Use ${right.name} when visual drafting is part of the real job, not just a wrapper around the script.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} is usually the better first move for narration-led explainers. ${right.name} is usually the better first move for scene-heavy draft production.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run the same brief through both tools to compare a voice-led path against a more scene-heavy drafting path.`,
      },
    ],
  );

  return {
    pairType: 'narration-first-vs-generator',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a:
        narrationWinner === 'a'
          ? roleSentence(toolA.name, 'narration-led explainers and text-first assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the work is ${role}.`,
              (tool, role) => `${tool} is the cleaner option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolA.name, 'broader visual drafts and scene-driven output', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the work is ${role}.`,
              (tool, role) => `${tool} is the cleaner option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
      b:
        narrationWinner === 'b'
          ? roleSentence(toolB.name, 'narration-led explainers and text-first assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the work is ${role}.`,
              (tool, role) => `${tool} is the cleaner option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolB.name, 'broader visual drafts and scene-driven output', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} fits best when the work is ${role}.`,
              (tool, role) => `${tool} is the cleaner option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('narration-first-vs-generator', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the practical difference?',
        answer: `${narrationTool.name} is narration-first. ${generatorTool.name} is broader and more scene-driven.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Text-first teams regret ${generatorTool.name} when the workflow becomes more visual-production-heavy than the brief requires. Social and ad teams regret ${narrationTool.name} when narration-first assembly is too narrow for the output mix.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Blog or article to video',
        keywords: ['blog', 'article', 'voiceover', 'script'],
        winner: narrationWinner,
        verdict: `${narrationTool.name} is the better fit when the source material already exists as text and the job is turning it into narrated video quickly.`,
      },
      {
        label: 'Faceless explainers & ad drafts',
        keywords: ['faceless', 'ads', 'stock', 'drafts'],
        winner: generatorWinner,
        verdict: `${generatorTool.name} is the better fit when the workflow depends on broader stock-scene drafts for explainers, social clips, and ad variants.`,
      },
      {
        label: 'Narration-led explainers',
        keywords: ['narration', 'voice', 'explainer'],
        winner: narrationWinner,
        verdict: `${narrationTool.name} is the stronger choice when the voiceover is doing most of the communication work.`,
      },
    ],
  };
}

function buildAvatarCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const profileA = getAvatarProfile(toolA);
  const profileB = getAvatarProfile(toolB);
  const focusA = profileA?.bestForFocus ?? cleanFragment(a.useCase);
  const focusB = profileB?.bestForFocus ?? cleanFragment(b.useCase);
  const audienceA = profileA?.bestForAudience ?? cleanFragment(a.audience);
  const audienceB = profileB?.bestForAudience ?? cleanFragment(b.audience);
  const workflowA = profileA?.inputModel ?? cleanFragment(a.workflow);
  const workflowB = profileB?.inputModel ?? cleanFragment(b.workflow);
  const language = buildPairLanguage(
    'avatar-vs-avatar',
    toolA,
    toolB,
    {
      toolA,
      toolB,
      roleA: focusA,
      roleB: focusB,
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `This is not a generic avatar match-up. ${left.name} is the better fit for ${roleA}. ${right.name} is the better fit for ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `The better buy is ${left.name} when the rollout looks like ${roleA}. The better buy is ${right.name} when the rollout looks like ${roleB}.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `${left.name} should be first on the shortlist when the team needs ${roleA}. ${right.name} should be first on the shortlist when the team needs ${roleB}.`,
        promptHelperText: ({}) =>
          `Run the same presenter brief in both tools to compare ${audienceA} against ${audienceB}.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Both tools make avatar video, but they point to different rollout patterns. ${left.name} is closer to ${roleA}. ${right.name} is closer to ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Choose ${left.name} when the deployment model looks more like ${roleA}. Choose ${right.name} when it looks more like ${roleB}.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Put ${left.name} first if the brief is really about ${roleA}. Put ${right.name} first if the brief is really about ${roleB}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one avatar brief in ${left.name} and ${right.name} to compare ${audienceA} against ${audienceB}.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `The buying split is narrower than “avatar vs avatar.” ${left.name} is stronger for ${roleA}. ${right.name} is stronger for ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Reach for ${left.name} when the organization needs ${roleA}. Reach for ${right.name} when the organization needs ${roleB}.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `${left.name} is the better first move for ${roleA}. ${right.name} is the better first move for ${roleB}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test one presenter brief in both tools so the comparison stays on deployment posture, not superficial avatar similarity.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `At the top level, this pair is a choice between two avatar operating models. ${left.name} fits ${roleA}. ${right.name} fits ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `${left.name} makes more sense when the team is organized around ${roleA}. ${right.name} makes more sense when the team is organized around ${roleB}.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Start with ${left.name} when the team needs ${roleA}. Start with ${right.name} when the team needs ${roleB}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run a matched presenter brief in both tools to compare ${audienceA} with ${audienceB}.`,
      },
    ],
  );

  return {
    pairType: 'avatar-vs-avatar',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a: roleSentence(toolA.name, focusA, [
        (tool, role) => `${tool} is the better fit for ${role}.`,
        (tool, role) => `${tool} fits best when the team needs ${role}.`,
        (tool, role) => `${tool} is the stronger option for ${role}.`,
        (tool, role) => `${tool} makes more sense for ${role}.`,
      ]),
      b: roleSentence(toolB.name, focusB, [
        (tool, role) => `${tool} is the better fit for ${role}.`,
        (tool, role) => `${tool} fits best when the team needs ${role}.`,
        (tool, role) => `${tool} is the stronger option for ${role}.`,
        (tool, role) => `${tool} makes more sense for ${role}.`,
      ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('avatar-vs-avatar', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the real buying split?',
        answer: `${toolA.name} is closer to ${workflowA}. ${toolB.name} is closer to ${workflowB}.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `${toolA.name} becomes a weaker fit when the team actually needs ${focusB}. ${toolB.name} becomes a weaker fit when the workflow really depends on ${focusA}.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Presenter-led outreach',
        keywords: ['sales', 'outreach', 'spokesperson', 'presenter'],
        winner: 'a',
        verdict: `${toolA.name} is the better fit when the video is closer to ${focusA} than a more structured training rollout.`,
      },
      {
        label: 'Training & internal rollout',
        keywords: ['training', 'internal', 'rollout', 'learning'],
        winner: 'b',
        verdict: `${toolB.name} is the better fit when the workflow is centered on ${focusB}.`,
      },
      {
        label: 'Localization at scale',
        keywords: ['language', 'localization', 'multilingual'],
        winner: 'b',
        verdict: `${toolB.name} is the stronger choice when localization is tied to a more structured deployment workflow.`,
      },
    ],
  };
}

function buildFromScratchRepurposeCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const aRepurpose = isRepurposing(a);
  const fromScratchTool = aRepurpose ? toolB : toolA;
  const fromScratchSignals = aRepurpose ? b : a;
  const repurposeTool = aRepurpose ? toolA : toolB;
  const repurposeSignals = aRepurpose ? a : b;
  const fromScratchWinner: VsSide = aRepurpose ? 'b' : 'a';
  const repurposeWinner: VsSide = aRepurpose ? 'a' : 'b';
  const language = buildPairLanguage(
    'from-scratch-vs-repurposing',
    toolA,
    toolB,
    {
      toolA: fromScratchTool,
      toolB: repurposeTool,
      roleA: 'from-scratch visual drafts and fresh output volume',
      roleB: 'repurposing webinars, podcasts, articles, or recordings into clips',
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `This pair is really about where the video starts. ${left.name} is stronger when the team is creating new drafts from prompts or scripts. ${right.name} is stronger when the team is cutting existing material into clips.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} when the team is building new drafts from zero. Choose ${right.name} when the team already has long-form source material to condense.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} if the workflow begins with prompts or scripts. Choose ${right.name} if the workflow begins with webinars, podcasts, articles, or recordings.`,
        promptHelperText: ({}) =>
          `Run the same brief in both tools to compare generation from scratch against repurposing from existing long-form content.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `Buyers compare these because both can produce clips quickly. The real split is blank-page creation versus repurposing. ${left.name} serves the first path. ${right.name} serves the second.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Pick ${left.name} when the creative starting point is a prompt or script. Pick ${right.name} when the starting point is already a webinar, podcast, article, or recording.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} is the better first move for blank-page drafting. ${right.name} is the better first move for turning existing long-form material into clips.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one brief in ${left.name} and ${right.name} so the comparison stays focused on starting-point difference, not surface features.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The clearest way to read this pair is by source dependence. ${left.name} works better when the team has to create new visuals. ${right.name} works better when the best raw material already exists.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense for net-new drafts. ${right.name} makes more sense when the job is compressing long-form content into clips.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `Start with ${left.name} when there is no real source material yet. Start with ${right.name} when the source material already exists and needs to be cut down.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run a matched brief in both tools to compare net-new drafting against repurposing existing long-form assets.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `This is not mainly a feature comparison. It is a project-entry comparison. ${left.name} enters at prompt or script level. ${right.name} enters at asset or recording level.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Go with ${left.name} if the workflow starts from an idea. Go with ${right.name} if it starts from material the team already recorded or published.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} belongs first on the shortlist for prompt-led drafts. ${right.name} belongs first on the shortlist for repurposing existing assets into clips.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test the same concept in both tools and compare blank-page generation against repurposing from existing material.`,
      },
    ],
  );

  return {
    pairType: 'from-scratch-vs-repurposing',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a:
        fromScratchWinner === 'a'
          ? roleSentence(toolA.name, 'from-scratch visual drafts and fresh output volume', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolA.name, 'repurposing webinars, podcasts, articles, or recordings into clips', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
      b:
        fromScratchWinner === 'b'
          ? roleSentence(toolB.name, 'from-scratch visual drafts and fresh output volume', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolB.name, 'repurposing webinars, podcasts, articles, or recordings into clips', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('from-scratch-vs-repurposing', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the main workflow difference?',
        answer: `${fromScratchTool.name} is generation-first. ${repurposeTool.name} is repurposing-first.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Teams making fresh drafts regret ${repurposeTool.name} when there is not enough source material to repurpose. Teams sitting on long-form assets regret ${fromScratchTool.name} when they end up rebuilding material they already had.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Start from scratch',
        keywords: ['prompt', 'script', 'draft', 'new'],
        winner: fromScratchWinner,
        verdict: `${fromScratchTool.name} is the better fit when the team is creating new scenes and drafts instead of trimming existing long-form material.`,
      },
      {
        label: 'Repurpose existing content',
        keywords: ['webinar', 'podcast', 'recording', 'repurpose', 'article'],
        winner: repurposeWinner,
        verdict: `${repurposeTool.name} is the better fit when the source already exists as webinars, podcasts, articles, or recordings.`,
      },
      {
        label: 'Turn long-form into clips',
        keywords: ['clips', 'highlights', 'long-form'],
        winner: repurposeWinner,
        verdict: `${repurposeTool.name} is the stronger choice when the job is condensing existing long-form material into publishable clips.`,
      },
    ],
  };
}

function buildGeneratorEditorCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const aEditor = isEditor(a);
  const generatorTool = aEditor ? toolB : toolA;
  const generatorSignals = aEditor ? b : a;
  const editorTool = aEditor ? toolA : toolB;
  const editorSignals = aEditor ? a : b;
  const generatorWinner: VsSide = aEditor ? 'b' : 'a';
  const editorWinner: VsSide = aEditor ? 'a' : 'b';
  const language = buildPairLanguage(
    'generator-vs-editor',
    toolA,
    toolB,
    {
      toolA: generatorTool,
      toolB: editorTool,
      roleA: 'first-draft generation and faster content assembly',
      roleB: 'cleanup, editing control, and transcript or browser revisions',
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `This pair is really a handoff decision. ${left.name} is stronger when the job is getting to a first draft quickly. ${right.name} is stronger when the workflow depends on editing control after the first pass.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Use ${left.name} to get to a draft faster. Use ${right.name} when the draft only becomes usable after revision, cleanup, or browser-level editing.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} is the better first stop when speed to first draft matters most. ${right.name} is the better first stop when the draft still needs meaningful editing control after it is generated.`,
        promptHelperText: ({}) =>
          `Run the same brief in both tools to compare fast first-draft generation against a more editing-led workflow.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The split here comes after generation begins. ${left.name} solves the first-draft problem. ${right.name} solves the refinement problem.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} when the bottleneck is reaching a usable draft. Choose ${right.name} when the bottleneck starts after the draft already exists.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} belongs first on the shortlist when the team needs faster draft creation. ${right.name} belongs first when editing accuracy matters more than generation speed.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one brief in both tools so the comparison stays on first-draft speed versus post-draft editing control.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `Both tools can move a project forward, but they carry different stages of the workflow. ${left.name} helps the team get something on the page. ${right.name} helps the team turn it into something shippable.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Reach for ${left.name} when the problem is blank-page momentum. Reach for ${right.name} when the problem is cleanup, revision, and polish.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `If the team mainly needs momentum, start with ${left.name}. If the team mainly needs control after draft creation, start with ${right.name}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run a matched brief in both tools to compare draft creation against edit-and-polish control.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The decision is not which tool can make video. It is whether the team needs generation help or editing leverage. ${left.name} leans into generation. ${right.name} leans into editing.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense when speed to draft is the pain point. ${right.name} makes more sense when the pain point begins after the draft exists.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `Start with ${left.name} when the workflow is blocked by first-draft speed. Start with ${right.name} when it is blocked by revision control and cleanup.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test one brief in both tools so the comparison stays focused on generation leverage versus editing leverage.`,
      },
    ],
  );

  return {
    pairType: 'generator-vs-editor',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a:
        generatorWinner === 'a'
          ? roleSentence(toolA.name, 'first-draft generation and faster content assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolA.name, 'cleanup, editing control, and transcript or browser revisions', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
      b:
        generatorWinner === 'b'
          ? roleSentence(toolB.name, 'first-draft generation and faster content assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolB.name, 'cleanup, editing control, and transcript or browser revisions', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('generator-vs-editor', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the main workflow difference?',
        answer: `${generatorTool.name} is built around ${cleanFragment(generatorSignals.workflow)}. ${editorTool.name} is built around ${cleanFragment(editorSignals.workflow)}.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Teams that need precise cleanup regret ${generatorTool.name}. Teams that mostly need first-draft speed regret ${editorTool.name} when editing depth slows the workflow down.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Generate first drafts',
        keywords: ['draft', 'generate', 'prompt', 'script'],
        winner: generatorWinner,
        verdict: `${generatorTool.name} is the better fit when the team needs a faster path from prompt or script to a usable draft.`,
      },
      {
        label: 'Edit and clean up',
        keywords: ['edit', 'cleanup', 'transcript', 'browser'],
        winner: editorWinner,
        verdict: `${editorTool.name} is the better fit when the workflow depends on editing, revision control, or cleanup after the first pass.`,
      },
      {
        label: 'Caption and polish',
        keywords: ['captions', 'subtitle', 'polish', 'trim'],
        winner: editorWinner,
        verdict: `${editorTool.name} is the stronger choice when caption cleanup and revision accuracy matter more than generation breadth.`,
      },
    ],
  };
}

function buildModelCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const useCaseA = cleanFragment(a.useCase);
  const useCaseB = cleanFragment(b.useCase);
  const language = buildPairLanguage(
    'model-vs-model',
    toolA,
    toolB,
    {
      toolA,
      toolB,
      roleA: useCaseA,
      roleB: useCaseB,
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `This is not an editor comparison. It is a choice between two generation workflows: ${left.name} is closer to ${roleA}, while ${right.name} is closer to ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} when the team wants a studio-style generation workflow. Choose ${right.name} when direct model access matters more than a heavier creation environment.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Start with ${left.name} if the workflow is closer to ${roleA}. Start with ${right.name} if it is closer to ${roleB}.`,
        promptHelperText: ({}) =>
          `Run the same generation brief in both tools to compare studio-style iteration against a more access-first model workflow.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `The real split is not interface polish. It is the shape of the generation workflow. ${left.name} leans toward ${roleA}. ${right.name} leans toward ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Lean toward ${left.name} when the team wants a more studio-like environment. Lean toward ${right.name} when model access and prototyping matter more than the surrounding toolset.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `${left.name} is the stronger first stop for ${roleA}. ${right.name} is the stronger first stop for ${roleB}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one generation brief in ${left.name} and ${right.name} so the comparison stays on workflow shape rather than UI.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Buyers usually compare these as model options, but they still point to different operating styles. ${left.name} is closer to ${roleA}. ${right.name} is closer to ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Go with ${left.name} when the team wants more studio-style iteration around each shot. Go with ${right.name} when direct generation access is the real priority.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Put ${left.name} first if the project needs ${roleA}. Put ${right.name} first if it needs ${roleB}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run a matched generation prompt in both tools and compare studio-style iteration against access-first model use.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `What matters here is where the team wants creative control to sit. ${left.name} pushes toward ${roleA}. ${right.name} pushes toward ${roleB}.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense when the team wants a heavier creation environment. ${right.name} makes more sense when the team wants cleaner access to the model itself.`,
        faqFirstAnswer: ({ toolA: left, toolB: right, roleA, roleB }) =>
          `Start with ${left.name} when the workflow needs ${roleA}. Start with ${right.name} when it needs ${roleB}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test the same generation brief in both tools so the comparison stays on studio workflow versus access workflow.`,
      },
    ],
  );

  return {
    pairType: 'model-vs-model',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a: roleSentence(toolA.name, useCaseA, [
        (tool, role) => `${tool} is the better fit for ${role}.`,
        (tool, role) => `${tool} is stronger when the team needs ${role}.`,
        (tool, role) => `${tool} fits best for ${role}.`,
        (tool, role) => `${tool} makes more sense for ${role}.`,
      ]),
      b: roleSentence(toolB.name, useCaseB, [
        (tool, role) => `${tool} is the better fit for ${role}.`,
        (tool, role) => `${tool} is stronger when the team needs ${role}.`,
        (tool, role) => `${tool} fits best for ${role}.`,
        (tool, role) => `${tool} makes more sense for ${role}.`,
      ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('model-vs-model', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the practical difference?',
        answer: `${toolA.name} leans toward ${cleanFragment(a.workflow)}. ${toolB.name} leans toward ${cleanFragment(b.workflow)}.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Teams that need a creative studio feel regret the more access-first option. Teams that need direct model access regret the heavier studio workflow.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Studio-style iteration',
        keywords: ['studio', 'shots', 'iteration', 'creative'],
        winner: 'a',
        verdict: `${toolA.name} is the stronger fit when the team wants more hands-on shot iteration around each generation.`,
      },
      {
        label: 'Access-first generation',
        keywords: ['api', 'model', 'access', 'prototype'],
        winner: 'b',
        verdict: `${toolB.name} is the stronger fit when direct generation access matters more than a heavier studio workflow.`,
      },
      {
        label: 'Prototype footage',
        keywords: ['prototype', 'concept', 'footage'],
        winner: 'b',
        verdict: `${toolB.name} is the better fit when the team is optimizing for access-first prototype footage rather than studio-led revision flow.`,
      },
    ],
  };
}

function buildNarrationRepurposeCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const aNarration = isNarrationFirst(a, toolA);
  const narrationTool = aNarration ? toolA : toolB;
  const repurposeTool = aNarration ? toolB : toolA;
  const narrationWinner: VsSide = aNarration ? 'a' : 'b';
  const repurposeWinner: VsSide = aNarration ? 'b' : 'a';
  const language = buildPairLanguage(
    'narration-first-vs-repurposing',
    toolA,
    toolB,
    {
      toolA: narrationTool,
      toolB: repurposeTool,
      roleA: 'blog-to-video, narrated explainers, and voice-led assembly',
      roleB: 'webinars, podcasts, articles, and recordings that need to be cut into clips',
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `This pair looks similar because both can start from existing material, but the split is narration-first assembly versus repurposing long-form assets. ${left.name} is stronger when the story is carried by script and voice. ${right.name} is stronger when the raw material already exists in longer form.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Lean toward ${left.name} when the job begins with a script and voice-led delivery. Lean toward ${right.name} when the job begins with long-form assets that need to be condensed.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} if the team is turning scripts or articles into narrated video. Choose ${right.name} if the team is repurposing webinars, podcasts, articles, or recordings into clips.`,
        promptHelperText: ({}) =>
          `Run the same brief in both tools to compare narration-first assembly against repurposing from existing long-form content.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The overlap here is mostly about input format. Once the work begins, ${left.name} behaves like a narration-first converter, while ${right.name} behaves like a repurposing engine for existing long-form content.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} when script and voice are doing the real work. Choose ${right.name} when the work is mostly about trimming long-form material into publishable clips.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} is the better first move for narration-led article or script conversion. ${right.name} is the better first move for turning long-form assets into shorter clips.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one brief in ${left.name} and ${right.name} to compare narration-first conversion against clip-first repurposing.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `Both tools can start from material you already have, but they depend on different kinds of source. ${left.name} depends more on text and script. ${right.name} depends more on long-form assets worth cutting down.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense when the source is mostly text. ${right.name} makes more sense when the source is already a webinar, podcast, article, or recording.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `If the brief starts as text, start with ${left.name}. If the brief starts as long-form material that needs highlights, start with ${right.name}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run a matched brief in both tools so the comparison stays on text-led conversion versus long-form repurposing.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The better way to read this pair is by what carries the finished video. ${left.name} leans on narration. ${right.name} leans on source material that already exists and needs to be compressed.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Reach for ${left.name} when the workflow is script-and-voice first. Reach for ${right.name} when the workflow is asset-and-highlights first.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} belongs first on the shortlist for narration-led explainers. ${right.name} belongs first for teams turning existing long-form assets into clips.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test one brief in both tools to compare narration-led assembly against long-form asset repurposing.`,
      },
    ],
  );

  return {
    pairType: 'narration-first-vs-repurposing',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a:
        narrationWinner === 'a'
          ? roleSentence(toolA.name, 'blog-to-video, narrated explainers, and voice-led assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the workflow is ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolA.name, 'webinars, podcasts, articles, and recordings that need to be cut into clips', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the workflow is ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
      b:
        narrationWinner === 'b'
          ? roleSentence(toolB.name, 'blog-to-video, narrated explainers, and voice-led assembly', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the workflow is ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolB.name, 'webinars, podcasts, articles, and recordings that need to be cut into clips', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the job is ${role}.`,
              (tool, role) => `${tool} is stronger when the workflow is ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('narration-first-vs-repurposing', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the main workflow difference?',
        answer: `${narrationTool.name} is narration-first. ${repurposeTool.name} is repurposing-first.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Script-first teams regret ${repurposeTool.name} when they mostly needed a narration-led workflow. Teams sitting on long-form recordings regret ${narrationTool.name} when they really needed repurposing instead of assembly from scratch.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Blog or script to video',
        keywords: ['blog', 'script', 'voiceover', 'narration'],
        winner: narrationWinner,
        verdict: `${narrationTool.name} is the better fit when the source material already exists as text and the story is carried mostly by narration.`,
      },
      {
        label: 'Repurpose long-form content',
        keywords: ['repurpose', 'webinar', 'podcast', 'recording'],
        winner: repurposeWinner,
        verdict: `${repurposeTool.name} is the better fit when the team is turning webinars, podcasts, articles, or recordings into clips.`,
      },
      {
        label: 'Narration-led explainers',
        keywords: ['voice', 'narration', 'explainer'],
        winner: narrationWinner,
        verdict: `${narrationTool.name} is the stronger choice when the voiceover is doing most of the communication work.`,
      },
    ],
  };
}

function buildBroadVsSocialCopy(toolA: Tool, toolB: Tool, a: ToolSignals, b: ToolSignals): PairCopyResult {
  const aSocial = isSocial(a);
  const broadTool = aSocial ? toolB : toolA;
  const socialTool = aSocial ? toolA : toolB;
  const broadWinner: VsSide = aSocial ? 'b' : 'a';
  const socialWinner: VsSide = aSocial ? 'a' : 'b';
  const language = buildPairLanguage(
    'broad-generator-vs-social',
    toolA,
    toolB,
    {
      toolA: broadTool,
      toolB: socialTool,
      roleA: 'broader explainers and mixed-format draft production',
      roleB: 'short-form social clips, ads, and trend-driven output',
    },
    [
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `This pair is about breadth versus short-form speed. ${left.name} is the better fit for broader drafting and mixed-format output. ${right.name} is the better fit for faster short-form social publishing.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} makes more sense when the team needs broader video coverage. ${right.name} makes more sense when the workflow is tightly focused on short-form social output.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} for broader draft coverage. Choose ${right.name} for faster social clips and short-form marketing output.`,
        promptHelperText: ({}) =>
          `Run the same short-form brief in both tools to compare broader draft coverage against a tighter social-first workflow.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `Both tools can help with short video, but they solve different range problems. ${left.name} covers a broader surface area. ${right.name} stays tighter around social output speed.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Choose ${left.name} when the team needs one tool to cover more formats. Choose ${right.name} when the job is mostly fast social publishing.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} is the better first move for broader mixed-format output. ${right.name} is the better first move for short-form social execution.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Use one short-form brief in ${left.name} and ${right.name} to compare broader draft coverage against a tighter social engine.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `The buying split is not just about speed. It is about how much range the workflow needs. ${left.name} is broader. ${right.name} is narrower but faster for social output.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `Reach for ${left.name} when the content plan is mixed. Reach for ${right.name} when the content plan is overwhelmingly short-form and social.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `If the team needs broader draft coverage, start with ${left.name}. If the team needs a tighter social clip engine, start with ${right.name}.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Test the same brief in both tools so the comparison stays focused on range versus social speed.`,
      },
      {
        decisionSummary: ({ toolA: left, toolB: right }) =>
          `A better way to read this pair is breadth versus specialization. ${left.name} covers more kinds of drafts. ${right.name} specializes in faster social-style publishing.`,
        recommendation: ({ toolA: left, toolB: right }) =>
          `${left.name} fits teams that need more coverage. ${right.name} fits teams that mainly need short-form social throughput.`,
        faqFirstAnswer: ({ toolA: left, toolB: right }) =>
          `${left.name} belongs first on the shortlist for broader explainers and mixed-format output. ${right.name} belongs first for social-first clip production.`,
        promptHelperText: ({ toolA: left, toolB: right }) =>
          `Run one social brief through both tools to compare broader coverage against a more specialized short-form workflow.`,
      },
    ],
  );

  return {
    pairType: 'broad-generator-vs-social',
    decisionSummary: language.decisionSummary,
    shortAnswer: {
      a:
        broadWinner === 'a'
          ? roleSentence(toolA.name, 'broader explainers and mixed-format draft production', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolA.name, 'short-form social clips, ads, and trend-driven output', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
      b:
        broadWinner === 'b'
          ? roleSentence(toolB.name, 'broader explainers and mixed-format draft production', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ])
          : roleSentence(toolB.name, 'short-form social clips, ads, and trend-driven output', [
              (tool, role) => `${tool} is the better fit for ${role}.`,
              (tool, role) => `${tool} works best when the team needs ${role}.`,
              (tool, role) => `${tool} is the stronger option for ${role}.`,
              (tool, role) => `${tool} makes more sense for ${role}.`,
            ]),
    },
    recommendation: language.recommendation,
    faq: [
      {
        question: buildVsFaqFirstQuestion('broad-generator-vs-social', toolA, toolB),
        answer: language.faqFirstAnswer,
      },
      {
        question: 'What is the practical difference?',
        answer: `${broadTool.name} is broader. ${socialTool.name} is narrower but faster for short-form publishing.`,
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer: `Mixed-format teams regret ${socialTool.name} when the workflow is too narrow. Short-form social teams regret ${broadTool.name} when they wanted a tighter clip engine.`,
      },
    ],
    promptHelperText: language.promptHelperText,
    decisionCases: [
      {
        label: 'Broader explainers',
        keywords: ['explainer', 'mixed', 'draft'],
        winner: broadWinner,
        verdict: `${broadTool.name} is the better fit when the team needs broader explainers and mixed-format draft coverage, not just short-form clips.`,
      },
      {
        label: 'Short-form social clips',
        keywords: ['shorts', 'reels', 'ads', 'clips', 'social'],
        winner: socialWinner,
        verdict: `${socialTool.name} is the better fit when the workflow is centered on short-form social clips and ad-style marketing output.`,
      },
      {
        label: 'Trend-driven output',
        keywords: ['trend', 'marketing', 'short-form'],
        winner: socialWinner,
        verdict: `${socialTool.name} is the stronger choice when speed for trend-driven short-form publishing matters more than broader coverage.`,
      },
    ],
  };
}

export function buildVsPairCopy(toolA: Tool, toolB: Tool, profile?: VsIntentProfile): PairCopyResult {
  const a = inferToolSignals(toolA);
  const b = inferToolSignals(toolB);
  const pairType = classifyVsPairType(toolA, toolB, profile);

  if (pairType === 'avatar-vs-avatar') return buildAvatarCopy(toolA, toolB, a, b);
  if (pairType === 'model-vs-model') return buildModelCopy(toolA, toolB, a, b);
  if (pairType === 'narration-first-vs-presenter') return buildNarrationPresenterCopy(toolA, toolB, a, b);
  if (pairType === 'presenter-vs-scale-generator') return buildPresenterVsScaleCopy(toolA, toolB, a, b);
  if (pairType === 'narration-first-vs-generator') return buildNarrationGeneratorCopy(toolA, toolB, a, b);
  if (pairType === 'narration-first-vs-repurposing') return buildNarrationRepurposeCopy(toolA, toolB, a, b);
  if (pairType === 'from-scratch-vs-repurposing') return buildFromScratchRepurposeCopy(toolA, toolB, a, b);
  if (pairType === 'generator-vs-editor') return buildGeneratorEditorCopy(toolA, toolB, a, b);
  return buildBroadVsSocialCopy(toolA, toolB, a, b);
}

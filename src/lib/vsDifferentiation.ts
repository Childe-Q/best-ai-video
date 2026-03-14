import { Tool } from '@/types/tool';
import { VsDiffRow, VsIntentProfile } from '@/types/vs';

type BuildSourcesFn = (type: 'pricing' | 'docs' | 'help' | 'examples', rowLabel: string) => {
  a: string[];
  b: string[];
};

export type ToolMode =
  | 'avatar'
  | 'repurpose'
  | 'transcript_editor'
  | 'stock_generator'
  | 'social_generator'
  | 'model_generator'
  | 'browser_editor'
  | 'generic';

export type ToolSignals = {
  mode: ToolMode;
  workflow: string;
  editingModel: string;
  useCase: string;
  notFor: string;
  audience: string;
  pricingPosture: string;
  outputStyle: string;
};

export type AvatarProfile = {
  realism: string;
  workflow: string;
  localization: string;
  governance: string;
  inputModel: string;
  bestForFocus: string;
  bestForAudience: string;
  notForFocus: string;
};

const AVATAR_PROFILES: Record<string, AvatarProfile> = {
  heygen: {
    realism: 'leans on realistic talking avatars, instant photo avatars, and voice cloning for presenter-led delivery',
    workflow: 'keeps the build around scripted avatar scenes instead of screen-recorder-first lesson assembly',
    localization: 'pairs 40+ languages with voice cloning and lip-sync-oriented multilingual delivery',
    governance: 'leans on custom avatars and repeatable outreach or L&D production more than white-label deployment',
    inputModel: 'starts from avatar scripts and spokesperson scenes rather than slide decks or screen recordings',
    bestForFocus: 'sales outreach, spokesperson videos, and avatar-led explainers',
    bestForAudience: 'teams that want a realistic presenter without building a training studio workflow',
    notForFocus: 'white-label deployment or training-first lesson assembly',
  },
  synthesia: {
    realism: 'leans on a larger built-in avatar roster and enterprise training delivery, even if the presenter style can feel more templated',
    workflow: 'combines avatar scenes with screen recording for internal training and demo-style explainers',
    localization: 'positions 120+ languages as a broad localization layer for enterprise training rollouts',
    governance: 'leans on enterprise security and large-company rollout readiness',
    inputModel: 'works well when training teams need screen recordings and structured lesson scenes in the same workflow',
    bestForFocus: 'corporate training, internal communications, and enterprise rollout',
    bestForAudience: 'organizations that care more about governance and localization breadth than custom-avatar experimentation',
    notForFocus: 'instant custom-avatar setup or sales-style talking-photo workflows',
  },
  'deepbrain-ai': {
    realism: 'pushes ultra-realistic AI humans with natural expressions and broadcast-style polish',
    workflow: 'leans on AI Studios workflows built for scaled production and system integration',
    localization: 'positions 100+ languages for global enterprise communication',
    governance: 'adds API integration, white-label options, and enterprise security to the deployment story',
    inputModel: 'fits teams connecting avatar generation into existing systems rather than running a lightweight browser-only flow',
    bestForFocus: 'high-polish enterprise presenters, API-backed generation, and white-label deployment',
    bestForAudience: 'large teams that need realistic presenters plus systems integration',
    notForFocus: 'simple self-serve avatar creation for individual creators',
  },
  colossyan: {
    realism: 'keeps avatar delivery oriented toward training presenters rather than sales-style talking heads',
    workflow: 'leans on template library and screen recording for structured lessons and onboarding modules',
    localization: 'positions 70+ languages for multilingual training distribution',
    governance: 'leans on L&D team workflows and lesson structure more than developer APIs or white-label rollout',
    inputModel: 'works best when slide-like lesson structure and screen captures matter more than custom-avatar experimentation',
    bestForFocus: 'training modules, onboarding, and L&D content with structured lesson flow',
    bestForAudience: 'L&D teams that want training-first templates instead of sales-video motion',
    notForFocus: 'outreach-heavy avatar content or API-led deployment',
  },
  'elai-io': {
    realism: 'lets teams generate custom avatars from uploaded photos, with output quality depending more on the source image',
    workflow: 'adds PPT-to-video and template-driven assembly for slide-led explainers',
    localization: 'positions 80+ languages for multilingual presentation content',
    governance: 'leans on presentation input and custom-avatar setup rather than enterprise security posture',
    inputModel: 'starts comfortably from PowerPoint decks and uploaded photos instead of enterprise training governance',
    bestForFocus: 'slide-led explainers, PowerPoint conversion, and custom avatars from existing photos',
    bestForAudience: 'marketing or content teams that already work from slides and presentation assets',
    notForFocus: 'security-heavy enterprise rollouts or the most realistic avatar delivery',
  },
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function joinToolText(tool: Tool): string {
  return normalizeText(
    [
      tool.name,
      tool.tagline,
      tool.short_description,
      tool.best_for,
      tool.pricing_model,
      ...(tool.features ?? []),
      ...(tool.tags ?? []),
      ...(tool.pros ?? []),
      ...(tool.cons ?? []),
      ...(tool.faqs ?? []).flatMap((item) => [item.question, item.answer]),
    ].join(' '),
  );
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function inferToolSignals(tool: Tool): ToolSignals {
  const text = joinToolText(tool);

  if (hasAny(text, [/\bavatar\b/, /\bpresenter\b/, /\bdigital human\b/, /\btalking photo\b/, /\blip-sync\b/])) {
    return {
      mode: 'avatar',
      workflow: 'starts from presenter scripts and avatar scenes',
      editingModel: 'keeps the workflow centered on scene-by-scene presenter delivery rather than timeline cleanup',
      useCase: 'spokesperson videos, training modules, and localized explainers',
      notFor: 'stock-scene mashups or fast faceless ad batches',
      audience: 'teams that need an on-screen presenter',
      pricingPosture: tool.has_free_trial ? 'uses paid plans for publish-ready avatar output after a trial' : 'leans toward paid plans without a long self-serve runway',
      outputStyle: 'delivers talking-avatar videos with presenter-led framing',
    };
  }

  if (hasAny(text, [/\btext-based editing\b/, /\btranscript\b/, /\bfiller word\b/, /\bstudio sound\b/])) {
    return {
      mode: 'transcript_editor',
      workflow: 'starts from transcript editing and cleanup rather than script-to-scene generation',
      editingModel: 'revolves around text edits, retakes, and audio cleanup',
      useCase: 'podcast edits, talking-head cleanup, and transcript-driven revisions',
      notFor: 'hands-off prompt generation with stock scenes assembled automatically',
      audience: 'creators who still want editorial control after the first pass',
      pricingPosture: tool.has_free_trial ? 'fits teams testing editing depth before moving to a paid seat' : 'is better justified when transcript editing is central to the workflow',
      outputStyle: 'delivers edited assets where transcript control matters more than generation breadth',
    };
  }

  if (hasAny(text, [/\brepurpose\b/, /\bwebinar\b/, /\bpodcast\b/, /\bauto highlight\b/, /\bzoom\b/])) {
    return {
      mode: 'repurpose',
      workflow: 'starts from existing recordings, transcripts, or articles and trims them into shorter assets',
      editingModel: 'leans on transcript or highlight extraction instead of first-draft generation from scratch',
      useCase: 'webinars, podcasts, Zoom recordings, and long-form clips',
      notFor: 'prompt-first generation when you have no source material to repurpose',
      audience: 'teams recycling long-form content into publishable clips',
      pricingPosture: tool.has_free_trial ? 'works best when you validate the repurposing workflow on a trial or free tier first' : 'makes more sense once you already have recurring long-form content to process',
      outputStyle: 'delivers clip-first outputs built from existing recordings',
    };
  }

  if (hasAny(text, [/\bgen-2\b/, /\bphysics\b/, /\bimage-to-video\b/, /\blimited access\b/, /\bapi\b/])) {
    const apiFirst = hasAny(text, [/\blimited access\b/, /\bapi\b/, /\bpartnership\b/, /\bdeveloper\b/]);
    return {
      mode: 'model_generator',
      workflow: apiFirst
        ? 'starts from direct model access and prompt-driven generation rather than a full editing workspace'
        : 'starts from prompt-driven footage generation inside a creative studio workflow',
      editingModel: apiFirst
        ? 'focuses on access to the model and generation endpoints more than timeline editing'
        : 'focuses on shot iteration and generation quality more than everyday social editing',
      useCase: apiFirst
        ? 'developer-led generation, prototype footage, and direct model access'
        : 'concept footage, cinematic experiments, and studio-style shot iteration',
      notFor: apiFirst
        ? 'teams that need a simple browser editor and polished publishing workflow'
        : 'fast browser-based social editing or templated marketing batches',
      audience: apiFirst
        ? 'teams prioritizing direct model access over editing convenience'
        : 'teams prioritizing generative output over editing convenience',
      pricingPosture: tool.has_free_trial
        ? 'can be tested on an entry tier before heavier generation volume'
        : apiFirst
          ? 'is usually justified when access to the model matters more than self-serve simplicity'
          : 'is usually justified when generation quality outweighs seat simplicity',
      outputStyle: apiFirst
        ? 'delivers model-generated footage through access-first workflows'
        : 'delivers model-generated footage through a studio-style workspace',
    };
  }

  if (hasAny(text, [/\btext to video\b/, /\bblog to video\b/, /\bstock media\b/, /\bscript\b/, /\bvoiceover\b/])) {
    const blogVoiceFirst = hasAny(text, [/\bblog to video\b/, /\bvoice cloning\b/, /\bai voice\b/]);
    return {
      mode: 'stock_generator',
      workflow: blogVoiceFirst
        ? 'starts from blog URLs or scripts and turns them into narrated stock-scene videos'
        : 'starts from prompts and script outlines and assembles stock footage scenes quickly',
      editingModel: blogVoiceFirst
        ? 'leans on voice-led narration and article-to-video assembly more than manual editing'
        : 'trades manual scene-by-scene editing for faster first-draft generation',
      useCase: blogVoiceFirst
        ? 'blog-to-video, narrated explainers, and voice-led repurposing'
        : 'faceless explainers, ad creatives, and batch stock-scene drafts',
      notFor: blogVoiceFirst
        ? 'frame-accurate editing or heavy transcript cleanup after recording'
        : 'frame-accurate editing or transcript-heavy cleanup after recording',
      audience: blogVoiceFirst
        ? 'teams turning scripts or articles into narrated videos quickly'
        : 'teams turning scripts into publishable drafts fast',
      pricingPosture: tool.has_free_trial
        ? blogVoiceFirst
          ? 'works well when you want to validate article-to-video output before paying for more volume'
          : 'works best when you want to validate generation speed before buying more volume'
        : 'fits teams paying for repeatable first-draft generation instead of editor seats',
      outputStyle: blogVoiceFirst
        ? 'delivers narrated stock-scene videos built around voiceover'
        : 'delivers stock-scene and voiceover-led videos',
    };
  }

  if (hasAny(text, [/\bweb-based\b/, /\bno software\b/, /\bvideo editing\b/, /\bauto subtitles\b/])) {
    return {
      mode: 'browser_editor',
      workflow: 'starts from browser-based editing, captions, and lightweight assembly',
      editingModel: 'keeps editing accessible for quick browser revisions and exports',
      useCase: 'subtitle cleanup, browser editing, and lightweight social production',
      notFor: 'deep generative workflows or transcript-led post-production',
      audience: 'teams that want fast browser edits without desktop setup',
      pricingPosture: tool.has_free_trial ? 'is easy to test as a browser editor before upgrading' : 'fits teams paying for quick web-based production rather than generation credits',
      outputStyle: 'delivers edited assets with browser-first control',
    };
  }

  if (hasAny(text, [/\bviral\b/, /\bshorts\b/, /\bsocial media\b/, /\btiktok\b/, /\breels\b/])) {
    return {
      mode: 'social_generator',
      workflow: 'starts from text prompts and quickly turns them into short social-ready cuts',
      editingModel: 'prioritizes speed, captions, and punchy pacing over detailed timeline work',
      useCase: 'social ads, Shorts, Reels, and trend-driven marketing clips',
      notFor: 'long-form transcript cleanup or enterprise review workflows',
      audience: 'marketers publishing high-volume short-form content',
      pricingPosture: tool.has_free_trial ? 'is easy to trial before scaling up short-form volume' : 'fits teams with recurring short-form output needs',
      outputStyle: 'delivers short-form marketing cuts optimized for quick publishing',
    };
  }

  return {
    mode: 'generic',
    workflow: 'keeps the workflow broad rather than specializing in one production model',
    editingModel: 'covers general video creation without a sharply differentiated editing style',
    useCase: tool.best_for,
    notFor: 'narrow specialist workflows',
    audience: tool.best_for.toLowerCase(),
    pricingPosture: tool.has_free_trial ? 'can be trialed before committing to paid usage' : 'leans on paid usage from the start',
    outputStyle: tool.tagline.toLowerCase(),
  };
}

export function getAvatarProfile(tool: Tool): AvatarProfile | null {
  return AVATAR_PROFILES[tool.slug] ?? null;
}

function sentence(value: string): string {
  const trimmed = value.trim().replace(/[.?!]+$/g, '');
  return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.` : '';
}

function pickPairSpecificContrast(left: ToolSignals, right: ToolSignals): [string, string] {
  if (left.mode === 'stock_generator' && right.mode === 'transcript_editor') {
    return [
      'moves from prompt or script to stock-scene assembly without needing a transcript-first edit pass',
      'starts from transcript cleanup and spoken-word edits before you worry about generative scene assembly',
    ];
  }
  if (left.mode === 'stock_generator' && right.mode === 'repurpose') {
    return [
      'creates first drafts from prompts, scripts, and stock scenes when you are starting from zero',
      'works best when you already have webinars, podcasts, or articles to condense into clips',
    ];
  }
  if (left.mode === 'stock_generator' && right.mode === 'browser_editor') {
    return [
      'behaves more like a generator that assembles scenes for you',
      'behaves more like a browser editor where you refine the cut manually',
    ];
  }
  if (left.mode === 'browser_editor' && right.mode === 'model_generator') {
    return [
      'keeps the job centered on browser editing and subtitle cleanup',
      'pushes the job toward model-generated footage and shot experimentation',
    ];
  }
  if (left.mode === 'model_generator' && right.mode === 'model_generator') {
    return [
      'leans toward a creative studio workflow with more hands-on shot iteration',
      'leans toward direct model access and generation-first delivery',
    ];
  }
  if (left.mode === 'avatar' && right.mode === 'stock_generator') {
    return [
      'centers the video around an on-screen presenter and scripted delivery',
      'centers the video around stock scenes, captions, and voiceover rather than a presenter',
    ];
  }
  if (left.mode === 'repurpose' && right.mode === 'social_generator') {
    return [
      'starts from longer source material and cuts it down into reusable clips',
      'starts from short-form campaign intent and generates new clips quickly',
    ];
  }

  return [left.workflow, right.workflow];
}

function buildBestForLine(tool: Tool, signals: ToolSignals, variant: number, slot: number): string {
  if (variant === 0) {
    const lines = [
      `Best when the job is ${signals.useCase}`,
      `Useful for ${signals.audience}`,
      `Stronger if you want a workflow that ${signals.workflow}`,
    ];
    return lines[slot] ?? lines[0];
  }

  const lines = [
    `${tool.name} fits teams that need ${signals.useCase}`,
    `A better match for ${signals.audience}`,
    `Makes more sense when the workflow ${signals.workflow}`,
  ];
  return lines[slot] ?? lines[0];
}

function buildNotForLine(signals: ToolSignals, other: ToolSignals, variant: number, slot: number): string {
  if (variant === 0) {
    const lines = [
      `Not ideal for ${signals.notFor}`,
      `Less suited to workflows where ${other.workflow}`,
      `Weaker if you need ${other.useCase}`,
    ];
    return lines[slot] ?? lines[0];
  }

  const lines = [
    `Falls short when you need ${signals.notFor}`,
    `Not the best fit if the project depends on ${other.useCase}`,
    `Less comfortable once the workflow shifts toward ${other.workflow}`,
  ];
  return lines[slot] ?? lines[0];
}

function stableHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildLegacyBestFor(
  tool: Tool,
  other: Tool,
  pairSlug: string,
): string[] {
  const avatarProfile = getAvatarProfile(tool);
  const otherAvatarProfile = getAvatarProfile(other);
  if (avatarProfile && otherAvatarProfile) {
    const variant = stableHash(`${pairSlug}:${tool.slug}:avatar-best`) % 2;
    if (variant === 0) {
      return [
        `Stronger when you need ${avatarProfile.bestForFocus}`,
        `Better suited to ${avatarProfile.bestForAudience}`,
        `More natural if your workflow starts from ${avatarProfile.inputModel}`,
      ];
    }
    return [
      `${tool.name} is the better fit for ${avatarProfile.bestForFocus}`,
      `Works better for ${avatarProfile.bestForAudience}`,
      `Use it when ${avatarProfile.inputModel}`,
    ];
  }
  const toolSignals = inferToolSignals(tool);
  const variant = stableHash(`${pairSlug}:${tool.slug}:best`) % 2;
  return [0, 1, 2].map((slot) => buildBestForLine(tool, toolSignals, variant, slot));
}

export function buildLegacyNotFor(
  tool: Tool,
  other: Tool,
  pairSlug: string,
): string[] {
  const avatarProfile = getAvatarProfile(tool);
  const otherAvatarProfile = getAvatarProfile(other);
  if (avatarProfile && otherAvatarProfile) {
    const variant = stableHash(`${pairSlug}:${tool.slug}:avatar-not`) % 2;
    if (variant === 0) {
      return [
        `Less ideal when you need ${avatarProfile.notForFocus}`,
        `Not the cleanest fit if the project depends on ${otherAvatarProfile.bestForFocus}`,
        `More limited once the team prioritizes ${otherAvatarProfile.governance}`,
      ];
    }
    return [
      `Falls behind when the project needs ${avatarProfile.notForFocus}`,
      `A weaker fit if your team actually wants ${otherAvatarProfile.bestForFocus}`,
      `Less comfortable when the workflow shifts toward ${otherAvatarProfile.governance}`,
    ];
  }
  const toolSignals = inferToolSignals(tool);
  const otherSignals = inferToolSignals(other);
  const variant = stableHash(`${pairSlug}:${tool.slug}:not`) % 2;
  return [0, 1, 2].map((slot) => buildNotForLine(toolSignals, otherSignals, variant, slot));
}

function buildAvatarKeyDiffs(toolA: Tool, toolB: Tool, buildSources: BuildSourcesFn): VsDiffRow[] {
  const profileA = getAvatarProfile(toolA);
  const profileB = getAvatarProfile(toolB);
  if (!profileA || !profileB) return [];

  const rows: VsDiffRow[] = [
    {
      label: 'Avatar realism & avatar model',
      a: sentence(`${toolA.name} ${profileA.realism}`),
      b: sentence(`${toolB.name} ${profileB.realism}`),
      sources: buildSources('docs', 'Avatar realism & avatar model'),
    },
    {
      label: 'Video workflow & editing model',
      a: sentence(`${toolA.name} ${profileA.workflow}`),
      b: sentence(`${toolB.name} ${profileB.workflow}`),
      sources: buildSources('docs', 'Video workflow & editing model'),
    },
    {
      label: 'Languages & localization pipeline',
      a: sentence(`${toolA.name} ${profileA.localization}`),
      b: sentence(`${toolB.name} ${profileB.localization}`),
      sources: buildSources('help', 'Languages & localization pipeline'),
    },
  ];

  const governanceAvailable = Boolean(profileA.governance && profileB.governance);
  rows.push(
    governanceAvailable
      ? {
          label: 'Team governance & deployment posture',
          a: sentence(`${toolA.name} ${profileA.governance}`),
          b: sentence(`${toolB.name} ${profileB.governance}`),
          sources: buildSources('docs', 'Team governance & deployment posture'),
        }
      : {
          label: 'Input model & content setup',
          a: sentence(`${toolA.name} ${profileA.inputModel}`),
          b: sentence(`${toolB.name} ${profileB.inputModel}`),
          sources: buildSources('docs', 'Input model & content setup'),
        },
  );

  return rows;
}

export function buildLegacyKeyDiffs(
  toolA: Tool,
  toolB: Tool,
  profile: VsIntentProfile | undefined,
  buildSources: BuildSourcesFn,
): VsDiffRow[] {
  const avatarRows = buildAvatarKeyDiffs(toolA, toolB, buildSources);
  if (avatarRows.length === 4) {
    return avatarRows;
  }
  const a = inferToolSignals(toolA);
  const b = inferToolSignals(toolB);
  const [aContrast, bContrast] = pickPairSpecificContrast(a, b);

  const rows: VsDiffRow[] = [
    {
      label: 'Core workflow',
      a: sentence(`${toolA.name} ${aContrast}`),
      b: sentence(`${toolB.name} ${bContrast}`),
      sources: buildSources('docs', 'Core workflow'),
    },
    {
      label: profile?.primary === 'avatar' || profile?.primary === 'text' ? 'Output style and use case fit' : 'Editing model',
      a: sentence(`${toolA.name} ${profile?.primary === 'avatar' || profile?.primary === 'text' ? a.outputStyle : a.editingModel}`),
      b: sentence(`${toolB.name} ${profile?.primary === 'avatar' || profile?.primary === 'text' ? b.outputStyle : b.editingModel}`),
      sources: buildSources('docs', profile?.primary === 'avatar' || profile?.primary === 'text' ? 'Output style and use case fit' : 'Editing model'),
    },
    {
      label: 'Use case fit',
      a: sentence(`${toolA.name} is a tighter match for ${a.useCase}`),
      b: sentence(`${toolB.name} is a tighter match for ${b.useCase}`),
      sources: buildSources('help', 'Use case fit'),
    },
    {
      label: 'Pricing and usage posture',
      a: sentence(`${toolA.name} ${a.pricingPosture}`),
      b: sentence(`${toolB.name} ${b.pricingPosture}`),
      sources: buildSources('pricing', 'Pricing and usage posture'),
    },
  ];

  return rows;
}

function tokenize(text: string): Set<string> {
  const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'where', 'when', 'than', 'more', 'less', 'your',
    'tool', 'workflow', 'workflows', 'starts', 'start', 'delivers', 'delivery', 'better', 'best', 'match', 'teams',
    'need', 'fits', 'makes', 'sense', 'used', 'using', 'price', 'pricing', 'posture', 'core', 'editing', 'model',
    'output', 'style', 'case', 'fit', 'usage', 'first', 'draft', 'trial', 'tier', 'paid', 'plans', 'plan', 'video',
    'videos', 'assets', 'content', 'publishable', 'centered', 'rather', 'than', 'quickly', 'fast', 'stronger',
    'works', 'validated', 'validate', 'before', 'after', 'once', 'around', 'builds', 'built',
  ]);
  return new Set(
    normalizeText(text)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

export function computeKeyDiffUniquenessScore(
  targetSlug: string,
  targetRows: VsDiffRow[],
  allRows: Array<{ slug: string; rows: VsDiffRow[] }>,
): number {
  const targetTokens = tokenize(targetRows.map((row) => `${row.label} ${row.a} ${row.b}`).join(' '));
  if (targetTokens.size === 0) return 0;

  let maxSimilarity = 0;
  for (const candidate of allRows) {
    if (candidate.slug === targetSlug) continue;
    const candidateTokens = tokenize(candidate.rows.map((row) => `${row.label} ${row.a} ${row.b}`).join(' '));
    if (candidateTokens.size === 0) continue;
    const intersection = [...targetTokens].filter((token) => candidateTokens.has(token)).length;
    const union = new Set([...targetTokens, ...candidateTokens]).size || 1;
    const similarity = intersection / union;
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
  }

  return Number(maxSimilarity.toFixed(2));
}

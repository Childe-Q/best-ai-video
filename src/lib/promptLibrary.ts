import { Tool } from '@/types/tool';
import { VsPromptVariant } from '@/types/vs';

export type UseCaseKey =
  | 'shorts_social_ads'
  | 'script_to_video'
  | 'repurpose_longform'
  | 'captions_editing'
  | 'avatar_presenter'
  | 'localization';

type ScenarioLike = {
  label: string;
  keywords?: string[];
  promptKey?: UseCaseKey | null;
};

type PromptVariables = {
  toolAName: string;
  toolBName: string;
  audience: string;
  format: string;
  duration: string;
  platform: string;
  tone: string;
};

type PromptTemplateDefinition = {
  title: string;
  templates: string[];
  defaults: Omit<PromptVariables, 'toolAName' | 'toolBName'>;
  settings: string[];
};

type PromptBuildParams = {
  slugSeed: string;
  toolAName: string;
  toolBName: string;
  toolA?: Tool;
  toolB?: Tool;
  scenarios?: ScenarioLike[];
};

const DEFAULT_USE_CASE_SEQUENCE: UseCaseKey[] = ['script_to_video', 'captions_editing', 'localization'];

const USE_CASE_LIBRARY: Record<UseCaseKey, PromptTemplateDefinition> = {
  shorts_social_ads: {
    title: 'Shorts ad',
    templates: [
      'Using the same brief in {toolAName} and {toolBName}, create three {duration} {format} ad cuts for {platform}. Target {audience}, open with a thumb-stopping hook, show one product problem, two benefit scenes, one proof point, and a direct CTA. Keep the tone {tone}.',
      'Create a {duration} {format} social ad for {platform} in both {toolAName} and {toolBName}. Speak to {audience}, use fast scene changes, on-screen captions, one offer line, and a CTA in the final three seconds. Keep the voice {tone}.',
      'Build a paid-social video test in {toolAName} and {toolBName}: one {duration} {format} version for {platform} aimed at {audience}. Include a hook, product demo beat, objection-handling line, and CTA. Use a {tone} delivery style.',
    ],
    defaults: {
      audience: 'growth marketers',
      format: '9:16',
      duration: '20-second',
      platform: 'TikTok or Reels',
      tone: 'direct and conversion-focused',
    },
    settings: ['Duration: {duration}', 'Aspect ratio: {format}', 'Platform: {platform}', 'Tone: {tone}', 'Captions: hardcoded'],
  },
  script_to_video: {
    title: 'Script to video',
    templates: [
      'Create a {duration} {format} explainer from a written script in both {toolAName} and {toolBName}. The video is for {audience} on {platform}. Turn the script into a clear intro, three key beats, and a final CTA while keeping the tone {tone}.',
      'Use the same text brief in {toolAName} and {toolBName} to produce a {duration} {format} story-led video for {platform}. Write for {audience}, add headline overlays, scene transitions, and a concise CTA. Keep delivery {tone}.',
      'Generate a script-led video in {toolAName} and {toolBName}: {duration}, {format}, aimed at {audience}. Structure it as hook, problem, solution, proof, and CTA for {platform}. Keep language {tone}.',
    ],
    defaults: {
      audience: 'content marketers',
      format: '16:9',
      duration: '45-second',
      platform: 'YouTube or a landing page',
      tone: 'clear and educational',
    },
    settings: ['Duration: {duration}', 'Aspect ratio: {format}', 'Destination: {platform}', 'Tone: {tone}', 'Scene structure: hook, 3 beats, CTA'],
  },
  repurpose_longform: {
    title: 'Repurpose webinar',
    templates: [
      'Repurpose a long-form webinar into a {duration} highlight video in both {toolAName} and {toolBName}. Make one master cut plus short pull-quotes for {platform}. Target {audience}, extract the strongest insights, add captions, and keep tone {tone}.',
      'Take a 30-minute interview transcript and turn it into a {duration} recap using {toolAName} and {toolBName}. Format for {platform}, focus on {audience}, surface three memorable moments, and keep the style {tone}.',
      'Create a repurposed long-form clip package in {toolAName} and {toolBName}: one {duration} summary video for {platform}, based on a webinar transcript. Write for {audience}, keep captions tight, and use a {tone} presentation.',
    ],
    defaults: {
      audience: 'content teams',
      format: '16:9 master with 9:16 cutdowns',
      duration: '45-second',
      platform: 'LinkedIn, YouTube, and Shorts',
      tone: 'insight-led and concise',
    },
    settings: ['Duration: {duration}', 'Output mix: {format}', 'Distribution: {platform}', 'Tone: {tone}', 'Source material: webinar transcript'],
  },
  captions_editing: {
    title: 'Caption polish',
    templates: [
      'Edit a talking-head draft in both {toolAName} and {toolBName} into a {duration} {format} clip for {platform}. Clean filler words, tighten pacing, add burned-in captions, and keep the final tone {tone} for {audience}.',
      'Use {toolAName} and {toolBName} to turn a raw clip into a polished caption-first edit. Deliver one {duration} {format} version for {platform}, optimized for {audience}, with quick cuts and a {tone} voice.',
      'Create a caption-led social edit in {toolAName} and {toolBName}: {duration}, {format}, for {platform}. Remove pauses, highlight key phrases, and make it feel {tone} for {audience}.',
    ],
    defaults: {
      audience: 'solo creators',
      format: '9:16',
      duration: '30-second',
      platform: 'Reels or Shorts',
      tone: 'clean and punchy',
    },
    settings: ['Duration: {duration}', 'Aspect ratio: {format}', 'Platform: {platform}', 'Tone: {tone}', 'Captions: word-level emphasis where possible'],
  },
  avatar_presenter: {
    title: 'Avatar spokesperson',
    templates: [
      'Create a {duration} {format} presenter-led video in both {toolAName} and {toolBName}. The speaker is addressing {audience} on {platform}. Include an opening promise, three value points, one proof line, and a CTA with a {tone} delivery.',
      'Using the same script in {toolAName} and {toolBName}, produce an avatar spokesperson video for {audience}. Make it {duration}, {format}, suitable for {platform}, and keep the performance {tone}.',
      'Build a spokesperson-style product update in {toolAName} and {toolBName}: {duration}, {format}, for {platform}. Write to {audience}, use one presenter throughout, and keep the final tone {tone}.',
    ],
    defaults: {
      audience: 'sales or enablement teams',
      format: '16:9',
      duration: '45-second',
      platform: 'email outreach or training hubs',
      tone: 'confident and professional',
    },
    settings: ['Duration: {duration}', 'Aspect ratio: {format}', 'Destination: {platform}', 'Tone: {tone}', 'Presenter: single speaker throughout'],
  },
  localization: {
    title: 'Localization pass',
    templates: [
      'Localize a product video in both {toolAName} and {toolBName} for {audience}. Deliver a {duration} {format} version for {platform} with translated voice or subtitles, localized on-screen text, and a {tone} delivery.',
      'Use {toolAName} and {toolBName} to adapt one master video into a localized version for {platform}. Make it {duration}, {format}, target {audience}, and preserve brand voice with a {tone} tone.',
      'Create a multilingual adaptation in {toolAName} and {toolBName}: one {duration} {format} video for {platform}. Keep terminology consistent for {audience}, add localized captions, and use a {tone} style.',
    ],
    defaults: {
      audience: 'global marketing teams',
      format: '16:9',
      duration: '30-second',
      platform: 'regional campaign landing pages',
      tone: 'brand-safe and native-sounding',
    },
    settings: ['Duration: {duration}', 'Aspect ratio: {format}', 'Destination: {platform}', 'Tone: {tone}', 'Localization: captions plus voice adaptation where supported'],
  },
};

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function fillTemplate(template: string, variables: PromptVariables): string {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof PromptVariables) => variables[key] ?? '');
}

function collectToolSignals(tool?: Tool): string {
  if (!tool) return '';
  return cleanText(
    [
      tool.name,
      tool.tagline,
      tool.short_description,
      tool.best_for,
      ...(tool.tags ?? []),
      ...(tool.categories ?? []),
      ...(tool.features ?? []),
      ...(tool.target_audience_list ?? []),
      ...(tool.content?.overview?.useCases?.map((item) => item.title) ?? []),
    ].join(' '),
  ).toLowerCase();
}

function buildVariables(key: UseCaseKey, params: PromptBuildParams): PromptVariables {
  const definition = USE_CASE_LIBRARY[key];
  const toolSignals = `${collectToolSignals(params.toolA)} ${collectToolSignals(params.toolB)}`;
  const baseAudience =
    params.toolA?.target_audience_list?.[0] ??
    params.toolB?.target_audience_list?.[0] ??
    definition.defaults.audience;

  let audience = baseAudience;
  if (key === 'shorts_social_ads' && /agency|marketing|social/.test(toolSignals)) audience = 'performance marketers';
  if (key === 'repurpose_longform' && /repurpos|webinar|podcast|long-form|youtube/.test(toolSignals)) audience = 'content repurposing teams';
  if (key === 'avatar_presenter' && /sales|avatar|training|enablement/.test(toolSignals)) audience = 'sales, success, or enablement teams';
  if (key === 'localization' && /language|translate|dubb|localiz/.test(toolSignals)) audience = 'global content teams';

  return {
    toolAName: params.toolAName,
    toolBName: params.toolBName,
    audience,
    format: definition.defaults.format,
    duration: definition.defaults.duration,
    platform: definition.defaults.platform,
    tone: definition.defaults.tone,
  };
}

function renderSettings(key: UseCaseKey, variables: PromptVariables): string[] {
  return USE_CASE_LIBRARY[key].settings.map((setting) => fillTemplate(setting, variables));
}

export function inferUseCaseKey(
  label: string,
  keywords: string[] = [],
  signalText = '',
): UseCaseKey | null {
  const normalized = cleanText(`${label} ${keywords.join(' ')} ${signalText}`).toLowerCase();

  if (/(avatar|spokesperson|presenter|digital human|talking head)/.test(normalized)) return 'avatar_presenter';
  if (/(caption|subtitles|editing|editor|trim|cut|polish)/.test(normalized)) return 'captions_editing';
  if (/(repurpos|webinar|podcast|long-form|longform|clip package|highlight)/.test(normalized)) return 'repurpose_longform';
  if (/(blog|script|text-to-video|article|text brief|scripted)/.test(normalized)) return 'script_to_video';
  if (/(localiz|dubb|translate|language|multilingual)/.test(normalized)) return 'localization';
  if (/(shorts|social|ads|reels|tiktok|ugc|campaign)/.test(normalized)) return 'shorts_social_ads';
  if (/(team|workspace|approval|collaboration|review)/.test(normalized)) return 'script_to_video';

  return null;
}

function buildPromptVariant(key: UseCaseKey, params: PromptBuildParams): VsPromptVariant {
  const definition = USE_CASE_LIBRARY[key];
  const variables = buildVariables(key, params);
  const templateIndex = stableHash(`${params.slugSeed}:${key}`) % definition.templates.length;

  return {
    key,
    title: definition.title,
    prompt: fillTemplate(definition.templates[templateIndex], variables),
    settings: renderSettings(key, variables),
  };
}

function inferExtraKeys(params: PromptBuildParams): UseCaseKey[] {
  const toolSignals = `${collectToolSignals(params.toolA)} ${collectToolSignals(params.toolB)}`;
  const extras: UseCaseKey[] = [];

  if (/(repurpos|webinar|podcast|long-form|longform)/.test(toolSignals)) extras.push('repurpose_longform');
  if (/(social|shorts|ads|reels|tiktok)/.test(toolSignals)) extras.push('shorts_social_ads');
  if (/(avatar|spokesperson|presenter|training)/.test(toolSignals)) extras.push('avatar_presenter');
  if (/(caption|subtitle|editing|editor)/.test(toolSignals)) extras.push('captions_editing');
  if (/(localiz|dubb|translate|language)/.test(toolSignals)) extras.push('localization');
  if (/(script|blog|text-to-video|article)/.test(toolSignals)) extras.push('script_to_video');

  return dedupe(extras);
}

export function buildPromptVariants(params: PromptBuildParams): VsPromptVariant[] {
  const scenarioKeys = (params.scenarios ?? [])
    .map((scenario) => scenario.promptKey ?? inferUseCaseKey(scenario.label, scenario.keywords ?? []))
    .filter((key): key is UseCaseKey => Boolean(key));
  const primaryScenarioKey = scenarioKeys[0];
  const secondaryScenarioKeys = scenarioKeys.slice(1);
  const orderedKeys = dedupe([
    ...(primaryScenarioKey ? [primaryScenarioKey] : []),
    ...inferExtraKeys(params),
    ...secondaryScenarioKeys,
    ...DEFAULT_USE_CASE_SEQUENCE,
  ]).slice(0, 3);

  const variants = orderedKeys.map((key) => buildPromptVariant(key, params));
  if (variants.length >= 2) return variants;

  return dedupe([...orderedKeys, ...DEFAULT_USE_CASE_SEQUENCE])
    .slice(0, 2)
    .map((key) => buildPromptVariant(key, params));
}

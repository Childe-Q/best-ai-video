import fs from 'node:fs';
import path from 'node:path';
import { flikiVsHeygen } from '@/data/vs/fliki-vs-heygen';
import { invideoVsHeygen } from '@/data/vs/invideo-vs-heygen';
import { getAllTools, getTool } from '@/lib/getTool';
import { buildDecisionTableRows, toVsDiffRows } from '@/lib/vsDecisionTable';
import { buildLegacyBestFor, buildLegacyKeyDiffs, buildLegacyNotFor } from '@/lib/vsDifferentiation';
import { applyIntentProfileOverride, buildIntentProfile } from '@/lib/vsIntent';
import { buildVsPairCopy } from '@/lib/vsPairType';
import { normalizeSourceUrlList } from '@/lib/vsSources';
import {
  applyFeaturedCalibration,
  buildInferredScoreProvenance,
  getScoreMetricKeys,
  mergeScoreProvenance,
  normalizeInternalScore,
} from '@/lib/vsScore';
import { buildPreferredRowSources, getStrictPricingSources, getToolSourceDomains } from '@/lib/vsToolSources';
import { Tool } from '@/types/tool';
import { VsComparison, VsDiffRow, VsPromptVariant, VsSide } from '@/types/vs';

const DEV_LOG = process.env.NODE_ENV === 'development';

const explicitCanonicalComparisons: VsComparison[] = [flikiVsHeygen, invideoVsHeygen];

type VsAuthoredOverride = {
  decisionSummary?: string;
  shortAnswer?: Partial<VsComparison['shortAnswer']>;
  bestFor?: Partial<VsComparison['bestFor']>;
  notFor?: Partial<VsComparison['notFor']>;
  keyDiffs?: VsDiffRow[];
  matrixRows?: Array<Partial<VsDiffRow>>;
  decisionCases?: VsComparison['decisionCases'];
  editorialNotes?: VsComparison['editorialNotes'];
  faq?: NonNullable<VsComparison['faq']>;
  facts?: NonNullable<VsComparison['facts']>;
  externalValidation?: NonNullable<VsComparison['externalValidation']>;
  derived?: VsComparison['derived'];
  promptBox?: {
    helperText?: string;
  };
  verdict?: {
    recommendation?: string;
  };
};

const AUTHORED_VS_OVERRIDES: Record<string, VsAuthoredOverride> = {
  'invideo-vs-pictory': {
    decisionSummary:
      'Choose InVideo when you need prompt-led stock-scene drafts, built-in media, and faster from-scratch iteration. Choose Pictory when the source already exists and the job is clipping webinars, podcasts, articles, or recordings into publishable social edits.',
    shortAnswer: {
      a: 'InVideo is the better fit for faceless explainers, ad creatives, and from-scratch visual drafts where built-in stock and credit previews matter.',
      b: 'Pictory is the better fit for repurposing webinars, podcasts, Zoom recordings, and long-form clips where transcript editing and recurring quotas matter more.',
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'InVideo is stronger when the team is starting from prompts, scripts, and a blank draft rather than existing footage.',
        b: 'Pictory is stronger when the team already has webinars, podcasts, articles, or recordings that need to be cut into clips.',
      },
      {
        label: 'Watermark path',
        a: 'InVideo Free exports keep both InVideo branding and stock-media watermarks, while paid exports remove the InVideo watermark for publish-ready output.',
        b: 'Pictory Free Trial exports stay branded, while paid plans remove Pictory branding on newly downloaded videos and require a fresh download after upgrading.',
      },
      {
        label: 'Editing model',
        a: 'InVideo is closer to from-scratch visual drafting, where scenes and pacing are built for a new video concept.',
        b: 'Pictory is closer to transcript and highlight extraction, where the job is condensing what already exists.',
      },
      {
        label: 'Workflow limits',
        a: 'InVideo depends on credits and export allowances, so heavy revision cycles can become expensive if the team is not tracking generation costs.',
        b: 'Pictory depends on recurring monthly quotas for video, voiceover, and transcription usage, so heavier teams need to check whether shared quota fits their clip volume.',
      },
      {
        label: 'Use case fit',
        a: 'InVideo fits ad creatives, faceless explainers, and short-form batches when the team needs fresh output volume.',
        b: 'Pictory fits webinar, podcast, and thought-leadership teams that want more mileage from long-form assets.',
      },
      {
        label: 'Where each tool saves time',
        a: 'InVideo saves more time when there is no source footage and the team needs new drafts quickly.',
        b: 'Pictory saves more time when the source material already exists and the bottleneck is cutting it down.',
      },
    ],
    bestFor: {
      a: [
        'Teams creating new stock-scene drafts for ads, explainers, and shorts',
        'Marketers testing multiple visual concepts before they have source footage',
        'Faceless video workflows that start from prompts or scripts',
      ],
      b: [
        'Teams turning webinars, podcasts, and recordings into short clips',
        'Content programs built around repurposing long-form assets',
        'Workflows that begin with existing articles or video rather than a blank draft',
      ],
    },
    notFor: {
      a: [
        'Teams whose best source material already exists in long-form recordings',
        'Transcript-first repurposing workflows',
        'Projects where highlight extraction matters more than draft generation',
      ],
      b: [
        'Teams that need fresh ad concepts from prompts rather than repurposing',
        'Stock-scene drafting from scratch',
        'Faceless social output when there is no long-form source to cut down',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'New stock-scene drafts for ads, explainers, and shorts', b: 'Repurposing webinars, podcasts, and articles into clips' },
      { label: 'Output type', a: 'Prompt-led stock-scene videos with captions and voiceover', b: 'Clip-first videos built from existing long-form source material' },
      { label: 'Watermark path', a: 'Free exports keep InVideo and stock-media watermarks; paid exports remove the InVideo watermark', b: 'Free Trial stays branded; paid plans remove Pictory branding on newly downloaded videos' },
      { label: 'Workflow limits', a: 'Credit preview helps, but draft-heavy generation can burn through usage quickly', b: 'Recurring monthly quotas reset on schedule and team usage depends on shared quota' },
      { label: 'Sharing behavior', a: 'Shared videos can be private, unlisted, or public, but shared links default to public unless changed', b: 'Team workspaces require explicit project sharing rather than automatic visibility to every teammate' },
      { label: 'Commercial-use posture', a: 'Commercial use is allowed, but free exports keep visible branding and stock-watermark limits', b: 'Paid plans are the practical commercial path, but licensing conclusions should stay tied to current official asset and subscription docs' },
    ],
    decisionCases: [
      {
        label: 'Start from scratch',
        keywords: ['social', 'shorts', 'ads', 'stock', 'drafts'],
        winner: 'a',
        verdict: 'InVideo is the better fit when the team is building new scenes, captions, and visual drafts from prompts or scripts rather than trimming existing long-form footage.',
      },
      {
        label: 'Repurpose webinars & podcasts',
        keywords: ['webinar', 'podcast', 'zoom', 'clips', 'repurpose'],
        winner: 'b',
        verdict: 'Pictory is the better fit when the input already exists as webinars, podcasts, Zoom recordings, or long-form clips.',
      },
      {
        label: 'Repurpose existing content',
        keywords: ['article', 'blog', 'script', 'repurpose', 'clips'],
        winner: 'b',
        verdict: 'Pictory is the stronger choice when the input is existing articles or long-form source material that needs to be condensed.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare InVideo and Pictory because both promise to speed up AI video production and both can end in short publishable clips. The confusion is understandable. One is closer to generation from scratch, while the other is closer to repurposing from existing material.',
      looksSimilarButActuallyDifferent:
        'They overlap at the output layer: both can help teams publish short videos faster. The real split is upstream. InVideo is usually chosen when the team is creating new drafts from prompts, scripts, and stock footage. Pictory is usually chosen when the team already has webinars, podcasts, articles, or recordings that need to be turned into clips.',
      realDecision:
        'The real decision is whether you are starting from zero or starting from long-form source material. If the workflow begins with prompts and fresh drafts, InVideo is usually the better fit. If the workflow begins with existing content that needs trimming, Pictory is usually the better fit.',
      hiddenTradeOff:
        'InVideo is faster when the job is new content volume, but it asks the team to shape the story from scratch. Pictory saves time when long-form source material already exists, but it is less useful if there is nothing substantial to repurpose.',
      whoWillRegretTheWrongChoice:
        'Performance teams regret Pictory when they needed fresh ad or short-form concepts, not repurposing. Webinar, podcast, and thought-leadership teams regret InVideo when they end up recreating assets that already existed in longer form.',
    },
    faq: [
      {
        question: 'InVideo vs Pictory: which should I choose first?',
        answer:
          'Choose InVideo if the team needs from-scratch visual drafts built from prompts or scripts. Choose Pictory if the team is repurposing webinars, podcasts, articles, or recordings into clips and wants transcript-led editing.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'InVideo is generation-first and stock-scene oriented. Pictory is repurposing-first and built around transcript editing, highlights, and recurring quota-managed clip production.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Teams making new ad or explainer concepts regret Pictory when there is not enough source material to repurpose. Teams sitting on webinars, podcasts, articles, or recordings regret InVideo when they really needed a repurposing workflow instead of from-scratch visual drafting.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same brief in both tools to compare generation from scratch against repurposing from existing long-form content.',
    },
  },
  'elai-io-vs-synthesia': {
    decisionSummary:
      'Choose Elai when you want a lighter browser workflow for text, URL, or presentation-led presenter videos with straightforward 1080p-to-4K plan gating. Choose Synthesia when governance, export formats, training rollout, and stricter policy controls matter more than the lighter self-serve path.',
    shortAnswer: {
      a: 'Elai is the better fit for structured presenter explainers, presentation-to-video workflows, and lighter team collaboration without jumping straight into a heavier enterprise stack.',
      b: 'Synthesia is the better fit for training, internal communications, and policy-sensitive enterprise rollout where download formats, moderation rules, and governance are part of the buying decision.',
    },
    bestFor: {
      a: [
        'Presentation-to-video and URL-to-video workflows',
        'Teams that want 1080p self-serve publishing before moving into 4K collaboration',
        'Avatar-led explainers and onboarding with lighter workspace controls',
      ],
      b: [
        'Structured training and internal communication rollout',
        'Teams that need explicit download-format support across video, audio, captions, and localization files',
        'Enterprise programs where moderation, governance, and documented policy controls matter',
      ],
    },
    notFor: {
      a: [
        'Buyers who need a fully settled broad ownership or commercial-rights conclusion from public docs alone',
        'Teams that need deeper governance controls than the lighter self-serve path provides',
        'Workflows that depend on deep editing or open-ended generative video creation',
      ],
      b: [
        'Teams planning paid promotion with stock avatars',
        'Buyers who need looser refund expectations or a lighter compliance posture',
        'Use cases where presentation-to-video speed matters more than enterprise controls',
      ],
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'Elai is stronger when the workflow starts from scripts, URLs, or presentations and the team wants a straightforward browser-based presenter system.',
        b: 'Synthesia is stronger when the workflow sits inside training, internal communications, or policy-sensitive explainers with a more formal governance layer.',
      },
      {
        label: 'Watermark path',
        a: 'Elai Free is mainly a proof-of-concept lane, while Creator and above remove the watermark on current official plan docs.',
        b: 'Synthesia Freemium videos are watermarked and require upgrading plus re-generation before the output is clean.',
      },
      {
        label: 'Export & download',
        a: 'Elai\'s current help docs position Creator at 1080p and Team at 4K, with plan-gated collaboration layered on top.',
        b: 'Synthesia documents standard 1080p MP4 downloads plus WAV, XLIFF, SRT, and VTT export paths, though interactive videos may not download as MP4.',
      },
      {
        label: 'Governance path',
        a: 'Elai adds workspaces, role-based access, and enterprise controls as the account moves into higher team and enterprise tiers.',
        b: 'Synthesia puts governance, moderation, licensing constraints, and enterprise rollout concerns closer to the center of the product story.',
      },
      {
        label: 'Workflow limits',
        a: 'Elai self-serve usage is governed by minute bundles, with monthly minutes not rolling over and annual plans front-loading usage.',
        b: 'Synthesia uses credits as a shared currency across video creation and dubbing-style workflows, with plan rules shaping what gets exported and localized.',
      },
    ],
    matrixRows: [
      { label: 'Best for', a: 'Structured presenter explainers, presentation-to-video, and lighter team collaboration', b: 'Training, internal communications, and enterprise avatar rollout' },
      { label: 'Watermark path', a: 'Free is mainly for testing; paid self-serve removes watermark', b: 'Freemium is watermarked; clean exports require upgrading and re-generating' },
      { label: 'Export & download', a: '1080p self-serve and 4K on the higher team tier', b: '1080p MP4 plus WAV, XLIFF, SRT, and VTT on documented download paths' },
      { label: 'Workflow limits', a: 'Minute bundles, no monthly rollover, annual usage front-loaded', b: 'Credits act as a shared currency across creation and localization-style workflows' },
      { label: 'Governance path', a: 'Role-based workspaces, SSO, and broader controls on higher tiers', b: 'Heavier moderation, governance, and policy posture across business and enterprise use' },
      { label: 'Commercial / promotion rules', a: 'Broad output-rights conclusions still need human review', b: 'Commercial use exists, but stock avatars are restricted for paid promotion' },
    ],
    decisionCases: [
      {
        label: 'Presentation-to-video explainers',
        keywords: ['presentation', 'slides', 'deck', 'url', 'structured', 'explainer'],
        winner: 'a',
        verdict: 'Elai is the better fit when the workflow starts from presentations, URLs, or a structured presenter brief and the team wants a lighter browser-based path.',
      },
      {
        label: 'Training and internal rollout',
        keywords: ['training', 'internal', 'rollout', 'learning', 'enterprise'],
        winner: 'b',
        verdict: 'Synthesia is the better fit when the workflow is tied to formal training, internal communication, and enterprise deployment with stronger governance expectations.',
      },
      {
        label: 'Localization with governance needs',
        keywords: ['localization', 'captions', 'xliff', 'vtt', 'policy', 'moderation'],
        winner: 'b',
        verdict: 'Synthesia is the stronger choice when the team needs explicit localization/export formats and is more sensitive to moderation and policy controls than to lighter self-serve publishing.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Elai and Synthesia because both promise avatar-led business video without a production crew. They look similar at the surface level, but they feel different once export rules, governance, and rollout constraints matter.',
      looksSimilarButActuallyDifferent:
        'Both tools create presenter-led videos from text, but Elai feels closer to a lighter browser workflow that can start from scripts, URLs, or presentations. Synthesia feels closer to a training and enterprise communications platform with a thicker policy and export layer.',
      realDecision:
        'The real decision is whether the team mostly needs a lighter presenter-video workflow with 1080p-to-4K plan gating, or a heavier governance-oriented platform for training, internal comms, and documented export controls.',
      hiddenTradeOff:
        'Elai can feel easier to adopt for structured presenter explainers, but its public rights language is less fully settled. Synthesia documents more governance and export detail, but buyers inherit stricter promotion and refund constraints.',
      whoWillRegretTheWrongChoice:
        'Teams that just need faster script, URL, or presentation-to-video output regret Synthesia when the workflow feels heavier than necessary. Training and internal comms teams regret Elai when governance, moderation, and download-policy clarity matter more than a lighter self-serve path.',
    },
    faq: [
      {
        question: 'Elai vs Synthesia: which should I choose first?',
        answer:
          'Choose Elai for lighter presenter-video workflows built from scripts, URLs, or presentations. Choose Synthesia for training, internal communications, and enterprise rollout where governance and export-policy detail matter more.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'Elai is more presentation-to-video and browser-workflow oriented. Synthesia is more governance-heavy and better suited to structured training or internal communication deployment.',
      },
      {
        question: 'What should buyers verify before choosing?',
        answer:
          'On Elai, verify whether minute bundles, role setup, and the current rights posture fit the workflow. On Synthesia, verify whether paid-promotion rules, watermark regeneration, and customer-type refund terms fit the rollout.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same presenter brief in both tools to compare a lighter script or presentation workflow against a governance-heavy training rollout path.',
    },
  },
  'descript-vs-pictory': {
    decisionSummary:
      'Choose Descript when the source is spoken content and the team needs transcript-first editing, cleanup, recording, and publish control in one workspace. Choose Pictory when the job is faster repurposing from webinars, podcasts, articles, or recordings into templated short clips without deeper edit cleanup.',
    shortAnswer: {
      a: 'Descript is the better fit for podcast, interview, webinar, and talking-head workflows where transcript editing, cleanup, and publishing all matter.',
      b: 'Pictory is the better fit for repurposing long-form webinars, podcasts, Zoom calls, and articles into quick social clips with lighter editing demands.',
    },
    bestFor: {
      a: [
        'Podcast and interview editing',
        'Transcript-first cleanup with filler-word removal, Studio Sound, and patch fixes',
        'Teams that want recording, editing, clips, and publishing inside one environment',
      ],
      b: [
        'Webinar, Zoom, and long-form repurposing into short clips',
        'Teams that want highlight extraction and faster social-ready packaging',
        'Content programs where the source already exists and the main job is condensing it',
      ],
    },
    notFor: {
      a: [
        'Buyers who mainly want a lightweight browser repurposing tool rather than a fuller editing workspace',
        'Teams that need original scene generation instead of spoken-content editing',
        'Workflows where a simple template-led clipper is enough',
      ],
      b: [
        'Teams that need deeper transcript cleanup, remote recording, or patch-level spoken-content editing',
        'Buyers who want watermark-free testing on a genuinely practical free tier',
        'Projects that need more flexible editing than a repurposing-first workflow offers',
      ],
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'Descript is stronger when the source is spoken content and the team wants one workspace for recording, transcription, editing, cleanup, clips, and publishing.',
        b: 'Pictory is stronger when the source already exists and the main job is extracting highlights, adding captions, and shipping short clips quickly.',
      },
      {
        label: 'Editing model',
        a: 'Descript is transcript-first editing with deeper cleanup and patch tools for spoken media.',
        b: 'Pictory is repurposing-first with transcript trimming, highlights, and templated clip packaging rather than deeper spoken-content editing.',
      },
      {
        label: 'Watermark path',
        a: 'Descript Free already supports 720p watermark-free export, so the test workflow is unusually close to the publish path.',
        b: 'Pictory Free Trial stays branded, and the clean export path begins on paid plans with fresh downloads after upgrading.',
      },
      {
        label: 'Workflow limits',
        a: 'Descript is governed by media hours, AI credits, and resolution tiers, with Creator opening 4K and fuller AI access.',
        b: 'Pictory is governed by recurring monthly video, voiceover, and transcription quotas that matter more than one-off exports.',
      },
      {
        label: 'Team behavior',
        a: 'Descript adds Rooms, collaboration, and business controls as plans rise, which matters for podcast and interview teams.',
        b: 'Pictory team workspaces still depend on explicit project sharing, so visibility is not automatic across the workspace.',
      },
    ],
    matrixRows: [
      { label: 'Best for', a: 'Podcast, interview, and talking-head editing with deeper transcript control', b: 'Repurposing webinars, podcasts, and articles into quick clips' },
      { label: 'Editing model', a: 'Transcript-first editor with cleanup, recording, and publishing', b: 'Repurposing-first clip workflow with highlights and captions' },
      { label: 'Watermark path', a: 'Free already exports without a watermark at 720p', b: 'Free Trial stays branded; paid plans remove Pictory branding on new downloads' },
      { label: 'Workflow limits', a: 'Media hours, AI credits, and export tiers govern usage', b: 'Recurring monthly quotas govern video, voiceover, and transcription volume' },
      { label: 'Team workflow', a: 'Rooms, collaboration, and higher-tier brand controls matter for team use', b: 'Project sharing is explicit rather than automatic across team members' },
      { label: 'Output fit', a: 'Better for fuller spoken-content edits and publish control', b: 'Better for faster social clip extraction from existing long-form material' },
    ],
    decisionCases: [
      {
        label: 'Podcast and interview cleanup',
        keywords: ['podcast', 'interview', 'cleanup', 'transcript', 'edit'],
        winner: 'a',
        verdict: 'Descript is the better fit when the source is spoken media and the team needs real transcript editing, cleanup, and publish control instead of lighter repurposing.',
      },
      {
        label: 'Repurpose webinars and recordings',
        keywords: ['webinar', 'zoom', 'recording', 'repurpose', 'clips'],
        winner: 'b',
        verdict: 'Pictory is the better fit when the source already exists and the priority is extracting highlights and pushing out social-ready clips quickly.',
      },
      {
        label: 'Free-tier evaluation',
        keywords: ['free', 'watermark', 'test', 'trial'],
        winner: 'a',
        verdict: 'Descript is the stronger option when the team wants a closer-to-publish free evaluation path because the Free tier already exports without a watermark.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Descript and Pictory because both can sit in a repurposing stack for podcasts, webinars, interviews, and long-form content. The confusion comes from the fact that both touch transcripts and clips, but they solve different jobs.',
      looksSimilarButActuallyDifferent:
        'Both tools can help a team turn long-form content into something shorter and more publishable. Descript behaves more like a fuller transcript-first editor. Pictory behaves more like a lighter repurposing engine built to condense and package content fast.',
      realDecision:
        'The real decision is whether the team needs deeper spoken-content editing and cleanup, or whether it mainly needs quicker clip extraction and templated repurposing.',
      hiddenTradeOff:
        'Descript gives teams more editing control and a better free evaluation path, but it can feel heavier than a simple browser repurposing tool. Pictory is faster to adopt for clipping and packaging, but it offers less depth once the team wants finer cleanup or publishing control.',
      whoWillRegretTheWrongChoice:
        'Podcast and interview teams regret Pictory when they actually needed transcript cleanup, patch fixes, and recording. Webinar and content repurposing teams regret Descript when they mostly wanted fast clipping rather than a fuller editor workspace.',
    },
    faq: [
      {
        question: 'Descript vs Pictory: which should I choose first?',
        answer:
          'Choose Descript if the source is spoken content and the team needs transcript-first editing, cleanup, and publishing. Choose Pictory if the source already exists and the main goal is turning it into short clips quickly.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'Descript is closer to a transcript-first editor with deeper cleanup and recording workflows. Pictory is closer to a repurposing-first clip engine for highlights, captions, and fast packaging.',
      },
      {
        question: 'Which tool is easier to test before paying?',
        answer:
          'Descript is easier to test as a true watermark-free workflow because the Free tier already exports cleanly at 720p. Pictory\'s Free Trial stays branded, so the clean export path starts on paid plans.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same webinar, podcast, or interview through both tools to compare transcript-first editing depth against faster repurposing and clip packaging.',
    },
  },
  'heygen-vs-synthesia': {
    decisionSummary:
      'Choose HeyGen for avatar-led outreach, spokesperson videos, and lighter presenter experimentation. Choose Synthesia for structured training, internal communication, and export- or governance-sensitive rollout.',
    bestFor: {
      a: [
        'Sales outreach, product explainers, and spokesperson-style videos',
        'Teams experimenting with presenter-led communication outside formal training ops',
        'Customer-facing avatar videos that need to feel more campaign-like than instructional',
      ],
      b: [
        'Structured training programs and internal communication rollout',
        'Enterprise teams prioritizing governance and repeatable learning workflows',
        'Localization-heavy training content delivered at organizational scale',
      ],
    },
    notFor: {
      a: [
        'Organizations buying primarily for formal training rollout',
        'Teams that need heavier enterprise governance than creative flexibility',
        'Lesson-library workflows centered on structured internal education',
      ],
      b: [
        'Fast-moving outreach or spokesperson video teams',
        'Revenue teams that want lighter presenter iteration',
        'Use cases where campaign agility matters more than rollout structure',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'Outreach, spokesperson videos, and avatar-led explainers', b: 'Corporate training, internal communication, and enterprise rollout' },
      { label: 'Output type', a: 'Presenter-led avatar videos for customer-facing communication', b: 'Avatar videos built for training and internal business communication' },
      { label: 'Watermark path', a: 'Free output is for testing; paid plans are the publish-ready path', b: 'Freemium is watermarked; clean export requires upgrading and re-generating' },
      { label: 'Export posture', a: 'Resolution and usage scale with plan, but export-format documentation is lighter', b: 'Documented 1080p MP4 plus WAV, XLIFF, SRT, and VTT export paths' },
      { label: 'Commercial / promotion rules', a: 'Free usage is non-commercial and broader paid-plan rights should stay tied to current official docs', b: 'Commercial use exists, but stock avatars are restricted for paid promotion' },
      { label: 'Workflow limits', a: 'Credits expire after issuance and no plan offers unlimited AvatarIV usage', b: 'Credits act as a shared currency and some rollout features stay limited to higher tiers' },
      { label: 'Governance path', a: 'Better for lighter communication-led use, with less of the governance story at the center', b: 'Better for policy-sensitive training and enterprise deployment' },
    ],
    decisionCases: [
      {
        label: 'Sales outreach & spokesperson videos',
        keywords: ['sales', 'outreach', 'spokesperson', 'avatar', 'presenter'],
        winner: 'a',
        verdict: 'HeyGen is the better fit when the video is closer to sales, outreach, or spokesperson-style delivery than formal training.',
      },
      {
        label: 'Corporate training rollout',
        keywords: ['training', 'enterprise', 'internal', 'learning', 'rollout'],
        winner: 'b',
        verdict: 'Synthesia is the better fit when the workflow is centered on structured training and enterprise internal communication.',
      },
      {
        label: 'Multilingual internal updates',
        keywords: ['multilingual', 'language', 'internal', 'localization', 'training'],
        winner: 'b',
        verdict: 'Synthesia is the stronger choice when localization is tied to formal internal communication and training rollout.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare HeyGen and Synthesia because both sit in the same avatar-video category and both can replace traditional talking-head production. On a feature checklist they look close. In buying context, they tend to serve different teams.',
      looksSimilarButActuallyDifferent:
        'Both tools create avatar-led video without a film crew. The difference is where the workflow naturally lives. HeyGen is often pulled into growth, sales, and customer-facing communication. Synthesia is often pulled into training, internal communication, and enterprise rollout.',
      realDecision:
        'The real decision is not avatar quality in isolation. It is whether the workflow is closer to campaign communication or structured training operations.',
      hiddenTradeOff:
        'HeyGen tends to feel lighter and more flexible for presenter-led communication, but buyers inherit credit expiry and a thinner export-policy story. Synthesia fits training and rollout structure better, but some teams will feel the workflow is heavier and the promotion rules stricter than the content requires.',
      whoWillRegretTheWrongChoice:
        'Growth and revenue teams regret Synthesia when every presenter video starts to feel heavier than the ask. Enterprise learning and internal comms teams regret HeyGen when governance and rollout discipline matter more than iteration speed.',
    },
    faq: [
      {
        question: 'HeyGen vs Synthesia: which should I choose first?',
        answer:
          'Choose HeyGen for avatar-led outreach and presenter-style communication. Choose Synthesia for training, internal communication, and enterprise rollout.',
      },
      {
        question: 'What is the practical difference?',
        answer:
          'HeyGen is usually the lighter choice for communication-led workflows. Synthesia is usually the steadier choice when export formats, moderation posture, and enterprise deployment matter more.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Revenue teams regret Synthesia when the workflow becomes too heavy for sales-style video. Enterprise learning teams regret HeyGen when rollout, governance, and training structure matter more than flexibility.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same avatar brief in both tools to compare campaign-style presenter delivery against training-led enterprise rollout.',
    },
  },
  'pika-vs-runway': {
    decisionSummary:
      'Choose Pika for fast stylized experiments, meme-ready effects, and short creative clips when speed matters more than control. Choose Runway when the team needs cinematic shot quality, broader model access, and a heavier creative workflow that can move closer to production.',
    shortAnswer: {
      a: 'Pika is the better fit for quick stylized experiments and short-form creative effects where the team can live inside a lighter, shorter-clip workflow.',
      b: 'Runway is the better fit for cinematic concept footage, premium ad prototypes, and teams that need stronger scene control and post-generation workflow depth.',
    },
    bestFor: {
      a: [
        'Short stylized clips and creative experiments',
        'Creators testing meme-ready visuals and quick effect-driven concepts',
        'Teams that want fast social-first scene generation more than a full production environment',
      ],
      b: [
        'Cinematic concept footage and premium-looking creative drafts',
        'Brand and studio teams that need stronger model access and post-generation control',
        'Workflows where generation quality and shot shaping matter more than simple speed',
      ],
    },
    notFor: {
      a: [
        'Buyers who need private-by-default output on lower tiers',
        'Teams that need clearly documented export specs and steadier governance posture',
        'Longer or heavier production workflows where a short-clip tool becomes constraining',
      ],
      b: [
        'Buyers who only want cheap, fast, casual experiments',
        'Teams that dislike heavier creative workflows or tighter credit discipline',
        'Simple social publishing jobs that do not need premium scene control',
      ],
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'Pika is stronger when the job is short stylized generation, quick effects, and fast experimentation.',
        b: 'Runway is stronger when the job is cinematic scene generation with more control over the creative workflow.',
      },
      {
        label: 'Watermark path',
        a: 'Lower Pika tiers remain watermarked, while unwatermarked output is tied to the higher commercial tiers.',
        b: 'Runway Free keeps a watermark, while paid plans remove it and become the practical publish-ready path.',
      },
      {
        label: 'Commercial / privacy posture',
        a: 'Pika keeps lower tiers in a more limited personal-use posture and public-by-default behavior, with cleaner commercial usage higher up the ladder.',
        b: 'Runway is easier to position for professional creative use, but the real trade-off is heavier credit discipline rather than a simpler consumer-style clip tool.',
      },
      {
        label: 'Export posture',
        a: 'Official lower-tier export specs remain relatively thin, so buyers should treat resolution and format assumptions cautiously.',
        b: 'Runway documents paid publish-ready workflow more clearly through model access, watermark removal, storage, and workspace scaling.',
      },
      {
        label: 'Workflow weight',
        a: 'Pika is lighter, faster, and easier to treat as an experiment engine for short visual ideas.',
        b: 'Runway is heavier but gives teams a more complete creative-generation environment.',
      },
    ],
    matrixRows: [
      { label: 'Best for', a: 'Short stylized effects and fast creative experiments', b: 'Cinematic concept footage and premium creative drafts' },
      { label: 'Watermark path', a: 'Lower tiers are watermarked; clean exports start on higher commercial tiers', b: 'Free is watermarked; paid tiers remove the watermark' },
      { label: 'Commercial / privacy posture', a: 'Lower tiers are more restricted and output is not private-by-default', b: 'Creative use is easier to justify, but buyers still need to manage credit-heavy production workflows' },
      { label: 'Export posture', a: 'Official lower-tier export detail is thinner and should be verified before buying for delivery', b: 'Paid publish-ready path is clearer through model, storage, and workspace docs' },
      { label: 'Workflow weight', a: 'Lighter and faster for quick clip generation', b: 'Heavier but stronger for serious creative iteration' },
      { label: 'Team fit', a: 'More creator-first and experiment-led', b: 'More studio- and brand-team-friendly' },
    ],
    decisionCases: [
      {
        label: 'Quick visual experiments',
        keywords: ['effects', 'stylized', 'social', 'short', 'experiment'],
        winner: 'a',
        verdict: 'Pika is the better fit when the job is generating quick stylized clips or experiments for social-first creative testing.',
      },
      {
        label: 'Cinematic concept footage',
        keywords: ['cinematic', 'concept', 'product', 'shot', 'creative'],
        winner: 'b',
        verdict: 'Runway is the better fit when the team needs higher-end concept footage, shot control, and a workflow closer to production.',
      },
      {
        label: 'Professional creative pipeline',
        keywords: ['brand', 'studio', 'campaign', 'workflow', 'team'],
        winner: 'b',
        verdict: 'Runway is the stronger choice when the buyer needs a more professional creative-generation environment rather than a lighter experiment tool.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Pika and Runway because both promise AI-generated visuals for short-form creative work. The overlap is real, but they are not equally suited to the same production posture.',
      looksSimilarButActuallyDifferent:
        'Both tools can create short generated clips. Pika feels more like a fast effect and experiment engine. Runway feels more like a flagship creative environment with broader model access and heavier production intent.',
      realDecision:
        'The real decision is whether the team needs speed and experimentation, or higher-end scene quality and a workflow that can support serious creative iteration.',
      hiddenTradeOff:
        'Pika can feel faster and lighter, but buyers inherit weaker privacy posture on lower tiers and thinner export documentation. Runway gives stronger control and publish-ready structure, but credit discipline and workflow heaviness matter much more.',
      whoWillRegretTheWrongChoice:
        'Creators regret Runway when they only needed quick stylized clips and not a heavier creative stack. Brand or studio teams regret Pika when they run into lower-tier watermark, privacy, or control limits and still need production-grade output.',
    },
    faq: [
      {
        question: 'Pika vs Runway: which should I choose first?',
        answer:
          'Choose Pika for fast stylized experiments and short creative clips. Choose Runway for cinematic concept footage and a stronger production-oriented workflow.',
      },
      {
        question: 'What is the practical difference?',
        answer:
          'Pika is lighter and more experiment-led. Runway is heavier, but it gives teams more model access, scene control, and publish-ready workflow structure.',
      },
      {
        question: 'What should buyers verify before choosing?',
        answer:
          'On Pika, verify watermark, privacy, and current export expectations for the tier you actually plan to use. On Runway, verify whether the team can live with a heavier credit-driven workflow in exchange for stronger creative control.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same short creative brief in both tools to compare a lighter experiment engine against a heavier cinematic-generation workflow.',
    },
  },
  'deepbrain-ai-vs-synthesia': {
    decisionSummary:
      'Choose DeepBrain AI when realistic presenter delivery, localization, SCORM, and heavier business rollout matter more than a lighter avatar workflow. Choose Synthesia when the team wants a steadier training and internal-communications platform with clearer download formats, policy guidance, and stock-avatar guardrails.',
    shortAnswer: {
      a: 'DeepBrain AI is the better fit for enterprise buyers who need realistic presenters, heavier localization workflow, workspace controls, and deployment options such as SCORM, bulk generation, or SAML SSO.',
      b: 'Synthesia is the better fit for training and internal-communications teams that want clearer export formats, stronger governance posture, and steadier documentation around moderation and promotion rules.',
    },
    bestFor: {
      a: [
        'Enterprise presenter videos, localization-heavy rollout, and LMS-style deployment',
        'Teams that care about 4K team output, private custom avatars, and role-based workspaces',
        'Buyers evaluating SAML SSO, SCORM, bulk generation, and API-connected deployment',
      ],
      b: [
        'Structured training and internal communications',
        'Teams that need explicit MP4, WAV, XLIFF, SRT, and VTT export paths',
        'Organizations that want a thicker governance and moderation story around avatar video',
      ],
    },
    notFor: {
      a: [
        'Solo creators looking for the lightest or cheapest avatar path',
        'Teams that do not need heavier deployment, localization, or enterprise controls',
        'Buyers who need unusually explicit public refund detail before procurement',
      ],
      b: [
        'Teams planning paid promotion with stock avatars',
        'Buyers who want heavier 4K team delivery or more deployment-oriented features like SCORM on the comparison path',
        'Use cases where presenter realism and enterprise rollout matter more than export-policy documentation',
      ],
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'DeepBrain AI is stronger when avatar video sits inside a larger enterprise rollout with localization, business templates, and system handoff requirements.',
        b: 'Synthesia is stronger when the core workflow is training, internal communication, and policy-aware presenter delivery with clearer download expectations.',
      },
      {
        label: 'Watermark path',
        a: 'DeepBrain Free is mainly a short demo path, while paid plans remove the default watermark and become the real publishing lane.',
        b: 'Synthesia Freemium is watermarked and requires upgrading plus re-generating the video before it becomes publish-ready.',
      },
      {
        label: 'Export & delivery',
        a: 'DeepBrain moves from watermarked lower-tier output into higher-resolution paid delivery, with Team adding 4K and broader deployment tooling.',
        b: 'Synthesia documents standard 1080p MP4 downloads plus WAV, XLIFF, SRT, and VTT, but interactive videos may not download as MP4.',
      },
      {
        label: 'Governance path',
        a: 'DeepBrain puts more weight on workspaces, private custom avatars, role-based access, SCORM, SAML SSO, and enterprise deployment packaging.',
        b: 'Synthesia puts more weight on moderation, governance, promotion rules, and export-policy clarity across training-oriented usage.',
      },
      {
        label: 'Workflow limits',
        a: 'DeepBrain value climbs sharply once the team needs higher export ceilings, longer videos, more seats, and broader dubbing or generation capacity.',
        b: 'Synthesia uses credits as a shared currency and keeps some capabilities, such as certain rollout or localization paths, more tightly attached to upper tiers.',
      },
    ],
    matrixRows: [
      { label: 'Best for', a: 'Enterprise presenter rollout, localization, and deployment-heavy training', b: 'Training, internal comms, and governance-aware avatar delivery' },
      { label: 'Watermark path', a: 'Free is a demo lane; paid removes default watermark', b: 'Freemium is watermarked; clean exports require upgrading and re-generating' },
      { label: 'Export & delivery', a: 'Paid tiers move into higher-resolution delivery, with Team adding 4K and deployment-oriented controls', b: '1080p MP4 plus WAV, XLIFF, SRT, and VTT on documented paths' },
      { label: 'Governance path', a: 'SCORM, SAML SSO, role-based workspaces, and private custom avatars matter more', b: 'Moderation, policy clarity, and paid-promotion rules matter more' },
      { label: 'Workflow limits', a: 'Team and Enterprise matter once rollout size, seats, or localization depth grow', b: 'Credits and upper-tier rollout rules matter more than a lighter avatar workflow suggests' },
      { label: 'Buyer posture', a: 'Best for heavier deployment needs', b: 'Best for steadier training and internal-comms governance' },
    ],
    decisionCases: [
      {
        label: 'LMS and enterprise deployment',
        keywords: ['scorm', 'lms', 'enterprise', 'deployment', 'sso'],
        winner: 'a',
        verdict: 'DeepBrain AI is the better fit when the buying question includes SCORM, SAML SSO, bulk generation, or heavier rollout mechanics.',
      },
      {
        label: 'Training and internal communications',
        keywords: ['training', 'internal', 'communications', 'captions', 'export'],
        winner: 'b',
        verdict: 'Synthesia is the better fit when the team mainly wants training and internal communications with clearer export formats and policy guidance.',
      },
      {
        label: 'Localization with enterprise controls',
        keywords: ['localization', 'dubbing', 'roles', 'workspace', 'private avatar'],
        winner: 'a',
        verdict: 'DeepBrain AI is the stronger choice when localization, role-based access, private custom avatars, and deployment controls all matter together.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare DeepBrain AI and Synthesia because both sit in the business-avatar category and both can anchor training or internal communication workflows. The gap only becomes obvious once governance and deployment requirements show up.',
      looksSimilarButActuallyDifferent:
        'Both tools can produce presenter-led business video. DeepBrain leans harder into enterprise deployment, role-based workspaces, and rollout mechanics. Synthesia leans harder into governance clarity, moderation posture, and documented export behavior.',
      realDecision:
        'The real decision is whether the team mostly needs heavier rollout infrastructure and presenter realism, or a steadier training platform with clearer export formats and policy constraints.',
      hiddenTradeOff:
        'DeepBrain can be the stronger enterprise deployment choice, but it is heavier and the public refund story is not as cleanly documented. Synthesia documents more policy and export detail, but buyers inherit stricter paid-promotion and refund sensitivities.',
      whoWillRegretTheWrongChoice:
        'Enterprise teams regret Synthesia when they actually needed SCORM, SSO, 4K team delivery, or heavier workspace governance. Training teams regret DeepBrain when they mainly needed a steadier training tool and not a broader deployment stack.',
    },
    faq: [
      {
        question: 'DeepBrain AI vs Synthesia: which should I choose first?',
        answer:
          'Choose DeepBrain AI for heavier enterprise rollout, localization, and deployment needs. Choose Synthesia for training and internal communications when export-policy clarity and governance posture matter more.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'DeepBrain AI is more deployment- and enterprise-rollout-oriented. Synthesia is more governance- and training-oriented, with clearer documented export paths.',
      },
      {
        question: 'What should buyers verify before choosing?',
        answer:
          'On DeepBrain AI, verify whether Team or Enterprise controls such as SCORM, SSO, 4K, private avatars, and workspace roles are actually required. On Synthesia, verify whether stock-avatar promotion limits, refund sensitivity, and the documented export path fit the intended rollout.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same business-presenter brief in both tools to compare heavier enterprise rollout against steadier training and internal-communications governance.',
    },
  },
  'runway-vs-sora': {
    decisionSummary:
      'Choose Runway when the team needs cinematic generation inside a heavier studio-style workflow with clearer publish-ready controls, workspace progression, and post-generation tooling. Choose Sora when the buying question is flagship model quality, style range, and direct generation capability with audio-native output rather than a fuller creative-production stack.',
    facts: [
      {
        key: 'pricing-posture',
        label: 'Pricing posture',
        a: 'Runway Standard starts at $15/mo with 625 monthly credits, while Free starts with 125 one-time credits.',
        b: 'Sora is priced like premium model access, with official docs listing $0.10/sec for sora-2 720p and $0.30-$0.50/sec for sora-2-pro output tiers.',
        sources: {
          a: ['https://runwayml.com/pricing'],
          b: ['https://platform.openai.com/docs/pricing'],
        },
        note: 'This is one of the clearest real-world buying splits: creator-plan credits versus per-second premium generation pricing.',
      },
      {
        key: 'publish-path',
        label: 'Publish-ready path',
        a: 'Runway Free keeps a watermark and excludes Gen-4 video, while paid plans remove the watermark and open the cleaner delivery path.',
        b: 'Current Sora materials are stronger as a premium generation-access path, and visible watermarks remain part of the default output posture in the local source set.',
        sources: {
          a: ['https://runwayml.com/pricing'],
          b: ['https://openai.com/sora/'],
        },
      },
      {
        key: 'workflow-center',
        label: 'Workflow center',
        a: 'Runway combines generation with inpainting, outpainting, motion tracking, background removal, and other post-generation controls.',
        b: 'Sora centers on direct generation from prompts or images, with remixing, style changes, scene extension, and generation-native audio features.',
        sources: {
          a: ['https://runwayml.com/ai-tools', 'https://help.runwayml.com/'],
          b: ['https://openai.com/sora/'],
        },
      },
      {
        key: 'output-style',
        label: 'Output style edge',
        a: 'Runway is stronger when the team wants controlled cinematic drafts that continue into a broader creative pipeline.',
        b: 'Sora is stronger when the team wants flagship realism, style range, hyperreal motion, and built-in sound generation as the main evaluation target.',
        sources: {
          a: ['https://runwayml.com/ai-tools'],
          b: ['https://openai.com/sora/'],
        },
      },
      {
        key: 'team-security-path',
        label: 'Team and governance path',
        a: 'Runway publicly documents private-by-default assets, SOC 2 Type II coverage, encryption, and enterprise controls such as SSO, analytics, and sharing restrictions.',
        b: 'Current local official Sora materials are much stronger on model and output capability than on a documented team-workspace or enterprise-control story.',
        sources: {
          a: [
            'https://help.runwayml.com/hc/en-us/articles/24300377879827-Understanding-Runway-s-security-and-privacy-standards',
            'https://runwayml.com/data-security',
            'https://help.runwayml.com/hc/en-us/articles/48625698573075-Enterprise-Features'
          ],
          b: ['https://openai.com/sora/', 'https://platform.openai.com/docs/sora'],
        },
        note: 'For procurement-sensitive teams, this often matters more than raw model quality alone.',
      },
    ],
    externalValidation: [
      {
        label: 'Official pricing proof',
        summary:
          'This pair is unusually concrete on pricing posture: Runway exposes a creator-plan credit ladder, while OpenAI publishes Sora video costs per second and per output tier.',
        sourceName: 'Runway and OpenAI pricing docs',
        sourceUrl: 'https://platform.openai.com/docs/pricing',
        kind: 'official-proof',
      },
      {
        label: 'Official workflow split',
        summary:
          'Runway public materials emphasize a broader creative-production stack around generation, while Sora public materials emphasize direct prompt-or-image generation, remixing, and audio-native scene output.',
        sourceName: 'Product pages',
        sourceUrl: 'https://openai.com/sora/',
        kind: 'official-proof',
      },
      {
        label: 'Enterprise-readiness check',
        summary:
          'Runway currently has the clearer documented security and enterprise trail in the local source set, which makes the pair less about abstract model quality and more about deployment posture for serious teams.',
        sourceName: 'Runway security docs',
        sourceUrl: 'https://runwayml.com/data-security',
        kind: 'security',
      },
    ],
    derived: {
      hardDataIntro:
        'If the verdict still feels close, anchor the decision on these source-backed checks first: pricing posture, watermark path, workflow center, and the public team-governance trail.',
      externalValidationIntro:
        'These official proof points are supporting material only. They exist to make the comparison less abstract and more operational.',
    },
    shortAnswer: {
      a: 'Runway is the better fit for teams that want cinematic generation plus a fuller creative workflow around the footage, from testing into publish-ready or enterprise usage.',
      b: 'Sora is the better fit for teams that mostly want flagship model quality, realism, style range, and direct generation capability rather than a studio-style production stack.',
    },
    bestFor: {
      a: [
        'Cinematic concept footage and premium creative drafts',
        'Brand and studio teams that need stronger creative control around generated video',
        'Workflows where publish-ready output and team controls matter more than a pure model benchmark',
      ],
      b: [
        'Flagship text-to-video quality and realism benchmarking',
        'Teams that want generation-first video with broad style range, sound, and strong model-led output',
        'Prototype creative where model quality matters more than built-in editing depth or team controls',
      ],
    },
    notFor: {
      a: [
        'Buyers who only want a lighter model-first generator without the heavier creative workflow',
        'Teams that dislike credit-sensitive iteration or do not need studio-style control',
        'Use cases where simple prompt output matters more than post-generation workflow',
      ],
      b: [
        'Buyers who need a fuller editor-centric workflow around the generated footage',
        'Teams that want a cleaner publish-ready path instead of a premium generation-access posture',
        'Workflows where built-in post-production, workspace controls, or enterprise readiness matter more than pure generation quality',
      ],
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'Runway is stronger when the team wants cinematic generation plus editing, compositing, and a heavier creative workflow around the output.',
        b: 'Sora is stronger when the team wants a generation-first system focused on realism, style range, and direct model-driven output.',
      },
      {
        label: 'Pricing and access posture',
        a: 'Runway behaves more like a creator-plan ladder with credits and a visible upgrade path from Free to Standard, Pro, and Enterprise.',
        b: 'Sora behaves more like premium generation access, where costs are published per second and rise with higher output tiers.',
      },
      {
        label: 'Publish-ready path',
        a: 'Runway Free keeps a watermark and excludes higher-end video, while paid plans become the practical clean-delivery path.',
        b: 'Sora is better treated as premium model access first, not as the clearest out-of-the-box publishing lane in the current source set.',
      },
      {
        label: 'Output stack',
        a: 'Runway pairs generation with post-generation tools such as inpainting, outpainting, motion tracking, and background removal.',
        b: 'Sora pairs direct generation with prompt-or-image starts, remixing, style shifts, scene extension, and generation-native sound.',
      },
      {
        label: 'Team and governance path',
        a: 'Runway has the clearer public trail for private-by-default assets, enterprise controls, and deployment-sensitive use.',
        b: 'Sora has the clearer public trail for flagship model capability, but not the same documented team-workspace or enterprise-control posture in the local dataset.',
      },
      {
        label: 'Best-fit output',
        a: 'Runway is more convincing when the buyer wants controlled cinematic concept footage that can live inside a broader creative pipeline.',
        b: 'Sora is more convincing when the buyer wants a flagship model benchmark for realism, motion, sound, and style range.',
      },
    ],
    matrixRows: [
      {
        label: 'Best for',
        a: 'Cinematic concept footage and stronger creative workflow control',
        b: 'Flagship model quality and generation-first realism',
      },
      {
        label: 'Output type',
        a: 'Cinematic concept clips that continue into editing, compositing, and publish-ready finishing',
        b: 'Generation-first clips with audio-native output, stronger realism, and model-led scene creation',
      },
      {
        label: 'Workflow speed',
        a: 'Depends on workflow setup',
        b: 'Fast for short iterations',
      },
      {
        label: 'Templates',
        a: 'Scene-building workflow with editor-style shot iteration and post-generation controls',
        b: 'Storyboard-style scene starts with remixing, style shifts, and prompt-led iteration',
      },
      {
        label: 'Pricing starting point',
        a: '$15/mo',
        b: '$20/mo',
      },
    ],
    decisionCases: [
      {
        label: 'Cinematic brand creative',
        keywords: ['brand', 'creative', 'cinematic', 'campaign', 'concept'],
        winner: 'a',
        verdict: 'Runway is the better fit when the team needs cinematic generation inside a broader creative workflow for branded drafts or concept footage.',
      },
      {
        label: 'Flagship model benchmark',
        keywords: ['realism', 'benchmark', 'model', 'quality', 'prototype'],
        winner: 'b',
        verdict: 'Sora is the better fit when the buyer mostly wants a flagship text-to-video benchmark for realism, style range, sound, and direct model output.',
      },
      {
        label: 'Publish-ready creative workflow',
        keywords: ['publish', 'workflow', 'edit', 'creative', 'control'],
        winner: 'a',
        verdict: 'Runway is the stronger choice when the team needs more control, a clearer paid publish path, and a documented team-governance story around generated footage.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Runway and Sora because both sit near the top of the cinematic-generation category and both can produce high-end AI video from prompts. The overlap is real, but the buying posture is not the same.',
      looksSimilarButActuallyDifferent:
        'Both tools can produce cinematic-looking output. Runway feels more like a studio-style creative environment with a heavier workflow around the footage. Sora feels more like premium generation infrastructure with stronger emphasis on model quality, direct output, and flagship model performance.',
      realDecision:
        'The real decision is whether the team needs a fuller creative workflow around generated video or a more generation-first system centered on flagship model quality and audio-native output.',
      hiddenTradeOff:
        'Runway gives teams more control, a clearer paid publish-ready path, and a better documented team-governance trail, but the workflow is heavier and more credit-sensitive. Sora gives teams a stronger flagship model benchmark, but it is less editor-centric and behaves more like premium generation access than like a fuller production stack.',
      whoWillRegretTheWrongChoice:
        'Creative and procurement-sensitive teams regret Sora when they really needed a heavier workflow and clearer deployment posture around generated footage. Model-benchmark buyers regret Runway when they mostly wanted flagship generation quality and not the extra studio-style workflow.',
    },
    faq: [
      {
        question: 'Runway vs Sora: which should I choose first?',
        answer:
          'Choose Runway for cinematic generation plus a stronger creative workflow, cleaner paid publish path, and clearer team controls. Choose Sora when the main buying question is flagship model quality, realism, sound, and generation-first capability.',
      },
      {
        question: 'What is the practical difference?',
        answer:
          'Runway is more studio-style and editor-aware, while Sora is more generation-first and model-driven.',
      },
      {
        question: 'What should buyers verify before choosing?',
        answer:
          'On Runway, verify whether the team can support a heavier credit-sensitive workflow in exchange for more control and a clearer deployment path. On Sora, verify whether the per-second premium pricing, watermark posture, and generation-first workflow fit the intended use.',
      },
      {
        question: 'Which tool is better for serious team deployment?',
        answer:
          'Runway is the stronger fit when the team needs a clearer public security and enterprise trail around the generation workflow. Sora is the stronger fit when the team is primarily buying flagship model capability rather than a documented production environment.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same cinematic brief in both tools to compare a heavier studio-style creative workflow against a generation-first flagship model path.',
    },
  },
  'deepbrain-ai-vs-heygen': {
    decisionSummary:
      'Choose DeepBrain AI when avatar video is part of a heavier enterprise rollout with localization, workspace controls, SCORM, or SSO. Choose HeyGen when the job is lighter spokesperson video for outreach, explainers, and faster presenter-led communication without the same deployment weight.',
    shortAnswer: {
      a: 'DeepBrain AI is the stronger fit for enterprise presenter rollout, localization-heavy deployment, and governed business workflows.',
      b: 'HeyGen is the stronger fit for spokesperson videos, outreach, and lighter presenter-led explainers that need to move faster.',
    },
    keyDiffs: [
      {
        label: 'Deployment model',
        a: 'DeepBrain AI is positioned more like an enterprise presenter platform, with role-based workspaces, SCORM, SAML SSO, and rollout-oriented deployment in the buying story.',
        b: 'HeyGen is positioned more like a lighter browser workflow for spokesperson videos, outreach, and fast presenter-led explainers.',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/features', 'https://www.heygen.com/pricing'],
        },
      },
      {
        label: 'Workflow style',
        a: 'DeepBrain AI fits teams building repeatable presenter workflows that may connect to existing systems, subtitles, dubbing, and formal rollout processes.',
        b: 'HeyGen fits teams that want to move faster from script to presenter video without treating deployment as a larger systems project.',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/features'],
        },
      },
      {
        label: 'Localization posture',
        a: 'DeepBrain AI frames multilingual presenter delivery as part of broader enterprise-scale communication and rollout, with dubbing, subtitle handling, and 150 plus language support on paid paths.',
        b: 'HeyGen frames multilingual delivery around voice cloning, lip-sync, and presenter updates that still feel campaign-ready.',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/pricing'],
        },
      },
      {
        label: 'Watermark and publish path',
        a: 'DeepBrain Free is mainly a short demo lane, while paid plans remove the default watermark and become the real publishing path.',
        b: 'HeyGen Free is a testing lane with watermarked output, while publishable delivery sits on paid plans and still remains usage-gated.',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/pricing', 'https://www.heygen.com/faq'],
        },
      },
    ],
    bestFor: {
      a: [
        'Enterprise teams rolling out realistic presenter video with API or white-label requirements',
        'Avatar workflows tied to formal deployment, governance, or systems integration',
        'Global teams that want presenter-led communication with stronger enterprise posture',
      ],
      b: [
        'Spokesperson videos, outreach, and presenter-led explainers that need to move quickly',
        'Revenue, marketing, and enablement teams that want a lighter presenter workflow',
        'Teams iterating on avatar-led communication without a heavier deployment project behind it',
      ],
    },
    notFor: {
      a: [
        'Lean teams that mainly need lightweight outreach or campaign-style presenter videos',
        'Workflows where fast iteration matters more than deployment controls',
        'Buyers who do not need API-backed rollout, white-label delivery, or enterprise posture',
      ],
      b: [
        'Organizations buying avatar video as part of a larger enterprise deployment',
        'Teams that need stronger white-label or systems-integration posture',
        'Presenter programs where rollout structure matters more than lightweight iteration',
      ],
    },
    matrixRows: [
      {
        label: 'Best for',
        a: 'Enterprise avatar rollout, localization-heavy deployment, and governed presenter workflows',
        b: 'Spokesperson videos, outreach, and lighter presenter-led explainers',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/features'],
        },
      },
      {
        label: 'Watermark path',
        a: 'Free is a demo lane; paid plans remove the default watermark',
        b: 'Free is for testing; paid plans are the publish-ready path',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/pricing'],
        },
      },
      {
        label: 'Export posture',
        a: 'Paid delivery scales from 1080p into Team-level 4K and deployment-oriented handoff',
        b: 'Plan-based resolution scales across tiers, but export-format documentation stays lighter',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/pricing'],
        },
      },
      {
        label: 'Workflow limits',
        a: 'Higher-value features show up once longer videos, more seats, dubbing, or bulk generation matter',
        b: 'Credits expire after issuance and no plan offers unlimited AvatarIV usage',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/pricing', 'https://www.heygen.com/faq'],
        },
      },
      {
        label: 'Governance path',
        a: 'Workspace roles, private custom avatars, SCORM, and SSO matter much more',
        b: 'Better for lighter communication teams, with governance features less central to the value story',
        sources: {
          a: ['https://www.deepbrain.io/pricing'],
          b: ['https://www.heygen.com/pricing'],
        },
      },
    ],
    decisionCases: [
      {
        label: 'Sales outreach & spokesperson videos',
        keywords: ['sales', 'outreach', 'spokesperson', 'presenter'],
        winner: 'b',
        verdict: 'HeyGen is the better fit when the job is spokesperson-style outreach, sales communication, or presenter-led explainers that need to move quickly.',
      },
      {
        label: 'Enterprise training rollout',
        keywords: ['training', 'enterprise', 'internal', 'learning', 'rollout'],
        winner: 'a',
        verdict: 'DeepBrain AI is the better fit when avatar video sits inside a more formal enterprise rollout with stronger deployment and systems requirements.',
      },
      {
        label: 'API-backed deployment',
        keywords: ['api', 'white-label', 'deployment', 'integration', 'enterprise'],
        winner: 'a',
        verdict: 'DeepBrain AI is the stronger choice when the buyer cares about API-backed rollout, white-label options, or a more deployment-oriented avatar program.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare DeepBrain AI and HeyGen because both promise realistic presenter-led video without a traditional film workflow. They overlap at the category level, but the buying motion is usually different once deployment requirements enter the discussion.',
      looksSimilarButActuallyDifferent:
        'Both tools make avatar video with a realistic presenter feel. The difference is not simply avatar quality. DeepBrain AI is closer to enterprise deployment, heavier localization, and governed rollout. HeyGen is closer to lighter spokesperson workflows for outreach, explainers, and presenter-led communication that needs to move faster.',
      realDecision:
        'The real decision is whether avatar video is being bought as a lighter communication workflow or as part of a broader enterprise deployment. If the team needs systems posture and rollout control, DeepBrain AI is usually the stronger fit. If the team mainly needs faster presenter-led communication, HeyGen is usually the cleaner buy.',
      hiddenTradeOff:
        'DeepBrain AI can make more sense once deployment, 4K team delivery, SCORM, or SSO needs are real, but that posture is heavier than some communication teams actually need. HeyGen is lighter for spokesperson-style work, but buyers inherit credit expiry and a thinner governance story when the purchase is really about rollout structure.',
      whoWillRegretTheWrongChoice:
        'Revenue and marketing teams regret DeepBrain AI when the workflow only needed fast presenter-led outreach and the deployment posture adds unnecessary weight. Enterprise teams regret HeyGen when avatar video becomes part of a more formal rollout with systems integration, white-label, or governance expectations.',
    },
    faq: [
      {
        question: 'DeepBrain AI vs HeyGen: which belongs on the shortlist first?',
        answer:
          'Put DeepBrain AI first when the buying motion is enterprise presenter deployment, API-backed rollout, or white-label delivery. Put HeyGen first when the team mainly needs spokesperson videos, outreach, and lighter presenter-led explainers.',
      },
      {
        question: 'What is the real buying split?',
        answer:
          'DeepBrain AI is closer to an enterprise presenter workflow with stronger deployment posture, localization depth, and governed rollout. HeyGen is closer to a lighter browser workflow for spokesperson videos, outreach, and presenter-led explainers.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Teams focused on outreach and fast presenter communication regret DeepBrain AI when enterprise deployment posture adds more process than the workflow needs. Teams buying for rollout, integration, or white-label delivery regret HeyGen when the organization really needed a more deployment-oriented avatar platform.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same presenter brief in both tools to compare enterprise deployment posture against a lighter spokesperson workflow.',
    },
    verdict: {
      recommendation:
        'Choose DeepBrain AI when avatar video is part of an enterprise deployment with rollout, localization, SCORM, or SSO requirements. Choose HeyGen when the team mainly needs faster spokesperson videos, outreach, and lighter presenter-led communication.',
    },
  },
  'colossyan-vs-synthesia': {
    decisionSummary:
      'Choose Colossyan when the workflow centers on repeatable training rollout, quizzes, branching, SCORM, and more explicit workspace-style deployment controls. Choose Synthesia when the team wants a steadier training and internal-communications platform with clearer export formats, moderation posture, and stock-avatar policy guidance.',
    shortAnswer: {
      a: 'Colossyan is the better fit for L&D teams building repeatable instructional content with interactivity, LMS-oriented deployment, and governed team rollout.',
      b: 'Synthesia is the better fit for training and internal-communications teams that want clearer export behavior, moderation posture, and a steadier documentation layer around presenter video.',
    },
    bestFor: {
      a: [
        'L&D, onboarding, and internal enablement teams building repeatable training content',
        'Buyers who care about quizzes, branching scenarios, SCORM, and shared workspaces',
        'Teams that want training-oriented templates and multilingual rollout with governed permissions',
      ],
      b: [
        'Training and internal communications with clearer download-format support',
        'Teams that want stronger policy guidance around moderation, exports, and stock-avatar promotion rules',
        'Organizations that do not need as much built-in interactivity or LMS-style deployment in the core workflow',
      ],
    },
    notFor: {
      a: [
        'Buyers who mainly need marketing-style spokesperson clips rather than training rollout',
        'Teams that do not care about quizzes, branching, or SCORM-style deployment',
        'Use cases where a lighter publish flow matters more than training-specific structure',
      ],
      b: [
        'Teams planning paid promotion with stock avatars',
        'Buyers who need 4K team delivery, interactive learning features, or LMS-oriented deployment on the shortlist',
        'Workflows where training-specific templates and workspace permissions matter more than export-policy clarity',
      ],
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'Colossyan is stronger when the video program is structured around training, onboarding, internal enablement, and repeatable instructional delivery.',
        b: 'Synthesia is stronger when the team wants avatar-led training and internal communication with clearer export and moderation guidance.',
      },
      {
        label: 'Watermark path',
        a: 'Colossyan Free is a trial-style lane, while Starter is the first real publishing tier and removes the watermark.',
        b: 'Synthesia Freemium is watermarked and requires upgrading plus re-generating the video before it becomes publish-ready.',
      },
      {
        label: 'Export & deployment',
        a: 'Colossyan moves from Full HD publishing into 4K Business delivery and SCORM-oriented enterprise deployment.',
        b: 'Synthesia documents standard 1080p MP4 downloads plus WAV, XLIFF, SRT, and VTT, but interactive videos may not download as MP4.',
      },
      {
        label: 'Interactivity & rollout',
        a: 'Colossyan puts quizzes, branching scenarios, interactive video, team templates, and shared workspaces closer to the center of the product story.',
        b: 'Synthesia puts more weight on moderation, policy clarity, and cleaner export or documentation posture than on built-in learning interactivity.',
      },
      {
        label: 'Rights and policy posture',
        a: 'Colossyan documents a more explicit bounded ownership model and a clearer self-serve refund window than many avatar tools, but customers still remain responsible for third-party rights.',
        b: 'Synthesia documents commercial-use and licensing constraints clearly, but stock avatars remain restricted for paid promotion and refund language varies by customer type.',
      },
    ],
    matrixRows: [
      { label: 'Best for', a: 'Training rollout, onboarding, and LMS-style instructional delivery', b: 'Training and internal comms with clearer export and moderation posture' },
      { label: 'Watermark path', a: 'Free is trial-style; Starter is the first clean publishing lane', b: 'Freemium is watermarked; clean export requires upgrading and re-generating' },
      { label: 'Export & deployment', a: 'Full HD on Starter, 4K on Business, SCORM on enterprise-oriented deployment', b: '1080p MP4 plus WAV, XLIFF, SRT, and VTT on documented paths' },
      { label: 'Interactivity & rollout', a: 'Quizzes, branching, shared workspaces, and training templates matter more', b: 'Moderation and policy clarity matter more than built-in learning interactivity' },
      { label: 'Policy posture', a: 'Bounded ownership and clearer refund window, with customer responsibility for rights', b: 'Paid-promotion restrictions for stock avatars and customer-type refund sensitivity' },
      { label: 'Buyer posture', a: 'Better for governed training deployment', b: 'Better for steadier training and internal-comms publishing' },
    ],
    decisionCases: [
      {
        label: 'Interactive learning rollout',
        keywords: ['quiz', 'branching', 'scorm', 'lms', 'training'],
        winner: 'a',
        verdict: 'Colossyan is the better fit when the team needs interactive learning content, SCORM, or governed LMS-style deployment rather than just avatar-led delivery.',
      },
      {
        label: 'Training with explicit export formats',
        keywords: ['captions', 'xliff', 'vtt', 'export', 'internal'],
        winner: 'b',
        verdict: 'Synthesia is the better fit when the team wants clearer documented export formats and a steadier internal-communications or training posture.',
      },
      {
        label: 'Governed multilingual training',
        keywords: ['localization', 'translation', 'permissions', 'workspace', 'onboarding'],
        winner: 'a',
        verdict: 'Colossyan is the stronger choice when multilingual rollout, shared workspaces, permissions, and template-led training deployment all matter together.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Colossyan and Synthesia because both sit in the avatar-for-training category and both can replace traditional internal-video production. The overlap is real, but the deployment posture is not identical.',
      looksSimilarButActuallyDifferent:
        'Both tools can create presenter-led training videos. Colossyan leans harder into training-specific rollout with interactivity, templates, workspaces, and LMS-oriented deployment. Synthesia leans harder into export-policy clarity, moderation posture, and steadier internal-communications fit.',
      realDecision:
        'The real decision is whether the team needs more interactive, deployment-heavy training structure, or a steadier avatar platform with clearer export and policy behavior.',
      hiddenTradeOff:
        'Colossyan can be the stronger training deployment pick, but its value is more specialized and tied to interactivity and rollout structure. Synthesia is steadier for training and internal comms, but buyers inherit stricter stock-avatar promotion limits and less of the built-in LMS-style workflow.',
      whoWillRegretTheWrongChoice:
        'L&D teams regret Synthesia when they really needed quizzes, branching, SCORM, or stronger training templates. Internal-comms teams regret Colossyan when the workflow only needed cleaner export behavior and not the extra training-rollout structure.',
    },
    faq: [
      {
        question: 'Colossyan vs Synthesia: which should I choose first?',
        answer:
          'Choose Colossyan for repeatable training rollout with interactivity, SCORM, and governed team workflows. Choose Synthesia for training and internal communications when export-policy clarity and moderation posture matter more.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'Colossyan is more deployment- and interactivity-oriented for L&D and onboarding. Synthesia is more export- and policy-oriented for steady training and internal-communications publishing.',
      },
      {
        question: 'What should buyers verify before choosing?',
        answer:
          'On Colossyan, verify whether interactive learning, SCORM, shared workspaces, and the current rights model are actually required. On Synthesia, verify whether paid-promotion limits for stock avatars, refund sensitivity, and the documented export path fit the rollout.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same training brief in both tools to compare interactive rollout structure against steadier export-policy and governance posture.',
    },
  },
  'colossyan-vs-heygen': {
    decisionSummary:
      'Choose Colossyan when the workflow centers on repeatable training rollout, interactivity, shared workspaces, and governed deployment. Choose HeyGen when the job is lighter spokesperson video for outreach, marketing, and presenter-led communication that needs to move faster.',
    shortAnswer: {
      a: 'Colossyan is the better fit for L&D teams and governed rollout workflows built around onboarding, training, multilingual delivery, and interactive learning.',
      b: 'HeyGen is the better fit for outreach, sales, marketing, and lighter presenter-led explainers that do not need the same training or deployment structure.',
    },
    bestFor: {
      a: [
        'Training, onboarding, and internal enablement teams',
        'Buyers who care about quizzes, branching, shared workspaces, and SCORM-style rollout',
        'Teams that want multilingual training content with governed permissions and templates',
      ],
      b: [
        'Spokesperson videos, outreach, and presenter-led explainers',
        'Revenue and marketing teams that need faster avatar iteration',
        'Use cases where campaign communication matters more than training rollout structure',
      ],
    },
    notFor: {
      a: [
        'Teams that mainly want quick spokesperson content or sales outreach',
        'Buyers who do not need interactivity, SCORM, or training-specific deployment',
        'Workflows where a lighter publish path matters more than L&D structure',
      ],
      b: [
        'Organizations buying avatar video as part of a governed training rollout',
        'Teams that need stronger team permissions, LMS-style deployment, or interactive learning support',
        'Workflows where multilingual training operations matter more than presenter speed',
      ],
    },
    keyDiffs: [
      {
        label: 'Core workflow',
        a: 'Colossyan is stronger when the video program is structured around training, onboarding, internal enablement, and repeatable instructional delivery.',
        b: 'HeyGen is stronger when the team wants lighter avatar-led outreach, spokesperson, or presenter communication without the same training-heavy rollout posture.',
      },
      {
        label: 'Watermark path',
        a: 'Colossyan Free is a trial-style lane, while Starter is the first real publishing tier and removes the watermark.',
        b: 'HeyGen Free is mainly a testing lane with watermarked output, while publish-ready delivery sits on paid plans.',
      },
      {
        label: 'Workflow limits',
        a: 'Colossyan value rises with Business and Enterprise once interactivity, more seats, translation, and governed deployment matter.',
        b: 'HeyGen usage is shaped more by credit expiry, plan-based resolution, and the lack of unlimited AvatarIV usage.',
      },
      {
        label: 'Governance and rollout',
        a: 'Colossyan puts quizzes, branching, shared workspaces, team permissions, and SCORM-style deployment much closer to the center of the product story.',
        b: 'HeyGen can support business security features on higher tiers, but it remains a lighter communication-led platform rather than a training deployment stack.',
      },
      {
        label: 'Rights and policy posture',
        a: 'Colossyan documents a bounded ownership model and a clearer self-serve refund window, while still making customers responsible for third-party rights.',
        b: 'HeyGen documents non-commercial free usage and output ownership more directly, but the real trade-off is lighter governance and a more campaign-oriented workflow.',
      },
    ],
    matrixRows: [
      { label: 'Best for', a: 'Training rollout, onboarding, and governed instructional delivery', b: 'Spokesperson videos, outreach, and lighter presenter communication' },
      { label: 'Watermark path', a: 'Free is trial-style; Starter is the first clean publishing lane', b: 'Free is mainly for testing; paid plans are the publish-ready path' },
      { label: 'Workflow limits', a: 'Interactivity, translation, and rollout depth rise sharply on higher tiers', b: 'Credit expiry and AvatarIV limits matter more than training deployment controls' },
      { label: 'Governance path', a: 'Shared workspaces, permissions, SCORM, and training templates matter more', b: 'Security features exist, but the product stays lighter and communication-led' },
      { label: 'Rights and policy posture', a: 'Bounded ownership and clearer refund window, with customer responsibility for rights', b: 'Free is non-commercial and paid use is more campaign-oriented, with lighter rollout structure' },
      { label: 'Buyer posture', a: 'Better for governed L&D and training teams', b: 'Better for revenue, marketing, and outreach teams' },
    ],
    decisionCases: [
      {
        label: 'Interactive learning rollout',
        keywords: ['quiz', 'branching', 'training', 'scorm', 'onboarding'],
        winner: 'a',
        verdict: 'Colossyan is the better fit when the team needs interactive learning content, governed rollout, or training-specific deployment instead of just presenter delivery.',
      },
      {
        label: 'Spokesperson and outreach videos',
        keywords: ['sales', 'outreach', 'spokesperson', 'marketing', 'campaign'],
        winner: 'b',
        verdict: 'HeyGen is the better fit when the job is spokesperson-style outreach, sales communication, or fast presenter-led explainers.',
      },
      {
        label: 'Multilingual training operations',
        keywords: ['localization', 'translation', 'permissions', 'workspace', 'learning'],
        winner: 'a',
        verdict: 'Colossyan is the stronger choice when multilingual rollout, templates, permissions, and training structure matter more than lighter campaign-style iteration.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Colossyan and HeyGen because both sit in the avatar-video category and both can replace traditional talking-head production. The overlap is real, but the buying motion is often different.',
      looksSimilarButActuallyDifferent:
        'Both tools can create presenter-led videos. Colossyan leans harder into training-specific rollout with interactivity, templates, permissions, and LMS-style deployment. HeyGen leans harder into outreach, sales, marketing, and lighter presenter-led communication.',
      realDecision:
        'The real decision is whether the team needs a governed training-rollout platform or a lighter communication-led avatar workflow.',
      hiddenTradeOff:
        'Colossyan can be the stronger L&D deployment choice, but its value is more specialized and less useful for casual spokesperson work. HeyGen is lighter and faster for outreach, but buyers inherit credit expiry and a thinner rollout structure when training governance actually matters.',
      whoWillRegretTheWrongChoice:
        'Training teams regret HeyGen when they really needed quizzes, branching, permissions, or a more governed deployment posture. Revenue and marketing teams regret Colossyan when the workflow only needed faster spokesperson videos and not the heavier training stack.',
    },
    faq: [
      {
        question: 'Colossyan vs HeyGen: which should I choose first?',
        answer:
          'Choose Colossyan for repeatable training rollout with interactivity, shared workspaces, and governed deployment. Choose HeyGen for spokesperson videos, outreach, and lighter presenter-led communication.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'Colossyan is more training- and rollout-oriented, while HeyGen is more communication- and outreach-oriented.',
      },
      {
        question: 'What should buyers verify before choosing?',
        answer:
          'On Colossyan, verify whether interactive learning, permissions, and deployment structure are actually required. On HeyGen, verify whether credit expiry, paid publish path, and the lighter governance posture fit the workflow.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same presenter brief in both tools to compare governed training rollout against lighter outreach-oriented avatar delivery.',
    },
  },
  'fliki-vs-invideo': {
    decisionSummary:
      'Choose Fliki when the workflow is text-first and narration-led. Choose InVideo when the team needs faster stock-scene drafts for ads, explainers, and short-form production.',
    bestFor: {
      a: [
        'Blog-to-video and narration-led explainers',
        'Teams turning scripts or articles into voice-led videos quickly',
        'Workflows where the story is carried mostly by narration rather than scene design',
      ],
      b: [
        'Faceless explainers, ad creatives, and stock-scene drafts',
        'Teams producing short-form marketing output at higher volume',
        'Workflows where scene assembly matters more than narration-first conversion',
      ],
    },
    notFor: {
      a: [
        'Teams that need broader stock-scene variation from scratch',
        'Projects that depend on more visual assembly than voice-led conversion',
        'Ad workflows centered on scene-driven iteration rather than narration',
      ],
      b: [
        'Text-first teams mainly converting blogs or scripts into narrated videos',
        'Narration-led explainers where a lighter workflow would do',
        'Projects where the voiceover carries most of the value',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'Blog-to-video and narration-led explainers', b: 'Faceless explainers and stock-scene marketing drafts' },
      { label: 'Output type', a: 'Narrated videos built from scripts, articles, and voiceover', b: 'Prompt-led stock-scene videos with captions and voiceover' },
      { label: 'Workflow speed', a: 'Fast for short iterations', b: 'Fast for batch drafts' },
      { label: 'Languages & dubbing', a: 'Voice cloning and multilingual narration workflows', b: 'Multilingual voiceover and caption workflows for stock-scene output' },
      { label: 'Pricing starting point', a: '$28/mo', b: '$28/mo' },
      { label: 'Free plan', a: 'Free plan', b: 'Free plan' },
    ],
    decisionCases: [
      {
        label: 'Blog or article to video',
        keywords: ['blog', 'article', 'voiceover', 'narrated', 'script'],
        winner: 'a',
        verdict: 'Fliki is the better fit when the source material already exists as text and the job is turning it into a narrated video quickly.',
      },
      {
        label: 'Faceless explainers & ad drafts',
        keywords: ['faceless', 'ads', 'stock', 'social', 'drafts'],
        winner: 'b',
        verdict: 'InVideo is the better fit when the workflow depends on faster stock-scene drafts for explainers, social clips, and ad variants.',
      },
      {
        label: 'Narration-first explainers',
        keywords: ['voiceover', 'narration', 'script', 'blog', 'explainer'],
        winner: 'a',
        verdict: 'Fliki is the stronger choice when the voiceover is doing most of the communication work.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare Fliki and InVideo because both reduce editing overhead and both can turn written ideas into finished video. The overlap is real, especially for teams trying to publish quickly without filming.',
      looksSimilarButActuallyDifferent:
        'They look similar if you only ask whether text can become video. The split is in format. Fliki is usually a narration-led conversion workflow. InVideo is usually a scene-assembly workflow built for faster visual drafting and broader short-form output.',
      realDecision:
        'The real decision is whether the video is carried by narration or by scene assembly. If voiceover and scripts do most of the work, Fliki is usually cleaner. If the team needs more stock-scene output and faster ad-style iteration, InVideo is usually stronger.',
      hiddenTradeOff:
        'Fliki is lighter when the team already thinks in scripts, articles, and voiceover. InVideo is broader for visual drafting, but it can be heavier than necessary if the message did not need that extra scene-assembly layer.',
      whoWillRegretTheWrongChoice:
        'Text-first teams regret InVideo when the workflow becomes more visual-production-heavy than the brief requires. Social and ad teams regret Fliki when narrated conversion is not enough and they need more scene-driven output variety.',
    },
    faq: [
      {
        question: 'Fliki vs InVideo: which should I choose first?',
        answer:
          'Choose Fliki for text-first, narration-led video. Choose InVideo for stock-scene drafts, faceless explainers, and faster ad-style output.',
      },
      {
        question: 'What is the main workflow difference?',
        answer:
          'Fliki turns scripts or articles into narrated videos. InVideo assembles stock scenes and captions more like a production workflow for short-form output.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Text-first teams regret InVideo when it adds more visual production work than they needed. Social teams regret Fliki when a narration-led workflow is too narrow for the output mix.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same script in both tools to compare a narration-first workflow against a broader scene-assembly workflow.',
    },
  },
  'invideo-vs-zebracat': {
    decisionSummary:
      'Choose InVideo when you need broader stock-scene drafts and faceless explainers. Choose Zebracat when the job is short-form social clips, ad variants, and trend-driven output.',
    bestFor: {
      a: [
        'Broader stock-scene drafts and faceless explainers',
        'Teams that need one tool to cover shorts plus general explainer output',
        'Prompt-led video workflows that extend beyond quick social clips',
      ],
      b: [
        'Short-form social clips, ad variants, and trend-driven output',
        'Teams shipping high-volume marketing cuts for Shorts, Reels, and ads',
        'Workflows that prioritize speed for social publishing over broader explainer coverage',
      ],
    },
    notFor: {
      a: [
        'Teams that only need a tight short-form social clip engine',
        'Trend-led output where broader explainer capability adds little value',
        'Pure social workflows optimized around rapid short-form publishing',
      ],
      b: [
        'Broader faceless explainer pipelines',
        'Teams that need more mixed-format output than short-form social clips',
        'Prompt-led workflows that also need general-purpose stock-scene coverage',
      ],
    },
    matrixRows: [
      { label: 'Best for', a: 'Broader stock-scene drafts and faceless explainers', b: 'Short-form social clips and ad-style marketing output' },
      { label: 'Output type', a: 'Prompt-led stock-scene videos for explainers and mixed-format output', b: 'Short-form marketing clips optimized for social publishing' },
      { label: 'Workflow speed', a: 'Fast for batch drafts', b: 'Fast for batch drafts' },
      { label: 'Pricing starting point', a: '$28/mo', b: '$19/mo' },
      { label: 'Free plan', a: 'Free plan', b: 'Free trial' },
    ],
    decisionCases: [
      {
        label: 'Faceless explainers',
        keywords: ['explainers', 'stock', 'script', 'faceless', 'drafts'],
        winner: 'a',
        verdict: 'InVideo is the better fit when the team needs broader faceless explainers and stock-scene drafts, not just short-form social cuts.',
      },
      {
        label: 'Short-form social ads',
        keywords: ['social', 'shorts', 'reels', 'ads', 'clips'],
        winner: 'b',
        verdict: 'Zebracat is the better fit when the workflow is centered on short-form social ads, Reels, Shorts, and quick marketing clips.',
      },
      {
        label: 'Trend-driven marketing clips',
        keywords: ['trend', 'marketing', 'clips', 'shorts', 'social'],
        winner: 'b',
        verdict: 'Zebracat is the stronger choice when speed for trend-driven short-form marketing matters more than broader explainer coverage.',
      },
    ],
    editorialNotes: {
      whyPeopleCompareTheseTools:
        'People compare InVideo and Zebracat because both are fast AI video tools aimed at teams that need output volume rather than handcrafted edits. They often show up in the same social-content and ad-production searches.',
      looksSimilarButActuallyDifferent:
        'Both help teams publish quickly, but they do not aim at the same center of gravity. InVideo covers a broader stock-scene and faceless-explainer workflow. Zebracat is tighter around short-form social cuts and trend-driven marketing output.',
      realDecision:
        'The real decision is whether the team needs broader visual drafting or a more short-form-native social clip engine.',
      hiddenTradeOff:
        'InVideo gives more room for broader explainer and stock-scene production, but that can be more workflow than a short-form social team actually needs. Zebracat is faster for social-style clips, but it is narrower if the team also needs more general explainer output.',
      whoWillRegretTheWrongChoice:
        'Broader content teams regret Zebracat when the workflow is too narrow for explainers and mixed-format publishing. Short-form ad teams regret InVideo when they wanted a tighter social clip workflow and got a broader tool instead.',
    },
    faq: [
      {
        question: 'InVideo vs Zebracat: which should I choose first?',
        answer:
          'Choose InVideo for broader stock-scene drafts and faceless explainers. Choose Zebracat for short-form social clips and ad-style marketing output.',
      },
      {
        question: 'What is the practical difference?',
        answer:
          'InVideo is broader. Zebracat is narrower but more social-first.',
      },
      {
        question: 'Who usually regrets the wrong choice?',
        answer:
          'Mixed-format content teams regret Zebracat when they need broader explainer coverage. Short-form social teams regret InVideo when they wanted a more focused clip workflow.',
      },
    ],
    promptBox: {
      helperText:
        'Run the same short-form brief in both tools to compare broader stock-scene drafting against a tighter social-clip workflow.',
    },
  },
};

const SUPPLEMENTAL_VS_CANDIDATES: Array<[string, string]> = [
  ['descript', 'veed-io'],
  ['runway', 'sora'],
  ['colossyan', 'heygen'],
  ['deepbrain-ai', 'heygen'],
  ['colossyan', 'synthesia'],
  ['deepbrain-ai', 'synthesia'],
  ['fliki', 'pictory'],
  ['descript', 'pictory'],
  ['descript', 'fliki'],
  ['pictory', 'zebracat'],
];

const SLUG_ALIAS_MAP: Record<string, string> = {
  invideoai: 'invideo',
  'invideo-ai': 'invideo',
  veed: 'veed-io',
  veedio: 'veed-io',
  elai: 'elai-io',
  'elaiio': 'elai-io',
  'elai-io-ai': 'elai-io',
  heygenai: 'heygen',
  'hey-gen': 'heygen',
  synthesiaai: 'synthesia',
  flikiai: 'fliki',
  zebracatai: 'zebracat',
  runwayml: 'runway',
  'runway-ml': 'runway',
};

let canonicalBySlugCache: Map<string, VsComparison> | null = null;

export type ParsedVsSlug = {
  slugA: string;
  slugB: string;
};

export type VsDuplicateRedirect = {
  from: string;
  to: string;
};

export type VsCandidateSkip = {
  slug: string;
  reason: string;
};

export type VsLoadStatus = 'FULL' | 'PARTIAL' | 'MISSING';

export type VsLoadResult = {
  status: VsLoadStatus;
  comparison: VsComparison | null;
  reason?: string;
  errors?: string[];
  indexHit?: boolean;
  hitSource?: 'canonical' | 'legacy' | 'none';
  schemaErrorSummary?: string[];
  source?: 'canonical' | 'legacy-adapter' | 'none';
  normalizedSlug?: string;
  parsed?: ParsedVsSlug | null;
};

function logDebug(message: string, payload?: Record<string, unknown>) {
  if (!DEV_LOG) return;
  if (payload) {
    console.info(`[vs-loader] ${message}`, payload);
    return;
  }
  console.info(`[vs-loader] ${message}`);
}

function summarizeErrors(errors?: string[]): string[] {
  return (errors ?? []).slice(0, 3);
}

function finalizeVsResult(result: VsLoadResult, debug: boolean): VsLoadResult {
  const hitSource =
    result.hitSource ??
    (result.source === 'canonical' ? 'canonical' : result.source === 'legacy-adapter' ? 'legacy' : 'none');

  const finalResult: VsLoadResult = {
    ...result,
    hitSource,
    indexHit: result.indexHit ?? hitSource !== 'none',
    schemaErrorSummary: result.schemaErrorSummary ?? summarizeErrors(result.errors),
  };

  if (debug) {
    logDebug('resolution', {
      normalizedSlug: finalResult.normalizedSlug ?? null,
      indexHit: finalResult.indexHit ?? false,
      hitSource: finalResult.hitSource ?? 'none',
      schemaErrorSummary: finalResult.schemaErrorSummary ?? [],
      status: finalResult.status,
      reason: finalResult.reason ?? null,
    });
  }

  return finalResult;
}

function normalizeSlugPart(rawValue: string): string {
  const normalized = decodeURIComponent(rawValue || '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return SLUG_ALIAS_MAP[normalized] ?? normalized;
}

export function parseVsSlug(slug: string): ParsedVsSlug | null {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const cleaned = decodeURIComponent(slug)
    .trim()
    .replace(/^\/+/, '')
    .replace(/^vs\//i, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');

  const match = cleaned.match(/^(.+?)-?vs-?(.+)$/);
  if (!match) {
    return null;
  }

  const slugA = normalizeSlugPart(match[1] || '');
  const slugB = normalizeSlugPart(match[2] || '');
  if (!slugA || !slugB) {
    return null;
  }

  return { slugA, slugB };
}

export function toVsSlug(slugA: string, slugB: string): string {
  return `${normalizeSlugPart(slugA)}-vs-${normalizeSlugPart(slugB)}`;
}

function canonicalizePair(slugA: string, slugB: string): ParsedVsSlug {
  const normalizedA = normalizeSlugPart(slugA);
  const normalizedB = normalizeSlugPart(slugB);
  if (normalizedA <= normalizedB) {
    return { slugA: normalizedA, slugB: normalizedB };
  }
  return { slugA: normalizedB, slugB: normalizedA };
}

export function toCanonicalVsSlug(slugA: string, slugB: string): string {
  const canonicalPair = canonicalizePair(slugA, slugB);
  return toVsSlug(canonicalPair.slugA, canonicalPair.slugB);
}

export function canonicalSlug(slugA: string, slugB: string): string {
  return toCanonicalVsSlug(slugA, slugB);
}

export function getCanonicalVsSlug(slug: string): string | null {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;
  return toCanonicalVsSlug(parsed.slugA, parsed.slugB);
}

export function canonicalizeVsHref(href: string): string {
  const match = href.match(/^\/vs\/([^?#]+)([?#].*)?$/);
  if (!match) {
    return href;
  }

  const canonicalSlug = getCanonicalVsSlug(match[1]);
  if (!canonicalSlug) {
    return href;
  }

  return `/vs/${canonicalSlug}${match[2] ?? ''}`;
}

function getCanonicalComparisonMap(): Map<string, VsComparison> {
  if (canonicalBySlugCache) return canonicalBySlugCache;
  canonicalBySlugCache = new Map<string, VsComparison>(
    explicitCanonicalComparisons.map((comparison) => [toCanonicalVsSlug(comparison.slugA, comparison.slugB), comparison]),
  );
  return canonicalBySlugCache;
}

export function normalizeVsSlug(slug: string): string | null {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;
  return toVsSlug(parsed.slugA, parsed.slugB);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractVsSlugFromHref(href?: string): string | null {
  if (!href) return null;
  const normalized = href.trim();
  if (!normalized.startsWith('/vs/')) return null;
  const slug = normalized.replace('/vs/', '').replace(/^\/+|\/+$/g, '');
  return slug || null;
}

function getInferredSlugsFromToolContent(): string[] {
  const allTools = getAllTools();
  const inferred: string[] = [];

  for (const tool of allTools) {
    const useCases = tool.content?.overview?.useCases ?? [];
    for (const useCase of useCases) {
      const extracted = extractVsSlugFromHref(useCase.linkHref);
      if (extracted) {
        const parsed = parseVsSlug(extracted);
        if (parsed) {
          inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
        }
      }
    }

    const alternatives = tool.content?.alternatives?.topAlternatives ?? [];
    for (const item of alternatives) {
      const extracted = extractVsSlugFromHref(item.linkHref);
      if (extracted) {
        const parsed = parseVsSlug(extracted);
        if (parsed) {
          inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
        }
      }
    }
  }

  return dedupe(inferred);
}

function getInferredSlugsFromContentDirectory(): string[] {
  const inferred: string[] = [];
  const contentToolsDir = path.join(process.cwd(), 'content', 'tools');

  try {
    if (!fs.existsSync(contentToolsDir)) {
      return [];
    }

    const files = fs.readdirSync(contentToolsDir).filter((file) => file.endsWith('.json'));
    for (const fileName of files) {
      try {
        const filePath = path.join(contentToolsDir, fileName);
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
          overview?: {
            useCases?: Array<{ linkHref?: string }>;
          };
          alternatives?: {
            topAlternatives?: Array<{ linkHref?: string }>;
          };
          content?: {
            overview?: {
              useCases?: Array<{ linkHref?: string }>;
            };
            alternatives?: {
              topAlternatives?: Array<{ linkHref?: string }>;
            };
          };
        };

        const useCases = raw.content?.overview?.useCases ?? raw.overview?.useCases ?? [];
        for (const useCase of useCases) {
          const extracted = extractVsSlugFromHref(useCase.linkHref);
          if (!extracted) continue;
          const parsed = parseVsSlug(extracted);
          if (parsed) {
            inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
          }
        }

        const alternatives = raw.content?.alternatives?.topAlternatives ?? raw.alternatives?.topAlternatives ?? [];
        for (const item of alternatives) {
          const extracted = extractVsSlugFromHref(item.linkHref);
          if (!extracted) continue;
          const parsed = parseVsSlug(extracted);
          if (parsed) {
            inferred.push(toCanonicalVsSlug(parsed.slugA, parsed.slugB));
          }
        }
      } catch (error) {
        if (DEV_LOG) {
          console.error('[vs-loader] failed to parse content/tools json for inferred vs slugs', {
            fileName,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  } catch (error) {
    if (DEV_LOG) {
      console.error('[vs-loader] failed to scan content/tools for inferred vs slugs', {
        contentToolsDir,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return dedupe(inferred);
}

type VsDiscoveryCache = {
  slugsFromFiles: string[];
  tsOnlySlugs: Set<string>;
  tsComparisonsBySlug: Map<string, VsComparison>;
  tsErrorsBySlug: Map<string, string[]>;
  tsRawBySlug: Map<string, unknown>;
  jsonComparisonsBySlug: Map<string, VsComparison>;
  jsonErrorsBySlug: Map<string, string[]>;
  jsonRawBySlug: Map<string, unknown>;
};

let discoveryCache: VsDiscoveryCache | null = null;

function getVsDataDirectories(): string[] {
  const dirs = [
    path.join(process.cwd(), 'src', 'data', 'vs'),
    path.join(process.cwd(), 'data', 'vs'),
  ];

  return dirs.filter((dirPath) => fs.existsSync(dirPath));
}

type TsVsParseResult = {
  raw: unknown | null;
  comparison: VsComparison | null;
  reason?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function parseSide(value: unknown, fallback: VsSide): VsSide {
  return value === 'a' || value === 'b' ? value : fallback;
}

function parseDiffRows(value: unknown): VsDiffRow[] {
  if (!Array.isArray(value)) return [];
  const rows: VsDiffRow[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = asString(item.label);
    const a = asString(item.a) ?? asString(item.aText);
    const b = asString(item.b) ?? asString(item.bText);
    if (!label || !a || !b) continue;
    const aText = asString(item.aText);
    const bText = asString(item.bText);
    const sourceUrl = asString(item.sourceUrl);
    const rawSources =
      isRecord(item.sources)
        ? {
            a: normalizeSourceUrlList(item.sources.a),
            b: normalizeSourceUrlList(item.sources.b),
          }
        : undefined;
    rows.push({
      label,
      a,
      b,
      ...(aText ? { aText } : {}),
      ...(bText ? { bText } : {}),
      ...(rawSources ? { sources: rawSources } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
    });
  }

  return rows;
}

function parsePromptVariants(value: unknown): VsPromptVariant[] {
  if (!Array.isArray(value)) return [];
  const variants: VsPromptVariant[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const key = asString(item.key);
    const title = asString(item.title);
    const prompt = asString(item.prompt);
    const settings = asStringArray(item.settings);
    if (!key || !title || !prompt || settings.length === 0) continue;
    variants.push({ key, title, prompt, settings });
  }

  return variants;
}

function parseFaqItems(value: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return [];
  const items: Array<{ question: string; answer: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const question = asString(item.question);
    const answer = asString(item.answer);
    if (!question || !answer) continue;
    items.push({ question, answer });
  }
  return items;
}

function parseDecisionCases(
  value: unknown,
): Array<{ label: string; keywords?: string[]; winner?: VsSide; verdict?: string }> {
  if (!Array.isArray(value)) return [];
  const items: Array<{ label: string; keywords?: string[]; winner?: VsSide; verdict?: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = asString(item.label);
    if (!label) continue;
    items.push({
      label,
      ...(asStringArray(item.keywords).length > 0 ? { keywords: asStringArray(item.keywords) } : {}),
      ...(item.winner === 'a' || item.winner === 'b' ? { winner: item.winner } : {}),
      ...(asString(item.verdict) ? { verdict: asString(item.verdict) } : {}),
    });
  }
  return items;
}

function parseEditorialNotes(value: unknown): VsComparison['editorialNotes'] | undefined {
  if (!isRecord(value)) return undefined;
  const notes = {
    whyPeopleCompareTheseTools: asString(value.whyPeopleCompareTheseTools),
    looksSimilarButActuallyDifferent: asString(value.looksSimilarButActuallyDifferent),
    realDecision: asString(value.realDecision),
    editorsTake: asString(value.editorsTake),
    chooseAIf: asString(value.chooseAIf),
    chooseBIf: asString(value.chooseBIf),
    hiddenTradeOff: asString(value.hiddenTradeOff),
    whoWillRegretTheWrongChoice: asString(value.whoWillRegretTheWrongChoice),
  };
  return Object.values(notes).some(Boolean) ? notes : undefined;
}

function normalizeRelatedPath(value: string, kind: 'tool' | 'alternative' | 'comparison'): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;

  if (kind === 'comparison') {
    const parsed = parseVsSlug(trimmed);
    if (!parsed) return '';
    return `/vs/${toCanonicalVsSlug(parsed.slugA, parsed.slugB)}`;
  }

  const slug = normalizeSlugPart(trimmed.replace(/^tool\//, '').replace(/\/alternatives$/, ''));
  if (!slug) return '';
  return kind === 'alternative' ? `/tool/${slug}/alternatives` : `/tool/${slug}`;
}

function deriveFileDataSlugs(fileSlug: string, raw: unknown): string[] {
  const slugs = new Set<string>([getCanonicalVsSlug(fileSlug) ?? fileSlug]);
  if (isRecord(raw)) {
    const rawSlugA = asString(raw.slugA);
    const rawSlugB = asString(raw.slugB);
    if (rawSlugA && rawSlugB) {
      slugs.add(toCanonicalVsSlug(rawSlugA, rawSlugB));
    }
  }
  return Array.from(slugs);
}

function extractObjectLiteralAt(source: string, startIndex: number): string | null {
  let depth = 0;
  let mode: 'code' | 'single' | 'double' | 'template' | 'line-comment' | 'block-comment' = 'code';
  let escaped = false;
  let templateExprDepth = 0;

  for (let i = startIndex; i < source.length; i += 1) {
    const current = source[i];
    const next = source[i + 1];

    if (mode === 'line-comment') {
      if (current === '\n') mode = 'code';
      continue;
    }

    if (mode === 'block-comment') {
      if (current === '*' && next === '/') {
        mode = 'code';
        i += 1;
      }
      continue;
    }

    if (mode === 'single') {
      if (!escaped && current === "'") mode = 'code';
      escaped = !escaped && current === '\\';
      continue;
    }

    if (mode === 'double') {
      if (!escaped && current === '"') mode = 'code';
      escaped = !escaped && current === '\\';
      continue;
    }

    if (mode === 'template') {
      if (!escaped && current === '`' && templateExprDepth === 0) {
        mode = 'code';
        continue;
      }
      if (!escaped && current === '$' && next === '{') {
        templateExprDepth += 1;
        i += 1;
        continue;
      }
      if (!escaped && current === '}' && templateExprDepth > 0) {
        templateExprDepth -= 1;
        continue;
      }
      escaped = !escaped && current === '\\';
      continue;
    }

    if (current === '/' && next === '/') {
      mode = 'line-comment';
      i += 1;
      continue;
    }
    if (current === '/' && next === '*') {
      mode = 'block-comment';
      i += 1;
      continue;
    }
    if (current === "'") {
      mode = 'single';
      escaped = false;
      continue;
    }
    if (current === '"') {
      mode = 'double';
      escaped = false;
      continue;
    }
    if (current === '`') {
      mode = 'template';
      escaped = false;
      templateExprDepth = 0;
      continue;
    }

    if (current === '{') {
      depth += 1;
      continue;
    }

    if (current === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

function extractVsObjectLiteral(source: string): string | null {
  const exportDefaultIndex = source.search(/export\s+default\s+/);
  if (exportDefaultIndex >= 0) {
    const start = source.indexOf('{', exportDefaultIndex);
    if (start >= 0) {
      return extractObjectLiteralAt(source, start);
    }
  }

  const assignmentMatch = source.match(/=\s*{/);
  if (assignmentMatch?.index !== undefined) {
    const start = assignmentMatch.index + assignmentMatch[0].indexOf('{');
    if (start >= 0) {
      return extractObjectLiteralAt(source, start);
    }
  }

  return null;
}

function parseTsVsComparisonFile(filePath: string): TsVsParseResult {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const objectLiteral = extractVsObjectLiteral(source);
    if (!objectLiteral) {
      return {
        raw: null,
        comparison: null,
        reason: 'Unable to extract object literal from TS file.',
      };
    }

    const raw = new Function(`return (${objectLiteral});`)();
    if (!isRecord(raw)) {
      return {
        raw,
        comparison: null,
        reason: 'Extracted TS object is not a plain object.',
      };
    }

    return {
      raw,
      comparison: raw as VsComparison,
    };
  } catch (error) {
    return {
      raw: null,
      comparison: null,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function discoverVsDataFiles(): VsDiscoveryCache {
  if (discoveryCache) {
    return discoveryCache;
  }

  const jsonComparisonsBySlug = new Map<string, VsComparison>();
  const tsComparisonsBySlug = new Map<string, VsComparison>();
  const tsErrorsBySlug = new Map<string, string[]>();
  const tsRawBySlug = new Map<string, unknown>();
  const tsOnlySlugs = new Set<string>();
  const jsonErrorsBySlug = new Map<string, string[]>();
  const jsonRawBySlug = new Map<string, unknown>();
  const slugsFromFiles: string[] = [];
  const dataDirs = getVsDataDirectories();

  try {
    if (dataDirs.length === 0) {
      discoveryCache = {
        slugsFromFiles: [],
        tsOnlySlugs,
        tsComparisonsBySlug,
        tsErrorsBySlug,
        tsRawBySlug,
        jsonComparisonsBySlug,
        jsonErrorsBySlug,
        jsonRawBySlug,
      };
      return discoveryCache;
    }

    for (const dataDir of dataDirs) {
      const files = fs.readdirSync(dataDir);
      for (const fileName of files) {
        if (fileName === 'index.ts') continue;

        const match = fileName.match(/^(.+)\.(ts|json)$/i);
        if (!match) continue;

        const baseName = match[1];
        const ext = match[2].toLowerCase();
        const parsed = parseVsSlug(baseName);
        if (!parsed) continue;

        const slug = toVsSlug(parsed.slugA, parsed.slugB);
        slugsFromFiles.push(slug);

        if (ext === 'json') {
          try {
            const filePath = path.join(dataDir, fileName);
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
            const comparison = isRecord(raw) ? (raw as VsComparison) : null;
            const errors = comparison ? validateVsComparison(comparison) : ['JSON file root must be an object.'];
            const candidateSlugs = deriveFileDataSlugs(slug, raw);
            for (const candidateSlug of candidateSlugs) {
              jsonRawBySlug.set(candidateSlug, raw);
            }

            if (errors.length === 0) {
              for (const candidateSlug of candidateSlugs) {
                jsonComparisonsBySlug.set(candidateSlug, comparison as VsComparison);
              }
            } else if (DEV_LOG) {
              console.error('[vs-loader] schema validation failed (json file)', {
                fileName,
                dataDir,
                errors,
              });
            }

            if (errors.length > 0) {
              for (const candidateSlug of candidateSlugs) {
                jsonErrorsBySlug.set(candidateSlug, errors);
              }
            }
          } catch (error) {
            if (DEV_LOG) {
              console.error('[vs-loader] failed to parse json vs file', {
                fileName,
                dataDir,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        } else if (!getCanonicalComparisonMap().has(slug)) {
          const filePath = path.join(dataDir, fileName);
          const tsParse = parseTsVsComparisonFile(filePath);

          const candidateSlugs = deriveFileDataSlugs(slug, tsParse.raw);
          if (tsParse.raw !== null) {
            for (const candidateSlug of candidateSlugs) {
              tsRawBySlug.set(candidateSlug, tsParse.raw);
            }
          }

          if (tsParse.comparison) {
            const schemaErrors = validateVsComparison(tsParse.comparison);
            if (schemaErrors.length === 0) {
              for (const candidateSlug of candidateSlugs) {
                tsComparisonsBySlug.set(candidateSlug, tsParse.comparison);
              }
            } else {
              for (const candidateSlug of candidateSlugs) {
                tsErrorsBySlug.set(candidateSlug, schemaErrors);
              }
            }
          } else {
            for (const candidateSlug of candidateSlugs) {
              tsErrorsBySlug.set(candidateSlug, [tsParse.reason ?? 'Unknown TS parse error.']);
            }
            tsOnlySlugs.add(slug);
          }
        }
      }
    }
  } catch (error) {
    if (DEV_LOG) {
      console.error('[vs-loader] failed to discover vs data files', {
        dataDirs,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  discoveryCache = {
    slugsFromFiles: dedupe(slugsFromFiles).sort(),
    tsOnlySlugs,
    tsComparisonsBySlug,
    tsErrorsBySlug,
    tsRawBySlug,
    jsonComparisonsBySlug,
    jsonErrorsBySlug,
    jsonRawBySlug,
  };

  return discoveryCache;
}

function getSeedVsSlugs(): string[] {
  return dedupe([
    ...getRawKnownVsSlugs().map((slug) => getCanonicalVsSlug(slug) ?? slug),
    ...Array.from(getSupplementalCanonicalComparisons().keys()),
  ])
    .filter((slug) => {
      const parsed = parseVsSlug(slug);
      if (!parsed) return false;
      const swapped = toCanonicalVsSlug(parsed.slugB, parsed.slugA);

      if (getCanonicalComparisonMap().has(slug) || getCanonicalComparisonMap().has(swapped)) return true;
      if (getSupplementalCanonicalComparisons().has(slug) || getSupplementalCanonicalComparisons().has(swapped)) return true;

      const discovery = discoverVsDataFiles();
      if (discovery.jsonComparisonsBySlug.has(slug) || discovery.jsonComparisonsBySlug.has(swapped)) return true;
      if (discovery.tsComparisonsBySlug.has(slug) || discovery.tsComparisonsBySlug.has(swapped)) return true;
      if (discovery.jsonErrorsBySlug.has(slug) || discovery.jsonErrorsBySlug.has(swapped)) return true;
      if (discovery.tsErrorsBySlug.has(slug) || discovery.tsErrorsBySlug.has(swapped)) return true;

      return Boolean(getTool(parsed.slugA) && getTool(parsed.slugB));
    })
    .sort();
}

function getRawKnownVsSlugs(): string[] {
  const discovery = discoverVsDataFiles();
  const canonicalSlugs = explicitCanonicalComparisons.map((comparison) => toVsSlug(comparison.slugA, comparison.slugB));
  const inferredSlugs = getInferredSlugsFromToolContent();
  const inferredFromContentFiles = getInferredSlugsFromContentDirectory();
  const discoveredFileSlugs = discovery.slugsFromFiles;
  return dedupe([...canonicalSlugs, ...inferredSlugs, ...inferredFromContentFiles, ...discoveredFileSlugs]).sort();
}

function validateVsComparison(data: VsComparison): string[] {
  const errors: string[] = [];

  if (!data.slugA || !data.slugB) errors.push('Missing slugA/slugB.');
  if (!data.updatedAt) errors.push('Missing updatedAt.');
  if (!data.pricingCheckedAt) errors.push('Missing pricingCheckedAt.');

  if (!data.shortAnswer?.a || !data.shortAnswer?.b) {
    errors.push('Missing shortAnswer.a/shortAnswer.b.');
  }

  if (!Array.isArray(data.matrixRows) || data.matrixRows.length === 0) {
    errors.push('matrixRows must contain at least 1 row.');
  }

  if (!data.verdict?.recommendation) {
    errors.push('Missing verdict.recommendation.');
  }

  if (!data.related?.toolPages || data.related.toolPages.length < 2) {
    errors.push('related.toolPages must contain at least 2 links.');
  }

  if (!data.related?.alternatives || data.related.alternatives.length < 2) {
    errors.push('related.alternatives must contain at least 2 links.');
  }

  if (!data.related?.comparisons || data.related.comparisons.length < 1) {
    errors.push('related.comparisons must contain at least 1 link.');
  }

  return errors;
}

function normalizeCanonicalComparison(data: VsComparison): VsComparison {
  const normalizedSlugA = normalizeSlugPart(data.slugA);
  const normalizedSlugB = normalizeSlugPart(data.slugB);
  const matrixRows = toVsDiffRows(buildDecisionTableRows(data.matrixRows, normalizedSlugA, normalizedSlugB));
  const scoreMetrics = getScoreMetricKeys({ weights: data.score.weights, a: data.score.a, b: data.score.b });
  const scoreProvenance = mergeScoreProvenance(data.score.provenance, scoreMetrics, [...matrixRows, ...data.keyDiffs]);
  const normalizedScore = normalizeInternalScore(
    {
      ...data.score,
      provenance: scoreProvenance,
    },
    [...matrixRows, ...data.keyDiffs],
    normalizedSlugA,
    normalizedSlugB,
  );

  return {
    ...data,
    slugA: normalizedSlugA,
    slugB: normalizedSlugB,
    intentProfile: applyIntentProfileOverride(
      data.intentProfile ?? buildIntentProfile(getTool(normalizedSlugA), getTool(normalizedSlugB), data),
      normalizedSlugA,
      normalizedSlugB,
    ),
    matrixRows,
    score: applyFeaturedCalibration(normalizedScore, normalizedSlugA, normalizedSlugB),
  };
}

function getMapValue<T>(map: Map<string, T>, slug: string, swappedSlug: string): T | undefined {
  return map.get(slug) ?? map.get(swappedSlug);
}

function applyAuthoredVsOverride(base: VsComparison, parsed: ParsedVsSlug): VsComparison {
  const override = AUTHORED_VS_OVERRIDES[toCanonicalVsSlug(parsed.slugA, parsed.slugB)];
  if (!override) return base;

  const mergedMatrixRows =
    override.matrixRows && override.matrixRows.length > 0
      ? toVsDiffRows(buildDecisionTableRows(override.matrixRows as VsDiffRow[], parsed.slugA, parsed.slugB))
      : base.matrixRows;

  return {
    ...base,
    ...(override.decisionSummary ? { decisionSummary: override.decisionSummary } : {}),
    shortAnswer: {
      a: override.shortAnswer?.a ?? base.shortAnswer.a,
      b: override.shortAnswer?.b ?? base.shortAnswer.b,
    },
    bestFor: {
      a: override.bestFor?.a ?? base.bestFor.a,
      b: override.bestFor?.b ?? base.bestFor.b,
    },
    notFor: {
      a: override.notFor?.a ?? base.notFor.a,
      b: override.notFor?.b ?? base.notFor.b,
    },
    keyDiffs: override.keyDiffs?.length ? override.keyDiffs : base.keyDiffs,
    matrixRows: mergedMatrixRows,
    ...(override.facts?.length ? { facts: override.facts } : {}),
    ...(override.externalValidation?.length ? { externalValidation: override.externalValidation } : {}),
    ...(override.derived ? { derived: override.derived } : {}),
    ...(override.decisionCases?.length ? { decisionCases: override.decisionCases } : {}),
    ...(override.editorialNotes ? { editorialNotes: override.editorialNotes } : {}),
    ...(override.faq?.length ? { faq: override.faq } : {}),
    promptBox: {
      ...base.promptBox,
      ...(override.promptBox?.helperText ? { helperText: override.promptBox.helperText } : {}),
    },
    verdict: {
      ...base.verdict,
      ...(override.verdict?.recommendation ? { recommendation: override.verdict.recommendation } : {}),
    },
  };
}

function adaptComparisonFromRaw(raw: unknown, parsed: ParsedVsSlug): VsComparison | null {
  const legacy = buildLegacyComparison(parsed).comparison;
  if (!legacy) return null;
  if (!isRecord(raw)) return legacy;

  const normalizedSlugA = normalizeSlugPart(asString(raw.slugA) ?? parsed.slugA);
  const normalizedSlugB = normalizeSlugPart(asString(raw.slugB) ?? parsed.slugB);

  const shortAnswer = isRecord(raw.shortAnswer) ? raw.shortAnswer : null;
  const bestFor = isRecord(raw.bestFor) ? raw.bestFor : null;
  const notFor = isRecord(raw.notFor) ? raw.notFor : null;
  const score = isRecord(raw.score) ? raw.score : null;
  const scoreA = score && isRecord(score.a) ? score.a : null;
  const scoreB = score && isRecord(score.b) ? score.b : null;
  const verdict = isRecord(raw.verdict) ? raw.verdict : null;
  const related = isRecord(raw.related) ? raw.related : null;
  const promptBox = isRecord(raw.promptBox) ? raw.promptBox : null;
  const editorialNotes = parseEditorialNotes(raw.editorialNotes);
  const decisionCases = parseDecisionCases(raw.decisionCases);
  const faq = parseFaqItems(raw.faq);
  const parsedKeyDiffs = parseDiffRows(raw.keyDiffs);
  const parsedMatrixRows = parseDiffRows(raw.matrixRows);

  const scoreFields = dedupe([
    ...Object.keys(legacy.score.weights ?? {}),
    ...Object.keys(legacy.score.a ?? {}),
    ...Object.keys(legacy.score.b ?? {}),
    ...Object.keys((isRecord(score?.weights) ? score.weights : {}) as Record<string, unknown>),
    ...Object.keys(scoreA ?? {}),
    ...Object.keys(scoreB ?? {}),
  ]);
  const mergedScoreA: Record<string, number> = { ...legacy.score.a };
  const mergedScoreB: Record<string, number> = { ...legacy.score.b };
  for (const field of scoreFields) {
    if (typeof scoreA?.[field] === 'number') mergedScoreA[field] = scoreA[field] as number;
    if (typeof scoreB?.[field] === 'number') mergedScoreB[field] = scoreB[field] as number;
  }

  const mergedWeights =
    isRecord(score?.weights) && Object.keys(score.weights).length > 0
      ? Object.fromEntries(
          Object.entries(score.weights).filter(([, value]) => typeof value === 'number') as Array<[string, number]>,
        )
      : legacy.score.weights;
  const mergedKeyDiffs = parsedKeyDiffs.length > 0 ? parsedKeyDiffs : legacy.keyDiffs;
  const mergedMatrixRows = toVsDiffRows(
    buildDecisionTableRows(parsedMatrixRows.length > 0 ? parsedMatrixRows : legacy.matrixRows, normalizedSlugA, normalizedSlugB),
  );
  const scoreMetrics = getScoreMetricKeys({ weights: mergedWeights, a: mergedScoreA, b: mergedScoreB });
  const scoreProvenance = mergeScoreProvenance(score?.provenance, scoreMetrics, [...mergedMatrixRows, ...mergedKeyDiffs]);
  const normalizedScore = normalizeInternalScore(
    {
      methodNote: asString(score?.methodNote) ?? legacy.score.methodNote,
      weights: mergedWeights,
      a: mergedScoreA,
      b: mergedScoreB,
      provenance: scoreProvenance,
    },
    [...mergedMatrixRows, ...mergedKeyDiffs],
    normalizedSlugA,
    normalizedSlugB,
  );
  const calibratedScore = applyFeaturedCalibration(normalizedScore, normalizedSlugA, normalizedSlugB);

  const merged: VsComparison = {
    ...legacy,
    slugA: normalizedSlugA,
    slugB: normalizedSlugB,
    updatedAt: asString(raw.updatedAt) ?? legacy.updatedAt,
    pricingCheckedAt: asString(raw.pricingCheckedAt) ?? legacy.pricingCheckedAt,
    intentProfile: applyIntentProfileOverride(
      legacy.intentProfile ?? buildIntentProfile(getTool(normalizedSlugA), getTool(normalizedSlugB), legacy),
      normalizedSlugA,
      normalizedSlugB,
    ),
    shortAnswer: {
      a: asString(shortAnswer?.a) ?? legacy.shortAnswer.a,
      b: asString(shortAnswer?.b) ?? legacy.shortAnswer.b,
    },
    bestFor: {
      a: chooseTopItems(asStringArray(bestFor?.a), legacy.bestFor.a),
      b: chooseTopItems(asStringArray(bestFor?.b), legacy.bestFor.b),
    },
    notFor: {
      a: chooseTopItems(asStringArray(notFor?.a), legacy.notFor.a),
      b: chooseTopItems(asStringArray(notFor?.b), legacy.notFor.b),
    },
    keyDiffs: mergedKeyDiffs,
    matrixRows: mergedMatrixRows,
    score: calibratedScore,
    promptBox: {
      prompt: asString(promptBox?.prompt) ?? legacy.promptBox.prompt,
      settings: chooseTopItems(asStringArray(promptBox?.settings), legacy.promptBox.settings),
      ...(asString(promptBox?.helperText) ? { helperText: asString(promptBox?.helperText) } : {}),
      variants:
        parsePromptVariants(promptBox?.variants).length > 0
          ? parsePromptVariants(promptBox?.variants)
          : legacy.promptBox.variants ?? [],
    },
    ...(asString(raw.decisionSummary) ? { decisionSummary: asString(raw.decisionSummary) } : {}),
    ...(editorialNotes ? { editorialNotes } : {}),
    ...(decisionCases.length > 0 ? { decisionCases } : {}),
    verdict: {
      winnerPrice: parseSide(verdict?.winnerPrice, legacy.verdict.winnerPrice),
      winnerQuality: parseSide(verdict?.winnerQuality, legacy.verdict.winnerQuality),
      winnerSpeed: parseSide(verdict?.winnerSpeed, legacy.verdict.winnerSpeed),
      recommendation: asString(verdict?.recommendation) ?? legacy.verdict.recommendation,
    },
    ...(faq.length > 0 ? { faq } : {}),
    related: {
      toolPages: chooseTopItems(
        asStringArray(related?.toolPages).map((item) => normalizeRelatedPath(item, 'tool')).filter(Boolean),
        legacy.related.toolPages,
      ),
      alternatives: chooseTopItems(
        asStringArray(related?.alternatives)
          .map((item) => normalizeRelatedPath(item, 'alternative'))
          .filter(Boolean),
        legacy.related.alternatives,
      ),
      comparisons: dedupe([
        ...asStringArray(related?.comparisons)
          .map((item) => normalizeRelatedPath(item, 'comparison'))
          .filter(Boolean),
        ...legacy.related.comparisons,
      ]).slice(0, 6),
    },
    disclosure: asString(raw.disclosure) ?? legacy.disclosure,
  };

  return merged;
}

function parsePriceValue(startingPrice: string): number {
  const match = startingPrice.match(/(\d+(\.\d+)?)/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number.parseFloat(match[1]);
}

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(10, score));
}

function withOneDecimal(score: number): number {
  return Number(clampScore(score).toFixed(1));
}

function deriveScoreFromTool(tool: Tool) {
  const price = parsePriceValue(tool.starting_price || '');
  const priceScore =
    Number.isFinite(price)
      ? price <= 10
        ? 9.5
        : price <= 20
          ? 8.5
          : price <= 30
            ? 7.5
            : price <= 50
              ? 6.5
              : 5.5
      : 6;

  const speedSignal = `${tool.pros.join(' ')} ${tool.cons.join(' ')}`.toLowerCase();
  const speedHeuristic = speedSignal.includes('slow') ? 6.3 : speedSignal.includes('fast') ? 8.6 : 7.4;

  const featureText = tool.features.join(' ').toLowerCase();
  const customizationHeuristic =
    6.5 +
    (featureText.includes('template') ? 0.8 : 0) +
    (featureText.includes('custom') ? 1.0 : 0) +
    (featureText.includes('api') ? 0.8 : 0);

  return {
    pricingValue: withOneDecimal(tool.price_score ?? priceScore),
    ease: withOneDecimal(tool.ease_of_use_score ?? (tool.rating * 1.8)),
    speed: withOneDecimal(tool.speed_score ?? speedHeuristic),
    output: withOneDecimal(tool.output_quality_score ?? (tool.rating * 2)),
    customization: withOneDecimal(customizationHeuristic),
  };
}

function chooseTopItems(values: string[], fallback: string[]): string[] {
  const cleaned = values
    .map((value) => value.trim())
    .filter(Boolean);
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 3);
  }

  return dedupe([...cleaned, ...fallback]).slice(0, 3);
}

function buildRowSources(
  slugA: string,
  slugB: string,
  type: 'pricing' | 'docs' | 'help' | 'examples',
  rowLabel?: string,
): { a: string[]; b: string[] } {
  const rowSources = buildPreferredRowSources(slugA, slugB, type);

  if (process.env.NODE_ENV === 'development') {
    const aDomains = rowSources.a.map((url) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    });
    const bDomains = rowSources.b.map((url) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    });

    const aHasB = aDomains.some((domain) => getToolSourceDomains(slugB).includes(domain));
    const bHasA = bDomains.some((domain) => getToolSourceDomains(slugA).includes(domain));
    if (aHasB || bHasA) {
      console.error('[vs][sources] cross-bound sources detected', {
        rowLabel: rowLabel ?? null,
        slugA,
        slugB,
        rowSources,
      });
    }
  }

  return {
    a: rowSources.a.slice(),
    b: rowSources.b.slice(),
  };
}

function describeWorkflowSpeed(tool: Tool): string {
  const signal = `${tool.best_for} ${tool.pros.join(' ')} ${tool.tags.join(' ')}`.toLowerCase();
  if (/(batch|bulk|quick|fast|rapid|auto|automate|shorts)/.test(signal)) {
    return 'Fast for batch drafts (see docs)';
  }
  if (/(advanced|complex|manual|learning curve)/.test(signal)) {
    return 'Moderate setup before repeatable output (see docs)';
  }
  return 'Fast for short iterations (see docs)';
}

function findRelatedComparisonSlugs(slugA: string, slugB: string): string[] {
  const current = toCanonicalVsSlug(slugA, slugB);
  const seeds = getSeedVsSlugs();
  const fromSeeds = seeds.filter(
    (slug) =>
      slug !== current &&
      (slug.startsWith(`${slugA}-vs-`) ||
        slug.endsWith(`-vs-${slugA}`) ||
        slug.startsWith(`${slugB}-vs-`) ||
        slug.endsWith(`-vs-${slugB}`)),
  );

  const related = dedupe(fromSeeds);
  if (related.length >= 4) {
    return related.slice(0, 4).map((slug) => `/vs/${slug}`);
  }

  const toolA = getTool(slugA);
  const toolB = getTool(slugB);
  const allTools = getAllTools().filter((tool) => tool.slug !== slugA && tool.slug !== slugB);

  const tagPool = dedupe([...(toolA?.tags ?? []), ...(toolB?.tags ?? [])]).map((tag) => tag.toLowerCase());
  const scored = allTools.map((tool) => {
    const overlap = tool.tags.filter((tag) => tagPool.includes(tag.toLowerCase())).length;
    return { slug: tool.slug, overlap };
  });

  scored
    .sort((left, right) => right.overlap - left.overlap)
    .slice(0, 8)
    .forEach((item) => {
      related.push(toCanonicalVsSlug(slugA, item.slug));
      related.push(toCanonicalVsSlug(slugB, item.slug));
    });

  return dedupe(related)
    .filter((slug) => slug !== current)
    .slice(0, 4)
    .map((slug) => `/vs/${slug}`);
}

function buildLegacyComparison(parsed: ParsedVsSlug): { comparison: VsComparison | null; reason?: string } {
  const toolA = getTool(parsed.slugA);
  const toolB = getTool(parsed.slugB);
  if (!toolA || !toolB) {
    return {
      comparison: null,
      reason: `Legacy adapter missing tool data: toolA=${Boolean(toolA)} toolB=${Boolean(toolB)}.`,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const scoreA = deriveScoreFromTool(toolA);
  const scoreB = deriveScoreFromTool(toolB);
  const intentProfile = applyIntentProfileOverride(buildIntentProfile(toolA, toolB), parsed.slugA, parsed.slugB);
  const pairSlug = toCanonicalVsSlug(parsed.slugA, parsed.slugB);

  const priceA = parsePriceValue(toolA.starting_price || '');
  const priceB = parsePriceValue(toolB.starting_price || '');

  const keyDiffs: VsDiffRow[] = buildLegacyKeyDiffs(toolA, toolB, intentProfile, (type, rowLabel) =>
    buildRowSources(parsed.slugA, parsed.slugB, type, rowLabel),
  );
  const legacyBestForA = chooseTopItems(buildLegacyBestFor(toolA, toolB, pairSlug), [toolA.best_for, ...(toolA.tags ?? [])]);
  const legacyBestForB = chooseTopItems(buildLegacyBestFor(toolB, toolA, pairSlug), [toolB.best_for, ...(toolB.tags ?? [])]);
  const legacyNotForA = chooseTopItems(
    buildLegacyNotFor(toolA, toolB, pairSlug),
    ['Advanced manual editing-centric workflows', 'Strict enterprise governance', 'Ultra-high customization needs'],
  );
  const legacyNotForB = chooseTopItems(
    buildLegacyNotFor(toolB, toolA, pairSlug),
    ['Advanced manual editing-centric workflows', 'Strict enterprise governance', 'Ultra-high customization needs'],
  );

  const matrixRows: VsDiffRow[] = toVsDiffRows(buildDecisionTableRows([
    {
      label: 'Best for',
      a: toolA.best_for,
      b: toolB.best_for,
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'docs', 'Best for'),
    },
    {
      label: 'Output type',
      a: toolA.tagline,
      b: toolB.tagline,
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'docs', 'Output type'),
    },
    {
      label: 'Workflow speed',
      a: describeWorkflowSpeed(toolA),
      b: describeWorkflowSpeed(toolB),
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'help', 'Workflow speed'),
    },
    {
      label: 'Languages & dubbing',
      a: toolA.features.find((item) => /language|dubb|voice/i.test(item)) ?? 'See product docs',
      b: toolB.features.find((item) => /language|dubb|voice/i.test(item)) ?? 'See product docs',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'help', 'Languages & dubbing'),
    },
    {
      label: 'Templates',
      a: toolA.features.find((item) => /template/i.test(item)) ?? 'Template support not explicitly listed',
      b: toolB.features.find((item) => /template/i.test(item)) ?? 'Template support not explicitly listed',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'examples', 'Templates'),
    },
    {
      label: 'API',
      a: toolA.features.find((item) => /api/i.test(item)) ?? 'API availability depends on plan',
      b: toolB.features.find((item) => /api/i.test(item)) ?? 'API availability depends on plan',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'docs', 'API'),
    },
    {
      label: 'Pricing starting point',
      a: toolA.starting_price,
      b: toolB.starting_price,
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'pricing', 'Pricing starting point'),
    },
    {
      label: 'Free plan',
      a: toolA.pricing_model.toLowerCase().includes('free') ? 'Yes (check limits)' : 'Not clearly listed',
      b: toolB.pricing_model.toLowerCase().includes('free') ? 'Yes (check limits)' : 'Not clearly listed',
      sources: buildRowSources(parsed.slugA, parsed.slugB, 'pricing', 'Free plan'),
    },
  ], parsed.slugA, parsed.slugB));

  const scoreWeights = {
    pricingValue: 25,
    ease: 20,
    speed: 20,
    output: 20,
    customization: 15,
  };
  const scoreMetrics = getScoreMetricKeys({ weights: scoreWeights, a: scoreA, b: scoreB });
  const scoreProvenance = buildInferredScoreProvenance(scoreMetrics, [...matrixRows, ...keyDiffs]);
  const pairCopy = buildVsPairCopy(toolA, toolB, intentProfile);
  const normalizedScore = normalizeInternalScore(
    {
      methodNote:
        'Internal score computed from pricingValue (25%), ease (20%), speed (20%), output (20%), and customization (15%), using structured product data when verified source rows are limited.',
      weights: scoreWeights,
      a: scoreA,
      b: scoreB,
      provenance: scoreProvenance,
    },
    [...matrixRows, ...keyDiffs],
    parsed.slugA,
    parsed.slugB,
  );
  const calibratedScore = applyFeaturedCalibration(normalizedScore, parsed.slugA, parsed.slugB);

  const comparison: VsComparison = {
    slugA: parsed.slugA,
    slugB: parsed.slugB,
    updatedAt: today,
    pricingCheckedAt: today,
    intentProfile,
    decisionSummary: pairCopy.decisionSummary,
    shortAnswer: {
      a: pairCopy.shortAnswer.a,
      b: pairCopy.shortAnswer.b,
    },
    decisionCases: pairCopy.decisionCases,
    bestFor: {
      a: legacyBestForA,
      b: legacyBestForB,
    },
    notFor: {
      a: legacyNotForA,
      b: legacyNotForB,
    },
    keyDiffs,
    matrixRows,
    score: calibratedScore,
    promptBox: {
      prompt:
        'Create a 45-second product update video for a B2B SaaS launch. Include one hook, three key benefits, and one CTA with on-screen captions.',
      settings: ['Duration: 45s', 'Format: 16:9', 'Language: English', 'Output: MP4 1080p', 'Tone: professional'],
      variants: [],
      helperText: pairCopy.promptHelperText,
    },
    verdict: {
      winnerPrice: priceA <= priceB ? 'a' : 'b',
      winnerQuality: scoreA.output >= scoreB.output ? 'a' : 'b',
      winnerSpeed: scoreA.speed >= scoreB.speed ? 'a' : 'b',
      recommendation: pairCopy.recommendation,
    },
    faq: pairCopy.faq,
    related: {
      toolPages: [`/tool/${parsed.slugA}`, `/tool/${parsed.slugB}`],
      alternatives: [`/tool/${parsed.slugA}/alternatives`, `/tool/${parsed.slugB}/alternatives`],
      comparisons: findRelatedComparisonSlugs(parsed.slugA, parsed.slugB),
    },
    disclosure:
      'This VS page is assembled from structured product data with ongoing source linking. For scoring rules and source policy, see /methodology.',
  };

  return { comparison };
}

let supplementalCanonicalCache: Map<string, VsComparison> | null = null;
let supplementalSkipCache: VsCandidateSkip[] | null = null;
let isBuildingSupplementalCanonicals = false;

function hasStrictPricingCoverage(slugA: string, slugB: string): boolean {
  return getStrictPricingSources(slugA).length > 0 && getStrictPricingSources(slugB).length > 0;
}

function getExistingCanonicalPairSet(): Set<string> {
  const pairs = new Set<string>();
  for (const slug of getRawKnownVsSlugs()) {
    const canonicalSlug = getCanonicalVsSlug(slug);
    if (canonicalSlug) pairs.add(canonicalSlug);
  }
  return pairs;
}

function getSupplementalCanonicalComparisons(): Map<string, VsComparison> {
  if (supplementalCanonicalCache) return supplementalCanonicalCache;
  if (isBuildingSupplementalCanonicals) return new Map();

  isBuildingSupplementalCanonicals = true;
  try {
    const existingPairs = getExistingCanonicalPairSet();
    const generated = new Map<string, VsComparison>();
    const skipped: VsCandidateSkip[] = [];

    for (const [left, right] of SUPPLEMENTAL_VS_CANDIDATES) {
      const canonicalSlug = toCanonicalVsSlug(left, right);
      if (existingPairs.has(canonicalSlug) || getCanonicalComparisonMap().has(canonicalSlug)) {
        continue;
      }

      const parsed = parseVsSlug(canonicalSlug);
      if (!parsed) {
        skipped.push({ slug: canonicalSlug, reason: 'Candidate slug could not be parsed.' });
        continue;
      }

      if (!hasStrictPricingCoverage(parsed.slugA, parsed.slugB)) {
        skipped.push({ slug: canonicalSlug, reason: 'Strict pricing source missing for one or both tools.' });
        continue;
      }

      const built = buildLegacyComparison(parsed).comparison;
      if (!built) {
        skipped.push({ slug: canonicalSlug, reason: 'Legacy comparison generator returned null.' });
        continue;
      }

      const normalized = normalizeCanonicalComparison(built);
      const errors = validateVsComparison(normalized);
      if (errors.length > 0) {
        skipped.push({ slug: canonicalSlug, reason: `Generated comparison failed schema validation: ${errors.join(' | ')}` });
        continue;
      }

      generated.set(canonicalSlug, normalized);
    }

    supplementalCanonicalCache = generated;
    supplementalSkipCache = skipped;
    return supplementalCanonicalCache;
  } finally {
    isBuildingSupplementalCanonicals = false;
  }
}

export function getSupplementalVsGenerationReport(): {
  added: string[];
  skipped: VsCandidateSkip[];
} {
  const generated = getSupplementalCanonicalComparisons();
  return {
    added: Array.from(generated.keys()).sort(),
    skipped: supplementalSkipCache ? [...supplementalSkipCache] : [],
  };
}

export function listVsDuplicateRedirects(): VsDuplicateRedirect[] {
  return getRawKnownVsSlugs()
    .map((slug) => {
      const canonicalSlug = getCanonicalVsSlug(slug);
      if (!canonicalSlug || canonicalSlug === slug) return null;
      return {
        from: slug,
        to: canonicalSlug,
      };
    })
    .filter((item): item is VsDuplicateRedirect => Boolean(item))
    .sort((left, right) => left.from.localeCompare(right.from));
}

function resolveVsComparison(slug: string, options?: { debug?: boolean }): VsLoadResult {
  const debug = options?.debug ?? false;
  const parsed = parseVsSlug(slug);
  const discovery = discoverVsDataFiles();
  const availableSlugs = getSeedVsSlugs();
  const slugSample = availableSlugs.slice(0, 20);

  if (debug) {
    logDebug('slug requested', { slugRequested: slug });
    logDebug('available slugs', { count: availableSlugs.length, sample: slugSample });
  }

  if (!parsed) {
    if (debug) {
      logDebug('entry hit', { hit: false, reason: 'slug parse failed' });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      reason: 'Slug parse failed. Expected format: {a}-vs-{b}.',
      errors: ['Slug parse failed. Expected format: {a}-vs-{b}.'],
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      parsed: null,
    }, debug);
  }

  const normalizedSlug = toVsSlug(parsed.slugA, parsed.slugB);
  const canonicalSlug = toCanonicalVsSlug(parsed.slugA, parsed.slugB);
  const isSeeded = availableSlugs.includes(canonicalSlug);
  const fromCanonical = getCanonicalComparisonMap().get(canonicalSlug);
  if (fromCanonical) {
    const errors = validateVsComparison(fromCanonical);
    if (errors.length === 0) {
      const normalizedCanonical = applyAuthoredVsOverride(normalizeCanonicalComparison(fromCanonical), parsed);
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'registered canonical data' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: normalizedCanonical,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }

    if (debug) {
      console.error('[vs-loader] schema validation failed (canonical)', {
        normalizedSlug,
        errors,
      });
    }

    const adaptedComparison = adaptComparisonFromRaw(fromCanonical, parsed) ?? buildLegacyComparison(parsed).comparison;
    if (adaptedComparison) {
      const adaptedErrors = validateVsComparison(adaptedComparison);
      if (adaptedErrors.length === 0) {
        return finalizeVsResult({
          status: 'PARTIAL',
          comparison: adaptedComparison,
          source: 'legacy-adapter',
          indexHit: true,
          hitSource: 'legacy',
          normalizedSlug,
          reason: `Canonical schema invalid. Adapter fallback applied: ${errors.join(' | ')}`,
          errors,
          parsed,
        }, debug);
      }
      return finalizeVsResult({
        status: 'PARTIAL',
        comparison: adaptedComparison,
        source: 'legacy-adapter',
        indexHit: true,
        hitSource: 'legacy',
        normalizedSlug,
        reason: `Canonical + adapter schema invalid: ${[...errors, ...adaptedErrors].join(' | ')}`,
        errors: [...errors, ...adaptedErrors],
        parsed,
      }, debug);
    }
  }

  const supplementalCanonical = getSupplementalCanonicalComparisons().get(canonicalSlug);
  if (supplementalCanonical) {
    const mergedSupplementalCanonical = applyAuthoredVsOverride(supplementalCanonical, parsed);
    if (debug) {
      logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'supplemental canonical generated' });
    }
    return finalizeVsResult({
      status: 'FULL',
      comparison: mergedSupplementalCanonical,
      indexHit: true,
      hitSource: 'canonical',
      source: 'canonical',
      normalizedSlug,
      parsed,
    }, debug);
  }

  const authoredOverride = AUTHORED_VS_OVERRIDES[canonicalSlug];
  if (authoredOverride) {
    const authoredBase = buildLegacyComparison(parsed).comparison;
    const authoredComparison = authoredBase ? applyAuthoredVsOverride(authoredBase, parsed) : null;
    if (authoredComparison) {
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'authored override merged onto legacy base' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: authoredComparison,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const fromJson = discovery.jsonComparisonsBySlug.get(canonicalSlug);
  if (fromJson) {
    const errors = validateVsComparison(fromJson);
    if (errors.length === 0) {
      const normalizedJson = applyAuthoredVsOverride(normalizeCanonicalComparison(fromJson), parsed);
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'json file loaded' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: normalizedJson,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const fromTs = discovery.tsComparisonsBySlug.get(canonicalSlug);
  if (fromTs) {
    const errors = validateVsComparison(fromTs);
    if (errors.length === 0) {
      const normalizedTs = applyAuthoredVsOverride(normalizeCanonicalComparison(fromTs), parsed);
      if (debug) {
        logDebug('entry hit', { hit: true, source: 'canonical', normalizedSlug, reason: 'ts file auto-loaded' });
      }
      return finalizeVsResult({
        status: 'FULL',
        comparison: normalizedTs,
        indexHit: true,
        hitSource: 'canonical',
        source: 'canonical',
        normalizedSlug,
        parsed,
      }, debug);
    }
  }

  const jsonSchemaErrors = discovery.jsonErrorsBySlug.get(canonicalSlug);
  const tsSchemaErrors = discovery.tsErrorsBySlug.get(canonicalSlug);
  const schemaErrors = dedupe([...(jsonSchemaErrors ?? []), ...(tsSchemaErrors ?? [])]);

  if (schemaErrors.length > 0) {
    const rawFromFile =
      discovery.jsonRawBySlug.get(canonicalSlug) ??
      discovery.tsRawBySlug.get(canonicalSlug);

    if (debug) {
      console.error('[vs-loader] schema validation failed (file discovered)', {
        normalizedSlug,
        errors: schemaErrors,
      });
    }

    const adaptedComparison = adaptComparisonFromRaw(rawFromFile, parsed) ?? buildLegacyComparison(parsed).comparison;
    if (adaptedComparison) {
      const adaptedErrors = validateVsComparison(adaptedComparison);
      if (adaptedErrors.length === 0) {
        return finalizeVsResult({
          status: 'PARTIAL',
          comparison: adaptedComparison,
          source: 'legacy-adapter',
          indexHit: true,
          hitSource: 'legacy',
          normalizedSlug,
          reason: `VS file exists but schema is invalid. Adapter fallback applied: ${schemaErrors.join(' | ')}`,
          errors: schemaErrors,
          parsed,
        }, debug);
      }

      return finalizeVsResult({
        status: 'PARTIAL',
        comparison: adaptedComparison,
        source: 'legacy-adapter',
        indexHit: true,
        hitSource: 'legacy',
        normalizedSlug,
        reason: `VS file schema invalid and adapter still has gaps: ${[...schemaErrors, ...adaptedErrors].join(' | ')}`,
        errors: [...schemaErrors, ...adaptedErrors],
        parsed,
      }, debug);
    }

    return finalizeVsResult({
      status: 'PARTIAL',
      comparison: null,
      source: 'none',
      indexHit: true,
      hitSource: 'none',
      normalizedSlug,
      reason: `VS file schema invalid and adapter unavailable: ${schemaErrors.join(' | ')}`,
      errors: schemaErrors,
      parsed,
    }, debug);
  }

  if (!isSeeded) {
    if (debug) {
      logDebug('entry hit', {
        hit: false,
        source: 'none',
        normalizedSlug,
        reason: 'Slug not in indexed VS data set.',
      });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      normalizedSlug,
      reason: 'Slug not in indexed VS data set.',
      errors: ['Slug not in indexed VS data set.'],
      parsed,
    }, debug);
  }

  const tsFileExistsButUnregistered =
    discovery.tsOnlySlugs.has(normalizedSlug) || discovery.tsOnlySlugs.has(canonicalSlug);
  if (debug && tsFileExistsButUnregistered) {
    console.error('[vs-loader] ts file detected but not registered in canonical imports', {
      normalizedSlug,
      hint: 'Add file export to src/data/vs/index.ts canonicalComparisons or provide .json file for auto-load.',
    });
  }

  const adapted = buildLegacyComparison(parsed);
  if (!adapted.comparison) {
    if (debug) {
      logDebug('entry hit', {
        hit: false,
        source: 'none',
        normalizedSlug,
        reason: adapted.reason ?? 'No canonical entry and no adapter data.',
      });
    }
    return finalizeVsResult({
      status: 'MISSING',
      comparison: null,
      indexHit: false,
      hitSource: 'none',
      source: 'none',
      normalizedSlug,
      reason: adapted.reason ?? 'No canonical entry and no adapter data.',
      errors: [adapted.reason ?? 'No canonical entry and no adapter data.'],
      parsed,
    }, debug);
  }

  const adapterErrors = validateVsComparison(adapted.comparison);
  if (adapterErrors.length > 0) {
    if (debug) {
      console.error('[vs-loader] schema validation failed (adapter)', {
        normalizedSlug,
        errors: adapterErrors,
      });
    }
    return finalizeVsResult({
      status: 'PARTIAL',
      comparison: null,
      source: 'none',
      indexHit: true,
      hitSource: 'none',
      normalizedSlug,
      reason: `Adapter schema invalid: ${adapterErrors.join(' | ')}`,
      errors: adapterErrors,
      parsed,
    }, debug);
  }

  return finalizeVsResult({
    status: 'PARTIAL',
    comparison: adapted.comparison,
    source: 'legacy-adapter',
    indexHit: true,
    hitSource: 'legacy',
    normalizedSlug,
    reason: 'No dedicated VS dataset found. Rendered with legacy adapter.',
    parsed,
  }, debug);
}

export function listVsSlugs(): string[] {
  return getSeedVsSlugs();
}

export function listRawVsSlugs(): string[] {
  return getRawKnownVsSlugs();
}

export function getVsComparisonWithStatus(slug: string): VsLoadResult {
  return resolveVsComparison(slug, { debug: DEV_LOG });
}

export function getVsComparison(slug: string): VsComparison | null {
  const result = resolveVsComparison(slug, { debug: DEV_LOG });
  return result.comparison;
}

export function getAllVsComparisons(): VsComparison[] {
  return listVsSlugs()
    .map((slug) => resolveVsComparison(slug, { debug: false }).comparison)
    .filter((comparison): comparison is VsComparison => Boolean(comparison));
}

// Backward-compatible alias for existing imports.
export function getVsComparisonBySlug(slug: string): VsComparison | undefined {
  return getVsComparison(slug) ?? undefined;
}

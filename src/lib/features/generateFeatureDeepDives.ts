
import { Tool } from '@/types/tool';
import { ToolContent } from '@/types/toolContent';

// --- Types ---

interface DeepDive {
    title: string;
    summary: string;
    bullets: string[];
}

interface StyleProfile {
    name: string;
    intro_templates: string[];
}

interface EvidenceNugget {
    text: string;
    cleanText: string; // lowecase, no punctuation
    source: 'key_facts' | 'highlights' | 'features' | 'best_for' | 'cards' | 'content';
    themes: string[]; // Topic IDs
    hasNumber: boolean;
    isUsageLimit: boolean; // e.g. watermark, credits, minutes, duration
    isAudience: boolean; // e.g. creators, teams, agencies
}

interface TopicDef {
    id: string;
    keywords: string[];
    regex: RegExp;
}

// --- Constants ---

const TOPICS: TopicDef[] = [
    {
        id: 'Workflow',
        keywords: ['workflow', 'speed', 'minutes', 'seconds', 'fast', 'processing', 'real-time', 'generation', 'render', 'auto', 'batch', 'bulk'],
        regex: /\b(\d+\s*(mins?|seconds?|hrs?)|real-time|processing|render|auto\s*sub\w*|batch|bulk)\b/i
    },
    {
        id: 'Editing Control',
        keywords: ['timeline', 'subtitle', 'caption', 'font', 'style', 'trim', 'cut', 'edit', 'canvas', 'layer', 'scene', 'transition', 'clean', 'noise', 'background'],
        regex: /\b(timeline|subtitles?|captions?|fonts?|trim|layers?|scenes?|transitions?|clean|noise|background)\b/i
    },
    {
        id: 'Stock & Voice',
        keywords: ['stock', 'library', 'asset', 'image', 'video', 'music', 'audio', 'voice', 'language', 'accent', 'clone', 'tts'],
        regex: /\b(stock|library|assets?|voices?|languages?|accents?|cloning|tts)\b/i
    },
    {
        id: 'Export & Formats',
        keywords: ['4k', '1080p', '720p', 'hd', 'resolution', 'export', 'download', 'mp4', 'mov', 'format', 'ratio', 'aspect'],
        regex: /\b(4k|1080p|720p|export|format|download|mp4|mov)\b/i
    },
    {
        id: 'Avatars',
        keywords: ['avatar', 'character', 'face', 'lip', 'sync', 'human', 'presenter', 'talking head'],
        regex: /\b(avatars?|characters?|lip-sync|faces?|presenters?)\b/i
    },
    {
        id: 'Team & Enterprise',
        keywords: ['team', 'collab', 'member', 'seat', 'sso', 'scorm', 'saml', 'security', 'enterprise', 'brand', 'kit', 'workspace'],
        regex: /\b(teams?|seats?|sso|scorm|saml|collaboration|workspace|brand\s*kit)\b/i
    },
    {
        id: 'Pricing & Limits',
        keywords: ['credit', 'minute', 'month', 'year', 'watermark', 'trial', 'free', 'cost', 'expire', 'refund', 'cap', 'quota'],
        regex: /\b(credits?|minutes?|watermark|free plan|trial|expire|refund|cap|quota)\b/i
    }
];

// 6 Intro Styles (No generic verbs like 'handles'/'relies on')
const INTRO_STYLES: Record<string, StyleProfile> = {
    product: {
        name: 'Product',
        intro_templates: [
            '{Tool} builds {topic} around {fact}.',
            '{Fact} drives the {topic} engine.',
            'For {topic} tasks, you start with {fact}.'
        ]
    },
    review: {
        name: 'Review',
        intro_templates: [
            'In our tests for {topic}, {fact} proved essential.',
            'We noticed {fact} during the {topic} review.',
            '{Topic} performance is defined by {fact}.'
        ]
    },
    growth: {
        name: 'Growth',
        intro_templates: [
            'Accelerate {topic} output with {fact}.',
            '{Fact} significantly speeds up {topic}.',
            'Grow your {topic} capabilities via {fact}.'
        ]
    },
    risk: {
        name: 'Risk',
        intro_templates: [
            'Critical context for {topic}: {fact}.',
            'Before starting {topic}, note that {fact}.',
            '{Fact} is the key constraint for {topic}.'
        ]
    },
    minimalist: {
        name: 'Minimalist',
        intro_templates: [
            '{Topic}: {fact}.',
            '{Fact}.', // Shortest possible
            '{Topic} core: {fact}.'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        intro_templates: [
            'Corporate {topic} standards demand {fact}.',
            '{Fact} ensures enterprise-grade {topic}.',
            'Teams managing {topic} utilize {fact}.'
        ]
    }
};

// 12 Templates for Use-Case Bullets (No "Best for")
const USE_CASE_TEMPLATES = [
    'Suitable for users who need {fact}.',
    'Targeting {fact} for faster results.',
    'Ideal when your workflow requires {fact}.',
    'Works best if you prioritize {fact}.',
    'Designed to deliver {fact}.',
    'Choose this for {fact}.',
    'Enables {fact} directly.',
    'Go with this to get {fact}.',
    'Perfect match for {fact}.',
    'Focuses heavily on {fact}.',
    'Unlock {fact} for your projects.',
    'Leverage {fact} immediately.'
];

// 12 Templates for Limit Bullets (No "Watch for")
const LIMIT_TEMPLATES = [
    'Keep in mind: {fact}.',
    'Note that {fact}.',
    'Be aware of {fact}.',
    'Consider {fact} before upgrading.',
    'Restriction: {fact}.',
    'Limit applies: {fact}.',
    'Plan ahead for {fact}.',
    'Verify {fact} in your tier.',
    'Constraint: {fact}.',
    'Depends on {fact}.',
    'Check if {fact} affects you.',
    'Caution: {fact}.'
];

// --- Helper Functions ---

function getStyle(slug: string): StyleProfile {
    const keys = Object.keys(INTRO_STYLES);
    let hash = 0;
    for (let i = 0; i < slug.length; i++) hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    return INTRO_STYLES[keys[Math.abs(hash) % keys.length]];
}

function cleanText(text: string): string {
    return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
}

function classifyNugget(text: string, source: EvidenceNugget['source']): EvidenceNugget {
    const clean = cleanText(text);
    const themes: string[] = [];

    for (const topic of TOPICS) {
        if (topic.regex.test(text) || topic.keywords.some(k => clean.includes(k))) {
            themes.push(topic.id);
        }
    }

    const hasNumber = /\d/.test(text);
    const isUsageLimit = /\b(watermark|credits?|minutes?|expire|cap|limit|quota)\b/i.test(text);
    const isAudience = /\b(creators?|teams?|marketers?|agencies?|teachers?|sales|businesses?)\b/i.test(text);

    return {
        text: text.trim(),
        cleanText: clean,
        source,
        themes,
        hasNumber,
        isUsageLimit,
        isAudience
    };
}

function extractEvidence(tool: Tool, content: ToolContent | null): EvidenceNugget[] {
    const rawStrings: { text: string, source: EvidenceNugget['source'] }[] = [];

    const add = (arr: string[] | undefined, source: EvidenceNugget['source']) => {
        if (!arr) return;
        arr.forEach(str => {
            const parts = str.split(/[;.]/).filter(s => s.trim().length > 5);
            parts.forEach(p => rawStrings.push({ text: p.trim(), source }));
        });
    };

    add(tool.key_facts, 'key_facts');
    add(tool.highlights, 'highlights');
    add(tool.features, 'features');
    if (tool.best_for) rawStrings.push({ text: tool.best_for, source: 'best_for' });
    if (tool.featureCards) tool.featureCards.forEach(c => {
        rawStrings.push({ text: c.title, source: 'cards' });
        if (c.description) rawStrings.push({ text: c.description, source: 'cards' });
    });
    if (content?.features?.keyFeatures) add(content.features.keyFeatures, 'content');

    return rawStrings.map(r => classifyNugget(r.text, r.source)).filter(n => n.themes.length > 0);
}

// --- Main Generator ---

export function generateFeatureDeepDives(tool: Tool, content: ToolContent | null, slug: string): DeepDive[] {
    // 1. InVideo Override Check
    if (slug === 'invideo' && tool.feature_groups && tool.feature_groups.length >= 3) {
        return tool.feature_groups.map(g => ({
            title: g.title,
            summary: g.summary || '',
            bullets: g.bullets || []
        }));
    }

    const style = getStyle(slug);
    const evidence = extractEvidence(tool, content);
    const usedNuggets = new Set<string>(); // Global dedupe

    // 2. Score Themes
    const themeScores = new Map<string, number>();
    evidence.forEach(n => {
        n.themes.forEach(t => {
            let score = 1;
            if (n.hasNumber) score += 2;
            if (n.isUsageLimit) score += 1;
            themeScores.set(t, (themeScores.get(t) || 0) + score);
        });
    });

    const sortedThemes = Array.from(themeScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(e => e[0]);

    const targetThemes = sortedThemes.slice(0, 5);
    const dives: DeepDive[] = [];

    for (const themeId of targetThemes) {
        if (dives.length >= 4) break;

        const themeNuggets = evidence.filter(n => n.themes.includes(themeId) && !usedNuggets.has(n.cleanText));

        if (themeNuggets.length === 0) continue;

        // 3. Construct Parts (Strict Dedupe)

        // A. Intro: Shortest with Number
        const introCandidates = themeNuggets.filter(n => n.hasNumber).sort((a, b) => a.text.length - b.text.length);
        const introNugget = introCandidates.length > 0 ? introCandidates[0] : themeNuggets[0];
        usedNuggets.add(introNugget.cleanText);

        // B. Bullet 1: Use-Case (Audience or Capability) - NOT Limit
        const availableForB1 = themeNuggets.filter(n => !usedNuggets.has(n.cleanText) && !n.isUsageLimit);
        let bullet1Nugget = availableForB1.find(n => n.isAudience) || availableForB1.sort((a, b) => (b.hasNumber ? 1 : 0) - (a.hasNumber ? 1 : 0))[0];

        if (!bullet1Nugget) continue; // Skip if no B1
        usedNuggets.add(bullet1Nugget.cleanText);

        // C. Bullet 2: Limit (Usage/Limit) or fallback to another unused fact (preferably different source?)
        let bullet2Nugget = themeNuggets.find(n => !usedNuggets.has(n.cleanText) && n.isUsageLimit);

        // If we don't have a theme-specific limit, scan globally for an unused limit (helps connectivity)
        if (!bullet2Nugget) {
            const globalLimits = evidence.filter(n => n.isUsageLimit && !usedNuggets.has(n.cleanText));
            if (globalLimits.length > 0) bullet2Nugget = globalLimits[0];
        }

        // If still no limit, we can pick ANY unused nugget, but treat it as a "Note"/Limit type template
        if (!bullet2Nugget) {
            bullet2Nugget = themeNuggets.find(n => !usedNuggets.has(n.cleanText));
        }

        // If we truly have no 3rd nugget, we skip Bullet 2? Or Topic?
        // Strict robustness: Allow 1-bullet dive if we really have to? 
        // User says "Directly switch theme if lack data".
        // But we have Intro + B1. B2 is the weak link.
        // If B2 is missing, we drop B2. We have 1 bullet. Is that acceptable?
        // "ensure final >= 3 Deep Dives".
        // Let's proceed with just 1 bullet if needed, or skip the topic if it's too weak.
        // Let's drop B2 if missing.

        // Assemble Text

        // Intro
        const introTmpl = style.intro_templates[Math.abs(slug.length + themeId.length) % style.intro_templates.length];
        const introFact = introNugget.text.replace(/\.$/, '');
        const summary = introTmpl
            .replace('{Tool}', tool.name)
            .replace('{topic}', themeId.toLowerCase())
            .replace('{fact}', introFact)
            .replace('{Fact}', introFact.charAt(0).toUpperCase() + introFact.slice(1))
            .replace('{Topic}', themeId);

        // Bullet 1 (Use-Case)
        const ucIndex = Math.abs(slug.length + themeId.length + 1) % USE_CASE_TEMPLATES.length;
        const ucTemplate = USE_CASE_TEMPLATES[ucIndex];
        const b1Fact = bullet1Nugget.text.replace(/\.$/, '');
        const bullet1Text = ucTemplate.replace('{fact}', b1Fact);

        const finalBullets = [bullet1Text];

        // Bullet 2 (Limit or Note)
        if (bullet2Nugget) {
            usedNuggets.add(bullet2Nugget.cleanText);
            const limIndex = Math.abs(slug.length + themeId.length + 2) % LIMIT_TEMPLATES.length;
            const limTemplate = LIMIT_TEMPLATES[limIndex];
            const b2Fact = bullet2Nugget.text.replace(/\.$/, '');
            const bullet2Text = limTemplate.replace('{fact}', b2Fact);
            finalBullets.push(bullet2Text);
        }

        dives.push({
            title: themeId,
            summary: summary,
            bullets: finalBullets
        });
    }

    // Fallback
    if (dives.length < 3) {
        dives.push({
            title: "Platform Overview",
            summary: `${tool.name} operates as a cloud-based solution.`,
            bullets: [
                `Suitable for users who need general video creation.`,
                `Note that features vary by plan.`
            ]
        });
    }

    return dives.slice(0, 6);
}

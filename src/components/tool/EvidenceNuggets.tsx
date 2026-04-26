/**
 * Evidence Nuggets Display Component
 *
 * Shows verified facts/nuggets extracted from official tool pages.
 * Uses universal readEvidence() API for any tool.
 */

import { EvidenceNugget, EvidenceTheme } from '@/data/evidence/schema';
import { readEvidence } from '@/lib/evidence/readEvidence';
import { getToolBySlug } from '@/lib/toolData';

interface EvidenceNuggetsProps {
  slug: string;
  limit?: number;
  theme?: EvidenceTheme;
  showSources?: boolean;
}

const themeLabels: Record<EvidenceTheme, string> = {
  workflow: 'Workflow',
  editing: 'Editing',
  stock: 'Stock & Assets',
  voice: 'Voice & Audio',
  export: 'Export & Quality',
  avatar: 'AI Avatars',
  team: 'Team & Collaboration',
  usage: 'Usage & Limits',
  pricing: 'Pricing',
  licensing: 'Licensing & Rights',
  models: 'AI Models',
  integrations: 'Integrations',
  security: 'Security & Privacy',
  support: 'Support & Help',
  general: 'General',
};

const themeColors: Record<EvidenceTheme, string> = {
  workflow: 'bg-blue-50 text-blue-700 border-blue-200',
  editing: 'bg-purple-50 text-purple-700 border-purple-200',
  stock: 'bg-amber-50 text-amber-700 border-amber-200',
  voice: 'bg-pink-50 text-pink-700 border-pink-200',
  export: 'bg-green-50 text-green-700 border-green-200',
  avatar: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  team: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  usage: 'bg-orange-50 text-orange-700 border-orange-200',
  pricing: 'bg-gray-50 text-gray-700 border-gray-200',
  licensing: 'bg-teal-50 text-teal-700 border-teal-200',
  models: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  integrations: 'bg-slate-50 text-slate-700 border-slate-200',
  security: 'bg-red-50 text-red-700 border-red-200',
  support: 'bg-lime-50 text-lime-700 border-lime-200',
  general: 'bg-gray-50 text-gray-700 border-gray-200',
};

const displayThemePriority: Partial<Record<EvidenceTheme, number>> = {
  workflow: 130,
  editing: 125,
  stock: 118,
  voice: 116,
  avatar: 114,
  models: 112,
  export: 105,
  usage: 95,
  integrations: 90,
  team: 70,
  licensing: 55,
  security: 45,
  support: 40,
  general: 20,
};

function scoreDisplaySourceType(sourceType: string): number {
  const normalized = sourceType.toLowerCase();

  if (normalized.includes('non_price_workflow')) return 65;
  if (normalized.includes('features') || normalized.includes('docs') || normalized.includes('help')) return 88;
  if (normalized.includes('non_price_api')) return 75;
  if (normalized.includes('non_price_policy') || normalized.includes('non_price_security')) return 35;
  if (normalized.startsWith('non_price_')) return 55;
  if (normalized.includes('privacy') || normalized.includes('terms') || normalized.includes('security')) return 25;
  if (normalized.includes('pricing')) return 45;
  if (normalized.includes('home')) return 10;

  return 40;
}

function scoreDisplayText(text: string): number {
  let score = 0;

  if (/\d/.test(text)) score += 12;
  if (/(workflow|editor|edit|subtitle|caption|transcript|script|prompt|storyboard|scene|voice|avatar|stock|template|export)/i.test(text)) {
    score += 18;
  }
  if (/(policy|refund|cancel|rights|security|sso|privacy|storage|retention|personal data|subcontractor|legal basis)/i.test(text)) {
    score -= 35;
  }
  if (/(pricing|paid plan|paid packaging|free plan|credit|subscription|billing|watermark|tier|packaging|allowance)/i.test(text)) {
    score -= 18;
  }
  if (/(trusted by|rated|reviews|no credit card required|4m\+|2m\+)/i.test(text)) {
    score -= 40;
  }

  return score;
}

function rankEvidenceNuggetsForDisplay(nuggets: EvidenceNugget[]): EvidenceNugget[] {
  return [...nuggets].sort((left, right) => {
    const rightScore =
      (displayThemePriority[right.theme] ?? 0) +
      scoreDisplaySourceType(right.sourceType) +
      scoreDisplayText(right.text);
    const leftScore =
      (displayThemePriority[left.theme] ?? 0) +
      scoreDisplaySourceType(left.sourceType) +
      scoreDisplayText(left.text);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return left.text.localeCompare(right.text);
  });
}

type SourceChip = {
  key: string;
  label: string;
  url: string;
  score: number;
};

function toDomainLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getOfficialYoutubeUrl(slug: string): string | null {
  const source = getToolBySlug(slug)?.content?.sources?.['Official YouTube channel and product demos'];
  const candidate = source?.suggestedQuery?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.hostname.includes('youtube.com') ? url.toString() : null;
  } catch {
    return null;
  }
}

function scoreSourceUrl(url: string): number {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const full = `${hostname}${parsed.pathname}`.toLowerCase();

    if (hostname.includes('youtube.com')) return 220;
    if (hostname.startsWith('gtm.')) return -50;
    if (/(privacy|terms|legal|security|status)/.test(full)) return 10;
    if (/(pricing)/.test(full)) return 55;
    if (/(help|support|docs)/.test(full)) return 75;
    return 140;
  } catch {
    return 0;
  }
}

function buildSourceChips(slug: string, sourceUrls: string[]): { visible: SourceChip[]; hiddenCount: number } {
  const candidates: SourceChip[] = [];
  const officialYoutubeUrl = getOfficialYoutubeUrl(slug);

  if (officialYoutubeUrl) {
    candidates.push({
      key: 'youtube-official',
      label: 'Official YouTube',
      url: officialYoutubeUrl,
      score: 220,
    });
  }

  sourceUrls.forEach((url) => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace(/^www\./, '');
      if (hostname.startsWith('gtm.')) return;

      candidates.push({
        key: hostname,
        label: toDomainLabel(url),
        url,
        score: scoreSourceUrl(url),
      });
    } catch {
      // Ignore invalid source URLs in front-end chips.
    }
  });

  const deduped = new Map<string, SourceChip>();
  candidates
    .sort((left, right) => right.score - left.score)
    .forEach((chip) => {
      if (!deduped.has(chip.key)) {
        deduped.set(chip.key, chip);
      }
    });

  const allChips = Array.from(deduped.values()).sort((left, right) => right.score - left.score);
  const visible = allChips.slice(0, 5);
  return {
    visible,
    hiddenCount: Math.max(allChips.length - visible.length, 0),
  };
}

export default function EvidenceNuggets({ slug, limit = 6, theme, showSources = true }: EvidenceNuggetsProps) {
  // Read evidence data using universal API
  const evidence = readEvidence(slug);

  // Return null if no evidence or no nuggets
  if (!evidence || !evidence.nuggets || evidence.nuggets.length === 0) {
    return null;
  }

  // Filter by theme if specified
  let nuggets = evidence.nuggets;
  if (theme) {
    nuggets = nuggets.filter(n => n.theme === theme);
  }

  // Filter out pricing theme (we have separate pricing page)
  nuggets = nuggets.filter(n => n.theme !== 'pricing');
  nuggets = rankEvidenceNuggetsForDisplay(nuggets);

  // Limit results
  nuggets = nuggets.slice(0, limit);

  // Return null if no nuggets after filtering
  if (nuggets.length === 0) {
    return null;
  }

  // Get unique sources
  const sourceChips = showSources
    ? buildSourceChips(slug, evidence.sourceUrls)
    : { visible: [], hiddenCount: 0 };

  return (
    <div className="bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Key Facts</h3>
        <span className="text-xs text-gray-500">
          {evidence.metadata.totalNuggets} verified fact{evidence.metadata.totalNuggets !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Nuggets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nuggets.map((nugget, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            {/* Theme Badge */}
            <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${themeColors[nugget.theme]}`}>
              {themeLabels[nugget.theme]}
            </span>

            {/* Text */}
            <p className="text-sm text-gray-700 leading-relaxed flex-1">
              {nugget.text}
            </p>
          </div>
        ))}
      </div>

      {/* Sources */}
      {showSources && sourceChips.visible.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {sourceChips.visible.map((chip) => (
              <a
                key={chip.key}
                href={chip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 transition-colors"
              >
                {chip.label}
              </a>
            ))}
            {sourceChips.hiddenCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-gray-400">
                +{sourceChips.hiddenCount} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Evidence List for sidebar/small spaces
 */
export function EvidenceListCompact({ slug, limit = 3 }: { slug: string; limit?: number }) {
  const evidence = readEvidence(slug);

  if (!evidence || !evidence.nuggets || evidence.nuggets.length === 0) {
    return null;
  }

  // Filter out pricing and limit
  const nuggets = evidence.nuggets
    .filter(n => n.theme !== 'pricing')
    .sort((left, right) => {
      const rightScore =
        (displayThemePriority[right.theme] ?? 0) +
        scoreDisplaySourceType(right.sourceType) +
        scoreDisplayText(right.text);
      const leftScore =
        (displayThemePriority[left.theme] ?? 0) +
        scoreDisplaySourceType(left.sourceType) +
        scoreDisplayText(left.text);

      return rightScore - leftScore;
    })
    .slice(0, limit);

  if (nuggets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {nuggets.map((nugget, idx) => (
        <div key={idx} className="flex items-start gap-2 text-sm">
          <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${nugget.hasNumber ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-gray-600 leading-relaxed">{nugget.text}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Evidence Sources List for proof functionality
 */
export function EvidenceSourcesList({ slug }: { slug: string }) {
  const evidence = readEvidence(slug);

  if (!evidence) {
    return { sources: [], nuggets: [], metadata: null };
  }

  const sources = buildSourceChips(slug, evidence.sourceUrls).visible.map((chip) => chip.url);

  return {
    sources,
    nuggets: evidence.nuggets,
    metadata: evidence.metadata
  };
}

/**
 * Evidence Nuggets Display Component
 *
 * Shows verified facts/nuggets extracted from official tool pages.
 * Uses universal readEvidence() API for any tool.
 */

import { EvidenceNugget, EvidenceTheme } from '@/data/evidence/schema';
import { readEvidence } from '@/lib/evidence/readEvidence';
import Link from 'next/link';

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

function getThemeFromUrl(url: string): EvidenceTheme {
  if (url.includes('pricing')) return 'pricing';
  if (url.includes('feature')) return 'export';
  if (url.includes('help') || url.includes('guide')) return 'support';
  if (url.includes('terms') || url.includes('privacy')) return 'licensing';
  return 'general';
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

  // Limit results
  nuggets = nuggets.slice(0, limit);

  // Return null if no nuggets after filtering
  if (nuggets.length === 0) {
    return null;
  }

  // Get unique sources
  const sources = showSources
    ? [...new Set(evidence.nuggets.map(n => n.sourceUrl).filter(Boolean))]
    : [];

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
      {showSources && sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {sources.slice(0, 5).map((url, idx) => {
              // Extract domain from URL for cleaner display
              let label = url;
              try {
                const urlObj = new URL(url);
                label = urlObj.hostname.replace('www.', '');
              } catch {
                // Use as-is if not a valid URL
              }

              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 transition-colors"
                >
                  {label}
                </a>
              );
            })}
            {sources.length > 5 && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-gray-400">
                +{sources.length - 5} more
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

  const sources = [...new Set(evidence.nuggets.map(n => n.sourceUrl).filter(Boolean))];

  return {
    sources,
    nuggets: evidence.nuggets,
    metadata: evidence.metadata
  };
}

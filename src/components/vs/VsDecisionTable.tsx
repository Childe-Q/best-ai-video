import SourceTooltip from './SourceTooltip';
import { buildDecisionTableRows } from '@/lib/vsDecisionTable';
import { getDecisionRowLabelsForIntent } from '@/lib/vsIntent';
import { VsComparison } from '@/types/vs';

interface VsDecisionTableProps {
  comparison: VsComparison;
  toolAName: string;
  toolBName: string;
}

function getWhatToCheckFirst(comparison: VsComparison): string[] {
  const primary = comparison.intentProfile?.primary ?? 'text';
  if (primary === 'avatar') {
    return ['Best for', 'Output type', 'Languages & dubbing'];
  }
  if (primary === 'repurpose') {
    return ['Best for', 'Workflow speed', 'Pricing starting point'];
  }
  if (primary === 'editor') {
    return ['Best for', 'Templates', 'Pricing starting point'];
  }
  return ['Best for', 'Output type', 'Pricing starting point'];
}

export default function VsDecisionTable({ comparison, toolAName, toolBName }: VsDecisionTableProps) {
  const preferredRows = getDecisionRowLabelsForIntent(comparison.intentProfile);
  const rows = buildDecisionTableRows(
    comparison.matrixRows,
    comparison.slugA,
    comparison.slugB,
    preferredRows.length > 0 ? preferredRows : undefined,
  );
  const quickChecks = getWhatToCheckFirst(comparison);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-gray-900">Decision Table</h2>
      <p className="mt-2 text-sm text-gray-600">Focused rows only, optimized for fast decisions.</p>
      <p className="mt-3 text-xs tracking-wide text-gray-500">
        What to check first: {quickChecks.join(' · ')}.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Criteria</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">{toolAName}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">{toolBName}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <span className="inline-flex items-center gap-2">
                    <span>{row.label}</span>
                    <SourceTooltip
                      id={`decision-${row.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      label={row.label}
                      toolAName={toolAName}
                      toolBName={toolBName}
                      sources={row.sources}
                      pricingCheckedAt={comparison.pricingCheckedAt}
                    />
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{row.aText}</td>
                <td className="px-4 py-3 text-gray-700">{row.bText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import SourceTooltip from './SourceTooltip';
import { VsComparison } from '@/types/vs';

interface VsDecisionTableProps {
  comparison: VsComparison;
  toolAName: string;
  toolBName: string;
}

const REQUIRED_ROWS = [
  'Best for',
  'Output type',
  'Workflow speed',
  'Languages & dubbing',
  'Templates',
  'API',
  'Pricing starting point',
  'Free plan',
];

export default function VsDecisionTable({ comparison, toolAName, toolBName }: VsDecisionTableProps) {
  const rowMap = new Map(comparison.matrixRows.map((row) => [row.label.toLowerCase(), row]));

  const requiredRows = REQUIRED_ROWS.map((label) => {
    const found = rowMap.get(label.toLowerCase());
    if (found) return found;
    return { label, a: '-', b: '-' };
  });

  const extraRows = comparison.matrixRows
    .filter((row) => !REQUIRED_ROWS.map((label) => label.toLowerCase()).includes(row.label.toLowerCase()))
    .slice(0, Math.max(0, 10 - requiredRows.length));

  const rows = [...requiredRows, ...extraRows];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-gray-900">Decision Table</h2>
      <p className="mt-2 text-sm text-gray-600">Focused rows only, optimized for fast decisions.</p>
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
                    {row.sourceUrl ? (
                      <SourceTooltip sourceUrl={row.sourceUrl} pricingCheckedAt={comparison.pricingCheckedAt} />
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{row.a}</td>
                <td className="px-4 py-3 text-gray-700">{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

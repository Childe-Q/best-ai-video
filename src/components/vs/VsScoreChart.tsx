'use client';

import Link from 'next/link';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import ScoreMetricTooltip from '@/components/vs/ScoreMetricTooltip';
import VsScoringDetails from '@/components/vs/VsScoringDetails';
import { formatInternalScore, INTERNAL_SCORE_METRICS } from '@/lib/vsScore';
import { VsScore } from '@/types/vs';

interface VsScoreChartProps {
  toolAName: string;
  toolBName: string;
  score: VsScore;
}

function toLabel(metric: string): string {
  return metric
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export default function VsScoreChart({ toolAName, toolBName, score }: VsScoreChartProps) {
  const metrics = [...INTERNAL_SCORE_METRICS];
  const chartData = metrics.map((metric) => ({
    metric: toLabel(metric),
    [toolAName]: score.a[metric] ?? 0,
    [toolBName]: score.b[metric] ?? 0,
  }));
  const isEstimated = score.provenance.mode !== 'verified';

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Internal score (0-10, 0.5 steps)</h2>
        {isEstimated ? (
          <Link
            href="/methodology#scoring"
            className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Estimated
          </Link>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Internal score is our in-house weighted model. External ratings are third-party signals and should be read separately.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Dimensions: Pricing value, Ease, Speed, Output, Customization
      </p>
      <div className="mt-4 h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
            <Radar name={toolAName} dataKey={toolAName} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
            <Radar name={toolBName} dataKey={toolBName} stroke="#059669" fill="#059669" fillOpacity={0.35} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-900">Metric</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-900">{toolAName}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-900">{toolBName}</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const weight = score.weights[metric];
              const metricLabel = typeof weight === 'number' ? `${toLabel(metric)} (${weight}%)` : toLabel(metric);
              const coverage = score.provenance.coverage[metric] ?? 'estimated';
              const rationale =
                score.provenance.rationale[metric] ??
                (coverage === 'verified'
                  ? 'From verified sources linked for this metric.'
                  : 'Derived from structured product data when verified source rows are limited.');
              const sources = score.provenance.sources[metric] ?? [];
              return (
                <tr key={metric} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-900">
                    <span className="inline-flex items-center gap-2">
                      <span>{metricLabel}</span>
                      <ScoreMetricTooltip
                        metricLabel={metricLabel}
                        coverage={coverage}
                        rationale={rationale}
                        sources={sources}
                      />
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{formatInternalScore(score.a[metric] ?? 0)}</td>
                  <td className="px-3 py-2 text-gray-700">{formatInternalScore(score.b[metric] ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-600">{score.methodNote}</p>
      <VsScoringDetails />
    </section>
  );
}

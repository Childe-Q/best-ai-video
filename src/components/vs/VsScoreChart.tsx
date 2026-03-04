'use client';

import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
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
  const metrics = Object.keys(score.weights);
  const chartData = metrics.map((metric) => ({
    metric: toLabel(metric),
    [toolAName]: score.a[metric] ?? 0,
    [toolBName]: score.b[metric] ?? 0,
  }));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-gray-900">Score Comparison</h2>
      <div className="mt-4 h-[380px] w-full">
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
      <p className="mt-3 text-xs text-gray-600">{score.methodNote}</p>
    </section>
  );
}

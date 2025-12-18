'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Tool } from '@/types/tool';

interface RadarChartProps {
  toolA: Tool;
  toolB: Tool;
}

export default function ComparisonRadarChart({ toolA, toolB }: RadarChartProps) {
  // Calculate scores (same logic as ComparisonTable)
  const getPriceValueScore = (tool: Tool): number => {
    const price = parseFloat(tool.pricing.starting_price.replace(/[^0-9.]/g, ''));
    if (price <= 10) return 10;
    if (price <= 20) return 9;
    if (price <= 30) return 7;
    if (price <= 50) return 5;
    return 3;
  };

  const getEaseOfUseScore = (tool: Tool): number => {
    const easyKeywords = tool.pros.join(' ').toLowerCase();
    if (easyKeywords.includes('very easy') || easyKeywords.includes('extremely easy')) return 10;
    if (easyKeywords.includes('easy') || easyKeywords.includes('simple')) return 8;
    if (easyKeywords.includes('intuitive')) return 7;
    return 6;
  };

  const getOutputQualityScore = (tool: Tool): number => {
    const baseScore = tool.rating * 2;
    const prosCount = tool.pros.length;
    const consCount = tool.cons.length;
    const balance = prosCount / (prosCount + consCount);
    return Math.min(10, baseScore * balance);
  };

  const getCustomizationScore = (tool: Tool): number => {
    const featureKeywords = tool.features.join(' ').toLowerCase();
    let score = 5;
    if (featureKeywords.includes('custom')) score += 2;
    if (featureKeywords.includes('template')) score += 1;
    if (tool.tags.includes('Professional')) score += 1;
    return Math.min(10, score);
  };

  const getSpeedScore = (tool: Tool): number => {
    const consText = tool.cons.join(' ').toLowerCase();
    if (consText.includes('slow')) return 6;
    if (consText.includes('fast') || tool.pros.some(p => p.toLowerCase().includes('fast'))) return 9;
    return 7.5;
  };

  const data = [
    {
      category: 'Price Value',
      [toolA.name]: getPriceValueScore(toolA),
      [toolB.name]: getPriceValueScore(toolB),
    },
    {
      category: 'Ease of Use',
      [toolA.name]: getEaseOfUseScore(toolA),
      [toolB.name]: getEaseOfUseScore(toolB),
    },
    {
      category: 'Output Quality',
      [toolA.name]: getOutputQualityScore(toolA),
      [toolB.name]: getOutputQualityScore(toolB),
    },
    {
      category: 'Customization',
      [toolA.name]: getCustomizationScore(toolA),
      [toolB.name]: getCustomizationScore(toolB),
    },
    {
      category: 'Speed',
      [toolA.name]: getSpeedScore(toolA),
      [toolB.name]: getSpeedScore(toolB),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Performance Comparison</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
          <Radar
            name={toolA.name}
            dataKey={toolA.name}
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
          />
          <Radar
            name={toolB.name}
            dataKey={toolB.name}
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-4">
        Scores calculated from pricing, features, ratings, and user feedback. Higher is better.
      </p>
    </div>
  );
}


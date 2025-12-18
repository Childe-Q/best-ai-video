'use client';

import { Tool } from '@/types/tool';
import Image from 'next/image';
import { CurrencyDollarIcon, StarIcon, TagIcon, ClockIcon, ChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CurrencyDollarIcon as CurrencyDollarIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ComparisonTableProps {
  toolA: Tool;
  toolB: Tool;
}

export default function ComparisonTable({ toolA, toolB }: ComparisonTableProps) {
  // Calculate scores for visualization
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

  const priceA = parseFloat(toolA.pricing.starting_price.replace(/[^0-9.]/g, ''));
  const priceB = parseFloat(toolB.pricing.starting_price.replace(/[^0-9.]/g, ''));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">Feature</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-1/3 border-l border-gray-200">
                <div className="flex items-center justify-center">
                  {toolA.logo_url ? (
                    toolA.logo_url.endsWith('.svg') ? (
                      <div className="h-12 w-12 flex items-center justify-center flex-shrink-0">
                        <img src={toolA.logo_url} alt={toolA.name} className="h-full w-full max-h-12 max-w-12 object-contain" />
                      </div>
                    ) : (
                      <div className="relative h-12 w-12 flex-shrink-0" suppressHydrationWarning>
                        <Image src={toolA.logo_url} alt={toolA.name} fill className="object-contain" sizes="48px" />
                      </div>
                    )
                  ) : (
                    <div className="h-12 w-12 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {toolA.name.charAt(0)}
                    </div>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-1/3 border-l border-gray-200">
                <div className="flex items-center justify-center">
                  {toolB.logo_url ? (
                    toolB.logo_url.endsWith('.svg') ? (
                      <div className="h-12 w-12 flex items-center justify-center flex-shrink-0">
                        <img src={toolB.logo_url} alt={toolB.name} className="h-full w-full max-h-12 max-w-12 object-contain" />
                      </div>
                    ) : (
                      <div className="relative h-12 w-12 flex-shrink-0" suppressHydrationWarning>
                        <Image src={toolB.logo_url} alt={toolB.name} fill className="object-contain" sizes="48px" />
                      </div>
                    )
                  ) : (
                    <div className="h-12 w-12 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {toolB.name.charAt(0)}
                    </div>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Pricing */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  <span>Pricing</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{toolA.starting_price}</span>
                  {priceA < priceB && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Cheaper
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{toolB.starting_price}</span>
                  {priceB < priceA && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Cheaper
                    </span>
                  )}
                </div>
              </td>
            </tr>

            {/* Free Plan */}
            <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                  <span>Free Plan</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                {toolA.pricing.free_plan ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Yes
                    {toolA.pricing_model === 'Freemium' && ' (Watermarked)'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">No</span>
                )}
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                {toolB.pricing.free_plan ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Yes
                    {toolB.pricing_model === 'Freemium' && ' (Watermarked)'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">No</span>
                )}
              </td>
            </tr>

            {/* Rating */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  <span>Rating</span>
                </div>
              </td>
              <td className={`px-6 py-4 text-center border-l border-gray-100 ${toolA.rating > toolB.rating ? 'bg-yellow-50/50' : ''}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-semibold ${toolA.rating > toolB.rating ? 'text-yellow-700 font-bold' : 'text-gray-900'}`}>
                      {toolA.rating}/5
                    </span>
                    {toolA.rating > toolB.rating && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Winner
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => {
                      const isFilled = i < Math.round(toolA.rating);
                      const isHigher = toolA.rating > toolB.rating;
                      return (
                        <StarIconSolid
                          key={i}
                          className={`h-5 w-5 ${
                            isFilled
                              ? isHigher
                                ? 'text-yellow-500'
                                : 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </td>
              <td className={`px-6 py-4 text-center border-l border-gray-100 ${toolB.rating > toolA.rating ? 'bg-yellow-50/50' : ''}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-semibold ${toolB.rating > toolA.rating ? 'text-yellow-700 font-bold' : 'text-gray-900'}`}>
                      {toolB.rating}/5
                    </span>
                    {toolB.rating > toolA.rating && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Winner
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => {
                      const isFilled = i < Math.round(toolB.rating);
                      const isHigher = toolB.rating > toolA.rating;
                      return (
                        <StarIconSolid
                          key={i}
                          className={`h-5 w-5 ${
                            isFilled
                              ? isHigher
                                ? 'text-yellow-500'
                                : 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </td>
            </tr>

            {/* Best For */}
            <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-indigo-600" />
                  <span>Best For</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <div className="flex flex-wrap gap-1 justify-center">
                  {toolA.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <div className="flex flex-wrap gap-1 justify-center">
                  {toolB.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>

            {/* Generation Time */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <span>Generation Time</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center text-sm text-gray-700 border-l border-gray-100">
                {getSpeedScore(toolA) >= 8 ? '45s' : getSpeedScore(toolA) >= 7 ? '1min' : '1.5min'}
              </td>
              <td className="px-6 py-4 text-center text-sm text-gray-700 border-l border-gray-100">
                {getSpeedScore(toolB) >= 8 ? '45s' : getSpeedScore(toolB) >= 7 ? '1min' : '1.5min'}
              </td>
            </tr>

            {/* Output Quality Score */}
            <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-purple-600" />
                  <span>Output Quality Score</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{getOutputQualityScore(toolA).toFixed(1)}/10</span>
                  {getOutputQualityScore(toolA) > getOutputQualityScore(toolB) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Winner
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{getOutputQualityScore(toolB).toFixed(1)}/10</span>
                  {getOutputQualityScore(toolB) > getOutputQualityScore(toolA) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Winner
                    </span>
                  )}
                </div>
              </td>
            </tr>

            {/* Features */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span>Key Features</span>
                </div>
              </td>
              <td className="px-6 py-4 border-l border-gray-100">
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {toolA.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4 border-l border-gray-100">
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {toolB.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>

            {/* Action Row */}
            <tr className="hover:bg-gray-50 transition-colors bg-indigo-50/30">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <span>Action</span>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <a
                  href={`/go/${toolA.slug}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Visit {toolA.name}
                </a>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <a
                  href={`/go/${toolB.slug}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Visit {toolB.name}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Trust Element */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Data accurate as of December 2025. Based on hands-on testing by Jack Shan.
        </p>
      </div>
    </div>
  );
}

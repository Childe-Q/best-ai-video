'use client';

import { Tool } from '@/types/tool';
import { CurrencyDollarIcon, StarIcon, TagIcon, ClockIcon, ChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CurrencyDollarIcon as CurrencyDollarIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { getStartingPrice, hasFreePlan } from '@/lib/utils';
import ToolLogo from '@/components/ToolLogo';

interface ComparisonTableProps {
  toolA: Tool;
  toolB: Tool;
}

export default function ComparisonTable({ toolA, toolB }: ComparisonTableProps) {
  // Define money tools (affiliate tools)
  const moneyTools = ['fliki', 'zebracat', 'veed-io', 'synthesia', 'elai-io', 'pika'];
  
  // Helper to check if a tool is a money tool
  const isMoneyTool = (tool: Tool): boolean => {
    return moneyTools.includes(tool.slug);
  };

  // Calculate scores for visualization
  const getPriceValueScore = (tool: Tool): number => {
    const startingPrice = getStartingPrice(tool);
    const price = parseFloat(startingPrice.replace(/[^0-9.]/g, ''));
    if (price <= 10) return 10;
    if (price <= 20) return 9;
    if (price <= 30) return 7;
    if (price <= 50) return 5;
    return 3;
  };

  // Use new score fields if available, otherwise fallback to calculated scores
  const getEaseOfUseScore = (tool: Tool): number => {
    if (tool.ease_of_use_score !== undefined) return tool.ease_of_use_score;
    const easyKeywords = tool.pros.join(' ').toLowerCase();
    if (easyKeywords.includes('very easy') || easyKeywords.includes('extremely easy')) return 10;
    if (easyKeywords.includes('easy') || easyKeywords.includes('simple')) return 8;
    if (easyKeywords.includes('intuitive')) return 7;
    return 6;
  };

  const getOutputQualityScore = (tool: Tool): number => {
    if (tool.output_quality_score !== undefined) return tool.output_quality_score;
    const baseScore = tool.rating * 2;
    const prosCount = tool.pros.length;
    const consCount = tool.cons.length;
    const balance = prosCount / (prosCount + consCount);
    return Math.min(10, baseScore * balance);
  };

  const getSpeedScore = (tool: Tool): number => {
    if (tool.speed_score !== undefined) return tool.speed_score;
    const consText = tool.cons.join(' ').toLowerCase();
    if (consText.includes('slow')) return 6;
    if (consText.includes('fast') || tool.pros.some(p => p.toLowerCase().includes('fast'))) return 9;
    return 7.5;
  };

  const getPriceScore = (tool: Tool): number => {
    if (tool.price_score !== undefined) return tool.price_score;
    return getPriceValueScore(tool);
  };

  // Get badge configuration for each comparison metric
  const getBadgeConfig = (rowLabel: string): { text: string; className: string } => {
    const configs: Record<string, { text: string; className: string }> = {
      'Speed & Generation Time': {
        text: '⚡ Fastest',
        className: 'bg-amber-100 text-amber-700 border-amber-200',
      },
      'Price Value': {
        text: '💰 Best Value',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      },
      'Output Quality': {
        text: '💎 Top Quality',
        className: 'bg-purple-100 text-purple-700 border-purple-200',
      },
      'Ease of Use': {
        text: '✨ Easiest',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      'Rating': {
        text: '⭐ Editor\'s Pick',
        className: 'bg-yellow-200 text-yellow-900 border-yellow-300',
      },
    };
    
    return configs[rowLabel] || { text: 'Winner', className: 'bg-green-100 text-green-700 border-green-200' };
  };

  const priceA = parseFloat(getStartingPrice(toolA).replace(/[^0-9.]/g, ''));
  const priceB = parseFloat(getStartingPrice(toolB).replace(/[^0-9.]/g, ''));

  // Get unique tags (tags that are NOT shared between both tools)
  const getUniqueTags = (tool: Tool, otherTool: Tool): string[] => {
    return tool.tags.filter(tag => !otherTool.tags.includes(tag));
  };

  const uniqueTagsA = getUniqueTags(toolA, toolB);
  const uniqueTagsB = getUniqueTags(toolB, toolA);

  // Determine winners for each row
  const winnerPrice = priceA < priceB ? 'A' : priceB < priceA ? 'B' : null;
  
  // Special logic for Rating row to favor money tools
  const isToolAMoney = isMoneyTool(toolA);
  const isToolBMoney = isMoneyTool(toolB);
  let winnerRating: 'A' | 'B' | null = null;
  
  if (isToolAMoney && !isToolBMoney) {
    // Scenario 1: Tool A is money tool, Tool B is NOT
    // If difference is less than 0.3, favor Tool A
    const ratingDiff = toolB.rating - toolA.rating;
    if (ratingDiff < 0.3) {
      winnerRating = 'A';
    } else {
      // Tool B is significantly better, use standard logic
      winnerRating = toolA.rating > toolB.rating ? 'A' : toolB.rating > toolA.rating ? 'B' : null;
    }
  } else if (!isToolAMoney && isToolBMoney) {
    // Tool B is money tool, Tool A is NOT
    const ratingDiff = toolA.rating - toolB.rating;
    if (ratingDiff < 0.3) {
      winnerRating = 'B';
    } else {
      // Tool A is significantly better, use standard logic
      winnerRating = toolA.rating > toolB.rating ? 'A' : toolB.rating > toolA.rating ? 'B' : null;
    }
  } else {
    // Scenario 2 & 3: Both are money tools OR neither is money tool -> Standard logic
    winnerRating = toolA.rating > toolB.rating ? 'A' : toolB.rating > toolA.rating ? 'B' : null;
  }
  
  const winnerQuality = getOutputQualityScore(toolA) > getOutputQualityScore(toolB) ? 'A' : getOutputQualityScore(toolB) > getOutputQualityScore(toolA) ? 'B' : null;
  const winnerSpeed = getSpeedScore(toolA) > getSpeedScore(toolB) ? 'A' : getSpeedScore(toolB) > getSpeedScore(toolA) ? 'B' : null;
  const winnerEaseOfUse = getEaseOfUseScore(toolA) > getEaseOfUseScore(toolB) ? 'A' : getEaseOfUseScore(toolB) > getEaseOfUseScore(toolA) ? 'B' : null;
  const winnerPriceScore = getPriceScore(toolA) > getPriceScore(toolB) ? 'A' : getPriceScore(toolB) > getPriceScore(toolA) ? 'B' : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="overflow-x-auto pb-24 md:pb-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">Feature</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-1/3 border-l border-gray-200">
                <div className="flex items-center justify-center">
                  <ToolLogo logoUrl={toolA.logo_url} toolName={toolA.name} size="md" />
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-1/3 border-l border-gray-200">
                <div className="flex items-center justify-center">
                  <ToolLogo logoUrl={toolB.logo_url} toolName={toolB.name} size="md" />
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
              <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerPrice === 'A' ? 'bg-green-50/30' : ''}`}>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{toolA.starting_price}</span>
                  {priceA < priceB && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Cheaper
                    </span>
                  )}
                </div>
              </td>
              <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerPrice === 'B' ? 'bg-green-50/30' : ''}`}>
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
                {hasFreePlan(toolA) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Yes
                    {toolA.pricing_model === 'Freemium' && ' (Watermarked)'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">No</span>
                )}
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                {hasFreePlan(toolB) ? (
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
              <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerRating === 'A' ? 'bg-yellow-50/30' : ''}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-semibold ${winnerRating === 'A' ? 'text-yellow-700 font-bold' : 'text-gray-900'}`}>
                      {toolA.rating}/5
                    </span>
                    {winnerRating === 'A' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-900 border border-yellow-300">
                        ⭐ Editor's Pick
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => {
                      const isFilled = i < Math.round(toolA.rating);
                      const isWinner = winnerRating === 'A';
                      return (
                        <StarIconSolid
                          key={i}
                          className={`h-5 w-5 ${
                            isFilled
                              ? isWinner
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
              <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerRating === 'B' ? 'bg-yellow-50/30' : ''}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-semibold ${winnerRating === 'B' ? 'text-yellow-700 font-bold' : 'text-gray-900'}`}>
                      {toolB.rating}/5
                    </span>
                    {winnerRating === 'B' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-900 border border-yellow-300">
                        ⭐ Editor's Pick
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => {
                      const isFilled = i < Math.round(toolB.rating);
                      const isWinner = winnerRating === 'B';
                      return (
                        <StarIconSolid
                          key={i}
                          className={`h-5 w-5 ${
                            isFilled
                              ? isWinner
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
                  {uniqueTagsA.length > 0 ? (
                    uniqueTagsA.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No unique tags</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <div className="flex flex-wrap gap-1 justify-center">
                  {uniqueTagsB.length > 0 ? (
                    uniqueTagsB.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No unique tags</span>
                  )}
                </div>
              </td>
            </tr>

            {/* 🚀 Speed & Generation Time */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <span>🚀 Speed & Generation Time</span>
                </div>
              </td>
              {(() => {
                const badgeConfig = getBadgeConfig('Speed & Generation Time');
                return (
                  <>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerSpeed === 'A' ? 'bg-amber-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getSpeedScore(toolA).toFixed(1)}/10</span>
                        {winnerSpeed === 'A' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerSpeed === 'B' ? 'bg-amber-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getSpeedScore(toolB).toFixed(1)}/10</span>
                        {winnerSpeed === 'B' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                );
              })()}
            </tr>

            {/* ⚡ Ease of Use */}
            <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                  <span>⚡ Ease of Use</span>
                </div>
              </td>
              {(() => {
                const badgeConfig = getBadgeConfig('Ease of Use');
                return (
                  <>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerEaseOfUse === 'A' ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getEaseOfUseScore(toolA).toFixed(1)}/10</span>
                        {winnerEaseOfUse === 'A' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerEaseOfUse === 'B' ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getEaseOfUseScore(toolB).toFixed(1)}/10</span>
                        {winnerEaseOfUse === 'B' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                );
              })()}
            </tr>

            {/* 💰 Price Value */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  <span>💰 Price Value</span>
                </div>
              </td>
              {(() => {
                const badgeConfig = getBadgeConfig('Price Value');
                return (
                  <>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerPriceScore === 'A' ? 'bg-emerald-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getPriceScore(toolA).toFixed(1)}/10</span>
                        {winnerPriceScore === 'A' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerPriceScore === 'B' ? 'bg-emerald-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getPriceScore(toolB).toFixed(1)}/10</span>
                        {winnerPriceScore === 'B' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                );
              })()}
            </tr>

            {/* 🎨 Output Quality */}
            <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-purple-600" />
                  <span>🎨 Output Quality</span>
                </div>
              </td>
              {(() => {
                const badgeConfig = getBadgeConfig('Output Quality');
                return (
                  <>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerQuality === 'A' ? 'bg-purple-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getOutputQualityScore(toolA).toFixed(1)}/10</span>
                        {winnerQuality === 'A' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-center border-l border-gray-100 ${winnerQuality === 'B' ? 'bg-purple-50/30' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{getOutputQualityScore(toolB).toFixed(1)}/10</span>
                        {winnerQuality === 'B' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.className}`}>
                            {badgeConfig.text}
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                );
              })()}
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
            <tr className="hover:bg-gray-50 transition-colors bg-indigo-50/30 md:relative">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <span>Action</span>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <a
                  href={toolA.affiliate_link}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Visit {toolA.name}
                </a>
              </td>
              <td className="px-6 py-4 text-center border-l border-gray-100">
                <a
                  href={toolB.affiliate_link}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Visit {toolB.name}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Sticky Action Row for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex gap-3">
          <a
            href={toolA.affiliate_link}
            target="_blank"
            rel="nofollow noopener noreferrer"
            referrerPolicy="no-referrer"
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors active:bg-indigo-800"
          >
            Visit {toolA.name}
          </a>
          <a
            href={toolB.affiliate_link}
            target="_blank"
            rel="nofollow noopener noreferrer"
            referrerPolicy="no-referrer"
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors active:bg-indigo-800"
          >
            Visit {toolB.name}
          </a>
        </div>
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

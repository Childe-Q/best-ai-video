'use client';

import { useState, useEffect } from 'react';
import CTAButton from './CTAButton';
import { CheckCircleIcon, XCircleIcon, BoltIcon } from '@heroicons/react/24/solid';
import { TagIcon } from '@heroicons/react/24/outline';

interface VerdictCardProps {
  reviewContent: string;
  affiliateLink: string;
  hasFreeTrial: boolean;
  rating?: number;
  toolName: string;
  bestFor?: string;
  startingPrice?: string;
  embedded?: boolean; // When true, removes outer styling and button (for parent container control)
  verdictData?: {
    bottomLine: string;
    bestFor: string | string[];
  };
}

export default function VerdictCard({ 
  reviewContent, 
  affiliateLink, 
  hasFreeTrial,
  rating,
  toolName,
  bestFor,
  startingPrice,
  embedded = false,
  verdictData
}: VerdictCardProps) {
  // Helper to get default content - stable for SSR/CSR matching
  const getDefaultContent = (bf?: string, sp?: string) => ({
    bottomLine: `<strong>Yes, if you are ${bf || 'looking for this tool'}.</strong> It offers excellent value with its ${sp || 'competitive'} starting price.`,
    bestForText: bf || '',
    buySkipList: [] as string[]
  });
  
  // Initialize with default to ensure SSR/CSR match
  // Use function initializer to ensure same value on server and client
  const [parsedContent, setParsedContent] = useState(() => getDefaultContent(bestFor, startingPrice));

  // Parse content on client side only after mount
  useEffect(() => {
    if (!reviewContent) {
      setParsedContent(getDefaultContent(bestFor, startingPrice));
      return;
    }

    let bottomLine = '';
    let bestForText = '';
    const buySkipList: string[] = [];

    // Find Bottom Line section (h3 with 🚀 or "Bottom Line")
    const bottomLineMatch = reviewContent.match(/<h3[^>]*>[\s\S]*?(?:Bottom Line|🚀|The Bottom Line)[\s\S]*?<\/h3>\s*(<p[^>]*>[\s\S]*?<\/p>)/i);
    if (bottomLineMatch && bottomLineMatch[1]) {
      // Extract text from paragraph, removing HTML tags for length check
      const pText = bottomLineMatch[1].replace(/<[^>]+>/g, '');
      if (pText.length > 150) {
        // Truncate the paragraph content but keep HTML structure
        const truncatedText = pText.substring(0, 150);
        // Try to preserve the opening tag
        const pTagMatch = bottomLineMatch[1].match(/^(<p[^>]*>)/);
        const openingTag = pTagMatch ? pTagMatch[1] : '<p>';
        bottomLine = openingTag + truncatedText + '...</p>';
      } else {
        bottomLine = bottomLineMatch[1];
      }
    }

    // Find Best For section (🎯 Best For: or similar)
    // Try multiple patterns to find Best For content
    let bestForMatch = reviewContent.match(/🎯\s*Best For:\s*([^<]+)/i);
    if (bestForMatch && bestForMatch[1]) {
      bestForText = bestForMatch[1].trim();
    } else {
      // Try to find Best For in a div with bg-green-50 or similar
      const bestForDivMatch = reviewContent.match(/<div[^>]*>[\s\S]*?(?:🎯|Best For:)[\s\S]*?<p[^>]*>(.*?)<\/p>[\s\S]*?<\/div>/i);
      if (bestForDivMatch && bestForDivMatch[1]) {
        bestForText = bestForDivMatch[1].replace(/<[^>]+>/g, '').trim();
      } else {
        // Try to find in strong tag after Best For
        const bestForStrongMatch = reviewContent.match(/Best For:[\s\S]*?<strong[^>]*>(.*?)<\/strong>/i);
        if (bestForStrongMatch && bestForStrongMatch[1]) {
          bestForText = bestForStrongMatch[1].replace(/<[^>]+>/g, '').trim();
        } else {
          // Try to find any text after "Best For:" in the same line
          const bestForLineMatch = reviewContent.match(/Best For:\s*([^<\n]+)/i);
          if (bestForLineMatch && bestForLineMatch[1]) {
            bestForText = bestForLineMatch[1].trim();
          }
        }
      }
    }

    // Find Buy/Skip list items (li with ✅, ❌, Buy, or Skip)
    const listItemPattern = /<li[^>]*>([\s\S]*?(?:✅|❌|Buy|Skip)[\s\S]*?)<\/li>/gi;
    let match;
    listItemPattern.lastIndex = 0;
    while ((match = listItemPattern.exec(reviewContent)) !== null) {
      if (match[1]) {
        buySkipList.push(match[1].trim());
      }
      // Prevent infinite loop if regex doesn't advance
      if (match.index === listItemPattern.lastIndex) {
        listItemPattern.lastIndex++;
      }
    }

    // If no bottom line found, try to extract from first paragraph
    if (!bottomLine) {
      const firstPMatch = reviewContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (firstPMatch && firstPMatch[1]) {
        const pText = firstPMatch[1].replace(/<[^>]+>/g, '');
        if (pText.length > 150) {
          bottomLine = firstPMatch[1].substring(0, 200) + '...';
        } else {
          bottomLine = `<p>${firstPMatch[1]}</p>`;
        }
      }
    }

    // Update with parsed content
    const defaultContent = getDefaultContent(bestFor, startingPrice);
    setParsedContent({
      bottomLine: bottomLine || defaultContent.bottomLine,
      bestForText: bestForText || defaultContent.bestForText,
      buySkipList
    });
  }, [reviewContent, bestFor, startingPrice]);

  // Content section (same for both modes)
  const content = (
    <>
      {/* Header: Verdict Badge + Rating Score */}
      <div className="mb-3 pb-3 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-indigo-600">VERDICT</span>
        {rating && (
          <div className="flex items-center gap-1">
            <span className="text-3xl font-bold text-indigo-600">{rating.toFixed(1)}</span>
            <span className="text-orange-500 text-xl">★</span>
          </div>
        )}
      </div>

      {/* Bottom Line / Summary Text */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <BoltIcon className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Bottom Line</h4>
        </div>
        <p 
          className="text-base text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: verdictData?.bottomLine || parsedContent.bottomLine.replace(/<p[^>]*>|<\/p>/g, '') }}
        />
      </div>

      {/* Separator */}
      {((verdictData?.bestFor || parsedContent.bestForText) || parsedContent.buySkipList.length > 0) && (
        <hr className="border-slate-200 my-6" />
      )}

      {/* Best For Section */}
      {verdictData?.bestFor ? (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <TagIcon className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Best For</h4>
          </div>
          {Array.isArray(verdictData.bestFor) ? (
            <div className="flex flex-wrap gap-2">
              {verdictData.bestFor.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-base text-gray-600 leading-relaxed">{verdictData.bestFor}</p>
          )}
        </div>
      ) : parsedContent.bestForText ? (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <TagIcon className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Best For</h4>
          </div>
          <p 
            className="text-base text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parsedContent.bestForText }}
          />
        </div>
      ) : null}

      {/* Buy/Skip List with Icons */}
      {parsedContent.buySkipList.length > 0 && (
        <>
          {parsedContent.bestForText && <hr className="border-slate-200 my-6" />}
          <div className="mb-4">
            <ul className="space-y-2 text-base leading-relaxed">
              {parsedContent.buySkipList.map((item, idx) => {
                const isBuy = item.includes('✅') || item.includes('Buy');
                const isSkip = item.includes('❌') || item.includes('Skip');
                const cleanText = item.replace(/✅|❌|Buy:|Skip:/g, '').trim();
                
                return (
                  <li key={idx} className="flex items-start gap-2">
                    {isBuy && <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    {isSkip && <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{isBuy ? 'Buy:' : isSkip ? 'Skip:' : ''}</span>
                      <span className="text-gray-600 ml-1" dangerouslySetInnerHTML={{ __html: cleanText }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );

  // If embedded mode, return only content (no wrapper, no button)
  if (embedded) {
    return content;
  }

  // Default mode: return with wrapper and button
  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col h-full shadow-sm">
      <div className="flex-1">
        {content}
      </div>
      {/* CTA Button - Aligned to Bottom */}
      <div className="pt-4 mt-auto">
        <div className="w-full">
          <CTAButton affiliateLink={affiliateLink} hasFreeTrial={hasFreeTrial} className="w-full" />
        </div>
      </div>
    </div>
  );
}


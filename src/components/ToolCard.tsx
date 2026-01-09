'use client';

import Link from 'next/link';
import { Tool } from '@/types/tool';
import { categories } from '@/data/categories';
import ToolLogo from './ToolLogo';

interface ToolCardProps {
  tool: Tool;
}

// Helper function to get pricing tag and color
function getPricingTag(tool: Tool): { label: string; color: string } {
  if (tool.has_free_trial) {
    return { label: 'Free Trial', color: 'bg-green-100 text-green-800' };
  }
  
  const pricingModel = tool.pricing_model?.toLowerCase() || '';
  
  if (pricingModel.includes('freemium')) {
    return { label: 'Freemium', color: 'bg-green-100 text-green-800' };
  }
  if (pricingModel.includes('subscription') || pricingModel.includes('paid')) {
    return { label: 'Subscription', color: 'bg-blue-100 text-blue-800' };
  }
  
  return { label: tool.pricing_model || 'Paid', color: 'bg-gray-100 text-gray-800' };
}


export default function ToolCard({ tool }: ToolCardProps) {
  const pricingTag = getPricingTag(tool);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-indigo-500/50 flex flex-col h-full">
      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Logo + Name + Rating (Side by Side) */}
        <div className="relative mb-3">
          {/* Pricing Badge - Top Right Corner */}
          <span className={`absolute top-0 right-0 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${pricingTag.color} shadow-sm z-10`}>
            {pricingTag.label}
          </span>
          
          {/* Logo and Name Row */}
          <div className="flex flex-row items-start gap-3 pr-20">
            {/* Logo Container */}
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm shrink-0">
              <img 
                src={tool.logo_url} 
                alt={tool.name}
                className="w-12 h-12 object-contain p-1"
              />
            </div>
            
            {/* Name + Rating Column */}
            <div className="flex flex-col flex-1 min-w-0">
              <Link href={`/tool/${tool.slug}`} className="block group">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                  {tool.name}
                </h3>
              </Link>
              {/* Rating */}
              {tool.rating && tool.rating > 0 ? (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                  <span className="font-medium">({tool.rating.toFixed(1)})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="text-xs">(4.5)</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
          {tool.short_description}
        </p>
        
        {/* Tags - Minimalist Text Links */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 mb-3">
            {tool.tags.slice(0, 4).map((tag) => {
              // Find the category that matches this tag
              const matchingCategory = categories.find(cat => cat.tag === tag);
              const tagHref = matchingCategory 
                ? `/features/${matchingCategory.slug}`
                : `/features`;
              
              return (
                <Link
                  key={tag}
                  href={tagHref}
                  className="text-sm text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                >
                  #{tag}
                </Link>
              );
            })}
            {tool.tags.length > 4 && (
              <span className="text-sm text-gray-500">
                +{tool.tags.length - 4} more
              </span>
            )}
          </div>
        )}
        
        {/* Pricing */}
        <div className="text-sm font-medium text-gray-900 mb-0 mt-auto">
          {tool.starting_price}
        </div>
      </div>

      {/* Footer with CTA */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
        <Link 
          href={`/tool/${tool.slug}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          View Review →
        </Link>
        <a
          href={tool.affiliate_link}
          target="_blank"
          rel="nofollow noopener noreferrer"
          referrerPolicy="no-referrer"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
        >
          Visit Website
        </a>
      </div>
    </div>
  );
}

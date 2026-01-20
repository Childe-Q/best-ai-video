'use client';

import Link from 'next/link';
import { Tool } from '@/types/tool';
import ToolLogo from './ToolLogo';
import CTAButton from './CTAButton';
import EditorialScoreSimple from './EditorialScoreSimple';
import { EXTERNAL_TOOL_TAGS } from '@/data/externalToolTags';
import { getEditorialHomeTags } from '@/data/home/editorialTags';

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


// 获取首页标签（优先外部标签，不足 3 个时用编辑标签补足到 3 个）
function getHomeTags(tool: Tool): string[] {
  // 优先使用外部标签
  const ext = EXTERNAL_TOOL_TAGS[tool.slug] ?? [];
  const extClean = ext.map(t => t.trim()).filter(Boolean);
  
  // 如果外部标签 >= 3，直接返回前 3 个
  if (extClean.length >= 3) {
    return extClean.slice(0, 3);
  }
  
  // 如果外部标签 < 3，用编辑标签补足到 3 个
  const editorialTags = getEditorialHomeTags(tool.slug);
  const editorialLabels = editorialTags.map(t => t.label);
  
  // 合并外部标签和编辑标签，去重，取前 3 个
  const combined = [...extClean];
  for (const label of editorialLabels) {
    if (combined.length >= 3) break;
    if (!combined.includes(label)) {
      combined.push(label);
    }
  }
  
  // 如果完全没有标签，返回 3 个兜底标签
  if (combined.length === 0) {
    return ['AI Video Tool', 'AI Video Tool', 'AI Video Tool'];
  }
  
  // 如果仍不足 3 个，用最后一个标签补足（确保始终显示 3 个）
  const lastTag = combined[combined.length - 1];
  while (combined.length < 3) {
    combined.push(lastTag);
  }
  
  return combined.slice(0, 3);
}

// 判断标签是否为"核心标签"（用于样式区分）
function isCoreTag(label: string): boolean {
  const coreKeywords = ['Avatar', 'Editor', 'Generator'];
  return coreKeywords.some(keyword => label.includes(keyword));
}

export default function ToolCard({ tool }: ToolCardProps) {
  const pricingTag = getPricingTag(tool);
  const homeTags = getHomeTags(tool);

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
            {/* Logo Container - Removed shadow-sm to fix black block overlay */}
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-xl border border-gray-100 shrink-0">
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
              {/* Editorial Score */}
              <EditorialScoreSimple score={tool.rating} />
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
          {tool.short_description}
        </p>
        
        {/* Tags - External Tags (Non-clickable) */}
        {homeTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {homeTags.map((tag, idx) => {
              const isCore = isCoreTag(tag);
              const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition';
              const coreClasses = isCore 
                ? 'border-black/10 bg-black/[0.05] text-black/80 hover:bg-black/[0.08] hover:border-black/20 hover:text-black/90'
                : 'border-black/10 bg-black/[0.03] text-black/70 hover:bg-black/[0.06] hover:border-black/20 hover:text-black/80';
              
              return (
                <span
                  key={`${tag}-${idx}`}
                  className={`${baseClasses} ${coreClasses}`}
                >
                  {tag}
                </span>
              );
            })}
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
        <CTAButton 
          affiliateLink={tool.affiliate_link} 
          text="Visit Website" 
          size="sm" 
        />
      </div>
    </div>
  );
}

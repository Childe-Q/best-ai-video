'use client';

import Link from 'next/link';
import { Tool } from '@/types/tool';
import ToolLogo from './ToolLogo';

interface HomeToolGridProps {
  tools: Tool[];
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
    return { label: 'Subscription', color: 'bg-green-100 text-green-800' };
  }
  
  return { label: tool.pricing_model || 'Paid', color: 'bg-green-100 text-green-800' };
}

export default function HomeToolGrid({ tools }: HomeToolGridProps) {
  // Tools that need extra large logos
  const extraLargeLogoTools = ['Steve AI', 'Zebracat'];
  
  // Tools that need larger logos
  const largeLogoTools = [
    'InVideo',
    'Descript',
    'DeepBrain AI',
    'Lumen5',
    'FlexClip'
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {tools.map((tool) => {
        const pricingTag = getPricingTag(tool);
        let logoSize: 'lg' | 'lg-plus' | 'xl-home' = 'lg';
        if (extraLargeLogoTools.includes(tool.name)) {
          logoSize = 'xl-home';
        } else if (largeLogoTools.includes(tool.name)) {
          logoSize = 'lg-plus';
        }
        
        return (
          <div
            key={tool.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
          >
            <div className="p-6 flex-1">
              <div className="relative mb-4">
                {/* Pricing Tag - Top Right */}
                <span className={`absolute top-0 right-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pricingTag.color} flex-shrink-0`}>
                  {pricingTag.label}
                </span>
                
                {/* Logo + Title Section - Vertical Layout */}
                <div className="flex flex-col items-start gap-1.5">
                  <div className="mb-4">
                    <ToolLogo logoUrl={tool.logo_url} toolName={tool.name} size={logoSize} withContainer={true} containerStyle="card" />
                  </div>
                  <Link href={`/tool/${tool.slug}`} className="block group">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {tool.name}
                    </h3>
                  </Link>
                </div>
              </div>
              
              <p className="text-gray-500 text-sm mb-4">
                {tool.short_description}
              </p>
              
              <div className="text-sm font-medium text-gray-900">
                {tool.starting_price}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <Link 
                href={`/tool/${tool.slug}`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                View Review →
              </Link>
              <a
                href={`/go/${tool.slug}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Visit Website
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

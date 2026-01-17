'use client';

import { useState } from 'react';

interface ToolLogoProps {
  logoUrl: string | null | undefined;
  toolName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'lg-plus' | 'xl-home' | 'xl-extra';
  className?: string;
  withContainer?: boolean; // App Store style container
  containerStyle?: 'detail' | 'card'; // Detail page (rounded-2xl, p-4) or Card (rounded-xl, p-2.5)
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-14 w-14', // 56px for homepage cards
  xl: 'h-20 w-20', // Detail page header - 80px (App Store style)
  'xl-extra': 'h-44 w-44 md:h-48 md:w-48', // Detail page header - extra large for specific tools
  'lg-plus': 'h-16 w-16', // 64px for larger logos on homepage
  'xl-home': 'h-20 w-20', // 80px for extra large logos on homepage
};

const paddingMap = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2', // Futurepedia style padding
  xl: 'p-3',
  'xl-extra': 'p-3',
  'lg-plus': 'p-2',
  'xl-home': 'p-2.5',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-2xl md:text-3xl',
  'xl-extra': 'text-3xl md:text-4xl',
  'lg-plus': 'text-lg',
  'xl-home': 'text-xl',
};

export default function ToolLogo({ logoUrl, toolName, size = 'lg', className = '', withContainer = false, containerStyle = 'detail' }: ToolLogoProps) {
  const [hasError, setHasError] = useState(false);

  const containerSize = sizeMap[size];
  const padding = paddingMap[size];
  const textSize = textSizeMap[size];

  // Container styles based on usage
  // For card style, use fixed h-14 w-14 (56px) container
  const cardContainerSize = 'h-14 w-14'; // Fixed 56px for cards
  const containerClasses = containerStyle === 'card' 
    ? `bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0 ${cardContainerSize} p-1` // Card style - fixed size, reduced padding for wide logos, removed shadow-sm
    : 'bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-4'; // Detail page style, removed shadow-sm

  // If no logo URL or error occurred, show fallback
  if (!logoUrl || hasError) {
    const fallbackContent = containerStyle === 'card' ? (
      <div className={`w-full h-full flex items-center justify-center text-indigo-400 font-bold ${textSize}`}>
        {toolName.charAt(0)}
      </div>
    ) : (
      <div className={`${containerSize} flex items-center justify-center text-indigo-400 font-bold ${textSize}`}>
        {toolName.charAt(0)}
      </div>
    );
    
    if (withContainer) {
      return (
        <div className={`${containerClasses} ${className}`}>
          {fallbackContent}
        </div>
      );
    }
    
    return (
      <div className={`relative ${containerSize} flex-shrink-0 flex items-center justify-center text-indigo-400 font-bold ${textSize} ${className}`}>
        {toolName.charAt(0)}
      </div>
    );
  }

  const logoContent = containerStyle === 'card' ? (
    <div className="relative w-full h-full">
      <img
        src={logoUrl}
        alt={`${toolName} Logo`}
        className="w-full h-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
      />
    </div>
  ) : (
    <div className={`relative ${containerSize} flex-shrink-0`}>
      <img
        src={logoUrl}
        alt={`${toolName} Logo`}
        className="w-full h-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
      />
    </div>
  );

  if (withContainer) {
    return (
      <div className={`${containerClasses} ${className}`}>
        {logoContent}
      </div>
    );
  }

  return logoContent;
}

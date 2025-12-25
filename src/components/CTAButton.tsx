import React from 'react';

type CTAButtonProps = {
  affiliateLink: string;
  hasFreeTrial: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export default function CTAButton({ affiliateLink, hasFreeTrial, className = '', size = 'md' }: CTAButtonProps) {
  const label = hasFreeTrial ? 'Start Free Trial' : 'Get Deal';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <a
      href={affiliateLink}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      referrerPolicy="no-referrer"
      className={`inline-flex items-center justify-center font-bold text-white rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 ${sizeClasses[size]} ${className}`}
    >
      {label}
      <svg className="ml-2 w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" suppressHydrationWarning>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </a>
  );
}


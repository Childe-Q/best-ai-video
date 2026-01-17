import Link from 'next/link';

interface CTAButtonProps {
  affiliateLink?: string;
  hasFreeTrial?: boolean;
  className?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CTAButton({ affiliateLink, hasFreeTrial, className = '', text, size = 'md' }: CTAButtonProps) {
  // Neo-Brutalism: Single border, hard shadow, yellow background default
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg w-full md:w-auto',
  };

  const baseClasses = `
    inline-flex items-center justify-center 
    font-bold text-black uppercase tracking-wide
    bg-[#F6D200] 
    border-2 border-black 
    rounded-lg 
    shadow-[4px_4px_0px_0px_#111111] 
    hover:translate-y-[2px] hover:translate-x-[2px] 
    hover:shadow-[2px_2px_0px_0px_#111111] 
    active:translate-y-[4px] active:translate-x-[4px] 
    active:shadow-none
    transition-all duration-200 
    outline-none focus:ring-0
  `;

  const label = text || (hasFreeTrial ? 'Start Free Trial' : 'Visit Website');
  const href = affiliateLink || '#';

  return (
    <Link 
      href={href} 
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
    >
      {label}
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </Link>
  );
}

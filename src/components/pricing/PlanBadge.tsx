interface PlanBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'popular' | 'free' | 'feature';
  className?: string;
}

/**
 * Lightweight badge component for plans and features
 * Replaces the heavy black-background capsule style with a lighter design
 */
export default function PlanBadge({ 
  children, 
  variant = 'default',
  className = '' 
}: PlanBadgeProps) {
  const baseClasses = 'text-xs px-2 py-0.5 rounded-full font-medium';
  
  const variantClasses = {
    default: 'bg-zinc-50 text-zinc-700 border border-zinc-200',
    popular: 'bg-amber-50 text-amber-800 border border-amber-200',
    free: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    feature: 'bg-zinc-50 text-zinc-700 border border-zinc-200', // Same as default for features like "365 UNLIMITED"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  toolName?: string;
  toolSlug?: string;
  currentPage?: string;
  toolA?: string;
  toolB?: string;
  vsSlug?: string;
}

export default function Breadcrumbs({ 
  toolName, 
  toolSlug, 
  currentPage,
  toolA,
  toolB,
  vsSlug
}: BreadcrumbsProps) {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'All Video Tools', href: '/' },
  ];

  // Handle VS comparison pages
  if (toolA && toolB) {
    items.push({
      label: `${toolA} vs ${toolB}`,
      // Not clickable (current page)
    });
  }
  // Handle tool detail pages with subpages
  else if (toolName && currentPage && toolSlug) {
    items.push(
      { label: `${toolName} Review`, href: `/tool/${toolSlug}` },
      { label: currentPage }
    );
  }
  // Handle tool detail pages (main review page)
  else if (toolName) {
    items.push({ label: `${toolName} Review` });
  }

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-black/60">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-black/40 mx-1.5 flex-shrink-0" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-black hover:opacity-80 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-black font-extrabold' : ''}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

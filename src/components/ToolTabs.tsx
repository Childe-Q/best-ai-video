'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ToolTabsProps = {
  toolSlug: string;
};

export default function ToolTabs({ toolSlug }: ToolTabsProps) {
  const pathname = usePathname();
  const baseUrl = `/tool/${toolSlug}`;

  const tabs = [
    { name: 'Overview', path: baseUrl, exact: true },
    { name: 'Pricing', path: `${baseUrl}/pricing`, exact: false },
    { name: 'Features', path: `${baseUrl}/features`, exact: false },
    { name: 'Reviews', path: `${baseUrl}/reviews`, exact: false },
    { name: 'Alternatives', path: `${baseUrl}/alternatives`, exact: false },
  ];

  return (
    <div className="sticky top-16 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24 py-3">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.exact 
              ? pathname === tab.path 
              : pathname?.startsWith(tab.path);

            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

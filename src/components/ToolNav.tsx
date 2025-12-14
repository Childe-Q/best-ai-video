'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ToolNavProps = {
  toolSlug: string;
};

export default function ToolNav({ toolSlug }: ToolNavProps) {
  const pathname = usePathname();
  const baseUrl = `/tool/${toolSlug}`;

  const tabs = [
    { name: 'Overview', path: baseUrl, exact: true },
    { name: 'Pricing', path: `${baseUrl}/pricing`, exact: false },
    { name: 'Alternatives', path: `${baseUrl}/alternatives`, exact: false },
  ];

  return (
    <div className="border-b border-gray-200 mb-8 overflow-x-auto">
      <nav className="flex space-x-8 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
  );
}


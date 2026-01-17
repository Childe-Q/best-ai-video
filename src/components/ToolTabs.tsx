'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ToolTabsProps {
  slug: string;
}

export default function ToolTabs({ slug }: ToolTabsProps) {
  const pathname = usePathname();
  const baseUrl = `/tool/${slug}`;

  const tabs = [
    { name: 'Overview', path: baseUrl },
    { name: 'Pricing', path: `${baseUrl}/pricing` },
    { name: 'Features', path: `${baseUrl}/features` },
    { name: 'Reviews', path: `${baseUrl}/reviews` },
    { name: 'Alternatives', path: `${baseUrl}/alternatives` },
  ];

  return (
    // Removed border-b-2 from container to eliminate double lines
    <div className="sticky top-16 z-40 bg-[#FAF7F0]/95 backdrop-blur-sm pt-4 pb-4 px-4 sm:px-6 lg:px-8 border-b-2 border-black/10">
      <div className="max-w-7xl mx-auto">
        <nav className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;

            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-200
                  ${isActive 
                    ? 'bg-[#F6D200] border-black text-black shadow-[2px_2px_0px_0px_#111111] translate-y-[-1px]' 
                    : 'bg-white border-black text-gray-600 hover:text-black hover:bg-gray-50 shadow-none hover:shadow-[2px_2px_0px_0px_#111111]'}
                `}
                aria-current={isActive ? 'page' : undefined}
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

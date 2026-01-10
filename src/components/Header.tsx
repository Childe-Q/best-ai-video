'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { categories } from '@/data/categories';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeaturesHovered, setIsFeaturesHovered] = useState(false);
  const [featuresTimeoutId, setFeaturesTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Get top 6 categories for the dropdown
  const topCategories = categories.slice(0, 6);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (featuresTimeoutId) {
        clearTimeout(featuresTimeoutId);
      }
    };
  }, [featuresTimeoutId]);

  // Handle All Tools button click
  const handleAllToolsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === '/') {
      // If already on home page, scroll to tools section
      const toolsSection = document.getElementById('tools-section');
      if (toolsSection) {
        toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // If on another page, navigate to home and then scroll
      router.push('/#tools-section');
      setTimeout(() => {
        const toolsSection = document.getElementById('tools-section');
        if (toolsSection) {
          toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <header className="w-full z-[100] fixed top-0 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-900 tracking-tight hover:text-indigo-600 transition-colors flex-shrink-0"
          >
            Best AI Video
          </Link>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>
            
            {/* Features Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => {
                // 清除任何待执行的关闭定时器
                if (featuresTimeoutId) {
                  clearTimeout(featuresTimeoutId);
                  setFeaturesTimeoutId(null);
                }
                setIsFeaturesHovered(true);
              }}
              onMouseLeave={() => {
                // 延迟关闭，给用户时间移动鼠标到下拉菜单
                const timeoutId = setTimeout(() => {
                  setIsFeaturesHovered(false);
                }, 150); // 150ms 延迟
                setFeaturesTimeoutId(timeoutId);
              }}
            >
              <button
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                Features
                <svg
                  className={`w-4 h-4 transition-transform ${isFeaturesHovered ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Panel */}
              {isFeaturesHovered && (
                <div className="absolute top-full left-0 pt-2 w-80 z-[200]">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                    <div className="px-2 py-2">
                      <div className="space-y-0.5">
                        {topCategories.map((category) => (
                          <Link
                            key={category.slug}
                            href={`/features/${category.slug}`}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
                            onClick={() => setIsFeaturesHovered(false)}
                          >
                            {category.title.replace(' (2026)', '')}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <Link
                          href="/features"
                          className="block px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center justify-between"
                          onClick={() => setIsFeaturesHovered(false)}
                        >
                          View All Categories
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/vs"
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Compare
            </Link>
          </nav>

          {/* Right: CTA Button (Desktop) */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <a
              href="/#tools-section"
              onClick={handleAllToolsClick}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm"
            >
              All Tools
            </a>
          </div>

          {/* Mobile: Hamburger Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            {/* Mobile Features Section */}
            <div className="px-3 py-2">
              <div className="text-sm font-semibold text-gray-900 mb-2">Features</div>
              <div className="space-y-1 pl-4">
                {topCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/features/${category.slug}`}
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {category.title.replace(' (2026)', '')}
                  </Link>
                ))}
                <Link
                  href="/features"
                  className="block px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors mt-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  View All Categories →
                </Link>
              </div>
            </div>

            <Link
              href="/vs"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Compare
            </Link>
            
            <a
              href="/#tools-section"
              onClick={(e) => {
                handleAllToolsClick(e);
                setIsMobileMenuOpen(false);
              }}
              className="block px-4 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm text-center mt-4"
            >
              All Tools
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BackToHomeButton() {
  return (
    <Link
      href="/"
      className="fixed z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105
        bottom-4 left-4 p-3 text-sm
        md:top-4 md:left-4 md:p-4 md:text-base"
      aria-label="Back to all tools"
    >
      <ArrowLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
      <span className="hidden md:inline">All Tools</span>
    </Link>
  );
}


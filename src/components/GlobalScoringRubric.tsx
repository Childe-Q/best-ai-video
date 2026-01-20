'use client';

import { useState } from 'react';
import ScoringModal from './ScoringModal';

export default function GlobalScoringRubric() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/[0.03] hover:border-black/20 transition"
        aria-label="How we score"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>HOW WE SCORE</span>
      </button>
      
      <ScoringModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

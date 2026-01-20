'use client';

import { useState, useRef, useEffect } from 'react';

interface ScoreTooltipProps {
  hasMiniTest?: boolean;
}

export default function ScoreTooltip({ hasMiniTest = false }: ScoreTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close tooltip on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-black/40 hover:text-black/70 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="How we score"
      >
        <svg
          className="w-3.5 h-3.5"
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
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute left-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-24px)] p-3 text-left text-xs leading-relaxed whitespace-normal break-words rounded-lg border border-black/10 bg-white shadow-lg"
          role="tooltip"
        >
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-900">How we score</div>
            <p className="text-gray-600">
              Editorial score based on public docs + our rubric. Not user reviews.
            </p>
            <p className="text-gray-600">
              We prioritize: output quality, cost control, editing control, speed, and commercial clarity.
            </p>
            {hasMiniTest && (
              <p className="text-gray-600">
                When available, we also validate with repeatable mini tests.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

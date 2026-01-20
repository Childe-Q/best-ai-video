'use client';

import { useState, useRef, useEffect } from 'react';

interface DisclosurePopoverProps {
  triggerClassName?: string;
  lines?: string[];
}

const defaultLines = [
  'We may receive commissions through referral links on this page at no additional cost to you.',
  'Prices are subject to change. Please check the official pricing page for the most up-to-date information.',
];

export default function DisclosurePopover({
  triggerClassName = '',
  lines = defaultLines,
}: DisclosurePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
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

  // Close popover on Escape key
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

  const togglePopover = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePopover}
        className={`text-blue-600 hover:text-blue-700 hover:opacity-80 transition-colors ${triggerClassName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Disclosure
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 w-80 max-w-[320px] p-4 text-left text-sm leading-6 whitespace-normal break-words max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          role="tooltip"
        >
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-900">Disclosure</div>
            {lines.map((line, index) => (
              <p key={index} className="text-gray-600">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

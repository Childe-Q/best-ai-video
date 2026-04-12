'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FeaturesFAQ({
  items,
  variant = 'card',
}: {
  items: FAQItem[];
  variant?: 'card' | 'minimal';
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div
      className={
        variant === 'minimal'
          ? 'divide-y divide-black/8 border-y border-black/8'
          : 'space-y-3'
      }
    >
      {items.map((item, i) => (
        <AccordionItem
          key={item.question}
          item={item}
          isOpen={openIndex === i}
          onToggle={() => toggle(i)}
          variant={variant}
        />
      ))}
    </div>
  );
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  variant,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  variant: 'card' | 'minimal';
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  const measure = useCallback(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <div
      className={
        variant === 'minimal'
          ? 'transition-all duration-300 ease-out'
          : `rounded-[1.35rem] border px-5 py-0 transition-all duration-300 ease-out sm:px-6 ${
              isOpen
                ? 'border-black/12 bg-white shadow-[0_14px_28px_rgba(0,0,0,0.05)]'
                : 'border-black/8 bg-white/88 hover:border-black/12 hover:bg-white'
            }`
      }
    >
      <button
        onClick={onToggle}
        className={`group flex w-full items-center justify-between gap-4 rounded-2xl bg-transparent text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2 ${
          variant === 'minimal'
            ? 'py-5 sm:py-6 hover:bg-black/[0.03] focus-visible:bg-black/[0.03]'
            : 'py-5 hover:bg-black/[0.02] focus-visible:bg-black/[0.02]'
        }`}
        aria-expanded={isOpen}
      >
        <span
          className={`text-[15px] font-black leading-6 transition-colors duration-200 ${
            isOpen ? 'text-gray-900' : 'text-gray-800 group-hover:text-gray-900 group-focus-visible:text-gray-900'
          }`}
        >
          {item.question}
        </span>

        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center transition-all duration-300 ${
            variant === 'minimal'
              ? isOpen
                ? 'rotate-45 text-black/80'
                : 'text-black/45 group-hover:text-black/75 group-focus-visible:text-black/75'
              : isOpen
                ? 'rotate-45 rounded-full bg-black/10 text-black/80'
                : 'rounded-full bg-[#F4F2EA] text-black/45 group-hover:bg-black/8 group-hover:text-black/75 group-focus-visible:bg-black/8 group-focus-visible:text-black/75'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: isOpen ? height : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div
          ref={contentRef}
          className={variant === 'minimal' ? 'max-w-4xl pb-6 pr-10' : 'pb-6 pr-10'}
        >
          <p className="text-sm leading-7 text-black/70">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

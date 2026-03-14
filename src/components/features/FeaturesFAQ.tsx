'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FeaturesFAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <AccordionItem
          key={item.question}
          item={item}
          isOpen={openIndex === i}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  );
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
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
      className={`rounded-xl border bg-white px-5 py-0 transition-all duration-300 ease-out ${
        isOpen
          ? 'border-black/12 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          : 'border-black/6 hover:border-black/10'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 bg-transparent py-4 text-left"
        aria-expanded={isOpen}
      >
        <span
          className={`text-sm font-bold leading-relaxed transition-colors duration-200 ${
            isOpen ? 'text-gray-900' : 'text-gray-700'
          }`}
        >
          {item.question}
        </span>

        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            isOpen
              ? 'bg-black/8 rotate-45 text-black/60'
              : 'bg-transparent text-black/30 group-hover:text-black/50'
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
        <div ref={contentRef} className="pb-5 pr-10">
          <p className="text-sm leading-7 text-black/55">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

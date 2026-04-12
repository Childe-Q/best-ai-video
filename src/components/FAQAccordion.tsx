'use client';

import { useState } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { FAQ } from '@/types/tool';

interface FAQAccordionProps {
  faqs: FAQ[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) {
    return (
      <p className="text-gray-500">No FAQs available yet.</p>
    );
  }

  return (
    <div className="w-full space-y-0">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border-b border-gray-100 last:border-b-0"
          >
            {/* Question Row - Clickable */}
            <button
              onClick={() => toggleFAQ(index)}
              className="group -mx-2 flex w-full items-center justify-between rounded-lg bg-transparent px-2 py-4 text-left transition-colors hover:bg-black/[0.06] focus-visible:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold text-gray-900 pr-4 leading-[1.65]">
                {faq.question}
              </span>
              <div className="flex-shrink-0">
                {isOpen ? (
                  <MinusIcon className="h-5 w-5 text-gray-800 transition-transform duration-200" />
                ) : (
                  <PlusIcon className="h-5 w-5 text-gray-600 transition-transform duration-200 group-hover:text-gray-900 group-focus-visible:text-gray-900" />
                )}
              </div>
            </button>

            {/* Answer - Animated */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pb-4 pt-0 px-2">
                <p className="text-base text-gray-700 leading-[1.65]">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

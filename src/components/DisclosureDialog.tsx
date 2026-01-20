'use client';

import { useRef, useState } from 'react';

interface DisclosureDialogProps {
  triggerClassName?: string;
  title?: string;
  lines?: string[];
}

const defaultLines = [
  'We may receive commissions through referral links on this page. This helps us maintain and improve our service at no additional cost to you.',
  'Prices are subject to change. Please check the official pricing page for the most up-to-date information.',
];

export default function DisclosureDialog({
  triggerClassName = '',
  title = 'Disclosure',
  lines = defaultLines,
}: DisclosureDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => {
    setIsOpen(true);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    setIsOpen(false);
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={`text-blue-600 hover:text-blue-700 hover:opacity-80 transition-colors ${triggerClassName}`}
      >
        Disclosure
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-xl p-0 max-w-lg w-full max-h-[90vh] overflow-hidden backdrop:bg-black/50"
        onClose={() => setIsOpen(false)}
      >
        <div className="bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={closeDialog}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-700 space-y-2">
            {lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={closeDialog}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

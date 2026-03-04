'use client';

import { useState } from 'react';

interface PromptBoxProps {
  prompt: string;
  settings: string[];
}

export default function PromptBox({ prompt, settings }: PromptBoxProps) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <details className="rounded-xl border border-gray-200 bg-white p-6" open>
      <summary className="cursor-pointer text-lg font-semibold text-gray-900">
        Prompt Testing Box
      </summary>
      <div className="mt-4 space-y-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-700">Prompt</p>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-800">{prompt}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Settings</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {settings.map((setting) => (
              <li key={setting}>{setting}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

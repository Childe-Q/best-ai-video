'use client';

import { useEffect, useMemo, useState } from 'react';
import { VsPromptVariant } from '@/types/vs';

const VS_USE_CASE_EVENT = 'vs:use-case-change';

interface PromptBoxProps {
  variants: VsPromptVariant[];
  defaultVariantKey?: string | null;
}

function getInitialVariantKey(variants: VsPromptVariant[], defaultVariantKey?: string | null): string {
  if (defaultVariantKey && variants.some((variant) => variant.key === defaultVariantKey)) {
    return defaultVariantKey;
  }
  return variants[0]?.key ?? '';
}

export default function PromptBox({ variants, defaultVariantKey }: PromptBoxProps) {
  const [copied, setCopied] = useState(false);
  const [activeVariantKey, setActiveVariantKey] = useState(() => getInitialVariantKey(variants, defaultVariantKey));

  useEffect(() => {
    setActiveVariantKey(getInitialVariantKey(variants, defaultVariantKey));
  }, [defaultVariantKey, variants]);

  useEffect(() => {
    const onUseCaseChange = (event: Event) => {
      const promptKey = (event as CustomEvent<{ promptKey?: string | null }>).detail?.promptKey;
      if (!promptKey) return;
      if (!variants.some((variant) => variant.key === promptKey)) return;
      setActiveVariantKey(promptKey);
    };

    window.addEventListener(VS_USE_CASE_EVENT, onUseCaseChange);
    return () => window.removeEventListener(VS_USE_CASE_EVENT, onUseCaseChange);
  }, [variants]);

  const activeVariant = useMemo(() => {
    return variants.find((variant) => variant.key === activeVariantKey) ?? variants[0];
  }, [activeVariantKey, variants]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(activeVariant?.prompt ?? '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  if (!activeVariant) return null;

  return (
    <details className="rounded-xl border border-gray-200 bg-gray-50/40 p-5">
      <summary className="cursor-pointer list-none text-lg font-semibold text-gray-900 marker:hidden transition-colors duration-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2">
        Test both tools with this brief
      </summary>
      <p className="mt-2 text-sm text-gray-600">
        Run the same brief in both tools to compare presenter-led delivery against faster stock-scene production.
      </p>
      <div className="mt-4 space-y-4">
        {variants.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.key}
                type="button"
                onClick={() => setActiveVariantKey(variant.key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:translate-y-0 ${
                  activeVariantKey === variant.key
                    ? 'border-gray-500 bg-white text-gray-900 shadow-sm shadow-gray-200/70'
                    : 'border-gray-300 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-white hover:text-gray-900 hover:shadow-sm hover:shadow-gray-200/70'
                }`}
              >
                {variant.title}
              </button>
            ))}
          </div>
        ) : null}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Prompt</p>
              <p className="mt-1 text-xs text-gray-500">{activeVariant.title}</p>
            </div>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:translate-y-0"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-800">{activeVariant.prompt}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Settings</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {activeVariant.settings.map((setting) => (
              <li key={setting}>{setting}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

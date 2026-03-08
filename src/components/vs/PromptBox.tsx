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
    <details className="rounded-xl border border-gray-200 bg-white p-6" open>
      <summary className="cursor-pointer text-lg font-semibold text-gray-900">
        Prompt Testing Box
      </summary>
      <div className="mt-4 space-y-4">
        {variants.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.key}
                type="button"
                onClick={() => setActiveVariantKey(variant.key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  activeVariantKey === variant.key
                    ? 'border-gray-500 bg-white text-gray-900 shadow-sm'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-white hover:text-gray-900'
                }`}
              >
                {variant.title}
              </button>
            ))}
          </div>
        ) : null}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Prompt</p>
              <p className="mt-1 text-xs text-gray-500">{activeVariant.title}</p>
            </div>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
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

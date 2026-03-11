'use client';

import { useState } from 'react';
import { UseCaseKey } from '@/lib/promptLibrary';

const HIGHLIGHT_CLASSES = ['bg-amber-50', 'ring-2', 'ring-amber-300', 'animate-pulse'];
const VS_USE_CASE_EVENT = 'vs:use-case-change';

type Scenario = {
  id: string;
  label: string;
  promptKey?: UseCaseKey | null;
};

interface DecisionPanelProps {
  scenarios: Scenario[];
}

function focusScenario(id: string) {
  const section = document.getElementById(id);
  if (!section) return;

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const highlightTarget = section.querySelector<HTMLElement>('[data-conclusion="true"]') ?? section;
  highlightTarget.classList.add(...HIGHLIGHT_CLASSES);

  window.setTimeout(() => {
    highlightTarget.classList.remove(...HIGHLIGHT_CLASSES);
  }, 1000);
}

export default function DecisionPanel({ scenarios }: DecisionPanelProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0]?.id ?? '');

  return (
    <section className="mx-auto mt-6 max-w-4xl rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
      <p className="text-xs font-semibold tracking-wide text-gray-700">Quick pick</p>
      <p className="mt-1 text-xs text-gray-500">Pick a use case to jump to the verdict.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => {
              setActiveScenarioId(scenario.id);
              window.dispatchEvent(
                new CustomEvent(VS_USE_CASE_EVENT, {
                  detail: {
                    scenarioId: scenario.id,
                    promptKey: scenario.promptKey ?? null,
                  },
                }),
              );
              focusScenario(scenario.id);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:translate-y-0 ${
              activeScenarioId === scenario.id
                ? 'border-gray-500 bg-white text-gray-900 shadow-sm shadow-gray-200/70'
                : 'border-gray-300 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-white hover:text-gray-900 hover:shadow-sm hover:shadow-gray-200/70'
            }`}
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </section>
  );
}

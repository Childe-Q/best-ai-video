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
    <section className="mx-auto mt-5 max-w-4xl rounded-xl border border-gray-200 bg-gray-50/80 p-3">
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
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              activeScenarioId === scenario.id
                ? 'border-gray-500 bg-white text-gray-900 shadow-sm'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </section>
  );
}

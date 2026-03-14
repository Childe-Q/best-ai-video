import SourceTooltip from '@/components/vs/SourceTooltip';
import { VsFactItem } from '@/types/vs';

type VsHardDataSectionProps = {
  toolAName: string;
  toolBName: string;
  pricingCheckedAt: string;
  facts: VsFactItem[];
  intro?: string | null;
};

export default function VsHardDataSection({
  toolAName,
  toolBName,
  pricingCheckedAt,
  facts,
  intro,
}: VsHardDataSectionProps) {
  if (facts.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-gray-900">Hard data comparison</h2>
      {intro ? <p className="mt-2 text-sm text-gray-600">{intro}</p> : null}
      <div className="mt-5 space-y-4">
        {facts.map((fact) => (
          <article key={fact.key} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900">{fact.label}</h3>
              <SourceTooltip
                id={`fact-${fact.key}`}
                label={fact.label}
                toolAName={toolAName}
                toolBName={toolBName}
                sources={fact.sources}
                pricingCheckedAt={pricingCheckedAt}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{toolAName}</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">{fact.a}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{toolBName}</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">{fact.b}</p>
              </div>
            </div>
            {fact.note ? <p className="mt-3 text-xs text-gray-500">{fact.note}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

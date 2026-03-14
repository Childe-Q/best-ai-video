import { VsExternalValidationItem } from '@/types/vs';

type VsExternalProofSectionProps = {
  items: VsExternalValidationItem[];
  intro?: string | null;
};

export default function VsExternalProofSection({ items, intro }: VsExternalProofSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-gray-900">External proof</h2>
      {intro ? <p className="mt-2 text-sm text-gray-600">{intro}</p> : null}
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={`${item.kind}-${item.label}`} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{item.label}</h3>
              <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
                {item.kind.replace('-', ' ')}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-700">{item.summary}</p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 transition-colors duration-200 hover:text-indigo-700"
              >
                {item.sourceName ?? 'Source'} →
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

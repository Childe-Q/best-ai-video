type EditorialSummaryProps = {
  bestFor: string;
  notIdealFor: string;
  whyChooseIt: string;
  biggestLimitation: string;
};

const items = [
  { key: 'bestFor', label: 'Best for' },
  { key: 'notIdealFor', label: 'Not ideal for' },
  { key: 'whyChooseIt', label: 'Why choose it' },
  { key: 'biggestLimitation', label: 'Biggest limitation' },
] as const;

export default function EditorialSummary({
  bestFor,
  notIdealFor,
  whyChooseIt,
  biggestLimitation,
}: EditorialSummaryProps) {
  const content = {
    bestFor,
    notIdealFor,
    whyChooseIt,
    biggestLimitation,
  };

  return (
    <section className="rounded-2xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000]">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Editorial read</p>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">What this tool is actually good at</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.key} className="rounded-xl border border-gray-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{item.label}</p>
            <p className="mt-3 text-sm leading-7 text-gray-700">{content[item.key]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

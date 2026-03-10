type PricingFitGuideProps = {
  planFit: string;
  upgradeTrigger: string;
  whoOverpays: string;
};

export default function PricingFitGuide({
  planFit,
  upgradeTrigger,
  whoOverpays,
}: PricingFitGuideProps) {
  return (
    <section className="mb-12 rounded-2xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000]">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Plan logic</p>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">How to avoid the wrong HeyGen plan</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Plan fit</p>
          <p className="mt-3 text-sm leading-7 text-gray-700">{planFit}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Upgrade trigger</p>
          <p className="mt-3 text-sm leading-7 text-gray-700">{upgradeTrigger}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Who overpays</p>
          <p className="mt-3 text-sm leading-7 text-gray-700">{whoOverpays}</p>
        </article>
      </div>
    </section>
  );
}

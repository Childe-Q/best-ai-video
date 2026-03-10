type EditorialDecisionGuideProps = {
  toolAName: string;
  toolBName: string;
  realDecision: string;
  chooseAIf: string;
  chooseBIf: string;
  hiddenTradeoff: string;
  wrongChoiceRegret: string;
};

export default function EditorialDecisionGuide({
  toolAName,
  toolBName,
  realDecision,
  chooseAIf,
  chooseBIf,
  hiddenTradeoff,
  wrongChoiceRegret,
}: EditorialDecisionGuideProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-gray-900">The real decision</h2>
      <p className="mt-3 text-sm leading-7 text-gray-700">{realDecision}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Choose {toolAName} if</p>
          <p className="mt-3 text-sm leading-7 text-gray-700">{chooseAIf}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Choose {toolBName} if</p>
          <p className="mt-3 text-sm leading-7 text-gray-700">{chooseBIf}</p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Hidden trade-off</p>
          <p className="mt-3 text-sm leading-7 text-gray-700">{hiddenTradeoff}</p>
        </article>
        <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Who will regret the wrong choice</p>
          <p className="mt-3 text-sm leading-7 text-gray-700">{wrongChoiceRegret}</p>
        </article>
      </div>
    </section>
  );
}

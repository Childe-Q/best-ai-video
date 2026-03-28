import Link from 'next/link';
import type { ProofPricingPageData } from '@/lib/pricing/proofPages';

interface CapturedPricingPageProps {
  toolName: string;
  data: ProofPricingPageData;
}

export default function CapturedPricingPage({ toolName, data }: CapturedPricingPageProps) {
  const defaultVisibleState = data.record.billingStates.find((state) => state.isDefaultVisible);
  const recommendedDisplay = data.summary.displayText;
  const blockedHighlights = data.audit.blockedPricePoints.slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Pricing Summary</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">{toolName} pricing</h1>
            <p className="mt-3 text-base text-gray-600">
              {recommendedDisplay}
            </p>
            {data.summary.reviewWarning && (
              <p className="mt-3 text-sm text-amber-700">
                Review warning: {data.summary.reviewWarning}
              </p>
            )}
          </div>
          <div className="min-w-[260px] rounded-2xl border border-black/8 bg-[#FCFBF7] p-5">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">Public display</div>
                <div className="mt-1 font-semibold text-gray-900">{data.summary.displayText}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">Default visible state</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {defaultVisibleState ? `${defaultVisibleState.label} (${defaultVisibleState.billingMode})` : 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">Resolver status</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {data.summary.exactPriceAllowed ? 'Exact price allowed' : data.summary.coarseDisplayText}
                </div>
              </div>
              {data.officialPricingUrl && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">Official source</div>
                  <Link
                    href={data.officialPricingUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-1 inline-flex text-sm font-medium text-blue-700 no-underline hover:text-blue-900"
                  >
                    Open pricing source
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {data.record.billingStates.map((state) => (
            <div key={state.stateId} className="rounded-2xl border border-black/8 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">Billing state</div>
              <div className="mt-2 text-base font-semibold text-gray-900">{state.label}</div>
              <div className="mt-1 text-sm text-gray-600">
                {state.billingMode}
                {state.isDefaultVisible ? ' · default visible' : ' · alternate state'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Plan Cards</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">Captured plan surface</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {data.plans.map((plan) => (
            <section key={plan.planId} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black tracking-tight text-gray-900">{plan.name}</h3>
                    {plan.badge && (
                      <span className="inline-flex rounded-full bg-[#F6D200] px-2.5 py-1 text-[11px] font-semibold text-black">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{plan.planType}</p>
                </div>
                {plan.ctaText && (
                  plan.ctaHref ? (
                    <Link
                      href={plan.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex rounded-full border border-black/10 bg-[#FAF8F2] px-3 py-2 text-xs font-semibold text-black/75 no-underline"
                    >
                      {plan.ctaText}
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-full border border-black/10 bg-[#FAF8F2] px-3 py-2 text-xs font-semibold text-black/75">
                      {plan.ctaText}
                    </span>
                  )
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-[#FCFBF7] p-4">
                <div className="text-2xl font-black tracking-tight text-gray-900">
                  {plan.displayedPrice || 'Pricing varies'}
                </div>
                {plan.qualifier && (
                  <div className="mt-1 text-sm font-medium text-gray-600">{plan.qualifier}</div>
                )}
              </div>

              <div className="mt-5 space-y-5">
                {plan.sections.length > 0 ? (
                  plan.sections.map((section, index) => (
                    <div key={`${plan.planId}-${section.title ?? 'included'}-${index}`}>
                      {section.title && (
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
                          {section.title}
                        </div>
                      )}
                      <ul className="space-y-2">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="text-sm text-gray-700">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Plan details are still incomplete in this test render.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Blocked From Main Render</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">Details kept out of the plan cards</h2>
        <p className="mt-3 text-sm text-gray-600">
          This test render intentionally hides yearly totals, strike-through values, add-ons, and upgrade-only pricing from the main plan surface.
        </p>
        {blockedHighlights.length > 0 && (
          <ul className="mt-4 space-y-2">
            {blockedHighlights.map((item, index) => (
              <li key={`${item.planId}-${item.stateId}-${index}`} className="text-sm text-gray-700">
                {item.planName}: {item.displayText || 'No public display'} ({item.blockedReason || item.priceRole})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

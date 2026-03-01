import Link from 'next/link';
import FAQAccordion from '@/components/FAQAccordion';
import { AlternativesComparisonRow, AlternativesDeepDive, AlternativesTemplateData } from '@/types/alternativesLongform';

interface AlternativesLongformTemplateProps {
  data: AlternativesTemplateData;
}

function isUnknownValue(value?: string): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized.includes('need verification') || normalized.includes('verify') || normalized.includes('tbd');
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });

  return result;
}

export default function AlternativesLongformTemplate({ data }: AlternativesLongformTemplateProps) {
  const topPicksLimit = data.topPicksLimit || Math.min(6, data.deepDives.length);
  const visibleDeepDives = data.deepDives.slice(0, topPicksLimit);
  const baseToolName = data.toolSummary?.toolName || data.slug;
  const isInVideoPage = data.pageKind === 'tool' && data.slug === 'invideo';
  const yearFromTitle = data.title.match(/\b(20\d{2})\b/)?.[1];
  const articleYear = yearFromTitle || String(new Date().getFullYear());
  const rowByToolName = new Map(data.comparisonRows.map((row) => [row.toolName.toLowerCase(), row]));

  const tocSections = [
    { id: 'article-header', label: 'Overview' },
    { id: 'tldr', label: 'TL;DR' },
    { id: 'why-consider', label: 'Why consider an alternative?' },
    { id: 'top-six', label: `The ${topPicksLimit} most popular ${baseToolName} alternatives` },
    { id: 'at-a-glance', label: 'Best alternatives at a glance' },
    { id: 'faq', label: 'FAQ' },
  ];

  const whyConsiderReasons = data.decisionCriteria.slice(0, 3).map((criterion, index) => {
    if (index === 0) {
      return {
        title: 'Cost and usage predictability',
        body: [
          criterion,
          `When usage grows, teams often compare alternatives to avoid pricing surprises while keeping production output stable.`,
        ],
      };
    }
    if (index === 1) {
      return {
        title: 'Output quality consistency',
        body: [
          criterion,
          `Switching from ${baseToolName} is usually driven by the need for fewer re-renders and more reliable first-pass quality.`,
        ],
      };
    }
    return {
      title: 'Workflow reliability and delivery speed',
      body: [
        criterion,
        'If your process depends on weekly publishing, reliability under deadline matters as much as headline feature count.',
      ],
    };
  });

  const resolveRow = (tool: AlternativesDeepDive) => rowByToolName.get(tool.toolName.toLowerCase());

  const buildKnownFor = (tool: AlternativesDeepDive) => {
    return tool.bestFor || 'General video creation workflows with AI assistance.';
  };

  const buildCapabilities = (tool: AlternativesDeepDive, row?: AlternativesComparisonRow): string[] => {
    const capabilities = uniqueStrings([
      ...tool.strengths.slice(0, 4),
      row && !isUnknownValue(row.editingControl) ? `Editing control: ${row.editingControl}.` : '',
      row && !isUnknownValue(row.exportLimits) ? `Export behavior: ${row.exportLimits}.` : '',
      row && !isUnknownValue(row.freeVersion) ? `Free plan signal: ${row.freeVersion}.` : '',
    ]).slice(0, 6);

    if (capabilities.length >= 3) return capabilities;

    return uniqueStrings([
      ...capabilities,
      `Built for ${tool.bestFor || 'common video production workflows'}.`,
      'Supports iterative AI generation and revision loops.',
      'Can be slotted into solo, agency, or team production pipelines.',
    ]).slice(0, 6);
  };

  const buildWhyPickVsBase = (tool: AlternativesDeepDive, row?: AlternativesComparisonRow): string[] => {
    const points = uniqueStrings([
      tool.strengths[0] ? `${tool.strengths[0]}` : '',
      tool.strengths[1] ? `${tool.strengths[1]}` : '',
      row && !isUnknownValue(row.price) ? `Pricing signal is clearer for budgeting: ${row.price}.` : '',
      row && !isUnknownValue(row.mainTradeoff) ? `Trade-off profile is explicit upfront for faster tool selection.` : '',
    ]).slice(0, 4);

    if (points.length >= 2) return points;

    return uniqueStrings([
      ...points,
      `Teams often pick it when ${baseToolName} feels too constrained for their specific workflow.`,
      'It tends to reduce iteration cycles when you need predictable outputs under deadline.',
    ]).slice(0, 4);
  };

  const topPickLinks = (data.topPicks && data.topPicks.length > 0)
    ? data.topPicks.map((item) => ({
        label: item.toolName,
        href: item.href || (item.toolSlug ? `/tool/${item.toolSlug}` : '#top-six'),
      }))
    : visibleDeepDives.map((tool, index) => ({
        label: tool.toolName,
        href: `#pick-${index + 1}`,
      }));
  const atAGlanceRows = (data.atAGlanceRows && data.atAGlanceRows.length > 0
    ? data.atAGlanceRows
    : visibleDeepDives.map((item) => ({
        toolName: item.toolName,
        toolSlug: item.toolSlug,
        bestFor: item.bestFor,
      })))
    .slice(0, topPicksLimit);
  const tryNowClass = isInVideoPage
    ? 'inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 hover:shadow-[0_4px_10px_rgba(15,23,42,0.12)]'
    : 'inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold !text-white hover:bg-slate-700 hover:!text-white';
  const pageContainerClass = isInVideoPage
    ? 'max-w-[1240px] mx-auto px-4 md:px-8 py-12 md:py-16'
    : 'max-w-[880px] mx-auto px-4 md:px-6 py-10 md:py-14';
  const articleContainerClass = isInVideoPage
    ? 'max-w-[780px] mx-auto'
    : 'max-w-[740px] mx-auto';
  const sectionHeadingClass = isInVideoPage
    ? 'text-[1.9rem] md:text-[2.2rem] font-bold tracking-tight text-slate-900 leading-tight'
    : 'text-3xl font-bold tracking-tight text-slate-900';
  const deepDiveSubheadingClass = isInVideoPage
    ? 'text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500'
    : 'text-[15px] font-semibold uppercase tracking-[0.1em] text-slate-500';
  const deepDiveListClass = isInVideoPage
    ? 'mt-3 space-y-2.5 pl-6 list-disc list-outside text-[17px] leading-8 text-slate-700 marker:text-slate-400'
    : 'mt-3 space-y-2 text-[17px] leading-8 text-slate-700 list-disc list-inside marker:text-slate-400';
  const invideoImageWrapperClass = 'relative left-1/2 -translate-x-1/2 w-[min(1200px,calc(100vw-3rem))]';

  const renderToolCover = (tool: AlternativesTemplateData['deepDives'][number]) => {
    if (tool.image) {
      return (
        <div className={isInVideoPage ? invideoImageWrapperClass : 'w-full'}>
          <div className={isInVideoPage ? 'rounded-[24px] border border-slate-200/90 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.09)]' : ''}>
            <img
              src={tool.image}
              alt={`${tool.toolName} product image`}
              className={isInVideoPage
                ? 'block w-full h-auto max-h-[680px] object-contain rounded-[20px] bg-white'
                : 'w-full h-[260px] sm:h-[360px] md:h-[540px] lg:h-[640px] object-cover rounded-2xl border border-slate-200 shadow-sm'}
              loading="lazy"
            />
          </div>
        </div>
      );
    }

    return (
      <div className={isInVideoPage ? invideoImageWrapperClass : 'w-full'}>
        <div className={isInVideoPage
          ? 'relative w-full aspect-[16/9] rounded-[24px] border border-slate-200/90 bg-gradient-to-br from-slate-100 via-white to-slate-100 overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.09)]'
          : 'relative w-full h-[260px] sm:h-[360px] md:h-[540px] lg:h-[640px] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-100 overflow-hidden shadow-sm'}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.26),transparent_52%)]" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 text-center">
            {tool.logoUrl ? (
              <img
                src={tool.logoUrl}
                alt={`${tool.toolName} logo`}
                className="h-16 w-16 object-contain rounded-lg bg-white border border-slate-200 p-2"
                loading="lazy"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-700">
                {tool.toolName.charAt(0)}
              </div>
            )}
            <p className="mt-3 text-base font-semibold tracking-wide text-slate-800">{tool.toolName}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDeepDive = (
    tool: AlternativesTemplateData['deepDives'][number],
    keyPrefix: string,
    index: number,
    numbered: boolean
  ) => {
    const row = resolveRow(tool);
    const knownFor = buildKnownFor(tool);
    const capabilities = buildCapabilities(tool, row).slice(0, 4);
    const tradeoffs = tool.tradeoffs.length > 0
      ? tool.tradeoffs.slice(0, 2)
      : ['Trade-offs need deeper validation from latest docs and reviewer feedback.'];
    const summaryLine = buildWhyPickVsBase(tool, row)[0]
      || `A practical pick if you need a different workflow style than ${baseToolName}.`;
    const sectionId = numbered ? `pick-${index + 1}` : `${keyPrefix}-${tool.toolName.toLowerCase().replace(/\s+/g, '-')}`;
    const hasInternalSlug = Boolean(tool.toolSlug);
    const viewPricingHref = hasInternalSlug ? `/tool/${tool.toolSlug}/pricing` : tool.ctaHref;
    const reviewHref = hasInternalSlug ? `/tool/${tool.toolSlug}` : tool.ctaHref;
    const secondaryCtaClass = 'inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 hover:text-slate-900';

    return (
        <article
          key={`${keyPrefix}-${tool.toolName}`}
          id={sectionId}
          className={isInVideoPage
            ? 'pt-16 first:pt-10 pb-20 scroll-mt-28'
            : 'pt-12 first:pt-8 pb-12 border-b border-slate-200/75 last:border-b-0 scroll-mt-28'}
        >
        <h2 className={isInVideoPage
          ? 'text-[2rem] md:text-[2.45rem] font-bold tracking-tight text-slate-900 leading-tight'
          : 'text-2xl md:text-3xl font-bold tracking-tight text-slate-900'}>
          {numbered ? `${index + 1}. ${tool.toolName}` : tool.toolName}
        </h2>

        <figure className={isInVideoPage ? 'mt-7 space-y-3.5' : 'mt-5 space-y-2.5'}>
          {renderToolCover(tool)}
          <figcaption className={isInVideoPage ? 'text-xs text-slate-500/90 italic pl-1' : 'text-xs text-slate-500'}>
            Images are screenshots provided by our team.
          </figcaption>
        </figure>

        <div className={isInVideoPage ? 'mt-10 space-y-9' : 'mt-7 space-y-7'}>
          <section>
            <p className={isInVideoPage ? 'text-[18px] leading-[1.9] text-slate-700' : 'text-[18px] leading-8 text-slate-700'}>
              {knownFor}. {summaryLine}
            </p>
          </section>

          <section>
            <h3 className={deepDiveSubheadingClass}>Key capabilities</h3>
            <ul className={deepDiveListClass}>
              {capabilities.map((item, capabilityIndex) => (
                <li key={`${keyPrefix}-${tool.toolName}-capability-${capabilityIndex}`}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className={deepDiveSubheadingClass}>Weakness / Trade-offs</h3>
            <ul className={deepDiveListClass}>
              {tradeoffs.map((item, tradeoffIndex) => (
                <li key={`${keyPrefix}-${tool.toolName}-tradeoff-${tradeoffIndex}`}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className={deepDiveSubheadingClass}>Pricing</h3>
            <p className={isInVideoPage ? 'mt-2 text-[17px] leading-[1.85] text-slate-700' : 'mt-2 text-[17px] leading-8 text-slate-700'}>
              {tool.pricingStarting}
            </p>
          </section>
        </div>

        <div className={isInVideoPage ? 'mt-10 flex flex-wrap items-center gap-3.5' : 'mt-7 flex flex-wrap items-center gap-3'}>
          <Link
            href={tool.ctaHref}
            target={tool.ctaHref.startsWith('http') ? '_blank' : undefined}
            rel={tool.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={tryNowClass}
          >
            {tool.ctaLabel}
          </Link>
          <Link href={viewPricingHref} className={secondaryCtaClass}>
            View pricing
          </Link>
          <Link href={reviewHref} className={secondaryCtaClass}>
            Read full review
          </Link>
        </div>
      </article>
    );
  };

  const topSummaryCtas = data.toolSummary?.ctas || data.heroCtas;
  const secondaryTopCtaClass = 'inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 hover:text-slate-900';

  return (
    <div className="w-full bg-slate-50" data-alt-page-root="1">
      <div className={pageContainerClass}>
        <article className={articleContainerClass}>
          {!isInVideoPage && (
            <details className="mb-9 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Table of contents</summary>
              <ul className="mt-3 space-y-1.5">
                {tocSections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-sm text-slate-700 hover:text-slate-900 hover:underline underline-offset-4">
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <header id="article-header" className={isInVideoPage ? 'pb-12' : 'pb-10'}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Alternatives Guide</p>
            <h1 className={isInVideoPage
              ? 'mt-4 text-[2.6rem] md:text-[3.25rem] font-black tracking-tight text-slate-900 leading-[1.06]'
              : 'mt-3 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight'}>
              {baseToolName} Alternatives ({articleYear})
            </h1>

            <div className={isInVideoPage ? 'mt-7 space-y-6 text-[18px] leading-[1.9] text-slate-700' : 'mt-6 space-y-5 text-[18px] leading-9 text-slate-700'}>
              <p>{data.heroConclusion}</p>
              <p>
                This guide is for creators and teams who want a cleaner decision path: where each option is good, what you gain over {baseToolName}, and what trade-offs you accept.
              </p>
              <p>
                Instead of browsing long feature grids, start with the top {topPicksLimit} picks below and compare them by editing control, workflow speed, pricing behavior, and delivery reliability.
              </p>
            </div>

            <p className={isInVideoPage ? 'mt-7 text-[17px] leading-[1.85] text-slate-700' : 'mt-6 text-[17px] leading-8 text-slate-700'}>
              <span className="font-semibold text-slate-900">Top picks are </span>
              {topPickLinks.length > 0
                ? topPickLinks.map((pick, index) => (
                    <span key={pick.href}>
                      <a href={pick.href} className="font-semibold text-slate-900 hover:underline underline-offset-4">
                        {pick.label}
                      </a>
                      {index < topPickLinks.length - 1 ? ', ' : '.'}
                    </span>
                  ))
                : 'Need verification.'}
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Updated {data.heroUpdatedAt}</p>

            {data.toolSummary && (
              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Rating</p>
                    <p className="text-lg font-bold text-slate-900">{data.toolSummary.rating ? `${data.toolSummary.rating}/5` : 'N/A'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Starting price</p>
                    <p className="text-lg font-bold text-slate-900">{data.toolSummary.startingPrice || 'Verify'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Verdict</p>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{data.toolSummary.conclusion}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {topSummaryCtas.slice(0, 2).map((cta) => (
                    <Link
                      key={`${cta.label}-${cta.href}`}
                      href={cta.href}
                      target={cta.external ? '_blank' : undefined}
                      rel={cta.external ? 'noopener noreferrer' : undefined}
                      className={/try now/i.test(cta.label)
                        ? `${tryNowClass} justify-center`
                        : /pricing/i.test(cta.label)
                          ? secondaryTopCtaClass
                          : secondaryTopCtaClass}
                    >
                      {cta.label}
                    </Link>
                  ))}
                  <Link
                    href={data.toolSummary.reviewHref}
                    className={secondaryTopCtaClass}
                  >
                    Read full review
                  </Link>
                </div>
              </div>
            )}
          </header>

          {!data.contentReady && (
            <section className="mt-2 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
              <h2 className="text-lg font-bold text-amber-900">内容建设中</h2>
              <p className="text-sm text-amber-900/90 mt-1">
                {data.contentGapReason || 'This alternatives page is being expanded with deeper comparisons and verified sources.'}
              </p>
            </section>
          )}

          <section id="tldr" className={isInVideoPage ? 'scroll-mt-28 mt-16' : 'scroll-mt-28 mt-14'}>
            <h2 className={sectionHeadingClass}>TL;DR</h2>
            <ul className={isInVideoPage ? 'mt-6 space-y-3.5 pl-6 list-disc list-outside text-[17px] leading-[1.85] text-slate-700 marker:text-slate-400' : 'mt-5 space-y-3 text-[17px] leading-8 text-slate-700 list-disc list-inside marker:text-slate-400'}>
              {data.tldrBuckets.slice(0, 4).map((bucket) => {
                const topTwo = bucket.items.slice(0, 2);
                const tools = topTwo.map((item) => item.toolName).join(' + ');
                const why = topTwo[0]?.why || bucket.items[0]?.why || '';
                return (
                  <li key={bucket.id}>
                    <span className="font-semibold text-slate-900">{bucket.title}:</span>{' '}
                    {tools || 'TBD'}{why ? ` — ${why}` : ''}
                  </li>
                );
              })}
            </ul>
          </section>

          <section id="why-consider" className={isInVideoPage ? 'scroll-mt-28 mt-16' : 'scroll-mt-28 mt-14'}>
            <h2 className={sectionHeadingClass}>Why consider an alternative?</h2>
            <ol className={isInVideoPage ? 'mt-7 space-y-9' : 'mt-6 space-y-8'}>
              {whyConsiderReasons.map((item, index) => (
                <li key={item.title}>
                  <h3 className={isInVideoPage ? 'text-[1.32rem] font-bold text-slate-900 leading-snug' : 'text-xl font-bold text-slate-900'}>
                    {index + 1}. {item.title}
                  </h3>
                  <div className={isInVideoPage ? 'mt-3 space-y-4 text-[17px] leading-[1.85] text-slate-700' : 'mt-2 space-y-3 text-[17px] leading-8 text-slate-700'}>
                    {item.body.map((paragraph) => (
                      <p key={`${item.title}-${paragraph}`}>{paragraph}</p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="top-six" className={isInVideoPage ? 'scroll-mt-28 mt-16' : 'scroll-mt-28 mt-14'}>
            <h2 className={sectionHeadingClass}>
              The {topPicksLimit} most popular {baseToolName} alternatives
            </h2>
            <div className={isInVideoPage ? 'mt-4' : 'mt-2'}>
              {visibleDeepDives.map((tool, index) => renderDeepDive(tool, 'primary', index, true))}
            </div>
          </section>

          <section id="at-a-glance" className={isInVideoPage ? 'scroll-mt-28 mt-16' : 'scroll-mt-28 mt-14'}>
            <h2 className={sectionHeadingClass}>Best alternatives at a glance</h2>
            <div className="mt-5 rounded-xl border border-slate-200 bg-white overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left p-3 font-semibold">Tool</th>
                    <th className="text-left p-3 font-semibold">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  {atAGlanceRows.map((row) => (
                    <tr key={`glance-${row.toolName}`} className="border-t border-slate-200 align-top text-slate-700">
                      <td className="p-3 font-semibold text-slate-900">{row.toolName}</td>
                      <td className="p-3">{row.bestFor || 'Need verification'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section id="faq" className={isInVideoPage ? 'scroll-mt-28 mt-16' : 'scroll-mt-28 mt-14'}>
            <h2 className={sectionHeadingClass}>FAQ</h2>
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
              <FAQAccordion faqs={data.faqs.slice(0, 10)} />
            </div>
          </section>

          {data.notSureHref && (
            <section className="mt-14 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900">Not sure what you need?</h2>
              <p className="text-sm text-slate-700 mt-2">
                Explore alternatives by exact tool and by workflow topic.
              </p>
              <Link
                href={data.notSureHref}
                className="mt-3 inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 hover:text-slate-900"
              >
                Browse Alternatives Hub
              </Link>
            </section>
          )}

        </article>
      </div>
    </div>
  );
}

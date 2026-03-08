'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildSourceEvidenceItems, normalizeSourceUrlList, normalizeRowSources, VsRowSources } from '@/lib/vsSources';

interface SourceTooltipProps {
  id?: string;
  label?: string;
  toolAName: string;
  toolBName: string;
  sources?: Partial<VsRowSources>;
  sourceUrl?: string;
  domain?: string;
  pricingCheckedAt: string;
}

type TooltipPosition = {
  top: number;
  left: number;
  mobile: boolean;
};

const VIEWPORT_MARGIN = 8;
const OFFSET = 8;
const MOBILE_BREAKPOINT = 768;

function parseCheckedDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function warnIfLegacySourceShape(props: SourceTooltipProps): boolean {
  const { sourceUrl, domain, sources } = props;
  if (typeof sourceUrl === 'string' && sourceUrl.trim()) return true;
  if (typeof domain === 'string' && domain.trim()) return true;
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) return true;
  if ('a' in sources && sources.a !== undefined && !Array.isArray(sources.a)) return true;
  if ('b' in sources && sources.b !== undefined && !Array.isArray(sources.b)) return true;

  const hasA = Array.isArray(sources.a);
  const hasB = Array.isArray(sources.b);
  if ((!hasA || !hasB) && typeof sourceUrl === 'string' && sourceUrl.trim()) return true;

  return false;
}

function normalizeToolToken(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function looksCrossBound(toolAName: string, toolBName: string, sources: { a: Array<{ domain: string }>; b: Array<{ domain: string }> }): boolean {
  const tokenA = normalizeToolToken(toolAName);
  const tokenB = normalizeToolToken(toolBName);
  const aDomains = sources.a.map((item) => item.domain.toLowerCase());
  const bDomains = sources.b.map((item) => item.domain.toLowerCase());

  const aLooksLikeB = aDomains.length > 0 && aDomains.every((domain) => domain.includes(tokenB)) && !aDomains.some((domain) => domain.includes(tokenA));
  const bLooksLikeA = bDomains.length > 0 && bDomains.every((domain) => domain.includes(tokenA)) && !bDomains.some((domain) => domain.includes(tokenB));

  return aLooksLikeB || bLooksLikeA;
}

export default function SourceTooltip({ id, label, toolAName, toolBName, sources, sourceUrl, domain, pricingCheckedAt }: SourceTooltipProps) {
  const rowLabel = label ?? 'Comparison row';
  const normalizedSources = useMemo(
    () =>
      sources
        ? {
            a: normalizeSourceUrlList(sources.a).slice(0, 2),
            b: normalizeSourceUrlList(sources.b).slice(0, 2),
          }
        : normalizeRowSources({ sourceUrl }),
    [sourceUrl, sources],
  );
  const aSources = useMemo(() => buildSourceEvidenceItems(normalizedSources.a, rowLabel), [normalizedSources.a, rowLabel]);
  const bSources = useMemo(() => buildSourceEvidenceItems(normalizedSources.b, rowLabel), [normalizedSources.b, rowLabel]);
  const tooltipId = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const warnedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    mobile: false,
  });
  const checkedDate = parseCheckedDate(pricingCheckedAt);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openTooltip = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const closeTooltip = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 100);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const anchorRect = anchorRef.current?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      if (!anchorRect || !tooltipRect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const mobile = viewportWidth < MOBILE_BREAKPOINT;

      if (mobile) {
        setPosition({
          top: Math.max(VIEWPORT_MARGIN, viewportHeight - tooltipRect.height - 16),
          left: Math.max(VIEWPORT_MARGIN, (viewportWidth - tooltipRect.width) / 2),
          mobile: true,
        });
        return;
      }

      let left = anchorRect.right + OFFSET;
      let top = anchorRect.bottom + OFFSET;

      if (left + tooltipRect.width > viewportWidth - VIEWPORT_MARGIN) {
        left = anchorRect.left - tooltipRect.width - OFFSET;
      }
      if (left < VIEWPORT_MARGIN) {
        left = VIEWPORT_MARGIN;
      }

      if (top + tooltipRect.height > viewportHeight - VIEWPORT_MARGIN) {
        top = anchorRect.top - tooltipRect.height - OFFSET;
      }
      if (top < VIEWPORT_MARGIN) {
        top = VIEWPORT_MARGIN;
      }

      setPosition({ top, left, mobile: false });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTooltip();
      }
    };

    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const isInAnchor = Boolean(anchorRef.current && anchorRef.current.contains(target));
      const isInTooltip = Boolean(tooltipRef.current && tooltipRef.current.contains(target));
      if (!isInAnchor && !isInTooltip) {
        closeTooltip();
      }
    };

    window.addEventListener('keydown', onEscape);
    document.addEventListener('mousedown', onOutsideClick);
    return () => {
      window.removeEventListener('keydown', onEscape);
      document.removeEventListener('mousedown', onOutsideClick);
    };
  }, [closeTooltip, open]);

  const canUseDOM = typeof document !== 'undefined';

  if (process.env.NODE_ENV === 'development' && !warnedRef.current && warnIfLegacySourceShape({ id, label, toolAName, toolBName, sources, sourceUrl, domain, pricingCheckedAt })) {
    warnedRef.current = true;
    console.warn('[vs][sources] legacy source shape detected', {
      tooltipId: id ?? label ?? tooltipId,
      rowLabel: rowLabel ?? null,
      toolAName,
      toolBName,
      received: {
        sourceUrl: sourceUrl ?? null,
        domain: domain ?? null,
        sources: sources ?? null,
      },
      hint: 'Pass sources as { a: string[], b: string[] } and avoid sourceUrl/domain.',
    });
  }

  if (process.env.NODE_ENV === 'development' && !warnedRef.current && looksCrossBound(toolAName, toolBName, { a: aSources, b: bSources })) {
    warnedRef.current = true;
    console.warn('[vs][sources] suspicious cross-bound domains detected', {
      tooltipId: id ?? label ?? tooltipId,
      rowLabel: rowLabel ?? null,
      toolAName,
      toolBName,
      received: {
        sources: {
          a: aSources.map((item) => item.domain),
          b: bSources.map((item) => item.domain),
        },
      },
      hint: 'Check that sources.a only contains Tool A primary domains and sources.b only contains Tool B primary domains.',
    });
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        aria-label={`Source details for ${toolAName} and ${toolBName}`}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onFocus={openTooltip}
        onBlur={scheduleClose}
        onClick={() => (open ? closeTooltip() : openTooltip())}
      >
        ⓘ
      </button>

      {canUseDOM && open
        ? createPortal(
            <div
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className="z-[90] w-[min(20rem,calc(100vw-1rem))] rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-xl"
              style={
                position.mobile
                  ? {
                      position: 'fixed',
                      left: position.left,
                      top: position.top,
                    }
                  : {
                      position: 'fixed',
                      top: position.top,
                      left: position.left,
                    }
              }
              onMouseEnter={openTooltip}
              onMouseLeave={scheduleClose}
            >
              <p className="font-semibold text-gray-900">Sources</p>
              <p className="mt-1 text-gray-600">checked {checkedDate}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{toolAName} sources</p>
                  {aSources.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {aSources.map((item) => (
                        <div key={`${toolAName}-${item.url}`} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="block text-indigo-600 hover:text-indigo-700"
                          >
                            {item.domain}
                          </a>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">{item.sourceType}</p>
                          <p className="mt-1 break-all font-mono text-[10px] text-gray-500">{item.url}</p>
                          <p className="mt-1 text-[11px] text-gray-600">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-gray-500">No verified source yet.</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{toolBName} sources</p>
                  {bSources.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {bSources.map((item) => (
                        <div key={`${toolBName}-${item.url}`} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="block text-indigo-600 hover:text-indigo-700"
                          >
                            {item.domain}
                          </a>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">{item.sourceType}</p>
                          <p className="mt-1 break-all font-mono text-[10px] text-gray-500">{item.url}</p>
                          <p className="mt-1 text-[11px] text-gray-600">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-gray-500">No verified source yet.</p>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

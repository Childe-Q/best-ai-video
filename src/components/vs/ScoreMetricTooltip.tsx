'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ScoreMetricTooltipProps = {
  metricLabel: string;
  coverage: 'verified' | 'estimated';
  rationale: string;
  sources: string[];
};

type TooltipPosition = {
  top: number;
  left: number;
  mobile: boolean;
};

const VIEWPORT_MARGIN = 8;
const OFFSET = 8;
const MOBILE_BREAKPOINT = 768;

function getDomain(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return sourceUrl;
  }
}

export default function ScoreMetricTooltip({
  metricLabel,
  coverage,
  rationale,
  sources,
}: ScoreMetricTooltipProps) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, mobile: false });
  const normalizedSources = useMemo(() => sources.slice(0, 3), [sources]);

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

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        aria-label={`${metricLabel} score source details`}
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
              className="z-[90] w-[min(22rem,calc(100vw-1rem))] rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-xl"
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
              }}
              onMouseEnter={openTooltip}
              onMouseLeave={scheduleClose}
            >
              <p className="font-semibold text-gray-900">{metricLabel}</p>
              <p className="mt-1 text-gray-700">{rationale}</p>
              <p className="mt-2">
                <span className="font-medium text-gray-900">Coverage:</span>{' '}
                <span className={coverage === 'verified' ? 'text-emerald-700' : 'text-slate-600'}>
                  {coverage}
                </span>
              </p>
              {normalizedSources.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {normalizedSources.map((sourceUrl) => (
                    <li key={sourceUrl}>
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {getDomain(sourceUrl)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-gray-500">No row-level source link attached yet.</p>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

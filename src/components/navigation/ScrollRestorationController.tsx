'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type ScrollPosition = {
  x: number;
  y: number;
};

const storageKeyPrefix = 'best-ai-video:scroll:';
const navigationModeStorageKey = 'best-ai-video:navigation-mode';
const contextPreservingCollectionRoutes = new Set(['/features', '/vs', '/alternatives']);

function isDecisionRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return (
    pathname.startsWith('/tool/') ||
    pathname.startsWith('/features/') ||
    pathname.startsWith('/vs/') ||
    pathname.startsWith('/alternatives/')
  );
}

function shouldAlwaysStartAtTop(pathname: string | null): boolean {
  return pathname === '/' || isDecisionRoute(pathname);
}

function shouldPreserveContextOnBack(pathname: string | null): boolean {
  return Boolean(pathname && contextPreservingCollectionRoutes.has(pathname));
}

function getScrollKey(pathname: string | null, search: string): string {
  return `${pathname || '/'}${search ? `?${search}` : ''}`;
}

function hasHash(): boolean {
  return typeof window !== 'undefined' && window.location.hash.length > 0;
}

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function getStoredPosition(key: string, positions: Map<string, ScrollPosition>): ScrollPosition | null {
  const memoryPosition = positions.get(key);
  if (memoryPosition) {
    return memoryPosition;
  }

  try {
    const stored = window.sessionStorage.getItem(`${storageKeyPrefix}${key}`);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<ScrollPosition>;
    return typeof parsed.x === 'number' && typeof parsed.y === 'number'
      ? { x: parsed.x, y: parsed.y }
      : null;
  } catch {
    return null;
  }
}

function storePosition(key: string, position: ScrollPosition) {
  try {
    window.sessionStorage.setItem(`${storageKeyPrefix}${key}`, JSON.stringify(position));
  } catch {
    // Session storage can be unavailable in restrictive browser modes.
  }
}

function getStoredNavigationMode(): 'history' | 'push' | null {
  try {
    const mode = window.sessionStorage.getItem(navigationModeStorageKey);
    return mode === 'history' || mode === 'push' ? mode : null;
  } catch {
    return null;
  }
}

function setStoredNavigationMode(mode: 'history' | 'push') {
  try {
    window.sessionStorage.setItem(navigationModeStorageKey, mode);
  } catch {
    // Session storage can be unavailable in restrictive browser modes.
  }
}

function clearStoredNavigationMode() {
  try {
    window.sessionStorage.removeItem(navigationModeStorageKey);
  } catch {
    // Session storage can be unavailable in restrictive browser modes.
  }
}

export default function ScrollRestorationController() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentKeyRef = useRef(getScrollKey(pathname, search));
  const positionsRef = useRef<Map<string, ScrollPosition>>(new Map());
  const isHistoryNavigationRef = useRef(false);
  const isRouteTransitioningRef = useRef(false);

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) {
      return;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const saveCurrentScroll = () => {
      const position = {
        x: window.scrollX,
        y: window.scrollY,
      };

      positionsRef.current.set(currentKeyRef.current, position);
      storePosition(currentKeyRef.current, position);
    };
    let scrollFrame: number | null = null;

    const scheduleScrollSave = () => {
      if (isRouteTransitioningRef.current) {
        return;
      }

      if (scrollFrame !== null) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = null;
        saveCurrentScroll();
      });
    };

    const handlePopState = () => {
      isRouteTransitioningRef.current = true;
      isHistoryNavigationRef.current = true;
      setStoredNavigationMode('history');

      window.requestAnimationFrame(() => {
        const targetPathname = window.location.pathname;
        const targetSearch = window.location.search.replace(/^\?/, '');
        const targetKey = getScrollKey(targetPathname, targetSearch);
        currentKeyRef.current = targetKey;

        if (!hasHash()) {
          if (shouldAlwaysStartAtTop(targetPathname)) {
            scrollToTop();
          } else {
            const position = getStoredPosition(targetKey, positionsRef.current);
            if (position) {
              window.scrollTo({ top: position.y, left: position.x, behavior: 'auto' });
            }
          }
        }

        isRouteTransitioningRef.current = false;
      });
    };

    const handleLinkCapture = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement)) {
        return;
      }

      const url = new URL(target.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      saveCurrentScroll();
      isHistoryNavigationRef.current = false;
      setStoredNavigationMode('push');

      const nextKey = getScrollKey(url.pathname, url.searchParams.toString());
      if (nextKey !== currentKeyRef.current) {
        isRouteTransitioningRef.current = true;
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('scroll', scheduleScrollSave, { passive: true });
    window.addEventListener('pagehide', saveCurrentScroll);
    document.addEventListener('click', handleLinkCapture, { capture: true });

    return () => {
      if (scrollFrame !== null) {
        window.cancelAnimationFrame(scrollFrame);
      }
      saveCurrentScroll();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', scheduleScrollSave);
      window.removeEventListener('pagehide', saveCurrentScroll);
      document.removeEventListener('click', handleLinkCapture, { capture: true });
    };
  }, []);

  useEffect(() => {
    const nextKey = getScrollKey(pathname, search);
    const storedNavigationMode = getStoredNavigationMode();
    const isHistoryNavigation = isHistoryNavigationRef.current || storedNavigationMode === 'history';
    isHistoryNavigationRef.current = false;
    currentKeyRef.current = nextKey;
    isRouteTransitioningRef.current = false;
    clearStoredNavigationMode();

    if (hasHash()) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (shouldAlwaysStartAtTop(pathname)) {
        scrollToTop();
        return;
      }

      if (isHistoryNavigation && shouldPreserveContextOnBack(pathname)) {
        const position = getStoredPosition(nextKey, positionsRef.current);
        if (position) {
          window.scrollTo({ top: position.y, left: position.x, behavior: 'auto' });
        }
        return;
      }

      if (isHistoryNavigation) {
        const position = getStoredPosition(nextKey, positionsRef.current);
        if (position) {
          window.scrollTo({ top: position.y, left: position.x, behavior: 'auto' });
        }
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, search]);

  return null;
}

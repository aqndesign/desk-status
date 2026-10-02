import { useCallback, useSyncExternalStore } from 'react';

/**
 * Phones: anything below Radix Themes' `xs` breakpoint (520px).
 * Keep in step with the "Mobile" block at the end of globals.css.
 */
export const MOBILE_QUERY = '(max-width: 519px)';

/** Whether a media query matches, kept current as the viewport changes. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

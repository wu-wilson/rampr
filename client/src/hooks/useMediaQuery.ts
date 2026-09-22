import { useEffect, useState } from 'react';

/**
 * Track whether a CSS media query matches, updating as the viewport changes.
 * @param query - A media query list string, e.g. `(max-width: 559px)`
 * @returns True while the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = (): void => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}

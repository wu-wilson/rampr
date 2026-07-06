import { useEffect, useRef, useState, type RefObject } from 'react';

/** The measured content-box size of an element, in CSS pixels. */
interface ElementSize {
  width: number;
  height: number;
}

/**
 * Track an element's content-box size via `ResizeObserver`, re-rendering on resize. Lets a
 * chart derive pixel-exact geometry from the real container instead of a guessed viewBox.
 * @returns A tuple of the ref to attach and the current `{ width, height }` (both 0 until first measured)
 */
export function useElementSize<T extends HTMLElement>(): [RefObject<T>, ElementSize] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

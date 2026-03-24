import { useRef, useCallback } from 'react';

/**
 * Returns a debounced version of the given function.
 * Useful for preventing button spam / double-submit.
 *
 * @param {Function} fn  - The function to debounce
 * @param {number}   ms  - Cooldown in milliseconds (default 800ms)
 */
export function useDebounce(fn, ms = 800) {
  const busy = useRef(false);

  return useCallback(
    (...args) => {
      if (busy.current) return;
      busy.current = true;
      fn(...args);
      setTimeout(() => {
        busy.current = false;
      }, ms);
    },
    [fn, ms]
  );
}

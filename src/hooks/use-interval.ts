// src/hooks/use-interval.ts
import { useEffect, useRef } from 'react';

/**
 * A custom React hook that sets up an interval and cleans it up on unmount.
 * @param callback The function to be called on each interval.
 * @param delay The delay in milliseconds. If null, the interval is cleared.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
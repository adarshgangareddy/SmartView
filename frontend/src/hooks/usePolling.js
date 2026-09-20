import { useEffect, useRef } from 'react';

export const usePolling = (callback, intervalMs = 5000, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const tick = () => {
      // Pause polling if document is hidden to conserve bandwidth and battery
      if (document.hidden) return;
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
};

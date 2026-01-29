import { useCallback, useEffect, useRef, useState } from "react";

export function useSafeTransition<T extends (...args: any[]) => Promise<void> | void>(fn: T) {
  const lockRef = useRef(false);
  const mountedRef = useRef(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: Parameters<T>) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setPending(true);
      try {
        await fn(...args);
      } finally {
        if (mountedRef.current) {
          setPending(false);
        }
        lockRef.current = false;
      }
    },
    [fn]
  );

  return { run: run as T, pending };
}

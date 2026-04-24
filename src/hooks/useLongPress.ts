import { useCallback, useRef } from "react";

export function useLongPress<T>(onFire: (arg: T) => void, delay = 500) {
  const didFireRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  const start = useCallback(
    (arg: T) => {
      didFireRef.current = false;
      timerRef.current = setTimeout(() => {
        didFireRef.current = true;
        onFireRef.current(arg);
      }, delay);
    },
    [delay]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  return { start, cancel, didFireRef };
}

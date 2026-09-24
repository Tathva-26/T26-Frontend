import { useEffect } from "react";

/** Locks page scrolling while `locked` is true, restoring the previous value after. */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [locked]);
}

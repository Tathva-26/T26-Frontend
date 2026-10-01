import { useEffect } from "react";

/**
 * Locks page scrolling while `locked` is true, restoring the previous state
 * after. Covers both the document itself and the home page's Lenis-driven
 * scroll container (exposed as window.__lenis by SmoothScroll).
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";

    const lenis = window.__lenis;
    const stoppedLenis = Boolean(lenis && !lenis.isStopped);
    if (stoppedLenis) lenis.stop();

    return () => {
      root.style.overflow = previous;
      if (stoppedLenis) lenis.start();
    };
  }, [locked]);
}

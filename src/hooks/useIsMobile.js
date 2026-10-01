import { useEffect, useState } from "react";

export const MOBILE_BREAKPOINT = 768;

/**
 * True below MOBILE_BREAKPOINT px wide. Returns null until measured on the
 * client, so callers can hold off rendering either layout until then.
 *
 * `onBeforeChange`, if given, fires synchronously inside the native
 * matchMedia "change" listener - before the state update that triggers
 * React's re-render - so a caller that needs to tear something down (e.g.
 * killing a GSAP ScrollTrigger pinned to an element about to be
 * conditionally unmounted) can do so before React attempts to remove that
 * DOM node, rather than racing an effect cleanup against React's own
 * commit order.
 */
export function useIsMobile({ onBeforeChange } = {}) {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const apply = (matches) => {
      onBeforeChange?.(matches);
      setIsMobile(matches);
    };

    apply(query.matches);
    const handleChange = (event) => apply(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [onBeforeChange]);

  return isMobile;
}
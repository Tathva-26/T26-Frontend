import { useLayoutEffect, useState } from "react";

/**
 * Tracks an element's content-box size (padding excluded) as { width, height }.
 * Measured in a layout effect, so a client-side mount never paints a frame
 * without it. Returns null on the server, before the first measurement, and
 * while `enabled` is false.
 */
export function useElementSize(ref, enabled = true) {
  const [size, setSize] = useState(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return undefined;

    const update = () => {
      const style = getComputedStyle(element);
      const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      setSize((previous) =>
        previous && previous.width === width && previous.height === height ? previous : { width, height }
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      setSize(null);
    };
  }, [ref, enabled]);

  return size;
}

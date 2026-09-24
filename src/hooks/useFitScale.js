import { useEffect, useState } from "react";

/**
 * Returns the scale that fits a design-size box inside the viewport
 * (aspect ratio preserved). Returns 0 until measured on the client.
 */
export function useFitScale({ width, height }) {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const update = () => {
      setScale(Math.min(window.innerWidth / width, window.innerHeight / height));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [width, height]);

  return scale;
}

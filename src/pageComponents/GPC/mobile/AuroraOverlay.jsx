"use client";

import { useEffect, useRef } from "react";
import { mountAuroraOverlay } from "@/lib/nightScene/auroraOverlay";

/**
 * Animated aurora light layered on top of the real banner.png photo via
 * mix-blend-mode: screen - adds moving light without redrawing the scene.
 */
export default function AuroraOverlay({ getProgress }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const stop = mountAuroraOverlay(canvasRef.current, { getProgress });
    return stop;
  }, [getProgress]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
    />
  );
}
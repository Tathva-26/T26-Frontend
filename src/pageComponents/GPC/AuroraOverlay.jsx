"use client";

import { useEffect, useRef } from "react";
import { mountAuroraOverlay } from "@/lib/nightScene/auroraOverlay";

/**
 * Animated aurora light layered on top of the real banner.png photo via
 * mix-blend-mode: screen - adds moving light without redrawing the scene.
 * `paused` stops it while something else (the game overlay) covers it.
 */
export default function AuroraOverlay({ paused = false }) {
  const canvasRef = useRef(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const stop = mountAuroraOverlay(canvasRef.current, { isPaused: () => pausedRef.current });
    return stop;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
    />
  );
}

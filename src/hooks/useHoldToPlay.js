"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hold-to-confirm interaction. Holding Space (or calling start() from a
 * pointer/touch handler) runs a progress animation; onComplete fires once
 * when it fills. Releasing early cancels. Key auto-repeat is ignored.
 */
export default function useHoldToPlay({ duration = 1200, onProgress, onComplete }) {
  const [holding, setHolding] = useState(false);
  const rafRef = useRef(0);
  const activeRef = useRef(false);
  const cbRef = useRef({ onProgress, onComplete });

  useEffect(() => {
    cbRef.current = { onProgress, onComplete };
  });

  const cancel = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setHolding(false);
    cbRef.current.onProgress?.(0);
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setHolding(true);
    const t0 = performance.now();
    const tick = (now) => {
      if (!activeRef.current) return;
      const p = Math.min((now - t0) / duration, 1);
      cbRef.current.onProgress?.(p);
      if (p >= 1) {
        activeRef.current = false;
        setHolding(false);
        cbRef.current.onComplete?.();
        cbRef.current.onProgress?.(0);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    const isTyping = (el) =>
      el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    const down = (e) => {
      if (e.code !== "Space" || isTyping(e.target)) return;
      e.preventDefault(); // stop page scroll / button activation
      if (!e.repeat) start();
    };
    const up = (e) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      cancel();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", cancel);
      cancelAnimationFrame(rafRef.current);
      activeRef.current = false;
    };
  }, [start, cancel]);

  return { holding, start, cancel };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Stage from "@/pageComponents/GPC/Stage";
import ConsoleFrame from "./ConsoleFrame";
import { useFitScale } from "@/hooks/useFitScale";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useZoomTransition } from "@/pageComponents/GPC/hooks/useZoomTransition";
import { ASSETS, STAGE } from "@/pageComponents/GPC/gpcConfig";

const INITIAL_STATS = { phase: "ready", score: 0, lives: 3 };

/**
 * Lifecycle: closed -> opening (zoom in) -> playing -> closing (zoom out) -> closed.
 * `originRef` is the clickable console the zoom grows from and returns to.
 */
export default function GameOverlay({ open, originRef, onClosed }) {
  const [playing, setPlaying] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const backdropRef = useRef(null);
  const hasOpenedRef = useRef(false);

  const scale = useFitScale(STAGE);
  const zoom = useZoomTransition({ originRef, panelRef, backdropRef, stageScale: scale });
  useScrollLock(open);

  // Zoom in once the portal content exists.
  useEffect(() => {
    if (!open || !scale || hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    zoom.play("in", () => {
      setPlaying(true);
      rootRef.current?.focus();
    });
  }, [open, scale, zoom]);

  const handleExit = useCallback(() => {
    if (!playing) return;
    setPlaying(false);
    zoom.play("out", () => {
      hasOpenedRef.current = false;
      setStats(INITIAL_STATS);
      onClosed();
      originRef.current?.focus();
    });
  }, [playing, zoom, onClosed, originRef]);

  useEffect(() => {
    if (!playing) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && handleExit();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playing, handleExit]);

  if (!open) return null;

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Arcade game"
      tabIndex={-1}
      className="fixed inset-0 z-40 flex items-center justify-center outline-none"
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${ASSETS.backdrop})` }}
      />
      <Stage {...STAGE} scale={scale}>
        <ConsoleFrame
          panelRef={panelRef}
          active={playing}
          stats={stats}
          onStats={setStats}
          onExit={handleExit}
        />
      </Stage>
    </div>,
    document.body
  );
}

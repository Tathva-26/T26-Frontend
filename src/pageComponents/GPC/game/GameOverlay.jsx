"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import ConsoleScreenCanvas from "@/pageComponents/GPC/ConsoleScreenCanvas";
import ConsoleFrame from "./ConsoleFrame";
import { useFitScale } from "@/hooks/useFitScale";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useZoomTransition } from "@/pageComponents/GPC/hooks/useZoomTransition";
import { ASSETS, CONSOLE_SCREEN_INSET, GAME_BOX } from "@/pageComponents/GPC/gpcConfig";

const INITIAL_STATS = { phase: "ready", score: 0, highScore: 0, lives: 3 };

const screenRectStyle = {
  left: `${CONSOLE_SCREEN_INSET.left}%`,
  top: `${CONSOLE_SCREEN_INSET.top}%`,
  width: `${CONSOLE_SCREEN_INSET.width}%`,
  height: `${CONSOLE_SCREEN_INSET.height}%`,
};

/**
 * Lifecycle: closed -> opening (zoom in) -> playing -> closing (zoom out) -> closed.
 *
 * There's only ever ONE console image here (console.png - the same asset
 * the hero button shows), so nothing ever swaps to a different-looking
 * bezel. It just grows. No backdrop is painted behind it, so the rest of
 * the page (including the hero, still animating underneath) stays visible
 * around the console the whole time.
 *
 * `playing` flips true the INSTANT the console is clicked - not once the
 * zoom animation finishes - so the ambient scene stops and the real game
 * starts in parallel with the zoom, not gated on it settling.
 */
export default function GameOverlay({ open, originRef, onClosed }) {
  const [playing, setPlaying] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);

  const rootRef = useRef(null);
  const groupRef = useRef(null);
  const revealRef = useRef(null);
  const hasOpenedRef = useRef(false);

  const scale = useFitScale(GAME_BOX);
  const zoom = useZoomTransition({ originRef, groupRef, revealRef });
  useScrollLock(open);

  useLayoutEffect(() => {
    if (!open || !scale || hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    setPlaying(true);
    zoom.play("in", () => {
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

  // Not visible until scale is measured - nothing in this subtree (raw
  // console art included) can paint before this flips, so the cutout cover
  // below never needs to "win a race" against the console image; both are
  // gated behind the exact same visibility switch.
  const isVisible = Boolean(scale);

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
        ref={groupRef}
        className="relative"
        style={{
          width: GAME_BOX.width * scale,
          height: GAME_BOX.height * scale,
          visibility: isVisible ? "visible" : "hidden",
        }}
      >
        <Image
          src={ASSETS.console}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain"
        />

        {/* Pure CSS, opaque, no image fetch/decode/paint involved - cannot
            ever lag behind the console art rendering, unlike an
            <img>/<Image> which still needs a decode step. This guarantees
            console.png's baked-in screen art is never exposed, even under
            a slow first paint. */}
        <div
          className="absolute overflow-hidden rounded-[18px] bg-[#050414]"
          style={screenRectStyle}
          aria-hidden="true"
        />

        <ConsoleScreenCanvas backgroundOnly={playing} />

        <div ref={revealRef} className="absolute inset-0 opacity-0">
          <ConsoleFrame active={playing} stats={stats} onStats={setStats} onExit={handleExit} />
        </div>
      </div>
    </div>,
    document.body
  );
}
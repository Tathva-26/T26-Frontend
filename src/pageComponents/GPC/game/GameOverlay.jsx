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
 * zoom animation finishes. This does two things immediately, in parallel
 * with the zoom-in: `ConsoleScreenCanvas backgroundOnly` drops the
 * decorative ambient ship/enemies/bullets (only the starfield keeps
 * running), and `ConsoleFrame active` unpauses the real game. So what you
 * see enlarging is the real, playable game on the same starfield
 * background, not the ambient preview scene. Closing does the reverse
 * immediately: `playing` goes false as soon as exit is pressed, before the
 * shrink starts, so the ambient scene is what's animating on the way back
 * down.
 */
export default function GameOverlay({ open, originRef, onClosed }) {
  const [playing, setPlaying] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);

  const rootRef = useRef(null);
  const groupRef = useRef(null); // the single element that grows/shrinks
  const revealRef = useRef(null); // real HUD + exit button, as one fading unit
  const hasOpenedRef = useRef(false);

  const scale = useFitScale(GAME_BOX);
  const zoom = useZoomTransition({ originRef, groupRef, revealRef });
  useScrollLock(open);

  // useLayoutEffect, not useEffect: the starting (collapsed) transform must be
  // applied before the browser's first paint of this portal, or there's a
  // one-frame flash of it at full size before the animation "catches up".
  useLayoutEffect(() => {
    if (!open || !scale || hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    setPlaying(true); // stop the ambient scene and start the game right away - not gated on the zoom finishing
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
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {/* unoptimized: this is the exact same file HeroLayers already shows
            as a plain <img>, already cached by the browser by the time this
            is clicked. Routing it through next/image's optimizer instead
            requests a different, cold URL on first open - the delay you saw
            between the screen and the bezel growing together. */}
        <Image
          src={ASSETS.console}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain"
        />

        {/* console.png's screen cutout has decorative art baked into the PNG
            itself. Covers it for the one or two frames before the canvas
            below actually starts painting (IntersectionObserver + sprite
            loads are async). */}
        <div
          className="absolute overflow-hidden rounded-[18px] bg-cover bg-center"
          style={{ ...screenRectStyle, backgroundImage: `url(${ASSETS.spaceShooterBackground})` }}
          aria-hidden="true"
        />

        {/* Rendered directly here, NOT wrapped in another screenRectStyle
            div: it already positions + rounds itself with these same
            percentages, so an outer wrapper double-applies the inset,
            shrinking it into a stray rectangle - and overflow-hidden on such
            a wrapper also clips the spill canvas's bezel bleed, which needs
            to paint OUTSIDE this cutout. */}
        <ConsoleScreenCanvas backgroundOnly={playing} />

        <div ref={revealRef} className="absolute inset-0 opacity-0">
          <ConsoleFrame active={playing} stats={stats} onStats={setStats} onExit={handleExit} />
        </div>
      </div>
    </div>,
    document.body
  );
}
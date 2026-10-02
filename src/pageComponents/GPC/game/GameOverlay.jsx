"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import ConsoleScreenCanvas from "@/pageComponents/GPC/ConsoleScreenCanvas";
import ConsoleFrame from "./ConsoleFrame";
import { useElementSize } from "@/hooks/useElementSize";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useZoomTransition } from "@/pageComponents/GPC/hooks/useZoomTransition";
import { ASSETS, CONSOLE_SCREEN_INSET, GAME_BOX } from "@/pageComponents/GPC/gpcConfig";
import { pressStart2P } from "@/pageComponents/GPC/gpcFonts";

const INITIAL_STATS = { phase: "ready", score: 0, highScore: 0, lives: 3 };

const screenRectStyle = {
  left: `${CONSOLE_SCREEN_INSET.left}%`,
  top: `${CONSOLE_SCREEN_INSET.top}%`,
  width: `${CONSOLE_SCREEN_INSET.width}%`,
  height: `${CONSOLE_SCREEN_INSET.height}%`,
  borderRadius: CONSOLE_SCREEN_INSET.radius,
};

// The console is fitted inside this margin: a small gap on every side, or
// the device's safe area (notch, home indicator) where that is larger.
const FIT_PADDING = ["top", "right", "bottom", "left"]
  .map((side) => `max(8px, env(safe-area-inset-${side}))`)
  .join(" ");

/**
 * The game, full screen, as a modal dialog: a dimmed backdrop and the console
 * zoomed out of the hero's console (`originRef`). It sits above the site nav
 * (which goes up to z-[10002]) and below the page loader (z-[10050]).
 */
export default function GameOverlay({ open, originRef, onClosed, touchControls }) {
  const [playing, setPlaying] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);

  const rootRef = useRef(null);
  const fitRef = useRef(null);
  const backdropRef = useRef(null);
  const groupRef = useRef(null);
  const revealRef = useRef(null);
  const hasOpenedRef = useRef(false);

  const fit = useElementSize(fitRef, open);
  const scale = fit ? Math.max(0, Math.min(fit.width / GAME_BOX.width, fit.height / GAME_BOX.height)) : 0;
  const zoom = useZoomTransition({ originRef, groupRef, revealRef, backdropRef });
  useScrollLock(open);

  useLayoutEffect(() => {
    if (!open || !scale || hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    setPlaying(true);
    rootRef.current?.focus({ preventScroll: true });
    zoom.play("in");
  }, [open, scale, zoom]);

  const handleExit = useCallback(() => {
    if (!playing) return;
    setPlaying(false);
    zoom.play("out", () => {
      hasOpenedRef.current = false;
      setStats(INITIAL_STATS);
      onClosed();
    });
  }, [playing, zoom, onClosed]);

  useEffect(() => {
    if (!playing) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && handleExit();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playing, handleExit]);

  // Keep Tab inside the dialog while it is open.
  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const root = rootRef.current;
    const buttons = [...root.querySelectorAll("button")];
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const active = document.activeElement;
    const leaving = event.shiftKey ? active === first || active === root : active === last;
    if (!leaving) return;
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Arcade game"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={`fixed inset-0 z-[10040] touch-none overscroll-contain outline-none ${pressStart2P.variable}`}
    >
      <div
        ref={backdropRef}
        aria-hidden="true"
        onClick={handleExit}
        className="absolute inset-0 bg-[#05030d]/95 opacity-0"
      />

      <div
        ref={fitRef}
        className="pointer-events-none relative flex h-full w-full items-center justify-center"
        style={{ padding: FIT_PADDING }}
      >
        <div
          ref={groupRef}
          className="pointer-events-auto relative shrink-0"
          style={{
            width: GAME_BOX.width * scale,
            height: GAME_BOX.height * scale,
            visibility: scale ? "visible" : "hidden",
          }}
        >
          <Image src={ASSETS.console} alt="" fill unoptimized loading="eager" sizes="100vw" className="object-contain" />

          <div className="absolute overflow-hidden bg-[#050414]" style={screenRectStyle} aria-hidden="true" />

          <ConsoleScreenCanvas backgroundOnly={playing} />

          <div ref={revealRef} className="@container absolute inset-0 opacity-0">
            <ConsoleFrame
              active={playing}
              stats={stats}
              onStats={setStats}
              onExit={handleExit}
              touchControls={touchControls}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

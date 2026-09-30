"use client";

import { useEffect, useRef } from "react";
import { mountConsoleScreen } from "@/lib/consoleScreen/spaceShooterScreen";
import { CONSOLE_SCREEN_INSET } from "@/pageComponents/GPC/gpcConfig";

const screenRectStyle = {
  left: `${CONSOLE_SCREEN_INSET.left}%`,
  top: `${CONSOLE_SCREEN_INSET.top}%`,
  width: `${CONSOLE_SCREEN_INSET.width}%`,
  height: `${CONSOLE_SCREEN_INSET.height}%`,
};

/**
 * `backgroundOnly`: keeps just the starfield running and stops drawing the
 * decorative ship/enemies/bullets, so this same canvas can double as the
 * real game's animated background once the real, playable ship/enemies
 * (SpaceShooterCanvas, drawn on top with a transparent clear) take over.
 * Kept in a ref, updated from its own effect (not during render - refs
 * aren't meant to be written while rendering) so the mount effect below
 * can read a live value from its rAF loop without re-mounting the canvas.
 */
export default function ConsoleScreenCanvas({ backgroundOnly = false }) {
  const screenRef = useRef(null);
  const spillRef = useRef(null);
  const backgroundOnlyRef = useRef(backgroundOnly);

  useEffect(() => {
    backgroundOnlyRef.current = backgroundOnly;
  }, [backgroundOnly]);

  useEffect(() => {
    const stop = mountConsoleScreen(screenRef.current, {
      spill: spillRef.current,
      isBackgroundOnly: () => backgroundOnlyRef.current,
    });
    return stop;
  }, []);

  return (
    <>
      <canvas
        ref={spillRef}
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute mix-blend-screen opacity-85"
        style={{ ...screenRectStyle, filter: `blur(${CONSOLE_SCREEN_INSET.spillBlur}px)` }}
      />
      <canvas
        ref={screenRef}
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute"
        style={{ ...screenRectStyle, borderRadius: CONSOLE_SCREEN_INSET.radius }}
      />
    </>
  );
}
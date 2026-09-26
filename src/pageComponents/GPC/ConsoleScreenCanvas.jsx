"use client";

import { useEffect, useRef } from "react";
import { mountConsoleScreen } from "@/lib/consoleScreen/spaceShooterScreen";
import { HERO_SCREEN_INSET } from "@/pageComponents/GPC/gpcConfig";

const screenRectStyle = {
  left: `${HERO_SCREEN_INSET.left}%`,
  top: `${HERO_SCREEN_INSET.top}%`,
  width: `${HERO_SCREEN_INSET.width}%`,
  height: `${HERO_SCREEN_INSET.height}%`,
};

/**
 * The console's animated screen: a decorative space-shooter scene
 * (spaceShooterScreen.js), plus a blurred "spill" copy that bleeds its
 * light onto the bezel. Purely visual - no sound, no interaction.
 */
export default function ConsoleScreenCanvas() {
  const screenRef = useRef(null);
  const spillRef = useRef(null);

  useEffect(() => {
    const stop = mountConsoleScreen(screenRef.current, { spill: spillRef.current });
    return stop;
  }, []);

  return (
    <>
      <canvas
        ref={spillRef}
        aria-hidden="true"
        className="pointer-events-none absolute mix-blend-screen opacity-85"
        style={{ ...screenRectStyle, filter: `blur(${HERO_SCREEN_INSET.spillBlur}px)` }}
      />
      <canvas
        ref={screenRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ ...screenRectStyle, borderRadius: HERO_SCREEN_INSET.radius }}
      />
    </>
  );
}

"use client";

import AuroraOverlay from "./AuroraOverlay";
import ConsoleScreenCanvas from "@/pageComponents/GPC/ConsoleScreenCanvas";
import DragonLoop from "@/pageComponents/GPC/DragonLoop";
import { ASSETS, CLICK_TO_PLAY } from "@/pageComponents/GPC/gpcConfig";

/**
 * Mobile GPC hero: exactly one screen (100dvh), no scrolling.
 * Top to bottom: dragon (takes all spare height), console, GPC title,
 * tagline pinned at the very bottom. The console's height is capped by both
 * viewport height and width, so it keeps its 322:281 ratio on short phones.
 */
export default function HeroLayersMobile({ consoleRef, onPlay }) {
  return (
    <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#0a0518]">
      <img
        src={ASSETS.banner}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "35% 25%" }}
      />
      <AuroraOverlay getProgress={() => 0} />

      <div className="relative z-10 flex h-full flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Dragon: fills whatever height the rest doesn't need */}
        <div className="relative min-h-0 w-full flex-1">
          <DragonLoop className="absolute inset-0 h-full w-full object-contain" />
        </div>

        <div
          ref={consoleRef}
          className="relative shrink-0"
          style={{ height: "min(30dvh, 69.8vw)", aspectRatio: "322 / 281" }}
        >
          <button
            type="button"
            onClick={onPlay}
            aria-label="Play the arcade game"
            className="absolute inset-0 cursor-pointer outline-none"
          >
            <img src={ASSETS.console} alt="" className="h-full w-full object-contain" />
          </button>
          <ConsoleScreenCanvas />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 text-center leading-relaxed tracking-[0.1em] text-white [text-shadow:0_0_4px_rgba(0,0,0,0.9)] motion-safe:animate-pulse"
            style={{ top: `${CLICK_TO_PLAY.top}%`, fontSize: CLICK_TO_PLAY.fontSize, fontFamily: "var(--font-pixel)" }}
          >
            [TAP TO PLAY]
          </span>
        </div>

        <h1
          className="mt-3 shrink-0 text-[clamp(2.5rem,13vw,4rem)] leading-none text-white"
          style={{ fontFamily: "var(--font-akira)" }}
        >
          GPC
        </h1>

        <p
          className="mt-3 max-w-[26ch] shrink-0 text-center text-[clamp(1rem,4.6vw,1.3rem)] uppercase leading-tight text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Show off your skills and conquer the arena
        </p>
      </div>
    </section>
  );
}
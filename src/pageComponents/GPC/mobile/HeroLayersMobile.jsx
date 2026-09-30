"use client";

import { useRef } from "react";
import AuroraOverlay from "./AuroraOverlay";
import ConsoleScreenCanvas from "@/pageComponents/GPC/ConsoleScreenCanvas";
import { useMobileDragonScroll } from "./useMobileDragonScroll";
import { ASSETS, CLICK_TO_PLAY } from "@/pageComponents/GPC/gpcConfig";

/**
 * Mobile GPC hero - fluid layout, not the desktop's fixed-pixel scaled
 * Stage. Background is the same banner.png desktop uses, with an animated
 * aurora canvas (AuroraOverlay) blended on top for movement.
 *
 * The console straddles the boundary between the image section and the
 * text section below it (top-full + -translate-y-1/2 bisects it exactly
 * on that line). Because the console's width - and so its height, at a
 * fixed 322:281 aspect ratio - is a percentage of the full-bleed section
 * width, the text section's top padding is expressed in the same vw units
 * (console height fraction / 2, plus a breathing-room gap) so the two
 * stay in proportion at any viewport width instead of drifting apart.
 *
 * TODO: logo mark asset not yet provided - placeholder div below.
 */
export default function HeroLayersMobile({ consoleRef, onPlay }) {
  const sectionRef = useRef(null);
  const dragonRef = useRef(null);
  const getProgress = useMobileDragonScroll(sectionRef, dragonRef);

  return (
    <section ref={sectionRef} className="relative flex w-full flex-col overflow-hidden bg-[#0a0518]">
      <div className="relative z-30 flex items-center justify-between px-6 py-4">
        <div className="h-8 w-8 rounded-full border border-white/30" aria-label="GPC logo" />
        <button type="button" aria-label="Open menu" className="flex flex-col gap-1.5 p-2">
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
        </button>
      </div>

      <div className="relative z-20 aspect-[3/4] w-full">
        <img
          src={ASSETS.banner}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "35% 25%" }}
        />
        <AuroraOverlay getProgress={getProgress} />

        <img
          ref={dragonRef}
          src={ASSETS.dragon}
          alt=""
          className="absolute left-1/2 top-[38%] w-[85%] -translate-x-1/2 -translate-y-1/2"
        />

        <div
          ref={consoleRef}
          className="absolute left-1/2 top-full aspect-[322/281] w-[78%] -translate-x-1/2 -translate-y-1/2"
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
            [CLICK TO PLAY]
          </span>
        </div>
      </div>

      {/* pt-[40vw]: half the console's own height (~34vw, from 78% width
          at a 322:281 aspect ratio) plus a ~6vw gap, so this clears the
          console's downward overlap proportionally at any width. */}
      <div className="relative z-10 flex flex-col items-center gap-4 bg-[#0a0518] px-6 pb-14 pt-[40vw] text-center text-white">
        <h1 className="text-[clamp(3.5rem,20vw,5rem)] leading-none" style={{ fontFamily: "var(--font-akira)" }}>
          GPC
        </h1>
        <span
          className="border border-white px-3 py-1 text-[clamp(0.9rem,4vw,1.1rem)] tracking-wide"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          EXPLORE MORE →
        </span>
        <p
          className="mt-8 max-w-[26ch] text-[clamp(1.1rem,5vw,1.4rem)] uppercase leading-tight"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Show off your skills and conquer the arena
        </p>
      </div>
    </section>
  );
}
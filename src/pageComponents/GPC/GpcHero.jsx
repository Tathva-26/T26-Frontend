"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameOverlay from "@/pageComponents/GPC/game/GameOverlay";
import HeroLayers from "./HeroLayers";
import HeroLayersMobile from "./mobile/HeroLayersMobile";
import { useGpcLayout } from "@/pageComponents/GPC/hooks/useGpcLayout";
import { useGpcScrollSequence } from "@/pageComponents/GPC/hooks/useGpcScrollSequence";
import { useTouchControls } from "@/pageComponents/GPC/hooks/useTouchControls";
import { pressStart2P } from "@/pageComponents/GPC/gpcFonts";
import "@/pageComponents/GPC/gpc.css";

/**
 * The GPC hero: one screen that never scrolls inside itself.
 *
 * The outer track is what occupies the page. On the home page it is several
 * screens tall, and the stage inside it sticks to the top of the screen while
 * the scroll sequence plays (see gpc.css and useGpcScrollSequence); anywhere
 * else it is one screen and the stage simply fills it.
 *
 * Both are always rendered at their full height - on the server and on the
 * very first client render too - so the page around GPC never sees it at
 * zero height; only the hero's contents wait for the layout to be measured.
 * The game overlay sits outside the layout switch, so resizing or rotating
 * between layouts doesn't restart a game in progress.
 */
export default function GpcHero() {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const consoleRef = useRef(null);
  const wasOpenRef = useRef(false);
  // What the scroll sequence drives and the console's screen reads every
  // frame. These defaults are the finished hero: screen on, showing the game.
  const sequenceRef = useRef({ power: 1, outro: 0, film: 0, picture: null });
  const [gameOpen, setGameOpen] = useState(false);

  const layout = useGpcLayout(heroRef);
  const touch = useTouchControls();
  useGpcScrollSequence({ trackRef, stageRef, layout, sequence: sequenceRef });

  const openGame = useCallback(() => setGameOpen(true), []);
  const closeGame = useCallback(() => setGameOpen(false), []);

  // Hand keyboard focus back to the console once it is visible again.
  useEffect(() => {
    if (wasOpenRef.current && !gameOpen) {
      consoleRef.current?.querySelector("button")?.focus({ preventScroll: true });
    }
    wasOpenRef.current = gameOpen;
  }, [gameOpen]);

  const hero = {
    consoleRef,
    onPlay: openGame,
    consoleHidden: gameOpen,
    paused: gameOpen,
    touch,
    sequence: sequenceRef,
  };

  return (
    <section ref={trackRef} className="gpc-track w-full">
      <div ref={stageRef} className={`gpc-stage sticky top-0 h-dvh w-full overflow-hidden ${pressStart2P.variable}`}>
        <div
          ref={heroRef}
          data-gpc="hero"
          className="gpc-section absolute inset-0 flex items-center justify-center overflow-hidden bg-[#101010]"
        >
          {layout?.mode === "stage" && <HeroLayers scale={layout.scale} {...hero} />}
          {layout?.mode === "stacked" && <HeroLayersMobile {...hero} />}

          {/* The Wheels footage the home page scroll sequence zooms into. It sits
              over the console's screen and is placed, shown and drawn by the
              sequence; anywhere else it stays hidden. */}
          <canvas data-gpc="film" aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 z-20" />
        </div>

        {/* The glow of the old-TV switch-off at the start of that sequence. It
            sits over the console's screen, outside the hero because the hero
            has a hole cut in it there. */}
        <div data-gpc="flash" aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0" />
      </div>

      <GameOverlay open={gameOpen} originRef={consoleRef} onClosed={closeGame} touchControls={touch} />
    </section>
  );
}

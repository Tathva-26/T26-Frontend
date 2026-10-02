"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameOverlay from "@/pageComponents/GPC/game/GameOverlay";
import HeroLayers from "./HeroLayers";
import HeroLayersMobile from "./mobile/HeroLayersMobile";
import { useGpcLayout } from "@/pageComponents/GPC/hooks/useGpcLayout";
import { useTouchControls } from "@/pageComponents/GPC/hooks/useTouchControls";
import { pressStart2P } from "@/pageComponents/GPC/gpcFonts";
import "@/pageComponents/GPC/gpc.css";

/**
 * One screen, no scrolling. The section is always rendered at full height -
 * on the server and on the very first client render too - so the page around
 * it never sees it at zero height; only its contents wait for the layout to
 * be measured. The game overlay sits outside the layout switch, so resizing
 * or rotating between layouts doesn't restart a game in progress.
 */
export default function GpcHero() {
  const sectionRef = useRef(null);
  const consoleRef = useRef(null);
  const wasOpenRef = useRef(false);
  const [gameOpen, setGameOpen] = useState(false);

  const layout = useGpcLayout(sectionRef);
  const touch = useTouchControls();

  const openGame = useCallback(() => setGameOpen(true), []);
  const closeGame = useCallback(() => setGameOpen(false), []);

  // Hand keyboard focus back to the console once it is visible again.
  useEffect(() => {
    if (wasOpenRef.current && !gameOpen) {
      consoleRef.current?.querySelector("button")?.focus({ preventScroll: true });
    }
    wasOpenRef.current = gameOpen;
  }, [gameOpen]);

  const hero = { consoleRef, onPlay: openGame, consoleHidden: gameOpen, paused: gameOpen, touch };

  return (
    <section
      ref={sectionRef}
      className={`gpc-section relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#101010] ${pressStart2P.variable}`}
    >
      {layout?.mode === "stage" && <HeroLayers scale={layout.scale} {...hero} />}
      {layout?.mode === "stacked" && <HeroLayersMobile {...hero} />}

      <GameOverlay open={gameOpen} originRef={consoleRef} onClosed={closeGame} touchControls={touch} />
    </section>
  );
}

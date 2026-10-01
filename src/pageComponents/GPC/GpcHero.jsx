"use client";

import { useCallback, useRef, useState } from "react";
import Stage from "@/pageComponents/GPC/Stage";
import GameOverlay from "@/pageComponents/GPC/game/GameOverlay";
import HeroLayers from "./HeroLayers";
import HeroLayersMobile from "./mobile/HeroLayersMobile";
import { useFitScale } from "@/hooks/useFitScale";
import { useIsMobile } from "@/hooks/useIsMobile";
import { STAGE } from "@/pageComponents/GPC/gpcConfig";
import { orbitron, hammersmithOne, pressStart2P } from "@/pageComponents/GPC/gpcFonts";
import "@/pageComponents/GPC/gpc.css";

/**
 * One screen, no scrolling. html/body are overflow:hidden in globals.css and
 * we leave that alone, so no scroll-unlock or scroll timeline is needed.
 */
export default function GpcHero() {
  const consoleRef = useRef(null);
  const [gameOpen, setGameOpen] = useState(false);

  const isMobile = useIsMobile();
  const scale = useFitScale(STAGE);

  const openGame = useCallback(() => setGameOpen(true), []);
  const closeGame = useCallback(() => setGameOpen(false), []);

  const fontVars = `${orbitron.variable} ${hammersmithOne.variable} ${pressStart2P.variable}`;

  if (isMobile === null) return null;

  if (isMobile) {
    return (
      <div className={fontVars}>
        <HeroLayersMobile consoleRef={consoleRef} onPlay={openGame} />
        <GameOverlay open={gameOpen} originRef={consoleRef} onClosed={closeGame} isMobile={isMobile} />
      </div>
    );
  }

  return (
    <section
      className={`relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#101010] ${fontVars}`}
    >
      <Stage {...STAGE} scale={scale}>
        <HeroLayers consoleRef={consoleRef} onPlay={openGame} />
      </Stage>

      <GameOverlay open={gameOpen} originRef={consoleRef} onClosed={closeGame} isMobile={isMobile} />
    </section>
  );
}
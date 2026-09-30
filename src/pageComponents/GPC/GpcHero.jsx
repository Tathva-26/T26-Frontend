"use client";

import { useCallback, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Stage from "@/pageComponents/GPC/Stage";
import GameOverlay from "@/pageComponents/GPC/game/GameOverlay";
import HeroLayers from "./HeroLayers";
import HeroLayersMobile from "./mobile/HeroLayersMobile";
import { useFitScale } from "@/hooks/useFitScale";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePageScrollUnlock } from "@/hooks/usePageScrollUnlock";
import { useHeroTimeline } from "@/pageComponents/GPC/hooks/useHeroTimeline";
import { STAGE } from "@/pageComponents/GPC/gpcConfig";
import { orbitron, hammersmithOne, pressStart2P } from "@/pageComponents/GPC/gpcFonts";
import "@/pageComponents/GPC/gpc.css";

export default function GpcHero() {
  const rootRef = useRef(null);
  const consoleRef = useRef(null);
  const [gameOpen, setGameOpen] = useState(false);

  const killActiveScrollTriggers = useCallback(() => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }, []);

  usePageScrollUnlock();
  const isMobile = useIsMobile({ onBeforeChange: killActiveScrollTriggers });
  const scale = useFitScale(STAGE);
  useHeroTimeline(rootRef, { enabled: isMobile === false });

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
      ref={rootRef}
      className={`relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#101010] ${fontVars}`}
    >
      <Stage {...STAGE} scale={scale}>
        <HeroLayers consoleRef={consoleRef} onPlay={openGame} />
      </Stage>

      <GameOverlay open={gameOpen} originRef={consoleRef} onClosed={closeGame} isMobile={isMobile} />
    </section>
  );
}
"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";
import Stage from "@/pageComponents/GPC/Stage";
import GameOverlay from "@/pageComponents/GPC/game/GameOverlay";
import HeroLayers from "./HeroLayers";
import { useFitScale } from "@/hooks/useFitScale";
import {
  useHeroTimeline,
} from "@/pageComponents/GPC/hooks/useHeroTimeline";
import { STAGE } from "@/pageComponents/GPC/gpcConfig";

export default function GpcHero() {
  const rootRef = useRef(null);
  const consoleRef = useRef(null);

  const [gameOpen, setGameOpen] =
    useState(false);

  const scale = useFitScale(STAGE);

  useHeroTimeline(rootRef);

  const openGame = useCallback(() => {
    setGameOpen(true);
  }, []);

  const closeGame = useCallback(() => {
    setGameOpen(false);
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#101010]"
    >
      <Stage
        {...STAGE}
        scale={scale}
      >
        <HeroLayers
          consoleRef={consoleRef}
          onPlay={openGame}
        />
      </Stage>

      <GameOverlay
        open={gameOpen}
        originRef={consoleRef}
        onClosed={closeGame}
      />
    </section>
  );
}
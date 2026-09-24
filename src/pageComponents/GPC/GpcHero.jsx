"use client";

import { useRef, useState } from "react";
import Stage from "@/pageComponents/GPC/Stage";
import GameOverlay from "@/pageComponents/GPC/game/GameOverlay";
import HeroLayers from "./HeroLayers";
import { useFitScale } from "@/hooks/useFitScale";
import { useHeroTimeline } from "@/pageComponents/GPC/hooks/useHeroTimeline";
import { STAGE } from "@/pageComponents/GPC/gpcConfig";

export default function GpcHero() {
  const rootRef = useRef(null);
  const consoleRef = useRef(null);
  const [gameOpen, setGameOpen] = useState(false);

  const scale = useFitScale(STAGE);
  useHeroTimeline(rootRef);

  return (
    <section
      ref={rootRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#101010]"
    >
      <Stage {...STAGE} scale={scale}>
        <HeroLayers consoleRef={consoleRef} onPlay={() => setGameOpen(true)} />
      </Stage>

      <GameOverlay
        open={gameOpen}
        originRef={consoleRef}
        onClosed={() => setGameOpen(false)}
      />
    </section>
  );
}

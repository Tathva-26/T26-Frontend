"use client";

import { useEffect, useRef } from "react";
import { createSpaceShooter } from "@/lib/spaceShooter/engine";
import { SPRITE_PATHS } from "@/pageComponents/GPC/gpcConfig";

/** Mounts the engine, keeps it sized to its container, and pauses it when inactive. */
export default function SpaceShooterCanvas({ active, onStats }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = createSpaceShooter(canvas, { onStats, spritePaths: SPRITE_PATHS });
    engineRef.current = engine;

    const observer = new ResizeObserver(([entry]) => engine.resize(entry.contentRect.width));
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [onStats]);

  useEffect(() => {
    engineRef.current?.setPaused(!active);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      onClick={() => engineRef.current?.start()}
      className="block h-full w-full"
    />
  );
}

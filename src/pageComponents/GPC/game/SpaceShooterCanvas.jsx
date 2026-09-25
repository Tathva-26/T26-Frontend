"use client";

import {
  useEffect,
  useRef,
} from "react";
import {
  SPRITE_PATHS,
} from "@/pageComponents/GPC/gpcConfig";
import {
  createSpaceShooter,
} from "@/lib/spaceShooter/game";

export default function SpaceShooterCanvas({
  active,
  interactive = true,
  onStats,
}) {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;

    if (!canvas || !host) {
      return undefined;
    }

    const game = createSpaceShooter(
      canvas,
      {
        onStats,
        spritePaths: SPRITE_PATHS,
      }
    );

    gameRef.current = game;

    const resize = () => {
      const width =
        host.getBoundingClientRect()
          .width;

      if (width > 0) {
        game.resize(width);
      }
    };

    const observer =
      new ResizeObserver(resize);

    observer.observe(host);
    resize();

    return () => {
      observer.disconnect();
      game.destroy();
      gameRef.current = null;
    };
  }, [onStats]);

  useEffect(() => {
    gameRef.current?.setPaused(
      !active || !interactive
    );
  }, [active, interactive]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        aria-label="Space shooter game"
        className="block h-auto w-full"
      />
    </div>
  );
}
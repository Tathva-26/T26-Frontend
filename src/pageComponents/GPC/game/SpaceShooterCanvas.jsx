"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { SPRITE_PATHS } from "@/lib/spaceShooter/constants";
import { createSpaceShooter } from "@/lib/spaceShooter/engine";
import { haptics } from "@/lib/haptics";

const SpaceShooterCanvas = forwardRef(function SpaceShooterCanvas({ active, onStats }, ref) {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;

    if (!canvas || !host) {
      return undefined;
    }

    const game = createSpaceShooter(canvas, {
      onStats,
      onHit: () => haptics.select(),
      spritePaths: SPRITE_PATHS,
    });

    gameRef.current = game;

    // clientWidth and ResizeObserver report the layout size, which the
    // overlay's zoom transform doesn't change - so the canvas is sized for
    // the full console even though it mounts while that zoom is tiny.
    const resize = () => {
      const width = host.clientWidth;
      if (width > 0) {
        game.resize(width);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    return () => {
      observer.disconnect();
      game.destroy();
      gameRef.current = null;
    };
  }, [onStats]);

  useEffect(() => {
    gameRef.current?.setPaused(!active);
  }, [active]);

  useImperativeHandle(ref, () => ({
    start: () => gameRef.current?.start(),
    setFiring: (isDown) => gameRef.current?.setFiring(isDown),
    setJoystick: (x, y) => gameRef.current?.setJoystick(x, y),
  }));

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-label="Space shooter game"
        className="block h-auto w-full"
      />
    </div>
  );
});

export default SpaceShooterCanvas;

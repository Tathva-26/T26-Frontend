"use client";

import { useEffect, useRef } from "react";
import { DRAGON_FRAMES, DRAGON_FPS, DRAGON_SIZE } from "@/pageComponents/GPC/gpcConfig";

/**
 * The dragon: loops DRAGON_FRAMES at DRAGON_FPS (a single frame is just a
 * still image). The box always has the image's own proportions, so the caller
 * only gives it a position and a width.
 */
export default function DragonLoop({ className = "", style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;
    let animationId;

    const loadFrames = async () => {
      const frames = await Promise.all(
        DRAGON_FRAMES.map(async (src) => {
          const image = new Image();
          image.src = src;
          try {
            await image.decode();
          } catch {
            return image;
          }
          return image;
        }),
      );

      if (!active) return;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || !frames[0]?.naturalWidth) return;

      let frameIndex = 0;
      let lastTime = 0;
      let elapsed = 0;
      const frameDuration = 1000 / DRAGON_FPS;

      const draw = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(frames[frameIndex], 0, 0, canvas.width, canvas.height);
      };

      const animate = (now) => {
        if (!active) return;
        if (lastTime === 0) lastTime = now;
        elapsed += now - lastTime;
        lastTime = now;

        const framesToAdvance = Math.floor(elapsed / frameDuration);
        if (framesToAdvance > 0) {
          frameIndex = (frameIndex + framesToAdvance) % frames.length;
          elapsed -= framesToAdvance * frameDuration;
          draw();
        }

        animationId = requestAnimationFrame(animate);
      };

      draw();
      animationId = requestAnimationFrame(animate);
    };

    if (DRAGON_FRAMES.length > 1) loadFrames();

    return () => {
      active = false;
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      className={className}
      style={{ aspectRatio: `${DRAGON_SIZE.width} / ${DRAGON_SIZE.height}`, ...style }}
    >
      <canvas
        ref={canvasRef}
        width={DRAGON_SIZE.width}
        height={DRAGON_SIZE.height}
        aria-hidden="true"
        className="h-full w-full"
      />
    </div>
  );
}

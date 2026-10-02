"use client";

import { useEffect, useState } from "react";
import { DRAGON_FRAMES, DRAGON_FPS, DRAGON_SIZE } from "@/pageComponents/GPC/gpcConfig";

/**
 * The dragon: loops DRAGON_FRAMES at DRAGON_FPS (a single frame is just a
 * still image). The box always has the image's own proportions, so the caller
 * only gives it a position and a width.
 */
export default function DragonLoop({ className = "", style }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    DRAGON_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    if (DRAGON_FRAMES.length < 2) return undefined;
    const id = setInterval(() => setIndex((n) => (n + 1) % DRAGON_FRAMES.length), 1000 / DRAGON_FPS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={className}
      style={{ aspectRatio: `${DRAGON_SIZE.width} / ${DRAGON_SIZE.height}`, ...style }}
    >
      <img src={DRAGON_FRAMES[index]} alt="" draggable={false} className="h-full w-full" />
    </div>
  );
}

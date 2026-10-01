"use client";

import { useEffect, useState } from "react";
import { DRAGON_FRAMES, DRAGON_FPS } from "@/pageComponents/GPC/gpcConfig";

/** Loops DRAGON_FRAMES at DRAGON_FPS. With a single frame it's just an <img>. */
export default function DragonLoop({ className, style }) {
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

  return <img src={DRAGON_FRAMES[index]} alt="" className={className} style={style} draggable={false} />;
}
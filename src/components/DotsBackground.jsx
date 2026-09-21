"use client";

import React, { useEffect, useRef } from "react";

/**
 * Interactive dot-grid background (canvas). Dots only.
 *  - The dots always stay WHITE, whatever else is on the page.
 *  - They light up around the pointer wherever it is inside the container,
 *    whether or not it is over the letters (they don't depend on <GlowLetters />).
 * Place it inside a `position: relative` container that has a height.
 */
export function DotsBackground({
  gap = 16,               // distance between dots (px)
  size = 1.3,             // resting dot radius (px)
  hoverSize = 2.2,        // dot radius at full glow (px)
  radius = 220,           // reach of the hover glow (px)
  baseAlpha = 0.12,       // resting dot opacity
  glowAlpha = 0.5,        // dot opacity at full glow
  ease = 0.3,             // 0–1: higher = snappier response, lower = longer, softer fade trail
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, cols = 0, rows = 0;
    let level = new Float32Array(0); // current glow (0–1) per dot
    const pointer = { x: -9999, y: -9999, on: false };
    let raf = 0;

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / gap) + 1;
      rows = Math.ceil(h / gap) + 1;
      level = new Float32Array(cols * rows);
      start();
    };

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const r2 = radius * radius;
      let busy = false;

      // resting dots in one batched path (always white)
      ctx.fillStyle = `rgba(255,255,255,${baseAlpha})`;
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i;
          const x = i * gap;
          const y = j * gap;

          let target = 0;
          if (pointer.on) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < r2) {
              const t = 1 - Math.sqrt(d2) / radius;
              target = t * t * (3 - 2 * t); // smooth falloff
            }
          }

          let l = level[idx];
          l += (target - l) * ease;
          if (l < 0.004 && target === 0) l = 0;
          level[idx] = l;
          if (l > 0 || target > 0) busy = true;

          if (l === 0) {
            ctx.moveTo(x + size, y);
            ctx.arc(x, y, size, 0, Math.PI * 2);
          }
        }
      }
      ctx.fill();

      // glowing dots drawn individually (white)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const l = level[j * cols + i];
          if (l === 0) continue;
          const a = baseAlpha + (glowAlpha - baseAlpha) * l;
          const rad = size + (hoverSize - size) * l;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(i * gap, j * gap, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = busy ? requestAnimationFrame(frame) : 0; // idle = zero CPU
    }

    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on =
        pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height;
      if (!reduceMotion) start();
    };

    const leave = () => {
      pointer.on = false;
      start();
    };

    // Listening on window so the dots react anywhere in the container,
    // even when letters or other content sit on top of the canvas
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);

    // Re-measure whenever the canvas box changes size (covers window resize too)
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    resize();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, [gap, size, hoverSize, radius, baseAlpha, glowAlpha, ease]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // content above it stays clickable
        zIndex: 0,
      }}
    />
  );
}

/**
 * Default export = full-screen demo: dark page with the dots covering it.
 * Run this file as-is and move your mouse.
 * To reuse elsewhere, import { DotsBackground } instead.
 */
export default function App() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "#161616",
        overflow: "hidden",
      }}
    >
      <DotsBackground />
    </div>
  );
}
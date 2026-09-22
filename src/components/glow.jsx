"use client";

import React, { useEffect, useRef } from "react";
import { light } from "./lightstate.jsx";

const RAMP = [
  [24, 132, 255], // blue
  [240, 52, 70],  // red
  [255, 110, 24], // orange
  [255, 196, 20], // yellow
];

function rampColor(ramp, t) {
  const x = Math.min(0.9999, Math.max(0, t)) * (ramp.length - 1);
  const i = x | 0;
  const f = x - i;
  const a = ramp[i];
  const b = ramp[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const WINDOW = 0.55;

export function GlowLetters({
  text = "ASTERIA",
  imageSrc = "",
  textColor = "transparent",
  textFit = 1,
  textY = 0.5,
  fontFamily = "'Akira Expanded', 'Anton', sans-serif",
  fontWeight = 800,
  fontSize,
  textYOffset = 0,
  radius = 170,
  intensity = 0.75,
  follow = 1,
  fadeIn = 0.3,
  fadeOut = 0.1,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const textLayer = document.createElement("canvas");
    const baseLayer = document.createElement("canvas");
    const litCanvas = document.createElement("canvas");
    const litCtx = litCanvas.getContext("2d");

    const noise = document.createElement("canvas");
    noise.width = noise.height = 96;
    {
      const n = noise.getContext("2d");
      const id = n.createImageData(96, 96);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 255;
      }
      n.putImageData(id, 0, 0);
    }
    const grain = litCtx.createPattern(noise, "repeat");

    let w = 0, h = 0, dpr = 1;
    let raf = 0;
    let hover = 0;
    let cancelled = false;
    let img = null;

    const pointer = { x: -9999, y: -9999, on: false };
    const lens = { x: 0, y: 0 };

    const look = { ramp: RAMP, angle: 0, spin: 0.4, phase: 0, slide: 0.4 };
    const newLook = () => {
      look.ramp = Math.random() < 0.5 ? RAMP : RAMP.slice().reverse();
      look.angle = Math.random() * Math.PI * 2;
      look.spin = (0.3 + Math.random() * 0.3) * (Math.random() < 0.5 ? 1 : -1);
      look.phase = Math.random() * Math.PI * 2;
      look.slide = 0.35 + Math.random() * 0.3;
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const cw = Math.max(1, Math.round(w * dpr));
      const ch = Math.max(1, Math.round(h * dpr));
      canvas.width = cw;
      canvas.height = ch;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      litCanvas.width = cw;
      litCanvas.height = ch;
      litCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      textLayer.width = cw;
      textLayer.height = ch;
      const t = textLayer.getContext("2d");
      t.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      if (img) {
        let dw = w * textFit;
        let dh = (dw * img.naturalHeight) / img.naturalWidth;
        if (dh > h * 0.95) {
          dh = h * 0.95;
          dw = (dh * img.naturalWidth) / img.naturalHeight;
        }
        t.drawImage(img, (w - dw) / 2, h * textY - dh / 2, dw, dh);
      } else {
        // Calculate font size exactly matching Tailwind text-[15vw] / sm:text-[14vw] / lg:text-[150px] / xl:text-[180px]
        let fontPx = fontSize ?? w * 0.15;
        if (fontSize === undefined) {
          if (w >= 640 && w < 1024) fontPx = w * 0.14;
          if (w >= 1024 && w < 1280) fontPx = 150;
          if (w >= 1280) fontPx = 180;
        }

        t.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
        t.textAlign = "center";
        
        // Use alphabetic baseline with line-height offset calculation for exact HTML h2 overlay
        t.textBaseline = "alphabetic";
        t.fillStyle = "#fff";

        // Align the canvas ink to the center of the heading line box.
        const metrics = t.measureText(text);
        const textYPos = h * textY + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2 + textYOffset;
        t.fillText(text, w / 2, textYPos);
      }

      baseLayer.width = cw;
      baseLayer.height = ch;
      const b = baseLayer.getContext("2d");
      b.drawImage(textLayer, 0, 0);
      b.globalCompositeOperation = "source-in";
      b.fillStyle = textColor;
      b.fillRect(0, 0, cw, ch);

      start();
    };

    function frame(now) {
      const time = now / 1000;

      hover += ((pointer.on ? 1 : 0) - hover) * (pointer.on ? fadeIn : fadeOut);
      if (!pointer.on && hover < 0.004) hover = 0;

      const f = reduceMotion ? 1 : follow;
      lens.x += (pointer.x - lens.x) * f;
      lens.y += (pointer.y - lens.y) * f;

      ctx.clearRect(0, 0, w, h);

      const R = radius * (0.85 + 0.15 * hover);
      const rx = Math.max(0, Math.floor(lens.x - R));
      const ry = Math.max(0, Math.floor(lens.y - R));
      const rw = Math.min(w, Math.ceil(lens.x + R)) - rx;
      const rh = Math.min(h, Math.ceil(lens.y + R)) - ry;

      ctx.drawImage(baseLayer, 0, 0, w, h);

      const ang = reduceMotion ? look.angle : look.angle + look.spin * time;
      const slide = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time * look.slide + look.phase);
      const from = slide * (1 - WINDOW);

      const box = canvas.getBoundingClientRect();
      if (light) {
        light.x = box.left + lens.x;
        light.y = box.top + lens.y;
        light.hover = hover;
        light.R = R;
        light.angle = ang;
      }

      if (hover > 0 && rw > 0 && rh > 0) {
        const dx = Math.cos(ang) * R * 1.1;
        const dy = Math.sin(ang) * R * 1.1;
        litCtx.globalCompositeOperation = "source-over";
        litCtx.globalAlpha = 1;
        litCtx.clearRect(rx, ry, rw, rh);
        const lg = litCtx.createLinearGradient(lens.x - dx, lens.y - dy, lens.x + dx, lens.y + dy);
        for (let i = 0; i <= 4; i++) {
          const u = i / 4;
          lg.addColorStop(u, rgba(rampColor(look.ramp, from + u * WINDOW), 1));
        }
        litCtx.fillStyle = lg;
        litCtx.fillRect(rx, ry, rw, rh);

        litCtx.globalCompositeOperation = "source-atop";
        litCtx.globalAlpha = 0.04;
        litCtx.fillStyle = grain;
        litCtx.fillRect(rx, ry, rw, rh);
        litCtx.globalAlpha = 1;

        litCtx.globalCompositeOperation = "destination-in";
        const mg = litCtx.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, R);
        mg.addColorStop(0, "rgba(0,0,0,1)");
        mg.addColorStop(0.55, "rgba(0,0,0,1)");
        mg.addColorStop(0.75, "rgba(0,0,0,0.85)");
        mg.addColorStop(0.9, "rgba(0,0,0,0.35)");
        mg.addColorStop(1, "rgba(0,0,0,0)");
        litCtx.fillStyle = mg;
        litCtx.fillRect(rx, ry, rw, rh);

        litCtx.drawImage(textLayer, rx * dpr, ry * dpr, rw * dpr, rh * dpr, rx, ry, rw, rh);
        litCtx.globalCompositeOperation = "source-over";

        ctx.globalAlpha = intensity * Math.min(1, hover * 1.4);
        ctx.drawImage(litCanvas, rx * dpr, ry * dpr, rw * dpr, rh * dpr, rx, ry, rw, rh);
        ctx.globalAlpha = 1;
      }

      raf = hover > 0 ? requestAnimationFrame(frame) : 0;
    }

    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;

      if (inside && !pointer.on && hover < 0.15) {
        newLook();
        lens.x = x;
        lens.y = y;
      }
      if (inside) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.on = inside;
      start();
    };

    const leave = () => {
      pointer.on = false;
      start();
    };
    const touchEnd = (e) => {
      if (e.pointerType === "touch") leave();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("pointerup", touchEnd, { passive: true });
    window.addEventListener("pointercancel", leave, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (imageSrc) {
      const im = new Image();
      im.onload = () => {
        if (cancelled) return;
        img = im;
        resize();
      };
      im.src = imageSrc;
    }

    newLook();
    if (light) light.mounted = (light.mounted || 0) + 1;
    resize();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) resize();
      });
    }

    return () => {
      cancelled = true;
      if (light) {
        light.mounted = Math.max(0, (light.mounted || 1) - 1);
        light.hover = 0;
      }
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", touchEnd);
      window.removeEventListener("pointercancel", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, [text, imageSrc, textColor, textFit, textY, fontFamily, fontWeight, fontSize, textYOffset, radius, intensity, follow, fadeIn, fadeOut]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

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
      <GlowLetters />
    </div>
  );
}
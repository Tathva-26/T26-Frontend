"use client";

import React, { useEffect, useRef } from "react";

/* ============================================================
 * Shared light state (was: lightstate.jsx)
 *  - <GlowLetters /> writes to it every frame.
 *  - Anything else on the page can read it (e.g. to follow the light's position).
 *  - <DotsBackground /> does NOT read it: the dots track the pointer on their
 *    own and always stay white, whether or not the pointer is over the letters.
 * ============================================================ */
export const light = {
  mounted: 0,   // how many <GlowLetters /> are on the page
  x: 0,         // light centre, viewport (clientX/clientY) coordinates
  y: 0,
  hover: 0,     // 0..1, fades in on hover / out on leave
  R: 170,       // current radius of the light (px)
  angle: 0,     // current direction of the colour gradient (radians)
};

/* ============================================================
 * Interactive dot-grid background (was: DotsBackground.jsx)
 *  - Dots only. They always stay WHITE, whatever else is on the page.
 *  - They light up around the pointer wherever it is inside the container,
 *    whether or not it is over the letters (they don't depend on <GlowLetters />).
 * Place it inside a `position: relative` container that has a height.
 * ============================================================ */
export function DotsBackground({
  gap = 16,               // distance between dots (px)
  size = 1.3,             // resting dot radius (px)
  hoverSize = 2.2,        // dot radius at full glow (px)
  radius = 220,           // reach of the hover glow (px)
  baseAlpha = 0.12,       // resting dot opacity
  glowAlpha = 0.5,        // dot opacity at full glow
  ease = 0.3,             // 0–1: higher = snappier response, lower = longer, softer fade trail
  className = "",
  style = {},
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
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // content above it stays clickable
        zIndex: 0,
        ...style,
      }}
    />
  );
}

/* ============================================================
 * Solid, saturated colours for GlowLetters. Ordered so neighbours blend
 * into vivid colours (blue -> red -> orange -> yellow), never muddy grey.
 * ============================================================ */
const RAMP = [
  [24, 132, 255], // blue
  [240, 52, 70],  // red
  [255, 110, 24], // orange
  [255, 196, 20], // yellow
];

// colour at position t (0..1) along a ramp of colours
function rampColor(ramp, t) {
  const x = Math.min(0.9999, Math.max(0, t)) * (ramp.length - 1);
  const i = x | 0;
  const f = x - i;
  const a = ramp[i];
  const b = ramp[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// how much of the colour ramp is visible inside the light at once (0..1)
const WINDOW = 0.55;

/* ============================================================
 * Big wordmark (or logo image) with a hover-following coloured light
 * (was: glow.jsx). Reads/writes the shared `light` object above directly
 * — no import needed since it's in the same module now.
 * Place it inside a `position: relative` container that has a height.
 * ============================================================ */
export function GlowLetters({
  text = "Melius",
  imageSrc = "",          // optional: logo image to use instead of text
  textColor = "#3d3d3d",  // resting letter colour
  textFit = 0.62,         // letter width as a fraction of the container width
  textY = 0.5,            // vertical position (0 = top, 1 = bottom)
  fontFamily = '"Inter", "Helvetica Neue", Arial, sans-serif',
  fontWeight = 700,
  radius = 170,           // radius of the light (px)
  intensity = 0.75,       // opacity of the coloured light (0–1). 1 = fully solid
  follow = 1,             // how fast the light catches up with the cursor
  fadeIn = 0.3,           // how fast the light appears when you hover in
  fadeOut = 0.1,          // how fast it fades when you leave
  className = "",
  style = {},
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // offscreen layers: letter mask, tinted resting letters, light layer
    const textLayer = document.createElement("canvas");
    const baseLayer = document.createElement("canvas");
    const litCanvas = document.createElement("canvas");
    const litCtx = litCanvas.getContext("2d");

    // a touch of film grain for the light
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
    let hover = 0; // 0..1, fades in on hover, fades out on leave
    let cancelled = false;
    let img = null;

    const pointer = { x: -9999, y: -9999, on: false };
    const lens = { x: 0, y: 0 }; // light centre, follows the cursor

    // one "look" per hover: colour order, direction, spin and how fast colours slide
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

      // shape of the letters / logo (white), used to clip the light
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
        const probe = 100;
        t.font = `${fontWeight} ${probe}px ${fontFamily}`;
        const mw = t.measureText(text).width || 1;
        const fontPx = Math.min((w * textFit * probe) / mw, h * 0.95);
        t.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
        t.textAlign = "center";
        t.textBaseline = "middle";
        t.fillStyle = "#fff";
        t.fillText(text, w / 2, h * textY);
      }

      // resting (grey) letters = the same shape tinted with textColor
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

      // light appears on hover, fades away on leave
      hover += ((pointer.on ? 1 : 0) - hover) * (pointer.on ? fadeIn : fadeOut);
      if (!pointer.on && hover < 0.004) hover = 0;

      // the light follows the cursor
      const f = reduceMotion ? 1 : follow;
      lens.x += (pointer.x - lens.x) * f;
      lens.y += (pointer.y - lens.y) * f;

      ctx.clearRect(0, 0, w, h);

      const R = radius * (0.85 + 0.15 * hover); // grows a little as it appears
      const rx = Math.max(0, Math.floor(lens.x - R));
      const ry = Math.max(0, Math.floor(lens.y - R));
      const rw = Math.min(w, Math.ceil(lens.x + R)) - rx;
      const rh = Math.min(h, Math.ceil(lens.y + R)) - ry;

      // resting letters
      ctx.drawImage(baseLayer, 0, 0, w, h);

      // gradient direction, and which part of the colour ramp is showing right now
      const ang = reduceMotion ? look.angle : look.angle + look.spin * time;
      const slide = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time * look.slide + look.phase);
      const from = slide * (1 - WINDOW);

      // publish the light state (other components may read it)
      const box = canvas.getBoundingClientRect();
      light.x = box.left + lens.x;
      light.y = box.top + lens.y;
      light.hover = hover;
      light.R = R;
      light.angle = ang;

      // lit letters (only while hovering / fading out)
      if (hover > 0 && rw > 0 && rh > 0) {
        // 1) sweeping, fully opaque colour gradient
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

        // 2) a little grain
        litCtx.globalCompositeOperation = "source-atop";
        litCtx.globalAlpha = 0.04;
        litCtx.fillStyle = grain;
        litCtx.fillRect(rx, ry, rw, rh);
        litCtx.globalAlpha = 1;

        // 3) round light: solid in the middle, only a short soft edge
        litCtx.globalCompositeOperation = "destination-in";
        const mg = litCtx.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, R);
        mg.addColorStop(0, "rgba(0,0,0,1)");
        mg.addColorStop(0.55, "rgba(0,0,0,1)");
        mg.addColorStop(0.75, "rgba(0,0,0,0.85)");
        mg.addColorStop(0.9, "rgba(0,0,0,0.35)");
        mg.addColorStop(1, "rgba(0,0,0,0)");
        litCtx.fillStyle = mg;
        litCtx.fillRect(rx, ry, rw, rh);

        // 4) keep the light only where the letters are
        litCtx.drawImage(textLayer, rx * dpr, ry * dpr, rw * dpr, rh * dpr, rx, ry, rw, rh);
        litCtx.globalCompositeOperation = "source-over";

        // 5) draw the lit letters on top
        ctx.globalAlpha = intensity * Math.min(1, hover * 1.4);
        ctx.drawImage(litCanvas, rx * dpr, ry * dpr, rw * dpr, rh * dpr, rx, ry, rw, rh);
        ctx.globalAlpha = 1;
      }

      raf = hover > 0 ? requestAnimationFrame(frame) : 0; // idle = zero CPU
    }

    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;

      if (inside && !pointer.on && hover < 0.15) {
        // new hover -> new colour mix, light starts right under the cursor
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

    // Listening on window so it still works when content sits on top of the canvas
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
    light.mounted++;
    resize();

    // re-measure the letters once web fonts have loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) resize();
      });
    }

    return () => {
      cancelled = true;
      light.mounted = Math.max(0, light.mounted - 1);
      light.hover = 0;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", touchEnd);
      window.removeEventListener("pointercancel", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, [text, imageSrc, textColor, textFit, textY, fontFamily, fontWeight, radius, intensity, follow, fadeIn, fadeOut]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // content above it stays clickable
        zIndex: 1,
        ...style,
      }}
    />
  );
}

/**
 * Default export = full-screen demo combining both effects.
 * Import { DotsBackground, GlowLetters, light } individually to reuse elsewhere.
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
      <GlowLetters />
    </div>
  );
}

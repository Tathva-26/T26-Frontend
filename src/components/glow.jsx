"use client";

import React, { useEffect, useRef } from "react";
import { light } from "./lightstate.jsx";

// Solid, saturated colours. They are ordered so that neighbours blend into vivid
// colours (blue -> red -> orange -> yellow) and never into muddy grey.
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

/**
 * Big wordmark (or logo image). While you hover, a solid round light with a
 * vivid colour gradient follows the cursor and lights up the letters under it.
 *  - The light only exists while hovering (fades in / out) and follows the cursor.
 *  - Inside it the gradient keeps sweeping through blue / red / orange / yellow,
 *    even if the cursor stands still. Every hover starts with a different mix.
 *  - The light is only ever painted ON the letters. The background dots are a
 *    separate component (DotsBackground.jsx) and always stay white.
 * Place it inside a `position: relative` container that has a height.
 * Use `imageSrc` (an SVG/PNG of your logo) instead of `text` to light up a logo.
 */
export function GlowLetters({
  text = "Melius",
  imageSrc = "",          // optional: logo image to use instead of text
  textColor = "#3d3d3d",  // resting letter colour
  textFit = 0.62,         // letter width as a fraction of the container width
  textY = 0.5,            // vertical position (0 = top, 1 = bottom)
  fontFamily = '"Inter", "Helvetica Neue", Arial, sans-serif',
  fontWeight = 700,
  radius = 170,           // radius of the light (px)
  intensity = 0.75,          // opacity of the coloured light (0–1). 1 = fully solid
  // how quickly the light reacts (0–1 per frame, higher = snappier)
  follow = 1,           // how fast the light catches up with the cursor
  fadeIn = 0.3,           // how fast the light appears when you hover in
  fadeOut = 0.1,          // how fast it fades when you leave
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
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // content above it stays clickable
        zIndex: 1,
      }}
    />
  );
}

/**
 * Default export = full-screen demo: dark page with the glowing letters.
 * Run this file as-is and move your mouse over it.
 * To reuse elsewhere, import { GlowLetters } instead.
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
      <GlowLetters />
    </div>
  );
}
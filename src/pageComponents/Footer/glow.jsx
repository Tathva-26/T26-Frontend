"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

// Shared light state accessible by components on the page
export const light = {
  mounted: 0,
  x: 0,
  y: 0,
  hover: 0,   // 0..1 scale progress
  R: 0,       // active pixel radius
  angle: 0,
};

// Gradient is limited to red, blue, and yellow for a clean, vivid cycle.
const RAMP = [
  [240, 52, 70],   // vivid red
  [24, 132, 255],  // electric blue
  [255, 204, 20],  // bright yellow
];

function rampColor(ramp, t) {
  const x = Math.min(0.9999, Math.max(0, t)) * (ramp.length - 1);
  const i = x | 0;
  const f = x - i;
  const a = ramp[i];
  const b = ramp[i + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const WINDOW = 0.55;

export function DotsBackground({ dotSpacing = 32, dotBaseRadius = 1.25, lightRadius = 160 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;

    const mouse = { x: -9999, y: -9999, active: false };
    const currentPos = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Lerp mouse coordinates for smooth dot illumination
      currentPos.x += (mouse.x - currentPos.x) * 0.18;
      currentPos.y += (mouse.y - currentPos.y) * 0.18;

      const cols = Math.ceil(w / dotSpacing) + 1;
      const rows = Math.ceil(h / dotSpacing) + 1;
      const startX = (w % dotSpacing) / 2;
      const startY = (h % dotSpacing) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = startX + i * dotSpacing;
          const y = startY + j * dotSpacing;

          const dx = x - currentPos.x;
          const dy = y - currentPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Proximity brightness boost
          let alpha = 0.12; // Resting faint white
          let r = dotBaseRadius;

          if (dist < lightRadius) {
            const factor = 1 - dist / lightRadius;
            const eased = factor * factor;
            alpha = 0.12 + eased * 0.78; // Glows clean white
            r = dotBaseRadius + eased * 1.5;
          }

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [dotSpacing, dotBaseRadius, lightRadius]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

export function GlowLetters({
  text = "Melius",
  imageSrc = "",
  textColor = "#34373d",
  textFit = 0.65,
  textY = 0.5,
  fontFamily = '"Inter", "system-ui", -apple-system, sans-serif',
  fontWeight = 800,
  fontSize,
  textYOffset = 0,
  radius = 175,
  intensity = 0.95,
  follow = 0.85,
  growSpeed = 0.22,    // Snappy expansion on first contact
  shrinkSpeed = 0.16,  // Smooth contraction to a point on leave
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Offscreen layers
    const textLayer = document.createElement("canvas");
    const baseLayer = document.createElement("canvas");
    const litCanvas = document.createElement("canvas");
    const litCtx = litCanvas.getContext("2d");
    let textCtx = null;

    // Subtle grain texture
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
    let scale = 0;         // 0..1 circle growth progress
    let isActive = false;  // Whether spotlight is triggered & sustained
    let cancelled = false;
    let img = null;
    let pointerUpdatePending = false;

    // Sampled mask points for instantaneous radius-coverage testing
    let textMaskSamples = [];

    const pointer = {
      x: -9999,
      y: -9999,
      clientX: -9999,
      clientY: -9999,
      inside: false,
    };
    const lens = { x: 0, y: 0 };

    const look = { ramp: RAMP, angle: 0, spin: 0.45, phase: 0, slide: 0.4 };
    const newLook = () => {
      look.ramp = Math.random() < 0.5 ? RAMP : RAMP.slice().reverse();
      look.angle = Math.random() * Math.PI * 2;
      look.spin = (0.35 + Math.random() * 0.3) * (Math.random() < 0.5 ? 1 : -1);
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
      textCtx = textLayer.getContext("2d", { willReadFrequently: true });
      textCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (img) {
        let dw = w * textFit;
        let dh = (dw * img.naturalHeight) / img.naturalWidth;
        if (dh > h * 0.95) {
          dh = h * 0.95;
          dw = (dh * img.naturalWidth) / img.naturalHeight;
        }
        textCtx.drawImage(img, (w - dw) / 2, h * textY - dh / 2, dw, dh);
      } else {
        const probe = 120;
        textCtx.font = `${fontWeight} ${probe}px ${fontFamily}`;
        const mw = textCtx.measureText(text).width || 1;
        const fontPx = fontSize ?? Math.min((w * textFit * probe) / mw, h * 0.85);
        textCtx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
        textCtx.textAlign = "center";
        textCtx.textBaseline = "middle";
        textCtx.fillStyle = "#ffffff";
        textCtx.fillText(text, w / 2, h * textY + textYOffset);
      }

      // Pre-sample letter pixel locations for lightning-fast coverage checking
      try {
        const imgData = textCtx.getImageData(0, 0, cw, ch).data;
        const samples = [];
        const step = Math.max(4, Math.round(6 * dpr)); // Grid sampling for performance
        for (let py = 0; py < ch; py += step) {
          for (let px = 0; px < cw; px += step) {
            const idx = (py * cw + px) * 4 + 3;
            if (imgData[idx] > 30) {
              samples.push({ x: px / dpr, y: py / dpr });
            }
          }
        }
        textMaskSamples = samples;
      } catch (e) {
        textMaskSamples = [];
      }

      // Resting unlit letters layer
      baseLayer.width = cw;
      baseLayer.height = ch;
      const b = baseLayer.getContext("2d");
      b.drawImage(textLayer, 0, 0);
      b.globalCompositeOperation = "source-in";
      b.fillStyle = textColor;
      b.fillRect(0, 0, cw, ch);

      start();
    };

    // 1. Direct hit-test: cursor is physically hovering over a letter pixel
    const isDirectlyOverLetter = (px, py) => {
      if (!textCtx || px < 0 || py < 0 || px >= w || py >= h) return false;
      try {
        const pixel = textCtx.getImageData(Math.round(px * dpr), Math.round(py * dpr), 1, 1).data;
        return pixel[3] > 15;
      } catch {
        return false;
      }
    };

    // 2. Coverage check: does the light circle with target radius cover ANY letter pixel?
    const doesRadiusCoverAnyLetter = (cx, cy, queryRadius) => {
      if (!textMaskSamples.length) return false;
      const r2 = queryRadius * queryRadius;
      for (let i = 0; i < textMaskSamples.length; i++) {
        const p = textMaskSamples[i];
        const dx = p.x - cx;
        const dy = p.y - cy;
        if (dx * dx + dy * dy <= r2) {
          return true; // At least one letter pixel is within the circle radius!
        }
      }
      return false;
    };

    function frame(now) {
      const time = now / 1000;

      if (pointerUpdatePending) {
        pointerUpdatePending = false;
        updatePointerState(pointer.clientX, pointer.clientY);
      }

      // When active, circle expands rapidly to 1. When deactivated, collapses down to 0.
      if (isActive) {
        scale += (1 - scale) * growSpeed;
        if (1 - scale < 0.003) scale = 1;
      } else {
        scale += (0 - scale) * shrinkSpeed;
        if (scale < 0.003) scale = 0;
      }

      // Follow cursor with silky damping
      const f = reduceMotion ? 1 : follow;
      lens.x += (pointer.x - lens.x) * f;
      lens.y += (pointer.y - lens.y) * f;

      ctx.clearRect(0, 0, w, h);

      // Render base resting letters
      ctx.drawImage(baseLayer, 0, 0, w, h);

      // Physical current radius in pixels (shrinks directly to a point: R -> 0)
      const currentRadius = radius * scale;

      const rx = Math.max(0, Math.floor(lens.x - currentRadius));
      const ry = Math.max(0, Math.floor(lens.y - currentRadius));
      const rw = Math.min(w, Math.ceil(lens.x + currentRadius)) - rx;
      const rh = Math.min(h, Math.ceil(lens.y + currentRadius)) - ry;

      const ang = reduceMotion ? look.angle : look.angle + look.spin * time;
      const slide = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time * look.slide + look.phase);
      const from = slide * (1 - WINDOW);

      // Synchronize with external listener components
      const box = canvas.getBoundingClientRect();
      light.x = box.left + lens.x;
      light.y = box.top + lens.y;
      light.hover = scale;
      light.R = currentRadius;
      light.angle = ang;

      // Render glowing spotlight strictly clipped to letters while open
      if (scale > 0.01 && rw > 0 && rh > 0 && currentRadius > 1.5) {
        const dx = Math.cos(ang) * currentRadius * 1.15;
        const dy = Math.sin(ang) * currentRadius * 1.15;

        litCtx.globalCompositeOperation = "source-over";
        litCtx.globalAlpha = 1;
        litCtx.clearRect(rx, ry, rw, rh);

        // A. Sweep between only red, blue, and yellow at any time.
        const lg = litCtx.createLinearGradient(lens.x - dx, lens.y - dy, lens.x + dx, lens.y + dy);
        const c1 = rampColor(look.ramp, from);
        const c2 = rampColor(look.ramp, from + WINDOW * 0.6);
        lg.addColorStop(0, rgba(c1, 1));
        lg.addColorStop(0.5, rgba(c2, 1));
        lg.addColorStop(1, rgba(c1, 1));
        litCtx.fillStyle = lg;
        litCtx.fillRect(rx, ry, rw, rh);

        // B. Grain texture
        litCtx.globalCompositeOperation = "source-atop";
        litCtx.globalAlpha = 0.045;
        litCtx.fillStyle = grain;
        litCtx.fillRect(rx, ry, rw, rh);
        litCtx.globalAlpha = 1;

        // C. Radial spotlight mask (sharp center, soft vignette rim)
        litCtx.globalCompositeOperation = "destination-in";
        const mg = litCtx.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, currentRadius);
        mg.addColorStop(0, "rgba(0,0,0,1)");
        mg.addColorStop(0.68, "rgba(0,0,0,1)");
        mg.addColorStop(0.88, "rgba(0,0,0,0.85)");
        mg.addColorStop(0.98, "rgba(0,0,0,0.15)");
        mg.addColorStop(1, "rgba(0,0,0,0)");
        litCtx.fillStyle = mg;
        litCtx.fillRect(rx, ry, rw, rh);

        // D. Restrict strictly to letters geometry
        litCtx.drawImage(textLayer, rx * dpr, ry * dpr, rw * dpr, rh * dpr, rx, ry, rw, rh);
        litCtx.globalCompositeOperation = "source-over";

        // E. Composite lit letters on top
        ctx.globalAlpha = intensity;
        ctx.drawImage(litCanvas, rx * dpr, ry * dpr, rw * dpr, rh * dpr, rx, ry, rw, rh);
        ctx.globalAlpha = 1;
      }

      // Continue animating while scaling, active, or tracking
      raf = (scale > 0 || isActive) ? requestAnimationFrame(frame) : 0;
    }

    const updatePointerState = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      const insideCanvas = x >= 0 && y >= 0 && x <= r.width && y <= r.height;

      pointer.x = x;
      pointer.y = y;
      pointer.inside = insideCanvas;

      if (!insideCanvas) {
        isActive = false;
        start();
        return;
      }

      const overLetter = isDirectlyOverLetter(x, y);

      if (!isActive) {
        // Spotlight is currently closed: only trigger when cursor physically touches a letter edge
        if (overLetter) {
          isActive = true;
          newLook();
          lens.x = x;
          lens.y = y;
        }
      } else {
        // Spotlight is currently open: STAY open as long as any letter falls within the spotlight radius!
        // It only shrinks down to a point when the radius completely clears all letter boundaries.
        const coversLetters = doesRadiusCoverAnyLetter(x, y, radius);
        if (!coversLetters && !overLetter) {
          isActive = false;
        }
      }
    };

    const onPointerMove = (e) => {
      pointer.clientX = e.clientX;
      pointer.clientY = e.clientY;
      pointerUpdatePending = true;
      start();
    };

    const onPointerLeave = () => {
      isActive = false;
      pointerUpdatePending = false;
      start();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);

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
      light.mounted = Math.max(0, light.mounted - 1);
      light.hover = 0;
      light.R = 0;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerup", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
    };
  }, [text, imageSrc, textColor, textFit, textY, fontFamily, fontWeight, fontSize, textYOffset, radius, intensity, follow, growSpeed, shrinkSpeed]);

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
  const [wordText, setWordText] = useState("MELIUS");
  const [radiusVal, setRadiusVal] = useState(175);
  const [intensityVal, setIntensityVal] = useState(0.95);
  const [showHelper, setShowHelper] = useState(true);

  return (
    <div className="relative w-full h-screen bg-[#121316] overflow-hidden flex flex-col justify-between font-sans select-none text-slate-200">
      {/* 1. Interactive Dot Matrix Background */}
      <DotsBackground dotSpacing={32} dotBaseRadius={1.2} lightRadius={radiusVal} />

      {/* 2. Top Header Navigation */}
      <header className="relative z-10 w-full px-8 py-6 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-sm bg-[#121316]/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-red-500 to-amber-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#121316] rounded-[7px] flex items-center justify-center font-bold text-sm tracking-wider text-white">
              M
            </div>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">GlowLetters Interactive</h1>
            <p className="text-xs text-slate-400">Letter Edge Trigger & Persistent Coverage Radius</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Coverage Tracking Active
          </span>
        </div>
      </header>

      {/* 3. Main Center Stage with Glowing Letters */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Glow Letters Canvas layer */}
        <GlowLetters
          text={wordText}
          textColor="#2a2c33"
          radius={radiusVal}
          intensity={intensityVal}
          textFit={0.72}
          textY={0.5}
          fontWeight={900}
        />

        {/* Subtle Guidance HUD when hovering */}
        {showHelper && (
          <div className="absolute bottom-8 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs text-slate-400 pointer-events-none backdrop-blur-md transition-opacity">
            Hover cursor over any letter edge to burst open the spotlight. Move between letters — circle stays open until the radius clears the word.
          </div>
        )}
      </main>

      {/* 4. Bottom Control Dock */}
      <footer className="relative z-10 w-full px-8 py-5 border-t border-white/[0.06] backdrop-blur-md bg-[#121316]/70 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Wordmark:</label>
          <div className="flex gap-1.5 bg-black/40 p-1 rounded-lg border border-white/[0.08]">
            {["MELIUS", "LUMEN", "AURA", "SPECTRUM"].map((w) => (
              <button
                key={w}
                onClick={() => setWordText(w)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  wordText === w
                    ? "bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Radius ({radiusVal}px):</span>
            <input
              type="range"
              min="100"
              max="260"
              step="5"
              value={radiusVal}
              onChange={(e) => setRadiusVal(Number(e.target.value))}
              className="w-28 accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Glow Intensity:</span>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={intensityVal}
              onChange={(e) => setIntensityVal(Number(e.target.value))}
              className="w-24 accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <button
            onClick={() => setShowHelper(!showHelper)}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4"
          >
            {showHelper ? "Hide Tip" : "Show Tip"}
          </button>
        </div>
      </footer>
    </div>
  );
}
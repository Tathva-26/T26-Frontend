"use client";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

const MAX_DPR = 2;
const FRAME_INTERVAL = 1000 / 30;

const vertex = `
attribute vec2 uv;
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform float uTime;
uniform float uScale;
uniform float uLevels;
uniform float uLineWidth;
uniform float uLineOpacity;
uniform vec3 uLineColor;
uniform vec2 uOffset;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec2 p = gl_FragCoord.xy * uScale + uOffset;
  float v = snoise(vec3(p, uTime)) * 0.75
          + snoise(vec3(p * 2.1 + vec2(9.3, 4.1), uTime * 1.4)) * 0.25;

  // Map the field so each contour level sits on an integer, then measure the
  // screen-space distance to the nearest one.
  float u = (v + 0.42) / 0.84 * uLevels - 0.5;
  float k = floor(u + 0.5);
  float inRange = step(-0.5, k) * step(k, uLevels - 0.5);
  float d = abs(u - k) / max(fwidth(u), 1e-5);
  float half_w = uLineWidth * 0.5;
  float a = (1.0 - smoothstep(half_w - 0.5, half_w + 0.5, d)) * inRange * uLineOpacity;

  gl_FragColor = vec4(uLineColor * a, a);
}
`;

// Every <TopoBackground /> on the page renders through this one WebGL context
// and is blitted into its own 2D canvas, so instance count is not bounded by
// the browser's limit on live WebGL contexts.
let shared;

function getShared() {
  if (shared !== undefined) return shared;

  try {
    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      webgl: 1,
      width: 1,
      height: 1,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const program = new Program(gl, {
      vertex,
      fragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 1 },
        uLevels: { value: 7 },
        uLineWidth: { value: 1 },
        uLineOpacity: { value: 1 },
        uLineColor: { value: [1, 1, 1] },
        uOffset: { value: [0, 0] },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const instances = new Set();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    let last = 0;

    const drawInstance = (inst, seconds) => {
      const { canvas, ctx, params } = inst;
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;

      const glc = gl.canvas;
      if (glc.width < w) glc.width = w;
      if (glc.height < h) glc.height = h;
      renderer.width = w;
      renderer.height = h;

      const u = program.uniforms;
      u.uTime.value = reduce ? params.seed : seconds * params.speed + params.seed;
      u.uScale.value = params.scale / inst.dpr;
      u.uLevels.value = params.levels;
      u.uLineWidth.value = params.lineWidth * inst.dpr;
      u.uLineOpacity.value = params.lineOpacity;
      u.uLineColor.value = params.color;
      u.uOffset.value = [params.seed * 12.9898, params.seed * 78.233];

      renderer.render({ scene: mesh });

      // The viewport is anchored to the bottom-left of the shared canvas.
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(glc, 0, glc.height - h, w, h, 0, 0, w, h);
      inst.dirty = false;
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < FRAME_INTERVAL) return;
      last = now;

      const seconds = (now - t0) / 1000;
      for (const inst of instances) {
        if (!inst.onScreen) continue;
        if (reduce && !inst.dirty) continue;
        if (
          inst.canvas.checkVisibility &&
          !inst.canvas.checkVisibility({ opacityProperty: true, visibilityProperty: true })
        ) {
          continue;
        }
        drawInstance(inst, seconds);
      }
    };

    shared = {
      add(inst) {
        instances.add(inst);
        if (!raf) raf = requestAnimationFrame(frame);
      },
      remove(inst) {
        instances.delete(inst);
        if (!instances.size) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
    };
  } catch {
    shared = null;
  }

  return shared;
}

export default function TopoBackground({
  background = "#1d1725",
  lineColor = "138, 111, 174",
  lineOpacity = 0.22,
  lineWidth = 1,
  levels = 7,
  scale = 0.0016,
  speed = 0.06,
  // Unused by the GPU renderer (it evaluates per pixel); kept so existing call sites still work.
  cell = 10,
  seed = 7,
  fixed = true,
  className = "",
  style = {},
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const manager = getShared();
    if (!canvas || !manager) return undefined;

    const inst = {
      canvas,
      ctx: canvas.getContext("2d"),
      dpr: 1,
      dirty: true,
      onScreen: true,
      params: {
        color: lineColor.split(",").map((n) => parseFloat(n) / 255),
        lineOpacity,
        lineWidth,
        levels,
        scale,
        speed,
        seed,
      },
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      inst.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(rect.width * inst.dpr);
      canvas.height = Math.round(rect.height * inst.dpr);
      inst.dirty = true;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver(
      ([entry]) => {
        inst.onScreen = entry.isIntersecting;
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    io.observe(canvas);

    manager.add(inst);

    return () => {
      manager.remove(inst);
      ro.disconnect();
      io.disconnect();
    };
  }, [lineColor, lineOpacity, lineWidth, levels, scale, speed, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        background,
        ...style,
      }}
    />
  );
}

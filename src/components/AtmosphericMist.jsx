"use client";

/**
 * AtmosphericMist (lightweight)
 * ------------------------------
 * A cheaper volumetric-looking fog layer, built for GPUs where the
 * heavier domain-warped 3D-noise version causes visible lag.
 *
 * What changed vs. the heavier version, and why it's cheaper:
 * - 2D simplex noise instead of 3D (fewer permute ops per call).
 * - No domain warp. The warp needed 3 extra fbm() calls just to
 *   distort the sampling coordinate before the "real" noise — here,
 *   two independently-panning fbm layers at different speeds/scales
 *   are blended instead. Still soft and irregular, just without the
 *   warp step.
 * - 3 octaves per layer instead of 5.
 *   Net effect: ~6 noise evaluations per pixel per frame, vs. ~25
 *   before — roughly a 4x cut in the shader's main cost.
 * - The canvas renders at a fraction of its CSS size (resolutionScale,
 *   default 0.55) and gets upscaled by the browser. Fog has no hard
 *   edges, so the softness hides the lower resolution almost entirely
 *   while cutting fill-rate cost by more than half.
 * - devicePixelRatio is capped at 1 instead of 1.5.
 *
 * Everything else — the ground band, glow, palette, cleanup, debug
 * panel — keeps the same API as before, so this is a drop-in swap.
 *
 * Usage:
 *   <AtmosphericMist />
 *   <AtmosphericMist groundStart={0} groundEnd={0.3} edgeSoftness={0.12} />
 *   <AtmosphericMist debugControls />          // tune the band live
 *   <AtmosphericMist octaves={2} resolutionScale={0.4} />  // even cheaper
 */

import { forwardRef, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// uOctaves is a compile-time-ish loop bound via a uniform int used as
// a runtime break inside a fixed-length loop, so octave count is
// adjustable from JS without recompiling the shader.
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uColorDeep;
  uniform vec3  uColorTeal;
  uniform vec3  uColorCyan;
  uniform vec3  uColorPale;
  uniform float uIntensity;
  uniform float uDriftSpeed;
  uniform vec2  uLightPos;
  uniform float uGroundStart;
  uniform float uGroundEnd;
  uniform float uEdgeSoftness;
  uniform int   uOctaves;
  uniform float uDensityLow;   // noise value above which fog starts appearing
  uniform float uDensityHigh;  // noise value above which fog is fully solid

  // ---- Simplex noise 2D (Ashima Arts, public domain) — cheaper than
  // the 3D variant: one fewer dimension means fewer permute() calls
  // and a smaller corner/gradient set per evaluation. ----
  vec3 mod289v3(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289v2(vec2 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute289(vec3 x){ return mod289v3(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289v2(i);
    vec3 p = permute289(permute289(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fixed max loop length (GLSL ES needs a constant bound); uOctaves
  // lets JS dial the actual count down at runtime without recompiling.
  float fbm(vec2 p){
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 4; i++){
      if (i >= uOctaves) break;
      sum += amp * snoise(p * freq);
      freq *= 2.05;
      amp *= 0.5;
    }
    return sum;
  }

  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 aUv = vec2(uv.x * aspect, uv.y);

    float t = uTime * 0.02 * uDriftSpeed;

    // Two fbm layers, each just panning (translating) over time at a
    // different speed/scale/direction instead of being warped by a
    // third noise field. Cheaper, and still reads as drifting,
    // non-repeating cloud banks because the two layers combine into
    // a pattern that never realigns with itself.
    float near = fbm(aUv * 1.4 + vec2(t * 1.0, t * 0.35));
    float far  = fbm(aUv * 0.65 - vec2(t * 0.5, t * 0.18) + 30.0);

    float mist = mix(near, far, 0.4) * 0.5 + 0.5;
    // Lower uDensityLow / uDensityHigh = more of the noise field reads
    // as "fog" rather than "clear" at any moment, so the whole band
    // reads as thicker, more continuous coverage instead of wispy
    // patches with gaps between them.
    mist = smoothstep(uDensityLow, uDensityHigh, mist);

    vec2 lightPos = uLightPos * vec2(aspect, 1.0);
    float dist = distance(aUv, lightPos);
    float glow = exp(-dist * dist * 2.1);

    vec2 centered = uv - 0.5;
    float vig = 1.0 - smoothstep(0.32, 0.95, length(centered));

    float brightness = mist * (0.5 + glow * 0.95);
    brightness *= (0.32 + vig * 0.68);
    brightness = clamp(brightness, 0.0, 1.0);

    vec3 color = mix(uColorDeep, uColorTeal, smoothstep(0.0, 0.42, brightness));
    color = mix(color, uColorCyan, smoothstep(0.38, 0.72, brightness));
    color = mix(color, uColorPale, smoothstep(0.78, 1.0, brightness));

    float soft = max(uEdgeSoftness, 0.0001);
    float maskIn  = smoothstep(uGroundStart, uGroundStart + soft, uv.y);
    float maskOut = 1.0 - smoothstep(uGroundEnd - soft, uGroundEnd, uv.y);
    float groundMask = clamp(maskIn * maskOut, 0.0, 1.0);

    float alpha = clamp(brightness * uIntensity, 0.0, 1.0) * mist * groundMask;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

const DEFAULT_COLORS = {
  colorDeep: "#0a0614", // deep violet-black
  colorTeal: "#2b1240", // dark violet (fills the old "teal" gradient stop)
  colorCyan: "#8a63b8", // muted orchid/purple (fills the old "cyan" stop)
  colorPale: "#f1e6ff", // very soft pale lavender highlight
};

const AtmosphericMist = forwardRef(function AtmosphericMist({
  position = "fixed",
  zIndex = 1,
  intensity = 0.65,
  driftSpeed = 1,
  className,
  colorDeep = DEFAULT_COLORS.colorDeep,
  colorTeal = DEFAULT_COLORS.colorTeal,
  colorCyan = DEFAULT_COLORS.colorCyan,
  colorPale = DEFAULT_COLORS.colorPale,

  groundStart = 0,
  groundEnd = 0.32,
  edgeSoftness = 0.12,

  // How much of the frame reads as fog vs. clear at any given moment,
  // independent of the ground band's size. 0 = thin, wispy, patchy
  // fog with visible gaps. 1 = thick, near-solid coverage. Internally
  // this narrows the noise thresholds the mist is built from — it
  // does not touch groundStart/groundEnd, so use groundEnd to control
  // *how tall* the band is and density to control *how filled-in* it
  // looks within that band.
  density = 0.5,

  lightX = 0.5,
  lightY = 0.16,

  // Fewer octaves = cheaper. 3 is a good default; try 2 if you still
  // see lag, or 4 if you have GPU headroom to spare and want more
  // detail in the fog.
  octaves = 3,

  // Internal render resolution as a fraction of the container's CSS
  // size (before devicePixelRatio). 1 = native, 0.5 = quarter the
  // pixel count. Fog's softness hides the downscale well; push this
  // down first if you need more headroom.
  resolutionScale = 0.55,

  // devicePixelRatio is still capped — this is the ceiling on top of
  // resolutionScale, not instead of it.
  maxPixelRatio = 1,

  debugControls = false,
}, forwardedRef) {
  const containerRef = useRef(null);

  // Keeps the internal ref (used to mount the WebGL canvas) and any
  // ref passed in from outside (e.g. Hero.jsx tweening this layer
  // with GSAP, the same way it tweens bgrocks/girl/etc.) pointed at
  // the same DOM node.
  const setRefs = (node) => {
    containerRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef && typeof forwardedRef === "object") {
      forwardedRef.current = node;
    }
  };

  const [tuning, setTuning] = useState({
    groundStart,
    groundEnd,
    edgeSoftness,
    density,
    lightX,
    lightY,
    intensity,
    driftSpeed,
    octaves,
    resolutionScale,
  });

  useEffect(() => {
    setTuning({
      groundStart,
      groundEnd,
      edgeSoftness,
      density,
      lightX,
      lightY,
      intensity,
      driftSpeed,
      octaves,
      resolutionScale,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groundStart, groundEnd, edgeSoftness, density, lightX, lightY, intensity, driftSpeed, octaves, resolutionScale]);

  const tuningRef = useRef(tuning);
  useEffect(() => {
    tuningRef.current = tuning;
  }, [tuning]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const getPixelRatio = () => Math.min(window.devicePixelRatio || 1, tuningRef.current ? maxPixelRatio : 1);
    renderer.setPixelRatio(getPixelRatio());

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const toColorVec3 = (hex) => {
      const c = new THREE.Color(hex);
      return new THREE.Vector3(c.r, c.g, c.b);
    };

    // Maps the single 0..1 density prop to the two noise thresholds
    // the shader actually uses. Higher density -> lower thresholds ->
    // more of the noise field counts as "fog", so coverage reads as
    // thicker/more continuous rather than thin and patchy.
    const densityToThresholds = (d) => {
      const clamped = Math.min(Math.max(d, 0), 1);
      return {
        low: 0.4 - clamped * 0.35, // 0.40 (wispy) → 0.05 (thick)
        high: 0.95 - clamped * 0.25, // 0.95 (wispy) → 0.70 (thick)
      };
    };

    const initialThresholds = densityToThresholds(tuningRef.current.density);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uColorDeep: { value: toColorVec3(colorDeep) },
      uColorTeal: { value: toColorVec3(colorTeal) },
      uColorCyan: { value: toColorVec3(colorCyan) },
      uColorPale: { value: toColorVec3(colorPale) },
      uIntensity: { value: tuningRef.current.intensity },
      uDriftSpeed: { value: tuningRef.current.driftSpeed },
      uLightPos: { value: new THREE.Vector2(tuningRef.current.lightX, tuningRef.current.lightY) },
      uGroundStart: { value: tuningRef.current.groundStart },
      uGroundEnd: { value: tuningRef.current.groundEnd },
      uEdgeSoftness: { value: tuningRef.current.edgeSoftness },
      uOctaves: { value: Math.round(tuningRef.current.octaves) },
      uDensityLow: { value: initialThresholds.low },
      uDensityHigh: { value: initialThresholds.high },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const cssWidth = container.clientWidth || window.innerWidth;
      const cssHeight = container.clientHeight || window.innerHeight;
      const scale = Math.min(Math.max(tuningRef.current.resolutionScale, 0.2), 1);
      const pr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);

      renderer.setPixelRatio(pr);
      // Render at a reduced backing-store resolution but keep the
      // canvas's CSS size at 100%/100% — the browser upscales the
      // lower-res buffer, which the soft fog hides well.
      const w = Math.max(1, Math.round(cssWidth * scale));
      const h = Math.max(1, Math.round(cssHeight * scale));
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;
    const handleMotionChange = (e) => {
      reducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener?.("change", handleMotionChange);

    let isVisible = document.visibilityState !== "hidden";
    const handleVisibility = () => {
      isVisible = document.visibilityState !== "hidden";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const clock = new THREE.Clock();
    let rafId = 0;
    let lastResScale = tuningRef.current.resolutionScale;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const live = tuningRef.current;

      if (live.resolutionScale !== lastResScale) {
        lastResScale = live.resolutionScale;
        resize();
      }

      const effectiveDrift = reducedMotion ? 0 : live.driftSpeed;
      uniforms.uTime.value += delta * effectiveDrift;
      uniforms.uIntensity.value = live.intensity;
      uniforms.uDriftSpeed.value = live.driftSpeed;
      uniforms.uGroundStart.value = live.groundStart;
      uniforms.uGroundEnd.value = live.groundEnd;
      uniforms.uEdgeSoftness.value = live.edgeSoftness;
      uniforms.uLightPos.value.set(live.lightX, live.lightY);
      uniforms.uOctaves.value = Math.round(live.octaves);
      const thresholds = densityToThresholds(live.density);
      uniforms.uDensityLow.value = thresholds.low;
      uniforms.uDensityHigh.value = thresholds.high;

      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      reducedMotionQuery.removeEventListener?.("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibility);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorDeep, colorTeal, colorCyan, colorPale, maxPixelRatio]);

  const updateTuning = (key) => (e) => {
    const value = parseFloat(e.target.value);
    setTuning((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <div
        ref={setRefs}
        className={className}
        aria-hidden="true"
        style={{
          position,
          inset: 0,
          zIndex,
          pointerEvents: "none",
          overflow: "hidden",
          willChange: "transform",
          transformOrigin: "center center",
        }}
      />

      {debugControls ? (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 9999,
            width: 260,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(8, 12, 16, 0.85)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#dfeaf0",
            fontFamily: "monospace",
            fontSize: 11,
            pointerEvents: "auto",
          }}
        >
          <div style={{ marginBottom: 8, opacity: 0.7 }}>AtmosphericMist — tuning</div>

          {[
            ["groundStart", 0, 1, 0.01],
            ["groundEnd", 0, 1, 0.01],
            ["edgeSoftness", 0, 0.5, 0.01],
            ["density", 0, 1, 0.01],
            ["lightX", 0, 1, 0.01],
            ["lightY", 0, 1, 0.01],
            ["intensity", 0, 1.5, 0.01],
            ["driftSpeed", 0, 3, 0.05],
            ["octaves", 1, 4, 1],
            ["resolutionScale", 0.2, 1, 0.05],
          ].map(([key, min, max, step]) => (
            <label key={key} style={{ display: "block", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{key}</span>
                <span>{tuning[key].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={tuning[key]}
                onChange={updateTuning(key)}
                style={{ width: "100%" }}
              />
            </label>
          ))}

          <pre
            style={{
              marginTop: 8,
              padding: 8,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "all",
            }}
          >
{`<AtmosphericMist
  groundStart={${tuning.groundStart.toFixed(2)}}
  groundEnd={${tuning.groundEnd.toFixed(2)}}
  edgeSoftness={${tuning.edgeSoftness.toFixed(2)}}
  density={${tuning.density.toFixed(2)}}
  lightX={${tuning.lightX.toFixed(2)}}
  lightY={${tuning.lightY.toFixed(2)}}
  intensity={${tuning.intensity.toFixed(2)}}
  driftSpeed={${tuning.driftSpeed.toFixed(2)}}
  octaves={${Math.round(tuning.octaves)}}
  resolutionScale={${tuning.resolutionScale.toFixed(2)}}
/>`}
          </pre>
        </div>
      ) : null}
    </>
  );
});

AtmosphericMist.displayName = "AtmosphericMist";

export default AtmosphericMist;
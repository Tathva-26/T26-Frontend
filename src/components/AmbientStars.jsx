"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * AmbientStars
 * ------------------------------------------------------------------
 * A full-viewport, fixed-position ambient background: sparse glowing
 * light streaks (blue / purple / pink) drifting slowly downward, with
 * gentle twinkling. Built entirely with raw Three.js/WebGL — no 
 * particle, shader, or animation libraries.
 *
 * Two ways to use it, controlled by the `position` prop:
 *
 * App-wide background (`position="fixed"`, the default) — render once
 * near the root, before the rest of the UI, so it sits behind every
 * page rather than one section:
 *
 *   // app/layout.jsx
 *   <body>
 *     <AmbientStars />
 *     <div className="relative z-10">{children}</div>
 *   </body>
 *
 * Scoped to one section (`position="absolute"`) — drop it inside any
 * `position: relative | absolute | sticky | fixed` container and it
 * fills *that* container instead of the viewport, sizing and
 * animating in step with it:
 *
 *   <div className="relative h-screen overflow-hidden">
 *     <AmbientStars position="absolute" />
 *     <HeroContent />
 *   </div>
 *
 * Either way, give the sibling that holds your real UI a higher
 * z-index (or its own stacking context) so it reliably paints above
 * this component regardless of DOM order.
 *
 * @param {object} [props]
 * @param {number} [props.density=1] Multiplies the base streak count. 1 = default sparse density.
 * @param {string} [props.className]
 * @param {"fixed"|"absolute"} [props.position="fixed"] "fixed" fills the viewport, ignoring
 *   scroll — use for an app-wide background. "absolute" fills the nearest positioned ancestor
 *   instead — use to scope the effect to one section (e.g. a hero).
 */

const PALETTE = ["#A6C8FF", "#5227FF", "#FF9FFC"];

// Streak behaviour — tuned for a slow, sparse, elegant drift rather
// than an obvious "shower". Adjust these to restyle the effect.
const MIN_SPEED = 7; // px/sec
const MAX_SPEED = 24;
const BASE_ANGLE = -Math.PI / 2 - 0.16; // mostly straight down, slight lean
const ANGLE_VARIANCE = 0.32; // radians of per-streak direction variety
const LEN_MIN = 55;
const LEN_MAX = 120;
const LEN_SPEED_FACTOR = 3.2; // faster streaks read a little longer
const THICKNESS_MIN = 1.4;
const THICKNESS_MAX = 3.2;
const BRIGHTNESS_MIN = 0.45;
const BRIGHTNESS_MAX = 2.0;
const EDGE_MARGIN = 160; // px beyond the viewport before a streak respawns
const MIN_COUNT = 26;
const MAX_COUNT = 110;
const AREA_PER_STREAK = 17000; // px^2 per streak — controls sparseness

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * A soft, elongated glow texture generated once on a small offscreen
 * canvas: brightest near one end (the streak's "head"), fading to
 * fully transparent at both the head tip and the long tail, with a
 * soft vertical falloff for thickness. Every streak instance reuses
 * this single texture — only its transform and tint differ.
 */
function createStreakTexture() {
  const w = 128;
  const h = 32;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const hGrad = ctx.createLinearGradient(0, 0, w, 0);
  hGrad.addColorStop(0, "rgba(255,255,255,0)");
  hGrad.addColorStop(0.4, "rgba(255,255,255,0.08)");
  hGrad.addColorStop(0.75, "rgba(255,255,255,0.55)");
  hGrad.addColorStop(0.9, "rgba(255,255,255,1)");
  hGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, w, h);

  // Mask vertically so the bar reads as a soft, blurred line rather
  // than a hard-edged rectangle.
  ctx.globalCompositeOperation = "destination-in";
  const vGrad = ctx.createLinearGradient(0, 0, 0, h);
  vGrad.addColorStop(0, "rgba(255,255,255,0)");
  vGrad.addColorStop(0.5, "rgba(255,255,255,1)");
  vGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export default function AmbientStars({
  density = 1,
  className,
  position = "fixed",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const motionScale = prefersReducedMotion ? 0.12 : 1;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let halfW = width / 2;
    let halfH = height / 2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -halfW,
      halfW,
      halfH,
      -halfH,
      0.1,
      1000
    );
    camera.position.z = 100;

    const group = new THREE.Group();
    scene.add(group);

    const paletteColors = PALETTE.map((hex) => new THREE.Color(hex));
    const texture = createStreakTexture();
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });

    const count = Math.max(
      MIN_COUNT,
      Math.min(
        MAX_COUNT,
        Math.round((width * height * density) / AREA_PER_STREAK)
      )
    );

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);

    // Per-streak state lives in flat typed arrays, plus one reused
    // THREE.Color per streak — so the animation loop below never
    // allocates a new object on any frame.
    const posX = new Float32Array(count);
    const posY = new Float32Array(count);
    const velX = new Float32Array(count);
    const velY = new Float32Array(count);
    const angle = new Float32Array(count);
    const length = new Float32Array(count);
    const thickness = new Float32Array(count);
    const baseBrightness = new Float32Array(count);
    const shimmerSpeed = new Float32Array(count);
    const shimmerPhase = new Float32Array(count);
    const twinkleSpeed = new Float32Array(count);
    const twinklePhase = new Float32Array(count);
    const colors = Array.from({ length: count }, () => new THREE.Color());

    function paintColor(target) {
      const a = paletteColors[(Math.random() * paletteColors.length) | 0];
      let b = paletteColors[(Math.random() * paletteColors.length) | 0];
      if (b === a) {
        b = paletteColors[(paletteColors.indexOf(a) + 1) % paletteColors.length];
      }
      target.copy(a).lerp(b, Math.random());
    }

    function spawn(i, scatterY) {
      posX[i] = randRange(-halfW - EDGE_MARGIN, halfW + EDGE_MARGIN);
      posY[i] = scatterY
        ? randRange(-halfH - EDGE_MARGIN, halfH + EDGE_MARGIN)
        : halfH + EDGE_MARGIN * Math.random();

      const speed = randRange(MIN_SPEED, MAX_SPEED);
      const dir = BASE_ANGLE + randRange(-ANGLE_VARIANCE, ANGLE_VARIANCE);
      velX[i] = Math.cos(dir) * speed;
      velY[i] = Math.sin(dir) * speed;
      angle[i] = dir;

      length[i] = randRange(LEN_MIN, LEN_MAX) + speed * LEN_SPEED_FACTOR;
      thickness[i] = randRange(THICKNESS_MIN, THICKNESS_MAX);
      baseBrightness[i] = randRange(BRIGHTNESS_MIN, BRIGHTNESS_MAX);

      shimmerSpeed[i] = randRange(0.5, 1.3);
      shimmerPhase[i] = Math.random() * Math.PI * 2;
      twinkleSpeed[i] = randRange(0.08, 0.22);
      twinklePhase[i] = Math.random() * Math.PI * 2;

      paintColor(colors[i]);
    }

    for (let i = 0; i < count; i++) spawn(i, true);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      width = Math.round(entry.contentRect.width);
      height = Math.round(entry.contentRect.height);
      halfW = width / 2;
      halfH = height / 2;
      renderer.setSize(width, height);
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();
    const clock = new THREE.Clock();
    let rafId = 0;

    function tick() {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05) * motionScale;
      const elapsed = clock.getElapsedTime();

      for (let i = 0; i < count; i++) {
        posX[i] += velX[i] * dt;
        posY[i] += velY[i] * dt;

        if (
          posY[i] < -halfH - EDGE_MARGIN ||
          posX[i] < -halfW - EDGE_MARGIN * 2 ||
          posX[i] > halfW + EDGE_MARGIN * 2
        ) {
          spawn(i, false);
        }

        const shimmer =
          0.82 + 0.18 * Math.sin(elapsed * shimmerSpeed[i] + shimmerPhase[i]);
        const twinkleWave = Math.max(
          0,
          Math.sin(elapsed * twinkleSpeed[i] + twinklePhase[i])
        );
        const twinkle = 1 + 1.1 * Math.pow(twinkleWave, 12);
        const brightness = baseBrightness[i] * shimmer * twinkle;

        dummy.position.set(posX[i], posY[i], 0);
        dummy.rotation.set(0, 0, angle[i]);
        dummy.scale.set(length[i], thickness[i], 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tmpColor.copy(colors[i]).multiplyScalar(brightness);
        mesh.setColorAt(i, tmpColor);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{
        position,
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
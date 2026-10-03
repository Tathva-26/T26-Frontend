'use client';

import { useRef, useEffect, useState, memo } from 'react';
import * as THREE from 'three';

const LightPillar = ({
  topColor = '#5227FF',
  bottomColor = '#FF9FFC',
  intensity = 1.0,
  rotationSpeed = 0.3,
  interactive = false,
  className = '',
  glowAmount = 0.005,
  pillarWidth = 3.0,
  pillarHeight = 0.4,
  noiseIntensity = 0.5,
  mixBlendMode = 'screen',
  pillarRotation = 0,
  quality = 'high',
  lightMode = false
}) => {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const rendererRef = useRef(null);
  const materialRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const geometryRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const timeRef = useRef(0);
  const rotationSpeedRef = useRef(rotationSpeed);
  const isRunningRef = useRef(false);
  const isVisibleRef = useRef(true);
  const isPageVisibleRef = useRef(true);
  const [webGLSupported, setWebGLSupported] = useState(() => {
    if (typeof document === 'undefined') return true;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return Boolean(gl);
  });

  useEffect(() => {
    if (!containerRef.current || !webGLSupported) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    let effectiveQuality = quality;
    if (isLowEndDevice && quality === 'high') effectiveQuality = 'medium';
    if (isMobile && quality !== 'low') effectiveQuality = 'low';

    const qualitySettings = {
      low: { iterations: 24, waveIterations: 1, pixelRatio: 0.5, precision: 'mediump', stepMultiplier: 1.5 },
      medium: { iterations: 40, waveIterations: 2, pixelRatio: 0.65, precision: 'mediump', stepMultiplier: 1.2 },
      high: {
        iterations: 80,
        waveIterations: 4,
        // Capped at 1.5 instead of the native DPR (often 2-3 on modern phones/laptops):
        // this is a soft, blurred raymarched glow with no fine detail or text, so the
        // extra fragment-shader invocations a full native DPR costs are not visible but
        // are directly proportional to GPU load (DPR 2 -> 1.5 alone is ~44% fewer pixels).
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        precision: 'highp',
        stepMultiplier: 1.0
      }
    };

    const settings = qualitySettings[effectiveQuality] || qualitySettings.medium;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: effectiveQuality === 'high' ? 'high-performance' : 'low-power',
        precision: settings.precision,
        stencil: false,
        depth: false,
        preserveDrawingBuffer: false
      });
    } catch (error) {
      window.setTimeout(() => setWebGLSupported(false), 0);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(settings.pixelRatio);
    renderer.debug.checkShaderErrors = false;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const parseColor = hex => {
      const color = new THREE.Color(hex);
      return new THREE.Vector3(color.r, color.g, color.b);
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision ${settings.precision} float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform bool uInteractive;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      uniform float uNoiseIntensity;
      uniform float uLightMode;
      uniform float uRotCos;
      uniform float uRotSin;
      uniform float uPillarRotCos;
      uniform float uPillarRotSin;
      uniform float uWaveSin;
      uniform float uWaveCos;
      varying vec2 vUv;

      const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};
      const int MAX_ITER = ${settings.iterations};
      const int WAVE_ITER = ${settings.waveIterations};

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
        uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);

        vec3 ro = vec3(0.0, 0.0, -10.0);
        vec3 rd = normalize(vec3(uv, 1.0));

        float rotC = uRotCos;
        float rotS = uRotSin;
        if(uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {
          float a = uMouse.x * 6.283185;
          rotC = cos(a);
          rotS = sin(a);
        }

        vec3 col = vec3(0.0);
        float t = 0.1;

        for(int i = 0; i < MAX_ITER; i++) {
          vec3 p = ro + rd * t;
          p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);

          vec3 q = p;
          q.y = p.y * uPillarHeight + uTime;

          float freq = 1.0;
          float amp = 1.0;
          for(int j = 0; j < WAVE_ITER; j++) {
            q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);
            q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
            freq *= 2.0;
            amp *= 0.5;
          }

          float d = length(cos(q.xz)) - 0.2;
          float bound = length(p.xz) - uPillarWidth;
          float k = 4.0;
          float h = max(k - abs(d - bound), 0.0);
          d = max(d, bound) + h * h * 0.0625 / k;
          d = abs(d) * 0.15 + 0.01;

          float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
          col += mix(uBottomColor, uTopColor, grad) / d;

          t += d * STEP_MULT;
          if(t > 50.0) break;
        }

        float widthNorm = uPillarWidth / 3.0;
        col = tanh(col * uGlowAmount / widthNorm);

        col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;

        vec3 result = clamp(col * uIntensity, 0.0, 1.0);
        if (uLightMode > 0.5) {
          float energy = max(result.r, max(result.g, result.b));
          vec3 hue = result / max(energy, 0.001);
          float coverage = smoothstep(0.025, 0.95, energy);
          hue = pow(clamp(hue, 0.0, 1.0), vec3(1.25));
          result = mix(vec3(1.0), hue, coverage * 0.94);
        }
        gl_FragColor = vec4(result, 1.0);
      }
    `;

    const pillarRotRad = (pillarRotation * Math.PI) / 180;
    const waveSin = Math.sin(0.4);
    const waveCos = Math.cos(0.4);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: mouseRef.current },
        uTopColor: { value: parseColor(topColor) },
        uBottomColor: { value: parseColor(bottomColor) },
        uIntensity: { value: intensity },
        uInteractive: { value: interactive },
        uGlowAmount: { value: glowAmount },
        uPillarWidth: { value: pillarWidth },
        uPillarHeight: { value: pillarHeight },
        uNoiseIntensity: { value: noiseIntensity },
        uLightMode: { value: lightMode ? 1 : 0 },
        uRotCos: { value: 1.0 },
        uRotSin: { value: 0.0 },
        uPillarRotCos: { value: Math.cos(pillarRotRad) },
        uPillarRotSin: { value: Math.sin(pillarRotRad) },
        uWaveSin: { value: waveSin },
        uWaveCos: { value: waveCos }
      },
      // The shader always writes alpha = 1.0, and this is the only object in the scene,
      // so WebGL blending is a guaranteed no-op (src*1 + dst*0) here. Keeping
      // `transparent: true` would still pay for enabling the GL blend state and a
      // per-pixel blend op on every fragment for zero visual difference; CSS
      // mix-blend-mode compositing with the page (via the alpha:true context) is
      // unaffected by this flag, which only controls in-scene WebGL blending.
      transparent: false,
      depthWrite: false,
      depthTest: false
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    geometryRef.current = geometry;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let mouseMoveTimeout = null;
    const handleMouseMove = event => {
      if (!interactive) return;

      if (mouseMoveTimeout) return;

      mouseMoveTimeout = window.setTimeout(() => {
        mouseMoveTimeout = null;
      }, 16);

      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);
    };

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Only render while the pillar is actually on screen and the tab is visible —
    // a decorative raymarched background has no reason to burn GPU/battery off-screen.
    const shouldRender = () => isVisibleRef.current && isPageVisibleRef.current;

    let lastTime = performance.now();
    const targetFPS = effectiveQuality === 'low' ? 30 : 60;
    const frameTime = 1000 / targetFPS;

    // Adaptive quality: this is the runtime safety net for devices that pass the
    // upfront isMobile/hardwareConcurrency check (e.g. a "capable" laptop with weak
    // integrated graphics) but still can't hold the target frame time. It only ever
    // steps pixel ratio DOWN, with a cooldown between checks so one slow frame can't
    // trigger it and it can't oscillate; devices that already hit their target are
    // completely unaffected (the check is on a rolling average, not a single frame).
    let lastRenderTime = performance.now();
    const adaptive = {
      emaFrameMs: 0,
      lastCheck: performance.now(),
      pixelRatio: settings.pixelRatio,
      floor: Math.max(0.35, settings.pixelRatio * 0.5)
    };

    const animate = currentTime => {
      if (!materialRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        const renderDelta = currentTime - lastRenderTime;
        lastRenderTime = currentTime;

        timeRef.current += 0.016 * rotationSpeedRef.current;
        const t = timeRef.current;
        materialRef.current.uniforms.uTime.value = t;
        materialRef.current.uniforms.uRotCos.value = Math.cos(t * 0.3);
        materialRef.current.uniforms.uRotSin.value = Math.sin(t * 0.3);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        lastTime = currentTime - (deltaTime % frameTime);

        adaptive.emaFrameMs = adaptive.emaFrameMs ? adaptive.emaFrameMs * 0.9 + renderDelta * 0.1 : renderDelta;
        if (currentTime - adaptive.lastCheck > 2000) {
          adaptive.lastCheck = currentTime;
          const budgetMs = frameTime * 1.75;
          if (adaptive.emaFrameMs > budgetMs && adaptive.pixelRatio > adaptive.floor) {
            adaptive.pixelRatio = Math.max(adaptive.floor, adaptive.pixelRatio * 0.75);
            rendererRef.current.setPixelRatio(adaptive.pixelRatio);
            rendererRef.current.setSize(container.clientWidth, container.clientHeight);
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      lastTime = performance.now();
      rafRef.current = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      isRunningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    if (shouldRender()) startAnimation();

    const intersectionObserver = new IntersectionObserver(
      entries => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
        if (shouldRender()) startAnimation();
        else stopAnimation();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      if (shouldRender()) startAnimation();
      else stopAnimation();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let resizeTimeout = null;
    const applyResize = () => {
      if (!rendererRef.current || !materialRef.current || !containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      rendererRef.current.setSize(newWidth, newHeight);
      materialRef.current.uniforms.uResolution.value.set(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(applyResize, 150);
    });
    resizeObserver.observe(container);

    const handleContextLost = event => {
      event.preventDefault();
      stopAnimation();
    };
    const handleContextRestored = () => {
      if (shouldRender()) startAnimation();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      if (interactive) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (mouseMoveTimeout) clearTimeout(mouseMoveTimeout);
      if (resizeTimeout) clearTimeout(resizeTimeout);

      stopAnimation();

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }

      rendererRef.current = null;
      materialRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      geometryRef.current = null;
      rafRef.current = null;
    };
  }, [webGLSupported, quality]);

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    if (!materialRef.current) return;
    const parseColor = (hex) => {
      const color = new THREE.Color(hex);
      return new THREE.Vector3(color.r, color.g, color.b);
    };
    materialRef.current.uniforms.uTopColor.value = parseColor(topColor);
  }, [topColor]);

  useEffect(() => {
    if (!materialRef.current) return;
    const parseColor = (hex) => {
      const color = new THREE.Color(hex);
      return new THREE.Vector3(color.r, color.g, color.b);
    };
    materialRef.current.uniforms.uBottomColor.value = parseColor(bottomColor);
  }, [bottomColor]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uIntensity.value = intensity;
  }, [intensity]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uInteractive.value = interactive;
  }, [interactive]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uGlowAmount.value = glowAmount;
  }, [glowAmount]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uPillarWidth.value = pillarWidth;
  }, [pillarWidth]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uPillarHeight.value = pillarHeight;
  }, [pillarHeight]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uNoiseIntensity.value = noiseIntensity;
  }, [noiseIntensity]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uLightMode.value = lightMode ? 1 : 0;
  }, [lightMode]);

  useEffect(() => {
    if (!materialRef.current) return;
    const pillarRotRad = (pillarRotation * Math.PI) / 180;
    materialRef.current.uniforms.uPillarRotCos.value = Math.cos(pillarRotRad);
    materialRef.current.uniforms.uPillarRotSin.value = Math.sin(pillarRotRad);
  }, [pillarRotation]);

  if (!webGLSupported) {
    return (
      <div
        className={`w-full h-full absolute top-0 left-0 flex items-center justify-center bg-black/10 text-gray-500 text-sm ${className}`}
        style={{ mixBlendMode }}
      >
        WebGL not supported
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full h-full absolute top-0 left-0 ${className}`} style={{ mixBlendMode }} />
  );
};

// Props are plain primitives (strings/numbers/booleans), so a shallow memo correctly
// skips reconciliation whenever an unrelated ancestor re-renders (e.g. the parent's
// carousel state changing on every arrow click/keypress) without affecting any case
// where this component's own props actually change.
export default memo(LightPillar);

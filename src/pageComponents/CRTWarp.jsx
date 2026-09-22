'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uBackgroundColor;
uniform float uCurvature;
uniform float uScanlineStrength;
uniform float uScanlineFrequency;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uBloom;
uniform float uBloomRadius;
uniform float uNoise;
uniform float uVignette;
uniform float uBrightness;
uniform float uPixelation;
uniform float uRgbShift;
uniform vec2 uPointer;
uniform float uMouseStrength;
uniform float uMouseReact;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 crtCurve(vec2 uv, float radius) {
  vec2 p = (uv - 0.5) * 2.0;
  float safeRadius = max(radius, 1.415);
  float cornerScale = safeRadius / sqrt(max(safeRadius * safeRadius - 2.0, 0.001));
  p = safeRadius * p / sqrt(max(safeRadius * safeRadius - dot(p, p), 0.001));
  p /= cornerScale;
  return p * 0.5 + 0.5;
}

float referencePlasma(vec2 uv, float t) {
  float frequencyScale = max(uWaveFrequency / 2.2, 0.001);
  uv = (uv - 0.5) * frequencyScale + 0.5;

  float scanline = 0.5 - 0.5 * cos(uv.y * 3.14159265 * uScanlineFrequency);
  scanline = mix(1.0, scanline, uScanlineStrength);

  uv *= vec2(80.0, 24.0);
  uv = ceil(uv);
  uv /= vec2(80.0, 24.0);

  float amplitude = uWaveAmplitude / 0.28;
  float field = 0.0;
  field += 0.7 * sin(0.5 * uv.x + t / 5.0);
  field += 3.0 * sin(1.6 * uv.y + t / 5.0);
  field += sin(10.0 * (uv.y * sin(t / 2.0) + uv.x * cos(t / 5.0)) + t / 2.0);

  float cx = uv.x + 0.5 * sin(t / 2.0);
  float cy = uv.y + 0.5 * cos(t / 4.0);
  field += 0.4 * sin(sqrt(100.0 * cx * cx + 100.0 * cy * cy + 1.0) + t);
  field += 0.9 * sin(sqrt(75.0 * cx * cx + 25.0 * cy * cy + 1.0) + t);
  field -= 1.4 * sin(sqrt(256.0 * cx * cx + 25.0 * cy * cy + 1.0) + t);
  field += 0.3 * sin(0.5 * uv.y + uv.x + sin(t));

  return scanline * floor(3.0 * (0.5 + 0.499 * sin(field * amplitude))) / 3.0;
}

void main() {
  vec2 uv = vUv;
  if (uPixelation > 1.001) {
    vec2 cells = max(uResolution / uPixelation, vec2(1.0));
    uv = (floor(uv * cells) + 0.5) / cells;
  }

  float curveRadius = 1.1 + 0.42 / max(uCurvature, 0.001);
  if (uMouseReact > 0.5) {
    curveRadius *= exp(-uPointer.y * uMouseStrength * 0.4);
  }
  vec2 curvedUv = crtCurve(uv, curveRadius);
  if (uMouseReact > 0.5) {
    curvedUv.x -= uPointer.x * uMouseStrength * 0.035;
  }

  float signal = referencePlasma(curvedUv, uTime);
  float radius = 0.01 * uBloomRadius;
  float glow = signal * 0.2;
  glow += referencePlasma(curvedUv + vec2(radius, 0.0), uTime) * 0.12;
  glow += referencePlasma(curvedUv - vec2(radius, 0.0), uTime) * 0.12;
  glow += referencePlasma(curvedUv + vec2(0.0, radius), uTime) * 0.12;
  glow += referencePlasma(curvedUv - vec2(0.0, radius), uTime) * 0.12;
  glow += referencePlasma(curvedUv + vec2(radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv - vec2(radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv + vec2(radius, -radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv + vec2(-radius, radius), uTime) * 0.08;

  float redSignal = referencePlasma(curvedUv + vec2(uRgbShift, 0.0), uTime);
  float blueSignal = referencePlasma(curvedUv - vec2(uRgbShift, 0.0), uTime);
  vec3 channelSignal = vec3(redSignal, signal, blueSignal);
  vec3 waveColor = uColor * (0.3 + signal * 0.7 + glow * uBloom * 0.65);
  waveColor += (channelSignal - signal) * 0.42;

  float edge = clamp(1.0 - dot(vUv - 0.5, vUv - 0.5) * 2.0, 0.0, 1.0);
  float edgeFade = mix(1.0, smoothstep(0.0, 1.0, edge), uVignette);
  float waveMask = clamp(signal * 0.82 + glow * 0.52, 0.0, 1.0) * edgeFade;

  float grain = hash21(gl_FragCoord.xy + vec2(fract(uTime) * 173.0));
  waveColor = max(waveColor * uBrightness, vec3(0.0));
  vec3 color = mix(uBackgroundColor, waveColor, waveMask);
  color += (grain - 0.5) * uNoise;
  gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
}
`;

export default function CRTWarp({
  color = '#c755f7',
  backgroundColor = '#05010a',
  speed = 0.5,
  curvature = 0.25,
  scanlineStrength = 0.25,
  scanlineFrequency = 200,
  waveAmplitude = 0.3,
  waveFrequency = 2.5,
  bloom = 1.5,
  bloomRadius = 1,
  noise = 0.1,
  vignette = 0,
  brightness = 1.25,
  pixelation = 1,
  rgbShift = 0.015,
  mouseReact = true,
  mouseStrength = 0.5,
  dpr = 1,
  fps = 30,
  paused = false,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);
  const materialRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pausedRef = useRef(paused);
  const pointerRef = useRef(new THREE.Vector2(0, 0));
  const targetPointerRef = useRef(new THREE.Vector2(0, 0));
  const isIntersectingRef = useRef(true);
  const fpsRef = useRef(fps);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    fpsRef.current = Math.max(1, fps);
  }, [fps]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uColor: { value: new THREE.Color(color) },
        uBackgroundColor: { value: new THREE.Color(backgroundColor) },
        uCurvature: { value: curvature },
        uScanlineStrength: { value: scanlineStrength },
        uScanlineFrequency: { value: scanlineFrequency },
        uWaveAmplitude: { value: waveAmplitude },
        uWaveFrequency: { value: waveFrequency },
        uBloom: { value: bloom },
        uBloomRadius: { value: bloomRadius },
        uNoise: { value: noise },
        uVignette: { value: vignette },
        uBrightness: { value: brightness },
        uPixelation: { value: pixelation },
        uRgbShift: { value: rgbShift },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uMouseStrength: { value: mouseStrength },
        uMouseReact: { value: mouseReact ? 1 : 0 }
      }
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.appendChild(renderer.domElement);

    const handleResize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    const clock = new THREE.Clock();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersectingRef.current = entry.isIntersecting;
    });
    intersectionObserver.observe(container);

    const animate = (time) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!isIntersectingRef.current || document.hidden) return;

      const deltaTarget = 1000 / fpsRef.current;
      if (time - lastFrameTimeRef.current < deltaTarget) return;

      lastFrameTimeRef.current = time - ((time - lastFrameTimeRef.current) % deltaTarget);

      const delta = Math.min(clock.getDelta(), 0.1);
      if (!pausedRef.current) {
        material.uniforms.uTime.value += delta * material.uniforms.uSpeed.value;
      }

      pointerRef.current.lerp(targetPointerRef.current, 0.08);
      material.uniforms.uPointer.value.copy(pointerRef.current);

      renderer.render(scene, camera);
    };

    animate(0);

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetPointerRef.current.set(
        ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
        -(((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1)
      );
    };

    const handlePointerLeave = () => {
      targetPointerRef.current.set(0, 0);
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      materialRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    const renderer = rendererRef.current;
    if (!material || !renderer) return;

    const u = material.uniforms;
    u.uColor.value.set(color);
    u.uBackgroundColor.value.set(backgroundColor);
    u.uSpeed.value = speed;
    u.uCurvature.value = curvature;
    u.uScanlineStrength.value = scanlineStrength;
    u.uScanlineFrequency.value = scanlineFrequency;
    u.uWaveAmplitude.value = waveAmplitude;
    u.uWaveFrequency.value = waveFrequency;
    u.uBloom.value = bloom;
    u.uBloomRadius.value = bloomRadius;
    u.uNoise.value = noise;
    u.uVignette.value = vignette;
    u.uBrightness.value = brightness;
    u.uPixelation.value = pixelation;
    u.uRgbShift.value = rgbShift;
    u.uMouseReact.value = mouseReact ? 1 : 0;
    u.uMouseStrength.value = mouseStrength;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));

    const container = containerRef.current;
    if (container) {
      renderer.setSize(Math.max(container.clientWidth, 1), Math.max(container.clientHeight, 1), false);
      u.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    }
  }, [
    color,
    backgroundColor,
    speed,
    curvature,
    scanlineStrength,
    scanlineFrequency,
    waveAmplitude,
    waveFrequency,
    bloom,
    bloomRadius,
    noise,
    vignette,
    brightness,
    pixelation,
    rgbShift,
    mouseReact,
    mouseStrength,
    dpr,
    fps
  ]);

  return (
    <div
      ref={containerRef}
      className={`crt-warp-container ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ...style }}
    />
  );
}

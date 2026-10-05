"use client";
/* eslint-disable react-hooks/immutability -- R3F exposes mutable Three.js scene/camera objects, not React state. */

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { NoToneMapping, PMREMGenerator } from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import CrystalOptics from './CrystalOptics'
import CrystalModel from "./CrystalModel";
import ConclaveVeil from "./ConclaveVeil";
import LoadingCrystal from './LoadingCrystal';
import { interactionTargets, localPointer } from "./crystalGeometry.mjs";
import { sampleFrameBudget } from './expoRenderBudget.mjs';
import { touchGesture, insideCrystalSlot } from './crystalTouch.mjs';

function initialCompact() {
  if (typeof window === 'undefined') return true;
  return Boolean(window.matchMedia('(pointer: coarse), (max-width: 767px)').matches ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4));
}

function SceneWarmup({ ready, assetsMounted, onFailure, shaderFailed }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    assetsMounted.current = true;
    ready.current = false;
    const textures = new Set();
    scene.traverse(object => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        for (const uniform of Object.values(material.uniforms ?? {})) if (uniform.value?.isTexture) textures.add(uniform.value);
      }
    });
    for (const texture of textures) gl.initTexture(texture);
    gl.compileAsync(scene, camera).then(() => {
      if (!cancelled && !shaderFailed.current) ready.current = true;
    }).catch(() => { if (!cancelled) onFailure(); });
    return () => { cancelled = true; ready.current = false; assetsMounted.current = false; };
  }, [gl, scene, camera, ready, assetsMounted, onFailure, shaderFailed]);
  return null;
}

function SceneEnvironment({ shared }) {
  const { gl, scene, camera, size } = useThree();
  const environment = useLoader(EXRLoader, "/images/expo/crystal/studio.exr");
  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const target = generator.fromEquirectangular(environment);
    scene.environment = target.texture;
    scene.environmentRotation.y = Math.PI;
    generator.dispose();
    return () => { scene.environment = null; target.dispose(); };
  }, [gl, scene, environment]);

  useEffect(() => {
    if (shared) {
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      return;
    }
    const mobile = size.width < 360;
    const halfVertical = (camera.fov * Math.PI) / 360;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * size.width / Math.max(size.height, 1));
    // Fit the entire animated silhouette, including the asymmetric upper point.
    camera.position.z = Math.max(1.9 / Math.tan(halfVertical), 1.25 / Math.tan(halfHorizontal)) * (mobile ? 1.02 : 1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size, shared]);
  return null;
}

function ContextEvents({ onFailure, onLost, onRestored, shaderFailed }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = event => { event.preventDefault(); onLost(); };
    const previous = gl.debug.onShaderError;
    gl.debug.onShaderError = (context, program, vertex, fragment) => {
      shaderFailed.current = true;
      console.error('Expo crystal shader failed:', context.getProgramInfoLog(program), context.getShaderInfoLog(fragment));
      previous?.(context, program, vertex, fragment);
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      gl.debug.onShaderError = previous;
    };
  }, [gl, onFailure, onLost, onRestored, shaderFailed]);
  return null;
}

function RenderBudget({ compact, degraded, onQuality }) {
  const gl = useThree((state) => state.gl);
  const sample = useRef({ seconds: 0, frames: 0, strikes: 0, recoveries: 0, degraded: false });
  useEffect(() => { gl.transmissionResolutionScale = degraded ? .35 : compact ? .5 : .75; }, [gl, compact, degraded]);
  useFrame((_, delta) => {
    const before = sample.current.degraded;
    sampleFrameBudget(sample.current, delta, sample.current);
    if (before !== sample.current.degraded) onQuality(sample.current.degraded);
  });
  return null;
}

export default function CrystalScene({ active, reduced, onReady, onFailure, onLost, onRestored, journey, onProject, transition }) {
  const shaderFailed = useRef(false);
  const warmupReady = useRef(false);
  const assetsMounted = useRef(false);
  const target = useRef({ tiltX: 0, tiltY: 0, x: 0, y: 0, active: false, pressed: false, activation: 0, keyboard: false });
  const feedback = useRef(null);
  const reportMood = (awake) => { if (feedback.current) feedback.current.textContent = awake ? 'The robot awakens.' : ''; };
  const pointer = useRef(null);
  const [dpr, setDpr] = useState(1);
  const [compact, setCompact] = useState(initialCompact);
  const [degraded, setDegraded] = useState(false);
  const renderDpr = degraded ? Math.min(dpr, compact ? .8 : 1) : dpr;
  const controlsRect = (element) => element.closest('[data-expo-progress], [data-expo-page]')?.querySelector('[data-expo-slot]')?.getBoundingClientRect() || element.getBoundingClientRect();

  const reset = () => {
    pointer.current = null;
    Object.assign(target.current, { tiltX: 0, tiltY: 0, active: false, pressed: false, dragging: false, keyboard: false });
  };
  const update = (event) => {
    const touch = event.pointerType !== "mouse";
    if (touch && pointer.current?.id !== event.pointerId) return;
    if (touch) {
      const gesture = pointer.current;
      gesture.mode = touchGesture(event.clientX - gesture.clientX, event.clientY - gesture.clientY, gesture.mode);
      if (gesture.mode === 'scroll') { reset(); return; }
      if (gesture.mode === 'drag' && !event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }
    // A captured drag stays in the coordinate system measured at touch-down.
    // Avoid layout reads and changing drag sensitivity as browser chrome moves.
    const rect = touch ? pointer.current.rect : event.currentTarget.getBoundingClientRect();
    const point = localPointer(event.clientX, event.clientY, rect);
    const local = localPointer(event.clientX, event.clientY, touch ? pointer.current.slot : controlsRect(event.currentTarget));
    const start = pointer.current?.start;
    const drag = start ? { x: local.x - start.x, y: local.y - start.y } : { x: 0, y: 0 };
    if (pointer.current && Math.hypot(event.clientX - pointer.current.clientX, event.clientY - pointer.current.clientY) > 8) pointer.current.moved = true;
    target.current.pressed = Boolean(pointer.current && !pointer.current.moved);
    const { tiltX, tiltY } = interactionTargets(local, drag, touch);
    const dragging = touch && pointer.current.mode === 'drag';
    Object.assign(target.current, { tiltX, tiltY, x: point.x, y: point.y, localX: local.x, localY: local.y, active: !dragging, touch, dragging, keyboard: false });
  };
  const down = (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const slot = controlsRect(event.currentTarget);
    if (event.pointerType !== 'mouse' && !insideCrystalSlot(event.clientX, event.clientY, slot)) return;
    pointer.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, moved: false, mode: 'pending', slot, rect: event.currentTarget.getBoundingClientRect(), start: localPointer(event.clientX, event.clientY, slot) };
    if (event.pointerType === 'mouse') event.currentTarget.setPointerCapture(event.pointerId);
    update(event);
  };
  const keyboard = (event) => {
    if (event.key === 'Escape') { reset(); return; }
    const activate = event.key === 'Enter' || event.key === ' ';
    if (!activate && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const slot = controlsRect(event.currentTarget);
    const point = localPointer(slot.left + slot.width / 2, slot.top + slot.height / 2, event.currentTarget.getBoundingClientRect());
    if (activate && !event.repeat) { target.current.activation++; target.current.opener = event.currentTarget; }
    Object.assign(target.current, { x: point.x, y: point.y, active: true, touch: false, dragging: false, keyboard: true,
      tiltX: Math.max(-.15, Math.min(.15, target.current.tiltX + (event.key === 'ArrowUp' ? -.035 : event.key === 'ArrowDown' ? .035 : 0))),
      tiltY: Math.max(-.22, Math.min(.22, target.current.tiltY + (event.key === 'ArrowLeft' ? -.045 : event.key === 'ArrowRight' ? .045 : 0))) });
  };
  const release = (event) => {
    if (pointer.current && pointer.current.id !== event.pointerId) return;
    if (event.type === 'pointerup' && pointer.current && !pointer.current.moved) {
      update(event);
      if (pointer.current && !pointer.current.moved) { target.current.activation++; target.current.opener = event.currentTarget; event.currentTarget.focus({ preventScroll: true }); }
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointer.current = null;
    Object.assign(target.current, { tiltX: 0, tiltY: 0, active: event.type === 'pointerup' && event.pointerType === 'mouse', pressed: false, dragging: false, keyboard: false });
  };

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse), (max-width: 767px)");
    const resize = () => {
      const modestHardware = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
      const small = query.matches || modestHardware;
      setCompact(Boolean(small));
      setDpr(Math.min(window.devicePixelRatio || 1, small ? 1 : window.innerWidth < 1200 ? 1.25 : 1.5));
    };
    resize(); query.addEventListener("change", resize);
    window.addEventListener('resize', resize);
    return () => { query.removeEventListener("change", resize); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "pan-y pinch-zoom" }} tabIndex={0} onKeyDown={keyboard} onBlur={reset} onPointerDown={down} onPointerMove={update} onPointerUp={release} onPointerCancel={release} onPointerLeave={reset} onLostPointerCapture={reset} aria-describedby="crystal-instructions" data-crystal-control role="button" aria-haspopup="dialog" aria-label="Interactive Tathva crystal">
      <Canvas dpr={renderDpr} frameloop={active ? "always" : "never"} camera={{ fov: 32, position: [0, 0, 7], near: .1, far: 30 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.setClearColor(0, 0); gl.toneMapping = NoToneMapping; gl.transmissionResolutionScale = .75; }} fallback={null}>
        <ContextEvents onFailure={onFailure} onLost={onLost} onRestored={onRestored} shaderFailed={shaderFailed} />
        <RenderBudget compact={compact} degraded={degraded} onQuality={setDegraded} />
        <CrystalOptics compact={compact || degraded} warmupReady={warmupReady} assetsMounted={assetsMounted} onFailure={onFailure} journey={journey} />
        <ambientLight intensity={.08} />
        <directionalLight position={[-3, 4, 3]} color="#abcfff" intensity={.7} />
        <pointLight position={[1.8, -1.2, 1]} color="#cb79d9" intensity={2.8} distance={5} decay={2} />
        {/* Readiness includes every asset needed for the entrance, not just the shell. */}
        <Suspense fallback={<LoadingCrystal journey={journey} target={target} reduced={reduced} />}>
          <SceneEnvironment shared={!!journey} />
          <CrystalModel target={target} reduced={reduced} compact={compact || degraded} textureCompact={compact} onReady={() => { if (!shaderFailed.current) onReady(); }} onMood={reportMood} journey={journey} onProject={onProject} />
          {transition && journey && <ConclaveVeil journey={journey} compact={compact || degraded} />}
          <SceneWarmup ready={warmupReady} assetsMounted={assetsMounted} onFailure={onFailure} shaderFailed={shaderFailed} />
        </Suspense>
      </Canvas>
      <span ref={feedback} aria-live='polite' style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }} />
    </div>
  );
}

"use client";
/* eslint-disable react-hooks/immutability -- R3F exposes mutable Three.js scene/camera objects, not React state. */

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { NoToneMapping, PMREMGenerator } from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import CrystalModel from "./CrystalModel";
import ConclaveVeil from "./ConclaveVeil";
import { interactionTargets, localPointer } from "./crystalGeometry.mjs";

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

function ContextEvents({ onFailure }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onFailure);
    return () => canvas.removeEventListener("webglcontextlost", onFailure);
  }, [gl, onFailure]);
  return null;
}

function RenderBudget({ compact }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => { gl.transmissionResolutionScale = compact ? .5 : .75; }, [gl, compact]);
  return null;
}

export default function CrystalScene({ active, onReady, onFailure, journey, onProject }) {
  const target = useRef({ tiltX: 0, tiltY: 0, x: 0, y: 0, active: false, activation: 0, keyboard: false });
  const feedback = useRef(null);
  const reportMood = (awake) => { if (feedback.current) feedback.current.textContent = awake ? 'The robot awakens.' : ''; };
  const pointer = useRef(null);
  const [dpr, setDpr] = useState(1);
  const [compact, setCompact] = useState(true);
  const controlsRect = (element) => element.closest('[data-expo-progress]')?.querySelector('[data-expo-slot]')?.getBoundingClientRect() || element.getBoundingClientRect();

  const reset = () => {
    pointer.current = null;
    Object.assign(target.current, { tiltX: 0, tiltY: 0, active: false, keyboard: false });
  };
  const update = (event) => {
    const touch = event.pointerType !== "mouse";
    if (touch && pointer.current?.id !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = localPointer(event.clientX, event.clientY, rect);
    const local = localPointer(event.clientX, event.clientY, controlsRect(event.currentTarget));
    const start = pointer.current?.start;
    const drag = start ? { x: local.x - start.x, y: local.y - start.y } : { x: 0, y: 0 };
    if (pointer.current && Math.hypot(event.clientX - pointer.current.clientX, event.clientY - pointer.current.clientY) > 8) pointer.current.moved = true;
    const { tiltX, tiltY } = interactionTargets(local, drag, touch);
    Object.assign(target.current, { tiltX, tiltY, x: point.x, y: point.y, active: true, keyboard: false });
  };
  const down = (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointer.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, moved: false, start: localPointer(event.clientX, event.clientY, controlsRect(event.currentTarget)) };
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event);
  };
  const keyboard = (event) => {
    if (event.key === 'Escape') { reset(); return; }
    const activate = event.key === 'Enter' || event.key === ' ';
    if (!activate && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const slot = controlsRect(event.currentTarget);
    const point = localPointer(slot.left + slot.width / 2, slot.top + slot.height / 2, event.currentTarget.getBoundingClientRect());
    if (activate && !event.repeat) target.current.activation++;
    Object.assign(target.current, { x: point.x, y: point.y, active: true, keyboard: true,
      tiltX: Math.max(-.15, Math.min(.15, target.current.tiltX + (event.key === 'ArrowUp' ? -.035 : event.key === 'ArrowDown' ? .035 : 0))),
      tiltY: Math.max(-.22, Math.min(.22, target.current.tiltY + (event.key === 'ArrowLeft' ? -.045 : event.key === 'ArrowRight' ? .045 : 0))) });
  };
  const release = (event) => {
    if (pointer.current && pointer.current.id !== event.pointerId) return;
    if (event.type === 'pointerup' && pointer.current && !pointer.current.moved) target.current.activation++;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointer.current = null;
    Object.assign(target.current, { tiltX: 0, tiltY: 0, active: event.type === 'pointerup', keyboard: false });
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
    <div style={{ width: "100%", height: "100%", touchAction: "pan-y pinch-zoom" }} tabIndex={0} onKeyDown={keyboard} onBlur={reset} onPointerDown={down} onPointerMove={update} onPointerUp={release} onPointerCancel={release} onPointerLeave={reset} onLostPointerCapture={reset} aria-describedby="crystal-instructions" role="img" aria-label="Interactive Tathva crystal">
      <Canvas dpr={dpr} frameloop={active ? "always" : "never"} camera={{ fov: 32, position: [0, 0, 7], near: .1, far: 30 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.setClearColor(0, 0); gl.toneMapping = NoToneMapping; gl.transmissionResolutionScale = .75; }} fallback={null}>
        <ContextEvents onFailure={onFailure} />
        <RenderBudget compact={compact} />
        <Suspense fallback={null}><SceneEnvironment shared={!!journey} /></Suspense>
        <ambientLight intensity={.08} />
        <directionalLight position={[-3, 4, 3]} color="#7bbaff" intensity={.6} />
        <pointLight position={[1.8, -1.2, 1]} color="#ee49cf" intensity={4} distance={5} decay={2} />
        <Suspense fallback={null}><CrystalModel target={target} compact={compact} onReady={onReady} onMood={reportMood} journey={journey} onProject={onProject} /></Suspense>
        {journey && <Suspense fallback={null}><ConclaveVeil journey={journey} /></Suspense>}
      </Canvas>
      <span ref={feedback} aria-live='polite' style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }} />
    </div>
  );
}

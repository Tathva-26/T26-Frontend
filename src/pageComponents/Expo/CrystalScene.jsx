"use client";
/* eslint-disable react-hooks/immutability -- R3F exposes mutable Three.js scene/camera objects, not React state. */

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { NoToneMapping, PMREMGenerator } from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import CrystalModel from "./CrystalModel";
import { interactionTargets, localPointer } from "./crystalGeometry.mjs";

function SceneEnvironment() {
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
    const mobile = size.width < 360;
    const halfVertical = (camera.fov * Math.PI) / 360;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * size.width / Math.max(size.height, 1));
    // Fit the entire animated silhouette, including the asymmetric upper point.
    camera.position.z = Math.max(1.9 / Math.tan(halfVertical), 1.25 / Math.tan(halfHorizontal)) * (mobile ? 1.02 : 1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);
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

export default function CrystalScene({ active, onReady, onFailure }) {
  const target = useRef({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  const pointer = useRef(null);
  const [dpr, setDpr] = useState(1);

  const reset = () => {
    pointer.current = null;
    Object.assign(target.current, { x: 0, y: 0, tiltX: 0, tiltY: 0 });
  };
  const update = (event) => {
    const touch = event.pointerType !== "mouse";
    if (touch && pointer.current?.id !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = localPointer(event.clientX, event.clientY, rect);
    const start = pointer.current?.start;
    const drag = start ? { x: point.x - start.x, y: point.y - start.y } : { x: 0, y: 0 };
    Object.assign(target.current, interactionTargets(point, drag, touch));
  };
  const down = (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointer.current = { id: event.pointerId, start: localPointer(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()) };
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event);
  };
  const release = (event) => {
    if (pointer.current && pointer.current.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    reset();
  };

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse), (max-width: 767px)");
    const resize = () => setDpr(query.matches ? 1 : Math.min(window.devicePixelRatio, 1.5));
    resize(); query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "pan-y pinch-zoom" }} onPointerDown={down} onPointerMove={update} onPointerUp={release} onPointerCancel={release} onPointerLeave={reset} onLostPointerCapture={reset} aria-describedby="crystal-instructions" role="img" aria-label="Interactive Tathva crystal">
      <Canvas dpr={dpr} frameloop={active ? "always" : "never"} camera={{ fov: 32, position: [0, 0, 7], near: .1, far: 30 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.setClearColor(0, 0); gl.toneMapping = NoToneMapping; gl.transmissionResolutionScale = .75; }} fallback={null}>
        <ContextEvents onFailure={onFailure} />
        <Suspense fallback={null}><SceneEnvironment /></Suspense>
        <ambientLight intensity={.08} />
        <directionalLight position={[-3, 4, 3]} color="#7bbaff" intensity={.6} />
        <pointLight position={[1.8, -1.2, 1]} color="#ee49cf" intensity={4} distance={5} decay={2} />
        <Suspense fallback={null}><CrystalModel target={target} onReady={onReady} /></Suspense>
      </Canvas>
    </div>
  );
}

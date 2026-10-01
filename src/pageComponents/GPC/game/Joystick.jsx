"use client";

import { useRef } from "react";
import { clamp } from "@/lib/spaceShooter/math";

/**
 * Retro arcade joystick. Fills whatever box the parent gives it (the parent
 * decides size and position). Reports normalized x/y (-1..1) via onChange
 * and resets to 0,0 on release.
 */
export default function Joystick({ onChange }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const activePointerId = useRef(null);

  const updateFromPointer = (event) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    let dx = (event.clientX - cx) / radius;
    let dy = (event.clientY - cy) / radius;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 1) {
      dx /= magnitude;
      dy /= magnitude;
    }
    dx = clamp(dx, -1, 1);
    dy = clamp(dy, -1, 1);

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx * radius * 0.42}px, ${dy * radius * 0.42}px)`;
    }
    onChange(dx, dy);
  };

  const reset = () => {
    activePointerId.current = null;
    if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)";
    onChange(0, 0);
  };

  const handlePointerDown = (event) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerId.current = event.pointerId;
    updateFromPointer(event);
  };

  const handlePointerMove = (event) => {
    if (activePointerId.current !== event.pointerId) return;
    updateFromPointer(event);
  };

  const handlePointerUp = (event) => {
    if (activePointerId.current !== event.pointerId) return;
    reset();
  };

  return (
    <div
      ref={baseRef}
      className="pointer-events-auto relative h-full w-full touch-none select-none rounded-full"
      style={{
        background: "radial-gradient(circle at 50% 40%, #2a2a3a 0%, #14141f 70%, #0a0a12 100%)",
        border: "3px solid #05050a",
        boxShadow:
          "0 0 0 3px #4a4a66, inset 0 4px 10px rgba(0,0,0,0.8), 0 5px 0 3px #05050a",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
    >
      {/* crosshair grooves */}
      <div className="absolute left-1/2 top-[12%] h-[76%] w-[3px] -translate-x-1/2 bg-black/50" />
      <div className="absolute left-[12%] top-1/2 h-[3px] w-[76%] -translate-y-1/2 bg-black/50" />

      {/* red ball top */}
      <div
        ref={knobRef}
        className="absolute inset-0 m-auto aspect-square w-[46%] rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, #ff8a8a 0%, #e02020 45%, #8a0000 100%)",
          border: "2px solid #3a0000",
          boxShadow: "0 5px 0 #4a0000, 0 8px 6px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}
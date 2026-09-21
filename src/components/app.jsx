import React from "react";
import { DotsBackground } from "./DotsBackground.jsx";
import { GlowLetters } from "./glow.jsx";

/**
 * Dots + letters together. Run this file to see the full effect.
 *  - The dots are always white and glow around the pointer anywhere on the page.
 *  - The letters light up with a solid colour gradient under the pointer.
 */
export default function App() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "#161616",
        overflow: "hidden",
      }}
    >
      <DotsBackground />
      <GlowLetters />
    </div>
  );
}
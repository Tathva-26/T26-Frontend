"use client";
import { useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { Hero } from "@/pageComponents/Hero";
import { Frame } from "@/pageComponents/W1/Frame";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";
import Navbar from "@/pageComponents/Navbar/Navbar";

// Whiteout colour — pure white for a clean flash
const WHITEOUT_COLOR = "#ffffff";

export default function Page() {
  // Which full-screen panel is active
  const [section, setSection] = useState("hero"); // "hero" | "frame"
  const whiteoutRef = useRef(null);
  const transitioning = useRef(false);

  /**
   * Fade-in whiteout → swap panel → fade-out whiteout.
   * Safe to call from any direction (hero→frame or frame→hero).
   */
  const transitionTo = useCallback((target) => {
    if (transitioning.current) return;
    transitioning.current = true;

    const el = whiteoutRef.current;
    if (!el) {
      setSection(target);
      transitioning.current = false;
      return;
    }

    // 1. Flash white in quickly
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          // 2. Swap the panel (invisible behind white)
          if (target === "hero") {
            // Reset hero internal scroll to top before revealing
            const heroScroller = document.getElementById("hero-scroller");
            if (heroScroller) heroScroller.scrollTop = 0;
          }
          setSection(target);

          // 3. Let React paint, then fade white out
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              gsap.to(el, {
                opacity: 0,
                duration: 0.5,
                ease: "power1.out",
                onComplete: () => {
                  transitioning.current = false;
                },
              });
            });
          });
        },
      }
    );
  }, []);

  const handleHeroEnter = useCallback(() => transitionTo("frame"), [transitionTo]);
  const handleFrameScrollUp = useCallback(() => transitionTo("hero"), [transitionTo]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100svh", overflow: "hidden" }}>
      <Navbar />

      {/* ── Hero panel ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          // Keep both panels mounted; only show the active one.
          // visibility swap ensures Hero's GSAP scroll context is preserved.
          visibility: section === "hero" ? "visible" : "hidden",
          zIndex: section === "hero" ? 2 : 1,
        }}
      >
        <Hero onEnter={handleHeroEnter} />
      </div>

      {/* ── Frame panel ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          visibility: section === "frame" ? "visible" : "hidden",
          zIndex: section === "frame" ? 2 : 1,
        }}
      >
        <Frame onScrollUp={handleFrameScrollUp} isActive={section === "frame"} />
      </div>

      {/* ── Global whiteout overlay ── */}
      <div
        ref={whiteoutRef}
        style={{
          position: "fixed",
          inset: 0,
          background: WHITEOUT_COLOR,
          opacity: 0,
          pointerEvents: "none",
          zIndex: 9999,
        }}
        aria-hidden="true"
      />

      <TathvaMenu />
    </div>
  );
}
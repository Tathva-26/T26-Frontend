"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import gsap from "gsap";
import { Hero } from "@/pageComponents/Hero";
import { Frame } from "@/pageComponents/W1/Frame";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";
import Navbar from "@/pageComponents/Navbar/Navbar";

// Whiteout colour — pure white for a clean flash
const WHITEOUT_COLOR = "#ffffff";

// Scroll distance (in pixels) across which the whiteout fades between 100% white and page
const FADE_DISTANCE = 350;

export default function Page() {
  // Which full-screen panel is active
  const [section, setSection] = useState("hero"); // "hero" | "frame"
  const sectionRef = useRef("hero");

  const whiteoutRef = useRef(null);
  const isAutoTransitioning = useRef(false);

  // Scroll accumulators for the bidirectional transitions
  // transitionScrollRef: tracks forward fadeout into Frame (0 = 100% white, FADE_DISTANCE = 0% white / fully revealed Frame)
  const transitionScrollRef = useRef(0);
  // reverseScrollRef: tracks upward fadein from Frame to Hero (0 = Frame visible, FADE_DISTANCE = 100% white)
  const reverseScrollRef = useRef(0);

  // Keep sectionRef in sync with state
  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  /**
   * Smoothly tweens the global white overlay opacity to target value.
   * Short duration (0.12s) eliminates wheel stepping while maintaining instantaneous feel.
   */
  const setWhiteoutOpacity = useCallback((target) => {
    const el = whiteoutRef.current;
    if (!el) return;
    const clamped = Math.min(1, Math.max(0, target));
    gsap.to(el, {
      opacity: clamped,
      duration: 0.12,
      ease: "power1.out",
      overwrite: true,
    });
  }, []);

  /**
   * Hero scroll progress (0.0 to 1.0) reported by Hero's ScrollTrigger.
   * Last 15% of the runway (0.85 -> 1.00) fades white in from 0.0 to 1.0.
   */
  const handleHeroProgress = useCallback(
    (progress) => {
      if (sectionRef.current !== "hero" || isAutoTransitioning.current) return;

      if (progress >= 0.85) {
        const opacity = (progress - 0.85) / 0.15;
        setWhiteoutOpacity(opacity);
      } else {
        setWhiteoutOpacity(0);
      }
    },
    [setWhiteoutOpacity]
  );

  /**
   * Called when user is at the bottom of Hero and continues scrolling DOWN.
   * Fades out the white to reveal Frame, completely scroll-driven.
   */
  const handleHeroScrollBeyondEnd = useCallback(
    (deltaY) => {
      if (isAutoTransitioning.current) return;

      // Switch to Frame behind the 100% white curtain
      if (sectionRef.current === "hero") {
        setSection("frame");
        sectionRef.current = "frame";
        transitionScrollRef.current = 0;
        reverseScrollRef.current = 0;
        setWhiteoutOpacity(1);
      }

      if (sectionRef.current === "frame") {
        transitionScrollRef.current = Math.max(
          0,
          Math.min(FADE_DISTANCE, transitionScrollRef.current + deltaY)
        );

        // If user scrolled back up past the start of the fadeout
        if (transitionScrollRef.current <= 0) {
          transitionScrollRef.current = 0;
          setWhiteoutOpacity(1);
          setSection("hero");
          sectionRef.current = "hero";
          return;
        }

        // Fading out from white: opacity goes 1.0 -> 0.0
        const progress = transitionScrollRef.current / FADE_DISTANCE;
        setWhiteoutOpacity(1 - progress);
      }
    },
    [setWhiteoutOpacity]
  );

  /**
   * Called when user scrolls on Frame.
   * Handles forward completion / upward reverse transition back to Hero.
   */
  const handleFrameScroll = useCallback(
    (deltaY) => {
      if (isAutoTransitioning.current) return;

      // 1. If still in forward fadeout phase
      if (transitionScrollRef.current < FADE_DISTANCE) {
        transitionScrollRef.current = Math.max(
          0,
          Math.min(FADE_DISTANCE, transitionScrollRef.current + deltaY)
        );

        if (transitionScrollRef.current <= 0) {
          transitionScrollRef.current = 0;
          setWhiteoutOpacity(1);
          setSection("hero");
          sectionRef.current = "hero";
          const heroScroller = document.getElementById("hero-scroller");
          if (heroScroller) {
            heroScroller.scrollTop =
              heroScroller.scrollHeight - heroScroller.clientHeight;
          }
          return;
        }

        const progress = transitionScrollRef.current / FADE_DISTANCE;
        setWhiteoutOpacity(1 - progress);
        return;
      }

      // 2. Fully on Frame: user scrolling UP initiates reverse transition to Hero
      if (deltaY < 0) {
        reverseScrollRef.current += Math.abs(deltaY);

        if (reverseScrollRef.current >= FADE_DISTANCE) {
          // Reached 100% white: swap back to Hero at bottom
          setWhiteoutOpacity(1);
          setSection("hero");
          sectionRef.current = "hero";
          reverseScrollRef.current = 0;
          transitionScrollRef.current = 0;
          const heroScroller = document.getElementById("hero-scroller");
          if (heroScroller) {
            heroScroller.scrollTop =
              heroScroller.scrollHeight - heroScroller.clientHeight;
          }
          return;
        }

        // Fading Frame into white: opacity goes 0.0 -> 1.0
        const progress = reverseScrollRef.current / FADE_DISTANCE;
        setWhiteoutOpacity(progress);
      } else if (deltaY > 0 && reverseScrollRef.current > 0) {
        // User reversed scroll direction back towards Frame
        reverseScrollRef.current = Math.max(0, reverseScrollRef.current - deltaY);
        const progress = reverseScrollRef.current / FADE_DISTANCE;
        setWhiteoutOpacity(progress);
      }
    },
    [setWhiteoutOpacity]
  );

  /**
   * Button click / Enter key cinematic entry.
   * Automatically sweeps from 100% white to Frame without manual scrolling.
   */
  const handleAutoEnter = useCallback(() => {
    isAutoTransitioning.current = true;
    setWhiteoutOpacity(1);
    setSection("frame");
    sectionRef.current = "frame";
    transitionScrollRef.current = FADE_DISTANCE;
    reverseScrollRef.current = 0;

    const el = whiteoutRef.current;
    if (el) {
      gsap.fromTo(
        el,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.75,
          ease: "power2.out",
          onComplete: () => {
            isAutoTransitioning.current = false;
          },
        }
      );
    } else {
      isAutoTransitioning.current = false;
    }
  }, [setWhiteoutOpacity]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100svh",
        overflow: "hidden",
      }}
    >
      <Navbar />

      {/* ── Hero panel ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          visibility: section === "hero" ? "visible" : "hidden",
          zIndex: section === "hero" ? 2 : 1,
        }}
      >
        <Hero
          onProgress={handleHeroProgress}
          onScrollBeyondEnd={handleHeroScrollBeyondEnd}
          onAutoEnter={handleAutoEnter}
        />
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
        <Frame onScroll={handleFrameScroll} isActive={section === "frame"} />
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
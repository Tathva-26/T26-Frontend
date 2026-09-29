"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "@/pageComponents/Hero";
import { Frame } from "@/pageComponents/W1/Frame";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";
import Navbar from "@/pageComponents/Navbar/Navbar";

// Whiteout colour — pure white for a clean flash
const WHITEOUT_COLOR = "#ffffff";

// Scroll distance (in pixels) across which the whiteout fades between 100% white and page
const FADE_DISTANCE = 350;

// Coming back from Frame, Hero is held behind solid white for this long while it re-paints.
const RETURN_HOLD_MS = 500;
// ...and is only jumped to its "end of runway" state after it has painted once at scale 1.
const HERO_END_DELAY_MS = 180;

/**
 * Jump Hero's scroller to the start or end of its runway INSTANTLY, including the scrubbed
 * (smoothed) tweens, so nothing is left animating in the background.
 *
 * Why: while Frame is showing, Hero is hidden. When it becomes visible again the browser rebuilds
 * its GPU layers at whatever scale they currently have. If Hero was left at the END of its runway
 * (girl 15x, portal ~10x) it rebuilds every layer at that extreme zoom and then downscales those
 * huge textures for the whole scroll back = heavy lag. Parking Hero at the START while hidden makes
 * it rebuild at scale 1 (same as the first visit), and we jump to the end only afterwards, behind
 * the white overlay.
 */
function settleHero(where) {
  const scroller = document.getElementById("hero-scroller");
  if (!scroller) return;
  scroller.scrollTop =
    where === "end" ? scroller.scrollHeight - scroller.clientHeight : 0;
  ScrollTrigger.update();
  ScrollTrigger.getAll().forEach((st) => {
    if (st.scroller !== scroller) return;
    const scrubTween = st.getTween?.();
    if (scrubTween) scrubTween.progress(1);
    else if (st.animation) st.animation.progress(st.progress);
  });
}

export default function Page() {
  // Which full-screen panel is active
  const [section, setSection] = useState("hero"); // "hero" | "frame"
  const sectionRef = useRef("hero");

  const whiteoutRef = useRef(null);
  const isAutoTransitioning = useRef(false);
  // last opacity we asked the whiteout to tween to (skip identical requests)
  const whiteoutTarget = useRef(0);
  // while now < this, Hero scroll progress is not allowed to change the whiteout
  const holdWhiteUntil = useRef(0);

  // Scroll accumulators for the bidirectional transitions
  // transitionScrollRef: tracks forward fadeout into Frame (0 = 100% white, FADE_DISTANCE = 0% white / fully revealed Frame)
  const transitionScrollRef = useRef(0);
  // reverseScrollRef: tracks upward fadein from Frame to Hero (0 = Frame visible, FADE_DISTANCE = 100% white)
  const reverseScrollRef = useRef(0);

  // Keep sectionRef in sync with state
  useEffect(() => {
    sectionRef.current = section;
    if (section !== "frame") return undefined;
    // Frame is showing (Hero hidden / behind white): reset Hero to its cheap start state.
    const id = window.setTimeout(() => settleHero("start"), 250);
    return () => window.clearTimeout(id);
  }, [section]);

  /**
   * Smoothly tweens the global white overlay opacity to target value.
   * Short duration (0.12s) eliminates wheel stepping while maintaining instantaneous feel.
   */
  const setWhiteoutOpacity = useCallback((target) => {
    const el = whiteoutRef.current;
    if (!el) return;
    const clamped = Math.min(1, Math.max(0, target));
    // Hero progress reports every scroll frame; don't create a new tween for an unchanged value.
    if (clamped === whiteoutTarget.current) return;
    whiteoutTarget.current = clamped;
    gsap.to(el, {
      opacity: clamped,
      duration: 0.12,
      ease: "power1.out",
      overwrite: true,
    });
  }, []);

  /** Frame -> Hero. Screen is 100% white; Hero repaints at scale 1, then jumps to the end state. */
  const returnToHero = useCallback(() => {
    setWhiteoutOpacity(1);
    holdWhiteUntil.current = performance.now() + RETURN_HOLD_MS;
    setSection("hero");
    sectionRef.current = "hero";
    transitionScrollRef.current = 0;
    reverseScrollRef.current = 0;
    window.setTimeout(() => settleHero("end"), HERO_END_DELAY_MS);
  }, [setWhiteoutOpacity]);

  /**
   * Hero scroll progress (0.0 to 1.0) reported by Hero's ScrollTrigger.
   * Last 15% of the runway (0.85 -> 1.00) fades white in from 0.0 to 1.0.
   */
  const handleHeroProgress = useCallback(
    (progress) => {
      if (sectionRef.current !== "hero" || isAutoTransitioning.current) return;
      if (performance.now() < holdWhiteUntil.current) return;

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
          returnToHero();
          return;
        }

        // Fading out from white: opacity goes 1.0 -> 0.0
        const progress = transitionScrollRef.current / FADE_DISTANCE;
        setWhiteoutOpacity(1 - progress);
      }
    },
    [setWhiteoutOpacity, returnToHero]
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
          returnToHero();
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
          // Reached 100% white: swap back to Hero (at its end state, set up safely)
          returnToHero();
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
    [setWhiteoutOpacity, returnToHero]
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
      whiteoutTarget.current = 0; // this tween ends at 0
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
          isActive={section === "hero"}
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
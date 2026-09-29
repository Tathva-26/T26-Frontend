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

// Hero progress at which the screen counts as fully white -> Frame takes over AUTOMATICALLY.
// (Just under 1.0 so a smoothed wheel scroll that stops a few px short still triggers it.)
const AUTO_ENTER_PROGRESS = 0.995;

// Coming back from Frame: Hero repaints at scale 1 behind solid white, is then jumped to
// HERO_RETURN_PROGRESS (the point where its white overlay is already 0, so there is no dead
// all-white stretch to scroll through), and the white fades out by itself.
const HERO_RETURN_PROGRESS = 0.85;
const HERO_END_DELAY_MS = 180; // settle Hero at HERO_RETURN_PROGRESS after this
const RETURN_HOLD_MS = 320;    // start fading the white out after this
const RETURN_FADE_MS = 600;    // duration of that fade

/**
 * Jump Hero's scroller to a point on its runway (0..1) INSTANTLY, including the scrubbed
 * (smoothed) tweens, so nothing is left animating in the background.
 *
 * Why: while Frame is showing, Hero is hidden. When it becomes visible again the browser rebuilds
 * its GPU layers at whatever scale they currently have. If Hero was left at the END of its runway
 * (girl 15x, portal ~10x) it rebuilds every layer at that extreme zoom and then downscales those
 * huge textures for the whole scroll back = heavy lag. Parking Hero at the START while hidden makes
 * it rebuild at scale 1 (same as the first visit), and we jump to the end only afterwards, behind
 * the white overlay.
 */
function settleHero(fraction) {
  const scroller = document.getElementById("hero-scroller");
  if (!scroller) return;
  scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * fraction;
  ScrollTrigger.update();
  ScrollTrigger.getAll().forEach((st) => {
    if (st.scroller !== scroller) return;
    const scrubTween = st.getTween?.();
    if (scrubTween) scrubTween.progress(1);
    else if (st.animation) st.animation.progress(st.progress);
  });
}

export default function HeroFrameController() {
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
    const id = window.setTimeout(() => settleHero(0), 250);
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

  /** Frame -> Hero. Screen is 100% white; Hero repaints at scale 1, then lands at HERO_RETURN_PROGRESS and the white fades out by itself. */
  const returnToHero = useCallback(() => {
    setWhiteoutOpacity(1);
    // keep Hero progress from touching the whiteout until our own fade has finished
    holdWhiteUntil.current = performance.now() + RETURN_HOLD_MS + RETURN_FADE_MS;
    setSection("hero");
    sectionRef.current = "hero";
    transitionScrollRef.current = 0;
    reverseScrollRef.current = 0;

    // 1) after Hero has painted once at scale 1 (behind white), jump to where its white is 0
    window.setTimeout(() => {
      if (sectionRef.current === "hero") settleHero(HERO_RETURN_PROGRESS);
    }, HERO_END_DELAY_MS);

    // 2) then fade the white out on its own - no scrolling needed to get out of the white
    window.setTimeout(() => {
      const el = whiteoutRef.current;
      if (!el || sectionRef.current !== "hero") return;
      whiteoutTarget.current = 0;
      gsap.to(el, {
        opacity: 0,
        duration: RETURN_FADE_MS / 1000,
        ease: "power2.out",
        overwrite: true,
      });
    }, RETURN_HOLD_MS);
  }, [setWhiteoutOpacity]);

  /**
   * Hero -> Frame. Runs automatically the moment Hero's screen is fully white (scroll to the
   * end, or Enter key / button): sweeps from 100% white to Frame with NO extra scrolling.
   */
  const handleAutoEnter = useCallback(() => {
    // Already on Frame (e.g. the progress trigger fired first, then the Enter tween finished).
    if (sectionRef.current === "frame") return;
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

  /**
   * Hero scroll progress (0.0 to 1.0) reported by Hero's ScrollTrigger.
   * Last 15% of the runway (0.85 -> 1.00) fades white in from 0.0 to 1.0.
   */
  const handleHeroProgress = useCallback(
    (progress) => {
      if (sectionRef.current !== "hero" || isAutoTransitioning.current) return;
      if (performance.now() < holdWhiteUntil.current) return;

      // Fully white: don't wait for more scrolling, reveal Frame on its own.
      if (progress >= AUTO_ENTER_PROGRESS) {
        handleAutoEnter();
        return;
      }

      if (progress >= 0.85) {
        const opacity = (progress - 0.85) / 0.15;
        setWhiteoutOpacity(opacity);
      } else {
        setWhiteoutOpacity(0);
      }
    },
    [setWhiteoutOpacity, handleAutoEnter]
  );

  /**
   * Called when the user keeps wheeling DOWN at the very bottom of Hero. The screen is already
   * (almost) white, so just hand over to Frame automatically instead of requiring FADE_DISTANCE
   * more pixels of scrolling.
   */
  const handleHeroScrollBeyondEnd = useCallback(() => {
    if (isAutoTransitioning.current || sectionRef.current !== "hero") return;
    handleAutoEnter();
  }, [handleAutoEnter]);

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
          // Reached 100% white: swap back to Hero (repaints at scale 1, then fades in on its own)
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
"use client";
import { useRef, useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "@/pageComponents/Hero";
import { Frame } from "@/pageComponents/W1/Frame";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";

// Hero progress at which the portal fills the screen -> Frame takes over.
// (Just under 1.0 so a smoothed wheel scroll that stops a few px short still triggers it.)
const AUTO_ENTER_PROGRESS = 0.995;

// Same breakpoint Hero uses for its mobile layout.
const MOBILE_QUERY = "(max-width: 768px)";
const subscribeMobile = (cb) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches;
// Server snapshot is "desktop" so SSR output matches the first client render (no hydration error);
// on mobile React re-renders right after hydration and drops TathvaMenu.
const getIsMobileServer = () => false;

export default function HeroFrameController({ children }) {
  const isMobile = useSyncExternalStore(subscribeMobile, getIsMobile, getIsMobileServer);
  const [section, setSection] = useState("hero"); // "hero" | "frame"
  const sectionRef = useRef("hero");
  // Only Hero is ever hidden. Frame is the real, always-painted background: Hero cuts a hole
  // through itself (the portal) and Frame shows through it, so the hand-over is just hiding Hero.
  const [heroVisible, setHeroVisible] = useState(true);
  // latest progress of Hero's portal animation (0..1)
  const heroProgressRef = useRef(0);

  // Once Frame is showing and the user keeps scrolling down, stop intercepting the wheel and
  // let normal page scroll reach `children`. Scrolling back up to the very top re-locks.
  const [unlocked, setUnlocked] = useState(false);
  // `children` are heavy, so they only mount once the user first unlocks past Frame.
  const [hasReachedContent, setHasReachedContent] = useState(false);

  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  // Hero <-> Frame. Frame is already painted underneath and the open portal looks exactly like
  // it, so the swap is just showing/hiding the Hero panel (no waiting for a repaint).
  const swapTo = useCallback((target) => {
    if (sectionRef.current === target) return;
    sectionRef.current = target;
    setSection(target);
    setHeroVisible(target === "hero");
  }, []);

  // Hero -> Frame.
  const enterFrame = useCallback(() => swapTo("frame"), [swapTo]);

  // Frame -> Hero. Hero is still parked at the end of its runway (portal fully open, which
  // looks exactly like Frame), so scrolling up just plays the portal back.
  const returnToHero = useCallback(() => swapTo("hero"), [swapTo]);

  const handleHeroProgress = useCallback(
    (progress) => {
      heroProgressRef.current = progress;
      if (sectionRef.current === "hero" && progress >= AUTO_ENTER_PROGRESS) enterFrame();
    },
    [enterFrame]
  );

  // Wheeling past the end only counts once the portal has actually finished opening.
  const handleHeroScrollBeyondEnd = useCallback(() => {
    if (heroProgressRef.current >= AUTO_ENTER_PROGRESS) enterFrame();
  }, [enterFrame]);

  const handleFrameScroll = useCallback(
    (deltaY) => {
      if (deltaY < 0) {
        returnToHero();
      } else if (deltaY > 0) {
        setUnlocked(true);
        setHasReachedContent(true);
      }
    },
    [returnToHero]
  );

  // Lenis and ScrollTrigger need a nudge when the wrapper's height changes or children mount.
  useEffect(() => {
    window.__lenis?.resize();
    if (hasReachedContent) ScrollTrigger.refresh();
  }, [unlocked, hasReachedContent]);

  // Re-lock when the user scrolls up past the very top of the page while unlocked.
  useEffect(() => {
    if (!unlocked) return undefined;
    const mainScroll = document.querySelector(".main-scroll");
    if (!mainScroll) return undefined;

    const handleWheel = (e) => {
      if (e.deltaY >= 0 || mainScroll.scrollTop > 0) return;
      e.preventDefault();
      setUnlocked(false);
    };

    mainScroll.addEventListener("wheel", handleWheel, { passive: false });
    return () => mainScroll.removeEventListener("wheel", handleWheel);
  }, [unlocked]);

  // Hero is visually empty (portal fully open, matching Frame) once it's not the front panel,
  // so there's nothing to gain by hiding it for the hero<->frame swap — only block its input.
  // `unlocked` is the one case that really hides it: the user has scrolled past Frame into the
  // real page content underneath.
  const heroInteractive = heroVisible && !unlocked;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: unlocked ? "auto" : "100svh",
        overflow: unlocked ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          visibility: unlocked ? "hidden" : "visible",
          pointerEvents: heroInteractive ? "auto" : "none",
          zIndex: 3, // always above Frame, so the outgoing panel stays on top during a swap
        }}
        aria-hidden={!heroInteractive}
        inert={!heroInteractive}
      >
        <Hero
          onProgress={handleHeroProgress}
          onScrollBeyondEnd={handleHeroScrollBeyondEnd}
          onAutoEnter={enterFrame}
          isActive={section === "hero" && !unlocked}
        />
      </div>

      <div
        style={{
          position: unlocked ? "relative" : "absolute",
          inset: unlocked ? undefined : 0,
          zIndex: unlocked ? undefined : 2,
        }}
      >
        <Frame onScroll={handleFrameScroll} isActive={section === "frame" && !unlocked} />
      </div>

      {!isMobile && <TathvaMenu />}

      {hasReachedContent && children}
    </div>
  );
}
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Uses the app's `.main-scroll` container when present, and falls back to
// Lenis's normal window scroller on standalone routes.
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wrapper = document.querySelector(".main-scroll");
    const lenis = wrapper
      ? new Lenis({ wrapper, content: wrapper })
      : new Lenis();
    // Exposed so components that toggle a clipped section's height (e.g. the Hero/Frame
    // pinned experience unlocking into normal scroll) can force Lenis to recompute its
    // cached scroll limit — its own ResizeObserver only fires on `wrapper`'s own box size,
    // which doesn't change when an inner child's clipped height does.
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      if (window.__lenis === lenis) window.__lenis = null;
    };
  }, []);

  return null;
}

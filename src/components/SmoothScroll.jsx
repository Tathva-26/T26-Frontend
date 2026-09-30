"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Drives Lenis smooth scrolling on `.main-scroll` — the app's own scroll
// container (everything scrolls inside this div, not the window) — and keeps
// it in lockstep with GSAP's ticker so every existing ScrollTrigger (Wheels,
// Robowars, Footer, Artist, ...), which all already point `scroller` at
// `.main-scroll`, keeps working unchanged: Lenis animates the wrapper's real
// `scrollTop` via native `scrollTo()`, it doesn't fake scroll with transforms.
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const wrapper = document.querySelector(".main-scroll");
    if (!wrapper) return;

    const lenis = new Lenis({ wrapper, content: wrapper });
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

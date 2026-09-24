import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CLIP, HERO_SCROLL } from "@/pageComponents/GPC/gpcConfig";

gsap.registerPlugin(ScrollTrigger);

const layer = (name) => `[data-layer="${name}"]`;

/**
 * Pins the hero and scrubs it from Figma frame 1 to frame 2.
 * Layers are styled in their FINAL (frame 2) state; the timeline animates
 * away from frame 1 values, so reduced-motion users simply see frame 2.
 */
export function useHeroTimeline(rootRef) {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const nav = document.querySelector("[data-nav]");
        gsap.set(layer("console"), { pointerEvents: "none" });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: HERO_SCROLL.end,
            scrub: HERO_SCROLL.scrub,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        // Frame 1 elements leave.
        tl.fromTo(layer("brackets"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0)
          .fromTo(layer("title-a"), { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.25 }, 0)
          .fromTo(layer("cta-a"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0);

        // Shared elements morph between the two frames.
        tl.from(layer("banner"), { clipPath: CLIP.start, duration: 0.6 }, 0.05).from(
          layer("dragon"),
          { x: -123, y: -24, scale: 1.255, duration: 0.6 },
          0.05
        );

        // Frame 2 elements arrive.
        if (nav) tl.from(nav, { yPercent: -100, opacity: 0, duration: 0.25 }, 0.45);
        tl.from(layer("title-b"), { opacity: 0, y: 40, duration: 0.25 }, 0.55)
          .from(layer("cta-b"), { opacity: 0, duration: 0.2 }, 0.6)
          .from(
            layer("console"),
            { opacity: 0, y: 120, scale: 0.9, duration: 0.3, ease: "back.out(1.4)" },
            0.6
          )
          .from(layer("tagline"), { opacity: 0, y: 30, duration: 0.25 }, 0.75)
          .set(layer("console"), { pointerEvents: "auto" }, 0.9);
      },
      rootRef
    );

    return () => mm.revert();
  }, [rootRef]);
}

import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DRAGON_FLY } from "./gpcMobileConfig";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scrubs the dragon away as the mobile hero section scrolls past - no pin,
 * so the page scrolls at its normal rate and the effect simply reverses on
 * scroll-up via GSAP's scrub. Also tracks scroll progress in a ref, read by
 * NightMountainScene for a matching parallax nudge.
 *
 * Uses useGSAP (see useHeroTimeline for why) so the ScrollTrigger is torn
 * down in the correct order relative to React if this component unmounts
 * mid-scroll - e.g. GpcHero swapping back to the desktop layout on resize.
 */
export function useMobileDragonScroll(sectionRef, dragonRef) {
  const progressRef = useRef(0);
  const getProgress = useMemo(() => () => progressRef.current, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(dragonRef.current, {
          y: DRAGON_FLY.translateY,
          x: DRAGON_FLY.translateX,
          scale: DRAGON_FLY.scale,
          opacity: DRAGON_FLY.opacity,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              progressRef.current = self.progress;
            },
          },
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [sectionRef, dragonRef] }
  );

  return getProgress;
}
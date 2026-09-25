import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CLIP, HERO_SCROLL } from "@/pageComponents/GPC/gpcConfig";

gsap.registerPlugin(ScrollTrigger);

const layer = (name) => `[data-layer="${name}"]`;

export function useHeroTimeline(rootRef) {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const nav = document.querySelector("[data-nav]");

        gsap.set(layer("console"), {
          pointerEvents: "none",
        });

        const timeline = gsap.timeline({
          defaults: {
            ease: "none",
          },
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: HERO_SCROLL.end,
            scrub: HERO_SCROLL.scrub,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .fromTo(
            layer("brackets"),
            { opacity: 1 },
            { opacity: 0, duration: 0.2 },
            0
          )
          .fromTo(
            layer("title-a"),
            { opacity: 1, y: 0 },
            { opacity: 0, y: -40, duration: 0.25 },
            0
          )
          .fromTo(
            layer("cta-a"),
            { opacity: 1 },
            { opacity: 0, duration: 0.2 },
            0
          )
          .fromTo(
            layer("banner"),
            { clipPath: CLIP.start },
            { clipPath: CLIP.end, duration: 0.6 },
            0.05
          )
          .fromTo(
            layer("dragon"),
            {
              x: -123,
              y: -24,
              scale: 1.255,
            },
            {
              x: 0,
              y: 0,
              scale: 1,
              duration: 0.6,
            },
            0.05
          );

        if (nav) {
          timeline.fromTo(
            nav,
            {
              yPercent: -100,
              opacity: 0,
            },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.25,
            },
            0.45
          );
        }

        timeline
          .fromTo(
            layer("title-b"),
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.25 },
            0.55
          )
          .fromTo(
            layer("cta-b"),
            { opacity: 0 },
            { opacity: 1, duration: 0.2 },
            0.6
          )
          .fromTo(
            layer("console"),
            {
              opacity: 0,
              y: 120,
              scale: 0.9,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.3,
              ease: "back.out(1.4)",
            },
            0.6
          )
          .fromTo(
            layer("tagline"),
            {
              opacity: 0,
              y: 30,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.25,
            },
            0.75
          )
          .set(
            layer("console"),
            {
              pointerEvents: "auto",
            },
            0.9
          );
      },
      rootRef
    );

    return () => mm.revert();
  }, [rootRef]);
}
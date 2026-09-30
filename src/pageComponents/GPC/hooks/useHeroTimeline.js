import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CLIP, DRAGON_FRAME_1, DRAGON_FRAME_2, HERO_SCROLL } from "@/pageComponents/GPC/gpcConfig";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const layer = (name) => `[data-layer="${name}"]`;

/**
 * Pins the hero and scrubs it from Figma frame 1 to frame 2.
 * Layers are styled in their FINAL (frame 2) state; the timeline animates
 * away from frame 1 values, so reduced-motion users simply see frame 2.
 *
 * `enabled` (default true) gates the whole effect - GpcHero passes false
 * on mobile. Page scroll unlock lives in usePageScrollUnlock, called
 * unconditionally by GpcHero, since it's needed regardless of which
 * layout is active - only the pin itself is desktop-only.
 */
export function useHeroTimeline(rootRef, { enabled = true } = {}) {
  useGSAP(
    () => {
      if (!enabled) return undefined;

      ScrollTrigger.getAll()
        .filter((st) => st.trigger === rootRef.current)
        .forEach((st) => st.kill());

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

          tl.fromTo(layer("brackets"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0)
            .fromTo(layer("title-a"), { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.25 }, 0)
            .fromTo(layer("cta-a"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0);

          tl.from(layer("banner"), { clipPath: CLIP.start, duration: 0.6 }, 0.05);

          tl.from(
            layer("dragon"),
            {
              x: DRAGON_FRAME_1.x - DRAGON_FRAME_2.x,
              y: DRAGON_FRAME_1.y - DRAGON_FRAME_2.y,
              scale: DRAGON_FRAME_1.width / DRAGON_FRAME_2.width,
              duration: 0.6,
            },
            0.05
          );

          if (nav) tl.from(nav, { yPercent: -100, opacity: 0, duration: 0.25 }, 0.45);
          tl.from(layer("title-b"), { opacity: 0, y: 40, duration: 0.25 }, 0.55)
            .from(layer("cta-b"), { opacity: 0, duration: 0.2 }, 0.6)
            .from(layer("console"), { opacity: 0, y: 120, scale: 0.9, duration: 0.3, ease: "back.out(1.4)" }, 0.6)
            .from(layer("tagline"), { opacity: 0, y: 30, duration: 0.25 }, 0.75)
            .set(layer("console"), { pointerEvents: "auto" }, 0.9);
        },
        rootRef
      );

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [rootRef, enabled] }
  );
}
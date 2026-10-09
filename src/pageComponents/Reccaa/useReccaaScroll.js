/**
 * Drives the RECCAA archive as a sequence of scroll-scrubbed compositions.
 */

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SCENES = [
  {
    id: "ch1",
    image: { from: { yPercent: 7, scale: 1.015 }, to: { yPercent: -2, scale: 1.035 } },
    date: { from: { xPercent: -2, yPercent: 9 }, to: { xPercent: 0, yPercent: -4 } },
    title: { from: { xPercent: -2 }, to: { xPercent: 0 } },
  },
  {
    id: "ch2",
    image: { from: { xPercent: 7, yPercent: 5, scale: 1.015 }, to: { xPercent: 0, yPercent: -2, scale: 1.04 } },
    secondary: { from: { xPercent: 15, yPercent: 8, scale: 0.99, opacity: 0.62 }, to: { xPercent: 0, yPercent: 0, scale: 1, opacity: 1 } },
    date: { from: { xPercent: -3, yPercent: 7 }, to: { xPercent: 0, yPercent: -3 } },
    title: { from: { xPercent: -2 }, to: { xPercent: 0 } },
  },
  {
    id: "ch3",
    image: { from: { xPercent: -6, yPercent: 4, scale: 1.01 }, to: { xPercent: 0, yPercent: -2, scale: 1.035 } },
    document: { from: { xPercent: 13, yPercent: 8, opacity: 0.58 }, to: { xPercent: 0, yPercent: 0, opacity: 1 } },
    date: { from: { xPercent: -2, yPercent: 8 }, to: { xPercent: 0, yPercent: -3 } },
  },
  {
    id: "ch4",
    image: { from: { yPercent: 6, scale: 1.015 }, to: { yPercent: -3, scale: 1.04 } },
    document: { from: { xPercent: 12, yPercent: 9, opacity: 0.6 }, to: { xPercent: 0, yPercent: 0, opacity: 1 } },
    date: { from: { xPercent: -2, yPercent: 8 }, to: { xPercent: 0, yPercent: -4 } },
    title: { from: { xPercent: -2 }, to: { xPercent: 0 } },
  },
  {
    id: "ch5",
    image: { from: { xPercent: 5, yPercent: 4, scale: 1.01 }, to: { xPercent: 0, yPercent: -2, scale: 1.03 } },
    document: { from: { xPercent: 12, yPercent: 7, opacity: 0.65 }, to: { xPercent: 0, yPercent: 0, opacity: 1 } },
    date: { from: { xPercent: 2, yPercent: 7 }, to: { xPercent: 0, yPercent: -3 } },
    title: { from: { xPercent: 2 }, to: { xPercent: 0 } },
  },
];

function addScrubbedTransform(timeline, element, motion, duration = 1) {
  if (!element || !motion) return;

  timeline.fromTo(
    element,
    { ...motion.from, ease: "none" },
    { ...motion.to, duration, ease: "none" },
    0
  );
}

function createSceneTimeline(root, scene, previousScene, scroller) {
  const section = root.querySelector(`#${scene.id}`);
  if (!section) return null;

  const primaryImage = section.querySelector(
    '.ed__col--visual [data-layer="primary-image"]'
  );
  const secondaryImage = section.querySelector(
    '.ed__col--visual [data-layer="secondary-image"]'
  );
  const documentImage = section.querySelector(".ed__doc");
  const date = section.querySelector(".ed__date-group");
  const title = section.querySelector(".ed__title");

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      scroller,
      start: "top bottom",
      end: "top top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  addScrubbedTransform(timeline, primaryImage, {
    from: { ...scene.image.from, opacity: 0.82 },
    to: { ...scene.image.to, opacity: 1 },
  });
  addScrubbedTransform(timeline, secondaryImage, scene.secondary, 0.82);
  addScrubbedTransform(timeline, documentImage, scene.document, 0.82);
  addScrubbedTransform(timeline, date, scene.date, 0.88);
  addScrubbedTransform(timeline, title, scene.title, 0.82);

  if (previousScene) {
    const previousSection = root.querySelector(`#${previousScene}`);
    const previousImage = previousSection?.querySelector(
      '.ed__col--visual [data-layer="primary-image"]'
    );

    if (previousImage) {
      timeline.to(
        previousImage,
        { yPercent: -5, scale: 1.02, opacity: 0.76, duration: 1, ease: "none" },
        0
      );
    } else if (previousScene === "hero") {
      const hero = root.querySelector("#hero");
      const heroTitle = hero?.querySelector(".reccaa-hero__title");
      const heroSub = hero?.querySelector(".reccaa-hero__sub");
      const heroBackground = hero?.querySelector(".reccaa-hero__bg");

      if (heroTitle) {
        timeline.to(heroTitle, { yPercent: -10, opacity: 0.55, duration: 1, ease: "none" }, 0);
      }
      if (heroSub) {
        timeline.to(heroSub, { yPercent: -5, opacity: 0.7, duration: 1, ease: "none" }, 0);
      }
      if (heroBackground) {
        timeline.to(heroBackground, { yPercent: -3, opacity: 0.68, duration: 1, ease: "none" }, 0);
      }
    }
  }

  return timeline;
}

export function useReccaaScroll(containerRef) {
  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root || prefersReducedMotion()) return;

      const scroller = document.querySelector(".main-scroll") ?? window;
      const timelines = SCENES.map((scene, index) =>
        createSceneTimeline(
          root,
          scene,
          index === 0 ? "hero" : SCENES[index - 1].id,
          scroller
        )
      ).filter(Boolean);

      return () => {
        timelines.forEach((timeline) => timeline.kill());
      };
    },
    { scope: containerRef, revertOnUpdate: true, dependencies: [] }
  );
}

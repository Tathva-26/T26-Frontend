import { useCallback, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { TIMING } from "@/pageComponents/GPC/gpcConfig";

const REST = { x: 0, y: 0, scale: 1 };
const REDUCED_FADE = 0.15;
const GUARD_SLACK = 0.3;

/**
 * Grows the game console out of the clickable hero console (origin) and
 * shrinks it back - one continuous transform on `groupRef`, uniform scale
 * only, since there's only one console image throughout.
 *
 * `revealRef` (game + HUD + exit button) fades in at the start of the
 * opening tween, in parallel with the scale-up, and fades out first on
 * close, before the group starts shrinking. `backdropRef` (the dim layer
 * behind the console) fades along with the zoom.
 *
 * Closing while the opening tween is still running carries on from wherever
 * the console currently is. With prefers-reduced-motion the zoom is replaced
 * by a short fade.
 *
 * GSAP slows its own clock down when frames get very slow, which on a
 * struggling device would leave the console crawling open for many seconds.
 * A real-time timer therefore finishes the transition if it overruns.
 */
export function useZoomTransition({ originRef, groupRef, revealRef, backdropRef }) {
  const timelineRef = useRef(null);
  const guardRef = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(guardRef.current);
      timelineRef.current?.kill();
    },
    []
  );

  const track = useCallback((timeline) => {
    timelineRef.current = timeline;
    window.clearTimeout(guardRef.current);
    guardRef.current = window.setTimeout(
      () => {
        if (timeline.isActive()) timeline.progress(1);
      },
      (timeline.duration() + GUARD_SLACK) * 1000
    );
  }, []);

  const measureCollapsed = useCallback(() => {
    const from = originRef.current.getBoundingClientRect();
    const to = groupRef.current.getBoundingClientRect();
    return {
      x: from.left + from.width / 2 - (to.left + to.width / 2),
      y: from.top + from.height / 2 - (to.top + to.height / 2),
      scale: from.width / to.width,
    };
  }, [originRef, groupRef]);

  const play = useCallback(
    (direction, onComplete) => {
      const group = groupRef.current;
      const reveal = revealRef.current;
      const backdrop = backdropRef.current;
      if (!group || !reveal || !backdrop || !originRef.current) return;

      timelineRef.current?.kill();

      // Where the console is right now, then measure it at rest. Nothing is
      // painted in between: the tweens below put it straight back.
      const current = {
        x: gsap.getProperty(group, "x"),
        y: gsap.getProperty(group, "y"),
        scale: gsap.getProperty(group, "scale"),
      };
      gsap.set(group, { clearProps: "transform" });
      const collapsed = measureCollapsed();

      const opening = direction === "in";
      const tl = gsap.timeline({ onComplete });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const fade = { duration: REDUCED_FADE, ease: "none" };
        tl.set(reveal, { opacity: opening ? 1 : 0 }, 0)
          .fromTo(group, { opacity: opening ? 0 : 1 }, { opacity: opening ? 1 : 0, ...fade }, 0)
          .to(backdrop, { opacity: opening ? 1 : 0, ...fade }, 0);
        track(tl);
        return;
      }

      const duration = opening ? TIMING.open : TIMING.close;
      const { reveal: revealDuration, ease } = TIMING;

      if (opening) {
        tl.fromTo(group, collapsed, { ...REST, duration, ease }, 0)
          .fromTo(reveal, { opacity: 0 }, { opacity: 1, duration: revealDuration, ease: "none" }, 0)
          .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: duration * 0.6, ease: "power1.out" }, 0);
      } else {
        tl.to(reveal, { opacity: 0, duration: revealDuration, ease: "none" }, 0)
          .fromTo(group, current, { ...collapsed, duration, ease }, revealDuration)
          .to(backdrop, { opacity: 0, duration: duration * 0.6, ease: "power1.in" }, revealDuration + duration * 0.4);
      }

      track(tl);
    },
    [originRef, groupRef, revealRef, backdropRef, measureCollapsed, track]
  );

  return useMemo(() => ({ play }), [play]);
}

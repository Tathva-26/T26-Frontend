import { useCallback, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { TIMING } from "@/pageComponents/GPC/gpcConfig";

/**
 * Grows the game console out of the clickable hero console (origin) and
 * shrinks it back - one continuous transform on `groupRef`, uniform scale
 * only. There's only one console image throughout (no separate bezel to
 * swap to), so `groupRef` itself is what gets measured and moved.
 *
 * `revealRef` (the real game + HUD + exit button) fades in right at the
 * start of the opening tween, in parallel with the scale-up - not gated on
 * the scale-up finishing - and fades out first on close, before the group
 * starts shrinking.
 */
export function useZoomTransition({ originRef, groupRef, revealRef }) {
  const timelineRef = useRef(null);

  useEffect(() => () => timelineRef.current?.kill(), []);

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
      if (!group || !reveal) return;

      timelineRef.current?.kill();
      gsap.set(group, { clearProps: "transform" }); // measure at rest

      const rest = { x: 0, y: 0, scale: 1 };
      const collapsed = measureCollapsed();
      const opening = direction === "in";
      const duration = opening ? TIMING.open : TIMING.close;
      const { reveal: revealDuration } = TIMING;

      const tl = gsap.timeline({ onComplete });

      if (opening) {
        tl.fromTo(group, collapsed, { ...rest, duration, ease: TIMING.ease }, 0)
          .set(reveal, { opacity: 0 }, 0)
          .to(reveal, { opacity: 1, duration: revealDuration, ease: "none" }, 0);
      } else {
        tl.to(reveal, { opacity: 0, duration: revealDuration, ease: "none" }, 0).to(
          group,
          { ...collapsed, duration, ease: TIMING.ease },
          revealDuration
        );
      }

      timelineRef.current = tl;
    },
    [groupRef, revealRef, measureCollapsed]
  );

  return useMemo(() => ({ play }), [play]);
}
import { useCallback, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { TIMING } from "@/pageComponents/GPC/gpcConfig";

/**
 * Animates the game panel between the clickable console (origin) and its
 * resting position. Only transforms and opacity are animated.
 * `stageScale` compensates for the scaled parent Stage.
 */
export function useZoomTransition({ originRef, panelRef, backdropRef, stageScale }) {
  const timelineRef = useRef(null);

  useEffect(() => () => timelineRef.current?.kill(), []);

  // Offset + scale that makes the panel coincide with the origin element.
  const measureCollapsed = useCallback(() => {
    const from = originRef.current.getBoundingClientRect();
    const to = panelRef.current.getBoundingClientRect();
    return {
      x: (from.left + from.width / 2 - (to.left + to.width / 2)) / stageScale,
      y: (from.top + from.height / 2 - (to.top + to.height / 2)) / stageScale,
      scale: from.width / to.width,
      opacity: 0,
    };
  }, [originRef, panelRef, stageScale]);

  const play = useCallback(
    (direction, onComplete) => {
      const panel = panelRef.current;
      const backdrop = backdropRef.current;
      if (!panel || !backdrop) return;

      timelineRef.current?.kill();
      gsap.set(panel, { clearProps: "transform,opacity" }); // measure at rest

      const rest = { x: 0, y: 0, scale: 1, opacity: 1 };
      const collapsed = measureCollapsed();
      const opening = direction === "in";
      const duration = opening ? TIMING.open : TIMING.close;

      timelineRef.current = gsap
        .timeline({ onComplete })
        .fromTo(
          panel,
          opening ? collapsed : rest,
          { ...(opening ? rest : collapsed), duration, ease: TIMING.ease },
          0
        )
        .fromTo(
          backdrop,
          { opacity: opening ? 0 : 1 },
          { opacity: opening ? 1 : 0, duration: duration * 0.8 },
          0
        );
    },
    [panelRef, backdropRef, measureCollapsed]
  );

  return useMemo(() => ({ play }), [play]);
}

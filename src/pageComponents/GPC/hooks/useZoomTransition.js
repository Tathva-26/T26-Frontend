import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { gsap } from "gsap";
import { TIMING } from "@/pageComponents/GPC/gpcConfig";

export function useZoomTransition({
  originRef,
  panelRef,
  stageScale,
}) {
  const timelineRef = useRef(null);

  const measureCollapsed = useCallback(() => {
    const origin = originRef.current;
    const panel = panelRef.current;

    if (
      !origin ||
      !panel ||
      !stageScale
    ) {
      return null;
    }

    const from =
      origin.getBoundingClientRect();

    const to =
      panel.getBoundingClientRect();

    return {
      x:
        (from.left +
          from.width / 2 -
          (to.left +
            to.width / 2)) /
        stageScale,

      y:
        (from.top +
          from.height / 2 -
          (to.top +
            to.height / 2)) /
        stageScale,

      scale:
        from.width / to.width,
    };
  }, [
    originRef,
    panelRef,
    stageScale,
  ]);

  const prepare = useCallback(() => {
    const panel = panelRef.current;
    const collapsed =
      measureCollapsed();

    if (!panel || !collapsed) {
      return;
    }

    gsap.set(panel, {
      x: collapsed.x,
      y: collapsed.y,
      scale: collapsed.scale,
      opacity: 0,
      transformOrigin: "center center",
    });
  }, [
    measureCollapsed,
    panelRef,
  ]);

  useLayoutEffect(() => {
    if (!stageScale) {
      return;
    }

    prepare();
  }, [
    prepare,
    stageScale,
  ]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  const play = useCallback(
    (direction, onComplete) => {
      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      timelineRef.current?.kill();

      const collapsed =
        measureCollapsed();

      if (!collapsed) {
        onComplete?.();
        return;
      }

      const opening =
        direction === "in";

      const duration = opening
        ? TIMING.open
        : TIMING.close;

      const fade =
        duration *
        TIMING.fadeShare;

      const rest = {
        x: 0,
        y: 0,
        scale: 1,
      };

      gsap.set(panel, {
        ...(opening
          ? collapsed
          : rest),
        opacity: opening ? 0 : 1,
        transformOrigin:
          "center center",
      });

      const timeline =
        gsap.timeline({
          onComplete,
        });

      timeline.to(
        panel,
        {
          ...(opening
            ? rest
            : collapsed),
          duration,
          ease: TIMING.ease,
        },
        0
      );

      timeline.to(
        panel,
        {
          opacity: opening ? 1 : 0,
          duration: fade,
          ease: "none",
        },
        opening
          ? 0
          : duration - fade
      );

      timelineRef.current =
        timeline;
    },
    [
      measureCollapsed,
      panelRef,
    ]
  );

  return useMemo(
    () => ({
      play,
    }),
    [play]
  );
}
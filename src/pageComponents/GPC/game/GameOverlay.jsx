"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Stage from "@/pageComponents/GPC/Stage";
import ConsoleFrame from "./ConsoleFrame";
import { useFitScale } from "@/hooks/useFitScale";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  useZoomTransition,
} from "@/pageComponents/GPC/hooks/useZoomTransition";
import {
  RULES,
} from "@/lib/spaceShooter/constants";
import {
  STAGE,
} from "@/pageComponents/GPC/gpcConfig";

const INITIAL_STATS = {
  phase: "ready",
  score: 0,
  highScore: 0,
  lives: RULES.lives,
};

export default function GameOverlay({
  open,
  originRef,
  onClosed,
}) {
  const [playing, setPlaying] =
    useState(false);

  const [closing, setClosing] =
    useState(false);

  const [stats, setStats] =
    useState(INITIAL_STATS);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const hasOpenedRef =
    useRef(false);

  const scale =
    useFitScale(STAGE);

  const zoom =
    useZoomTransition({
      originRef,
      panelRef,
      stageScale: scale,
    });

  useScrollLock(open);

  useEffect(() => {
    if (
      !open ||
      !scale ||
      hasOpenedRef.current
    ) {
      return;
    }

    hasOpenedRef.current = true;

    zoom.play("in", () => {
      setPlaying(true);
      rootRef.current?.focus();
    });
  }, [
    open,
    scale,
    zoom,
  ]);

  const handleExit =
    useCallback(() => {
      if (!playing || closing) {
        return;
      }

      setClosing(true);

      zoom.play("out", () => {
        setPlaying(false);
        setClosing(false);
        setStats(INITIAL_STATS);
        hasOpenedRef.current = false;

        onClosed();
        originRef.current?.focus();
      });
    }, [
      closing,
      onClosed,
      originRef,
      playing,
      zoom,
    ]);

  useEffect(() => {
    if (!playing || closing) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        handleExit();
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [
    closing,
    handleExit,
    playing,
  ]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Arcade game"
      tabIndex={-1}
      className="fixed inset-0 z-40 isolate flex items-center justify-center outline-none"
    >
      <div className="relative z-10">
        <Stage
          {...STAGE}
          scale={scale}
        >
          <ConsoleFrame
            panelRef={panelRef}
            active={playing}
            interactive={!closing}
            stats={stats}
            onStats={setStats}
            onExit={handleExit}
          />
        </Stage>
      </div>
    </div>,
    document.body
  );
}
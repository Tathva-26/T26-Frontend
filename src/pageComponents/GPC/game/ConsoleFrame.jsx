"use client";

import SpaceShooterCanvas from "./SpaceShooterCanvas";
import Hearts from "./Hearts";
import { RULES } from "@/lib/spaceShooter/constants";
import {
  ASSETS,
  CONSOLE_FRAME,
  EXIT_BUTTON,
  SCREEN_INSET,
} from "@/pageComponents/GPC/gpcConfig";

const padScore = (value) =>
  String(value).padStart(5, "0");

function Message({ phase }) {
  const isOver = phase === "over";

  return (
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
      {isOver && (
        <p className="text-[22px] leading-relaxed tracking-widest">
          GAME OVER
        </p>
      )}

      <p className="text-[11px] leading-relaxed tracking-wider text-white/80">
        {isOver
          ? "PRESS SPACE TO RETRY"
          : "PRESS SPACE TO START"}
      </p>

      {!isOver && (
        <p className="mt-4 text-[9px] leading-loose tracking-wider text-white/60">
          ARROW KEYS TO MOVE
          <br />
          SPACE TO SHOOT
        </p>
      )}
    </div>
  );
}

function Hud({ stats }) {
  return (
    <div className="pointer-events-none absolute inset-0 font-pixel text-white">
      <div className="absolute left-4 top-3">
        <Hearts
          lives={stats.lives}
          max={RULES.lives}
        />
      </div>

      <p className="absolute right-4 top-3 text-[11px] leading-relaxed tracking-widest">
        <span className="text-white/50">
          HI {padScore(stats.highScore)}
        </span>{" "}
        {padScore(stats.score)}
      </p>

      {stats.phase !== "playing" && (
        <Message phase={stats.phase} />
      )}
    </div>
  );
}

export default function ConsoleFrame({
  panelRef,
  active,
  interactive,
  stats,
  onStats,
  onExit,
}) {
  return (
    <div
      ref={panelRef}
      className="absolute will-change-transform"
      style={{
        left: CONSOLE_FRAME.x,
        top: CONSOLE_FRAME.y,
        width: CONSOLE_FRAME.width,
        height: CONSOLE_FRAME.height,
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={ASSETS.bezel}
          alt=""
          className="absolute left-0 top-[-0.02%] h-[133.64%] w-[103.18%] max-w-none"
        />
      </div>

      <div
        className="absolute overflow-hidden rounded-[18px]"
        style={{
          left: `${SCREEN_INSET.left}%`,
          top: `${SCREEN_INSET.top}%`,
          width: `${SCREEN_INSET.width}%`,
          height: `${SCREEN_INSET.height}%`,
        }}
      >
        <SpaceShooterCanvas
          active={active}
          interactive={interactive}
          onStats={onStats}
        />

        <Hud stats={stats} />
      </div>

      <button
        type="button"
        onClick={onExit}
        disabled={!active || !interactive}
        aria-label="Exit game"
        className="absolute transition-transform duration-150 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-0"
        style={{
          left:
            EXIT_BUTTON.x -
            CONSOLE_FRAME.x,
          top:
            EXIT_BUTTON.y -
            CONSOLE_FRAME.y,
          width: EXIT_BUTTON.size,
          height: EXIT_BUTTON.size,
        }}
      >
        <img
          src={ASSETS.exit}
          alt=""
          className="h-full w-full object-cover"
        />
      </button>
    </div>
  );
}
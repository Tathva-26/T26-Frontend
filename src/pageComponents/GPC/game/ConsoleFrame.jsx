"use client";

import SpaceShooterCanvas from "./SpaceShooterCanvas";
import { ASSETS, CONSOLE_FRAME, EXIT_BUTTON, SCREEN_INSET } from "@/pageComponents/GPC/gpcConfig";

const MESSAGES = {
  ready: "PRESS SPACE TO START",
  over: "GAME OVER - PRESS SPACE",
};

function Hud({ stats }) {
  const message = MESSAGES[stats.phase];
  return (
    <div className="pointer-events-none absolute inset-0 font-orbitron text-[16px] text-white">
      <span className="absolute left-4 top-3">LIVES {stats.lives}</span>
      <span className="absolute right-4 top-3">SCORE {stats.score}</span>
      {message && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[24px]">
          {message}
        </p>
      )}
    </div>
  );
}

export default function ConsoleFrame({ panelRef, active, stats, onStats, onExit }) {
  return (
    <div
      ref={panelRef}
      className="absolute"
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
        <SpaceShooterCanvas active={active} onStats={onStats} />
        <Hud stats={stats} />
      </div>

      <button
        type="button"
        onClick={onExit}
        aria-label="Exit game"
        className="absolute transition-transform hover:scale-110 active:scale-95"
        style={{
          left: EXIT_BUTTON.x - CONSOLE_FRAME.x,
          top: EXIT_BUTTON.y - CONSOLE_FRAME.y,
          width: EXIT_BUTTON.size,
          height: EXIT_BUTTON.size,
        }}
      >
        <img src={ASSETS.exit} alt="" className="h-full w-full object-cover" />
      </button>
    </div>
  );
}

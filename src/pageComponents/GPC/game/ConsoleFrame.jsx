"use client";

import { useRef } from "react";
import Image from "next/image";
import SpaceShooterCanvas from "./SpaceShooterCanvas";
import Joystick from "./Joystick";
import Hearts from "./Hearts";
import { RULES } from "@/lib/spaceShooter/constants";
import { ASSETS, CONSOLE_SCREEN_INSET, EXIT_BUTTON } from "@/pageComponents/GPC/gpcConfig";

/**
 * Mobile control placement, as % of the whole console image.
 * Tweak these until they sit nicely on the console body.
 *   left / right / bottom: offset from that edge
 *   size: width of the control (square)
 */
const CONTROLS = {
  joystick: { left: 9, bottom: 5, size: 20 },
  fire: { right: 11, bottom: 7, size: 13 },
};

function Message({ phase, isMobile }) {
  const isOver = phase === "over";
  return (
    <div
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center"
      style={{ fontFamily: "var(--font-pixel)" }}
    >
      {isOver && <p className="text-[22px] leading-relaxed tracking-widest">GAME OVER</p>}
      <p className="text-[11px] leading-relaxed tracking-wider text-white/80">
        {isMobile
          ? isOver
            ? "TAP TO RETRY"
            : "TAP TO PLAY"
          : isOver
            ? "PRESS SPACE TO RETRY"
            : "PRESS SPACE TO START"}
      </p>
      {!isOver && (
        <p className="mt-4 text-[9px] leading-loose tracking-wider text-white/60">
          {isMobile ? (
            <>
              STICK TO MOVE
              <br />
              HOLD FIRE TO SHOOT
            </>
          ) : (
            <>
              ARROW KEYS TO MOVE
              <br />
              SPACE TO SHOOT
            </>
          )}
        </p>
      )}
    </div>
  );
}

function Hud({ stats, isMobile }) {
  return (
    <div className="pointer-events-none absolute inset-0 text-white" style={{ fontFamily: "var(--font-pixel)" }}>
      <div className="absolute left-4 top-3">
        <Hearts lives={stats.lives} max={RULES.lives} />
      </div>
      <p className="absolute right-4 top-3 text-[11px] leading-relaxed tracking-widest">
        <span className="text-white/50">HI {String(stats.highScore).padStart(5, "0")}</span>{" "}
        {String(stats.score).padStart(5, "0")}
      </p>
      {stats.phase !== "playing" && <Message phase={stats.phase} isMobile={isMobile} />}
    </div>
  );
}

/**
 * The real, playable game: screen content, HUD, exit button, and (on mobile)
 * retro arcade controls mounted on the console body below the screen.
 */
export default function ConsoleFrame({ active, stats, onStats, onExit, isMobile }) {
  const gameRef = useRef(null);

  const handleScreenTap = () => {
    if (!isMobile || stats.phase === "playing") return;
    gameRef.current?.start();
  };

  const fire = (isDown) => gameRef.current?.setFiring(isDown);

  return (
    <>
      <div
        className="absolute overflow-hidden rounded-[18px]"
        style={{
          left: `${CONSOLE_SCREEN_INSET.left}%`,
          top: `${CONSOLE_SCREEN_INSET.top}%`,
          width: `${CONSOLE_SCREEN_INSET.width}%`,
          height: `${CONSOLE_SCREEN_INSET.height}%`,
        }}
        onClick={handleScreenTap}
      >
        <SpaceShooterCanvas ref={gameRef} active={active} onStats={onStats} />
        <Hud stats={stats} isMobile={isMobile} />
      </div>

      {isMobile && (
        <>
          <div
            className="absolute"
            style={{
              left: `${CONTROLS.joystick.left}%`,
              bottom: `${CONTROLS.joystick.bottom}%`,
              width: `${CONTROLS.joystick.size}%`,
              aspectRatio: "1",
            }}
          >
            <Joystick onChange={(x, y) => gameRef.current?.setJoystick(x, y)} />
          </div>

          <button
            type="button"
            aria-label="Fire"
            className="pointer-events-auto absolute touch-none select-none rounded-full text-white active:translate-y-[4px]"
            style={{
              right: `${CONTROLS.fire.right}%`,
              bottom: `${CONTROLS.fire.bottom}%`,
              width: `${CONTROLS.fire.size}%`,
              aspectRatio: "1",
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(7px, 1.6vw, 12px)",
              letterSpacing: "0.05em",
              background: "radial-gradient(circle at 35% 30%, #ff8a8a 0%, #e02020 45%, #9a0000 100%)",
              border: "3px solid #3a0000",
              boxShadow: "0 0 0 3px #4a4a66, 0 6px 0 3px #4a0000",
              textShadow: "1px 1px 0 #3a0000",
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              fire(true);
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
              fire(false);
            }}
            onPointerCancel={() => fire(false)}
            onContextMenu={(event) => event.preventDefault()}
          >
            FIRE
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onExit}
        aria-label="Exit game"
        className="absolute transition-transform hover:scale-110 active:scale-95"
        style={{
          right: `${EXIT_BUTTON.right}%`,
          top: `${EXIT_BUTTON.top}%`,
          width: `${EXIT_BUTTON.size}%`,
          aspectRatio: "1",
        }}
      >
        <Image src={ASSETS.exit} alt="" fill priority sizes="48px" className="object-cover" />
      </button>
    </>
  );
}
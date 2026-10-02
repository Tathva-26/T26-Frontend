"use client";

import { useRef } from "react";
import Image from "next/image";
import SpaceShooterCanvas from "./SpaceShooterCanvas";
import Joystick from "./Joystick";
import Hearts from "./Hearts";
import { RULES } from "@/lib/spaceShooter/constants";
import { ASSETS, CONSOLE_SCREEN_INSET, EXIT_BUTTON } from "@/pageComponents/GPC/gpcConfig";

/**
 * Touch control placement on the console body.
 *   left / right / bottom: offset from that edge, as % of the console
 *   size: width of the control (square), as % of the console's width
 *   min: smallest it may get (px), so it stays easy to hit on a small phone
 */
const CONTROLS = {
  joystick: { left: 9, bottom: 5, size: 20, min: 64 },
  fire: { right: 11, bottom: 7, size: 13, min: 48 },
};

// Sizes below use container units: `cqw` is 1% of the nearest container's
// width - the screen for the HUD, the whole console for the controls - so
// everything scales with the console and is clamped to stay readable.
const HUD_TEXT = "text-[clamp(9px,1.5cqw,18px)]";

function Message({ stats, touchControls }) {
  const isOver = stats.phase === "over";
  return (
    <div
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-[3cqw] text-center"
      style={{ fontFamily: "var(--font-pixel)" }}
    >
      {isOver && <p className="text-[clamp(13px,2.9cqw,34px)] leading-relaxed tracking-widest">GAME OVER</p>}
      {isOver && (
        <p className={`${HUD_TEXT} mb-[1.5cqw] leading-relaxed tracking-wider text-[#ffe066]`}>
          {stats.newBest ? "NEW HIGH SCORE" : `REACHED WAVE ${stats.wave}`}
        </p>
      )}
      <p className={`${HUD_TEXT} leading-relaxed tracking-wider text-white/80`}>
        {touchControls
          ? isOver
            ? "TAP TO RETRY"
            : "TAP TO PLAY"
          : isOver
            ? "PRESS SPACE TO RETRY"
            : "PRESS SPACE TO START"}
      </p>
      {!isOver && (
        <p className="mt-[2cqw] text-[clamp(8px,1.2cqw,15px)] leading-loose tracking-wider text-white/60">
          {touchControls ? (
            <>
              STICK TO MOVE
              <br />
              HOLD FIRE TO SHOOT
              <br />
              GRAB THE POWER-UPS
            </>
          ) : (
            <>
              ARROWS OR WASD TO MOVE
              <br />
              HOLD SPACE TO SHOOT
              <br />
              GRAB THE POWER-UPS
            </>
          )}
        </p>
      )}
    </div>
  );
}

function Hud({ stats, touchControls }) {
  return (
    <div className="pointer-events-none absolute inset-0 text-white" style={{ fontFamily: "var(--font-pixel)" }}>
      <div className="absolute left-[max(8px,2cqw)] top-[max(6px,1.5cqw)]">
        <Hearts lives={stats.lives} max={RULES.lives} />
      </div>
      <p className={`absolute right-[max(8px,2cqw)] top-[max(6px,1.5cqw)] ${HUD_TEXT} leading-relaxed tracking-widest`}>
        <span className="text-white/50">HI {String(stats.highScore).padStart(5, "0")}</span>{" "}
        {String(stats.score).padStart(5, "0")}
      </p>
      {stats.phase !== "playing" && <Message stats={stats} touchControls={touchControls} />}
    </div>
  );
}

/**
 * The real, playable game: screen content, HUD, exit button, and (for touch
 * players) retro arcade controls mounted on the console body below the screen.
 */
export default function ConsoleFrame({ active, stats, onStats, onExit, touchControls }) {
  const gameRef = useRef(null);
  const waiting = stats.phase !== "playing";

  // Tapping or clicking the screen starts a round, whatever the device.
  const handleScreenPress = () => {
    if (waiting) gameRef.current?.start();
  };

  const fire = (isDown) => gameRef.current?.setFiring(isDown);

  return (
    <>
      <div
        className={`@container absolute overflow-hidden ${waiting ? "cursor-pointer" : ""}`}
        style={{
          left: `${CONSOLE_SCREEN_INSET.left}%`,
          top: `${CONSOLE_SCREEN_INSET.top}%`,
          width: `${CONSOLE_SCREEN_INSET.width}%`,
          height: `${CONSOLE_SCREEN_INSET.height}%`,
          borderRadius: CONSOLE_SCREEN_INSET.radius,
        }}
        onClick={handleScreenPress}
      >
        <SpaceShooterCanvas ref={gameRef} active={active} onStats={onStats} />
        <Hud stats={stats} touchControls={touchControls} />
      </div>

      {touchControls && (
        <>
          <div
            className="absolute"
            style={{
              left: `${CONTROLS.joystick.left}%`,
              bottom: `${CONTROLS.joystick.bottom}%`,
              width: `max(${CONTROLS.joystick.size}cqw, ${CONTROLS.joystick.min}px)`,
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
              width: `max(${CONTROLS.fire.size}cqw, ${CONTROLS.fire.min}px)`,
              aspectRatio: "1",
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(8px, 2.4cqw, 22px)",
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
            onLostPointerCapture={() => fire(false)}
            onContextMenu={(event) => event.preventDefault()}
          >
            FIRE
          </button>
        </>
      )}

      {/* The button is the hit area; the icon inside it can be smaller. */}
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit game"
        className="group/exit absolute flex items-start justify-end"
        style={{
          right: `${EXIT_BUTTON.right}%`,
          top: `${EXIT_BUTTON.top}%`,
          width: `max(${EXIT_BUTTON.size}cqw, ${EXIT_BUTTON.minHit}px)`,
          aspectRatio: "1",
        }}
      >
        <span
          className="relative block aspect-square transition-transform group-hover/exit:scale-110 group-active/exit:scale-95"
          style={{ width: `max(${EXIT_BUTTON.size}cqw, ${EXIT_BUTTON.minIcon}px)` }}
        >
          <Image src={ASSETS.exit} alt="" fill loading="eager" sizes="96px" className="object-cover" />
        </span>
      </button>
    </>
  );
}

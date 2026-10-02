import ConsoleScreenCanvas from "./ConsoleScreenCanvas";
import { ASSETS, CLICK_TO_PLAY, CONSOLE_BUTTON } from "@/pageComponents/GPC/gpcConfig";

const glowStyle = {
  left: `${CONSOLE_BUTTON.left}%`,
  top: `${CONSOLE_BUTTON.top}%`,
  width: `${CONSOLE_BUTTON.size}%`,
  aspectRatio: "1",
};

/**
 * The clickable hero console, shared by both layouts: the console image as a
 * button, its animated preview screen, the red-button glow and the play label.
 * The caller positions and sizes it through `className` / `style`.
 *
 * `consoleRef` lives on the wrapper so GameOverlay's zoom has a stable box to
 * grow out of and shrink back into. `hidden` hides it while that zoomed copy
 * is on screen. The wrapper is a size container, so the label scales with it.
 * `sequence` passes the scroll sequence's live values on to the screen.
 */
export default function HeroConsole({
  consoleRef,
  onPlay,
  hidden,
  paused,
  touch,
  sequence,
  scale = 1,
  className = "",
  style,
}) {
  return (
    <div
      ref={consoleRef}
      data-gpc="console"
      className={`group @container ${className}`}
      style={{ ...style, visibility: hidden ? "hidden" : undefined }}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label="Play the arcade game"
        className="absolute inset-0 cursor-pointer outline-none"
      >
        <img src={ASSETS.console} alt="" draggable={false} className="h-full w-full object-contain" />
      </button>

      <ConsoleScreenCanvas paused={paused} scale={scale} sequence={sequence} />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full bg-[#ff2020] opacity-0 blur-[6px] transition-all duration-150 group-hover:scale-150 group-hover:opacity-70 group-focus-within:scale-150 group-focus-within:opacity-70"
        style={glowStyle}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full bg-[#ff2626] opacity-0 mix-blend-screen transition-opacity duration-150 group-hover:opacity-90 group-focus-within:opacity-90"
        style={glowStyle}
      />

      {/* Outer span: shown and hidden by the scroll sequence. Inner: the blink. */}
      <span
        data-gpc="label"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 text-center"
        style={{ top: `${CLICK_TO_PLAY.top}%` }}
      >
        <span
          className="inline-block whitespace-nowrap leading-relaxed tracking-[0.1em] text-white [text-shadow:0_0_4px_rgba(0,0,0,0.9)] motion-safe:animate-pulse"
          style={{ fontSize: `${CLICK_TO_PLAY.fontSize}cqw`, fontFamily: "var(--font-pixel)" }}
        >
          [{touch ? "TAP" : "CLICK"} TO PLAY]
        </span>
      </span>
    </div>
  );
}

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
 */
export default function HeroConsole({ consoleRef, onPlay, hidden, paused, touch, scale = 1, className = "", style }) {
  return (
    <div
      ref={consoleRef}
      className={`group @container ${className}`}
      style={{ ...style, visibility: hidden ? "hidden" : undefined }}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label="Play the arcade game"
        className="absolute inset-0 cursor-pointer rounded-[5%] outline-none focus-visible:ring-2 focus-visible:ring-[#c9a7ff]"
      >
        <img src={ASSETS.console} alt="" draggable={false} className="h-full w-full object-contain" />
      </button>

      <ConsoleScreenCanvas paused={paused} scale={scale} />

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

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 whitespace-nowrap text-center leading-relaxed tracking-[0.1em] text-white [text-shadow:0_0_4px_rgba(0,0,0,0.9)] motion-safe:animate-pulse"
        style={{
          top: `${CLICK_TO_PLAY.top}%`,
          fontSize: `${CLICK_TO_PLAY.fontSize}cqw`,
          fontFamily: "var(--font-pixel)",
        }}
      >
        [{touch ? "TAP" : "CLICK"} TO PLAY]
      </span>
    </div>
  );
}

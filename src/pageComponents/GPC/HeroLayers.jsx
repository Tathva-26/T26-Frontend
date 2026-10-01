import ConsoleScreenCanvas from "./ConsoleScreenCanvas";
import AuroraOverlay from "@/pageComponents/GPC/mobile/AuroraOverlay";
import DragonLoop from "./DragonLoop";
import { ASSETS, CLICK_TO_PLAY, CLIP, CONSOLE_BUTTON, DRAGON_STATIC } from "@/pageComponents/GPC/gpcConfig";

/**
 * Static one-screen desktop hero (the old "frame 2" state). The dragon sits
 * above the console; the intro layers (top GPC heading, first explore-more
 * CTA, corner brackets) and the second explore-more button are removed.
 *
 * consoleRef lives on the console wrapper so GameOverlay's zoom-origin
 * measurement still has a stable bounding box.
 */
export default function HeroLayers({ consoleRef, onPlay }) {
  return (
    <>
      <div
        className="absolute left-0 top-[91px] h-[530px] w-full overflow-hidden"
        style={{ clipPath: CLIP.end }}
      >
        <img src={ASSETS.banner} alt="" className="h-full w-full object-cover object-bottom" />
        <AuroraOverlay getProgress={() => 0} />
      </div>

      <DragonLoop
        className="absolute object-contain"
        style={{
          left: DRAGON_STATIC.x,
          top: DRAGON_STATIC.y,
          width: DRAGON_STATIC.width,
          height: DRAGON_STATIC.height,
        }}
      />

      <p
        className="absolute left-[707px] top-[464px] text-[107px] leading-[1.2] text-white"
        style={{ fontFamily: "var(--font-akira)" }}
      >
        GPC
      </p>

      <div ref={consoleRef} className="group absolute left-[364px] top-[304px] h-[281px] w-[322px]">
        <button
          type="button"
          onClick={onPlay}
          aria-label="Play the arcade game"
          className="absolute inset-0 cursor-pointer outline-none"
        >
          <img src={ASSETS.console} alt="" className="h-full w-full object-contain" />
        </button>

        <ConsoleScreenCanvas />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-[#ff2020] opacity-0 blur-[6px] transition-all duration-150 group-hover:scale-150 group-hover:opacity-70 group-focus-within:scale-150 group-focus-within:opacity-70"
          style={{
            left: `${CONSOLE_BUTTON.left}%`,
            top: `${CONSOLE_BUTTON.top}%`,
            width: `${CONSOLE_BUTTON.size}%`,
            aspectRatio: "1",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-[#ff2626] opacity-0 mix-blend-screen transition-opacity duration-150 group-hover:opacity-90 group-focus-within:opacity-90"
          style={{
            left: `${CONSOLE_BUTTON.left}%`,
            top: `${CONSOLE_BUTTON.top}%`,
            width: `${CONSOLE_BUTTON.size}%`,
            aspectRatio: "1",
          }}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 text-center leading-relaxed tracking-[0.1em] text-white [text-shadow:0_0_4px_rgba(0,0,0,0.9)] motion-safe:animate-pulse"
          style={{ top: `${CLICK_TO_PLAY.top}%`, fontSize: CLICK_TO_PLAY.fontSize, fontFamily: "var(--font-pixel)" }}
        >
          [CLICK TO PLAY]
        </span>
      </div>

      <p
        className="absolute left-[320px] top-[623px] w-[796px] text-[50px] uppercase leading-[1.2] text-white"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        Show off your skills and conquer the arena
      </p>
    </>
  );
}
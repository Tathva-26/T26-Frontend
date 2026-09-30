import ConsoleScreenCanvas from "./ConsoleScreenCanvas";
import AuroraOverlay from "@/pageComponents/GPC/mobile/AuroraOverlay";
import {
  ASSETS,
  CLICK_TO_PLAY,
  CLIP,
  CONSOLE_BUTTON,
  DRAGON_FRAME_2,
} from "@/pageComponents/GPC/gpcConfig";

const CORNERS = [
  "left-0 top-0 border-l-[1.5px] border-t-[1.5px] rounded-tl-md",
  "right-0 top-0 border-r-[1.5px] border-t-[1.5px] rounded-tr-md",
  "left-0 bottom-0 border-l-[1.5px] border-b-[1.5px] rounded-bl-md",
  "right-0 bottom-0 border-r-[1.5px] border-b-[1.5px] rounded-br-md",
];

/**
 * Every layer is styled in its FINAL state (Figma frame 165:1712 / 724:1856).
 * `data-layer` attributes are the hooks for useHeroTimeline.
 *
 * Custom fonts (Orbitron, Press Start 2P, Akira, Bebas) are applied via
 * inline style={{ fontFamily: "var(--font-x)" }} rather than Tailwind
 * classes, since none of them are registered as Tailwind utilities.
 *
 * The console <img> uses object-contain to match GameOverlay's enlarged
 * console - both must show the same framing of the asset for the zoom
 * transition to land without a visible jump.
 *
 * AuroraOverlay adds animated aurora light on top of banner.png via
 * mix-blend-mode: screen, matching the mobile hero's same background.
 * getProgress is static here (desktop has no scroll-progress source for
 * the banner the way the mobile hero does) - wire it to useHeroTimeline's
 * scroll progress if scroll-linked movement is wanted later.
 */
export default function HeroLayers({ consoleRef, onPlay }) {
  return (
    <>
      <div
        data-layer="banner"
        className="absolute left-0 top-[91px] h-[530px] w-full overflow-hidden"
        style={{ clipPath: CLIP.end }}
      >
        <img src={ASSETS.banner} alt="" className="h-full w-full object-cover object-bottom" />
        <AuroraOverlay getProgress={() => 0} />
      </div>

      <div data-layer="brackets" className="pointer-events-none absolute left-0 top-[150px] h-[471px] w-full opacity-0">
        {CORNERS.map((position) => (
          <span key={position} className={`absolute h-24 w-24 border-[#4fb4e3] ${position}`} />
        ))}
      </div>

      <img
        data-layer="dragon"
        src={ASSETS.dragon}
        alt=""
        className="absolute origin-top-left"
        style={{
          left: DRAGON_FRAME_2.x,
          top: DRAGON_FRAME_2.y,
          width: DRAGON_FRAME_2.width,
          height: DRAGON_FRAME_2.height,
        }}
      />

      <p
        data-layer="title-a"
        className="absolute left-[32px] top-[-21px] opacity-0 text-[147px] leading-[1.2] text-white"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        GPC
      </p>
      <span
        data-layer="cta-a"
        className="absolute left-[201px] top-[500px] opacity-0 border border-white p-2 text-[37px] text-white"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        EXPLORE MORE →
      </span>

      <p
        data-layer="title-b"
        className="absolute left-[707px] top-[464px] text-[107px] leading-[1.2] text-white"
        style={{ fontFamily: "var(--font-akira)" }}
      >
        GPC
      </p>
      <button
        data-layer="cta-b"
        type="button"
        className="group absolute left-[1038px] top-[528px] w-[94px] cursor-pointer text-left text-[14px] leading-tight text-white transition-colors duration-200 hover:text-[#4fb4e3] focus-visible:text-[#4fb4e3]"
        style={{ fontFamily: "var(--font-akira)" }}
      >
        EXPLORE MORE{" "}
        <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
      </button>

      {/* A div, not a button: holds two clickable controls (play + mute),
          and a button can't nest a button. consoleRef / data-layer="console"
          live here so both useHeroTimeline and GameOverlay's zoom-origin
          measurement have a stable bounding box to work from. */}
      <div
        ref={consoleRef}
        data-layer="console"
        className="group absolute left-[364px] top-[304px] h-[281px] w-[322px]"
      >
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
        data-layer="tagline"
        className="absolute left-[320px] top-[623px] w-[796px] text-[50px] uppercase leading-[1.2] text-white"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        Show off your skills and conquer the arena
      </p>
    </>
  );
}
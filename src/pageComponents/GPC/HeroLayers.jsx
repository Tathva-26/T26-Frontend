import {
  ASSETS,
  CLICK_TO_PLAY,
  CLIP,
  CONSOLE_BUTTON,
} from "@/pageComponents/GPC/gpcConfig";

const CORNERS = [
  "left-0 top-0 border-l-[1.5px] border-t-[1.5px] rounded-tl-md",
  "right-0 top-0 border-r-[1.5px] border-t-[1.5px] rounded-tr-md",
  "left-0 bottom-0 border-l-[1.5px] border-b-[1.5px] rounded-bl-md",
  "right-0 bottom-0 border-r-[1.5px] border-b-[1.5px] rounded-br-md",
];

export default function HeroLayers({ consoleRef, onPlay }) {
  return (
    <>
      <div
        data-layer="banner"
        className="absolute left-0 top-[91px] h-[530px] w-full"
        style={{ clipPath: CLIP.end }}
      >
        <img
          src={ASSETS.banner}
          alt=""
          className="h-full w-full object-cover object-bottom"
        />
      </div>

      <div
        data-layer="brackets"
        className="pointer-events-none absolute left-0 top-[150px] h-[471px] w-full opacity-0"
      >
        {CORNERS.map((position) => (
          <span
            key={position}
            className={`absolute h-24 w-24 border-[#4fb4e3] ${position}`}
          />
        ))}
      </div>

      <img
        data-layer="dragon"
        src={ASSETS.dragon}
        alt=""
        className="absolute left-[877px] top-[24px] h-[322px] w-[510px] origin-top-left"
      />

      <p
        data-layer="title-a"
        className="absolute left-[32px] top-[-21px] font-orbitron text-[147px] leading-[1.2] text-white opacity-0"
      >
        GPC
      </p>

      <span
        data-layer="cta-a"
        className="absolute left-[201px] top-[500px] border border-white p-2 font-orbitron text-[37px] text-white opacity-0"
      >
        EXPLORE MORE →
      </span>

      <p
        data-layer="title-b"
        className="absolute left-[707px] top-[464px] font-akira text-[107px] leading-[1.2] text-white"
      >
        GPC
      </p>

      <button
        data-layer="cta-b"
        type="button"
        className="group absolute left-[1038px] top-[528px] w-[94px] cursor-pointer text-left font-akira text-[14px] leading-tight text-white transition-colors duration-200 hover:text-[#4fb4e3] focus-visible:text-[#4fb4e3]"
      >
        EXPLORE MORE{" "}
        <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </button>

      <button
        ref={consoleRef}
        data-layer="console"
        type="button"
        onClick={onPlay}
        aria-label="Play the arcade game"
        className="group absolute left-[364px] top-[304px] h-[281px] w-[322px] cursor-pointer outline-none"
      >
        <img
          src={ASSETS.console}
          alt=""
          className="h-full w-full object-cover"
        />

        {/* Blurred red illumination layer */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-[#ff2020] opacity-0 blur-[6px] transition-all duration-150 group-hover:scale-150 group-hover:opacity-70 group-focus-visible:scale-150 group-focus-visible:opacity-70"
          style={{
            left: `${CONSOLE_BUTTON.left}%`,
            top: `${CONSOLE_BUTTON.top}%`,
            width: `${CONSOLE_BUTTON.size}%`,
            aspectRatio: "1",
          }}
        />

        {/* Solid bright red center layer */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-[#ff2626] opacity-0 mix-blend-screen transition-opacity duration-150 group-hover:opacity-90 group-focus-visible:opacity-90"
          style={{
            left: `${CONSOLE_BUTTON.left}%`,
            top: `${CONSOLE_BUTTON.top}%`,
            width: `${CONSOLE_BUTTON.size}%`,
            aspectRatio: "1",
          }}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 text-center font-pixel leading-relaxed tracking-[0.1em] text-white [text-shadow:0_0_4px_rgba(0,0,0,0.9)] motion-safe:animate-pulse"
          style={{
            top: `${CLICK_TO_PLAY.top}%`,
            fontSize: CLICK_TO_PLAY.fontSize,
          }}
        >
          [CLICK TO PLAY]
        </span>
      </button>

      <p
        data-layer="tagline"
        className="absolute left-[320px] top-[623px] w-[796px] font-bebas text-[50px] uppercase leading-[1.2] text-white"
      >
        Show off your skills and conquer the arena
      </p>
    </>
  );
}
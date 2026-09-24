import { ASSETS, CLIP } from "@/pageComponents/GPC/gpcConfig";

const CORNERS = [
  "left-0 top-0 border-l-[1.5px] border-t-[1.5px] rounded-tl-md",
  "right-0 top-0 border-r-[1.5px] border-t-[1.5px] rounded-tr-md",
  "left-0 bottom-0 border-l-[1.5px] border-b-[1.5px] rounded-bl-md",
  "right-0 bottom-0 border-r-[1.5px] border-b-[1.5px] rounded-br-md",
];

/**
 * Every layer is styled in its FINAL state (Figma frame 165:1712).
 * `data-layer` attributes are the hooks for useHeroTimeline.
 */
export default function HeroLayers({ consoleRef, onPlay }) {
  return (
    <>
      <div
        data-layer="banner"
        className="absolute left-0 top-[91px] h-[530px] w-full"
        style={{ clipPath: CLIP.end }}
      >
        <img src={ASSETS.banner} alt="" className="h-full w-full object-cover object-bottom" />
      </div>

      {/* Frame 1 only: HUD corner brackets around the banner. */}
      <div data-layer="brackets" className="pointer-events-none absolute left-0 top-[150px] h-[471px] w-full opacity-0">
        {CORNERS.map((position) => (
          <span key={position} className={`absolute h-24 w-24 border-[#4fb4e3] ${position}`} />
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
        className="absolute left-[32px] top-[-21px] opacity-0 font-orbitron text-[147px] leading-[1.2] text-white"
      >
        GPC
      </p>
      <span
        data-layer="cta-a"
        className="absolute left-[201px] top-[500px] opacity-0 border border-white p-2 font-orbitron text-[37px] text-white"
      >
        EXPLORE MORE →
      </span>

      <p
        data-layer="title-b"
        className="absolute left-[707px] top-[464px] font-akira text-[107px] leading-[1.2] text-white"
      >
        GPC
      </p>
      <a
        data-layer="cta-b"
        href="#"
        className="absolute left-[1038px] top-[528px] w-[94px] font-akira text-[14px] leading-tight text-white"
      >
        EXPLORE MORE →
      </a>

      <button
        ref={consoleRef}
        data-layer="console"
        type="button"
        onClick={onPlay}
        aria-label="Play the arcade game"
        className="absolute left-[364px] top-[304px] h-[281px] w-[322px] cursor-pointer outline-none transition-[filter] duration-300 hover:drop-shadow-[0_0_30px_rgba(79,180,227,0.8)] focus-visible:drop-shadow-[0_0_30px_rgba(79,180,227,0.8)]"
      >
        <img src={ASSETS.console} alt="" className="h-full w-full object-cover" />
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

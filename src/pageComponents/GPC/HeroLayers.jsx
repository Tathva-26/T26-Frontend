import AuroraOverlay from "./AuroraOverlay";
import DragonLoop from "./DragonLoop";
import HeroConsole from "./HeroConsole";
import Stage from "./Stage";
import { ASSETS, BANNER, DRAGON_SIZE, DRAGON_STATIC, STAGE } from "@/pageComponents/GPC/gpcConfig";

// The dragon keeps its own proportions, centred in the slot the design gives it.
const dragonHeight = (DRAGON_STATIC.width * DRAGON_SIZE.height) / DRAGON_SIZE.width;
const dragonStyle = {
  left: DRAGON_STATIC.x,
  top: DRAGON_STATIC.y + (DRAGON_STATIC.height - dragonHeight) / 2,
  width: DRAGON_STATIC.width,
};

/**
 * Landscape hero: the Figma layout in a Stage scaled by `scale` to fit, with
 * the dragon above the console, the GPC title beside it and the tagline below.
 *
 * The banner band is not part of the Stage: it sits behind it at the same
 * height the design gives it but runs the full width of the section, so it
 * reaches both edges on screens wider than the Stage's own aspect ratio.
 *
 * The data-gpc attributes are the handles the scroll sequence animates.
 */
export default function HeroLayers({ scale, consoleRef, onPlay, consoleHidden, paused, touch, sequence }) {
  const bandStyle = {
    top: `calc(50% - ${(STAGE.height / 2 - BANNER.top) * scale}px)`,
    height: BANNER.height * scale,
    clipPath: `inset(0px 0px ${BANNER.cropBottom * scale}px 0px)`,
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-x-0 overflow-hidden" style={bandStyle}>
        <img src={ASSETS.banner} alt="" className="h-full w-full object-cover object-bottom" />
        <AuroraOverlay paused={paused} />
      </div>

      <Stage {...STAGE} scale={scale}>
        <DragonLoop className="absolute" style={dragonStyle} />

        <h2
          aria-label="GPC"
          className="absolute left-[707px] top-[464px] text-[107px] leading-[1.2] text-white"
          style={{ fontFamily: "var(--font-akira)" }}
        >
          {[..."GPC"].map((letter) => (
            <span key={letter} data-gpc="letter" aria-hidden="true" className="inline-block">
              {letter}
            </span>
          ))}
        </h2>

        <HeroConsole
          consoleRef={consoleRef}
          onPlay={onPlay}
          hidden={consoleHidden}
          paused={paused}
          touch={touch}
          sequence={sequence}
          scale={scale}
          className="absolute left-[364px] top-[304px] h-[281px] w-[322px]"
        />

        <p
          data-gpc="tagline"
          className="absolute left-[320px] top-[623px] w-[796px] text-[50px] uppercase leading-[1.2] text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Show off your skills and conquer the arena
        </p>
      </Stage>
    </div>
  );
}

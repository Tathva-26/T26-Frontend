import AuroraOverlay from "./AuroraOverlay";
import DragonLoop from "./DragonLoop";
import HeroConsole from "./HeroConsole";
import Stage from "./Stage";
import { ASSETS, BANNER, DRAGON_STATIC, STAGE } from "@/pageComponents/GPC/gpcConfig";

/**
 * Landscape hero: the Figma layout in a Stage scaled by `scale` to fit, with
 * the dragon above the console, the GPC title beside it and the tagline below.
 *
 * The banner band is not part of the Stage: it sits behind it at the same
 * height the design gives it but runs the full width of the section, so it
 * reaches both edges on screens wider than the Stage's own aspect ratio.
 */
export default function HeroLayers({ scale, consoleRef, onPlay, consoleHidden, paused, touch }) {
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
        <DragonLoop
          className="absolute object-contain"
          style={{
            left: DRAGON_STATIC.x,
            top: DRAGON_STATIC.y,
            width: DRAGON_STATIC.width,
            height: DRAGON_STATIC.height,
          }}
        />

        <h2
          className="absolute left-[707px] top-[464px] text-[107px] leading-[1.2] text-white"
          style={{ fontFamily: "var(--font-akira)" }}
        >
          GPC
        </h2>

        <HeroConsole
          consoleRef={consoleRef}
          onPlay={onPlay}
          hidden={consoleHidden}
          paused={paused}
          touch={touch}
          scale={scale}
          className="absolute left-[364px] top-[304px] h-[281px] w-[322px]"
        />

        <p
          className="absolute left-[320px] top-[623px] w-[796px] text-[50px] uppercase leading-[1.2] text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Show off your skills and conquer the arena
        </p>
      </Stage>
    </div>
  );
}

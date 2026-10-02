import AuroraOverlay from "@/pageComponents/GPC/AuroraOverlay";
import DragonLoop from "@/pageComponents/GPC/DragonLoop";
import HeroConsole from "@/pageComponents/GPC/HeroConsole";
import { ASSETS, DRAGON_SIZE } from "@/pageComponents/GPC/gpcConfig";

// Widest the dragon can be while still fitting its slot in both directions
// (cqw / cqh are 1% of that slot's width / height).
const DRAGON_FIT_WIDTH = `min(100cqw, calc(100cqh * ${DRAGON_SIZE.width} / ${DRAGON_SIZE.height}))`;

/**
 * Portrait hero (phones and tablets held upright): fills the section, no
 * scrolling. Top to bottom: dragon (takes all spare height), console, GPC
 * title, tagline at the very bottom. The console and the type are sized from
 * both the width and the height available, so they stay in proportion from a
 * small phone to a large tablet.
 *
 * The data-gpc attributes are the handles the scroll sequence animates.
 */
export default function HeroLayersMobile({ consoleRef, onPlay, consoleHidden, paused, touch, sequence }) {
  return (
    <>
      <img
        src={ASSETS.banner}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "35% 25%" }}
      />
      <AuroraOverlay paused={paused} />

      <div
        className="relative z-10 flex h-full w-full flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        style={{ paddingTop: "calc(max(0.75rem, env(safe-area-inset-top)) + var(--gpc-float-nav, 0px))" }}
      >
        {/* Dragon: as large as fits in whatever height the rest doesn't need */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center [container-type:size]">
          <DragonLoop className="relative" style={{ width: DRAGON_FIT_WIDTH }} />
        </div>

        <HeroConsole
          consoleRef={consoleRef}
          onPlay={onPlay}
          hidden={consoleHidden}
          paused={paused}
          touch={touch}
          sequence={sequence}
          className="relative shrink-0"
          style={{ width: "min(34.4dvh, 80vw)", aspectRatio: "322 / 281" }}
        />

        <h2
          aria-label="GPC"
          className="mt-3 shrink-0 text-[clamp(2.5rem,min(13vw,9dvh),6.5rem)] leading-none text-white"
          style={{ fontFamily: "var(--font-akira)" }}
        >
          {[..."GPC"].map((letter) => (
            <span key={letter} data-gpc="letter" aria-hidden="true" className="inline-block">
              {letter}
            </span>
          ))}
        </h2>

        <p
          data-gpc="tagline"
          className="mt-3 max-w-[26ch] shrink-0 text-center text-[clamp(1rem,min(4.6vw,3.2dvh),2.25rem)] uppercase leading-tight text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Show off your skills and conquer the arena
        </p>
      </div>
    </>
  );
}

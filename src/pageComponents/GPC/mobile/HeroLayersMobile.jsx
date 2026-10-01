import AuroraOverlay from "@/pageComponents/GPC/AuroraOverlay";
import DragonLoop from "@/pageComponents/GPC/DragonLoop";
import HeroConsole from "@/pageComponents/GPC/HeroConsole";
import { ASSETS } from "@/pageComponents/GPC/gpcConfig";

/**
 * Portrait hero (phones and tablets held upright): fills the section, no
 * scrolling. Top to bottom: dragon (takes all spare height), console, GPC
 * title, tagline at the very bottom. The console and the type are sized from
 * both the width and the height available, so they stay in proportion from a
 * small phone to a large tablet.
 */
export default function HeroLayersMobile({ consoleRef, onPlay, consoleHidden, paused, touch }) {
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
        {/* Dragon: fills whatever height the rest doesn't need */}
        <div className="relative min-h-0 w-full flex-1">
          <DragonLoop className="absolute inset-0 h-full w-full object-contain" />
        </div>

        <HeroConsole
          consoleRef={consoleRef}
          onPlay={onPlay}
          hidden={consoleHidden}
          paused={paused}
          touch={touch}
          className="relative shrink-0"
          style={{ width: "min(34.4dvh, 80vw)", aspectRatio: "322 / 281" }}
        />

        <h2
          className="mt-3 shrink-0 text-[clamp(2.5rem,min(13vw,9dvh),6.5rem)] leading-none text-white"
          style={{ fontFamily: "var(--font-akira)" }}
        >
          GPC
        </h2>

        <p
          className="mt-3 max-w-[26ch] shrink-0 text-center text-[clamp(1rem,min(4.6vw,3.2dvh),2.25rem)] uppercase leading-tight text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Show off your skills and conquer the arena
        </p>
      </div>
    </>
  );
}

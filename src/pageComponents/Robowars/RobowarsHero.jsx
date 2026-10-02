"use client";

import { useRef } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ROBOWARS_FRAME_HEIGHT,
  ROBOWARS_FRAME_WIDTH,
  ROBOWARS_TV_SCREEN,
  TV_ART_STYLE,
} from "../wheels/robowarsHandoff";
import "./robowars.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Figma: "Calm Serif" — used for the main serif headline
const calmSerif = localFont({
  src: "../../../public/fonts/calm-serif-demo.otf",
  variable: "--font-calm-serif-local",
  display: "swap",
});

// Figma: "Alata" — used for date, arena specs, prize text
const alata = localFont({
  src: "../../../public/fonts/alata-regular.ttf",
  variable: "--font-alata-local",
  display: "swap",
});

// "Bowlby One SC" — used for ROBO WARS headline
const bowlbyOneSC = localFont({
  src: "../../../public/fonts/BowlbyOneSC-Regular.ttf",
  variable: "--font-bowlby-one-sc-local",
  display: "swap",
});

const ASSET_ROOT = "/images/Robowars";
const FRAME_WIDTH = ROBOWARS_FRAME_WIDTH;
const FRAME_HEIGHT = ROBOWARS_FRAME_HEIGHT;
const MOBILE_FRAME_WIDTH = 412;
const MOBILE_FRAME_HEIGHT = 594;

function frameStyle({ x, y, width, height, frameWidth = FRAME_WIDTH, frameHeight = FRAME_HEIGHT }) {
  return {
    left: `${(x / frameWidth) * 100}%`,
    top: `${(y / frameHeight) * 100}%`,
    width: `${(width / frameWidth) * 100}%`,
    height: `${(height / frameHeight) * 100}%`,
  };
}

function Art({
  src,
  alt = "",
  x,
  y,
  width,
  height,
  frameWidth,
  frameHeight,
  priority = false,
  className = "",
}) {
  return (
    <div
      className={`absolute ${className}`}
      style={frameStyle({ x, y, width, height, frameWidth, frameHeight })}
    >
      <Image
        src={`${ASSET_ROOT}/${src}`}
        alt={alt}
        fill
        priority={priority}
        sizes={`${Math.ceil(width)}px`}
        draggable={false}
        className="robowars-art select-none object-fill"
      />
    </div>
  );
}

function DesktopFrame({ className, scale = "desktop", containerRef }) {
  const isTablet = scale === "tablet";

  return (
    <div
      ref={containerRef}
      className={`absolute left-1/2 top-1/2 aspect-[1413/697] -translate-x-1/2 -translate-y-1/2 [container-type:size] ${className}`}
    >
      <Image
        src={`${ASSET_ROOT}/arena-bg.png`}
        alt=""
        fill
        priority={!isTablet}
        sizes={isTablet ? "112vw" : "100vw"}
        draggable={false}
        className="object-cover"
      />

      {/* The docked Wheels TV, now dark, carried over as a background prop to
          bridge the two sections. Same geometry as
          the Wheels TV, which docks exactly on top of it before fading out. */}
      <div
        aria-hidden="true"
        data-robowars-tv-screen
        className="pointer-events-none absolute opacity-90"
        style={frameStyle(ROBOWARS_TV_SCREEN)}
      >
        <div className="absolute" style={TV_ART_STYLE}>
          <Image src="/wheels/tv.png" alt="" fill sizes="440px" className="object-fill" />
        </div>
        <div className="absolute inset-0 rounded-[6px] bg-black" />
      </div>

      <Art
        src="arena-left-robot.svg"
        alt=""
        x={isTablet ? -28 : -14}
        y={isTablet ? 108 : 109}
        width={368}
        height={612}
        priority={!isTablet}
        className="robowars-motion robowars-robot robowars-left-robot pointer-events-none"
      />
      <Art
        src="arena-right-robot.svg"
        alt=""
        x={1047}
        y={isTablet ? 59 : 60}
        width={394}
        height={661}
        priority={!isTablet}
        className="robowars-motion robowars-robot robowars-right-robot pointer-events-none"
      />

      <div
        className="pointer-events-none absolute grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start justify-center gap-x-[1.9cqw] text-white uppercase"
        style={frameStyle({ x: 405, y: 217, width: 602, height: 174 })}
      >
        <div className="robowars-motion robowars-title-left font-bowlby-one-sc text-right text-[5.71cqw] leading-[0.95] will-change-transform">
          ROBO
        </div>
        <div className="robowars-motion robowars-title-right font-bowlby-one-sc text-left text-[5.71cqw] leading-[0.95] will-change-transform">
          WARS
        </div>
        <div className="robowars-motion robowars-title-left font-calm-serif text-right text-[4.58cqw] leading-[1.15] will-change-transform">
          ENTER
        </div>
        <div className="robowars-motion robowars-title-right font-calm-serif text-left text-[4.58cqw] leading-[1.15] will-change-transform">
          ARENA
        </div>
      </div>

      <div
        className="robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform"
        style={frameStyle({ x: 496, y: 408, width: 422, height: 30 })}
      >
        <span className="h-[2px] w-[32%] bg-white" />
        <span className="font-alata whitespace-nowrap text-[1.85cqw] leading-[1.25]">
          OCT 9,10
        </span>
        <span className="h-[2px] w-[32%] bg-white" />
      </div>

      <div
        className="robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[1.38cqw] leading-[1.18] uppercase will-change-transform"
        style={frameStyle({ x: 489, y: 480, width: 183, height: 56 })}
      >
        <p className="m-0 text-white">PRIZES WORTH INR</p>
        <p className="m-0 text-[#eb9a58]">8 LAKH</p>
      </div>
      <div
        className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[1.38cqw] leading-[1.22] uppercase text-white will-change-transform"
        style={frameStyle({ x: 739, y: 480, width: 252, height: 56 })}
      >
        <p className="m-0">16 x 16 FT. ARENA</p>
        <p className="m-0">8KG \ 15KG</p>
      </div>
      <div
        className="robowars-motion robowars-date pointer-events-none absolute w-px bg-white/55 will-change-transform"
        style={frameStyle({ x: 706, y: 488, width: 1, height: 37 })}
      />

    </div>
  );
}

function MobileFrame({ containerRef }) {
  return (
    <div
      ref={containerRef}
      className="absolute left-1/2 top-1/2 aspect-[412/594] w-screen -translate-x-1/2 -translate-y-1/2 [container-type:size] md:hidden"
    >
      <Image
        src={`${ASSET_ROOT}/mobile-background.png`}
        alt=""
        fill
        priority
        sizes="100vw"
        draggable={false}
        className="object-cover"
      />

      <Art
        src="arena-left-robot.svg"
        alt=""
        x={-54}
        y={34}
        width={228}
        height={379}
        frameWidth={MOBILE_FRAME_WIDTH}
        frameHeight={MOBILE_FRAME_HEIGHT}
        priority
        className="robowars-motion robowars-robot robowars-left-robot pointer-events-none"
      />
      <Art
        src="arena-right-robot.svg"
        alt=""
        x={240}
        y={42}
        width={226}
        height={378}
        frameWidth={MOBILE_FRAME_WIDTH}
        frameHeight={MOBILE_FRAME_HEIGHT}
        priority
        className="robowars-motion robowars-robot robowars-right-robot pointer-events-none"
      />

      <div
        className="pointer-events-none absolute text-center uppercase text-white"
        style={frameStyle({
          x: 63,
          y: 386,
          width: 286,
          height: 66,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <p className="robowars-motion robowars-title-left m-0 whitespace-nowrap font-bowlby-one-sc text-[8.35cqw] leading-[0.95] will-change-transform">
          ROBO WARS
        </p>
        <p className="robowars-motion robowars-title-right m-0 font-calm-serif text-[6.9cqw] leading-[1.05] normal-case will-change-transform">
          Enter Arena
        </p>
      </div>

      <div
        className="robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform"
        style={frameStyle({
          x: 134,
          y: 460,
          width: 164,
          height: 12,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <span className="h-px w-[31%] bg-white" />
        <span className="font-alata whitespace-nowrap text-[2.45cqw] leading-none">
          OCT 9,10
        </span>
        <span className="h-px w-[31%] bg-white" />
      </div>

      <div
        className="robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[2.25cqw] leading-[1.15] uppercase will-change-transform"
        style={frameStyle({
          x: 118,
          y: 498,
          width: 81,
          height: 42,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <p className="m-0 text-white">PRIZES WORTH</p>
        <p className="m-0 text-white">INR</p>
        <p className="m-0 text-[#eb9a58]">8 LAKH</p>
      </div>
      <div
        className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[2.25cqw] leading-[1.38] uppercase text-white will-change-transform"
        style={frameStyle({
          x: 219,
          y: 498,
          width: 145,
          height: 30,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <p className="m-0">16 x 16 FT. ARENA</p>
        <p className="m-0">8KG \ 15KG</p>
      </div>
      <div
        className="robowars-motion robowars-date pointer-events-none absolute w-px bg-white/55 will-change-transform"
        style={frameStyle({
          x: 209,
          y: 501,
          width: 1,
          height: 24,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      />
    </div>
  );
}

// leadInVh: extra scroll distance the stage stays pinned before its own scroll
// animation starts — used when it's pulled up underneath Wheels on the home page.
export default function RobowarsHero({ leadInVh = 0 }) {
  const sectionRef = useRef(null);
  const timelineRef = useRef(null);
  const desktopXlRef = useRef(null);
  const desktopTabletRef = useRef(null);
  const mobileRef = useRef(null);

  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let media;
    let refreshTimer;

    const ctx = gsap.context(() => {
      const pieces = gsap.utils.toArray(".robowars-motion");

      if (reduceMotion) {
        gsap.set(pieces, { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" });
        return;
      }

      // root scopes every selector to the one currently-visible frame variant
      // (desktop-xl / tablet / mobile all share class names and sit in the DOM
      // at once, only one shown via CSS at a time) — without this, every scrub
      // tween below was driving 3x the elements it needed to, tripling the
      // per-frame style work for two copies nobody can see.
      const setInitialMotion = (root, { robotDistance, titleDistance, detailDistance }) => {
        gsap.set(root.querySelectorAll(".robowars-left-robot"), {
          opacity: 0.3,
          transform: `translate3d(-${robotDistance}%, 0, 0) scale(0.96)`,
        });
        gsap.set(root.querySelectorAll(".robowars-right-robot"), {
          opacity: 0.3,
          transform: `translate3d(${robotDistance}%, 0, 0) scale(0.96)`,
        });
        gsap.set(root.querySelectorAll(".robowars-title-left"), {
          opacity: 0,
          transform: `translate3d(-${titleDistance}%, 0, 0) scale(0.97)`,
        });
        gsap.set(root.querySelectorAll(".robowars-title-right"), {
          opacity: 0,
          transform: `translate3d(${titleDistance}%, 0, 0) scale(0.97)`,
        });
        gsap.set(root.querySelectorAll(".robowars-date"), {
          opacity: 0,
          transform: `translate3d(0, ${detailDistance}%, 0) scale(0.98)`,
        });
        gsap.set(root.querySelectorAll(".robowars-prizes"), {
          opacity: 0,
          transform: `translate3d(-${detailDistance}%, 14%, 0) scale(0.98)`,
        });
        gsap.set(root.querySelectorAll(".robowars-arena"), {
          opacity: 0,
          transform: `translate3d(${detailDistance}%, 14%, 0) scale(0.98)`,
        });
      };

      // Quick camera-shake on the whole section, played once each time the
      // scrub crosses the point where the two robots meet at center.
      const triggerCollisionShake = () => {
        const target = sectionRef.current;
        if (!target) return;
        gsap
          .timeline()
          .to(target, { x: 14, y: -8, duration: 0.05, ease: "power1.out" })
          .to(target, { x: -12, y: 8, duration: 0.06 })
          .to(target, { x: 9, y: -6, duration: 0.06 })
          .to(target, { x: -6, y: 4, duration: 0.07 })
          .to(target, { x: 3, y: -2, duration: 0.07 })
          .to(target, { x: 0, y: 0, duration: 0.09, ease: "power2.out" });
      };

      // A `.call()` inside a scrubbed timeline only fires if the scrub's own
      // catch-up tween happens to render through that exact position, which
      // it can skip during fast or uneven scrolling — that's why the shake
      // was intermittent. Watching this trigger's own onUpdate and firing on
      // a progress-0.5 crossing instead reads the *raw* scroll-driven
      // progress directly (not the smoothed scrub tween), so it can't be
      // skipped, and it's exactly aligned with the robots' own tween (which
      // starts at timeline position 0 and finishes at 0.5, its default
      // duration) since it's the same self.progress the timeline itself
      // uses — unlike a separate "50% top" trigger, whose position string
      // ignores viewport height and lands half a screen off from where the
      // scrub's progress actually reaches 0.5.
      let lastProgress = 0;
      const checkCollisionCrossing = (self) => {
        const progress = self.progress;
        if ((lastProgress < 0.5) !== (progress < 0.5)) triggerCollisionShake();
        lastProgress = progress;
      };

      const buildTimeline = (root) => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            scroller: document.querySelector(".main-scroll") || window,
            trigger: timelineRef.current,
            start: "top top",
            end: "bottom bottom",
            // Lenis already smooths the scroll position itself (momentum,
            // inertia), so a numeric scrub here would add a *second*,
            // independent second of catch-up lag on top of that — the
            // animation visibly chasing an already-smoothed value. `true`
            // ties it directly to Lenis's output with no extra delay.
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: checkCollisionCrossing,
          },
        });

        timeline
          .to(
            root.querySelectorAll(".robowars-left-robot, .robowars-right-robot"),
            {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
            },
            0
          )
          .to(
            root.querySelectorAll(".robowars-title-left, .robowars-title-right"),
            {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
            },
            0.14
          )
          .to(
            root.querySelectorAll(".robowars-date"),
            {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
            },
            0.3
          )
          .to(
            root.querySelectorAll(".robowars-prizes, .robowars-arena"),
            {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
            },
            0.42
          );
      };

      media = gsap.matchMedia();
      media.add("(max-width: 767px)", () => {
        const root = mobileRef.current;
        if (!root) return;
        setInitialMotion(root, {
          robotDistance: 42,
          titleDistance: 14,
          detailDistance: 16,
        });
        buildTimeline(root);
      });
      media.add("(min-width: 768px) and (max-width: 1279px)", () => {
        const root = desktopTabletRef.current;
        if (!root) return;
        setInitialMotion(root, {
          robotDistance: 54,
          titleDistance: 20,
          detailDistance: 22,
        });
        buildTimeline(root);
      });
      media.add("(min-width: 1280px)", () => {
        const root = desktopXlRef.current;
        if (!root) return;
        setInitialMotion(root, {
          robotDistance: 70,
          titleDistance: 28,
          detailDistance: 34,
        });
        buildTimeline(root);
      });
    }, sectionRef);

    const refreshTrigger = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };

    const animationFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    window.addEventListener("orientationchange", refreshTrigger);
    window.visualViewport?.addEventListener("resize", refreshTrigger);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(refreshTimer);
      window.removeEventListener("orientationchange", refreshTrigger);
      window.visualViewport?.removeEventListener("resize", refreshTrigger);
      media?.revert();
      ctx.revert();
    };
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="robowars-title"
      className={`${calmSerif.variable} ${alata.variable} ${bowlbyOneSC.variable} relative w-full shrink-0 bg-black text-white [--robowars-h:max(180dvh,900px)] md:[--robowars-h:max(180dvh,1100px)] xl:[--robowars-h:max(180dvh,940px)] motion-reduce:[--robowars-h:100dvh]`}
      style={{ height: `calc(${leadInVh}vh + var(--robowars-h))` }}
    >
      {/* Scroll range of the robots/title animation: the section minus the lead-in */}
      <div
        ref={timelineRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-(--robowars-h)"
      />

      <h1 id="robowars-title" className="sr-only">
        Robo Wars Enter Arena
      </h1>

      <div
        data-robowars-stage
        className="sticky top-0 h-[100dvh] min-h-[560px] w-full overflow-hidden will-change-transform"
      >
        {/* Zoomed in by default; WheelsExperience scales this back down to 1
            as the docking TV's backdrop fades, so the arena zooms out in sync
            with the TV shrinking instead of popping in at full size early. */}
        {/* Width grows past 100vw/112vw whenever the viewport is taller/narrower
            than the 1413:697 arena art — aspect-ratio then derives the height
            from that wider box, so arena-bg (object-cover) always fills the
            full viewport instead of letterboxing top and bottom. */}
        <DesktopFrame
          className="hidden w-[max(100vw,202.726dvh)] xl:block"
          containerRef={desktopXlRef}
        />
        <DesktopFrame
          className="hidden w-[max(112vw,227.053dvh)] md:block xl:hidden"
          scale="tablet"
          containerRef={desktopTabletRef}
        />
        <MobileFrame containerRef={mobileRef} />
      </div>
    </section>
  );
}

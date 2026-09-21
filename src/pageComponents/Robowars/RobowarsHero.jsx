"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ASSET_ROOT = "/images/Robowars";
const FRAME_WIDTH = 1413;
const FRAME_HEIGHT = 697;
const MOBILE_FRAME_WIDTH = 430;
const MOBILE_FRAME_HEIGHT = 932;

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
        className="select-none object-fill"
      />
    </div>
  );
}

export default function RobowarsHero() {
  const sectionRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const pieces = gsap.utils.toArray(".robowars-motion");

      if (reduceMotion) {
        gsap.set(pieces, { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" });
        return;
      }

      gsap.set(".robowars-left-robot", {
        opacity: 0.3,
        transform: "translate3d(-70%, 0, 0) scale(0.96)",
      });
      gsap.set(".robowars-right-robot", {
        opacity: 0.3,
        transform: "translate3d(70%, 0, 0) scale(0.96)",
      });
      gsap.set(".robowars-title-left", {
        opacity: 0,
        transform: "translate3d(-28%, 0, 0) scale(0.97)",
      });
      gsap.set(".robowars-title-right", {
        opacity: 0,
        transform: "translate3d(28%, 0, 0) scale(0.97)",
      });
      gsap.set(".robowars-date", {
        opacity: 0,
        transform: "translate3d(0, 34%, 0) scale(0.98)",
      });
      gsap.set(".robowars-prizes", {
        opacity: 0,
        transform: "translate3d(-34%, 18%, 0) scale(0.98)",
      });
      gsap.set(".robowars-arena", {
        opacity: 0,
        transform: "translate3d(34%, 18%, 0) scale(0.98)",
      });
      gsap.set(".robowars-badge", {
        opacity: 0,
        transform: "translate3d(0, -90%, 0) scale(0.97)",
      });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      timeline
        .to(
          ".robowars-left-robot, .robowars-right-robot",
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          0
        )
        .to(
          ".robowars-title-left, .robowars-title-right",
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          0.14
        )
        .to(
          ".robowars-date",
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          0.3
        )
        .to(
          ".robowars-prizes, .robowars-arena",
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          0.42
        )
        .to(
          ".robowars-badge",
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          0.5
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="robowars-title"
      className="relative h-[180vh] min-h-[940px] w-full bg-black text-white"
    >
      <h1 id="robowars-title" className="sr-only">
        Robo Wars Fight On
      </h1>

      <div className="sticky top-0 h-screen min-h-[520px] w-full overflow-hidden">
        <div
          ref={frameRef}
          className="absolute left-1/2 top-1/2 hidden aspect-[1413/697] w-[max(100vw,calc(100vh*1413/697))] -translate-x-1/2 -translate-y-1/2 [container-type:size] md:block"
        >
          <Image
            src={`${ASSET_ROOT}/Robowars.svg`}
            alt=""
            fill
            priority
            sizes="100vw"
            draggable={false}
            className="object-cover"
          />

          <Art
            src="robot-left.svg"
            alt=""
            x={-28}
            y={-82}
            width={805}
            height={949.382}
            priority
            className="robowars-motion robowars-left-robot pointer-events-none will-change-transform"
          />
          <Art
            src="robot-right.svg"
            alt=""
            x={535}
            y={0}
            width={888}
            height={796.016}
            priority
            className="robowars-motion robowars-right-robot pointer-events-none will-change-transform"
          />

          <div
            className="pointer-events-none absolute grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start justify-center gap-x-[2.125cqw] text-white uppercase"
            style={frameStyle({ x: 372, y: 203, width: 650, height: 183 })}
          >
            <div className="robowars-motion robowars-title-left font-calm-serif text-right text-[7.064cqw] leading-[0.95] will-change-transform">
              ROBO
            </div>
            <div className="robowars-motion robowars-title-right font-calm-serif text-left text-[7.064cqw] leading-[0.95] will-change-transform">
              WARS
            </div>
            <div className="robowars-motion robowars-title-left font-akira-expanded text-right text-[4.954cqw] font-extrabold leading-[1.15] will-change-transform">
              FIGHT
            </div>
            <div className="robowars-motion robowars-title-right font-akira-expanded text-left text-[4.954cqw] font-extrabold leading-[1.15] will-change-transform">
              ON
            </div>
          </div>

          <div
            className="robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform"
            style={frameStyle({ x: 500, y: 405, width: 470, height: 34 })}
          >
            <span className="h-[2px] w-[34%] bg-white" />
            <span className="font-alata whitespace-nowrap text-[1.847cqw] leading-[1.38]">
              OCT 9,10
            </span>
            <span className="h-[2px] w-[34%] bg-white" />
          </div>
          <div
            className="robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[1.699cqw] leading-[1.15] uppercase will-change-transform"
            style={frameStyle({ x: 500, y: 480, width: 207, height: 66 })}
          >
            <p className="m-0 text-white">PRIZES WORTH INR</p>
            <p className="m-0 text-[#eb9a58]">8 LAKH</p>
          </div>
          <div
            className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[1.699cqw] leading-[1.38] uppercase text-white will-change-transform"
            style={frameStyle({ x: 757, y: 480, width: 373.364, height: 66 })}
          >
            <p className="m-0">16 x 16 FT. ARENA</p>
            <p className="m-0">8KG \ 15KG</p>
          </div>

          <Art
            src="badge-pill.svg"
            alt=""
            x={626}
            y={0}
            width={161.5}
            height={29.5}
            priority
            className="robowars-motion robowars-badge pointer-events-none will-change-transform"
          />
          <p
            className="robowars-motion robowars-badge pointer-events-none absolute m-0 font-instrument-serif text-[1.278cqw] leading-[1.3] text-[#ffdfc4] will-change-transform"
            style={frameStyle({ x: 680, y: 3, width: 72, height: 24 })}
          >
            Robowars
          </p>
        </div>

        <div
          className="absolute left-1/2 top-1/2 aspect-[430/932] h-screen min-h-[620px] -translate-x-1/2 -translate-y-1/2 [container-type:size] md:hidden"
        >
          <Image
            src={`${ASSET_ROOT}/Robowars.svg`}
            alt=""
            fill
            priority
            sizes="100vw"
            draggable={false}
            className="object-cover"
          />

          <Art
            src="robot-right.svg"
            alt=""
            x={-40}
            y={-125}
            width={682}
            height={1548.971}
            frameWidth={MOBILE_FRAME_WIDTH}
            frameHeight={MOBILE_FRAME_HEIGHT}
            priority
            className="robowars-motion robowars-right-robot pointer-events-none will-change-transform"
          />
          <Art
            src="robot-left.svg"
            alt=""
            x={-144}
            y={-82}
            width={474}
            height={1106.44}
            frameWidth={MOBILE_FRAME_WIDTH}
            frameHeight={MOBILE_FRAME_HEIGHT}
            priority
            className="robowars-motion robowars-left-robot pointer-events-none will-change-transform"
          />

          <div
            className="pointer-events-none absolute grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start justify-center gap-x-[3.25cqw] text-white uppercase"
            style={frameStyle({
              x: 91,
              y: 210,
              width: 250,
              height: 78,
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          >
            <div className="robowars-motion robowars-title-left font-calm-serif text-right text-[9.37cqw] leading-[0.95] will-change-transform">
              ROBO
            </div>
            <div className="robowars-motion robowars-title-right font-calm-serif text-left text-[9.37cqw] leading-[0.95] will-change-transform">
              WARS
            </div>
            <div className="robowars-motion robowars-title-left font-akira-expanded text-right text-[6.57cqw] font-extrabold leading-[1.15] will-change-transform">
              FIGHT
            </div>
            <div className="robowars-motion robowars-title-right font-akira-expanded text-left text-[6.57cqw] font-extrabold leading-[1.15] will-change-transform">
              ON
            </div>
          </div>

          <div
            className="robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform"
            style={frameStyle({
              x: 126,
              y: 277,
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
              x: 94,
              y: 318,
              width: 106,
              height: 42,
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          >
            <p className="m-0 text-white">PRIZES WORTH INR</p>
            <p className="m-0 text-[#eb9a58]">8 LAKH</p>
          </div>
          <div
            className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[2.25cqw] leading-[1.38] uppercase text-white will-change-transform"
            style={frameStyle({
              x: 219,
              y: 318,
              width: 146,
              height: 42,
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          >
            <p className="m-0">16 x 16 FT. ARENA</p>
            <p className="m-0">8KG \ 15KG</p>
          </div>

          <Art
            src="badge-pill.svg"
            alt=""
            x={171}
            y={0}
            width={88}
            height={16}
            frameWidth={MOBILE_FRAME_WIDTH}
            frameHeight={MOBILE_FRAME_HEIGHT}
            priority
            className="robowars-motion robowars-badge pointer-events-none will-change-transform"
          />
          <p
            className="robowars-motion robowars-badge pointer-events-none absolute m-0 font-instrument-serif text-[2.28cqw] leading-none text-[#ffdfc4] will-change-transform"
            style={frameStyle({
              x: 199,
              y: 1,
              width: 44,
              height: 13,
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          >
            Robowars
          </p>
        </div>
      </div>
    </section>
  );
}

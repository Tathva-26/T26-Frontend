"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ASSET_ROOT = "/images/Robowars";
const FRAME_WIDTH = 1413;
const FRAME_HEIGHT = 697;
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
  imageClassName = "object-fill",
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
        className={`select-none ${imageClassName}`}
      />
    </div>
  );
}

function CroppedArt({
  src,
  sourceWidth,
  sourceHeight,
  x,
  y,
  width,
  height,
  imageStyle,
  className = "",
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute overflow-hidden ${className}`}
      style={frameStyle({
        x,
        y,
        width,
        height,
        frameWidth: MOBILE_FRAME_WIDTH,
        frameHeight: MOBILE_FRAME_HEIGHT,
      })}
    >
      <Image
        src={`${ASSET_ROOT}/${src}`}
        alt=""
        width={sourceWidth}
        height={sourceHeight}
        priority
        sizes="100vw"
        draggable={false}
        className="absolute max-w-none select-none"
        style={imageStyle}
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
    let media;
    const ctx = gsap.context(() => {
      const pieces = gsap.utils.toArray(".robowars-motion");

      if (reduceMotion) {
        gsap.set(pieces, { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" });
        return;
      }

      const setInitialMotion = ({ robotDistance, titleDistance, detailDistance, badgeDistance }) => {
        gsap.set(".robowars-left-robot", {
          opacity: 0.3,
          transform: `translate3d(-${robotDistance}%, 0, 0) scale(0.96)`,
        });
        gsap.set(".robowars-right-robot", {
          opacity: 0.3,
          transform: `translate3d(${robotDistance}%, 0, 0) scale(0.96)`,
        });
        gsap.set(".robowars-title-left", {
          opacity: 0,
          transform: `translate3d(-${titleDistance}%, 0, 0) scale(0.97)`,
        });
        gsap.set(".robowars-title-right", {
          opacity: 0,
          transform: `translate3d(${titleDistance}%, 0, 0) scale(0.97)`,
        });
        gsap.set(".robowars-date", {
          opacity: 0,
          transform: `translate3d(0, ${detailDistance}%, 0) scale(0.98)`,
        });
        gsap.set(".robowars-prizes", {
          opacity: 0,
          transform: `translate3d(-${detailDistance}%, 14%, 0) scale(0.98)`,
        });
        gsap.set(".robowars-arena", {
          opacity: 0,
          transform: `translate3d(${detailDistance}%, 14%, 0) scale(0.98)`,
        });
        gsap.set(".robowars-badge", {
          opacity: 0,
          transform: `translate3d(0, -${badgeDistance}%, 0) scale(0.97)`,
        });
      };

<<<<<<< HEAD
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
=======
      const buildTimeline = () => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
>>>>>>> 7585afc (Updates matching new ui design)

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
      };

      media = gsap.matchMedia();
      media.add("(max-width: 767px)", () => {
        setInitialMotion({
          robotDistance: 42,
          titleDistance: 14,
          detailDistance: 16,
          badgeDistance: 48,
        });
        buildTimeline();
      });
      media.add("(min-width: 768px) and (max-width: 1279px)", () => {
        setInitialMotion({
          robotDistance: 54,
          titleDistance: 20,
          detailDistance: 22,
          badgeDistance: 64,
        });
        buildTimeline();
      });
      media.add("(min-width: 1280px)", () => {
        setInitialMotion({
          robotDistance: 70,
          titleDistance: 28,
          detailDistance: 34,
          badgeDistance: 90,
        });
        buildTimeline();
      });
    }, sectionRef);

    return () => {
      media?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="robowars-title"
<<<<<<< HEAD
      className="relative h-[180dvh] min-h-[940px] w-full bg-black text-white motion-reduce:h-dvh motion-reduce:min-h-dvh"
=======
      className="relative h-[180dvh] min-h-[900px] w-full bg-black text-white md:min-h-[1100px] xl:min-h-[940px]"
>>>>>>> 7585afc (Updates matching new ui design)
    >
      <h1 id="robowars-title" className="sr-only">
        Robo Wars Enter Arena
      </h1>

<<<<<<< HEAD
      <div className="sticky top-0 h-dvh min-h-[520px] w-full overflow-hidden">
        <div
          ref={frameRef}
          className="absolute left-1/2 top-1/2 hidden aspect-[1413/697] w-[max(100%,calc(100dvh*1413/697))] -translate-x-1/2 -translate-y-1/2 [container-type:size] min-[900px]:landscape:block"
=======
      <div className="sticky top-0 h-[100dvh] min-h-[560px] w-full overflow-hidden">
        <div
          ref={frameRef}
          className="absolute left-1/2 top-1/2 hidden aspect-[1413/697] w-screen -translate-x-1/2 -translate-y-1/2 [container-type:size] xl:block"
>>>>>>> 7585afc (Updates matching new ui design)
        >
          <Image
            src={`${ASSET_ROOT}/arena-bg.png`}
            alt=""
            fill
            priority
            sizes="(min-width: 900px) and (orientation: landscape) 100vw, 1px"
            draggable={false}
            className="object-cover"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[4.8%] w-[96%] -translate-x-1/2 text-center font-akira-expanded text-[14.15cqw] font-extrabold uppercase leading-none text-white/10"
          >
            FIGHT ON
          </div>

          <Art
            src="arena-left-robot.webp"
            alt=""
            x={-14}
            y={109}
            width={368}
            height={612}
            priority
            className="robowars-motion robowars-left-robot pointer-events-none will-change-transform"
          />

          <Art
            src="arena-right-robot.webp"
            alt=""
            x={1048}
            y={86}
            width={365}
            height={789}
            priority
            className="robowars-motion robowars-right-robot pointer-events-none will-change-transform"
          />

          <div
<<<<<<< HEAD
            className="robowars-motion robowars-title-left pointer-events-none absolute text-right uppercase text-white will-change-transform"
            style={frameStyle({ x: 372, y: 203, width: 323, height: 183 })}
          >
            <p className="m-0 font-calm-serif text-[7.064cqw] leading-[0.95]">ROBO</p>
            <p className="m-0 font-akira-expanded text-[4.954cqw] font-extrabold leading-[1.15]">FIGHT</p>
          </div>
          <div
            className="robowars-motion robowars-title-right pointer-events-none absolute text-left uppercase text-white will-change-transform"
            style={frameStyle({ x: 725, y: 196, width: 316, height: 183 })}
          >
            <p className="m-0 font-calm-serif text-[7.064cqw] leading-[1.15]">WARS</p>
            <p className="m-0 font-akira-expanded text-[4.954cqw] font-extrabold leading-[1.15]">ON</p>
          </div>

          <div
            className="robowars-motion robowars-date pointer-events-none absolute text-white will-change-transform"
            style={frameStyle({ x: 484, y: 405, width: 422, height: 29.5 })}
          >
            <span className="absolute -left-[4.74%] top-[66.1%] h-[2px] w-[38.51%] bg-white" />
            <span className="absolute left-[38.98%] top-0 font-alata whitespace-nowrap text-[1.847cqw] leading-[1.13]">
              OCT 9,10
            </span>
            <span className="absolute left-[68.84%] top-[64.4%] h-[2px] w-[37.8%] bg-white" />
          </div>
          <div
            className="robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[1.699cqw] leading-[1.15] uppercase will-change-transform"
            style={frameStyle({ x: 464, y: 480, width: 207, height: 66 })}
=======
            className="pointer-events-none absolute grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start justify-center gap-x-[1.9cqw] text-white uppercase"
            style={frameStyle({ x: 387, y: 217, width: 602, height: 174 })}
          >
            <div className="robowars-motion robowars-title-left font-calm-serif text-right text-[5.71cqw] leading-[0.95] will-change-transform">
              ROBO
            </div>
            <div className="robowars-motion robowars-title-right font-calm-serif text-left text-[5.71cqw] leading-[0.95] will-change-transform">
              WARS
            </div>
            <div className="robowars-motion robowars-title-left font-akira-expanded text-right text-[4.58cqw] font-extrabold leading-[1.15] will-change-transform">
              ENTER
            </div>
            <div className="robowars-motion robowars-title-right font-akira-expanded text-left text-[4.58cqw] font-extrabold leading-[1.15] will-change-transform">
              ARENA
            </div>
          </div>

          <div
            className="robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform"
            style={frameStyle({ x: 452, y: 408, width: 422, height: 30 })}
          >
            <span className="h-[2px] w-[32%] bg-white" />
            <span className="font-alata whitespace-nowrap text-[1.85cqw] leading-[1.25]">
              OCT 9,10
            </span>
            <span className="h-[2px] w-[32%] bg-white" />
          </div>
          <div
            className="robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[1.38cqw] leading-[1.18] uppercase will-change-transform"
            style={frameStyle({ x: 457, y: 480, width: 183, height: 56 })}
>>>>>>> 7585afc (Updates matching new ui design)
          >
            <p className="m-0 text-white">PRIZES WORTH INR</p>
            <p className="m-0 text-[#eb9a58]">8 LAKH</p>
          </div>
          <div
<<<<<<< HEAD
            className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[1.699cqw] leading-[1.38] uppercase text-white will-change-transform"
            style={frameStyle({ x: 721, y: 480, width: 373.364, height: 66 })}
=======
            className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[1.38cqw] leading-[1.22] uppercase text-white will-change-transform"
            style={frameStyle({ x: 707, y: 480, width: 252, height: 56 })}
>>>>>>> 7585afc (Updates matching new ui design)
          >
            <p className="m-0">16 x 16 FT. ARENA</p>
            <p className="m-0">8KG \ 15KG</p>
          </div>
          <div
            className="robowars-motion robowars-date pointer-events-none absolute w-px bg-white/55 will-change-transform"
            style={frameStyle({ x: 688, y: 488, width: 1, height: 37 })}
          />

          <Art
            src="tathva-white-logo.png"
            alt=""
            x={16}
            y={18}
            width={55}
            height={45.571}
            priority
            className="robowars-motion robowars-badge pointer-events-none will-change-transform"
          />
        </div>

        <div
<<<<<<< HEAD
          className="absolute left-1/2 top-1/2 aspect-[412/594] w-[max(100%,calc(100dvh*412/594))] -translate-x-1/2 -translate-y-1/2 [container-type:size] min-[900px]:landscape:hidden"
        >
          <Image
            src={`${ASSET_ROOT}/mobile-background.png`}
=======
          className="absolute left-1/2 top-1/2 hidden aspect-[1413/697] w-[112vw] -translate-x-1/2 -translate-y-1/2 [container-type:size] md:block xl:hidden"
        >
          <Image
            src={`${ASSET_ROOT}/arena-bg.png`}
            alt=""
            fill
            sizes="116vw"
            draggable={false}
            className="object-cover"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[4.8%] w-[100%] -translate-x-1/2 text-center font-akira-expanded text-[13.2cqw] font-extrabold uppercase leading-none text-white/10"
          >
            FIGHT ON
          </div>

          <Art
            src="arena-left-robot.webp"
            alt=""
            x={-28}
            y={108}
            width={368}
            height={612}
            className="robowars-motion robowars-left-robot pointer-events-none will-change-transform"
          />

          <Art
            src="arena-right-robot.webp"
            alt=""
            x={1048}
            y={86}
            width={365}
            height={789}
            className="robowars-motion robowars-right-robot pointer-events-none will-change-transform"
          />

          <div
            className="pointer-events-none absolute grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start justify-center gap-x-[1.9cqw] text-white uppercase"
            style={frameStyle({ x: 387, y: 217, width: 602, height: 174 })}
          >
            <div className="robowars-motion robowars-title-left font-calm-serif text-right text-[5.71cqw] leading-[0.95] will-change-transform">
              ROBO
            </div>
            <div className="robowars-motion robowars-title-right font-calm-serif text-left text-[5.71cqw] leading-[0.95] will-change-transform">
              WARS
            </div>
            <div className="robowars-motion robowars-title-left font-akira-expanded text-right text-[4.58cqw] font-extrabold leading-[1.15] will-change-transform">
              ENTER
            </div>
            <div className="robowars-motion robowars-title-right font-akira-expanded text-left text-[4.58cqw] font-extrabold leading-[1.15] will-change-transform">
              ARENA
            </div>
          </div>

          <div
            className="robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform"
            style={frameStyle({ x: 452, y: 408, width: 422, height: 30 })}
          >
            <span className="h-[2px] w-[32%] bg-white" />
            <span className="font-alata whitespace-nowrap text-[1.85cqw] leading-[1.25]">
              OCT 9,10
            </span>
            <span className="h-[2px] w-[32%] bg-white" />
          </div>
          <div
            className="robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[1.38cqw] leading-[1.18] uppercase will-change-transform"
            style={frameStyle({ x: 457, y: 480, width: 183, height: 56 })}
          >
            <p className="m-0 text-white">PRIZES WORTH INR</p>
            <p className="m-0 text-[#eb9a58]">8 LAKH</p>
          </div>
          <div
            className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[1.38cqw] leading-[1.22] uppercase text-white will-change-transform"
            style={frameStyle({ x: 707, y: 480, width: 252, height: 56 })}
          >
            <p className="m-0">16 x 16 FT. ARENA</p>
            <p className="m-0">8KG \ 15KG</p>
          </div>
          <div
            className="robowars-motion robowars-date pointer-events-none absolute w-px bg-white/55 will-change-transform"
            style={frameStyle({ x: 688, y: 488, width: 1, height: 37 })}
          />

          <Art
            src="tathva-white-logo.png"
            alt=""
            x={16}
            y={18}
            width={55}
            height={45.571}
            className="robowars-motion robowars-badge pointer-events-none will-change-transform"
          />
        </div>

        <div
          className="absolute left-1/2 top-1/2 aspect-[430/932] h-[100dvh] min-h-[560px] -translate-x-1/2 -translate-y-1/2 [container-type:size] md:hidden"
        >
          <Image
            src={`${ASSET_ROOT}/arena-bg.png`}
>>>>>>> 7585afc (Updates matching new ui design)
            alt=""
            fill
            priority
            sizes="(min-width: 900px) and (orientation: landscape) 1px, 100vw"
            draggable={false}
            className="object-cover"
          />

<<<<<<< HEAD
          <CroppedArt
            src="mobile-robot-source-purple.png"
            sourceWidth={1024}
            sourceHeight={1535}
            x={-40}
            y={-125}
            width={682}
            height={1548.971}
            imageStyle={{ left: "-21.08%", top: "2.95%", width: "208.64%", height: "137.6%" }}
            className="robowars-motion robowars-right-robot pointer-events-none will-change-transform"
          />
          <CroppedArt
            src="mobile-robot-source-gray.png"
            sourceWidth={937}
            sourceHeight={1679}
            x={-144}
            y={-82}
            width={474}
            height={1106.44}
            imageStyle={{ left: "-86.93%", top: "1.88%", width: "212.03%", height: "162.87%" }}
=======
          <Art
            src="arena-left-robot.webp"
            alt=""
            x={-128}
            y={240}
            width={220}
            height={366}
            frameWidth={MOBILE_FRAME_WIDTH}
            frameHeight={MOBILE_FRAME_HEIGHT}
            priority
>>>>>>> 7585afc (Updates matching new ui design)
            className="robowars-motion robowars-left-robot pointer-events-none will-change-transform"
          />

          <Art
            src="arena-right-robot.webp"
            alt=""
            x={260}
            y={135}
            width={210}
            height={455}
            frameWidth={MOBILE_FRAME_WIDTH}
            frameHeight={MOBILE_FRAME_HEIGHT}
            priority
            className="robowars-motion robowars-right-robot pointer-events-none will-change-transform"
          />

          <div
<<<<<<< HEAD
            className="robowars-motion robowars-title-left pointer-events-none absolute text-right uppercase text-white will-change-transform"
            style={frameStyle({ x: 97, y: 203.83, width: 111.418, height: 75, frameWidth: MOBILE_FRAME_WIDTH, frameHeight: MOBILE_FRAME_HEIGHT })}
          >
            <p className="m-0 font-calm-serif text-[9.779cqw] leading-[0.95]">ROBO</p>
            <p className="m-0 font-akira-expanded text-[6.858cqw] font-extrabold leading-[1.15]">FIGHT</p>
          </div>
          <div
            className="robowars-motion robowars-title-right pointer-events-none absolute text-left uppercase text-white will-change-transform"
            style={frameStyle({ x: 220.11, y: 201, width: 97.783, height: 78, frameWidth: MOBILE_FRAME_WIDTH, frameHeight: MOBILE_FRAME_HEIGHT })}
          >
            <p className="m-0 font-calm-serif text-[9.779cqw] leading-[1.15]">WARS</p>
            <p className="m-0 font-akira-expanded text-[6.858cqw] font-extrabold leading-[1.15]">ON</p>
=======
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[8%] w-[140%] -translate-x-1/2 text-center font-akira-expanded text-[23cqw] font-extrabold uppercase leading-none text-white/10"
          >
            FIGHT ON
          </div>

          <div
            className="pointer-events-none absolute grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start justify-center gap-x-[3cqw] text-white uppercase"
            style={frameStyle({
              x: 73,
              y: 275,
              width: 260,
              height: 84,
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          >
            <div className="robowars-motion robowars-title-left font-calm-serif text-right text-[9.2cqw] leading-[0.95] will-change-transform">
              ROBO
            </div>
            <div className="robowars-motion robowars-title-right font-calm-serif text-left text-[9.2cqw] leading-[0.95] will-change-transform">
              WARS
            </div>
            <div className="robowars-motion robowars-title-left font-akira-expanded text-right text-[6.1cqw] font-extrabold leading-[1.15] will-change-transform">
              ENTER
            </div>
            <div className="robowars-motion robowars-title-right font-akira-expanded text-left text-[6.1cqw] font-extrabold leading-[1.15] will-change-transform">
              ARENA
            </div>
>>>>>>> 7585afc (Updates matching new ui design)
          </div>

          <div
            className="robowars-motion robowars-date pointer-events-none absolute text-white will-change-transform"
            style={frameStyle({
<<<<<<< HEAD
              x: 126.22,
              y: 277.36,
              width: 164.401,
              height: 11.908,
=======
              x: 99,
              y: 356,
              width: 218,
              height: 12,
>>>>>>> 7585afc (Updates matching new ui design)
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          >
            <span className="absolute -left-[4.91%] top-[66.1%] h-[0.196cqw] w-[35.25%] bg-white" />
            <span className="absolute left-[40.39%] top-0 font-alata whitespace-nowrap text-[2.558cqw] leading-none">
              OCT 9,10
            </span>
            <span className="absolute left-[71.33%] top-[64.4%] h-[0.196cqw] w-[35.25%] bg-white" />
          </div>

          <div
            className="robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[2.25cqw] leading-[1.15] uppercase will-change-transform"
            style={frameStyle({
<<<<<<< HEAD
              x: 118.429,
              y: 315.64,
              width: 80.721,
              height: 30,
=======
              x: 70,
              y: 391,
              width: 132,
              height: 42,
>>>>>>> 7585afc (Updates matching new ui design)
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          >
            <p className="m-0 whitespace-nowrap text-white">PRIZES WORTH INR</p>
            <p className="m-0 text-[#eb9a58]">8 LAKH</p>
          </div>
          <div
            className="robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[2.25cqw] leading-[1.38] uppercase text-white will-change-transform"
            style={frameStyle({
<<<<<<< HEAD
              x: 218.55,
              y: 315.64,
              width: 145.453,
              height: 30,
=======
              x: 221,
              y: 391,
              width: 152,
              height: 42,
>>>>>>> 7585afc (Updates matching new ui design)
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
              x: 210,
              y: 395,
              width: 1,
              height: 32,
              frameWidth: MOBILE_FRAME_WIDTH,
              frameHeight: MOBILE_FRAME_HEIGHT,
            })}
          />

          <Art
<<<<<<< HEAD
            src="mobile-badge.svg"
            alt=""
            x={171}
            y={0}
            width={87.593}
            height={16}
=======
            src="tathva-white-logo.png"
            alt=""
            x={16}
            y={18}
            width={44}
            height={36.5}
>>>>>>> 7585afc (Updates matching new ui design)
            frameWidth={MOBILE_FRAME_WIDTH}
            frameHeight={MOBILE_FRAME_HEIGHT}
            priority
            className="robowars-motion robowars-badge pointer-events-none will-change-transform"
          />
<<<<<<< HEAD
          <p
            className="robowars-motion robowars-badge pointer-events-none absolute m-0 font-instrument-serif text-[2.378cqw] leading-none text-[#ffdfc4] will-change-transform"
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
=======
>>>>>>> 7585afc (Updates matching new ui design)
        </div>
      </div>
    </section>
  );
}

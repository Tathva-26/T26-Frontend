"use client";

import Image from "next/image";

const ASSET_ROOT = "/images/Robowars";
const FRAME_WIDTH = 1413;
const FRAME_HEIGHT = 697;

function frameStyle({ x, y, width, height }) {
  return {
    left: `${(x / FRAME_WIDTH) * 100}%`,
    top: `${(y / FRAME_HEIGHT) * 100}%`,
    width: `${(width / FRAME_WIDTH) * 100}%`,
    height: `${(height / FRAME_HEIGHT) * 100}%`,
  };
}

function Art({ src, alt = "", x, y, width, height, priority = false, className = "" }) {
  return (
    <Image
      src={`${ASSET_ROOT}/${src}`}
      alt={alt}
      width={Math.ceil(width)}
      height={Math.ceil(height)}
      priority={priority}
      draggable={false}
      className={`absolute select-none ${className}`}
      style={frameStyle({ x, y, width, height })}
    />
  );
}

export default function RobowarsHero() {
  return (
    <section
      aria-labelledby="robowars-title"
      className="relative h-screen min-h-[520px] w-full overflow-hidden bg-black text-white"
    >
      <h1 id="robowars-title" className="sr-only">
        Robo Wars Fight On
      </h1>

      <div className="absolute left-1/2 top-1/2 aspect-[1413/697] w-[max(100vw,calc(100vh*1413/697))] -translate-x-1/2 -translate-y-1/2">
        <Image
          src={`${ASSET_ROOT}/raw-4.png`}
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
          className="pointer-events-none"
        />
        <Art
          src="robot-right.svg"
          alt=""
          x={535}
          y={0}
          width={888}
          height={796.016}
          priority
          className="pointer-events-none"
        />

        <Art
          src="title-robo-fight.svg"
          alt="Robo Fight"
          x={409.8}
          y={219.35}
          width={285}
          height={149}
          priority
          className="pointer-events-none"
        />
        <Art
          src="title-wars-on.svg"
          alt="Wars On"
          x={725}
          y={222.35}
          width={249}
          height={149}
          priority
          className="pointer-events-none"
        />

        <Art
          src="date-divider-full.svg"
          alt="Oct 9,10"
          x={464}
          y={405}
          width={470}
          height={34}
          priority
          className="pointer-events-none"
        />
        <Art
          src="text-prizes.svg"
          alt="Prizes worth INR 8 lakh"
          x={466.3}
          y={488.35}
          width={204}
          height={52}
          priority
          className="pointer-events-none"
        />
        <Art
          src="text-arena.svg"
          alt="16 by 16 ft. arena, 8kg and 15kg"
          x={724.1}
          y={487.75}
          width={182}
          height={54}
          priority
          className="pointer-events-none"
        />

        <Art
          src="badge-pill.svg"
          alt=""
          x={626}
          y={0}
          width={161.5}
          height={29.5}
          priority
          className="pointer-events-none"
        />
        <Art
          src="badge-robowars-text.svg"
          alt="Robowars"
          x={680.34}
          y={7.63}
          width={60}
          height={14}
          priority
          className="pointer-events-none"
        />
      </div>
    </section>
  );
}

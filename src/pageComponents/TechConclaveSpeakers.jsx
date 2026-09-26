import Image from "next/image";

/**
 * TechConclaveSpeakers
 * ---------------------
 * Solid-colour div tiles with top-right corner rounded.
 * High-resolution speaker photos overlay the tile, covering bottom and sides seamlessly with zero padding.
 */

const defaultLeftSpeakers = [
  { src: "/images/techconclave/Woman.png", alt: "Speaker 1", color: "#3DDC5B", width: 544, height: 584 },
  { src: "/images/techconclave/Woman.png", alt: "Speaker 2", color: "#F4D93E", width: 544, height: 584 },
  { src: "/images/techconclave/Woman.png", alt: "Speaker 3", color: "#3B5BFF", width: 544, height: 584 },
];

const defaultRightSpeakers = [
  { src: "/images/techconclave/Man.png", alt: "Speaker 4", color: "#E85FD0", width: 540, height: 668 },
  { src: "/images/techconclave/Man.png", alt: "Speaker 5", color: "#E5473A", width: 540, height: 668 },
  { src: "/images/techconclave/Man.png", alt: "Speaker 6", color: "#8B3FE8", width: 540, height: 668 },
];

function SpeakerTile({ src, alt, color, width, height }) {
  return (
    <div
      className="relative h-[9cqw] w-[9cqw] rounded-tr-[2.2cqw]"
      style={{ backgroundColor: color }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={95}
        className="absolute -bottom-[2px] -left-[1px] w-[calc(100%+2px)] h-auto block m-0 p-0 pointer-events-none"
      />
    </div>
  );
}

export default function TechConclaveSpeakers({
  leftSpeakers = defaultLeftSpeakers,
  rightSpeakers = defaultRightSpeakers,
}) {
  return (
    <div className="flex items-start gap-[2.5cqw]">
      <div className="flex flex-col gap-[2cqw]">
        {leftSpeakers.map((s, i) => (
          <SpeakerTile key={i} {...s} />
        ))}
      </div>
      <div className="flex flex-col gap-[2cqw]">
        {rightSpeakers.map((s, i) => (
          <SpeakerTile key={i} {...s} />
        ))}
      </div>
    </div>
  );
}
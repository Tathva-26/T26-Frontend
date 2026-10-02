"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { proshowArtists } from "@/lib/proshowArtists";
import useHoldToPlay from "@/hooks/useHoldToPlay";
import { haptics } from "@/lib/haptics";
import Navbar from "@/pageComponents/Navbar/Navbar";
import TathvaMenu from "@/components/TathvaMenu/TathvaMenu";

const HOLD_MS = 1100;
const RING_COUNT = 7;
const SENS = 0.5;
const SPRING_MS = 75;
const IDLE_MS = 4250;

const carouselStyles = `
/* ---------- animations ---------- */
@keyframes ringPulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes eq {
  0%, 100% { transform: scaleY(0.25); }
  50% { transform: scaleY(1); }
}
@keyframes hintPulse {
  0%, 100% { opacity: 0.65; }
  50% { opacity: 1; }
}
@keyframes keyPress {
  0%, 16%, 100% { transform: translateY(0); box-shadow: 0 2px 0 0 rgba(255, 255, 255, 0.35); }
  8% { transform: translateY(2px); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35); }
}

.proshow-carousel .ringPulse { animation: ringPulse 9s ease-in-out infinite; will-change: opacity; }
.proshow-carousel .twinkle { animation: twinkle 6s ease-in-out infinite; will-change: opacity; }
.proshow-carousel .twinkleSlow { animation: twinkle 9s ease-in-out infinite; will-change: opacity; }
.proshow-carousel .fadeUp { animation: fadeUp 1.1s ease both; }
.proshow-carousel .eq { animation: eq 0.9s ease-in-out infinite; }
.proshow-carousel .hintPulse { animation: hintPulse 2.4s ease-in-out infinite; }
.proshow-carousel .keyPress { animation: keyPress 2.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .proshow-carousel .ringPulse, 
  .proshow-carousel .twinkle, 
  .proshow-carousel .twinkleSlow, 
  .proshow-carousel .fadeUp, 
  .proshow-carousel .eq, 
  .proshow-carousel .hintPulse, 
  .proshow-carousel .keyPress {
    animation: none;
  }
}

/* Perf: freeze ambient loops while the carousel is moving so the main/
   compositor budget goes to the drag itself. */
.proshow-carousel.moving .smokeLayer,
.proshow-carousel.moving .aura,
.proshow-carousel.moving .dustInner,
.proshow-carousel.moving .ringPulse,
.proshow-carousel.moving .twinkle,
.proshow-carousel.moving .twinkleSlow,
.proshow-carousel.moving .eq {
  animation-play-state: paused;
}

/* Perf: low-spec devices get static ambience and no blur/filter effects. */
.proshow-carousel[data-lite] .smokeLayer,
.proshow-carousel[data-lite] .aura,
.proshow-carousel[data-lite] .ringPulse,
.proshow-carousel[data-lite] .twinkle,
.proshow-carousel[data-lite] .twinkleSlow {
  animation: none;
  will-change: auto;
}
.proshow-carousel[data-lite] .dust,
.proshow-carousel[data-lite] .litField { display: none; }
.proshow-carousel[data-lite] .backdrop-blur-\[10px\] { backdrop-filter: none; background: rgba(20, 16, 34, 0.85); }
.proshow-carousel[data-lite] .drop-shadow-\[0_0_3px_\#a78bfa\] { filter: none; }

/* Standout stars with cross-rays */
.proshow-carousel .sparkle {
  background-image:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.45) 9%, transparent 26%),
    linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%);
  background-size: 100% 100%, 100% 1px, 1px 100%;
  background-position: center;
  background-repeat: no-repeat;
  will-change: transform, opacity;
}

/* Item layout: transform/opacity used to be solved every frame via a nested
   calc()/clamp()/min() chain driven by CSS custom properties (--a, --sgn,
   --m1..--m3). Resolving that cascade for every visible item on every
   animation frame is real CPU work, especially on weaker machines -- it's
   one of the main remaining causes of drag lag. The math now runs once in
  JS per item per frame (applyPos) and is written straight to transform/
  opacity as plain values, which the browser can apply directly without
   re-solving a formula. Only the lightweight darkening overlay below still
   reads a CSS variable, and it's a single multiplication, not a chain.
   --m1 defaults to 0 so items render correctly before the first JS write. */
.proshow-carousel .item {
  --m1: 0;
}

.proshow-carousel .item::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: black;
  opacity: calc(0.5 * var(--m1));
  pointer-events: none;
}

/* ---------- celestial smoke + beam ---------- */
@keyframes driftFar {
  from { transform: translate3d(-2%, 1%, 0) rotate(-1deg) scale(1.06); }
  to   { transform: translate3d(2.2%, -1.2%, 0) rotate(1.2deg) scale(1.12); }
}
@keyframes driftNear {
  from { transform: scaleX(-1) translate3d(2.5%, -1%, 0) rotate(1deg) scale(1.1); }
  to   { transform: scaleX(-1) translate3d(-2.5%, 1.4%, 0) rotate(-1.2deg) scale(1.04); }
}
@keyframes auraBreathe {
  0%, 100% { opacity: 0.78; transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1.04); }
}
@keyframes dustDrift {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(0, -50%, 0); }
}

.proshow-carousel .smokeLayer {
  position: absolute;
  inset: -8%;
  -webkit-mask-size: cover;
  mask-size: cover;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  will-change: transform;
}
.proshow-carousel .smokeFar {
  -webkit-mask-image: url("/images/proshow/celestial-smoke-a.png");
  mask-image: url("/images/proshow/celestial-smoke-a.png");
  animation: driftFar 140s ease-in-out infinite alternate;
}
.proshow-carousel .smokeNear {
  -webkit-mask-image: url("/images/proshow/celestial-smoke-b.png");
  mask-image: url("/images/proshow/celestial-smoke-b.png");
  animation: driftNear 100s ease-in-out infinite alternate;
}
.proshow-carousel .darkFar  { background: rgb(80, 72, 188);  opacity: 0.38; }
.proshow-carousel .darkNear { background: rgb(118, 88, 214); opacity: 0.24; }
.proshow-carousel .litFar   { background: rgb(132, 160, 255); opacity: 0.62; }
.proshow-carousel .litNear  { background: rgb(196, 208, 255); opacity: 0.5;  }

.proshow-carousel .litField {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: calc(0.4 + 0.6 * var(--lock, 1));
  -webkit-mask-image: radial-gradient(
    ellipse calc(var(--c, 260px) * 0.85) calc(var(--beam-cy, 45dvh) * 1.05)
      at 50% calc(var(--beam-cy, 45dvh) * 0.62),
    #000 0%, rgba(0, 0, 0, 0.7) 35%, transparent 100%
  );
  mask-image: radial-gradient(
    ellipse calc(var(--c, 260px) * 0.85) calc(var(--beam-cy, 45dvh) * 1.05)
      at 50% calc(var(--beam-cy, 45dvh) * 0.62),
    #000 0%, rgba(0, 0, 0, 0.7) 35%, transparent 100%
  );
}

.proshow-carousel .auraLock {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  /* --lock lives here now (plain opacity = compositor-only, no repaint) */
  opacity: var(--lock, 1);
}

.proshow-carousel .aura {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 150%;
  height: 150%;
  transform: translate3d(-50%, -50%, 0);
  border-radius: 50%;
  pointer-events: none;
  background:
    radial-gradient(ellipse 34% 20% at 50% 21%, rgb(214 228 255 / 0.34) 0%, transparent 100%),
    radial-gradient(closest-side, rgb(120 150 255 / 0.30) 0%, rgb(110 90 240 / 0.16) 38%, rgb(70 50 190 / 0.06) 62%, transparent 78%);
  animation: auraBreathe 9s ease-in-out infinite;
  will-change: transform, opacity;
}

.proshow-carousel .dust {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}
.proshow-carousel .dustInner {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 200%;
  background-size: 100% 50%;
  background-repeat: repeat-y;
  background-image:
    radial-gradient(5px 5px at 23.1% 44.6%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 31.9% 29.3%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(6px 6px at 38.8% 55.8%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(3px 3px at 35.5% 76.7%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(6px 6px at 63.9% 11.2%, rgba(214, 226, 255, 0.22) 0%, transparent 70%),
    radial-gradient(5px 5px at 38.1% 84.6%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(5px 5px at 65.7% 18.4%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(4px 4px at 7.7% 95.6%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(4px 4px at 92.0% 96.7%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(6px 6px at 7.6% 45.2%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(5px 5px at 60.5% 94.8%, rgba(214, 226, 255, 0.16) 0%, transparent 70%),
    radial-gradient(4px 4px at 16.2% 55.9%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 73.3% 30.4%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(6px 6px at 42.5% 15.7%, rgba(214, 226, 255, 0.22) 0%, transparent 70%),
    radial-gradient(5px 5px at 86.4% 18.2%, rgba(214, 226, 255, 0.22) 0%, transparent 70%),
    radial-gradient(3px 3px at 85.7% 49.5%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 29.0% 14.3%, rgba(214, 226, 255, 0.1) 0%, transparent 70%),
    radial-gradient(3px 3px at 76.3% 23.4%, rgba(214, 226, 255, 0.1) 0%, transparent 70%);
  animation: dustDrift 120s linear infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .proshow-carousel .smokeFar, 
  .proshow-carousel .smokeNear, 
  .proshow-carousel .aura, 
  .proshow-carousel .dustInner {
    animation: none;
  }
}
`;

const N = proshowArtists.length;

// Only items within this radius are ever visible (the CSS opacity formula
// already goes to 0 past a=3), so nothing further out needs to be mounted,
// styled, or held as a GPU-composited layer.
const VISIBLE_RADIUS = Math.min(3, Math.floor((N - 1) / 2));

const SPARKLES = [
  { x: 70.7, y: 15.5, size: 30, rot: 84, o: 0.6 },
  { x: 4.8, y: 59.1, size: 21, rot: 72, o: 0.55 },
  { x: 20, y: 78, size: 32, rot: 58, o: 0.45 },
  { x: 88.2, y: 35.2, size: 23, rot: 47, o: 0.5 },
  { x: 10.1, y: 42.9, size: 27, rot: 40, o: 0.6 },
  { x: 92, y: 72, size: 20, rot: 0, o: 0.45 },
  { x: 15.1, y: 30.2, size: 28, rot: 31, o: 0.5 },
  { x: 80, y: 88, size: 30, rot: 22, o: 0.55 },
  { x: 34.2, y: 16.1, size: 20, rot: 14, o: 0.6 },
];

const MINI_SPARKLES = [
  { x: 9.9, y: 97.7, size: 14, rot: 31, o: 0.68 },
  { x: 22.4, y: 9.2, size: 15, rot: 63, o: 0.5 },
  { x: 30, y: 90, size: 11, rot: 12, o: 0.41 },
  { x: 52, y: 3, size: 16, rot: 40, o: 0.47 },
  { x: 27, y: 3.5, size: 13, rot: 36, o: 0.48 },
  { x: 59.1, y: 95, size: 16, rot: 29, o: 0.62 },
  { x: 78, y: 6, size: 11, rot: 70, o: 0.69 },
  { x: 2.7, y: 44.3, size: 12, rot: 24, o: 0.52 },
  { x: 26, y: 64, size: 16, rot: 37, o: 0.48 },
  { x: 4.3, y: 74.8, size: 13, rot: 25, o: 0.67 },
  { x: 62.8, y: 4.3, size: 14, rot: 73, o: 0.65 },
  { x: 40.4, y: 6.6, size: 16, rot: 6, o: 0.56 },
  { x: 9.9, y: 15.5, size: 9, rot: 7, o: 0.6 },
  { x: 1.6, y: 70.8, size: 11, rot: 62, o: 0.6 },
  { x: 11.4, y: 84, size: 15, rot: 17, o: 0.45 },
  { x: 84, y: 18.4, size: 9, rot: 68, o: 0.41 },
];

function offsetOf(i, active) {
  let d = (((i - active) % N) + N) % N;
  if (d > N / 2) d -= N;
  return d;
}

// Canvas-backed static starfield avoids re-rasterizing 100+ CSS radial gradients
const CanvasStarfield = memo(function CanvasStarfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Fixed pseudo-random seed points for predictable rendering
      let seed = 42;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < 180; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = rnd() * 1.2 + 0.4;
        const alpha = rnd() * 0.7 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.fill();
      }
    };

    draw();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
    />
  );
});

const BackgroundLayers = memo(function BackgroundLayers() {
  const allSparkles = useMemo(() => [...SPARKLES, ...MINI_SPARKLES], []);

  return (
    <>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="twinkle absolute inset-0">
          <CanvasStarfield />
        </div>
        {allSparkles.map((s, i) => (
          <span
            key={i}
            className="sparkle absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.o,
              transform: `translate3d(-50%, -50%, 0) rotate(${s.rot}deg)`,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="smokeLayer smokeFar darkFar" />
        <div className="smokeLayer smokeNear darkNear" />
        <div className="litField">
          <div className="smokeLayer smokeFar litFar" />
          <div className="smokeLayer smokeNear litNear" />
        </div>
      </div>
    </>
  );
});

const AmbientRings = memo(function AmbientRings() {
  const ringDelays = useMemo(
    () => Array.from({ length: RING_COUNT }, (_, i) => `${i * -1.2}s`),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {ringDelays.map((delay, i) => (
        <span
          key={i}
          className="ringPulse absolute top-1/2 left-1/2 aspect-square w-[calc(var(--c)*(1+var(--k)*0.62))] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(190,170,255,0.09)]"
          style={{ "--k": i + 1, animationDelay: delay }}
        />
      ))}
    </div>
  );
});

const AmbientDust = memo(function AmbientDust() {
  return (
    <div className="dust" aria-hidden="true">
      <div className="dustInner" />
    </div>
  );
});

const HeaderBadges = memo(function HeaderBadges() {
  return (
    <>
      <span className="absolute top-[clamp(70px,3dvh,30px)] left-[clamp(16px,2.4vw,32px)] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        TATHVA ‘26
      </span>
      <span className="absolute top-[clamp(70px,3dvh,30px)] right-[clamp(8px,2.4vw,32px)] -mr-[0.45em] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        PRO-SHOW
      </span>
    </>
  );
});

const PlayHint = memo(function PlayHint({ coarse }) {
  return (
    <div
      className="hintPulse mt-[clamp(10px,2dvh,22px)] flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-5 py-1.5 text-white/85 shadow-[0_0_18px_-4px_rgba(201,182,255,0.5)]"
      role="note"
      aria-label={coarse ? "Hold the artist to play" : "Hold space bar to play"}
    >
      {coarse && (
        <svg
          className="keyPress size-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M4 21c1.6-3.4 4.6-5 8-5s6.4 1.6 8 5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="text-[clamp(11px,1.2vw,16px)] tracking-[0.04em]" aria-hidden="true">
        {coarse ? "HOLD THE ARTIST TO PLAY" : "HOLD SPACE BAR TO PLAY"}
      </span>
    </div>
  );
});

const CarouselItem = memo(function CarouselItem({
  artist,
  index,
  isCenter,
  isFar,
  onPointerDown,
  onItemClick,
  setRef,
}) {
  const handlePointerDown = useCallback(
    (e) => onPointerDown(e, isCenter, index),
    [onPointerDown, isCenter, index]
  );

  const handleClick = useCallback(
    (e) => onItemClick(e, isCenter, index),
    [onItemClick, isCenter, index]
  );

  const handleKeyDown = useCallback((e) => {
    if (e.code === "Space") e.preventDefault();
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleRef = useCallback(
    (el) => setRef(el, index),
    [setRef, index]
  );

  return (
    <button
      type="button"
      tabIndex={isCenter ? 0 : -1}
      className="item absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-full border-0 bg-[#120b22] p-0 outline-none [-webkit-tap-highlight-color:transparent] active:cursor-grabbing"
      style={{ willChange: isFar ? "auto" : "transform, opacity" }}
      ref={handleRef}
      aria-label={isCenter ? `${artist.name}, hold to play` : `Show ${artist.name}`}
      aria-current={isCenter}
      aria-hidden={isFar}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
    >
      <img
        className="pointer-events-none block size-full object-cover"
        src={artist.image}
        alt=""
        draggable={false}
        // Only the centered artist needs to decode/paint immediately; every
        // neighboring image can be deferred so it doesn't compete for the
        // main thread or network during a drag/swipe.
        loading={isCenter ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={isCenter ? "high" : "low"}
      />
    </button>
  );
});

const EQ_DELAYS = [0, -0.3, -0.6];

const NowPlayingWidget = memo(function NowPlayingWidget({ artist, playing }) {
  return (
    <div
      className={`pointer-events-none absolute right-[clamp(12px,2.4vw,32px)] bottom-[clamp(12px,3dvh,32px)] z-7 flex items-center gap-3 rounded-full bg-white/[0.07] py-2 pr-[18px] pl-2 backdrop-blur-[10px] transition-[opacity,translate] duration-400 max-sm:right-1/2 max-sm:bottom-3.5 max-sm:translate-x-1/2 ${
        playing ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <img
        src={artist.image}
        alt=""
        className="size-11 rounded-full object-cover"
        draggable={false}
        loading="lazy"
        decoding="async"
      />
      <div className="flex flex-col leading-[1.15]">
        <span className="text-[8px] tracking-[0.08em] text-[#ddd]">
          NOW PLAYING
        </span>
        <span className="text-base font-bold">{artist.track.title}</span>
        <span className="text-[9px] text-[#ccc]">{artist.track.artist}</span>
      </div>
      <span className="ml-1 inline-flex h-3.5 items-end gap-0.5" aria-hidden="true">
        {EQ_DELAYS.map((delay) => (
          <i
            key={delay}
            className="eq h-full w-[3px] origin-bottom rounded-xs bg-[#c9b6ff]"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </span>
    </div>
  );
});

function ProshowCarousel() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const pageRef = useRef(null);
  const orbitRef = useRef(null);
  const itemRefs = useRef([]);
  const playingRef = useRef(false);
  const activeRef = useRef(0);
  const posRef = useRef(0);
  const tweenRef = useRef(0);
  const goalRef = useRef(0);
  const followingRef = useRef(false);
  const velRef = useRef(0);
  const gesture = useRef({ down: false, moved: false });
  const stepPxRef = useRef(240); // Cached dimensions eliminate forced layout reflows
  // Responsive layout numbers (orbit radius in px, and the --x1/--x2/--x3/
  // --o1/--o2 curve constants) read once per resize instead of being solved
  // by CSS calc() on every animation frame. Defaults match the desktop
  // values so the first paint (before the initial measure) still looks right.
  const metricsRef = useRef({ c: 300, x1: 0.8, x2: 1.32, x3: 1.7, o1: 0.6, o2: 0.4 });

  const artist = useMemo(() => proshowArtists[active], [active]);
  const movingTimerRef = useRef(0);
  const movingRef = useRef(false);

  useLayoutEffect(() => {
    const cores = navigator.hardwareConcurrency || 8;
    const mem = navigator.deviceMemory || 8;
    if (cores <= 4 || mem <= 4) pageRef.current?.setAttribute("data-lite", "");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audio.preload = "none";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  const startTrack = useCallback((index) => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = proshowArtists[index].track.src;
    if (!audio.src.endsWith(src)) audio.src = src;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => {
        playingRef.current = true;
        setPlaying(true);
      })
      .catch(() => {
        playingRef.current = false;
        setPlaying(false);
      });
  }, []);

  const stopTrack = useCallback(() => {
    audioRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const lastLockRef = useRef(1);

  const applyPos = useCallback(
    (p) => {
      posRef.current = p;
      if (!movingRef.current) {
        movingRef.current = true;
        pageRef.current?.classList.add("moving");
      }
      clearTimeout(movingTimerRef.current);
      movingTimerRef.current = setTimeout(() => {
        movingRef.current = false;
        pageRef.current?.classList.remove("moving");
      }, 120);
      const off = Math.min(1, Math.abs(p - Math.round(p)) * 2.2);
      const lock = 1 - off * off * (3 - 2 * off);
      // --lock now only drives plain `opacity` (see .auraLock), so this is
      // compositor-only — but still skip the DOM write when it wouldn't
      // produce a visible difference, to cut needless style work during
      // fast drags.
      if (Math.abs(lock - lastLockRef.current) > 0.008) {
        lastLockRef.current = lock;
        pageRef.current?.style.setProperty("--lock", lock.toFixed(3));
      }
      // Only items within VISIBLE_RADIUS(+1 buffer) are ever mounted, so this
      // loop is now bounded (≈7 elements) instead of scanning every artist.
      // The transform/opacity math (previously a nested calc()/clamp()/min()
      // chain the browser had to re-solve for every element every frame) is
      // now plain JS, written straight to `transform`/`opacity` as numbers --
      // far cheaper for the browser to apply, which matters most exactly
      // when it's most visible: during drag.
      const { c, x1, x2, x3, o1, o2 } = metricsRef.current;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        let d = (((i - p) % N) + N) % N;
        if (d > N / 2) d -= N;
        const a = Math.abs(d);
        const sgn = d < 0 ? -1 : 1;
        const m1 = Math.min(a, 1);
        const m2 = Math.min(Math.max(a - 1, 0), 1);
        const m3 = Math.min(Math.max(a - 2, 0), 1);
        const tx = c * sgn * (x1 * m1 + (x2 - x1) * m2 + (x3 - x2) * m3);
        const scale = 1 - 0.32 * m1 - 0.18 * m2 - 0.2 * m3;
        const opacity = 1 - (1 - o1) * m1 - (o1 - o2) * m2 - o2 * m3;
        el.style.transform = `translate3d(${tx.toFixed(2)}px,0,0) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        const m1s = m1.toFixed(2);
        if (el.dataset.m !== m1s) {
          el.dataset.m = m1s;
          el.style.setProperty("--m1", m1s);
        }
        // Only the darkening overlay (::after) still needs a CSS variable,
        // and it's a single multiplication rather than a dependent chain.
        // zIndex and pointerEvents changes can invalidate style/paint even
        // when the written value is identical to the current one, so guard
        // them explicitly instead of writing on every frame.
        const z = String(Math.round(10 - a * 2));
        if (el.dataset.z !== z) {
          el.dataset.z = z;
          el.style.zIndex = z;
        }
        const pe = a > 2.5 ? "none" : "";
        if (el.dataset.pe !== pe) {
          el.dataset.pe = pe;
          el.style.pointerEvents = pe;
        }
      });
      const idx = ((Math.round(p) % N) + N) % N;
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
        if (playingRef.current) stopTrack();
      }
    },
    [stopTrack]
  );

  useLayoutEffect(() => {
    const page = pageRef.current;
    const orbit = orbitRef.current;
    if (!page || !orbit) return;
    const measure = () => {
      const p = page.getBoundingClientRect();
      const o = orbit.getBoundingClientRect();
      stepPxRef.current = o.width * 0.8 || 240;
      page.style.setProperty("--beam-cy", `${Math.round(o.top - p.top + o.height / 2)}px`);
      // Read the responsive --c/--x1/--x2/--x3/--o1/--o2 values (they change
      // across the max-lg/max-sm breakpoints) once here, so applyPos never
      // needs CSS to resolve them per frame -- it just reads plain numbers.
      const cs = getComputedStyle(page);
      const num = (name, fallback) => {
        const v = parseFloat(cs.getPropertyValue(name));
        return Number.isFinite(v) ? v : fallback;
      };
      const prev = metricsRef.current;
      metricsRef.current = {
        c: num("--c", prev.c),
        x1: num("--x1", prev.x1),
        x2: num("--x2", prev.x2),
        x3: num("--x3", prev.x3),
        o1: num("--o1", prev.o1),
        o2: num("--o2", prev.o2),
      };
      applyPos(posRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(page);
    ro.observe(orbit.parentElement);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [applyPos]);

  const stopTween = useCallback(() => {
    cancelAnimationFrame(tweenRef.current);
    tweenRef.current = 0;
    followingRef.current = false;
  }, []);

  const animateTo = useCallback(
    (target, fast = false) => {
      stopTween();
      goalRef.current = target;
      const from = posRef.current;
      if (from === target) return;
      const dur = fast ? 300 : Math.min(450 + Math.abs(target - from) * 100, 800);
      let t0;
      const tick = (now) => {
        t0 ??= now;
        const k = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - k, 3);
        applyPos(from + (target - from) * e);
        if (k < 1) tweenRef.current = requestAnimationFrame(tick);
        else tweenRef.current = 0;
      };
      tweenRef.current = requestAnimationFrame(tick);
    },
    [applyPos, stopTween]
  );

  const followTo = useCallback(
    (goal) => {
      goalRef.current = goal;
      if (followingRef.current) return;
      stopTween();
      followingRef.current = true;
      velRef.current = 0;
      let last = performance.now();
      const w = 1 / SPRING_MS;
      const tick = (now) => {
        const dt = Math.min(now - last, 40);
        last = now;
        const x = posRef.current - goalRef.current;
        const v = velRef.current;
        const acc = -w * w * x - 2 * w * v;
        const nv = v + acc * dt;
        const nx = x + nv * dt;
        velRef.current = nv;
        const done = Math.abs(nx) < 0.001 && Math.abs(nv) < 0.0002;
        applyPos(done ? goalRef.current : goalRef.current + nx);
        if (done) stopTween();
        else tweenRef.current = requestAnimationFrame(tick);
      };
      tweenRef.current = requestAnimationFrame(tick);
    },
    [applyPos, stopTween]
  );

  const step = useCallback((dir) => animateTo(Math.round(goalRef.current) + dir), [animateTo]);

  const goTo = useCallback(
    (index) => {
      animateTo(Math.round(posRef.current) + offsetOf(index, activeRef.current));
    },
    [animateTo]
  );

  const idleTimerRef = useRef(0);
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(function tick() {
      if (!gesture.current.down && !playingRef.current) step(1);
      idleTimerRef.current = setTimeout(tick, IDLE_MS);
    }, IDLE_MS);
  }, [step]);

  useEffect(() => {
    resetIdle();
    window.addEventListener("pointerdown", resetIdle, { passive: true });
    window.addEventListener("wheel", resetIdle, { passive: true });
    window.addEventListener("keydown", resetIdle, { passive: true });
    return () => {
      clearTimeout(idleTimerRef.current);
      window.removeEventListener("pointerdown", resetIdle);
      window.removeEventListener("wheel", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [resetIdle]);

  const stopAndAdvance = useCallback(() => {
    stopTrack();
    step(1);
    resetIdle();
  }, [stopTrack, step, resetIdle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener("ended", stopAndAdvance);
    return () => audio.removeEventListener("ended", stopAndAdvance);
  }, [stopAndAdvance]);

  const onProgress = useCallback((p) => {
    progressRef.current?.style.setProperty("stroke-dashoffset", String(1 - p));
  }, []);

  const onComplete = useCallback(() => {
    startTrack(activeRef.current);
  }, [startTrack]);

  const didMountRef = useRef(false);
  const { holding, start, cancel } = useHoldToPlay({
    duration: HOLD_MS,
    onProgress,
    onComplete,
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "ArrowRight") step(1);
      else if (e.code === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  useEffect(() => {
    cancel();
    if (didMountRef.current) haptics.tick();
    didMountRef.current = true;
  }, [active, cancel]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    let settle = 0;
    let dir = 0;
    const onWheel = (e) => {
      // Require deltaX to clearly dominate (not just edge it out) before
      // hijacking the wheel event for carousel rotation — a mostly-vertical
      // trackpad scroll naturally carries some horizontal jitter, and with a
      // tie-breaking threshold that jitter was intermittently swallowing
      // page-scroll wheel ticks, making scrolling past this section feel like
      // it randomly stalls.
      if (Math.abs(e.deltaX) < 4 || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 2) return;
      e.preventDefault();
      cancel();
      dir = Math.sign(e.deltaX);
      if (!followingRef.current) goalRef.current = posRef.current;
      followTo(goalRef.current + (e.deltaX / stepPxRef.current) * SENS);
      clearTimeout(settle);
      settle = setTimeout(() => {
        const p = goalRef.current;
        const target = dir > 0 ? Math.floor(p + 0.75) : Math.ceil(p - 0.75);
        followTo(target);
      }, 40);
    };
    page.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      page.removeEventListener("wheel", onWheel);
      clearTimeout(settle);
    };
  }, [followTo, cancel]);

  useEffect(() => () => {
    stopTween();
    clearTimeout(movingTimerRef.current);
  }, [stopTween]);

  const onPointerDown = useCallback(
    (e, isCenter, index) => {
      if (!e.isPrimary || gesture.current.down) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      stopTween();
      goalRef.current = posRef.current;
      gesture.current = {
        index,
        x: e.clientX,
        y: e.clientY,
        startPos: posRef.current,
        vx: 0,
        lastX: e.clientX,
        lastT: e.timeStamp,
        moved: false,
        down: true,
      };
      if (isCenter) start();
    },
    [start, stopTween]
  );

  const onItemClick = useCallback(
    (e, isCenter, index) => {
      if (!isCenter && e.detail === 0) goTo(index);
    },
    [goTo]
  );

  const setItemRef = useCallback((el, i) => {
    itemRefs.current[i] = el;
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      const g = gesture.current;
      if (!g.down) return;
      const dx = e.clientX - g.x;
      if (!g.moved && Math.abs(dx) < 8 && Math.abs(e.clientY - g.y) < 8) return;
      if (!g.moved) {
        cancel();
        if (e.pointerType === "touch") haptics.tick();
      }
      g.moved = true;
      const now = e.timeStamp;
      if (now > g.lastT) {
        g.vx = 0.7 * g.vx + 0.3 * ((e.clientX - g.lastX) / (now - g.lastT));
      }
      g.lastX = e.clientX;
      g.lastT = now;
      followTo(g.startPos - (dx / stepPxRef.current) * SENS);
    },
    [cancel, followTo]
  );

  const onPointerUp = useCallback(() => {
    const g = gesture.current;
    if (!g.down) return;
    g.down = false;
    cancel();
    if (!g.moved) {
      if (g.index !== undefined && g.index !== activeRef.current) {
        haptics.select();
        goTo(g.index);
      }
      return;
    }
    followTo(Math.round(goalRef.current - ((g.vx * 160) / stepPxRef.current) * SENS));
  }, [cancel, followTo, goTo]);

  // Windowed rendering: the CSS opacity formula already zeroes out anything
  // past VISIBLE_RADIUS steps from center, so items outside that window are
  // invisible anyway. Not mounting them means far fewer DOM nodes, images,
  // and always-on `will-change` compositor layers to maintain — this is the
  // main fix for the reported lag on lists with many artists.
  const carouselItems = useMemo(() => {
    const items = [];
    const seen = new Set();
    for (let o = -VISIBLE_RADIUS; o <= VISIBLE_RADIUS; o++) {
      const i = ((active + o) % N + N) % N;
      if (seen.has(i)) continue; // guard against wraparound dupes when N is small
      seen.add(i);
      const a = proshowArtists[i];
      items.push(
        <CarouselItem
          key={a.id}
          artist={a}
          index={i}
          isCenter={o === 0}
          isFar={Math.abs(o) > 2}
          onPointerDown={onPointerDown}
          onItemClick={onItemClick}
          setRef={setItemRef}
        />
      );
    }
    return items;
  }, [active, onPointerDown, onItemClick, setItemRef]);

  return (
    <main
      ref={pageRef}
      className="proshow-carousel relative grid h-dvh w-full touch-pan-y select-none grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] items-center justify-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#100e18_0%,#0a0912_55%,#050408_100%)] px-4 pt-[clamp(14px,3dvh,32px)] pb-[clamp(28px,7dvh,64px)] text-white [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [--c:clamp(180px,min(38dvh,36vw),470px)] [--o1:0.6] [--o2:0.4] [--x1:0.8] [--x2:1.32] [--x3:1.7] max-lg:[--c:clamp(170px,min(40dvh,52vw),420px)] max-lg:[--x1:0.84] max-lg:[--x2:1.38] max-sm:pb-[92px] max-sm:[--c:min(58vw,40dvh)] max-sm:[--o1:0.78] max-sm:[--o2:0] max-sm:[--x1:0.65] max-sm:[--x2:1.4]"
    >
     <div className="hidden lg:block">
  <Navbar />
</div>
      <TathvaMenu/>
      <style>{carouselStyles}</style>
      <BackgroundLayers />
      <HeaderBadges />

      <h1
        key={artist.id}
        className="fadeUp z-2 mt-[clamp(22px,4dvh,44px)] text-center font-(family-name:--font-space) text-[clamp(40px,min(9vw,11dvh),104px)] leading-none font-bold tracking-[-0.01em]"
      >
        {artist.name}
      </h1>

      <section
        className="relative z-1 grid h-full min-h-0 w-full touch-pan-y place-items-center py-[clamp(10px,2.5dvh,28px)]"
        aria-roledescription="carousel"
        aria-label="Proshow artists"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="relative h-(--c) w-(--c)" ref={orbitRef}>
          <AmbientRings />
          <div className="auraLock" aria-hidden="true">
            <div className="aura" />
          </div>
          <svg
            className="pointer-events-none absolute -inset-[6.5%] z-6 h-[113%] w-[113%] overflow-visible"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              className="fill-none stroke-white opacity-90 [stroke-width:0.35]"
              cx="50"
              cy="50"
              r="49.4"
            />
            <circle
              ref={progressRef}
              className={`origin-center -rotate-90 fill-none stroke-[#c9b6ff] drop-shadow-[0_0_3px_#a78bfa] [stroke-linecap:round] [stroke-width:1.6] ${
                holding ? "opacity-100" : "opacity-0"
              }`}
              cx="50"
              cy="50"
              r="49.4"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          </svg>

          {carouselItems}
        </div>
      </section>

      <PlayHint coarse={coarse} />

      <p
        key={`d-${artist.id}`}
        className="fadeUp -mr-[0.4em] mt-[clamp(8px,1.6dvh,18px)] text-center font-(family-name:--font-bebas) text-[clamp(20px,3vw,34px)] tracking-[0.4em] uppercase"
      >
        {artist.date}
      </p>
      <p
        key={`p-${artist.id}`}
        className="fadeUp mt-[clamp(8px,1.6dvh,18px)] line-clamp-4 max-w-[min(640px,100%)] overflow-hidden text-justify text-[clamp(12px,1.35vw,17px)] leading-[1.55] text-[#ece8f7] [text-align-last:center] max-sm:line-clamp-3 max-sm:text-center [@media(max-height:520px)]:hidden!"
      >
        {artist.description}
      </p>

      <AmbientDust />
      <NowPlayingWidget artist={artist} playing={playing} />
    </main>
  );
}

export default memo(ProshowCarousel);
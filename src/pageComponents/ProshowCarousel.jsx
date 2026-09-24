"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { proshowArtists } from "@/lib/proshowArtists";
import useHoldToPlay from "@/hooks/useHoldToPlay";

const HOLD_MS = 2200;
const RING_COUNT = 7;
const N = proshowArtists.length;

// Shortest signed distance from the active index, so the list loops forever.
function offsetOf(i, active) {
  let d = (((i - active) % N) + N) % N;
  if (d > N / 2) d -= N;
  return d;
}

export default function ProshowCarousel() {
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
  const posRef = useRef(0); // continuous scroll position, in artist units
  const tweenRef = useRef(0);
  const targetRef = useRef(0);
  const gesture = useRef({ down: false, moved: false });

  const artist = proshowArtists[active];

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Single shared Audio instance for the whole page.
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
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

  // Lay every circle out from the continuous position; CSS interpolates
  // size/opacity/offset from each circle's distance (--a) to the centre.
  const applyPos = useCallback(
    (p) => {
      posRef.current = p;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        let d = (((i - p) % N) + N) % N;
        if (d > N / 2) d -= N;
        const a = Math.abs(d);
        el.style.setProperty("--a", a.toFixed(3));
        el.style.setProperty("--sgn", d < 0 ? "-1" : "1");
        el.style.zIndex = String(Math.round(10 - a * 2));
        el.style.pointerEvents = a > 2.5 ? "none" : "";
      });
      const idx = ((Math.round(p) % N) + N) % N;
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
        // Keep the song in sync with the active artist while playing.
        if (playingRef.current) startTrack(idx);
      }
    },
    [startTrack],
  );

  useLayoutEffect(() => {
    applyPos(posRef.current);
  }, [applyPos]);

  const stopTween = () => cancelAnimationFrame(tweenRef.current);

  const animateTo = useCallback(
    (target, fast = false) => {
      stopTween();
      targetRef.current = target;
      const from = posRef.current;
      if (from === target) return;
      const dur = fast
        ? 220
        : Math.min(300 + Math.abs(target - from) * 120, 800);
      let t0;
      const tick = (now) => {
        t0 ??= now;
        const k = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
        applyPos(from + (target - from) * e);
        if (k < 1) tweenRef.current = requestAnimationFrame(tick);
      };
      tweenRef.current = requestAnimationFrame(tick);
    },
    [applyPos],
  );

  const step = useCallback(
    (dir) => animateTo(Math.round(targetRef.current) + dir),
    [animateTo],
  );

  const goTo = useCallback(
    (index) => {
      animateTo(
        Math.round(posRef.current) + offsetOf(index, activeRef.current),
      );
    },
    [animateTo],
  );

  const onProgress = useCallback((p) => {
    progressRef.current?.style.setProperty("stroke-dashoffset", String(1 - p));
  }, []);

  const onComplete = useCallback(() => {
    if (playingRef.current) stopTrack();
    else startTrack(activeRef.current);
  }, [startTrack, stopTrack]);

  const { holding, start, cancel } = useHoldToPlay({
    duration: HOLD_MS,
    onProgress,
    onComplete,
  });

  // Arrow-key navigation.
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
  }, [active, cancel]);

  const stepPx = () => (orbitRef.current?.offsetWidth || 300) * 0.8;

  // Trackpad / mouse horizontal scrolling. Native listener so it can be
  // non-passive and stop the browser's swipe-back gesture.
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    let settle = 0;
    let dir = 0;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      stopTween();
      cancel();
      dir = Math.sign(e.deltaX);
      applyPos(posRef.current + e.deltaX / stepPx());
      clearTimeout(settle);
      // Once scrolling pauses, commit in the scroll direction after a small
      // nudge (25%) rather than waiting for the halfway point.
      settle = setTimeout(() => {
        const p = posRef.current;
        const target = dir > 0 ? Math.floor(p + 0.75) : Math.ceil(p - 0.75);
        animateTo(target, true);
      }, 60);
    };
    page.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      page.removeEventListener("wheel", onWheel);
      clearTimeout(settle);
    };
  }, [applyPos, animateTo, cancel]);

  useEffect(() => () => stopTween(), []);

  // Pointer: drag scrolls the carousel (touch and mouse), a flick carries on
  // with momentum, press-and-hold on the centre plays.
  const onPointerDown = (e, isCenter, index) => {
    if (!e.isPrimary || gesture.current.down) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    stopTween();
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
  };
  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g.down) return;
    const dx = e.clientX - g.x;
    if (!g.moved && Math.abs(dx) < 8 && Math.abs(e.clientY - g.y) < 8) return;
    if (!g.moved) cancel();
    g.moved = true;
    const now = e.timeStamp;
    if (now > g.lastT)
      g.vx = 0.7 * g.vx + 0.3 * ((e.clientX - g.lastX) / (now - g.lastT));
    g.lastX = e.clientX;
    g.lastT = now;
    applyPos(g.startPos - dx / stepPx());
  };
  const onPointerUp = () => {
    const g = gesture.current;
    if (!g.down) return;
    g.down = false;
    cancel();
    if (!g.moved) {
      // plain tap on a side artist brings it to the centre
      if (g.index !== undefined && g.index !== activeRef.current) goTo(g.index);
      return;
    }
    // project the flick forward a little, then snap to the nearest artist
    animateTo(Math.round(posRef.current - (g.vx * 160) / stepPx()));
  };

  const hint = coarse ? "HOLD THE ARTIST TO PLAY" : "HOLD SPACE BAR TO PLAY";

  return (
    <main
      ref={pageRef}
      className="relative grid h-dvh w-full touch-none select-none grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] items-center justify-items-center overflow-hidden overscroll-none bg-[radial-gradient(ellipse_at_50%_45%,#1d1233_0%,#0f0a1c_55%,#08050f_100%)] px-4 pt-[clamp(14px,3dvh,32px)] pb-[clamp(14px,3dvh,28px)] text-white [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [--c:clamp(180px,min(38dvh,36vw),470px)] [--o1:0.6] [--o2:0.4] [--x1:0.8] [--x2:1.32] [--x3:1.7] max-lg:[--c:clamp(170px,min(40dvh,52vw),420px)] max-lg:[--x1:0.84] max-lg:[--x2:1.38] max-sm:pb-[92px] max-sm:[--c:min(58vw,40dvh)] max-sm:[--o2:0] max-sm:[--x1:0.8] max-sm:[--x2:1.4]"
    >
      <div
        className="bg-stars pointer-events-none absolute inset-0 animate-twinkle motion-reduce:animate-none"
        aria-hidden="true"
      />

      <span className="absolute top-[clamp(14px,3dvh,30px)] left-[clamp(16px,2.4vw,32px)] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        TATHVA ‘26
      </span>
      <span className="absolute top-[clamp(14px,3dvh,30px)] right-[clamp(8px,2.4vw,32px)] -mr-[0.45em] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        PRO-SHOW
      </span>

      <h1
        key={artist.id}
        className="z-2 mt-[clamp(22px,4dvh,44px)] animate-fade-up text-center font-(family-name:--font-space) text-[clamp(40px,min(9vw,11dvh),104px)] leading-none font-bold tracking-[-0.01em] motion-reduce:animate-none"
      >
        {artist.name}
      </h1>

      <section
        className="relative z-1 grid h-full min-h-0 w-full touch-none place-items-center py-[clamp(10px,2.5dvh,28px)]"
        aria-roledescription="carousel"
        aria-label="Proshow artists"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="relative h-(--c) w-(--c)" ref={orbitRef}>
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            {Array.from({ length: RING_COUNT }, (_, i) => (
              <span
                key={i}
                className="absolute top-1/2 left-1/2 aspect-square w-[calc(var(--c)*(1+var(--k)*0.62))] -translate-x-1/2 -translate-y-1/2 animate-ring-pulse rounded-full border border-[rgba(190,170,255,0.09)] motion-reduce:animate-none"
                style={{ "--k": i + 1, animationDelay: `${i * -1.2}s` }}
              />
            ))}
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

          {proshowArtists.map((a, i) => {
            const o = offsetOf(i, active);
            const isCenter = o === 0;
            return (
              <button
                key={a.id}
                type="button"
                tabIndex={isCenter ? 0 : -1}
                className="proshow-item absolute inset-0 cursor-grab touch-none overflow-hidden rounded-full border-0 bg-[#120b22] p-0 outline-none [-webkit-tap-highlight-color:transparent] will-change-[transform,opacity] active:cursor-grabbing"
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                aria-label={
                  isCenter ? `${a.name}, hold to play` : `Show ${a.name}`
                }
                aria-current={isCenter}
                aria-hidden={Math.abs(o) > 2}
                onPointerDown={(e) => onPointerDown(e, isCenter, i)}
                onClick={(e) => {
                  // detail === 0 is a keyboard activation (Enter)
                  if (!isCenter && e.detail === 0) goTo(i);
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") e.preventDefault();
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  className="pointer-events-none block size-full object-cover"
                  src={a.image}
                  alt=""
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </section>

      <p
        key={`d-${artist.id}`}
        className="-mr-[0.4em] animate-fade-up text-center font-(family-name:--font-bebas) text-[clamp(20px,3vw,34px)] tracking-[0.4em] uppercase motion-reduce:animate-none"
      >
        {artist.date}
      </p>
      <p
        key={`p-${artist.id}`}
        className="mt-[clamp(8px,1.6dvh,18px)] line-clamp-4 max-w-[min(640px,100%)] animate-fade-up overflow-hidden text-justify text-[clamp(12px,1.35vw,17px)] leading-[1.55] text-[#ece8f7] [text-align-last:center] motion-reduce:animate-none max-sm:line-clamp-3 max-sm:text-center [@media(max-height:520px)]:hidden!"
      >
        {artist.description}
      </p>
      <p className="mt-[clamp(10px,2dvh,22px)] text-center text-[clamp(11px,1.2vw,16px)] tracking-[0.04em] text-white/40">
        {hint}
      </p>

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
        />
        <div className="flex flex-col leading-[1.15]">
          <span className="text-[8px] tracking-[0.08em] text-[#ddd]">NOW PLAYING</span>
          <span className="text-base font-bold">{artist.track.title}</span>
          <span className="text-[9px] text-[#ccc]">{artist.track.artist}</span>
        </div>
        <span className="ml-1 inline-flex h-3.5 items-end gap-0.5" aria-hidden="true">
          {[0, -0.3, -0.6].map((delay) => (
            <i
              key={delay}
              className="h-full w-[3px] origin-bottom animate-eq rounded-xs bg-[#c9b6ff] motion-reduce:animate-none"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </span>
      </div>
    </main>
  );
}

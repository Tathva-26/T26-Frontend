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
import styles from "./ProshowCarousel.module.css";

const HOLD_MS = 1100;
const RING_COUNT = 7;
const SENS = 0.5; // <1 = heavier: the carousel moves less than your finger
const SPRING_MS = 75; // spring time-constant: bigger = softer, heavier glide
const IDLE_MS = 4250; // auto-advance to the next artist after this much idle time
const N = proshowArtists.length;

// The few standout stars with light rays. x/y are % of the page, size is the
// ray length in px, rot is each star's own angle, o is its brightness.
// Fixed values (not Math.random) so server and client render identically.
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

// Smaller versions of the same plus-ray star, scattered around the edges.
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
  const goalRef = useRef(0); // where the heavy follow is heading
  const followingRef = useRef(false); // true while the follow loop is running
  const velRef = useRef(0); // glide velocity (artists per ms)
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
    audio.loop = false; // plays the track once, then "ended" advances the artist
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
      // 1 when an artist sits exactly in the centre, easing to 0 halfway
      // between two; drives the beam/smoke/aura so they re-lock on arrival.
      const off = Math.min(1, Math.abs(p - Math.round(p)) * 2.2);
      pageRef.current?.style.setProperty("--lock", (1 - off * off * (3 - 2 * off)).toFixed(3));
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
        // A new artist stops the current song; it only plays again on a hold.
        if (playingRef.current) stopTrack();
      }
    },
    [stopTrack],
  );

  useLayoutEffect(() => {
    applyPos(posRef.current);
  }, [applyPos]);

  // The beam comes from the top of the page and ends at the active artist,
  // so it needs to know where the centre of the carousel is.
  useLayoutEffect(() => {
    const page = pageRef.current;
    const orbit = orbitRef.current;
    if (!page || !orbit) return;
    const measure = () => {
      const p = page.getBoundingClientRect();
      const o = orbit.getBoundingClientRect();
      page.style.setProperty("--beam-cy", `${Math.round(o.top - p.top + o.height / 2)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(page);
    ro.observe(orbit.parentElement);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const stopTween = () => {
    cancelAnimationFrame(tweenRef.current);
    tweenRef.current = 0;
    followingRef.current = false;
  };

  const animateTo = useCallback(
    (target, fast = false) => {
      stopTween();
      goalRef.current = target;
      const from = posRef.current;
      if (from === target) return;
      const dur = fast
        ? 300
        : Math.min(450 + Math.abs(target - from) * 100, 800);
      let t0;
      const tick = (now) => {
        t0 ??= now;
        const k = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
        applyPos(from + (target - from) * e);
        if (k < 1) tweenRef.current = requestAnimationFrame(tick);
        else tweenRef.current = 0;
      };
      tweenRef.current = requestAnimationFrame(tick);
    },
    [applyPos],
  );

  // Heavy follow: pos eases toward a goal set by the finger / trackpad.
  const followTo = useCallback(
    (goal) => {
      goalRef.current = goal;
      if (followingRef.current) return;
      stopTween(); // drop any keyboard/tap tween, then glide from where we are
      followingRef.current = true;
      velRef.current = 0;
      let last = performance.now();
      // Critically damped spring: velocity is carried across target changes,
      // so committing to the next artist never causes a sudden jolt.
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
    [applyPos],
  );

  const step = useCallback(
    (dir) => animateTo(Math.round(goalRef.current) + dir),
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

  // Auto-advance while idle: pauses during any drag/hold and while music is
  // playing, and restarts on the next interaction anywhere on the page.
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
    window.addEventListener("pointerdown", resetIdle);
    window.addEventListener("wheel", resetIdle, { passive: true });
    window.addEventListener("keydown", resetIdle);
    return () => {
      clearTimeout(idleTimerRef.current);
      window.removeEventListener("pointerdown", resetIdle);
      window.removeEventListener("wheel", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [resetIdle]);

  // Stops the current song and moves on to the next artist right away,
  // instead of waiting out the idle timer. Used both when the song is
  // stopped by holding again, and when a track finishes playing on its own.
  const stopAndAdvance = useCallback(() => {
    stopTrack();
    step(1);
    resetIdle();
  }, [stopTrack, step, resetIdle]);

  // A track that finishes playing on its own (not looping) advances too.
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
    if (playingRef.current) stopAndAdvance();
    else startTrack(activeRef.current);
  }, [startTrack, stopAndAdvance]);

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
      cancel();
      dir = Math.sign(e.deltaX);
      if (!followingRef.current) goalRef.current = posRef.current;
      followTo(goalRef.current + (e.deltaX / stepPx()) * SENS);
      clearTimeout(settle);
      // Once scrolling pauses, commit in the scroll direction after a small
      // nudge (25%) rather than waiting for the halfway point.
      settle = setTimeout(() => {
        const p = goalRef.current;
        const target = dir > 0 ? Math.floor(p + 0.75) : Math.ceil(p - 0.75);
        followTo(target); // keep gliding from the current motion, no jump
      }, 40);
    };
    page.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      page.removeEventListener("wheel", onWheel);
      clearTimeout(settle);
    };
  }, [followTo, animateTo, cancel]);

  useEffect(() => () => stopTween(), []);

  // Pointer: drag scrolls the carousel (touch and mouse), a flick carries on
  // with momentum, press-and-hold on the centre plays.
  const onPointerDown = (e, isCenter, index) => {
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
    followTo(g.startPos - (dx / stepPx()) * SENS);
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
    followTo(Math.round(goalRef.current - ((g.vx * 160) / stepPx()) * SENS));
  };

  return (
    <main
      ref={pageRef}
      className="relative grid h-dvh w-full touch-none select-none grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] items-center justify-items-center overflow-hidden overscroll-none bg-[radial-gradient(ellipse_at_50%_45%,#100e18_0%,#0a0912_55%,#050408_100%)] px-4 pt-[clamp(14px,3dvh,32px)] pb-[clamp(28px,7dvh,64px)] text-white [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [--c:clamp(180px,min(38dvh,36vw),470px)] [--o1:0.6] [--o2:0.4] [--x1:0.8] [--x2:1.32] [--x3:1.7] max-lg:[--c:clamp(170px,min(40dvh,52vw),420px)] max-lg:[--x1:0.84] max-lg:[--x2:1.38] max-sm:pb-[92px] max-sm:[--c:min(58vw,40dvh)] max-sm:[--o2:0] max-sm:[--x1:0.8] max-sm:[--x2:1.4]"
    >
      <div
        className={`${styles.twinkle} pointer-events-none absolute inset-0`}
        aria-hidden="true"
      >
        <div className={`${styles.bgStarsFine} ${styles.twinkleSlow} absolute inset-0`} />
        <div className={`${styles.bgStars} absolute inset-0`} />
        {[...SPARKLES, ...MINI_SPARKLES].map((s, i) => (
          <span
            key={i}
            className={`${styles.sparkle} absolute`}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.o,
              transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
            }}
          />
        ))}
      </div>

      {/* Celestial smoke: dark ambient gas at two depths, plus bright copies
          that are only revealed inside the beam's halo (so the beam lights it). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className={`${styles.smokeLayer} ${styles.smokeFar} ${styles.darkFar}`} />
        <div className={`${styles.smokeLayer} ${styles.smokeNear} ${styles.darkNear}`} />
        <div className={styles.litField}>
          <div className={`${styles.smokeLayer} ${styles.smokeFar} ${styles.litFar}`} />
          <div className={`${styles.smokeLayer} ${styles.smokeNear} ${styles.litNear}`} />
        </div>
      </div>

      <span className="absolute top-[clamp(14px,3dvh,30px)] left-[clamp(16px,2.4vw,32px)] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        TATHVA ‘26
      </span>
      <span className="absolute top-[clamp(14px,3dvh,30px)] right-[clamp(8px,2.4vw,32px)] -mr-[0.45em] z-2 font-(family-name:--font-bebas) text-[clamp(16px,2.4vw,30px)] tracking-[0.45em] max-sm:text-[14px] max-sm:tracking-[0.3em]">
        PRO-SHOW
      </span>

      <h1
        key={artist.id}
        className={`${styles.fadeUp} z-2 mt-[clamp(22px,4dvh,44px)] text-center font-(family-name:--font-space) text-[clamp(40px,min(9vw,11dvh),104px)] leading-none font-bold tracking-[-0.01em]`}
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
          <div
            className="pointer-events-none absolute inset-0 z-0"
            aria-hidden="true"
          >
            {Array.from({ length: RING_COUNT }, (_, i) => (
              <span
                key={i}
                className={`${styles.ringPulse} absolute top-1/2 left-1/2 aspect-square w-[calc(var(--c)*(1+var(--k)*0.62))] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(190,170,255,0.09)]`}
                style={{ "--k": i + 1, animationDelay: `${i * -1.2}s` }}
              />
            ))}
          </div>
          <div className={styles.aura} aria-hidden="true" />
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
                className={`${styles.item} absolute inset-0 cursor-grab touch-none overflow-hidden rounded-full border-0 bg-[#120b22] p-0 outline-none [-webkit-tap-highlight-color:transparent] will-change-[transform,opacity] active:cursor-grabbing`}
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

      <div
        className={`${styles.hintPulse} mt-[clamp(10px,2dvh,22px)] flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-5 py-1.5 text-white/85 shadow-[0_0_18px_-4px_rgba(201,182,255,0.5)]`}
        role="note"
        aria-label={coarse ? "Hold the artist to play" : "Hold space bar to play"}
      >
        {coarse && (
          <svg
            className={`${styles.keyPress} size-4 shrink-0`}
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

      <p
        key={`d-${artist.id}`}
        className={`${styles.fadeUp} -mr-[0.4em] mt-[clamp(8px,1.6dvh,18px)] text-center font-(family-name:--font-bebas) text-[clamp(20px,3vw,34px)] tracking-[0.4em] uppercase`}
      >
        {artist.date}
      </p>
      <p
        key={`p-${artist.id}`}
        className={`${styles.fadeUp} mt-[clamp(8px,1.6dvh,18px)] line-clamp-4 max-w-[min(640px,100%)] overflow-hidden text-justify text-[clamp(12px,1.35vw,17px)] leading-[1.55] text-[#ece8f7] [text-align-last:center] max-sm:line-clamp-3 max-sm:text-center [@media(max-height:520px)]:hidden!`}
      >
        {artist.description}
      </p>

      <div className={styles.dust} aria-hidden="true">
        <div className={styles.dustInner} />
      </div>

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
          <span className="text-[8px] tracking-[0.08em] text-[#ddd]">
            NOW PLAYING
          </span>
          <span className="text-base font-bold">{artist.track.title}</span>
          <span className="text-[9px] text-[#ccc]">{artist.track.artist}</span>
        </div>
        <span
          className="ml-1 inline-flex h-3.5 items-end gap-0.5"
          aria-hidden="true"
        >
          {[0, -0.3, -0.6].map((delay) => (
            <i
              key={delay}
              className={`${styles.eq} h-full w-[3px] origin-bottom rounded-xs bg-[#c9b6ff]`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </span>
      </div>
    </main>
  );
}

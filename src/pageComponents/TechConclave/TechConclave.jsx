"use client";
import React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const background = "/images/techconclave/background.png";
const person1 = "/images/techconclave/person2.png";
const person2 = "/images/techconclave/person1.png";
const robot = "/images/techconclave/robot.png";
const logo = "/images/techconclave/logo.png";
const bigStar = "/images/techconclave/bigstar.png";

/*
  ── HOW THIS FILE IS ORGANISED ───────────────────────────────────────────
  DesktopPoster  → your existing, pixel-tuned layout for 1280×800 / 1440×900.
                   Untouched. Shown only at widths >= 1025px.
  MobilePoster   → a new layout for tablet/phone. Instead of scaling the
                   fixed 1413×753 canvas down (which was making things
                   cramped/overlapping on small screens), it reflows the
                   same images/text into a flex-wrap stack: a header row,
                   a hero row, and a people grid that wraps from 3 → 2
                   columns as the screen narrows.
  Both are rendered; CSS `display` (via matching media queries) shows only
  one at a time, so there's no layout-shift/hydration flicker.

  SPEAKER CARDS — every speaker tile (all three layouts) is a `.tc-card`:
    • hover/focus lift   → scale(1.05) translateY(-8px) + purple glow
    • inner image zoom   → image scales to 1.1 inside the clipped card
    • cursor spotlight   → radial gradient driven by --mx / --my
    • accent ring        → 1.5px #7c3aed border fades in
    • floating badge     → slides/fades in at the bottom-left corner
  SCROLL DRIFT — while the poster passes through the viewport, the left
  speaker column drifts up and the right column drifts down. It uses the
  CSS `translate` property (separate from `transform`), so it never fights
  the hover lift, and it's transform-only, so no layout box moves. When the
  poster is centred in the viewport both columns sit at their exact
  original positions.
  ──────────────────────────────────────────────────────────────────────── */

const FW = 1413;
const FH = 753;
const W = 1550;
const H = Math.round(W * (FH / FW));

const fbox = (x, y, w, h) => ({
  left: `${(x / FW) * 100}%`,
  top: `${(y / FH) * 100}%`,
  width: `${(w / FW) * 100}%`,
  height: `${(h / FH) * 100}%`,
});
const box = (x, y, w, h) => ({
  left: `${(x / FW) * 100}%`,
  top: `${(y / FH) * 100}%`,
  width: `${(w / FW) * 100}%`,
  height: `${(h / FH) * 100}%`,
});

/* badge text is placeholder metadata — swap in real session names / roles */
const womanTiles = [
  { color: "#000000", shape: [668, 25, 158, 163], img: [668, 18, 158, 170]},
  { color: "#000000", shape: [668, 243, 158, 163], img: [668, 236, 158, 170]},
  { color: "#000000", shape: [668, 461, 158, 163], img: [668, 454, 158, 170] },
];

const manTiles = [
  { color: "#000000", shape: [870, 40, 158, 160], img: [870, 8, 158, 194] },
  { color: "#000000", shape: [870, 257, 158, 161], img: [870, 225, 158, 195]},
  { color: "#000000", shape: [870, 475, 158, 161], img: [870, 443, 158, 195] },
];

const Plus = ({ style, rotate = 0 }) => (
  <svg
    className="tc-abs tc-deco"
    style={{ ...style, transform: `rotate(${rotate}deg)` }}
    viewBox="0 0 10 10"
    aria-hidden="true"
  >
    <path d="M3.5 0h3v3.5H10v3H6.5V10h-3V6.5H0v-3h3.5z" fill="#7c3aed" />
  </svg>
);

/* ───────────────────────── SCROLL DRIFT HOOK ─────────────────────────
   Writes --tc-p (-1 → 0 → 1) on the poster's <main>:
     -1 = poster just entering from the bottom of the viewport
      0 = poster centred in the viewport (tiles at their original spots)
      1 = poster leaving through the top
   Smoothed with a small lerp for an eased, "floating" feel. Only runs
   while the poster is on screen; hidden layouts (display:none) never
   intersect, so they cost nothing. */
function useScrollDrift() {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let visible = false;
    let raf = 0;
    let current = 0;
    let target = 0;
    let primed = false;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const range = (vh + r.height) / 2 || 1;
      const p = (vh / 2 - (r.top + r.height / 2)) / range;
      target = Math.max(-1, Math.min(1, p));
      if (!primed) {
        current = target; // no jump on first paint
        primed = true;
        el.style.setProperty("--tc-p", current.toFixed(4));
      }
    };

    // Runs every animation frame while the poster is on screen, instead of
    // waiting for scroll/resize events. Scroll-event dispatch is where
    // browsers/devices disagree (nested scroll containers like the tablet
    // layout's own overflow-y:auto wrapper, devtool device emulation not
    // always firing a clean resize, etc.) — polling position every frame
    // sidesteps all of that, it just can't miss an update.
    const loop = () => {
      if (!visible) { raf = 0; return; }
      measure();
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      el.style.setProperty("--tc-p", current.toFixed(4));
      raf = requestAnimationFrame(loop);
    };

   const io = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (visible && !raf) raf = requestAnimationFrame(loop);
});

io.observe(el);
measure();
raf = requestAnimationFrame(loop);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}

function useIntroAnimation(ref) {
  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const scroller = root.closest(".main-scroll");

    const context = gsap.context(() => {
      const title = root.querySelectorAll(".tc-animate-title");
      const cards = root.querySelectorAll(".tc-animate-card");
      const meta = root.querySelectorAll(".tc-animate-meta");
      const robot = root.querySelector(".tc-animate-robot");
      const logo = root.querySelector(".tc-animate-logo");

      gsap.set([...title, ...cards, ...meta, logo].filter(Boolean), { autoAlpha: 0 });
      gsap.set(title, { x: -32 });
      gsap.set(cards, { y: 18 });
      gsap.set(meta, { y: 12 });
      if (logo) gsap.set(logo, { scale: 0.86, transformOrigin: "center" });

      const reveal = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: root,
          scroller,
          start: "top 78%",
          once: true,
        },
      });

      reveal
        .to(title, { autoAlpha: 1, x: 0, duration: 0.65, stagger: 0.08 })
        .to(cards, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.06 }, "-=0.25")
        .to(meta, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, "-=0.2")
        .to(logo, { autoAlpha: 1, scale: 1, duration: 0.55 }, "-=0.3");

      if (robot) {
        gsap.to(robot, {
          yPercent: -2.5,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            scroller,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }
    }, root);

    return () => context.revert();
  }, [ref]);
}

/* ───────────────────────── SPEAKER CARD HELPERS ───────────────────────── */

/* Writes the pointer position into CSS vars so the spotlight follows the
   cursor. Touches the DOM directly — no React state, no re-renders. */
const trackLight = (e) => {
  // Only execute for mouse/pointer devices, skip touch/mobile interactions
  if (e.pointerType === 'touch') return;

  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--light-x', `${x}px`);
  e.currentTarget.style.setProperty('--light-y', `${y}px`);
};


/* Desktop tile: the photo is taller than its black shape so the head pops
   out above it. The card box = photo box; shape / light / ring are placed
   inside it at the shape's exact original position. */
function DeskTile({ tile, src, alt, col }) {
  const [ix, iy, iw, ih] = tile.img;
  const [sx, sy, sw, sh] = tile.shape;
  const inner = {
    left: `${((sx - ix) / iw) * 100}%`,
    top: `${((sy - iy) / ih) * 100}%`,
    width: `${(sw / iw) * 100}%`,
    height: `${(sh / ih) * 100}%`,
  };

  return (
    <div
      className={`tc-card tc-card--desk tc-animate-card ${col}`}
      style={box(...tile.img)}
      tabIndex={0}
      onPointerMove={trackLight}
    >
      <div className="tc-card-shape tc-shape" style={{ ...inner, background: tile.color }} />
      <div className="tc-card-clip">
        <img className="tc-person tc-card-img" src={src} alt={alt} />
      </div>
      <span className="tc-card-light" style={inner} />
      <span className="tc-card-ring" style={inner} />
    </div>
  );
}

/* ───────────────────────── DESKTOP (unchanged) ───────────────────────── */

function DesktopPoster() {
  const driftRef = useScrollDrift();
  useIntroAnimation(driftRef);

  return (
    <main
      ref={driftRef}
      className="tc-page tc-desktop-only"
      style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})` }}
    >
      <section className="tc-stage" aria-label="Tech Conclave, October 10-11">
        {/* colour blocks behind the robot */}
        <div className="tc-abs tc-deco" style={{ ...box(10, 38, 290, 550), background: "#8A38F5C2" }} />
        <div className="tc-abs tc-deco" style={{ ...box(20, 588, 600, 170), background: "#9C03A0BA" }} />

        {/* decorations */}
        <Plus style={box(1128, 42, 92, 92)} rotate={20} />
        <p className="tc-eyebrow tc-abs" style={box(40, 770, 600, 40)}>
  TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.
</p>

        {/* people grid — interactive speaker cards */}
        {womanTiles.map((t, i) => (
          <DeskTile key={`w${i}`} tile={t} src={person1} alt={i === 0 ? "Speaker" : ""} col="tc-col-left" />
        ))}
        {manTiles.map((t, i) => (
          <DeskTile key={`m${i}`} tile={t} src={person2} alt={i === 0 ? "Speaker" : ""} col="tc-col-right" />
        ))}

        {/* stretched display type */}
        <svg
          className="tc-abs tc-type"
          style={{ inset: 0, width: "100%", height: "100%" }}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <text x="335" y="140" fontSize="135" fill="#ffffff" textLength="235" lengthAdjust="spacingAndGlyphs">
            TECH
          </text>
          <text
            transform="translate(550, 635) rotate(-90)"
            fontSize="270"
            fill="#6d7fff"
            textLength="485"
            lengthAdjust="spacingAndGlyphs"
          >
            CONCLAVE
          </text>
          <text x="1170" y="820" fontSize="180" fill="#6d7fff" textLength="200" lengthAdjust="spacingAndGlyphs">
            OCT
          </text>
          <text x="1400" y="800" fontSize="90" fill="#6d7fff" textLength="150" lengthAdjust="spacingAndGlyphs">
            10-11
          </text>
        </svg>

        {/* robot */}
          <img className="tc-abs-robot robot-img tc-deco tc-animate-robot" style={box(-270, -70, 970, 950)} src={robot} alt="Waving robot" />

        {/* stars */}
        <img className="tc-abs tc-deco" style={box(-180, -30, 200, 210)} src={bigStar} alt="" />
        {/* right column */}
        <div className="tc-abs tc-hero-heading" style={box(1080, 230, 510, 450)} aria-label="Tech Conclave title">
          <span className="tc-hero-word tc-animate-title">
            <span className="tc-hero-tech">TECH</span>
            <span className="tc-hero-conclave">CONCLAVE</span>
          </span>
        </div>
        <img className="tc-abs logo-img tc-deco tc-animate-logo" style={box(970, 510, 220, 220)} src={logo} alt="Tech Conclave" />
        <p className="tc-abs tc-tagline tc-animate-meta" style={box(1112, 328, 420, 170)}>
          A space for inspiring
          <br />
          personalities engaging
          <br />
          conversations and
          <br />
          unforgettable experiences
        </p>
      </section>
    </main>
  );
}

/* ─────────────────────── MOBILE / TABLET (new) ────────────────────────
   Rebuilt to match the supplied mobile mock: TECH / CONCLAVE stacked
   title, the robot + colour-block + 2×3 people-grid + pink block treated
   as one illustration group, an eyebrow line, the big OCT date, then a
   compact logo lockup + tagline at the bottom.

   Two real flex-wrap mechanisms are doing the responsive work:
   1. `.tc-m-people` — the 6 speaker tiles are flex items with
      `flex-wrap: wrap`, so they sit 2-per-row automatically.
   2. `.tc-m-stage` — the "visual" group and the "info" group (date +
      footer) are flex items with `flex-wrap: wrap` and a min basis. On a
      phone-width screen there's only room for one per row, so they stack
      top-to-bottom exactly like the mock. On a wider, tablet-width screen
      there's room for both, so they naturally sit side-by-side instead —
      no extra breakpoint needed for that switch.

   The illustration itself (purple block behind the robot, robot
   overlapping the pink block, overlapping the grid, stars/plus) is
   one composited scene, so — same as the desktop version — its pieces
   are placed with percentage coordinates *inside that one scene only*
   (mbox helper, on its own small canvas), not scattered absolute
   positioning across the whole page.

   Note: the mock's wireframe globe in the top-right corner isn't one of
   the provided image assets, so it's approximated here with a small
   inline SVG rather than invented as a new image file. Swap in a real
   asset if you have one.
------------------------------------------------------------------------ */

const MW = 424;
const MH = 335;
const mbox = (x, y, w, h) => ({
  left: `${(x / MW) * 100}%`,
  top: `${(y / MH) * 100}%`,
  width: `${(w / MW) * 100}%`,
  height: `${(h / MH) * 100}%`,
});

function MobilePoster() {
  const driftRef = useScrollDrift();
  useIntroAnimation(driftRef);

  // interleaved so flex-wrap lands them green/pink, yellow/red, blue/purple
  const people = womanTiles.flatMap((w, i) => [
    { ...w, img: person1 },
    { ...manTiles[i], img: person2 },
  ]);

  return (
    <main ref={driftRef} className="tc-page tc-mobile-only" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})` }}>
      <section className="tc-m-stage" aria-label="Tech Conclave, October 10-11">
        {/* ── visual group: title + illustration + eyebrow ── */}
        <div className="tc-m-panel tc-m-panel--visual">
          <div className="tc-m-titlewrap">
            <h1 className="tc-m-title tc-animate-title">
              <span className="tc-m-tech">TECH</span>
              <span className="tc-m-conclave">CONCLAVE</span>
            </h1>
          </div>

          <div className="tc-m-hero">
            <div className="tc-abs tc-deco" style={{ ...mbox(30, -7, 130, 280), background: "#8A38F5C2" }} />
            <div className="tc-abs tc-deco" style={{ ...mbox(30, 270, 280, 70), background: "#9C03A0BA" }} />

            <div className="tc-abs tc-m-people" style={mbox(215, -9, 174, 231)} role="list" aria-label="Speakers">
  {people.map((t, i) => (
    <div
      className={`tc-m-tile tc-card tc-animate-card ${i % 2 === 0 ? "tc-col-left" : "tc-col-right"}`}
      style={{ "--tile-color": t.color }}
      key={i}
      role="listitem"
      tabIndex={0}
      onPointerMove={trackLight}
    >
      <img className="tc-m-tile-img tc-card-img" src={t.img} alt="" />
      <span className="tc-card-light" />
      <span className="tc-card-ring" />
    </div>
  ))}
</div>

            <img className="tc-abs tc-m-robot tc-deco tc-animate-robot" style={mbox(-75, 35, 350, 350)} src={robot} alt="Waving robot" />
            <img className="tc-abs tc-deco" style={mbox(-37, -15, 80, 80)} src={bigStar} alt="" />
          </div>

          <p className="tc-m-eyebrow tc-animate-meta">TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.</p>
        </div>

        {/* ── info group: date + logo lockup + tagline ── */}
        <div className="tc-m-panel tc-m-panel--info">
          <div className="tc-m-date tc-animate-meta">
            <span className="tc-m-oct">OCT</span>
            <span className="tc-m-days">10-11</span>
          </div>

          <div className="tc-m-footer tc-animate-meta">
            <h2 className="tc-m-subheading">
              <span className="tc-m-subheading-tech">tech</span>
              <span className="tc-m-subheading-conclave">conclave</span>
            </h2>
            <p className="tc-m-tagline">
              <span>A space for inspiring</span>
              <span>personalities engaging</span>
              <span>conversations and</span>
              <span>unforgettable experiences.</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
/*------------------------------TABLET------------------------------------------------*/
function TabletPlus({ style, rotate = 0 }) {
  return (
    <svg
      className="tc-t-abs tc-t-plus tc-deco"
      style={{ ...style, transform: `rotate(${rotate}deg)` }}
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <path d="M3.5 0h3v3.5H10v3H6.5V10h-3V6.5H0v-3h3.5z" fill="#7c3aed" />
    </svg>
  );
}

function TabletPoster() {
  const driftRef = useScrollDrift();
  useIntroAnimation(driftRef);

  const speakers = womanTiles.flatMap((woman, index) => [
    { ...woman, img: person1 },
    { ...manTiles[index], img: person2 },
  ]);

  return (
    <main ref={driftRef} className="tc-t-page" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})` }}>
      <section className="tc-t-stage" aria-label="Tech Conclave, October 10-11">
        <div className="tc-t-visual">
          <h1 className="tc-t-title tc-animate-title">
            <span className="tc-t-tech">TECH</span>
            <span className="tc-t-conclave">CONCLAVE</span>
          </h1>

          <div className="tc-t-art">
            <div className="tc-t-abs tc-t-block tc-deco" style={{ ...mbox(30, -7, 130, 280), background: "#8A38F5C2" }} />
            <div className="tc-t-abs tc-t-pink-block tc-deco" style={{ ...mbox(30, 270, 280, 70), background: "#9C03A0BA" }} />
            <div className="tc-t-abs tc-t-speakers" style={mbox(215, -9, 174, 231)} role="list" aria-label="Speakers">
  {speakers.map((speaker, index) => (
    <div
      className={`tc-t-speaker tc-card tc-animate-card ${index % 2 === 0 ? "tc-col-left" : "tc-col-right"}`}
      style={{ "--tile-color": speaker.color }}
      key={index}
      role="listitem"
      tabIndex={0}
      onPointerMove={trackLight}
    >
      <img className="tc-t-speaker-img tc-card-img" src={speaker.img} alt="" />
      <span className="tc-card-light" />
      <span className="tc-card-ring" />
    </div>
  ))}
</div>
            <img className="tc-t-abs tc-t-robot tc-deco tc-animate-robot" style={mbox(-100, 5, 400, 400)} src={robot} alt="Waving robot" />
            <img className="tc-t-abs tc-t-star tc-deco" style={mbox(-55, -20, 110, 110)} src={bigStar} alt="" />
          </div>


<p className="tc-t-eyebrow tc-animate-meta">
  TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.
</p>
        </div>

        <div className="tc-t-info">
          <div className="tc-t-lockup">
            <h2 className="tc-t-name tc-animate-meta">
              <span className="tc-t-name-tech">TECH</span>{" "}
              <span className="tc-t-name-conclave">CONCLAVE</span>
            </h2>
            <p className="tc-t-description tc-animate-meta">
              A space for inspiring personalities, engaging conversations, and unforgettable experiences.
            </p>
          </div>
          <div className="tc-t-date tc-animate-meta" aria-label="October 10-11">
            <span className="tc-t-oct">OCT</span>
            <span className="tc-t-days">10-11</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function TechConclave() {
  return (
    <>
      <style>{css}</style>
      <DesktopPoster />
      <MobilePoster />
      <TabletPoster />
    </>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500&display=swap");
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap');

html, body { margin: 0; padding: 0; }

.tc-page {
  --tc-scale: 0.82;
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  margin: 0;
  background-color: #101014;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow-x: clip; /* Clips horizontal artwork without creating a nested y scroller */
}

/* toggle desktop vs mobile layout — no JS, no hydration flicker */
.tc-desktop-only { display: grid; }
.tc-mobile-only { display: none; }
@media (max-width: 1024px) {
  .tc-desktop-only { display: none; }
  .tc-mobile-only { display: grid; }
}

/* ============================ DESKTOP ============================ */

.tc-stage {
  position: relative;
  width: calc(min(100vw, 100vh * 1413 / 753) * var(--tc-scale));
  aspect-ratio: 1413 / 753;
  container-type: inline-size;
}

.tc-m-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 424 / 335;
  margin-top: 24px; /* Increase this value (e.g., 30px, 40px) to push the whole group further down */
}

.tc-hero-heading {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 5;
  pointer-events: none;
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif;
}

.tc-hero-word {
  display: inline-flex;
  align-items: baseline;
  gap: 0.03em;
  line-height: 0.9;
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-size: clamp(2.6rem, 7.4cqw, 5.2rem);
}

.tc-hero-tech { display: inline-block; color: #ffffff; font-size: 1em; font-weight: 400; }
.tc-hero-conclave { display: inline-block; color: #6d7fff; font-size: 1em; font-weight: 400; }

.robot-img { transform: translateX(-7.5%) ; transform-origin: left center; }
// .logo-img { transform: scale(1.65) translate(-1%, -3%); transform-origin: right center; z-index: 4; }
.tc-abs-robot { position: absolute; display: block; }
.tc-abs { position: absolute; display: block; object-fit: contain; }
.tc-shape { 
  border-top-right-radius: 15%;
  border-top-left-radius: 15%;
  border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%;
  }
.tc-person { object-fit: cover; object-position: center bottom; border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%; }
.tc-type text { font-family: "Bebas Neue", "Oswald", Impact, sans-serif; }

.tc-tagline {
  margin: 0;
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 400;
  font-size: 1.95cqw;
  line-height: 1.34;
  color: #e9e9f2;
}
.tc-eyebrow {
  margin: 0;
  text-align: left;
  font-family: "Bebas Neue", sans-serif;
  font-weight:800;
  font-size: 2.5cqw;
  color: #6d7fff;
  line-height: 1;
  z-index: 10;
  pointer-events: none;
  /* Removed transform translateY which was causing offset bugs */
}
/* ============================ MOBILE / TABLET (new, flex-wrap) ============================ */

.tc-m-stage {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 22px 36px;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;         /* ← stacks on phones, sits side-by-side once there's room */
  align-items: flex-start;
  gap: 28px;
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif;
}

/* each panel takes the full row on a phone (nothing else fits next to
   380px+240px under ~660px), and shares the row once the stage is wide
   enough — that's the actual "tablet" reflow, done with flex-wrap alone */
.tc-m-panel { display: flex; flex-direction: column; gap: 16px; }

.tc-m-panel--visual { 
  flex: 3 1 380px; 
  min-width: 300px; 
  display: flex;
  flex-direction: column;
  align-items: center; /* Center children horizontally */
  width: 100%;
}
.tc-m-panel--info { flex: 1 1 240px; min-width: 220px; }

.tc-m-titlewrap { 
  position: relative; 
  width: 100%;
  display: flex;
  justify-content: center; /* Horizontally center title block */
  text-align: center;
  
}

.tc-m-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 0.92;
  letter-spacing: -0.01em;
  width: 100%;
  text-align: center;
}
.tc-m-tech { 
  color: #ffffff; 
  font-size: clamp(2rem, 8vw, 2.6rem); 
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif;  
  text-align: left;
  width: 100%;
}
.tc-m-conclave { 
 color: #7787ff; /* Matching purple/indigo accent */
  font-family: "Syne", "Druk Wide Bold", "Monument Extended", sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  font-size: clamp(2.2rem, 9.4vw, 3.7rem);
  line-height: 0.86;
  letter-spacing: 0.01em;
  transform: translateX(-6px)!important;
  // transform: scaleY(0.8);
  // transform-origin: left top;
}

.tc-m-globe {
  position: absolute;
  top: -18px;
  right: -8px;
  width: 88px;
  height: 88px;
  opacity: 0.85;
  pointer-events: none;
}

.tc-m-hero {
  position: relative;
  width: 100%;
  aspect-ratio: ${MW} / ${MH};
}

.tc-m-eyebrow {
  margin: 0;
  text-align: left;
  font-family: Bebas Neue;
  font-size: 17px;
  color: #6d7fff;
  transform: translate(-36px, -3px);
}

.tc-m-date {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: #7787ff;
  // transform: translateX(45px);
    font-weight: 500;

}
.tc-m-oct {
  font-size: clamp(7.6rem, 9vw, 3.2rem);
  line-height: 1;
  transform: translateY(-0.2em);
  font-weight: 500;
}
.tc-m-days {
  font-weight: 500;
  font-style: medium;
  font-size: clamp(4.9rem, 9vw, 3.2rem);
   transform: translateY(-0.3em);
}
.tc-m-footer { display: flex; flex-direction: column; gap: 8px; }
.tc-m-logo { height: 22px; width: auto; object-fit: contain; align-self: flex-start; }

.tc-m-subheading {
  margin: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.08em;
  font-family: Bebas Neue;
font-weight: 400;
font-style: Regular;
font-size: 40px;
leading-trim: NONE;
line-height: 100%;
letter-spacing: 0%;
text-align: center;
  font-size: 3.1rem;
  line-height: 1;
  // letter-spacing: 0.08em;
  text-transform: lowercase;
  // transform: translateX(28px);
}

.tc-m-subheading-tech {
  color: #d9d9f2;
}

.tc-m-subheading-conclave {
  color: #7787ff;
}

.tc-m-tagline {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  font-style: medium;
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 500;
  font-size: 17px;
  line-height: 1.35;
  color: #e9e9f2;
  max-width: 29ch;
  // transform: translate(28px, -2px);

}

.tc-m-tagline span {
  display: block;
}
.tc-m-robot {
  object-fit: cover !important; /* or object-fit: fill */
  max-width: none !important;
  max-height: none !important;
}
.tc-abs {
  object-fit: cover !important; /* or object-fit: fill */
  max-width: none !important;
  max-height: none !important;
}

/* the actual "flex-wrap" grid: 2 columns, 3 rows, from wrapping 6 flex items */
.tc-m-people {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 18px;
  margin-left: 20px !important;
}

.tc-m-tile {
  flex: 0 0 calc(44% - 9px);
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: visible !important;
}

/* the rounded "body" shape only — sits lower than the tile itself so the
   head has room to pop out above it. This is the layer that owns the
   colour fill and the hover glow (not the tile / not the image). */
.tc-m-tile::before {
  content: "";
  position: absolute;
  top: 26%;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--tile-color);
  border-radius: 15%;
  z-index: 1;
  transition: box-shadow 0.45s var(--tc-ease);
}

.tc-m-tile:is(:hover, :focus-visible)::before {
  box-shadow: var(--tc-glow);
}

.tc-m-tile-img {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 122%;
  object-fit: cover;
  object-position: center bottom;
  border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%;
  z-index: 5;
  pointer-events: none;
}

/*-------------------------------TABLETS----------------------------------------------*/
.tc-t-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: clip;
  background-color: #101014;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #f2f0ff;
  font-family: "Space Grotesk", sans-serif;
}

.tc-t-stage {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 4vh;
  width: 100%;
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(28px, 5vw, 56px) clamp(48px, 8vw, 88px) clamp(28px, 5vw, 56px) clamp(64px, 10vw, 110px);
}

.tc-t-visual,
.tc-t-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.tc-t-visual { flex: 0 0 auto; justify-content: center; }
.tc-t-info {
  flex: 1 1 auto;               /* takes the leftover height under the art */
  flex-direction: row;
  flex-wrap: nowrap;              /* narrow tablets wrap instead of colliding sideways */
  align-items: center;          /* was: flex-end; centres in the leftover space */
  justify-content: space-between;
  gap: 24px;
}

.tc-t-title {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  line-height: 0.88;
}

.tc-t-tech {
  color: #fff;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(3rem, 9vw, 6rem);
  font-weight: 400;
  transform: translateY(-15px);
}

.tc-t-conclave {
  color: #7787ff;
  font-family: "Syne", sans-serif;
  font-size: clamp(2.6rem, 8vw, 5.4rem);
  font-weight: 800;
  line-height: 0.96;
   transform: translateY(-9px);
}

.tc-t-art {
  position: relative;
  width: 100%;
  margin-top: clamp(12px, 2vw, 24px);
  aspect-ratio: ${MW} / ${MH};
}

.tc-t-abs {
  position: absolute;
  display: block;
  max-width: none;
  max-height: none;
  object-fit: contain;
}

.tc-t-block { border-top-right-radius: 0%; }
.tc-t-pink-block { z-index: 0; }
.tc-t-plus { z-index: 2; }
.tc-t-robot { z-index: 2; }
.tc-t-star { z-index: 5; }

 .tc-t-speakers {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 19px;
  transform:translateX(46px)
}
.tc-t-speaker:is(:hover, :focus-visible) {
  z-index: 10;
}

.tc-t-speaker {
  position: relative;
  flex: 0 0 calc(44% - 10px);
  aspect-ratio: 1 / 1;
  overflow: visible !important;
}

/* same "body" shape pattern as mobile: colour + glow live on this lower
   layer, not on the tile itself, so the glow never crosses the forehead */
.tc-t-speaker::before {
  content: "";
  position: absolute;
  top: 26%;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--tile-color);
  border-radius: 15%;
  z-index: 1;
  transition: box-shadow 0.8s var(--tc-ease);
}

.tc-t-speaker:is(:hover, :focus-visible)::before {
  box-shadow: var(--tc-glow);
}

.tc-t-speaker-img {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 122%;
  object-fit: cover;
  object-position: center bottom;
  border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%;
  z-index: 5;
  pointer-events: none;
}

.tc-t-eyebrow {
  margin: 8px 0 0 24px;
  color: #6d7fff;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(25px, 2.4vw, 24px);
  transform: translateX(21px)
}

.tc-t-lockup { flex: 1 1 0; min-width: 0; max-width: 34ch; }
.tc-t-kicker {
  margin: 0 0 12px;
  color: #9C03A0BA;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(14px, 1.5vw, 18px);
}

.tc-t-name {
  margin: 0;
  color: #d9d9f2;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(3.3rem, 6vw, 4.6rem);
  font-weight: 400;
  line-height: 0.95;
  transform:none;
}

  .tc-t-name-tech { color: #ffffff; }
  .tc-t-name-conclave { color: #7787ff; }

.tc-t-description {
  margin: 16px 0 0;
  color: #e9e9f2;
  font-size: clamp(18px, 2.4vw, 24px);
  line-height: 1.45;
  transform:none;
}

.tc-t-date {
  display: flex;
  align-items: baseline;
  gap: clamp(8px, 1.5vw, 16px);
  white-space: nowrap;
  color: #7787ff;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  transform:none;
}
.tc-t-date { flex: 0 0 auto; }

.tc-t-oct {
  font-size: clamp(6rem, 17vw, 11rem);
  line-height: 0.9;
}

.tc-t-days {
  font-size: clamp(2.8rem, 8vw, 6rem);
  line-height: 0.9;
}

/* ===================== SPEAKER CARDS — floating hover ===================== */

/* decorative layers (robot, stars, colour blocks, display type, logo) sit on
   top of the tiles in places — let the pointer pass through them */
.tc-deco,
.tc-type { pointer-events: none; }

.tc-card {
  --tc-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --tc-accent: #7c3aed;
  --tc-glow: 0 12px 28px rgba(124, 58, 237, 0.45), 0 0 22px rgba(124, 58, 237, 0.3);
  container-type: inline-size;   /* badge text scales with the tile */
  cursor: pointer;
  outline: none;
  border: none;
  -webkit-tap-highlight-color: transparent;
  transform: scale(1) translateY(0);
  transition:
    transform 0.45s var(--tc-ease),
    box-shadow 0.45s var(--tc-ease);
  will-change: transform, translate;
}

/* 1 ─ floating lift + glow */
.tc-card:is(:hover, :focus-visible) {
  transform: scale(1.05) translateY(-8px);
  z-index: 6;
}
.tc-card:not(.tc-card--desk):not(.tc-m-tile):not(.tc-t-speaker):is(:hover, :focus-visible) {
  box-shadow: var(--tc-glow);
}

/* 3 ─ inner image zoom (card itself stays clipped) */
.tc-card-img {
  transform: scale(1);
  transform-origin: center bottom;
  transition: transform 0.6s var(--tc-ease), filter 0.6s var(--tc-ease);
}
.tc-card:is(:hover, :focus-visible) .tc-card-img {
  transform: scale(1.1);
  filter: saturate(1.08) contrast(1.04);
}


.tc-card-img,
.tc-person,
.tc-m-tile-img,
.tc-t-speaker-img {
  position: relative;
  z-index: 10; /* Set higher than other card layers (like background shapes or overlays) */
}
  
.tc-card-ring {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 14px rgba(124, 58, 237, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s var(--tc-ease);
}

.tc-card:is(:hover, :focus-visible) .tc-card-ring {
  opacity: 1;
}

/* on mobile/tablet tiles the ring should trace the lower "body" shape
   (same box as the ::before glow), not the full square, or it would cut
   across the forehead the same way the old glow did */
.tc-m-tile .tc-card-ring,
.tc-t-speaker .tc-card-ring {
  top: 26%;
  border-radius: 15%;
}

/* desktop tile: card = photo box; shape / light / ring sit at the shape spot */
.tc-card--desk { position: absolute; display: block; }
.tc-card-shape {
  position: absolute;
  z-index: 0;
  transition: box-shadow 0.45s var(--tc-ease);
}
.tc-card--desk:is(:hover, :focus-visible) .tc-card-shape { box-shadow: var(--tc-glow); }

/* clips the zoom on the sides and (rounded) bottom but leaves headroom on
   top so the head still breaks out of the shape */
.tc-card-clip {
  position: absolute;
  inset: 0;
  z-index: 1;
  clip-path: inset(-20% 0 0 0 round 0 0 15% 15%);
}
.tc-card--desk .tc-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.tc-card--desk ,
.tc-card--desk {
  inset: auto;
  border-radius: 15%;   /* matches .tc-shape */
}

.tc-card--desk:is(:hover, :focus-visible) { opacity: 1; }


/* ===================== SCROLL DRIFT — columns ===================== */
/* --tc-p is written by useScrollDrift() on the poster's <main>.
   Uses the standalone translate property, so it stacks with the hover
   transform instead of replacing it, and never touches layout boxes.
   The % is relative to each tile's own height, so the drift scales
   the same on phone, tablet and laptop. */
.tc-col-left,
.tc-col-right { --tc-drift: 22%; }
.tc-col-left  { translate: 0 calc(var(--tc-p, 0) * -1 * var(--tc-drift)); } /* moves up   */
.tc-col-right { translate: 0 calc(var(--tc-p, 0) * var(--tc-drift)); }      /* moves down */

/* respect reduced-motion: keep glow, ring and badge, drop the movement */
@media (prefers-reduced-motion: reduce) {
  .tc-card,
  .tc-card-img,
  .tc-badge { transition-duration: 0.01ms; }
  .tc-card:is(:hover, :focus-visible),
  .tc-card:is(:hover, :focus-visible) .tc-card-img,
  .tc-card:is(:hover, :focus-visible) .tc-badge { transform: none; }
  .tc-col-left,
  .tc-col-right { translate: none; }
}

/* Clean, non-conflicting width ranges */
.tc-desktop-only { display: grid; }
.tc-mobile-only { display: none; }
.tc-t-page { display: none; }

/* Mobile (0px - 639px) */
@media (max-width: 639px) {
  .tc-desktop-only { display: none !important; }
  .tc-mobile-only { display: grid !important; }
  .tc-t-page { display: none !important; }
}
/* Hide pointer light overlay on tablet and mobile viewports */

/* Tablet (640px - 1024px) */
@media (min-width: 640px) and (max-width: 1024px) {
  .tc-desktop-only { display: none !important; }
  .tc-mobile-only { display: none !important; }
  .tc-t-page { display: block !important; }
}


/* Desktop (1025px+) */
@media (min-width: 1025px) {
  .tc-desktop-only { display: grid !important; }
  .tc-mobile-only { display: none !important; }
  .tc-t-page { display: none !important; }
}

@media (width: 1024px) and (height: 768px) {
  .tc-t-eyebrow {
    transform: translate(21px, 20px);
  }
}

`;

import React from "react";

const background = "/images/techconclave/background.png";
const person1 = "/images/techconclave/person2.png";
const person2 = "/images/techconclave/person1.png";
const robot = "/images/techconclave/robot.png";
const hand = "/images/techconclave/hand.png";
const logo = "/images/techconclave/logo.png";
const smallStar = "/images/techconclave/smallstar.png";
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

const womanTiles = [
  { color: "#00ff5e", shape: [668, 25, 158, 163], img: [668, 18, 158, 170] },
  { color: "#ffe600", shape: [668, 243, 158, 163], img: [668, 236, 158, 170] },
  { color: "#0033ff", shape: [668, 461, 158, 163], img: [668, 454, 158, 170] },
];

const manTiles = [
  { color: "#ff8ff5", shape: [870, 40, 158, 160], img: [870, 8, 158, 194] },
  { color: "#d62828", shape: [870, 257, 158, 161], img: [870, 225, 158, 195] },
  { color: "#9b3bb0", shape: [870, 475, 158, 161], img: [870, 443, 158, 195] },
];

const Plus = ({ style, rotate = 0 }) => (
  <svg
    className="tc-abs"
    style={{ ...style, transform: `rotate(${rotate}deg)` }}
    viewBox="0 0 10 10"
    aria-hidden="true"
  >
    <path d="M3.5 0h3v3.5H10v3H6.5V10h-3V6.5H0v-3h3.5z" fill="#7c3aed" />
  </svg>
);

/* ───────────────────────── DESKTOP (unchanged) ───────────────────────── */

function DesktopPoster() {
  return (
    <main
      className="tc-page tc-desktop-only"
      style={{ backgroundImage: `url(${background})` }}
    >
      <section className="tc-stage" aria-label="Tech Conclave, October 10-11">
        {/* colour blocks behind the robot */}
        <div className="tc-abs" style={{ ...box(55, 38, 280, 600), background: "#8585c8" }} />
        <div className="tc-abs" style={{ ...box(40, 588, 500, 170), background: "#c9559a" }} />

        {/* decorations */}
        <Plus style={box(-35, 250, 40, 40)} rotate={20} />
        <Plus style={box(1128, 42, 92, 92)} rotate={20} />

        {/* people grid */}
        {womanTiles.map((t, i) => (
          <React.Fragment key={`w${i}`}>
            <div className="tc-abs tc-shape" style={{ ...box(...t.shape), background: t.color }} />
            <img
              className="tc-abs tc-person"
              style={box(...t.img)}
              src={person1}
              alt={i === 0 ? "Speaker" : ""}
            />
          </React.Fragment>
        ))}
        {manTiles.map((t, i) => (
          <React.Fragment key={`m${i}`}>
            <div className="tc-abs tc-shape" style={{ ...box(...t.shape), background: t.color }} />
            <img
              className="tc-abs tc-person"
              style={box(...t.img)}
              src={person2}
              alt={i === 0 ? "Speaker" : ""}
            />
          </React.Fragment>
        ))}

        {/* stretched display type */}
        <svg
          className="tc-abs tc-type"
          style={{ inset: 0, width: "100%", height: "100%" }}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <text x="375" y="140" fontSize="135" fill="#ffffff" textLength="190" lengthAdjust="spacingAndGlyphs">
            TECH
          </text>
          <text
            transform="translate(560, 630) rotate(-90)"
            fontSize="250"
            fill="#6d7fff"
            textLength="480"
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

        {/* robot + hand */}
        <img className="tc-abs robot-img" style={box(-100, 10, 800, 800)} src={robot} alt="Waving robot" />
        <img className="tc-abs" style={box(390, 400, 420, 420)} src={hand} alt="" />

        {/* stars */}
        <img className="tc-abs" style={fbox(-200, 456, 250, 270)} src={bigStar} alt="" />
        <img className="tc-abs" style={fbox(-136, 650, 120, 145)} src={smallStar} alt="" />

        {/* right column */}
        <div className="tc-abs tc-hero-heading" style={box(1080, 230, 510, 450)} aria-label="Tech Conclave title">
          <span className="tc-hero-word">
            <span className="tc-hero-tech">TECH</span>
            <span className="tc-hero-conclave">CONCLAVE</span>
          </span>
        </div>
        <img className="tc-abs logo-img" style={box(990, 540, 500, 175)} src={logo} alt="Tech Conclave" />
        <p className="tc-abs tc-tagline" style={box(1112, 328, 420, 170)}>
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
   overlapping the pink block, hand overlapping the grid, stars/plus) is
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
  // interleaved so flex-wrap lands them green/pink, yellow/red, blue/purple
  const people = womanTiles.flatMap((w, i) => [
    { ...w, img: person1 },
    { ...manTiles[i], img: person2 },
  ]);

  return (
    <main className="tc-page tc-mobile-only" style={{ backgroundImage: `url(${background})` }}>
      <section className="tc-m-stage" aria-label="Tech Conclave, October 10-11">
        {/* ── visual group: title + illustration + eyebrow ── */}
        <div className="tc-m-panel tc-m-panel--visual">
          <div className="tc-m-titlewrap">
            <h1 className="tc-m-title">
              <span className="tc-m-tech">TECH</span>
              <span className="tc-m-conclave">CONCLAVE</span>
            </h1>
            
          </div>

          <div className="tc-m-hero">
            <div className="tc-abs" style={{ ...mbox(55, 0, 161, 265), background: "#8585c8" }} />
            <div className="tc-abs" style={{ ...mbox(20, 243, 280, 92), background: "#c9559a"}} />

            <Plus style={{ ...mbox(25, 60, 20, 25) }} rotate={20} />

            <div className="tc-abs tc-m-people" style={mbox(227, 0, 174, 231)} role="list" aria-label="Speakers">
              {people.map((t, i) => (
                <div className="tc-m-tile" style={{ background: t.color }} key={i} role="listitem">
                  <img className="tc-m-tile-img" src={t.img} alt="" />
                </div>
              ))}
            </div>

            <img className="tc-abs tc-m-robot" style={mbox(-8, 55, 233, 220)} src={robot} alt="Waving robot" />
            <img className="tc-abs" style={mbox(207, 185, 123, 90)} src={hand} alt="" />
            <img className="tc-abs" style={mbox(8, 170, 42, 65)} src={bigStar} alt="" />
            <img className="tc-abs" style={mbox(25, 225, 37, 45)} src={smallStar} alt="" />
          </div>

          <p className="tc-m-eyebrow">TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.</p>
        </div>

        {/* ── info group: date + logo lockup + tagline ── */}
        <div className="tc-m-panel tc-m-panel--info">
          <div className="tc-m-date">
            <span className="tc-m-oct">OCT</span>
            <span className="tc-m-days">10-11</span>
          </div>

          <div className="tc-m-footer">
            <img className="tc-m-logo" src={logo} alt="Tech Conclave" />
            <p className="tc-m-tagline">
              A space for inspiring personalities engaging conversations and unforgettable experiences.
            </p>
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
  overflow: hidden;
  background-color: #101014;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* toggle desktop vs mobile layout — no JS, no hydration flicker */
.tc-desktop-only { display: grid; }
.tc-mobile-only { display: none; }
@media (max-width: 1024px) {
  .tc-desktop-only { display: none; }
  .tc-mobile-only { display: grid; }
}

/* ============================ DESKTOP (unchanged) ============================ */

.tc-stage {
  position: relative;
  width: calc(min(100vw, 100vh * 1413 / 753) * var(--tc-scale));
  aspect-ratio: 1413 / 753;
  container-type: inline-size;
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
  font-size: clamp(5rem, 2.8vw, 5.2rem);
}

.tc-hero-tech { display: inline-block; color: #ffffff; font-size: 1em; font-weight: 400; }
.tc-hero-conclave { display: inline-block; color: #6d7fff; font-size: 1em; font-weight: 400; }

.robot-img { transform: translateX(-7.5%) scale(1.27); transform-origin: left center; }
.logo-img { transform: scale(1.65) translate(-1%, -3%); transform-origin: right center; z-index: 4; }

.tc-abs { position: absolute; display: block; object-fit: contain; }
.tc-shape { border-top-right-radius: 42%; }
.tc-person { object-fit: cover; object-position: center bottom; }
.tc-type text { font-family: "Bebas Neue", "Oswald", Impact, sans-serif; }

.tc-tagline {
  margin: 0;
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 400;
  font-size: 1.95cqw;
  line-height: 1.34;
  color: #e9e9f2;
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
.tc-m-panel--visual { flex: 3 1 380px; min-width: 300px; }
.tc-m-panel--info { flex: 1 1 240px; min-width: 220px; }

.tc-m-titlewrap { position: relative; }

.tc-m-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  line-height: 0.92;
  letter-spacing: -0.01em;
}
.tc-m-tech { color: #ffffff; font-size: clamp(2rem, 8vw, 2.6rem); font-family: "Bebas Neue", "Oswald", Impact, sans-serif;  }
.tc-m-conclave { color: #6d7fff; font-size: clamp(2.6rem, 10.5vw, 3.4rem); font-family: "Bebas Neue", "Oswald", Impact, sans-serif;  }

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
  text-align: center;
  font-family: "Space Grotesk", system-ui, sans-serif;
  letter-spacing: 0.16em;
  font-size: 11px;
  color: #cfcfe6;
}

.tc-m-date {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: #6d7fff;
}
.tc-m-oct {
  font-size: clamp(2.6rem, 9vw, 3.2rem);
  line-height: 1;
}
.tc-m-days {
  font-size: clamp(1.2rem, 4.5vw, 1.5rem);
}

.tc-m-footer { display: flex; flex-direction: column; gap: 10px; }
.tc-m-logo { height: 22px; width: auto; object-fit: contain; align-self: flex-start; }

.tc-m-tagline {
  margin: 0;
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  color: #e9e9f2;
  max-width: 34ch;
}

/* the actual "flex-wrap" grid: 2 columns, 3 rows, from wrapping 6 flex items */
.tc-m-people {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 6px;
}
.tc-m-tile {
  flex: 1 1 46%;
  aspect-ratio: 1 / 1;
  border-top-right-radius: 34%;
  overflow: hidden;
  position: relative;
}
.tc-m-tile-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
}
`;
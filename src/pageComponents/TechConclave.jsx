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
        <img className="tc-abs robot-img" style={box(-30, 100, 650, 650)} src={robot} alt="Waving robot" />
        <img className="tc-abs" style={box(410, 400, 390, 390)} src={hand} alt="" />

        {/* stars */}
        <img className="tc-abs" style={fbox(-160, 490, 200, 210)} src={bigStar} alt="" />
        <img className="tc-abs" style={fbox(-106, 650, 90, 115)} src={smallStar} alt="" />

        {/* right column */}
        <div className="tc-abs tc-hero-heading" style={box(1080, 230, 510, 450)} aria-label="Tech Conclave title">
          <span className="tc-hero-word">
            <span className="tc-hero-tech">TECH</span>
            <span className="tc-hero-conclave">CONCLAVE</span>
          </span>
        </div>
        <img className="tc-abs logo-img" style={box(970, 510, 220, 220)} src={logo} alt="Tech Conclave" />
        <p className="tc-abs tc-tagline" style={box(1112,328, 420, 170)}>
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
    <main className="tc-page tc-mobile-only" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})` }}>
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
            <div className="tc-abs" style={{ ...mbox(30, -7, 130, 280), background: "#8585c8" }} />
            <div className="tc-abs" style={{ ...mbox(30, 270, 280, 70), background: "#c9559a"}} />

            <Plus style={{ ...mbox(-10, 60, 27, 27) }} rotate={20} />

            <div className="tc-abs tc-m-people" style={mbox(215, -9, 174, 231)} role="list" aria-label="Speakers">
              {people.map((t, i) => (
                <div className="tc-m-tile" style={{ background: t.color }} key={i} role="listitem">
                  <img className="tc-m-tile-img" src={t.img} alt="" />
                </div>
              ))}
            </div>

            <img className="tc-abs tc-m-robot" style={mbox(-8, -75, 450, 450)} src={robot} alt="Waving robot" />
            <img className="tc-abs" style={mbox(260, 197, 170, 170)} src={hand} alt="" />
            <img className="tc-abs" style={mbox(-37, 210, 80, 80)} src={bigStar} alt="" />
            <img className="tc-abs" style={mbox(-21, 280, 50, 50)} src={smallStar} alt="" />
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
      className="tc-t-abs tc-t-plus"
      style={{ ...style, transform: `rotate(${rotate}deg)` }}
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <path d="M3.5 0h3v3.5H10v3H6.5V10h-3V6.5H0v-3h3.5z" fill="#7c3aed" />
    </svg>
  );
}

function TabletPoster() {
  const speakers = womanTiles.flatMap((woman, index) => [
    { ...woman, img: person1 },
    { ...manTiles[index], img: person2 },
  ]);

  return (
    <main className="tc-t-page" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})`}}>
      <section className="tc-t-stage" aria-label="Tech Conclave, October 10-11">
        <div className="tc-t-visual">
          <h1 className="tc-t-title">
            <span className="tc-t-tech">TECH</span>
            <span className="tc-t-conclave">CONCLAVE</span>
          </h1>

          <div className="tc-t-art">
            <div className="tc-t-abs tc-t-block" style={{ ...mbox(30, -7, 130, 280), background: "#8585c8" }} />
            <div className="tc-t-abs tc-t-pink-block" style={{ ...mbox(30, 270, 280, 70), background: "#c9559a" }} />
            <TabletPlus style={mbox(-10, 60, 27, 27)} rotate={20} />
            <div className="tc-t-abs tc-t-speakers" style={mbox(215, -9, 174, 231)} role="list" aria-label="Speakers">
              {speakers.map((speaker, index) => (
                <div className="tc-t-speaker" style={{ background: speaker.color }} key={index} role="listitem">
                  <img className="tc-t-speaker-img" src={speaker.img} alt="" />
                </div>
              ))}
            </div>
            <img className="tc-t-abs tc-t-robot" style={mbox(-8, -75, 450, 450)} src={robot} alt="Waving robot" />
            <img className="tc-t-abs tc-t-hand" style={mbox(260, 197, 170, 170)} src={hand} alt="" />
            <img className="tc-t-abs tc-t-star" style={mbox(-37, 210, 80, 80)} src={bigStar} alt="" />
            <img className="tc-t-abs tc-t-star" style={mbox(-21, 280, 50, 50)} src={smallStar} alt="" />
          </div>

          <p className="tc-t-eyebrow">TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.</p>
        </div>

        <div className="tc-t-info">
          <div className="tc-t-lockup">
            <h2 className="tc-t-name">
              <span className="tc-t-name-tech">TECH</span>{" "}
              <span className="tc-t-name-conclave">CONCLAVE</span>
            </h2>
            <p className="tc-t-description">
              A space for inspiring personalities, engaging conversations, and unforgettable experiences.
            </p>
          </div>
          <div className="tc-t-date" aria-label="October 10-11">
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
  overflow-x: hidden; /* Prevents horizontal wiggle without locking vertical scroll */
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
  font-size: clamp(5rem, 2.8vw, 5.2rem);
}

.tc-hero-tech { display: inline-block; color: #ffffff; font-size: 1em; font-weight: 400; }
.tc-hero-conclave { display: inline-block; color: #6d7fff; font-size: 1em; font-weight: 400; }

.robot-img { transform: translateX(-7.5%) scale(1.27); transform-origin: left center; }
// .logo-img { transform: scale(1.65) translate(-1%, -3%); transform-origin: right center; z-index: 4; }

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
  color: #8484C8;
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
  gap: 11px;
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
/*-------------------------------TABLETS----------------------------------------------*/
.tc-t-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
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
  justify-content: space-between;
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

.tc-t-visual { flex: 1 1 auto; justify-content: center; }
.tc-t-info {
  flex-direction: row;
  align-items: flex-end;
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
}

.tc-t-conclave {
  color: #7787ff;
  font-family: "Syne", sans-serif;
  font-size: clamp(2.6rem, 8vw, 5.4rem);
  font-weight: 800;
  line-height: 0.96;
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
.tc-t-robot { z-index: 2; object-fit: cover; }
.tc-t-hand { z-index: 4; object-fit: contain; }
.tc-t-star { z-index: 5; }

.tc-t-speakers {
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 7px;
}

.tc-t-speaker {
  position: relative;
  flex: 1 1 46%;
  aspect-ratio: 1;
  overflow: hidden;
  border-top-right-radius: 32%;
}

.tc-t-speaker-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
}

.tc-t-eyebrow {
  margin: 8px 0 0 24px;
  color: #8484c8;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(25px, 2.4vw, 24px);
  transform: translateX(21px)
}

.tc-t-lockup { max-width: 34ch; }
.tc-t-kicker {
  margin: 0 0 12px;
  color: #c9559a;
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
  transform:translateY(-110px);
}

  .tc-t-name-tech { color: #ffffff; }
  .tc-t-name-conclave { color: #7787ff; }

.tc-t-description {
  margin: 16px 0 0;
  color: #e9e9f2;
  font-size: clamp(18px, 2.4vw, 24px);
  line-height: 1.45;
  transform:translateY(-110px);
}

.tc-t-date {
  display: flex;
  align-items: baseline;
  gap: clamp(8px, 1.5vw, 16px);
  white-space: nowrap;
  color: #7787ff;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  transform:translateY(-150px);
}

.tc-t-oct {
  font-size: clamp(6rem, 17vw, 11rem);
  line-height: 0.9;
}

.tc-t-days {
  font-size: clamp(2.8rem, 8vw, 6rem);
  line-height: 0.9;
}

/* toggle desktop vs mobile layout — no JS, no hydration flicker */
.tc-desktop-only { display: grid; }
.tc-mobile-only { display: none; }
.tc-t-page { display: none; }
@media (max-width: 1024px) {
  .tc-desktop-only { display: none; }
  .tc-mobile-only { display: grid; }
}

@media (min-width: 640px) and (max-width: 1024px) and (pointer: coarse) {
  .tc-mobile-only { display: none; }
  .tc-t-page { display: block; }
}

`;
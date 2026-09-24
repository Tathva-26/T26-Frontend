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
  The layout is drawn on a 1550 x 815 canvas. Every element is positioned
  in percentages of that canvas, so the whole poster scales with the screen.
*/
const W = 1550;
const H = 815;
const box = (x, y, w, h) => ({
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
  width: `${(w / W) * 100}%`,
  height: `${(h / H) * 100}%`,
});

// Figma frame size. figma(x, y, w, h) takes Figma values as they are and
// converts them to this canvas, so you can paste dimensions straight in.
const FIGMA_W = 1413;
const FIGMA_H = 753;
const figma = (x, y, w, h) =>
  box((x / FIGMA_W) * W, (y / FIGMA_H) * H, (w / FIGMA_W) * W, (h / FIGMA_H) * H);

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

export default function TechConclave() {
  return (
    <main className="tc-page">
      <style>{css}</style>

      <section
        className="tc-stage"
        style={{ backgroundImage: `url(${background})` }}
        aria-label="Tech Conclave, October 10-11"
      >
        {/* colour blocks behind the robot */}
        <div className="tc-abs" style={{ ...box(108, 38, 275, 552), background: "#8585c8" }} />
        <div className="tc-abs" style={{ ...box(92, 588, 495, 150), background: "#c9559a" }} />

        {/* decorations */}
        <Plus style={box(34, 240, 34, 35)} />
        <Plus style={box(1128, 42, 92, 92)} rotate={-20} />

        {/* people grid */}
        {womanTiles.map((t, i) => (
          <React.Fragment key={`w${i}`}>
            <div
              className="tc-abs tc-shape"
              style={{ ...box(...t.shape), background: t.color }}
            />
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
            <div
              className="tc-abs tc-shape"
              style={{ ...box(...t.shape), background: t.color }}
            />
            <img
              className="tc-abs tc-person"
              style={box(...t.img)}
              src={person2}
              alt={i === 0 ? "Speaker" : ""}
            />
          </React.Fragment>
        ))}

        {/* stretched display type: textLength fits each word to its exact box */}
        <svg
          className="tc-abs tc-type"
          style={{ inset: 0, width: "100%", height: "100%" }}
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
        >
          <text
            x="388"
            y="125"
            fontSize="121"
            fill="#ffffff"
            textLength="185"
            lengthAdjust="spacingAndGlyphs"
          >
            TECH
          </text>
          <text
            transform="translate(565 570) rotate(-90)"
            fontSize="236"
            fill="#6d7fff"
            textLength="430"
            lengthAdjust="spacingAndGlyphs"
          >
            CONCLAVE
          </text>
          <text
            x="1063"
            y="738"
            fontSize="147"
            fill="#6d7fff"
            textLength="158"
            lengthAdjust="spacingAndGlyphs"
          >
            OCT
          </text>
          <text
            x="1258"
            y="722"
            fontSize="72"
            fill="#6d7fff"
            textLength="122"
            lengthAdjust="spacingAndGlyphs"
          >
            10-11
          </text>
        </svg>

        {/* robot + hand (drawn over the title text) */}
        <img className="tc-abs" style={box(-15, 190, 585, 552)} src={robot} alt="Waving robot" />
        <img className="tc-abs" style={box(518, 478, 255, 275)} src={hand} alt="" />

        {/* stars on the robot's left side (Figma dimensions) */}
        <img className="tc-abs" style={figma(-7, 456, 152, 190)} src={bigStar} alt="" />
        <img className="tc-abs" style={figma(19, 587, 99.96, 125)} src={smallStar} alt="" />

        {/* right column */}
        <img className="tc-abs" style={box(1097, 240, 393, 65)} src={logo} alt="Tech Conclave" />
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

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500&display=swap");

.tc-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0d0d10;
  margin: 0;
}

.tc-stage {
  position: relative;
  overflow: hidden;
  width: min(100vw, calc(100vh * 1550 / 815));
  aspect-ratio: 1550 / 815;
  container-type: inline-size;
  background-color: #101014;
  background-size: cover;
  background-position: center;
}

.tc-abs {
  position: absolute;
  display: block;
}

.tc-shape {
  border-top-right-radius: 42%;
}

.tc-person {
  object-fit: cover;
  object-position: center bottom;
}

.tc-type text {
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif;
}

.tc-tagline {
  margin: 0;
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 400;
  font-size: 1.95cqw;
  line-height: 1.34;
  color: #e9e9f2;
}
`;
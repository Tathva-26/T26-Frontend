import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { POWER_LINE } from "@/lib/consoleScreen/spaceShooterScreen";
import { CONSOLE_SCREEN_INSET, PULLBACK_OVERSHOOT, SEQUENCE } from "@/pageComponents/GPC/gpcConfig";
import { createWheelsPreview } from "@/pageComponents/GPC/wheelsPreview";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TITLE_HOT = "#e2b6ff";
const TITLE_GLOW = "0 0 0.35em rgba(190, 110, 255, 0.95), 0 0 0.9em rgba(140, 70, 255, 0.7)";
const NO_GLOW = "0 0 0em rgba(190, 110, 255, 0), 0 0 0em rgba(140, 70, 255, 0)";

// The old-TV switch-off, in the colours of the screen's own switch-on.
const TUBE_WASH = "212, 176, 255";
const TUBE_HALO = "201, 167, 255";
const TUBE_LINE = 0.012; // the bright line's thickness, as a share of the screen's height

// The Wheels footage is 1920x1080. Its canvas is drawn at that size, or at
// half of it on screens narrower than `below` px.
const FILM_RATIO = { width: 1920, height: 1080 };
const FILM_SMALL = { below: 768, width: 960 };

// The screen's corner radii as a share of its own width / height.
const [RADIUS_X, RADIUS_Y] = CONSOLE_SCREEN_INSET.radius.split("/").map((part) => parseFloat(part) / 100);

// How long the "[CLICK TO PLAY]" prompt takes to fade out, in % of the scroll.
const LABEL_FADE = 2;

const at = ([start]) => start;
const span = ([start, end]) => end - start;

// A clip that keeps a `width` x `height` box except for a rounded rectangle:
// a hole exactly where the console's screen is.
function holeClip(width, height, { x, y, w, h }) {
  const rx = w * RADIUS_X;
  const ry = h * RADIUS_Y;
  const corner = (toX, toY) => `A${rx} ${ry} 0 0 1 ${toX} ${toY}`;
  return [
    `path(evenodd, "M0 0H${width}V${height}H0Z`,
    `M${x + rx} ${y}H${x + w - rx}${corner(x + w, y + ry)}`,
    `V${y + h - ry}${corner(x + w - rx, y + h)}`,
    `H${x + rx}${corner(x, y + h - ry)}`,
    `V${y + ry}${corner(x + rx, y)}Z")`,
  ].join(" ");
}

/**
 * The home page scroll sequence. While the tall track scrolls past, the stage
 * stays stuck to the screen and this plays, scrubbed by the scroll position:
 *
 *   in    - the stage starts on top of the section above, zoomed so far into
 *           the console that all you see is that page, through the hole where
 *           the console's screen is. The camera pulls back: the bezel comes
 *           in from the edges, then the whole hero, with that page still
 *           showing on the console's screen.
 *   off   - that picture switches off like an old TV: the hole closes from
 *           top and bottom to a bright line, and the line shrinks to nothing.
 *           (Where the page above keeps scrolling instead of holding still,
 *           the order changes: it switches off first, the screen switches
 *           on to the game, and the camera pulls back from that. See
 *           SEQUENCE in gpcConfig.)
 *   on    - the reverse, drawn by the screen itself: it switches on to the
 *           game. The title flickers on.
 *   rest  - today's hero, where the game is played.
 *   out   - the screen announces Wheels and fills a loading bar, then plays
 *           Wheels' own footage (see wheelsPreview) while the camera pushes
 *           into the screen until that footage fills the view. Wheels itself
 *           has been coming up underneath; once it is stuck full-screen the
 *           two pictures coincide and the hero fades out.
 *
 * Nothing here pins anything - the stage is `position: sticky`, as in the
 * site's other sections. Every tween ends at the element's natural state, so
 * with the sequence off (the /gpc route, reduced motion) the hero is simply
 * the finished hero.
 *
 * `sequence` is a ref holding the values the console's screen canvas reads
 * every frame: { power, outro, film, picture }.
 */
export function useGpcScrollSequence({ trackRef, stageRef, layout, sequence }) {
  useGSAP(
    () => {
      const track = trackRef.current;
      const stage = stageRef.current;
      const scroller = track?.closest(".main-scroll");
      const live = sequence.current;
      if (!layout || !track || !stage || !scroller) return undefined;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

      const find = (name) => stage.querySelector(`[data-gpc="${name}"]`);
      const hero = find("hero");
      const screen = find("screen");
      const consoleBox = find("console");
      const label = find("label");
      const tagline = find("tagline");
      const film = find("film");
      const flash = find("flash");
      const letters = stage.querySelectorAll('[data-gpc="letter"]');
      if (!hero || !screen || !consoleBox || !label || !tagline || !film || !flash) return undefined;

      // Measured now, while nothing is transformed yet (this whole callback is
      // reverted and re-run whenever the layout changes size or mode).
      const heroBox = hero.getBoundingClientRect();
      const screenBox = screen.getBoundingClientRect();
      const trackBox = track.getBoundingClientRect();
      const { width, height } = heroBox;
      // The track starts this far before the section above lets go of its
      // stuck stage (--gpc-lead): if at all, that page holds still meanwhile.
      const headStart = -parseFloat(getComputedStyle(track).marginTop) - height;
      const entry = headStart > 1 ? SEQUENCE.entry : SEQUENCE.entryScrolling;
      const hole = {
        x: screenBox.left - heroBox.left,
        y: screenBox.top - heroBox.top,
        w: screenBox.width,
        h: screenBox.height,
      };
      const centerX = hole.x + hole.w / 2;
      const centerY = hole.y + hole.h / 2;

      // Both zooms scale the hero about the middle of the console's screen.
      gsap.set(hero, { transformOrigin: `${centerX}px ${centerY}px` });

      // In: the screen, as a hole, covers the whole view and sits in its middle.
      const pulledIn = {
        x: width / 2 - centerX,
        y: height / 2 - centerY,
        scale: Math.max(width / hole.w, height / hole.h) * PULLBACK_OVERSHOOT,
      };

      // Off: how much of that picture is left, 1 (all of it) to 0. The exact
      // reverse of the screen's switch-on: it closes from top and bottom to a
      // line, burning brighter as it does, then the line shrinks to nothing.
      const tube = { on: 1 };
      const lineHeight = Math.max(2, hole.h * TUBE_LINE);
      // (`scale` is the hero's zoom: the line starts as wide as the part of
      // the screen that is in view, so it is seen shrinking even zoomed in.)
      function tubeBand(scale) {
        if (tube.on <= 0) return null;
        if (tube.on <= POWER_LINE) {
          const w = Math.min(hole.w, width / scale) * (tube.on / POWER_LINE);
          return { x: centerX - w / 2, y: centerY - lineHeight / 2, w, h: lineHeight, line: true };
        }
        const open = (tube.on - POWER_LINE) / (1 - POWER_LINE);
        const h = Math.max(lineHeight, hole.h * Math.pow(open, 1.3));
        return { x: hole.x, y: centerY - h / 2, w: hole.w, h, wash: Math.pow(1 - open, 1.2) * 0.95, edge: (1 - open) * 0.9 };
      }

      // Out: the footage is a 16:9 picture on a screen that is less wide than
      // that, so it is shown letterboxed: as wide as the screen, with a dark
      // bar above and below (the screen's own canvas draws the same thing
      // underneath). It never leaves the console's frame, and the push ends
      // with it exactly on Wheels' own picture. That picture covers the whole
      // view, so by then the frame has gone out of it on every side.
      const wheels = preview();
      const picture = wheels.pinnedPicture(width, height);
      const filmHeight = (hole.w * FILM_RATIO.height) / FILM_RATIO.width;
      const pushedIn = {
        x: picture.centerX - centerX,
        y: picture.centerY - centerY,
        scale: picture.height / filmHeight,
      };

      // The footage canvas, sharp at any zoom.
      film.width = window.innerWidth <= FILM_SMALL.below ? FILM_SMALL.width : FILM_RATIO.width;
      film.height = (film.width * FILM_RATIO.height) / FILM_RATIO.width;
      const filmContext = film.getContext("2d");
      let filmShown = null;
      // Browsers snap a canvas's box to whole pixels, and the push would
      // magnify that half pixel severalfold. So its box is given whole-pixel
      // sizes, and a transform puts it in its exact place at its exact size.
      const box = { width: Math.round(hole.w), height: Math.round(filmHeight) };
      gsap.set(film, {
        ...box,
        transformOrigin: "0 0",
        x: hole.x,
        y: centerY - filmHeight / 2,
        scaleX: hole.w / box.width,
        scaleY: filmHeight / box.height,
        visibility: "visible",
      });

      // The handoff is the last stretch of the scroll, the part Wheels spends
      // already stuck underneath: however much further than one screen its
      // top edge sits above the end of the track.
      const travel = trackBox.height - height;
      const lead = wheels.section ? trackBox.bottom - wheels.section.getBoundingClientRect().top - height : 0;
      const handoff = [gsap.utils.clamp(SEQUENCE.diveStart + 10, 99, 100 * (1 - lead / travel)), 100];
      const dive = [SEQUENCE.diveStart, handoff[0]];

      // Not playable until its screen is on. Set outright, not as a step in
      // the timeline, so it already holds at the very top of the scroll.
      gsap.set(consoleBox, { pointerEvents: "none" });

      // Positions are % of the pinned scroll.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: sync,
        scrollTrigger: {
          scroller,
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          // Lenis already smooths the scroll; a numeric scrub would add a second lag.
          scrub: true,
        },
      });

      // What the timeline can't tween: the hole and the glow over it follow
      // what is left of the picture, and the footage frame follows Wheels.
      function sync() {
        const scale = gsap.getProperty(hero, "scale");
        const band = tubeBand(scale);
        hero.style.clipPath = band && !band.line ? holeClip(width, height, band) : "";
        if (!band || tube.on >= 1) {
          flash.style.visibility = "hidden";
        } else {
          // The glow is outside the hero, so it is put where the hero's
          // zoom currently shows the band.
          const left = centerX + (band.x - centerX) * scale + gsap.getProperty(hero, "x");
          const top = centerY + (band.y - centerY) * scale + gsap.getProperty(hero, "y");
          const line = lineHeight * scale;
          Object.assign(flash.style, {
            visibility: "visible",
            transform: `translate(${left}px, ${top}px)`,
            width: `${band.w * scale}px`,
            height: `${band.h * scale}px`,
            borderRadius: band.line ? `${line}px` : CONSOLE_SCREEN_INSET.radius,
            background: band.line ? "#ffffff" : `rgba(${TUBE_WASH}, ${band.wash})`,
            boxShadow: band.line
              ? `0 0 ${line * 3}px ${line}px rgba(${TUBE_HALO}, 0.7)`
              : `inset 0 ${line}px rgba(255, 255, 255, ${band.edge}), inset 0 -${line}px rgba(255, 255, 255, ${band.edge}), 0 0 ${line * 4}px rgba(${TUBE_HALO}, ${band.edge * 0.6})`,
          });
        }
        if (live.film <= 0) return;
        const image = wheels.image();
        live.picture = image;
        if (image && image !== filmShown) {
          filmContext.drawImage(image, 0, 0, film.width, film.height);
          filmShown = image;
        }
      }

      // In: an even zoom out that settles gently. (Zoom is felt as a ratio,
      // so easing the scale itself this much is what keeps it even; anything
      // stronger does nearly all of the pull-back in its first few steps.)
      tl.fromTo(hero, pulledIn, { x: 0, y: 0, scale: 1, duration: span(entry.pullback), ease: "power1.out" }, at(entry.pullback));

      // Off: fast at first, like the picture snapping shut.
      tl.fromTo(tube, { on: 1 }, { on: 0, duration: span(entry.off), ease: "power1.out" }, at(entry.off));

      // On: the screen switches on. It can be played once it is on and the
      // camera has pulled all the way back, whichever comes last.
      const power = entry.power ?? SEQUENCE.power;
      const ready = Math.max(power[1], entry.pullback[1]);
      tl.fromTo(live, { power: 0 }, { power: 1, duration: span(power), ease: "power1.in" }, at(power))
        .fromTo(label, { opacity: 0 }, { opacity: 1, duration: 3 }, ready)
        .fromTo(consoleBox, { pointerEvents: "none" }, { pointerEvents: "auto", duration: 0.01 }, ready);

      // The title: each letter flickers on like a neon tube, hot then white.
      const letterTime = span(SEQUENCE.title) / (letters.length + 1);
      letters.forEach((letter, i) => {
        tl.fromTo(
          letter,
          { opacity: 0, color: TITLE_HOT, textShadow: TITLE_GLOW },
          {
            keyframes: {
              "20%": { opacity: 1 },
              "35%": { opacity: 0.25 },
              "55%": { opacity: 1, color: TITLE_HOT, textShadow: TITLE_GLOW },
              "100%": { color: "#ffffff", textShadow: NO_GLOW },
              easeEach: "none",
            },
            duration: letterTime * 2,
          },
          at(SEQUENCE.title) + i * letterTime
        );
      });

      tl.fromTo(
        tagline,
        { opacity: 0, clipPath: "inset(0% 100% 0% 0%)" },
        { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: span(SEQUENCE.tagline) },
        at(SEQUENCE.tagline)
      );

      // Out: the announcement and loading bar, then the footage. The prompt
      // has faded out by the time the announcement starts in the same spot.
      tl.to(label, { opacity: 0, duration: LABEL_FADE }, at(SEQUENCE.outro) - LABEL_FADE)
        .to(consoleBox, { pointerEvents: "none", duration: 0.01 }, at(SEQUENCE.outro))
        .fromTo(live, { outro: 0 }, { outro: 1, duration: span(SEQUENCE.outro) }, at(SEQUENCE.outro))
        .fromTo(live, { film: 0 }, { film: 1, duration: span(SEQUENCE.film) }, at(SEQUENCE.film))
        .fromTo(film, { opacity: 0 }, { opacity: 1, duration: span(SEQUENCE.film) }, at(SEQUENCE.film));

      // The push in. (immediateRender off: this is the hero's second tween,
      // and must not apply its start values now.)
      tl.fromTo(
        hero,
        { x: 0, y: 0, scale: 1 },
        { ...pushedIn, duration: span(dive), ease: "power2.in", immediateRender: false },
        at(dive)
      );

      // The handoff: Wheels is full-screen underneath now, showing the same
      // picture, so the hero just fades away and stops taking clicks. The
      // fade ends a little before the scroll does, so it is fully gone even
      // if the scroll position lands a fraction short of the end.
      // (The closing `set` keeps the timeline exactly 100 long, which is what
      // makes every position above a percentage of the scroll.)
      tl.to(hero, { pointerEvents: "none", duration: 0.01 }, at(handoff))
        .to(hero, { opacity: 0, duration: span(handoff) * 0.85 }, at(handoff))
        .set(hero, { opacity: 0 }, 100);

      sync();

      // What GSAP's own revert doesn't undo: values on the plain `live`
      // object and the styles set directly on the hero and the glow.
      return () => {
        Object.assign(live, { power: 1, outro: 0, film: 0, picture: null });
        hero.style.clipPath = "";
        flash.removeAttribute("style");
      };
    },
    { scope: stageRef, dependencies: [layout], revertOnUpdate: true }
  );
}

// One set of preloaded frames is enough however often the sequence is rebuilt.
let wheelsPreview = null;
function preview() {
  if (!wheelsPreview?.section?.isConnected) wheelsPreview = createWheelsPreview();
  return wheelsPreview;
}

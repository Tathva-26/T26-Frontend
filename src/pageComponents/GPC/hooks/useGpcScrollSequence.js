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
 * The home page GPC sequence. Scrolling down from the last artist glides the
 * page to the spot where GPC fills the screen and holds it there while the
 * entry plays as a time-based timeline: the camera pulls back out of the TV
 * (which was showing the Artist page), the picture switches off, the screen
 * switches on to the game, the title flickers on and the tagline slides in.
 * The outro (Wheels transition, dive, handoff) remains scroll-driven.
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

      // In: the screen, as a hole, covers the whole view and sits in its middle,
      // so all that shows is the Artist page, seen through the console's screen.
      const pulledIn = {
        x: width / 2 - centerX,
        y: height / 2 - centerY,
        scale: Math.max(width / hole.w, height / hole.h) * PULLBACK_OVERSHOOT,
      };

      // Off: how much of that picture is left, 1 (all of it) to 0. It closes
      // from top and bottom to a bright line, then the line shrinks to
      // nothing: the exact reverse of the screen's own switch-on.
      const tube = { on: 1 };
      const lineHeight = Math.max(2, hole.h * 0.012);
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

      // Out: the footage canvas and the push-in zoom target.
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

      // Handoff: where Wheels is already stuck underneath.
      const travel = trackBox.height - height;
      const lead = wheels.section ? trackBox.bottom - wheels.section.getBoundingClientRect().top - height : 0;
      const handoff = [gsap.utils.clamp(SEQUENCE.diveStart + 10, 99, 100 * (1 - lead / travel)), 100];
      const dive = [SEQUENCE.diveStart, handoff[0]];

      // ── Entry state: the camera is inside the console's screen, which still shows the Artist page ──
      gsap.set(hero, pulledIn);
      live.power = 0;
      gsap.set(consoleBox, { pointerEvents: "none" });
      gsap.set(label, { opacity: 0 });
      gsap.set(tagline, { opacity: 0, clipPath: "inset(0% 100% 0% 0%)" });
      letters.forEach((letter) => gsap.set(letter, { opacity: 0 }));

      // ── ENTRY (time-based keyframes) ──
      // Plays once GPC has landed (see `land` below): the camera pulls back out of the console's
      // screen, which was showing the Artist page; that picture switches off like an old TV; the
      // screen switches on to the game; the title flickers on and the tagline slides in.
      let phase = "idle"; // idle -> landing -> playing -> done
      const entryTl = gsap.timeline({
        paused: true,
        onUpdate: sync,
        onComplete: () => {
          phase = "done";
          window.__lenis?.start();
        },
      });

      // Pull back. Quick at first, easing as the hero comes to rest.
      entryTl.fromTo(hero, pulledIn, { x: 0, y: 0, scale: 1, duration: 1.6, ease: "power3.out" }, 0);

      // Switch off: the picture closes to a bright line (the first beat), then the line shrinks
      // to nothing (the second), with a held breath on the line in between.
      entryTl.fromTo(
        tube,
        { on: 1 },
        {
          keyframes: { "65%": { on: POWER_LINE }, "100%": { on: 0 }, easeEach: "power1.inOut" },
          duration: 0.75,
        },
        ">0.2"
      );

      // Switch on to the game, then the prompt, and the console can be played.
      entryTl.fromTo(live, { power: 0 }, { power: 1, duration: 0.9, ease: "power1.in" }, ">0.15");
      entryTl.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.4 }, ">-0.1");
      entryTl.fromTo(consoleBox, { pointerEvents: "none" }, { pointerEvents: "auto", duration: 0.01 }, "<");

      // Title: each letter flickers on like a neon tube, hot then white.
      const letterDur = 0.15;
      letters.forEach((letter, i) => {
        entryTl.fromTo(
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
            duration: letterDur * 2.5,
          },
          i === 0 ? "-=0.2" : `>-${letterDur}`
        );
      });

      // Tagline slides in from the right.
      entryTl.fromTo(
        tagline,
        { opacity: 0, clipPath: "inset(0% 100% 0% 0%)" },
        { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );

      // ── LANDING SNAP ──
      // However hard the page was scrolled, it can't carry past GPC: as soon as GPC starts sliding
      // over the last artist, the scroll glides to the exact spot where its stage is fully in
      // view, then is held still (Lenis stopped) while the entry plays out, so the whole
      // transition is seen. Scrolling back above GPC re-arms it for the next time.
      const landing = ScrollTrigger.create({
        scroller,
        trigger: track,
        start: "top bottom",
        end: "top top",
        onEnter: land,
        onLeaveBack: reset,
      });

      function play() {
        phase = "playing";
        window.__lenis?.stop();
        entryTl.restart();
      }

      function land() {
        if (phase !== "idle") return;
        phase = "landing";
        const lenis = window.__lenis;
        if (!lenis) {
          play();
          return;
        }
        lenis.scrollTo(landing.end, {
          duration: 0.9,
          lock: true,
          force: true,
          easing: (progress) => 1 - Math.pow(1 - progress, 3),
          onComplete: play,
        });
      }

      function reset() {
        if (phase === "idle") return;
        phase = "idle";
        entryTl.pause(0);
        sync();
        window.__lenis?.start();
      }

      // Already at or past the landing spot (reloaded or re-measured mid-page): show it finished.
      if (landing.scroll() >= landing.end) {
        phase = "done";
        entryTl.progress(1);
      }

      // ── SCROLL-DRIVEN OUTRO ──
      // The Wheels transition, dive, and handoff remain scroll-driven.
      function sync() {
        const scale = gsap.getProperty(hero, "scale");
        const band = tubeBand(scale);
        hero.style.clipPath = band && !band.line ? holeClip(width, height, band) : "";
        if (!band || tube.on >= 1) {
          flash.style.visibility = "hidden";
        } else {
          const left = centerX + (band.x - centerX) * scale + gsap.getProperty(hero, "x");
          const top = centerY + (band.y - centerY) * scale + gsap.getProperty(hero, "y");
          const line = lineHeight * scale;
          Object.assign(flash.style, {
            visibility: "visible",
            transform: `translate(${left}px, ${top}px)`,
            width: `${band.w * scale}px`,
            height: `${band.h * scale}px`,
            borderRadius: band.line ? `${line}px` : CONSOLE_SCREEN_INSET.radius,
            background: band.line ? "#ffffff" : `rgba(212, 176, 255, ${band.wash})`,
            boxShadow: band.line
              ? `0 0 ${line * 3}px ${line}px rgba(201, 167, 255, 0.7)`
              : `inset 0 ${line}px rgba(255, 255, 255, ${band.edge}), inset 0 -${line}px rgba(255, 255, 255, ${band.edge}), 0 0 ${line * 4}px rgba(201, 167, 255, ${band.edge * 0.6})`,
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

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: sync,
        scrollTrigger: {
          scroller,
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      // Outro: announcement, loading bar, footage. The label fades out first.
      tl.to(label, { opacity: 0, duration: LABEL_FADE }, at(SEQUENCE.outro) - LABEL_FADE)
        .to(consoleBox, { pointerEvents: "none", duration: 0.01 }, at(SEQUENCE.outro))
        .fromTo(live, { outro: 0 }, { outro: 1, duration: span(SEQUENCE.outro) }, at(SEQUENCE.outro))
        .fromTo(live, { film: 0 }, { film: 1, duration: span(SEQUENCE.film) }, at(SEQUENCE.film))
        .fromTo(film, { opacity: 0 }, { opacity: 1, duration: span(SEQUENCE.film) }, at(SEQUENCE.film));

      // The push in toward the Wheels footage.
      tl.fromTo(
        hero,
        { x: 0, y: 0, scale: 1 },
        { ...pushedIn, duration: span(dive), ease: "power2.in", immediateRender: false },
        at(dive)
      );

      // The handoff: Wheels is full-screen underneath, so the hero fades away.
      tl.to(hero, { pointerEvents: "none", duration: 0.01 }, at(handoff))
        .to(hero, { opacity: 0, duration: span(handoff) * 0.85 }, at(handoff))
        .set(hero, { opacity: 0 }, 100);

      sync();

      // What GSAP's own revert doesn't undo.
      return () => {
        window.__lenis?.start();
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

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

// Leaving GPC upwards plays the entry backwards, this many times faster.
const EXIT_SPEED = 1.8;
// The wheel (or a finger) has to be quiet for this long before whatever is scrolled next counts
// as a new gesture rather than the tail of the one that brought the page here.
const GESTURE_GAP_MS = 180;
// How much upward scroll, in one gesture, it takes to leave GPC from its resting spot.
const EXIT_INTENT_PX = 40;
// Where the page is left after exiting, as a share of the screen above the point where GPC
// starts to slide in: inside the last artist's hold, so nothing there moves.
const EXIT_REST = 0.15;

const easeOut = (progress) => 1 - Math.pow(1 - progress, 3);

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
 * Going back up is the same thing in reverse. Scrolling up through the outro
 * stops dead at GPC's resting spot however hard it was scrolled, and the rest
 * of that gesture is swallowed. Only a fresh scroll up from there leaves: the
 * screen switches back on to the Artist page, the camera pushes into it, and
 * the page is handed back to the last artist.
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
      let phase = "idle"; // idle -> landing -> playing -> done -> exiting -> idle
      // State of the hold / gate / brake / exit helpers further down. Declared up here because
      // the landing trigger can call into them as soon as it is created.
      const touchScreen = window.matchMedia("(pointer: coarse)").matches;
      let gated = false;
      let gateTimer = 0;
      let touching = false;
      let braking = false;
      let intent = 0; // upward scroll collected over one gesture while at rest
      let intentTimer = 0;
      const entryTl = gsap.timeline({
        paused: true,
        onUpdate: sync,
        // The scroll that brought the page here may still be going: swallow the rest of it.
        onComplete: () => {
          phase = "done";
          gate();
        },
        onReverseComplete: leave,
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

      // ── HOLD / GATE ──
      // Hold: the page can't be scrolled by the user at all. Lenis swallows the wheel while it is
      // stopped; a touch fling is native momentum it has no say over, so on touch screens the
      // scroller itself is also frozen (programmatic scrolling still works).
      function hold() {
        window.__lenis?.stop();
        if (touchScreen) scroller.style.overflowY = "hidden";
      }
      function release() {
        if (touchScreen) scroller.style.overflowY = "";
        window.__lenis?.start();
      }

      // Gate: a hold that lasts until the current gesture has died down (see GESTURE_GAP_MS), so
      // the tail of one scroll can't be read as the start of the next.
      function gate() {
        gated = true;
        hold();
        armGate();
      }
      function armGate() {
        window.clearTimeout(gateTimer);
        gateTimer = window.setTimeout(openGate, GESTURE_GAP_MS);
      }
      function openGate() {
        if (touching) {
          armGate();
          return;
        }
        gated = false;
        intent = 0;
        release();
      }
      function dropGate() {
        window.clearTimeout(gateTimer);
        gated = false;
        intent = 0;
      }

      function play() {
        phase = "playing";
        hold();
        entryTl.timeScale(1).restart();
      }

      function land() {
        if (phase !== "idle") return;
        phase = "landing";
        dropGate();
        hold();
        const lenis = window.__lenis;
        if (!lenis) {
          scroller.scrollTop = landing.end;
          play();
          return;
        }
        lenis.scrollTo(landing.end, { duration: 0.9, lock: true, force: true, easing: easeOut, onComplete: play });
      }

      function reset() {
        if (phase === "idle") return;
        phase = "idle";
        dropGate();
        // Paused before the speed is put back: a positive timeScale on a reversed timeline
        // would set it playing forwards again.
        entryTl.pause(0).timeScale(1);
        sync();
        release();
      }

      // ── BRAKE ──
      // GPC at rest is the top of its own scroll. Anything that carries the page above it (a hard
      // scroll up out of the Wheels transition, a drag) is put straight back and swallowed, so
      // the page can never drift out between GPC and the artists; the only way up is exit().
      function brake() {
        if (braking || phase !== "done") return;
        const top = landing.end;
        const scroll = scroller.scrollTop;
        if (scroll >= top - 0.5 || scroll < landing.start) return;
        braking = true;
        hold();
        const lenis = window.__lenis;
        lenis?.scrollTo(top, { immediate: true, force: true });
        if (scroller.scrollTop < top - 0.5) scroller.scrollTop = top;
        gate();
        braking = false;
      }

      // ── EXIT ──
      // A fresh scroll up at rest: the entry plays backwards, then the page glides up to the last
      // artist, which is what the console's screen has just zoomed into, so nothing visibly moves.
      function exit() {
        if (phase !== "done") return;
        phase = "exiting";
        dropGate();
        hold();
        entryTl.timeScale(EXIT_SPEED).reverse();
      }

      function leave() {
        if (phase !== "exiting") return;
        phase = "idle";
        entryTl.pause(0).timeScale(1); // paused first: see reset()
        sync();
        const target = Math.max(0, landing.start - height * EXIT_REST);
        const lenis = window.__lenis;
        if (!lenis) {
          scroller.scrollTop = target;
          gate();
          return;
        }
        // Gated on arrival too: the rest of the gesture must not scroll on through the artists.
        lenis.scrollTo(target, { duration: 0.6, lock: true, force: true, easing: easeOut, onComplete: gate });
      }

      // At rest: on GPC's resting spot with nothing else (the game, a modal) holding the page.
      const atRest = () =>
        phase === "done" && !gated && !window.__lenis?.isStopped && scroller.scrollTop <= landing.end + 1;

      function pullUp(amount, event) {
        // Kept from Lenis and the browser, so the page doesn't start sliding before it exits.
        if (event.cancelable) event.preventDefault();
        event.stopImmediatePropagation();
        intent += amount;
        window.clearTimeout(intentTimer);
        intentTimer = window.setTimeout(() => (intent = 0), GESTURE_GAP_MS);
        if (intent >= EXIT_INTENT_PX) exit();
      }

      function onWheel(event) {
        if (event.ctrlKey) return;
        if (gated) {
          armGate();
          return;
        }
        if (event.deltaY >= 0 || !atRest()) return;
        // deltaMode 1 is lines (Firefox with a mouse wheel), not px.
        pullUp(-event.deltaY * (event.deltaMode === 1 ? 16 : 1), event);
      }

      let touchY = 0;
      function onTouchStart(event) {
        touching = true;
        touchY = event.touches[0].clientY;
        intent = 0;
      }
      function onTouchMove(event) {
        const y = event.touches[0].clientY;
        const moved = y - touchY; // finger down = scrolling up
        touchY = y;
        if (gated) {
          armGate();
          return;
        }
        if (moved <= 0 || !atRest()) return;
        pullUp(moved, event);
      }
      function onTouchEnd(event) {
        touching = event.touches.length > 0;
        if (gated) armGate();
      }

      function onKeyDown(event) {
        if (!["ArrowUp", "PageUp", "Home"].includes(event.key) || !atRest()) return;
        if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]")) return;
        event.preventDefault();
        exit();
      }

      // Capture, so these run before Lenis' own listeners on the same element.
      const listen = { capture: true, passive: false };
      scroller.addEventListener("wheel", onWheel, listen);
      scroller.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
      scroller.addEventListener("touchmove", onTouchMove, listen);
      scroller.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
      scroller.addEventListener("touchcancel", onTouchEnd, { capture: true, passive: true });
      scroller.addEventListener("scroll", brake, { passive: true });
      window.addEventListener("keydown", onKeyDown);
      // Lenis reports each step it takes before the frame is painted; the native event is a frame late.
      const offLenisScroll = window.__lenis?.on("scroll", brake);

      // Already at or past the landing spot (reloaded or re-measured mid-page): show it finished.
      if (landing.scroll() >= landing.end) {
        phase = "done";
        entryTl.progress(1, true);
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
        window.clearTimeout(gateTimer);
        window.clearTimeout(intentTimer);
        scroller.removeEventListener("wheel", onWheel, listen);
        scroller.removeEventListener("touchstart", onTouchStart, { capture: true });
        scroller.removeEventListener("touchmove", onTouchMove, listen);
        scroller.removeEventListener("touchend", onTouchEnd, { capture: true });
        scroller.removeEventListener("touchcancel", onTouchEnd, { capture: true });
        scroller.removeEventListener("scroll", brake);
        window.removeEventListener("keydown", onKeyDown);
        offLenisScroll?.();
        release();
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

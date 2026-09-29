"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Hero.module.css";
// import AtmosphericMist from "@/components/AtmosphericMist";

const assetBase = "/images/Hero/";

// ---------------------------------------------------------------------
// SCENE LAYOUT — every position, size and parallax number lives here.
// Tweak a value and both the element's placement and its scroll motion
// update together; nothing else in the file needs to change.
//
// Position/size are in the .scene design-space (rem). .scene is a
// fixed 88.3125 × 49.0625rem canvas, uniformly scaled to cover the
// real viewport (see the layout effect below) — so a fixed number here
// renders proportionally consistent across every screen size, the same
// way the original Figma-exported UI (Enter button, etc.) already
// works.
//
// Parallax numbers feed the scroll tween further down and are
// depth-ordered per the parallax notes: driftY/scaleTo should get
// smaller the farther a layer reads from the camera, and larger the
// closer it reads to the camera — NOT based on how visually important
// the element is. Roughly, from nearest camera to farthest:
//   girl (foreground, in front of the portal)
//   ground (the portal's own depth — it's standing on it)
//   bgrocks (a farther ridge, just above the near ground)
//   t1 / a2 / t3 / h4 / a5 (the five title glyphs, far behind the portal)
//   island (background — "really far away")
//   background (the environment plate itself — farthest of all)
//
// driftX: sideways drift over the scroll (px). 0 = no horizontal
//   movement. Use this for a "camera passes beside it" effect — the
//   girl uses it to slide off to one side rather than just scaling in
//   place, so it reads as the camera moving past her.
// z / zLift: z-index at rest, and how much to add to it by the end of
//   the scroll. As layers scale up they can start overlapping other
//   layers in new ways that weren't true at rest — zLift lets a layer
//   climb (or a future layer sink, with a negative value) through the
//   stack over the course of the scroll instead of being stuck at one
//   fixed paint order the whole time.
//
// How these numbers get animated (the time-lag/easing "feel" applied
// on top of them) is a separate concern — see MOTION below.
// ---------------------------------------------------------------------
const LAYOUT = {
    background: {
        // The environment plate (background.png) — farther than the
        // island, so it should move even less. Just enough drift to
        // read as physically distant rather than glued to the viewport.
        driftY: -1, scaleTo: 1.02,
        z: 0, zLift: 0,
    },
    island: {
        // Distant, upper-right of center — barely moves at all.
        top: 4.2, left: 42.8, width: 32, height: 37,
        driftX: 100, driftY: -100, scaleTo: 1.04,
        z: 1, zLift: 0,
    },
    ground: {
        // The portal's own depth. Sized to run off the bottom of the
        // canvas (height reaches well past the 49.0625rem canvas
        // height) so its own image edge is never visible on screen —
        // it just reads as ground continuing out of frame.
        top: 45, left: 5, width: 88.3125, height: 26,
        driftX: 0, driftY: -4, scaleTo: 1.02,
        z: 2, zLift: 0,
    },
    // clean up hanin
    bgrocks: {
        // A farther rock/ground layer that only pokes up above the
        // near ground's top edge (23rem vs. ground's 29rem) — reads as
        // a distant ridge rather than another copy of the same rocks.
        // Behind both the ground and the portal (see the CSS).
        top:42, left: 0, width: 88.3125, height: 14,
        driftX: 0, driftY: -2, scaleTo: 1.25,
        z: 1, zLift: 0,
    },
    // The old single "Tathva" <h1> is now five separate glyphs
    // (T1/A2/T3/H4/A5 — drop them in public/images/Hero/) so each
    // letter can be positioned, sized and timed on its own instead of
    // moving as one rigid text block. Same depth as the old title (far
    // behind the portal, in front of the island): z stays 3, and
    // driftY/scaleTo stay close to what the old title used (driftY:
    // -70, scaleTo: ~1.95). driftX increases left-to-right so the row
    // fans out a little as it scales, rather than sliding as one flat
    // block. top/left/width/height lay the five letters out in a row
    // roughly where the old centered title sat — purely a first guess,
    // same as every number below. Tune freely.
    //
    // Only T1 is actually shown (it renders the full "TATHVA" wordmark
    // on its own); a2/t3/h4/v5/a5 are kept for reference but are not
    // required to be visible or individually responsive.
    t1: {
        top: 18.5, left: 1, width: 77, height: 20.6,
        driftX: 0, driftY: -1065, scaleTo: 5.85,
        z: 3, zLift: 0,
    },
    //clean up rabee
    // a2: {
    //     top: 100.5, left: 22, width: 10, height: 14.6,
    //     driftX: 160, driftY: -65, scaleTo: 1.85,
    //     z: 3, zLift: 0,
    // },
    // t3: {
    //     top: 100.5, left: 30, width: 10, height: 14.6,
    //     driftX: 160, driftY: -65, scaleTo: 1.85,
    //     z: 3, zLift: 0,
    // },
    // h4: {
    //     top: 100.5, left: 42, width: 9, height: 13.6,
    //     driftX: 160, driftY: -65, scaleTo: 1.85,
    //     z: 3, zLift: 0,
    // },
    // v5: {
    //     top: 100.5, left: 51, width: 11, height: 14.6,
    //     driftX: 160, driftY: -65, scaleTo: 1.85,
    //     z: 3, zLift: 0,
    // },
    // a5: {
    //     top: 100.5, left: 60, width: 10, height: 14.6,
    //     driftX: 160, driftY: -65, scaleTo: 1.85,
    //     z: 3, zLift: 0,
    // },
    portal: {
        top: 31.5, left: 36.25, width: 9.125, height: 20.1875,
        zoomMultiplier: 1.04, // slight overshoot so it fully covers the viewport at scroll end
        z: 4, zLift: 0,
    },
    girl: {
        // Foreground, standing to one side, watching the portal rather
        // than blocking it. Closest layer to the camera, so the
        // strongest parallax in the scene. driftX carries her sideways
        // as the camera zooms in level with her and then passes —
        // flip the sign to send her the other way.
        top: 36, left: 18.5, width: 54, height:15,
        driftX: 1100, driftY: 1500, scaleTo: 15.55,
        z: 5, zLift: 10,
    },
};

// ---------------------------------------------------------------------
// MOTION RESPONSE — turns the flat LAYOUT numbers above into physical,
// depth-aware motion instead of one linear scroll-progress ↦ value
// mapping. Two independent knobs per layer, both driven straight by
// GSAP/ScrollTrigger — no separate smoothing library, no virtual
// scroll, no fighting CSS transitions:
//
//   scrub — how many seconds a layer takes to "catch up" to the real
//           scroll position. This is GSAP's own scrub smoothing, just
//           given a different value per layer instead of one blanket
//           number for the whole scene. Low = tightly locked to the
//           scrollbar, almost no perceived mass. High = something
//           heavier that keeps drifting for a moment after the
//           scrolling itself has settled. This is what gives each
//           layer its own sense of inertia, per the parallax depth
//           notes on LAYOUT: girl (nearest, heaviest momentum) >
//           background/island (far, slow to react) > the title glyphs
//           (moderate, deliberate) > ground/bgrocks/portal (closest to
//           the "camera rig" itself, so kept tight/stable — the ground
//           the user is standing on, and the destination they're
//           scrolling toward, should never feel like they're wobbling
//           independently of the scroll).
//
//   ease —  the *shape* of a layer's response across the scroll
//           distance (not across time — that's scrub's job). Kept to
//           gentle, monotonic sine/power eases so nothing overshoots,
//           bounces, or reads as a decorative animation preset — the
//           physical feeling should come from scrub's time-lag, this
//           just avoids everything moving in a perfectly mechanical
//           straight line.
//
// Both are independent of driftX/driftY/scaleTo/etc., so LAYOUT above
// stays exactly as tunable as before: LAYOUT decides where something
// goes, MOTION decides how it feels getting there.
// ---------------------------------------------------------------------
const MOTION = {
    background: { scrub: 1.1, ease: "sine.inOut" }, // farthest — extremely subtle, slow to react
    island: { scrub: 0.85, ease: "sine.out" }, // distant — soft settle
    ground: { scrub: 0.4, ease: "power1.out" }, // near the camera rig — restrained, kept tight
    bgrocks: { scrub: 0.45, ease: "power1.inOut" }, // same idea, a touch softer than ground
    glyph: { scrub: 0.6, ease: "power2.out" }, // T1/A2/T3/H4/V5/A5 — smooth, deliberate
    portal: { scrub: 0.18, ease: "none" }, // the destination — extremely stable, precise
    girl: { scrub: 1.3, ease: "power1.inOut" }, // nearest — strongest sense of inertia/momentum
    chrome: { scrub: 0.0001, ease: "power1.out" }, // static UI fade — snappy, barely any smoothing
    whiteout: { scrub: 0.2, ease: "power1.in" }, // tied closely to the portal's own timing
};

// ---------------------------------------------------------------------
// FIXED HERO CHROME — static UI overlaid on the scene (identity mark,
// coordinates, theme copy, experience list, Enter control).
//
// These numbers are now used only as the *source reference* for the
// viewport-anchored CSS in Hero.module.css (.theme/.identity/.coords/
// .exhibits/.enterButton) — see the comment block above those rules
// for how each rem value below was converted into a vw/vh-based
// anchor. They are no longer applied directly as inline top/left,
// because that's exactly what let these elements drift with the
// .scene box's internal crop on aspect ratios other than the
// reference. CHROME.enter.width/height are still applied directly
// (size doesn't have the same crop problem left/top position did).
// ---------------------------------------------------------------------
const CHROME = {
    identity: { top: 17, left: 80.125 },
    coords: { top: 25.3125, left: 82.375 },
    exhibits: { top: 37.8125, left: 76.6875 },
    theme: { top: 14.125, left: 3.25 },
    enter: { top: 39.625, left: 6.8125, width: 11.0625, height: 3.0625 },
};

// const navigationItems = [
//     {
//         label: "PROSHOW",
//         href: "#proshow",
//         arrow: "line-58-1.svg",
//         textClass: "w-[62px]",
//     },
//     {
//         label: "WORKSHOPS",
//         href: "#workshops",
//         arrow: "line-58-1.svg",
//         textClass: "w-[72px]",
//     },
//     {
//         label: "CAMPUS AMBASADOR",
//         href: "#campus-ambasador",
//         arrow: "line-59.svg",
//         textClass: "w-[118px]",
//     },
//     { label: "GALLERY", href: "#gallery", textClass: "w-[51px]" },
// ];

export const Hero = ({ onEnter }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const [ripples, setRipples] = useState([]);
//     const mistBackRef = useRef(null);
// const mistFrontRef = useRef(null);
    const scrollerRef = useRef(null);
    const runwayRef = useRef(null);
    const viewportRef = useRef(null);
    const sceneRef = useRef(null);

    // The flat 2D scene pieces — ground silhouette, the five title
    // glyphs behind the portal, the portal itself, and the whiteout
    // overlay that covers everything once the portal fills the screen.
    const backgroundRef = useRef(null);
    const groundRef = useRef(null);
    const bgrocksRef = useRef(null);
    const t1Ref = useRef(null);
    // const a2Ref = useRef(null);
    // const t3Ref = useRef(null);
    // const h4Ref = useRef(null);
    // const a5Ref = useRef(null);
    // const v5Ref = useRef(null);
    const portalRef = useRef(null);
    const islandRef = useRef(null);
    const girlRef = useRef(null);
    const whiteoutRef = useRef(null);

    // Fixed HERO CHROME refs — these elements now live outside .scene
    // (see the render below) as their own position:fixed elements, so
    // they can be anchored straight to the viewport instead of
    // drifting with .scene's internal crop. Refs are needed so the
    // scroll timeline below can fade them out together.
    const identityRef = useRef(null);
    const coordsRef = useRef(null);
    const themeRef = useRef(null);
    const exhibitsRef = useRef(null);
    const enterRef = useRef(null);

    // Current "cover" scale applied to the fixed-size (353.25 × 196.25)
    // design canvas so it always fills the viewport (see the layout
    // effect below + .scene in Hero.module.css). Every absolutely
    // positioned piece above lives inside that canvas, so this is the
    // one thing the portal's scroll tween has to correct for (see the
    // scale computation below).
    const designScaleRef = useRef(1);

    const handleEnter = () => {
        if (hasEntered) return;
        setHasEntered(true);

        if (typeof onEnter === "function") {
            onEnter();
        }
    };

    // Enter button click: drop a ripple at the click point (it reads
    // off the button's own currentColor, so it's white-on-black or
    // black-on-white automatically depending on hover state), then play
    // the same portal-zoom runway the user would see scrolling there
    // themselves — the button is a shortcut past the scrolling, not past
    // the cinematic, so it animates scrollTop to the bottom of the runway
    // rather than jumping straight to the "entered" state. The existing
    // scroll-progress watcher (progress > 0.985, see the enter-detection
    // ScrollTrigger below) fires handleEnter naturally once that lands;
    // onComplete below just guarantees it even if the tween's own last
    // frame doesn't quite clear that threshold. handleEnter is guarded by
    // hasEntered, so the two never double-fire.
    const handleEnterClick = (event) => {
        if (hasEntered) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const ripple = {
            id: `${Date.now()}-${Math.random()}`,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
        setRipples((current) => [...current, ripple]);
        window.setTimeout(() => {
            setRipples((current) => current.filter((r) => r.id !== ripple.id));
        }, 650);

        const scrollerEl = scrollerRef.current;
        if (!scrollerEl) {
            handleEnter();
            return;
        }

        gsap.to(scrollerEl, {
            scrollTop: scrollerEl.scrollHeight - scrollerEl.clientHeight,
            duration: 1.6,
            ease: "power1.inOut",
            overwrite: true,
            onComplete: () => handleEnterRef.current?.(),
        });
    };

    // The scroll tween below checks progress against a threshold to
    // auto-trigger entry once the portal has swallowed the viewport.
    // Route it through a ref so it always calls the latest handleEnter
    // (current onEnter/hasEntered) without re-creating the timeline.
    const handleEnterRef = useRef(handleEnter);
    useEffect(() => {
        handleEnterRef.current = handleEnter;
    });

    // ---------------------------------------------------------------------
    // SMOOTH (INERTIAL) SCROLLING — wheel/trackpad input is intercepted and
    // turned into a target scroll position; the container's *actual*
    // scrollTop eases toward that target every frame instead of jumping
    // straight to it on each wheel tick, so scrolling carries a touch of
    // momentum instead of feeling like discrete steps. This only touches
    // wheel input:
    //   - touch scrolling is left to the OS, which already has its own,
    //     better-tuned momentum physics per device — hijacking it tends to
    //     fight the platform rather than improve it;
    //   - keyboard scrolling (arrow keys / Page Down / Space — the
    //     scroller is focusable via tabIndex) and scrollbar dragging are
    //     likewise left native, both for accessibility and because they
    //     already feel direct/instant, which is the correct feel for them.
    // Every frame first checks whether something else (keyboard, drag,
    // touch, a resize) moved scrollTop since our own last write; if so, the
    // target resyncs to that new position instead of fighting it or
    // snapping back to a stale target. ScrollTrigger keeps reading
    // .scrollTop exactly as before, so every per-layer scrub/ease in
    // MOTION above still applies on top of this — this only smooths the
    // *input*, not the per-layer motion response.
    // ---------------------------------------------------------------------
    useEffect(() => {
        const scrollerEl = scrollerRef.current;
        if (!scrollerEl) return undefined;

        // Respect the OS-level reduced-motion preference: skip the added
        // momentum entirely and leave scrolling native/instant.
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            return undefined;
        }

        // Portion of the remaining distance-to-target closed per 60fps
        // frame. Higher = snappier/less momentum, lower = heavier/more
        // lag. Kept modest so scrolling still feels directly controlled —
        // this is meant to round off the "steppiness" of raw wheel deltas,
        // not to add a long, floaty coast.
        const SMOOTHING = 0.16;
        const LINE_HEIGHT = 16; // approx. px per "line" unit some browsers report

        const getMaxScroll = () => scrollerEl.scrollHeight - scrollerEl.clientHeight;
        const normalizeDeltaY = (event) => {
            // Most browsers report deltaMode 0 (pixels); a few report 1
            // (lines) or 2 (pages) for certain devices — normalize those
            // to roughly the same feel instead of a barely-there or
            // wildly-oversized step.
            if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT;
            if (event.deltaMode === 2) return event.deltaY * scrollerEl.clientHeight;
            return event.deltaY;
        };

        let targetScroll = scrollerEl.scrollTop;
        let lastWritten = scrollerEl.scrollTop;

        const resyncIfMovedExternally = () => {
            if (Math.abs(scrollerEl.scrollTop - lastWritten) > 1) {
                targetScroll = scrollerEl.scrollTop;
            }
        };

        const handleWheel = (event) => {
            // Let ctrl+wheel (trackpad pinch-to-zoom on most browsers)
            // through untouched rather than hijacking it as a scroll.
            if (event.ctrlKey) return;
            event.preventDefault();
            resyncIfMovedExternally();
            targetScroll = gsap.utils.clamp(
                0,
                getMaxScroll(),
                targetScroll + normalizeDeltaY(event),
            );
        };

        const tick = () => {
            resyncIfMovedExternally();
            const current = scrollerEl.scrollTop;
            const delta = targetScroll - current;
            if (Math.abs(delta) < 0.05) {
                lastWritten = current;
                return;
            }
            // Frame-rate independent exponential ease toward the target —
            // no overshoot, reads as momentum settling rather than a
            // spring or a hard stop.
            const next = current + delta * Math.min(1, SMOOTHING * gsap.ticker.deltaRatio());
            scrollerEl.scrollTop = next;
            lastWritten = next;
        };

        scrollerEl.addEventListener("wheel", handleWheel, { passive: false });
        gsap.ticker.add(tick);

        return () => {
            scrollerEl.removeEventListener("wheel", handleWheel);
            gsap.ticker.remove(tick);
        };
    }, []);

    // Keep the fixed-size (353.25 × 196.25) design canvas covering the
    // full viewport at every aspect ratio, like background-size: cover —
    // scaling the whole composition as one rigid unit so every
    // absolutely-positioned asset inside it keeps its original relative
    // layout. Runs as a layout effect (not useEffect) so the correct
    // scale is applied before first paint, avoiding a flash of
    // unscaled/cropped content.
    useLayoutEffect(() => {
        const scene = sceneRef.current;
        const viewport = viewportRef.current;
        if (!scene || !viewport) return undefined;
const updateDesignScale = () => {
    const designWidth = scene.offsetWidth;
    const designHeight = scene.offsetHeight;
    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    if (!designWidth || !designHeight || !viewportWidth || !viewportHeight) {
        return;
    }

    // Cover scale: guarantees the canvas fully fills the viewport in
    // both dimensions (never leaves a gap) — kept as Math.max()
    // deliberately, not swapped to Math.min(). Which axis "wins"
    // depends on aspect ratio; the resulting overflow is cropped from
    // the top only, via the bottom-anchored transform-origin + flex
    // alignment in Hero.module.css, not by changing this formula.
    const scale = Math.max(
        viewportWidth / designWidth,
        viewportHeight / designHeight,
    );
    designScaleRef.current = scale;
    scene.style.setProperty("--design-scale", scale);
    // The fixed HERO CHROME now lives outside .scene (as siblings of
    // it, see the render below) so it can be position: fixed to the
    // real viewport instead of scaling/cropping with the canvas. It
    // still needs the same scale factor to keep its current size
    // though, so mirror the variable onto the shared ancestor
    // (.scroller) that both .scene and the chrome elements inherit
    // from.
    scrollerRef.current?.style.setProperty("--design-scale", scale);

    // -----------------------------------------------------------------
    // FIXED HERO CHROME — exact pixel anchoring.
    //
    // .scene's own transform always centers it horizontally around the
    // viewport's horizontal center (transform-origin's x is "center",
    // and .viewport's flex centering already centers the un-transformed
    // box, so scaling from that same center never moves it) and always
    // keeps its bottom edge flush with the viewport's bottom edge
    // (transform-origin's y is "bottom" + .viewport's flex
    // align-items: flex-end). That holds no matter which way the
    // aspect ratio forces .scene to be cropped: wider-than-~1.8:1
    // screens crop it vertically from the top (the common case — most
    // real browser viewports), narrower ones crop it horizontally from
    // both sides evenly instead.
    //
    // Every chrome element below is really just "a point at a given
    // (top, left) in that same local coordinate space" (see CHROME up
    // top) that needs to land in that exact spot on the composition
    // regardless of aspect ratio — exactly like island/portal/title/etc
    // already do, as real children of .scene. So instead of a
    // hand-derived vw/vh formula (only ever valid in whichever single
    // crop branch it happened to be derived against), compute the
    // exact screen position directly from the real scale/measurements
    // above. This is correct in both branches automatically, with
    // nothing to manually recompute per device or aspect ratio.
    const remToPx = designWidth / 88.3125;
    const toScreenX = (localRem) => (
        viewportWidth / 2 + (localRem * remToPx - designWidth / 2) * scale
    );
    const toScreenTop = (localRem) => (
        viewportHeight - (designHeight - localRem * remToPx) * scale
    );
    const toScreenBottom = (localRem) => (
        // Distance from .scene's own (always viewport-flush) bottom
        // edge up to this local point, scaled — no separate
        // viewportHeight term needed, since that flush bottom edge is
        // the zero point either way.
        (49.0625 - localRem) * remToPx * scale
    );

    const chromeHost = scrollerRef.current;
    if (chromeHost) {
        chromeHost.style.setProperty("--theme-left", `${toScreenX(CHROME.theme.left)}px`);
        chromeHost.style.setProperty("--theme-top", `${toScreenTop(CHROME.theme.top)}px`);
        chromeHost.style.setProperty("--identity-left", `${toScreenX(CHROME.identity.left)}px`);
        chromeHost.style.setProperty("--identity-top", `${toScreenTop(CHROME.identity.top)}px`);
        chromeHost.style.setProperty("--coords-left", `${toScreenX(CHROME.coords.left)}px`);
        chromeHost.style.setProperty("--coords-top", `${toScreenTop(CHROME.coords.top)}px`);
        chromeHost.style.setProperty("--exhibits-left", `${toScreenX(CHROME.exhibits.left)}px`);
        chromeHost.style.setProperty("--exhibits-top", `${toScreenTop(CHROME.exhibits.top)}px`);
        chromeHost.style.setProperty("--enter-left", `${toScreenX(CHROME.enter.left)}px`);
        chromeHost.style.setProperty(
            "--enter-bottom",
            `${toScreenBottom(CHROME.enter.top + CHROME.enter.height)}px`,
        );
    }

    // T1 (the "TATHVA" wordmark) used to get its own extra horizontal
    // "safety shift" here to stop it clipping on narrower-than-
    // reference aspect ratios. That shift only ever applied to T1, not
    // to island/portal/girl/etc — so on any screen where it actually
    // kicked in, T1 physically moved relative to every other layer in
    // the scene while they stayed put, breaking the composition (the
    // island drifting away from the "V" it's meant to sit above, on
    // narrower laptop screens in particular). T1 is left to
    // crop/scale/center in lockstep with the rest of .scene now, same
    // as every other layer — the small chance of the leading "T"
    // clipping slightly on an unusually narrow window is a much
    // smaller issue than the whole composition disagreeing with
    // itself.

    ScrollTrigger.refresh();
};

        updateDesignScale();

        const resizeObserver = new ResizeObserver(updateDesignScale);
        resizeObserver.observe(viewport);

        return () => resizeObserver.disconnect();
    }, []);

    // Drive the whole scene off scroll progress: the portal grows to
    // fill/exceed the viewport (same box-zoom math this file used
    // before the Three.js world existed — scale by however much bigger
    // the viewport is than the portal, corrected for the .scene
    // cover-scale it's nested inside, then translate to the scene's
    // center, which flexbox guarantees is also the viewport's center);
    // the title drifts and fades a little slower, reading as farther
    // away; the ground barely moves at all; and the whole thing fades
    // to white right at the end.
    //
    // Rather than one shared timeline scrubbed by a single ScrollTrigger
    // (which maps scroll progress to every layer identically), each
    // layer below gets its OWN ScrollTrigger, sharing the same
    // trigger/start/end (the full runway) but with its own scrub time
    // and ease from MOTION above. self.progress on any of these is
    // always the raw, un-smoothed scroll position — scrub only smooths
    // the *animation* it drives — so per-layer scrub can differ freely
    // without the layers ever disagreeing about where the user actually
    // is in the scroll.
    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger);

        const scrollTriggerBase = {
            scroller: scrollerRef.current,
            trigger: runwayRef.current,
            start: "top top",
            end: "bottom bottom",
        };

        // Auto-enter once the user has effectively reached the bottom of
        // the runway. Kept on its own plain ScrollTrigger (no animation
        // attached, so no scrub/lag applies) instead of piggy-backing on
        // any one layer's tween, so "has the user scrolled far enough"
        // never gets delayed by that layer's own inertia.
        ScrollTrigger.create({
            ...scrollTriggerBase,
            onUpdate: (self) => {
                if (self.progress > 0.985) handleEnterRef.current?.();
            },
        });

        // CHROME fade — its own short-leash timeline so the static UI
        // fades out responsively rather than inheriting any scene
        // layer's heavier inertia. duration here is a *fraction of the
        // whole runway's scroll distance*, not seconds — 0.04 means the
        // fade is fully finished after just 4% of the runway has been
        // scrolled, so it clears out almost as soon as scrolling starts
        // rather than lingering through a big chunk of it.
// CHROME fade — disappear almost immediately once scrolling begins.
const chromeTargets = [
    themeRef.current,
    identityRef.current,
    coordsRef.current,
    exhibitsRef.current,
    enterRef.current,
].filter(Boolean);

if (chromeTargets.length) {
    ScrollTrigger.create({
        ...scrollTriggerBase,
        scrub: true,
        invalidateOnRefresh: true,

        onUpdate: (self) => {
            // Fade completely within the first 1% of the runway.
            const fadeProgress = gsap.utils.clamp(
                0,
                1,
                self.progress / 0.10
            );

            const opacity = 1 - fadeProgress;

            gsap.set(chromeTargets, {
                opacity,
            });
        },
    });
}

        // Reads driftX/driftY/scaleTo/opacityTo/zLift straight off a
        // LAYOUT entry, exactly as before — a parallax layer is still
        // fully defined by its numbers alone, add a field and it
        // animates, leave it out (or at 0) and it's skipped. The only
        // change is *how* it's driven: its own ScrollTrigger + the
        // scrub/ease pair from MOTION, instead of a shared linear
        // scrub — this is what lets depth read as a different feel of
        // motion, not just a different distance.
        const createParallaxLayer = (ref, config, motion, fadeAt) => {
            if (!ref.current) return;
            const fromVars = { scale: 1, x: 0, y: 0 };
            const toVars = { duration: 1, ease: motion.ease };
            if (config.xPercent !== undefined) {
                // Constant for the full tween — this is what keeps the
                // element self-centered throughout, now that GSAP owns
                // its transform instead of a CSS class.
                fromVars.xPercent = config.xPercent;
                toVars.xPercent = config.xPercent;
            }
            if (config.driftX) toVars.x = config.driftX;
            if (config.driftY) toVars.y = config.driftY;
            if (config.scaleTo !== undefined) toVars.scale = config.scaleTo;
            if (config.opacityTo !== undefined) toVars.opacity = config.opacityTo;
            if (config.zLift) {
                toVars.zIndex = config.z + config.zLift;
                toVars.snap = { zIndex: 1 };
            }

            const layerTl = gsap.timeline({
                scrollTrigger: {
                    ...scrollTriggerBase,
                    scrub: motion.scrub,
                    invalidateOnRefresh: true,
                },
            });
            layerTl.fromTo(ref.current, fromVars, toVars, 0);

            // Title-letter opacity gets its own tween, starting partway
            // through the scroll instead of fading across the whole
            // range — this way the glyph is still fully visible while
            // its own drift/scale carries it across the island, and
            // only dissolves after. Placed on this same per-layer
            // timeline so the fade shares that glyph's own scrub feel
            // rather than snapping to a different one.
            if (fadeAt !== undefined) {
                layerTl.fromTo(
                    ref.current,
                    { opacity: 1 },
                    { opacity: 0, duration: 0.45, ease: "power1.in" },
                    fadeAt,
                );
            }
        };

        // Girl's zLift would fight the mist's own static zIndex prop, so
        // only take the motion values, not the whole LAYOUT.girl config.
        // const mistFrontMotion = {
        //     driftX: LAYOUT.girl.driftX,
        //     driftY: LAYOUT.girl.driftY,
        //     scaleTo: LAYOUT.girl.scaleTo,
        // };

        createParallaxLayer(backgroundRef, LAYOUT.background, MOTION.background);
        createParallaxLayer(islandRef, LAYOUT.island, MOTION.island);
        createParallaxLayer(groundRef, LAYOUT.ground, MOTION.ground);
        createParallaxLayer(bgrocksRef, LAYOUT.bgrocks, MOTION.bgrocks);
        createParallaxLayer(t1Ref, LAYOUT.t1, MOTION.glyph, 0.5);
        // createParallaxLayer(a2Ref, LAYOUT.a2, MOTION.glyph, 0.5);
        // createParallaxLayer(t3Ref, LAYOUT.t3, MOTION.glyph, 0.5);
        // createParallaxLayer(h4Ref, LAYOUT.h4, MOTION.glyph, 0.5);
        // createParallaxLayer(a5Ref, LAYOUT.a5, MOTION.glyph, 0.5);
        // createParallaxLayer(v5Ref, LAYOUT.v5, MOTION.glyph, 0.5);
        createParallaxLayer(girlRef, LAYOUT.girl, MOTION.girl);
        // simpleParallax(mistBackRef, LAYOUT.bgrocks);   // zooms exactly like the rock bg
        // simpleParallax(mistFrontRef, mistFrontMotion); // zooms exactly like the girl

        if (portalRef.current) {
            gsap.timeline({
                scrollTrigger: {
                    ...scrollTriggerBase,
                    scrub: MOTION.portal.scrub,
                    invalidateOnRefresh: true,
                },
            }).fromTo(
                portalRef.current,
                { scale: 1, x: 0, y: 0 },
                {
                    scale: () => (
                        Math.max(
                            viewportRef.current.clientWidth / portalRef.current.offsetWidth,
                            viewportRef.current.clientHeight / portalRef.current.offsetHeight,
                        ) * LAYOUT.portal.zoomMultiplier
                    ) / (designScaleRef.current || 1),
                    x: () => (
                        sceneRef.current.offsetWidth / 2
                        - (portalRef.current.offsetLeft + portalRef.current.offsetWidth / 2)
                    ),
                    // Was `offsetHeight / 2 - portalCenterY`, which targets the
                    // scene's own center — correct only when the scene is
                    // center-anchored. Now that .scene is bottom-anchored, its
                    // local "center" no longer maps to the viewport's vertical
                    // center, so the target has to be solved for directly:
                    // it's the local-space point that, after the scene's own
                    // bottom-anchored transform, lands at viewportHeight / 2.
                    y: () => (
                        sceneRef.current.offsetHeight
                        - (portalRef.current.offsetTop + portalRef.current.offsetHeight / 2)
                        - (viewportRef.current.clientHeight / 2) / (designScaleRef.current || 1)
                    ),
                    ...(LAYOUT.portal.zLift ? {
                        zIndex: LAYOUT.portal.z + LAYOUT.portal.zLift,
                        snap: { zIndex: 1 },
                    } : null),
                    duration: 1,
                    ease: MOTION.portal.ease,
                },
                0,
            );
        }

        if (whiteoutRef.current) {
            gsap.timeline({
                scrollTrigger: {
                    ...scrollTriggerBase,
                    scrub: MOTION.whiteout.scrub,
                    invalidateOnRefresh: true,
                },
            }).fromTo(
                whiteoutRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: MOTION.whiteout.ease },
                0.8,
            );
        }
    }, { scope: scrollerRef });

    return (
        <main
            ref={scrollerRef}
            className={styles.scroller}
            tabIndex={0}
            aria-label="Scroll to move toward the black box"
        >
        {/* Fixed viewport UI */}
    <a
        href="#home"
        className={styles.fixedLogo}
        style={{
            backgroundImage: `url(${assetBase}tathvawhitelogo-1.svg)`,
        }}
        aria-label="Tathva home"
    />

            {/* ===============================================================
                FIXED HERO CHROME (see CHROME above for the reference
                positions these are derived from) — the identity mark +
                coordinates on the right, the theme copy on the left, the
                experience list bottom-right, and the Enter control.
                Rendered here, as siblings of .runway/.scene rather than
                children of .scene, so they're position: fixed straight to
                the real viewport (same trick as .fixedLogo above) instead
                of living inside the scaled/cropped design canvas. See the
                .theme/.identity/.coords/.exhibits/.enterButton rules in
                Hero.module.css for how each one is anchored. None of these
                are wired into the scroll tween's *motion*, so they stay put
                on screen while the scene behind them zooms — only their
                opacity is tied to the same timeline (see "CHROME fade"
                above), so they fade away as the scroll begins.
               =============================================================== */}

            <section
                ref={themeRef}
                className={styles.theme}
                aria-labelledby="hero-theme-title"
            >
                <div className={styles.themeHeading}>
                    <h1 id="hero-theme-title" className={styles.themeTitle}>
                        DIFFERENT REALITIES.
                        <br />
                        ONE EXHIBITION
                    </h1>
                    <img
                        className={styles.themePlanet}
                        alt=""
                        aria-hidden="true"
                        src={`${assetBase}planeticon.png`}
                    />
                </div>
                <p className={styles.themeCopy}>
                    A journey through technologies, cultures and possibilities beyond our own
                </p>
            </section>

            <aside
                ref={identityRef}
                className={styles.identity}
                aria-label="Tathva 26, Asteria"
            >
                <div className={styles.identityLabel}>
                    <span>TATHVA 26</span>
                    <span className={styles.identityDivider} aria-hidden="true" />
                    <span>ASTERIA</span>
                </div>
                <img
                    className={styles.identityMark}
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}butterfly.png`}
                />
            </aside>

            <div
                ref={coordsRef}
                className={styles.coords}
                aria-label="Location 11.321973 degrees north, 75.935386 degrees east"
            >
                <img
                    className={styles.coordsRing}
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}ellipse.svg`}
                />
                <p className={styles.coordsText}>
                    11.321973° N
                    <br />
                    75.935386° E
                </p>
            </div>

            <section
                ref={exhibitsRef}
                className={styles.exhibits}
                aria-label="Event experiences"
            >
                <svg
                    className={styles.exhibitsStar}
                    width="21"
                    height="21"
                    viewBox="0 0 21 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path d="M6.59074 8.61492L4.86607 9.21034L2.52546 9.68257L6.0778e-05 9.99054L2.73802 10.3493L4.46821 10.6245L6.20308 11.146L7.88844 12.3051L8.79452 13.52L9.42255 15.2331L9.93909 17.5643L10.2949 20.0834L10.6904 17.4676L11.0154 15.746L11.5602 13.8505L12.7287 12.3051L13.9009 11.4072L15.646 10.7708L18.0688 10.3807L20.6396 9.99056L17.8982 9.6589L16.1654 9.40083L14.4254 8.89648L12.7287 7.75414L11.8106 6.54823L11.1657 4.84147L10.6261 2.51546L10.2454 0L9.87581 2.61966L9.56783 4.34432L9.01348 6.06899L7.82264 7.73205L6.59074 8.61492Z" fill="white" />
                </svg>
                <p className={styles.exhibitsList}>
                    EXHIBITS
                    <br />
                    WORLDS
                    <br />
                    EXPERIENCES
                    <br />
                    CONNECT
                </p>
            </section>

            <button
                ref={enterRef}
                type="button"
                onClick={handleEnterClick}
                className={styles.enterButton}
                style={{
                    width: `${CHROME.enter.width}rem`,
                    height: `${CHROME.enter.height}rem`,
                }}
                aria-label="Enter Tathva 26"
            >
                <span className={styles.enterLabel}>Enter</span>
                <span className={styles.enterArrow} aria-hidden="true">→</span>
                {/* <span className={styles.enterBracket} aria-hidden="true">]</span> */}
                {ripples.map((ripple) => (
                    <span
                        key={ripple.id}
                        className={styles.ripple}
                        style={{ left: ripple.x, top: ripple.y }}
                        aria-hidden="true"
                    />
                ))}
            </button>

            <section ref={runwayRef} className={styles.runway}>
                <div ref={viewportRef} className={styles.viewport}>
                    <div
                        ref={sceneRef}
                        className={`relative shrink-0 ${styles.scene}`}
                        data-model-id="10:78"
                        aria-label="Tathva 26 Asteria"
                    >
            {/* Hidden SVG filter behind the portal's edge — a touch of
                procedural noise displaces the rim so it reads as an
                unstable boundary of light rather than a drawn CSS
                border. Zero-size definition only; doesn't render or
                affect layout by itself. */}
            <svg aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
                <filter id="portalEdgeNoise" x="-40%" y="-40%" width="180%" height="180%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.015 0.05" numOctaves="2" seed="7" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>

            {/* Every element below is positioned/sized straight from
                LAYOUT (see top of file) and rendered back-to-front by
                depth: background (farthest) → island → ground → the
                five title glyphs → portal → girl (nearest the camera).
                background.png is now the actual environment;
                .scroller's dark color only shows through before it
                loads. */}
            <div
                ref={backgroundRef}
                className={styles.background}
                style={{ backgroundImage: `url(${assetBase}background1.png)` }}
                aria-hidden="true"
            />

            {/* Ambient light-streak backdrop. Has to live inside .scene,
            //     layered right above .background: .scene is its own
            //     stacking context (position: relative + z-index: 2) with
            //     an opaque full-bleed .background image, so anything
            //     placed outside .scene — behind it or not — is fully
            //     hidden by that image regardless of z-index. Sitting here
            //     (z-index 0, right after .background in the DOM) puts it
            //     above the flat sky plate but below every other layer
            //     (island/ground/bgrocks/title/portal/girl, all z-index
            //     1+), reading as a distant field of drifting light. */}
            {/* // <AmbientStars position="absolute" /> */}

            <div
                ref={islandRef}
                className={styles.islandWrap}
                style={{
                    top: `${LAYOUT.island.top}rem`,
                    left: `${LAYOUT.island.left}rem`,
                    width: `${LAYOUT.island.width}rem`,
                    height: `${LAYOUT.island.height}rem`,
                }}
                aria-hidden="true"
            >
                {/* Independent, near-imperceptible float lives on the
                    inner img (a plain CSS animation) so it never fights
                    the GSAP scroll transform applied to this wrapper. */}
                <div className={styles.islandGlow} />
                <img
                    className={styles.island}
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}floatingisland.png`}
                />
            </div>

            <div
                ref={groundRef}
                className={styles.groundWrap}
                style={{
                    top: `${LAYOUT.ground.top}rem`,
                    left: `${LAYOUT.ground.left}rem`,
                    width: `${LAYOUT.ground.width}rem`,
                    height: `${LAYOUT.ground.height}rem`,
                }}
                aria-hidden="true"
            >
                <img
                    className={styles.ground}
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}rockyground.png`}
                />
                {/* <div className={styles.groundLight} /> */}
            </div>

            <img
                ref={bgrocksRef}
                className={styles.bgrocks}
                style={{
                    top: `${LAYOUT.bgrocks.top}rem`,
                    left: `${LAYOUT.bgrocks.left}rem`,
                    width: `${LAYOUT.bgrocks.width}rem`,
                    height: `${LAYOUT.bgrocks.height}rem`,
                }}
                alt=""
                aria-hidden="true"
                src={`${assetBase}bgrocks.png`}
            />
{/* <AtmosphericMist
    ref={mistBackRef}
    position="absolute"
    zIndex={15}
    groundStart={0}
    groundEnd={0.28}   // was 0.32 — a bit taller
    density={0.75}     // was implicit 0.5 — thicker
/>

<AtmosphericMist
    ref={mistFrontRef}
    position="absolute"
    zIndex={3}
    groundStart={0}
    groundEnd={0.28}   // was 0.42 — a bit taller
    density={0.7}
    intensity={0.55}
    lightY={0.24}
    driftSpeed={1.3}
    octaves={2}
    resolutionScale={0.4}
/> */}
{/* Five separate glyphs replacing the old "Tathva" <h1> — each one is
    its own parallax layer (see LAYOUT.t1..LAYOUT.a5 above), so they
    can be repositioned/re-timed independently instead of moving as a
    single block of text. Swap the src filenames below if the final
    assets end up named differently. */}
{/* T1 used to sit in a wrapper that nudged it independently of the
    rest of the scene to avoid clipping on narrow aspect ratios — that
    broke its alignment with island/portal/etc (see the layout effect
    in Hero.jsx), so it's been removed; the wrapper is kept purely as a
    structural/positioning container, with no extra transform of its
    own. GSAP's scroll parallax still targets the img (t1Ref) directly
    — same driftX/driftY/scaleTo as before. */}
<div
    className={styles.t1SafeWrapper}
    style={{
        top: `${LAYOUT.t1.top}rem`,
        left: `${LAYOUT.t1.left}rem`,
        width: `${LAYOUT.t1.width}rem`,
        height: `${LAYOUT.t1.height}rem`,
    }}
>
    <img
        ref={t1Ref}
        className={styles.titleLetter}
        alt=""
        aria-hidden="true"
        src={`${assetBase}tathva_text.png`}
    />
</div>


            <div
                ref={portalRef}
                className={styles.portal}
                style={{
                    top: `${LAYOUT.portal.top}rem`,
                    left: `${LAYOUT.portal.left}rem`,
                    width: `${LAYOUT.portal.width}rem`,
                    height: `${LAYOUT.portal.height}rem`,
                }}
                aria-hidden="true"
            >
                {/* Painted in this order so the rim ends up crisp on
                    top: wide haze, then the ground-facing pool, then
                    the noise-displaced edge. */}
                <div className={styles.portalHaze} />
                <div className={styles.portalGroundGlow} />
                <div className={styles.portalRim} />
            </div>

            <div
                ref={girlRef}
                className={styles.girlWrap}
                style={{
                    top: `${LAYOUT.girl.top}rem`,
                    left: `${LAYOUT.girl.left}rem`,
                    width: `${LAYOUT.girl.width}rem`,
                    height: `${LAYOUT.girl.height}rem`,
                }}
                aria-hidden="true"
            >
                <img
                    className={styles.girl}
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}girl4.png`}
                />
                {/* Rim light masked to her own alpha shape (same PNG),
                    so it catches her silhouette's edge instead of
                    sitting over her like a rectangle. */}
                <div
                    className={styles.girlRim}
                    style={{
                        WebkitMaskImage: `url(${assetBase}girl.png)`,
                        maskImage: `url(${assetBase}girl.png)`,
                    }}
                />
                <div className={styles.girlContact} />
            </div>



            <div ref={whiteoutRef} className={styles.whiteout} aria-hidden="true" />

            <span className="sr-only" role="status" aria-live="polite">
                {hasEntered ? "Entering Tathva 26" : ""}
            </span>
                    </div>
                </div>
            </section>
        </main>
    );
};
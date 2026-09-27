"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Hero.module.css";
// import AtmosphericMist from "@/components/AtmosphericMist";

const assetBase = "/images/hero/";

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
        top: 5.2, left: 38.4, width: 35, height: 37,
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
        top: 42, left: 0, width: 88.3125, height: 14,
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
        top: 19.5, left: -0, width: 77, height: 20.6,
        driftX: 0, driftY: -1065, scaleTo: 5.85,
        z: 3, zLift: 0,
    },
    //clean up hanin
    a2: {
        top: 100.5, left: 22, width: 10, height: 14.6,
        driftX: 160, driftY: -65, scaleTo: 1.85,
        z: 3, zLift: 0,
    },
    t3: {
        top: 100.5, left: 30, width: 10, height: 14.6,
        driftX: 160, driftY: -65, scaleTo: 1.85,
        z: 3, zLift: 0,
    },
    h4: {
        top: 100.5, left: 42, width: 9, height: 13.6,
        driftX: 160, driftY: -65, scaleTo: 1.85,
        z: 3, zLift: 0,
    },
    v5: {
        top: 100.5, left: 51, width: 11, height: 14.6,
        driftX: 160, driftY: -65, scaleTo: 1.85,
        z: 3, zLift: 0,
    },
    a5: {
        top: 100.5, left: 60, width: 10, height: 14.6,
        driftX: 160, driftY: -65, scaleTo: 1.85,
        z: 3, zLift: 0,
    },
    portal: {
        top: 29.5, left: 36.25, width: 9.125, height: 20.1875,
        zoomMultiplier: 1.04, // slight overshoot so it fully covers the viewport at scroll end
        z: 4, zLift: 0,
    },
    girl: {
        // Foreground, standing to one side, watching the portal rather
        // than blocking it. Closest layer to the camera, so the
        // strongest parallax in the scene. driftX carries her sideways
        // as the camera zooms in level with her and then passes —
        // flip the sign to send her the other way.
        top: 36, left: 18.5, width: 54, height: 15,
        driftX: 1100, driftY: 1500, scaleTo: 15.55,
        z: 5, zLift: 10,
    },
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
    // black-on-white automatically depending on hover state) and then
    // run the normal enter flow.
    const handleEnterClick = (event) => {
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
        handleEnter();
    };

    // The scroll tween below checks progress against a threshold to
    // auto-trigger entry once the portal has swallowed the viewport.
    // Route it through a ref so it always calls the latest handleEnter
    // (current onEnter/hasEntered) without re-creating the timeline.
    const handleEnterRef = useRef(handleEnter);
    useEffect(() => {
        handleEnterRef.current = handleEnter;
    });

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
            designScaleRef.current = Math.max(
                viewportWidth / designWidth,
                viewportHeight / designHeight,
            );
            scene.style.setProperty("--design-scale", designScaleRef.current);
            // The fixed HERO CHROME now lives outside .scene (as siblings of
            // it, see the render below) so it can be position: fixed to the
            // real viewport instead of scaling/cropping with the canvas. It
            // still needs the same scale factor to keep its current size
            // though, so mirror the variable onto the shared ancestor
            // (.scroller) that both .scene and the chrome elements inherit
            // from.
            scrollerRef.current?.style.setProperty(
                "--design-scale",
                designScaleRef.current,
            );

            // T1 safety shift — .viewport centers .scene horizontally
            // (justify-content: center), so on aspect ratios narrower than the
            // scene's own ~1.8:1 design ratio, the scaled canvas ends up wider
            // than the viewport and gets cropped evenly from both sides. Every
            // other scene layer is either edge-to-edge on purpose (background,
            // ground, bgrocks) or comfortably inset from the canvas edges
            // (island, portal, girl), so that crop is invisible. T1 is the one
            // layer that isn't: it spans nearly the full canvas width and
            // starts flush with the canvas's own left edge, so a horizontal
            // crop cuts directly into the start of the wordmark. Nudge T1 back
            // by exactly the amount clipped (0 whenever the scene isn't
            // horizontally cropped — the common wide-landscape case, which
            // matches the reference exactly) so it stays fully visible and
            // centered like the reference composition. This only sets a
            // static base-position correction; the GSAP scroll parallax on the
            // ref below is untouched.
            const scaledWidth = designWidth * designScaleRef.current;
            const cropPerSide = Math.max(0, (scaledWidth - viewportWidth) / 2);
            // Capped so a pathological aspect ratio can't shove T1 wildly off
            // its intended spot.
            const cappedCropPerSide = Math.min(cropPerSide, viewportWidth * 0.15);
            // Expressed in .scene's own local (pre-transform) pixels, since
            // this shift lands on a child of .scene and will itself be
            // multiplied by --design-scale again when painted.
            scene.style.setProperty(
                "--t1-safe-shift",
                `${cappedCropPerSide / designScaleRef.current}px`,
            );

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
    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({
            scrollTrigger: {
                scroller: scrollerRef.current,
                trigger: runwayRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.8,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    if (self.progress > 0.985) handleEnterRef.current?.();
                },
            },
        });

        // CHROME fade — tied to this same scrubbed timeline/progress,
        // so it's perfectly in sync with the portal zoom rather than
        // running on its own clock. Fades out early and is fully gone
        // well before the portal dominates the frame (whiteout doesn't
        // start until 0.8, auto-enter fires at 0.985), so there's never
        // a moment where static UI sits awkwardly over the zoomed-in
        // portal, and never a hard cut.
        const chromeTargets = [
            themeRef.current,
            identityRef.current,
            coordsRef.current,
            exhibitsRef.current,
            enterRef.current,
        ].filter(Boolean);
        if (chromeTargets.length) {
            tl.fromTo(
                chromeTargets,
                { opacity: 1 },
                { opacity: 0, duration: 0.4, ease: "power1.out" },
                0,
            );
        }

        // Reads driftX/driftY/scaleTo/opacityTo/zLift straight off a
        // LAYOUT entry, so a simple parallax layer is fully defined by
        // its numbers alone — add a field in LAYOUT and it animates,
        // leave it out (or at 0) and it's skipped.
        const simpleParallax = (ref, config) => {
            if (!ref.current) return;
            const fromVars = { scale: 1, x: 0, y: 0 };
            const toVars = { duration: 1, ease: "none" };
            if (config.xPercent !== undefined) {
                // Constant for the full tween — this is what keeps the
                // element self-centered throughout, now that GSAP owns its
                // transform instead of a CSS class.
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
            tl.fromTo(ref.current, fromVars, toVars, 0);
        };
        // Girl's zLift would fight the mist's own static zIndex prop, so
        // only take the motion values, not the whole LAYOUT.girl config.
        // const mistFrontMotion = {
        //     driftX: LAYOUT.girl.driftX,
        //     driftY: LAYOUT.girl.driftY,
        //     scaleTo: LAYOUT.girl.scaleTo,
        // };

        simpleParallax(backgroundRef, LAYOUT.background);
        simpleParallax(islandRef, LAYOUT.island);
        simpleParallax(groundRef, LAYOUT.ground);
        simpleParallax(bgrocksRef, LAYOUT.bgrocks);
        simpleParallax(t1Ref, LAYOUT.t1);
        simpleParallax(girlRef, LAYOUT.girl);
        // simpleParallax(mistBackRef, LAYOUT.bgrocks);   // zooms exactly like the rock bg
        // simpleParallax(mistFrontRef, mistFrontMotion); // zooms exactly like the girl

        // Title-letter opacity gets its own tween, starting partway
        // through the scroll instead of fading across the whole range
        // — this way each glyph is still fully visible while
        // simpleParallax's scale/driftX carries it across the island,
        // and only dissolves after. All five glyphs fade on the same
        // schedule; only their scale/drift differ.
        [t1Ref].forEach((ref) => {
            if (ref.current) {
                tl.fromTo(
                    ref.current,
                    { opacity: 1 },
                    { opacity: 0, duration: 0.45, ease: "power1.in" },
                    0.5,
                );
            }
        });
        if (portalRef.current) {
            tl.fromTo(
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
                    ease: "none",
                },
                0,
            );
        }
        if (whiteoutRef.current) {
            tl.fromTo(
                whiteoutRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: "power1.in" },
                0.8,
            );
        }
    });

    return (
        <main
            ref={scrollerRef}
            className={styles.scroller}
            tabIndex={0}
            aria-label="Scroll to move toward the black box"
        >
            {/* Fixed viewport UI */}

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
                        {/* T1 is wrapped so a static horizontal "safety shift"
    (--t1-safe-shift, computed in the layout effect above) can
    compensate for the scene's horizontal crop on aspect ratios
    narrower than the design's own ~1.8:1, without touching the GSAP
    scroll animation below, which still targets the img (t1Ref)
    directly — same driftX/driftY/scaleTo as before. */}
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
                                src={`${assetBase}T11.svg`}
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

export default Hero;
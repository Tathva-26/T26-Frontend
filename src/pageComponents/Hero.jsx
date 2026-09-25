"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Hero.module.css";

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
//   title (far behind the portal)
//   island (background — "really far away")
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
    island: {
        // Distant, upper-right of center — barely moves at all.
        top: 2.5, left: 49, width: 25, height: 37,
        driftX: 0, driftY: -3, scaleTo: 1.04,
        z: 1, zLift: 0,
    },
    ground: {
        // The portal's own depth. Sized to run off the bottom of the
        // canvas (height reaches well past the 49.0625rem canvas
        // height) so its own image edge is never visible on screen —
        // it just reads as ground continuing out of frame.
        top: 29, left: 0, width: 88.3125, height: 26,
        driftX: 0, driftY: -4, scaleTo: 2.02,
        z: 2, zLift: 0,
    },
    title: {
        top: 19.5, // = the old top-70 Tailwind value (70 * 0.25rem)
        driftX: 0, driftY: -40, scaleTo: 1.95, opacityTo: 0,
        z: 3, zLift: 0,
    },
    portal: {
        top: 30.875, left: 36.25, width: 9.125, height: 15.1875,
        zoomMultiplier: 1.04, // slight overshoot so it fully covers the viewport at scroll end
        z: 4, zLift: 0,
    },
    girl: {
        // Foreground, standing to one side, watching the portal rather
        // than blocking it. Closest layer to the camera, so the
        // strongest parallax in the scene. driftX carries her sideways
        // as the camera zooms in level with her and then passes —
        // flip the sign to send her the other way.
        top: 32, left: 40.5, width: 12, height: 17,
        driftX: 900, driftY: 34, scaleTo: 15.55,
        z: 5, zLift: 10,
    },
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

    const scrollerRef = useRef(null);
    const runwayRef = useRef(null);
    const viewportRef = useRef(null);
    const sceneRef = useRef(null);

    // The flat 2D scene pieces — ground silhouette, the giant title
    // behind the portal, the portal itself, and the whiteout overlay
    // that covers everything once the portal fills the screen.
    const groundRef = useRef(null);
    const titleRef = useRef(null);
    const portalRef = useRef(null);
    const islandRef = useRef(null);
    const girlRef = useRef(null);
    const whiteoutRef = useRef(null);

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

            designScaleRef.current = Math.max(
                viewportWidth / designWidth,
                viewportHeight / designHeight,
            );
            scene.style.setProperty("--design-scale", designScaleRef.current);
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

        // Reads driftX/driftY/scaleTo/opacityTo/zLift straight off a
        // LAYOUT entry, so a simple parallax layer is fully defined by
        // its numbers alone — add a field in LAYOUT and it animates,
        // leave it out (or at 0) and it's skipped.
        const simpleParallax = (ref, config) => {
            if (!ref.current) return;
            const toVars = { duration: 1, ease: "none" };
            if (config.driftX) toVars.x = config.driftX;
            if (config.driftY) toVars.y = config.driftY;
            if (config.scaleTo !== undefined) toVars.scale = config.scaleTo;
            if (config.opacityTo !== undefined) toVars.opacity = config.opacityTo;
            if (config.zLift) {
                toVars.zIndex = config.z + config.zLift;
                toVars.snap = { zIndex: 1 };
            }
            tl.fromTo(ref.current, { scale: 1, x: 0, y: 0 }, toVars, 0);
        };

        simpleParallax(islandRef, LAYOUT.island);
        simpleParallax(groundRef, LAYOUT.ground);
        simpleParallax(titleRef, LAYOUT.title);
        simpleParallax(girlRef, LAYOUT.girl);

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
                    y: () => (
                        sceneRef.current.offsetHeight / 2
                        - (portalRef.current.offsetTop + portalRef.current.offsetHeight / 2)
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

    <a
        href="#register"
        className={styles.fixedRegister}
        aria-label="Register for Tathva 26"
    >
        <img
            className={styles.fixedRegisterLine}
            alt=""
            aria-hidden="true"
            src={`${assetBase}line-56.svg`}
        />

        <span>Register</span>
    </a>
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
                depth: island (farthest) → ground → title → portal →
                girl (nearest the camera). No sky element sits above
                the ground; .scroller's own dark background stands in
                for empty space. */}
            <img
                ref={islandRef}
                className={styles.island}
                style={{
                    top: `${LAYOUT.island.top}rem`,
                    left: `${LAYOUT.island.left}rem`,
                    width: `${LAYOUT.island.width}rem`,
                    height: `${LAYOUT.island.height}rem`,
                }}
                alt=""
                aria-hidden="true"
                src={`${assetBase}floatingisland.svg`}
            />

            <img
                ref={groundRef}
                className={styles.ground}
                style={{
                    top: `${LAYOUT.ground.top}rem`,
                    left: `${LAYOUT.ground.left}rem`,
                    width: `${LAYOUT.ground.width}rem`,
                    height: `${LAYOUT.ground.height}rem`,
                }}
                alt=""
                aria-hidden="true"
                src={`${assetBase}rockyground.png`}
            />

            <h1
                ref={titleRef}
                className={`left-1/2 -translate-x-1/2 ${styles.heroTitle}`}
                style={{ top: `${LAYOUT.title.top}rem` }}
            >
                Tathva
            </h1>

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
            />

            <img
                ref={girlRef}
                className={styles.girl}
                style={{
                    top: `${LAYOUT.girl.top}rem`,
                    left: `${LAYOUT.girl.left}rem`,
                    width: `${LAYOUT.girl.width}rem`,
                    height: `${LAYOUT.girl.height}rem`,
                }}
                alt=""
                aria-hidden="true"
                src={`${assetBase}girl.png`}
            />

            <div ref={whiteoutRef} className={styles.whiteout} aria-hidden="true" />

            <button
                type="button"
                onClick={handleEnter}
                className="absolute top-158.5 left-27.25 w-44.25 h-12.25 bg-[#00000099] rounded-[10.97px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white z-25"
                aria-label="Enter Tathva 26"
            >
                <span
                    className="left-0.5 absolute -top-0.75 font-['Instrument_Serif',Helvetica] font-normal text-white text-[41.3px] text-center tracking-normal leading-[normal]"
                    aria-hidden="true"
                >

                </span>
                <span
                    className="left-39.25 -rotate-180 absolute -top-0.75 font-['Instrument_Serif',Helvetica] font-normal text-white text-[41.3px] text-center tracking-normal leading-[normal]"
                    aria-hidden="true"
                >

                </span>
                <span className="absolute top-2.25 left-11.75 font-['Intel_One_Mono',Helvetica] text-[22.7px] text-center font-normal text-white tracking-normal leading-[normal]">
                    Enter
                </span>
                <img
                    className="absolute top-3.75 left-28.75 w-5.75 h-5.75"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}arrow-right.svg`}
                />
            </button>
            {/* <a
                href="#home"
                className="absolute top-5.5 left-9.25 w-13.75 h-11.5 bg-cover bg-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ backgroundImage: `url(${assetBase}tathvawhitelogo-1.svg)` }}
                aria-label="Tathva home"
            />
            <a
                href="#register"
                className="absolute top-6 left-336 w-13.25 h-13.25 bg-size-[100%_100%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ backgroundImage: `url(${assetBase}akar-icons-arrow-down-right.svg)` }}
                aria-label="Register for Tathva 26"
            /> */}
            {/* <button
                type="button"
                className="absolute top-8.5 left-32 w-6.75 h-4.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                aria-controls="primary-navigation"
            >
                <img
                    className="absolute w-[81.48%] h-[88.89%] top-[11.11%] left-[18.52%]"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-55.svg`}
                />
                <img
                    className="absolute w-full h-[55.56%] top-[44.44%] left-0"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-54.svg`}
                />
                <img
                    className="absolute w-[81.48%] h-[16.67%] top-[83.33%] left-[18.52%]"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-55.svg`}
                />
            </button> */}
            {/* <a
                href="#register"
                className="absolute top-8 left-291.75 w-43.25 h-7 flex gap-2.25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Register for Tathva 26"
            >
                <img
                    className="mt-2.75 w-[101.01px] h-0.5 object-cover"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-56.svg`}
                />
                <span className="w-15.25 h-7 font-['Instrument_Serif',Helvetica] italic text-[21.5px] font-normal text-white tracking-normal leading-[normal]">
                    Register
                </span>
            </a> */}
            {/* <aside
                className="absolute top-33.75 left-330.25 w-11.25 h-50 flex flex-col gap-[72.1px]"
                aria-label="Event identity"
            >
                <div className="ml-[-50.5px] w-39.75 h-[10.8px] mt-[72.1px] flex rotate-90">
                    <span className="mt-[0.5px] w-[59.95px] h-[9.72px] ml-0 font-['Hammersmith_One',Helvetica] font-normal text-white text-[11.6px] tracking-normal leading-[normal] whitespace-nowrap">
                        TATHVA 26
                    </span>
                    <img
                        className="mt-1 w-[8.4px] h-[5.85px] ml-[19.8px] -rotate-90"
                        alt=""
                        aria-hidden="true"
                        src={`${assetBase}line-57.svg`}
                    />
                    <span className="mt-0 w-[49.69px] h-[9.72px] ml-[17.2px] font-['Hammersmith_One',Helvetica] font-normal text-white text-[11.6px] tracking-normal leading-[normal] whitespace-nowrap">
                        ASTERIA
                    </span>
                </div>
                <img
                    className="w-11.25 h-11.25 aspect-[1] object-cover"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}f976fdb645ffe30426c2c5ae0ce7bf9a-removebg-preview-1@2x.png`}
                />
            </aside> */}
            {/* <section
                className="absolute top-24.5 left-13 w-44.5 h-37"
                aria-labelledby="hero-theme-title"
            >
                <img
                    className="absolute top-0 left-px w-px h-37"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}line-58.svg`}
                />
                <h1
                    id="hero-theme-title"
                    className="absolute top-8.75 left-5.75 w-37.75 font-['Hammersmith_One',Helvetica] font-normal text-[#ffffff99] text-[16.6px] tracking-normal leading-[normal]"
                >
                    DIFFERENT REALITIES.
                    <br />
                    ONE EXHIBITION
                </h1>
                <p className="absolute top-25.75 left-5.75 w-27.25 font-['Hammersmith_One',Helvetica] font-normal text-[#ffffff99] text-[7.1px] tracking-normal leading-[normal]">
                    A journey through technologies , cultures and possibilities beyond our
                    own
                </p>
                <img
                    className="absolute top-4 left-23 w-18 h-18 aspect-[1] object-cover"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}5c08252bd438d0b5cfb303ee8aa738ca-removebg-preview-1@2x.png`}
                />
            </section> */}
            {/* <nav
                id="primary-navigation"
                className="absolute top-9.5 left-47.75 w-100.75 h-3 flex"
                aria-label="Primary navigation"
                hidden={isMenuOpen}
            >
                {navigationItems.map((item, index) => (
                    <div key={item.label} className={`flex ${index === 0 ? "" : ""}`}>
                        <a
                            href={item.href}
                            className={`${index === 1 ? "mt-px" : "mt-0"} ${item.textClass} h-2.5 ${index === 0
                                ? "ml-0"
                                : index === 1
                                    ? "ml-[12.7px]"
                                    : index === 2
                                        ? "ml-[9.7px]"
                                        : "ml-[10.2px]"
                                } font-['Hammersmith_One',Helvetica] font-normal text-white text-[11.6px] tracking-normal leading-[normal] whitespace-nowrap focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white`}
                        >
                            {item.label}
                        </a>
                        {item.arrow ? (
                            <img
                                className={
                                    index === 0
                                        ? "mt-0.75 w-[5.95px] h-[8.4px] ml-[12.4px]"
                                        : index === 1
                                            ? "mt-1 w-[5.95px] h-[8.4px] ml-[14.3px]"
                                            : "mt-[3.9px] w-[5.95px] h-[8.4px] ml-[14.8px]"
                                }
                                alt=""
                                aria-hidden="true"
                                src={`${assetBase}${item.arrow}`}
                            />
                        ) : null}
                    </div>
                ))}
            </nav> */}
            {/* {isMenuOpen ? (
                <nav
                    className="absolute top-17 left-32 z-10 flex w-46.25 flex-col gap-3 bg-[#080808]/95 p-4 font-['Hammersmith_One',Helvetica] text-[11.6px] text-white"
                    aria-label="Expanded navigation menu"
                >
                    {navigationItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
            ) : null} */}

            {/* <section
                className="absolute top-151.25 left-306.75 w-35.5 h-31.5 z-25"
                aria-label="Event experiences"
            >
                <div className="absolute top-2.5 left-2.5 w-33.5 h-29 flex gap-[16.4px]">
                    <img
                        className="w-px h-29"
                        alt=""
                        aria-hidden="true"
                        src={`${assetBase}line-58-2.svg`}
                    />
                    <p className="mt-[27.4px] w-[114.55px] h-[72.11px] font-['Hammersmith_One',Helvetica] font-normal text-[#ffffff99] text-[16.6px] tracking-normal leading-[normal]">
                        EXHIBITS
                        <br />
                        WORLDS
                        <br />
                        EXPERIENCES <br />
                        CONNECT
                    </p>
                </div>
                <img
                    className="absolute top-0 left-0 w-5.25 h-5"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}vector-22.svg`}
                />
            </section> */}
            {/* <aside
                className="absolute top-89.25 left-329.5 w-13.5 h-19 z-25"
                aria-label="Location 11.321973 degrees north, 75.935386 degrees east"
            >
                <div className="absolute top-0 left-0 w-12.75 h-12.25 rounded-[25.5px/24.5px] border border-solid border-white" />
                <img
                    className="absolute top-4.75 left-5 w-3 h-3"
                    alt=""
                    aria-hidden="true"
                    src={`${assetBase}vector-22-1.svg`}
                />
                <p className="absolute top-14 left-0 w-13 font-['Hammersmith_One',Helvetica] font-normal text-white text-[7.6px] text-center tracking-normal leading-[normal]">
                    11.321973° N <br />
                    75.935386° E
                </p>
            </aside> */}
            <span className="sr-only" role="status" aria-live="polite">
                {hasEntered ? "Entering Tathva 26" : ""}
            </span>
                    </div>
                </div>
            </section>
        </main>
    );
};
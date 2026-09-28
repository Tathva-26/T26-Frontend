"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Hero.module.css";

// Register once at module level so ScrollTrigger.refresh() is safe to
// call from any effect, regardless of effect order.
gsap.registerPlugin(ScrollTrigger, useGSAP);

const assetBase = "/images/Hero/";

// ---------------------------------------------------------------------
// SCENE LAYOUT (desktop) — positions/sizes in .scene design-space rem
// (88.3125 x 49.0625rem canvas, cover-scaled to the viewport).
// driftX/driftY (px) and scaleTo drive the scroll parallax. Depth order,
// nearest to farthest: girl, ground/portal, bgrocks, t1, island,
// background. z / zLift = z-index at rest / added by end of scroll.
// ---------------------------------------------------------------------
const LAYOUT = {
    background: {
        driftY: -1, scaleTo: 1.02,
        z: 0, zLift: 0,
    },
    island: {
        top: 1, left: 37.8, width: 40, height: 37,
        driftX: 100, driftY: -100, scaleTo: 1.04,
        z: 1, zLift: 0,
    },
    ground: {
        top: 45, left: 5, width: 88.3125, height: 26,
        driftX: 0, driftY: -4, scaleTo: 1.02,
        z: 2, zLift: 0,
    },
    bgrocks: {
        top: 42, left: 0, width: 88.3125, height: 14,
        driftX: 0, driftY: -2, scaleTo: 1.25,
        z: 1, zLift: 0,
    },
    // T1 renders the full "TATHVA" wordmark on its own.
    t1: {
        top: 14.5, left: -1, width: 80, height: 30.6,
        driftX: 0, driftY: -1065, scaleTo: 5.85,
        z: 3, zLift: 0,
    },
    portal: {
        top: 31.5, left: 36.25, width: 9.125, height: 20.1875,
        zoomMultiplier: 1.04, // slight overshoot so it fully covers the viewport
        z: 4, zLift: 0,
    },
    girl: {
        top: 36, left: 18.5, width: 54, height: 15,
        driftX: 1100, driftY: 1500, scaleTo: 15.55,
        z: 5, zLift: 10,
    },
};

// ---------------------------------------------------------------------
// MOTION RESPONSE — per-layer scrub (seconds of lag behind the real
// scroll position = inertia) and ease (shape across scroll distance).
// ---------------------------------------------------------------------
const MOTION = {
    background: { scrub: 1.1, ease: "sine.inOut" },
    island: { scrub: 0.85, ease: "sine.out" },
    ground: { scrub: 0.4, ease: "power1.out" },
    bgrocks: { scrub: 0.45, ease: "power1.inOut" },
    glyph: { scrub: 0.6, ease: "power2.out" },
    portal: { scrub: 0.18, ease: "none" },
    girl: { scrub: 1.3, ease: "power1.inOut" },
    chrome: { scrub: 0.0001, ease: "power1.out" },
};

// ---------------------------------------------------------------------
// FIXED HERO CHROME (desktop) — reference points in .scene design-space
// rem. The layout effect converts each one to an exact on-screen pixel
// position and writes it to CSS variables (--theme-left etc.).
// ---------------------------------------------------------------------
const CHROME = {
    identity: { top: 17, left: 80.125 },
    coords: { top: 25.3125, left: 82.375 },
    exhibits: { top: 37.8125, left: 76.6875 },
    theme: { top: 14.125, left: 3.25 },
    enter: { top: 39.625, left: 6.8125, width: 11.0625, height: 3.0625 },
};

// ---------------------------------------------------------------------
// MOBILE LAYOUT — portrait canvas 24.375 x 49.0625 rem (~390 x 785 px).
// ---------------------------------------------------------------------
const LAYOUT_MOBILE = {
    background: {
        driftY: -1, scaleTo: 1.02,
        z: 0, zLift: 0,
    },
    island: {
        top: 13, left: -0.5, width: 23, height: 17,
        driftX: 0, driftY: -60, scaleTo: 1.04,
        z: 1, zLift: 0,
    },
    ground: {
        top: 38, left: -1, width: 26.375, height: 16,
        driftX: 0, driftY: 30, scaleTo: 1.02,
        z: 2, zLift: 0,
    },
    bgrocks: {
        top: 41, left: 0, width: 24.375, height: 10,
        driftX: 0, driftY: -2, scaleTo: 1.15,
        z: 1, zLift: 0,
    },
    t1: {
        top: 27.5, left: 1.3, width: 21.375, height: 7.2,
        driftX: 0, driftY: -420, scaleTo: 3.2,
        z: 3, zLift: 0,
    },
    portal: {
        top: 36, left: 8.5, width: 7.375, height: 16.5,
        zoomMultiplier: 3.04,
        z: 4, zLift: 0,
    },
    girl: {
        top: 30, left: 0.9, width: 30.5, height: 20,
        driftX: 2090, driftY: -1550, scaleTo: 60,
        z: 5, zLift: 10,
    },
};

// Mobile chrome — same (top, left) reference-point model as desktop, so
// the same pixel-anchoring code positions it. Coords is hidden in CSS.
const CHROME_MOBILE = {
    identity: { top: 6.5, left: 18 },
    coords: { top: 25.3125, left: 0 },
    theme: { top: 6, left: 1 },
    exhibits: { top: 35.5, left: 16.9 },
    enter: { top: 46.2, left: 1.25, width: 7.5, height: 2.6 },
};

export const Hero = ({ onEnter }) => {
    const [hasEntered, setHasEntered] = useState(false);
    const [ripples, setRipples] = useState([]);
    // Must start as false so the first client render matches the server
    // HTML (no hydration mismatch). The layout effect below flips it
    // before first paint on mobile.
    const [isMobile, setIsMobile] = useState(false);

    const scrollerRef = useRef(null);
    const runwayRef = useRef(null);
    const viewportRef = useRef(null);
    const sceneRef = useRef(null);

    const backgroundRef = useRef(null);
    const groundRef = useRef(null);
    const bgrocksRef = useRef(null);
    const t1Ref = useRef(null);
    const portalRef = useRef(null);
    const islandRef = useRef(null);
    const girlRef = useRef(null);
    const identityRef = useRef(null);
    const coordsRef = useRef(null);
    const themeRef = useRef(null);
    const exhibitsRef = useRef(null);
    const enterRef = useRef(null);

    // Cover scale applied to the fixed-size design canvas.
    const designScaleRef = useRef(1);

    const handleEnter = () => {
        setHasEntered(true);
        if (typeof onEnter === "function") {
            onEnter();
        }
    };

    // Route through a ref so the scroll trigger always calls the latest
    // handleEnter without re-creating the timeline.
    const handleEnterRef = useRef(handleEnter);
    useEffect(() => {
        handleEnterRef.current = handleEnter;
    });

    // Enter click: ripple at the click point, then animate the hero
    // scroll runway to its end (portal zoom), then let the page scroll
    // naturally to the Frame section below.
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

        const scrollerEl = scrollerRef.current;
        if (!scrollerEl) {
            handleEnterRef.current?.();
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

    // Physical Enter key -> same cinematic zoom as button click.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key !== "Enter" || e.repeat || hasEntered) return;
            const btn = enterRef.current;
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            handleEnterClick({
                currentTarget: btn,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
            });
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasEntered]);

    // ---------------------------------------------------------------------
    // SMOOTH (INERTIAL) WHEEL SCROLLING — wheel input sets a target; the
    // real scrollTop eases toward it every frame. Touch, keyboard and
    // scrollbar dragging stay native. Skipped for reduced-motion.
    //
    // PERF: the per-frame ticker callback is only registered while there
    // is distance left to cover (wheel input starts it, settling stops
    // it). Previously it ran — and read scrollTop — on every frame for
    // the life of the page, including at rest.
    // ---------------------------------------------------------------------
    useEffect(() => {
        const scrollerEl = scrollerRef.current;
        if (!scrollerEl) return undefined;

        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            return undefined;
        }

        const SMOOTHING = 0.16;
        const LINE_HEIGHT = 16;

        const getMaxScroll = () => scrollerEl.scrollHeight - scrollerEl.clientHeight;
        const normalizeDeltaY = (event) => {
            if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT;
            if (event.deltaMode === 2) return event.deltaY * scrollerEl.clientHeight;
            return event.deltaY;
        };

        let targetScroll = scrollerEl.scrollTop;
        let lastWritten = scrollerEl.scrollTop;
        let ticking = false;

        const resyncIfMovedExternally = () => {
            if (Math.abs(scrollerEl.scrollTop - lastWritten) > 1) {
                targetScroll = scrollerEl.scrollTop;
            }
        };

        const startTicking = () => {
            if (ticking) return;
            ticking = true;
            gsap.ticker.add(tick);
        };

        const stopTicking = () => {
            if (!ticking) return;
            ticking = false;
            gsap.ticker.remove(tick);
        };

        const handleWheel = (event) => {
            if (event.ctrlKey) return;
            event.preventDefault();
            resyncIfMovedExternally();
            targetScroll = gsap.utils.clamp(
                0,
                getMaxScroll(),
                targetScroll + normalizeDeltaY(event),
            );
            startTicking();
        };

        const tick = () => {
            resyncIfMovedExternally();
            const current = scrollerEl.scrollTop;
            const delta = targetScroll - current;
            if (Math.abs(delta) < 0.05) {
                lastWritten = current;
                stopTicking();
                return;
            }
            const next = current + delta * Math.min(1, SMOOTHING * gsap.ticker.deltaRatio());
            scrollerEl.scrollTop = next;
            lastWritten = next;
            // If the browser snapped the write back to where we started
            // (sub-pixel step on a whole-pixel scroller) we can't get any
            // closer, so stop instead of spinning every frame.
            if (scrollerEl.scrollTop === current) stopTicking();
        };

        scrollerEl.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            scrollerEl.removeEventListener("wheel", handleWheel);
            stopTicking();
        };
    }, []);

    // Breakpoint detection. Runs before first paint, so on mobile there
    // is no visible flash of the desktop layout.
    useLayoutEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Cover-scale the design canvas to the viewport and anchor the fixed
    // chrome to exact screen pixels. Re-runs on breakpoint change.
    //
    // PERF: everything here is a pure function of the five inputs in
    // `key`. ResizeObserver fires once right after observe() with the size
    // we just handled, and can fire again for unchanged inputs, so we skip
    // those (each pass restyles the subtree via the CSS variables). The
    // full ScrollTrigger.refresh() is coalesced into one trailing call
    // instead of running for every observer notification.
    useLayoutEffect(() => {
        const scene = sceneRef.current;
        const viewport = viewportRef.current;
        if (!scene || !viewport) return undefined;

        let lastKey = "";
        let refreshTimer = 0;

        const updateDesignScale = () => {
            const designWidth = scene.offsetWidth;
            const designHeight = scene.offsetHeight;
            const viewportWidth = viewport.clientWidth;
            const viewportHeight = viewport.clientHeight;
            if (!designWidth || !designHeight || !viewportWidth || !viewportHeight) {
                return;
            }

            const mobileMode = window.matchMedia("(max-width: 768px)").matches;

            const key = `${designWidth}|${designHeight}|${viewportWidth}|${viewportHeight}|${mobileMode}`;
            if (key === lastKey) return;
            lastKey = key;

            // Cover scale (Math.max on purpose). Overflow is cropped from
            // the top only, via the bottom-anchored origin in the CSS.
            const scale = Math.max(
                viewportWidth / designWidth,
                viewportHeight / designHeight,
            );

            designScaleRef.current = scale;
            scene.style.setProperty("--design-scale", scale);
            scrollerRef.current?.style.setProperty("--design-scale", scale);

            // Chrome anchoring — maps a local point in .scene's design
            // space to its exact screen position at the current scale.
            const canvasW = mobileMode ? 24.375 : 88.3125;
            const chrome = mobileMode ? CHROME_MOBILE : CHROME;
            const remToPx = designWidth / canvasW;

            const toScreenX = (localRem) => (
                viewportWidth / 2 + (localRem * remToPx - designWidth / 2) * scale
            );
            const toScreenTop = (localRem) => (
                viewportHeight - (designHeight - localRem * remToPx) * scale
            );
            const toScreenBottom = (localRem) => (
                (49.0625 - localRem) * remToPx * scale
            );

            const host = scrollerRef.current;
            if (host) {
                const set = (name, px) => host.style.setProperty(name, `${px}px`);
                set("--theme-left", toScreenX(chrome.theme.left));
                set("--theme-top", toScreenTop(chrome.theme.top));
                set("--identity-left", toScreenX(chrome.identity.left));
                set("--identity-top", toScreenTop(chrome.identity.top));
                set("--coords-left", toScreenX(chrome.coords.left));
                set("--coords-top", toScreenTop(chrome.coords.top));
                set("--exhibits-left", toScreenX(chrome.exhibits.left));
                set("--exhibits-top", toScreenTop(chrome.exhibits.top));
                set("--enter-left", toScreenX(chrome.enter.left));
                set("--enter-bottom", toScreenBottom(chrome.enter.top + chrome.enter.height));
            }

            window.clearTimeout(refreshTimer);
            refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 100);
        };

        updateDesignScale();

        const resizeObserver = new ResizeObserver(updateDesignScale);
        resizeObserver.observe(viewport);

        return () => {
            resizeObserver.disconnect();
            window.clearTimeout(refreshTimer);
        };
    }, [isMobile]);

    // Scroll-driven scene. Every layer gets its own ScrollTrigger sharing
    // the same runway but with its own scrub/ease from MOTION. Rebuilt
    // whenever the breakpoint changes so it uses the right layout.
    useGSAP(() => {
        const L = isMobile ? LAYOUT_MOBILE : LAYOUT;

        const scrollTriggerBase = {
            scroller: scrollerRef.current,
            trigger: runwayRef.current,
            start: "top top",
            end: "bottom bottom",
        };

        // Auto-enter near the bottom of the runway (no scrub lag).
        ScrollTrigger.create({
            ...scrollTriggerBase,
            onUpdate: (self) => {
                if (self.progress > 0.985) handleEnterRef.current?.();
            },
        });

        // Chrome fade: gone within the first 10% of the runway.
        // PERF: no animation is attached here, so scrub/invalidateOnRefresh
        // did nothing. quickSetter writes opacity directly (no tween object
        // per call), and we skip the write when the value hasn't changed —
        // i.e. for the whole runway after the fade has finished.
        const chromeTargets = [
            themeRef.current,
            identityRef.current,
            coordsRef.current,
            exhibitsRef.current,
            enterRef.current,
        ].filter(Boolean);

        if (chromeTargets.length) {
            const setChromeOpacity = gsap.quickSetter(chromeTargets, "opacity");
            let lastChromeOpacity = -1;
            ScrollTrigger.create({
                ...scrollTriggerBase,
                onUpdate: (self) => {
                    const opacity = 1 - gsap.utils.clamp(0, 1, self.progress / 0.10);
                    if (opacity === lastChromeOpacity) return;
                    lastChromeOpacity = opacity;
                    setChromeOpacity(opacity);
                },
            });
        }

        const createParallaxLayer = (ref, config, motion, fadeAt) => {
            if (!ref.current) return;
            const fromVars = { scale: 1, x: 0, y: 0 };
            const toVars = { duration: 1, ease: motion.ease };
            if (config.xPercent !== undefined) {
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

            // Title opacity fades partway through the scroll, on the same
            // per-layer timeline so it shares that layer's scrub feel.
            if (fadeAt !== undefined) {
                layerTl.fromTo(
                    ref.current,
                    { opacity: 1 },
                    { opacity: 0, duration: 0.45, ease: "power1.in" },
                    fadeAt,
                );
            }
        };

        createParallaxLayer(backgroundRef, L.background, MOTION.background);
        createParallaxLayer(islandRef, L.island, MOTION.island);
        createParallaxLayer(groundRef, L.ground, MOTION.ground);
        createParallaxLayer(bgrocksRef, L.bgrocks, MOTION.bgrocks);
        createParallaxLayer(t1Ref, L.t1, MOTION.glyph, 0.5);
        createParallaxLayer(girlRef, L.girl, MOTION.girl);

        if (portalRef.current) {
            const portalCoversViewport = () => {
                const p = portalRef.current?.getBoundingClientRect();
                const v = viewportRef.current?.getBoundingClientRect();
                if (!p || !v) return false;
                return (
                    p.left <= v.left + 1 &&
                    p.right >= v.right - 1 &&
                    p.top <= v.top + 1 &&
                    p.bottom >= v.bottom - 1
                );
            };

            let coverScaleFloor = 0;
            const portalTargetScale = () => {
                const target = (
                    Math.max(
                        viewportRef.current.clientWidth / portalRef.current.offsetWidth,
                        viewportRef.current.clientHeight / portalRef.current.offsetHeight,
                    ) * L.portal.zoomMultiplier
                ) / (designScaleRef.current || 1);
                coverScaleFloor = (target / L.portal.zoomMultiplier) * 0.9;
                return target;
            };

            gsap.timeline({
                scrollTrigger: {
                    ...scrollTriggerBase,
                    scrub: MOTION.portal.scrub,
                    invalidateOnRefresh: true,
                },
                onUpdate: () => {
                    const portalEl = portalRef.current;
                    if (!portalEl) return;
                    if (gsap.getProperty(portalEl, "scaleX") < coverScaleFloor) return;
                    if (portalCoversViewport()) handleEnterRef.current?.();
                },
            }).fromTo(
                portalRef.current,
                { scale: 1, x: 0, y: 0 },
                {
                    scale: portalTargetScale,
                    x: () => (
                        sceneRef.current.offsetWidth / 2
                        - (portalRef.current.offsetLeft + portalRef.current.offsetWidth / 2)
                    ),
                    y: () => (
                        sceneRef.current.offsetHeight
                        - (portalRef.current.offsetTop + portalRef.current.offsetHeight / 2)
                        - (viewportRef.current.clientHeight / 2) / (designScaleRef.current || 1)
                    ),
                    ...(L.portal.zLift ? {
                        zIndex: L.portal.z + L.portal.zLift,
                        snap: { zIndex: 1 },
                    } : null),
                    duration: 1,
                    ease: MOTION.portal.ease,
                },
                0,
            );
        }
    }, { scope: scrollerRef, dependencies: [isMobile], revertOnUpdate: true });

    const activeLayout = isMobile ? LAYOUT_MOBILE : LAYOUT;
    const activeChrome = isMobile ? CHROME_MOBILE : CHROME;

    return (
        <main
            id="hero-scroller"
            ref={scrollerRef}
            className={styles.scroller}
            tabIndex={0}
            aria-label="Scroll to move toward the black box"
        >
            <a
                href="#home"
                className={styles.fixedLogo}
                style={{
                    backgroundImage: `url(${assetBase}tathvawhitelogo-1.svg)`,
                }}
                aria-label="Tathva home"
            />

            {/* FIXED HERO CHROME — siblings of .runway/.scene so they are
                position: fixed to the real viewport. Their top/left come
                from CSS variables set in the layout effect above. Only
                opacity is tied to scroll (chrome fade). */}
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
                    width: `${activeChrome.enter.width}rem`,
                    height: `${activeChrome.enter.height}rem`,
                }}
                aria-label="Enter Tathva 26"
            >
                <span className={styles.keycapBracketL} aria-hidden="true">[</span>
                <span className={styles.keycapBracketR} aria-hidden="true">]</span>
                <span className={styles.keycapFace}>
                    <span className={styles.enterLabel}>Enter</span>
                    <svg className={styles.enterArrow} viewBox="0 0 28 12" fill="none"
                        stroke="currentColor" strokeWidth="1" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 6 H26" />
                        <polyline points="21 1.5 26 6 21 10.5" />
                    </svg>
                </span>
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
                        {/* Zero-size SVG filter definition for the portal rim. */}
                        <svg aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
                            <filter id="portalEdgeNoise" x="-40%" y="-40%" width="180%" height="180%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.015 0.05" numOctaves="2" seed="7" result="noise" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
                            </filter>
                        </svg>

                        <div
                            ref={backgroundRef}
                            className={styles.background}
                            style={{ backgroundImage: `url(${assetBase}background1.png)` }}
                            aria-hidden="true"
                        />

                        <div
                            ref={islandRef}
                            className={styles.islandWrap}
                            style={{
                                top: `${activeLayout.island.top}rem`,
                                left: `${activeLayout.island.left}rem`,
                                width: `${activeLayout.island.width}rem`,
                                height: `${activeLayout.island.height}rem`,
                            }}
                            aria-hidden="true"
                        >
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
                                top: `${activeLayout.ground.top}rem`,
                                left: `${activeLayout.ground.left}rem`,
                                width: `${activeLayout.ground.width}rem`,
                                height: `${activeLayout.ground.height}rem`,
                            }}
                            aria-hidden="true"
                        >
                            <img
                                className={styles.ground}
                                alt=""
                                aria-hidden="true"
                                src={`${assetBase}rockyground.png`}
                            />
                        </div>

                        <img
                            ref={bgrocksRef}
                            className={styles.bgrocks}
                            style={{
                                top: `${activeLayout.bgrocks.top}rem`,
                                left: `${activeLayout.bgrocks.left}rem`,
                                width: `${activeLayout.bgrocks.width}rem`,
                                height: `${activeLayout.bgrocks.height}rem`,
                            }}
                            alt=""
                            aria-hidden="true"
                            src={`${assetBase}bgrocks.png`}
                        />

                        <div
                            className={styles.t1SafeWrapper}
                            style={{
                                top: `${activeLayout.t1.top}rem`,
                                left: `${activeLayout.t1.left}rem`,
                                width: `${activeLayout.t1.width}rem`,
                                height: `${activeLayout.t1.height}rem`,
                            }}
                        >
                            <img
                                ref={t1Ref}
                                className={styles.titleLetter}
                                alt=""
                                aria-hidden="true"
                                src={isMobile
                                    ? `${assetBase}tathva_mobile.svg`
                                    : `${assetBase}tathva_text1.png`}
                            />
                        </div>

                        <div
                            ref={portalRef}
                            className={styles.portal}
                            style={{
                                top: `${activeLayout.portal.top}rem`,
                                left: `${activeLayout.portal.left}rem`,
                                width: `${activeLayout.portal.width}rem`,
                                height: `${activeLayout.portal.height}rem`,
                            }}
                            aria-hidden="true"
                        >
                            <div className={styles.portalGlow} />
                            <div className={styles.portalHaze} />
                            <div className={styles.portalGroundGlow} />
                            <div className={styles.portalRim} />
                        </div>

                        <div
                            ref={girlRef}
                            className={styles.girlWrap}
                            style={{
                                top: `${activeLayout.girl.top}rem`,
                                left: `${activeLayout.girl.left}rem`,
                                width: `${activeLayout.girl.width}rem`,
                                height: `${activeLayout.girl.height}rem`,
                            }}
                            aria-hidden="true"
                        >
                            <img
                                className={styles.girl}
                                alt=""
                                aria-hidden="true"
                                src={`${assetBase}girl4.png`}
                            />
                            <div className={styles.girlContact} />
                        </div>


                        <span className="sr-only" role="status" aria-live="polite">
                            {hasEntered ? "Entering Tathva 26" : ""}
                        </span>
                    </div>
                </div>
            </section>
        </main>
    );
};
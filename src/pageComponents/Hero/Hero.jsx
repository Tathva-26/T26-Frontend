'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
// MotionPathPlugin ships inside the installed `gsap` package (all
// GSAP plugins are free since 3.13), so no new dependency is needed.
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import styles from './Hero.module.css'

// Register once at module level so ScrollTrigger.refresh() is safe to
// call from any effect, regardless of effect order.
gsap.registerPlugin(ScrollTrigger, useGSAP, MotionPathPlugin)

const assetBase = '/images/hero/'

// ---------------------------------------------------------------------
// SCENE LAYOUT (desktop) — positions/sizes in .scene design-space rem
// (88.3125 x 49.0625rem canvas, cover-scaled to the viewport).
// driftX/driftY (px) and scaleTo drive the scroll parallax. Depth order,
// nearest to farthest: girl, ground/portal, bgrocks, t1, island,
// background. z / zLift = z-index at rest / added by end of scroll.
// ---------------------------------------------------------------------
const LAYOUT = {
  background: {
    driftY: -1,
    scaleTo: 1.02,
    z: 0,
    zLift: 0,
  },
  island: {
    top: 0.1,
    left: 41.8,
    width: 40,
    height: 37,
    driftX: 0,
    driftY: -50,
    scaleTo: 1.04,
    z: 1,
    zLift: 0,
  },
  ground: {
    top: 45,
    left: 5,
    width: 88.3125,
    height: 26,
    driftX: 0,
    driftY: -4,
    scaleTo: 1.02,
    z: 2,
    zLift: 0,
  },
  bgrocks: {
    top: 42,
    left: 0,
    width: 88.3125,
    height: 14,
    driftX: 0,
    driftY: -2,
    scaleTo: 1.25,
    z: 1,
    zLift: 0,
  },
  // T1 renders the full "TATHVA" wordmark on its own.
  t1: {
    top: 14.5,
    left: 7,
    width: 75,
    height: 30.6,
    driftX: 0,
    driftY: -25,
    scaleTo: 1,
    z: 3,
    zLift: 0,
  },
  portal: {
    top: 31.5,
    left: 36.25,
    width: 9.125,
    height: 20.1875,
    zoomMultiplier: 1.04, // slight overshoot so it fully covers the viewport
    z: 4,
    zLift: 0,
  },
  girl: {
    top: 36,
    left: 18.5,
    width: 54,
    height: 15,
    driftX: 1100,
    driftY: 1500,
    scaleTo: 15.55,
    z: 5,
    zLift: 10,
  },
}

// ---------------------------------------------------------------------
// MOTION RESPONSE — per-layer scrub (seconds of lag behind the real
// scroll position = inertia) and ease (shape across scroll distance).
// ---------------------------------------------------------------------
const MOTION = {
  background: { scrub: 1.1, ease: 'sine.inOut' },
  island: { scrub: 0.85, ease: 'sine.out' },
  ground: { scrub: 0.4, ease: 'power1.out' },
  bgrocks: { scrub: 0.45, ease: 'power1.inOut' },
  glyph: { scrub: 0.6, ease: 'power2.out' },
  portal: { scrub: 0.18, ease: 'none' },
  girl: { scrub: 1.3, ease: 'power1.inOut' },
  // chrome: { scrub: 0.0001, ease: "power1.out" }, // UNUSED: chrome fade uses quickSetter, not MOTION
}

// ---------------------------------------------------------------------
// FIXED HERO CHROME (desktop) — reference points in .scene design-space
// rem. The layout effect converts each one to an exact on-screen pixel
// position and writes it to CSS variables (--theme-left etc.).
// ---------------------------------------------------------------------
const CHROME = {
  identity: { top: 7, left: 82.125 },
  coords: { top: 17.3125, left: 82.175 },
  exhibits: { top: 30.8125, left: 78.6875 },
  theme: { top: 10.125, left: 3.25 },
  enter: { top: 39.625, left: 6.8125, width: 11.0625, height: 3.0625 },
}

// ---------------------------------------------------------------------
// MOBILE LAYOUT — portrait canvas 24.375 x 49.0625 rem (~390 x 785 px).
// ---------------------------------------------------------------------
const LAYOUT_MOBILE = {
  background: {
    driftY: -1,
    scaleTo: 1.02,
    z: 0,
    zLift: 0,
  },
  island: {
    top: 13,
    left: -0.5,
    width: 23,
    height: 17,
    driftX: 0,
    driftY: -60,
    scaleTo: 1.04,
    z: 4,
    zLift: 0,
  },
  ground: {
    top: 38,
    left: -1,
    width: 26.375,
    height: 16,
    driftX: 0,
    driftY: 30,
    scaleTo: 1.02,
    z: 2,
    zLift: 0,
  },
  bgrocks: {
    top: 39,
    left: 0,
    width: 24.375,
    height: 10,
    driftX: 0,
    driftY: -2,
    scaleTo: 1.15,
    z: 1,
    zLift: 0,
  },
  t1: {
    top: 27.5,
    left: 1.3,
    width: 21.375,
    height: 7.2,
    driftX: 0,
    driftY: 0,
    scaleTo: 1,
    z: 3,
    zLift: 0,
  },
  portal: {
    top: 36,
    left: 8.5,
    width: 7.375,
    height: 16.5,
    zoomMultiplier: 4.04,
    z: 4,
    zLift: 0,
  },
  girl: {
    top: 30,
    left: 0.9,
    width: 30.5,
    height: 20,
    driftX: 2090,
    driftY: -1550,
    scaleTo: 60,
    z: 5,
    zLift: 10,
  },
}

// Mobile chrome — same (top, left) reference-point model as desktop, so
// the same pixel-anchoring code positions it. Coords is hidden in CSS.
const CHROME_MOBILE = {
  identity: { top: 7.5, left: 24.23 },
  coords: { top: 25.3125, left: 0 },
  theme: { top: 6, left: 1 },
  exhibits: { top: 37.5, left: 22.9 },
  enter: { top: 46.2, left: 1.25, width: 7.5, height: 2.6 },
}

export const Hero = ({
  onEnter,
  onProgress,
  onScrollBeyondEnd,
  onAutoEnter,
  isActive = true,
}) => {
  const [hasEntered, setHasEntered] = useState(false)
  const [ripples, setRipples] = useState([])
  // Must start as false so the first client render matches the server
  // HTML (no hydration mismatch). The layout effect below flips it
  // before first paint on mobile.
  const [isMobile, setIsMobile] = useState(false)

  const scrollerRef = useRef(null)
  const runwayRef = useRef(null)
  const viewportRef = useRef(null)
  const sceneRef = useRef(null)

  const backgroundRef = useRef(null)
  const groundRef = useRef(null)
  const bgrocksRef = useRef(null)
  const t1Ref = useRef(null)
  const portalRef = useRef(null)
  const islandRef = useRef(null)
  const trailPathRef = useRef(null)
  const birdLayerRef = useRef(null)
  const birdRef = useRef(null)
  const birdFlipperRef = useRef(null)
  const girlRef = useRef(null)
  const identityRef = useRef(null)
  const coordsRef = useRef(null)
  const themeRef = useRef(null)
  const exhibitsRef = useRef(null)
  const enterRef = useRef(null)
  const videoRef = useRef(null)

  // Cover scale applied to the fixed-size design canvas.
  const designScaleRef = useRef(1)

  const onProgressRef = useRef(onProgress)
  const onScrollBeyondEndRef = useRef(onScrollBeyondEnd)
  const onAutoEnterRef = useRef(onAutoEnter || onEnter)
  useEffect(() => {
    onProgressRef.current = onProgress
    onScrollBeyondEndRef.current = onScrollBeyondEnd
    onAutoEnterRef.current = onAutoEnter || onEnter
  })

  // KEEP: React sets `muted` as a property, not an attribute, so autoPlay can be blocked after
  // hydration; this explicit play() is the standard workaround.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [])

  // Hero stays mounted (hidden) while Frame is showing. Stop the title video decoding and freeze
  // the CSS animations (bird flap etc.) until Hero is the active panel again.
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      if (isActive) video.play().catch(() => {})
      else video.pause()
    }
    scrollerRef.current?.toggleAttribute('data-paused', !isActive)
  }, [isActive])

  // Enter click: ripple at the click point, then animate the hero
  // scroll runway to its end (portal zoom), then let the page scroll
  // naturally to the Frame section below.
  const handleEnterClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ripple = {
      id: `${Date.now()}-${Math.random()}`,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    setRipples((current) => [...current, ripple])
    window.setTimeout(() => {
      setRipples((current) => current.filter((r) => r.id !== ripple.id))
    }, 650)

    const scrollerEl = scrollerRef.current
    if (!scrollerEl) {
      setHasEntered(true)
      onAutoEnterRef.current?.()
      return
    }

    gsap.to(scrollerEl, {
      scrollTop: scrollerEl.scrollHeight - scrollerEl.clientHeight,
      duration: 1.6,
      ease: 'power1.inOut',
      overwrite: true,
      onComplete: () => {
        setHasEntered(true)
        onAutoEnterRef.current?.()
      },
    })
  }

  // Physical Enter key -> same cinematic zoom as button click.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Enter' || e.repeat || hasEntered) return
      const btn = enterRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      handleEnterClick({
        currentTarget: btn,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEntered])

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
    const scrollerEl = scrollerRef.current
    if (!scrollerEl) return undefined

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const SMOOTHING = 0.16
    const LINE_HEIGHT = 16

    const getMaxScroll = () => scrollerEl.scrollHeight - scrollerEl.clientHeight
    const normalizeDeltaY = (event) => {
      if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT
      if (event.deltaMode === 2) return event.deltaY * scrollerEl.clientHeight
      return event.deltaY
    }

    let targetScroll = scrollerEl.scrollTop
    let lastWritten = scrollerEl.scrollTop
    let ticking = false

    const resyncIfMovedExternally = () => {
      if (Math.abs(scrollerEl.scrollTop - lastWritten) > 1) {
        targetScroll = scrollerEl.scrollTop
      }
    }

    const startTicking = () => {
      if (ticking) return
      ticking = true
      gsap.ticker.add(tick)
    }

    const stopTicking = () => {
      if (!ticking) return
      ticking = false
      gsap.ticker.remove(tick)
    }

    const handleWheel = (event) => {
      if (event.ctrlKey) return
      event.preventDefault()
      resyncIfMovedExternally()
      const maxScroll = getMaxScroll()
      const delta = normalizeDeltaY(event)
      if (delta > 0 && scrollerEl.scrollTop >= maxScroll - 2) {
        onScrollBeyondEndRef.current?.(delta)
        return
      }
      if (delta > 0 && targetScroll + delta > maxScroll) {
        const overflow = targetScroll + delta - maxScroll
        targetScroll = maxScroll
        startTicking()
        if (scrollerEl.scrollTop >= maxScroll - 5) {
          onScrollBeyondEndRef.current?.(overflow)
        }
        return
      }
      targetScroll = gsap.utils.clamp(0, maxScroll, targetScroll + delta)
      startTicking()
    }

    const tick = () => {
      resyncIfMovedExternally()
      const current = scrollerEl.scrollTop
      const delta = targetScroll - current
      if (Math.abs(delta) < 0.05) {
        lastWritten = current
        stopTicking()
        return
      }
      const next =
        current + delta * Math.min(1, SMOOTHING * gsap.ticker.deltaRatio())
      scrollerEl.scrollTop = next
      lastWritten = next
      // If the browser snapped the write back to where we started
      // (sub-pixel step on a whole-pixel scroller) we can't get any
      // closer, so stop instead of spinning every frame.
      if (scrollerEl.scrollTop === current) stopTicking()
    }

    let touchStartY = 0
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }
    const handleTouchMove = (e) => {
      const maxScroll = getMaxScroll()
      const currentY = e.touches[0].clientY
      const delta = touchStartY - currentY
      touchStartY = currentY
      if (delta > 0 && scrollerEl.scrollTop >= maxScroll - 2) {
        onScrollBeyondEndRef.current?.(delta * 1.5)
      }
    }

    scrollerEl.addEventListener('wheel', handleWheel, { passive: false })
    scrollerEl.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    })
    scrollerEl.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      scrollerEl.removeEventListener('wheel', handleWheel)
      scrollerEl.removeEventListener('touchstart', handleTouchStart)
      scrollerEl.removeEventListener('touchmove', handleTouchMove)
      stopTicking()
    }
  }, [])

  // Breakpoint detection. Runs before first paint, so on mobile there
  // is no visible flash of the desktop layout.
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

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
    const scene = sceneRef.current
    const viewport = viewportRef.current
    if (!scene || !viewport) return undefined

    let lastKey = ''
    let refreshTimer = 0

    const updateDesignScale = () => {
      const designWidth = scene.offsetWidth
      const designHeight = scene.offsetHeight
      const viewportWidth = viewport.clientWidth
      const viewportHeight = viewport.clientHeight
      if (!designWidth || !designHeight || !viewportWidth || !viewportHeight) {
        return
      }

      const mobileMode = window.matchMedia('(max-width: 768px)').matches

      const key = `${designWidth}|${designHeight}|${viewportWidth}|${viewportHeight}|${mobileMode}`
      if (key === lastKey) return
      lastKey = key

      // On desktop, scale to fit the viewport height so the top of the scene
      // (including the bird flight, island, and sky) is never cropped off on wider screens.
      // On mobile, use cover scale so the portrait canvas fills the screen.
      const scale = mobileMode
        ? Math.max(viewportWidth / designWidth, viewportHeight / designHeight)
        : viewportHeight / designHeight

      designScaleRef.current = scale
      scene.style.setProperty('--design-scale', scale)
      scrollerRef.current?.style.setProperty('--design-scale', scale)

      // Chrome anchoring — maps a local point in .scene's design
      // space to its exact screen position.
      const canvasW = mobileMode ? 24.375 : 88.3125
      const chrome = mobileMode ? CHROME_MOBILE : CHROME
      const remToPx = designWidth / canvasW

      // In all landscape orientations, maintain the exact distance from the sides
      // based on the reference desktop scale (695 / 785 ≈ 0.88535).
      const REF_SCALE = 695 / 785

      const toScreenLeft = (localRem) => localRem * remToPx * REF_SCALE
      const toScreenRight = (localRem) =>
        (canvasW - localRem) * remToPx * REF_SCALE

      const toScreenTop = (localRem) =>
        viewportHeight - (designHeight - localRem * remToPx) * scale
      const toScreenBottom = (localRem) =>
        (49.0625 - localRem) * remToPx * scale

      const host = scrollerRef.current
      if (host) {
        const set = (name, px) => host.style.setProperty(name, `${px}px`)
        if (mobileMode) {
          // On mobile, use viewport-relative positions so chrome is always
          // visible regardless of orientation (landscape/portrait).
          // Measure the actual navbar height; fall back to 68px.
          const navEl = document.querySelector('.nb')
          const navH = navEl ? navEl.getBoundingClientRect().bottom : 68
          const PAD = 20

          // Theme — top-left, flush below navbar
          set('--theme-left', PAD)
          set('--theme-top', navH + 16)

          // Identity — top-right, cleanly below navbar lines
          host.style.setProperty('--identity-left', `${viewportWidth - PAD}px`)
          set('--identity-top', navH + 16)

          // Coords — right-anchored below identity
          set('--coords-left', viewportWidth - PAD)
          set('--coords-top', navH + 12065)

          // Exhibits — bottom-right, comfortably above enter button
          host.style.setProperty('--exhibits-left', `${viewportWidth - PAD}px`)
          set('--exhibits-top', viewportHeight - 190)

          // Enter button — bottom-left
          set('--enter-left', PAD)
          set('--enter-bottom', 36)
        } else {
          set('--theme-left', toScreenLeft(chrome.theme.left))
          set('--enter-left', toScreenLeft(chrome.enter.left))
          set(
            '--identity-left',
            viewportWidth - toScreenRight(chrome.identity.left),
          )
          set(
            '--coords-left',
            viewportWidth - toScreenRight(chrome.coords.left),
          )
          set(
            '--exhibits-left',
            viewportWidth - toScreenRight(chrome.exhibits.left),
          )
          set('--theme-top', toScreenTop(chrome.theme.top))
          set('--identity-top', toScreenTop(chrome.identity.top))
          set('--coords-top', toScreenTop(chrome.coords.top))
          set('--exhibits-top', toScreenTop(chrome.exhibits.top))
          set(
            '--enter-bottom',
            toScreenBottom(chrome.enter.top + chrome.enter.height),
          )
        }
      }

      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 100)
    }

    updateDesignScale()

    const resizeObserver = new ResizeObserver(updateDesignScale)
    resizeObserver.observe(viewport)

    return () => {
      resizeObserver.disconnect()
      window.clearTimeout(refreshTimer)
    }
  }, [isMobile])

  // Scroll-driven scene. Every layer gets its own ScrollTrigger sharing
  // the same runway but with its own scrub/ease from MOTION. Rebuilt
  // whenever the breakpoint changes so it uses the right layout.
  useGSAP(
    () => {
      const L = isMobile ? LAYOUT_MOBILE : LAYOUT

      const scrollTriggerBase = {
        scroller: scrollerRef.current,
        trigger: runwayRef.current,
        start: 'top top',
        end: 'bottom bottom',
      }

      // Report scroll progress for scroll-driven whiteout transition.
      ScrollTrigger.create({
        ...scrollTriggerBase,
        onUpdate: (self) => {
          onProgressRef.current?.(self.progress)
        },
      })

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
      ].filter(Boolean)

      if (chromeTargets.length) {
        const setChromeOpacity = gsap.quickSetter(chromeTargets, 'opacity')
        let lastChromeOpacity = -1
        ScrollTrigger.create({
          ...scrollTriggerBase,
          onUpdate: (self) => {
            const opacity = 1 - gsap.utils.clamp(0, 1, self.progress / 0.1)
            if (opacity === lastChromeOpacity) return
            lastChromeOpacity = opacity
            setChromeOpacity(opacity)
          },
        })
      }

      // counterRef (optional): an element INSIDE `ref` that is counter-scaled so it stays the same
      // on-screen size while `ref` zooms. Used to keep the title video static while the text-shaped
      // mask (the "clip") grows around it. Both are transform-only, so it stays on the compositor.
      const createParallaxLayer = (ref, config, motion, fadeAt, counterRef) => {
        if (!ref.current) return
        const fromVars = { scale: 1, x: 0, y: 0 }
        const toVars = { duration: 1, ease: motion.ease }
        if (config.xPercent !== undefined) {
          fromVars.xPercent = config.xPercent
          toVars.xPercent = config.xPercent
        }
        if (config.driftX) toVars.x = config.driftX
        if (config.driftY) toVars.y = config.driftY
        if (config.scaleTo !== undefined) toVars.scale = config.scaleTo
        if (config.opacityTo !== undefined) toVars.opacity = config.opacityTo
        if (config.zLift) {
          toVars.zIndex = config.z + config.zLift
          toVars.snap = { zIndex: 1 }
        }

        if (counterRef?.current) {
          gsap.set(counterRef.current, { clearProps: 'transform' })
          if (config.scaleTo && config.scaleTo !== 1) {
            // exact inverse of the parent's CURRENT scale on every frame (not a second tween,
            // which would only match at the endpoints)
            toVars.onUpdate = () => {
              gsap.set(counterRef.current, {
                scale: 1 / gsap.getProperty(ref.current, 'scaleX'),
              })
            }
          }
        }

        const layerTl = gsap.timeline({
          scrollTrigger: {
            ...scrollTriggerBase,
            scrub: motion.scrub,
            invalidateOnRefresh: true,
          },
        })
        layerTl.fromTo(ref.current, fromVars, toVars, 0)

        // Title opacity fades partway through the scroll, on the same
        // per-layer timeline so it shares that layer's scrub feel.
        if (fadeAt !== undefined) {
          layerTl.fromTo(
            ref.current,
            { opacity: 1 },
            { opacity: 0, duration: 0.45, ease: 'power1.in' },
            fadeAt,
          )
        }
      }

      createParallaxLayer(backgroundRef, L.background, MOTION.background)
      createParallaxLayer(islandRef, L.island, MOTION.island)
      createParallaxLayer(groundRef, L.ground, MOTION.ground)
      createParallaxLayer(bgrocksRef, L.bgrocks, MOTION.bgrocks)
      createParallaxLayer(t1Ref, L.t1, MOTION.glyph, 0.5, videoRef)
      createParallaxLayer(girlRef, L.girl, MOTION.girl)

      if (portalRef.current) {
        /* UNUSED (never called) - commented out:
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
            */

        // let coverScaleFloor = 0; // UNUSED
        const portalTargetScale = () => {
          const target =
            (Math.max(
              viewportRef.current.clientWidth / portalRef.current.offsetWidth,
              viewportRef.current.clientHeight / portalRef.current.offsetHeight,
            ) *
              L.portal.zoomMultiplier) /
            (designScaleRef.current || 1)
          // coverScaleFloor = (target / L.portal.zoomMultiplier) * 0.9; // UNUSED
          return target
        }

        gsap
          .timeline({
            scrollTrigger: {
              ...scrollTriggerBase,
              scrub: MOTION.portal.scrub,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            portalRef.current,
            { scale: 1, x: 0, y: 0 },
            {
              scale: portalTargetScale,
              x: () =>
                viewportRef.current.clientWidth /
                  2 /
                  (designScaleRef.current || 1) -
                (portalRef.current.offsetLeft +
                  portalRef.current.offsetWidth / 2),
              y: () =>
                sceneRef.current.offsetHeight -
                (portalRef.current.offsetTop +
                  portalRef.current.offsetHeight / 2) -
                viewportRef.current.clientHeight /
                  2 /
                  (designScaleRef.current || 1),
              ...(L.portal.zLift
                ? {
                    zIndex: L.portal.z + L.portal.zLift,
                    snap: { zIndex: 1 },
                  }
                : null),
              duration: 1,
              ease: MOTION.portal.ease,
            },
            0,
          )
      }

      // Bird flight — flies along the combined trail (both segments merged
      // with bridge + extension beyond the trail end). The outer .bird div
      // is positioned by MotionPath; the inner birdFlipper handles the
      // mirror flip; the innermost img does the wing-flap via CSS.
      //
      // Behaviour:
      //  • Starts facing left (scaleX -1)
      //  • Gradually flips to right around the curve turnaround (~5s)
      //  • After the first trail segment (~7s), drops behind the island
      //  • Continues through bridge, second segment, and extension
      //  • Stops ~2-3s after the visible trail ends
      if (
        birdRef.current &&
        birdFlipperRef.current &&
        trailPathRef.current &&
        birdLayerRef.current
      ) {
        const reduceMotion = window.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches
        const flightDuration = 11
        const baseMotionPath = {
          path: trailPathRef.current,
          align: trailPathRef.current,
          alignOrigin: [0.5, 0.5],
        }
        if (!reduceMotion) {
          const flight = gsap.timeline()
          // 1. Motion path along the combined curve (outer container only)
          flight.fromTo(
            birdRef.current,
            {
              motionPath: { ...baseMotionPath, start: 0, end: 0 },
            },
            {
              motionPath: { ...baseMotionPath, start: 0, end: 1 },
              duration: flightDuration,
              ease: 'sine.inOut',
            },
            0,
          )
          // 2. Initial orientation: facing left (scaleX: -1)
          flight.set(
            birdFlipperRef.current,
            { scaleX: -1, transformOrigin: '50% 50%' },
            0,
          )
          // 3. Gradual flip to facing right around the turnaround (~5.0s to ~6.6s)
          flight.fromTo(
            birdFlipperRef.current,
            { scaleX: -1, transformOrigin: '50% 50%' },
            { scaleX: 1, duration: 2.0, ease: 'sine.inOut' },
            4.5,
          )
          // 4. After the first trail segment, send only the bird layer
          // behind the island (~6s) — the trail stays in front.
          flight.set(birdLayerRef.current, { zIndex: 0 }, 6.0)
        } else {
          // Static pose: park the bird at the end facing right, behind island.
          gsap.set(birdRef.current, {
            motionPath: { ...baseMotionPath, start: 1, end: 1 },
          })
          gsap.set(birdFlipperRef.current, {
            scaleX: 1,
            transformOrigin: '50% 50%',
          })
          gsap.set(birdLayerRef.current, { zIndex: 0 })
        }
      }
    },
    { scope: scrollerRef, dependencies: [isMobile], revertOnUpdate: true },
  )

  const activeLayout = isMobile ? LAYOUT_MOBILE : LAYOUT
  const activeChrome = isMobile ? CHROME_MOBILE : CHROME
  // If the title layer zooms (scaleTo > 1) the video is sized zoom-times larger, centred, and
  // counter-scaled by GSAP, so the video itself never appears to zoom. scaleTo === 1 -> no change.
  const titleZoom = activeLayout.t1.scaleTo || 1
  const titleVideoStyle =
    titleZoom > 1
      ? {
          width: `${titleZoom * 100}%`,
          height: `${titleZoom * 100}%`,
          left: `${-(titleZoom - 1) * 50}%`,
          top: `${-(titleZoom - 1) * 50}%`,
        }
      : undefined

  return (
    <main
      id='hero-scroller'
      ref={scrollerRef}
      className={styles.scroller}
      tabIndex={0}
      aria-label='Scroll to move toward the black box'
    >
      <a
        href='#home'
        className={styles.fixedLogo}
        style={{
          backgroundImage: `url(${assetBase}tathvawhitelogo-1.svg)`,
        }}
        aria-label='Tathva home'
      />

      {/* FIXED HERO CHROME — siblings of .runway/.scene so they are
                position: fixed to the real viewport. Their top/left come
                from CSS variables set in the layout effect above. Only
                opacity is tied to scroll (chrome fade). */}
      <section
        ref={themeRef}
        className={styles.theme}
        aria-labelledby='hero-theme-title'
      >
        <div className={styles.themeHeading}>
          <h1 id='hero-theme-title' className={styles.themeTitle}>
            DIFFERENT REALITIES.
            <br />
            ONE EXHIBITION
          </h1>
          <img
            className={styles.themePlanet}
            alt=''
            aria-hidden='true'
            src={`${assetBase}planeticon.png`}
          />
        </div>
        <p className={styles.themeCopy}>
          A journey through technologies, cultures and possibilities beyond our
          own
        </p>
      </section>

      <aside
        ref={identityRef}
        className={styles.identity}
        aria-label='Tathva 26, Asteria'
      >
        <div className={styles.identityLabel}>
          <div className={styles.identityLabelInner}>
            <span>TATHVA 26</span>
            <span className={styles.identityDivider} aria-hidden='true' />
            <span>ASTERIA</span>
          </div>
        </div>
        <img
          className={styles.identityMark}
          alt=''
          aria-hidden='true'
          src={`${assetBase}butterfly.png`}
        />
      </aside>

      <div
        ref={coordsRef}
        className={styles.coords}
        aria-label='Location 11.321973 degrees north, 75.935386 degrees east'
      >
        <img
          className={styles.coordsRing}
          alt=''
          aria-hidden='true'
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
        aria-label='Event experiences'
      >
        <svg
          className={styles.exhibitsStar}
          width='21'
          height='21'
          viewBox='0 0 21 21'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden='true'
        >
          <path
            d='M6.59074 8.61492L4.86607 9.21034L2.52546 9.68257L6.0778e-05 9.99054L2.73802 10.3493L4.46821 10.6245L6.20308 11.146L7.88844 12.3051L8.79452 13.52L9.42255 15.2331L9.93909 17.5643L10.2949 20.0834L10.6904 17.4676L11.0154 15.746L11.5602 13.8505L12.7287 12.3051L13.9009 11.4072L15.646 10.7708L18.0688 10.3807L20.6396 9.99056L17.8982 9.6589L16.1654 9.40083L14.4254 8.89648L12.7287 7.75414L11.8106 6.54823L11.1657 4.84147L10.6261 2.51546L10.2454 0L9.87581 2.61966L9.56783 4.34432L9.01348 6.06899L7.82264 7.73205L6.59074 8.61492Z'
            fill='white'
          />
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
        type='button'
        onClick={handleEnterClick}
        className={styles.enterButton}
        style={{
          width: `${activeChrome.enter.width}rem`,
          height: `${activeChrome.enter.height}rem`,
        }}
        aria-label='Enter Tathva 26'
      >
        <span className={styles.keycapBracketL} aria-hidden='true'>
          [
        </span>
        <span className={styles.keycapBracketR} aria-hidden='true'>
          ]
        </span>
        <span className={styles.keycapFace}>
          <span className={styles.enterLabel}>Enter</span>
          <svg
            className={styles.enterArrow}
            viewBox='0 0 28 12'
            fill='none'
            stroke='currentColor'
            strokeWidth='1'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M1 6 H26' />
            <polyline points='21 1.5 26 6 21 10.5' />
          </svg>
        </span>
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={styles.ripple}
            style={{ left: ripple.x, top: ripple.y }}
            aria-hidden='true'
          />
        ))}
      </button>

      <section ref={runwayRef} className={styles.runway}>
        <div ref={viewportRef} className={styles.viewport}>
          <div
            ref={sceneRef}
            className={`relative shrink-0 ${styles.scene}`}
            data-model-id='10:78'
            aria-label='Tathva 26 Asteria'
          >
            {/* UNUSED (no CSS references #portalEdgeNoise) - commented out.
                            feTurbulence + feDisplacementMap is expensive; do not wire it back in.

                        <svg aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
                            <filter id="portalEdgeNoise" x="-40%" y="-40%" width="180%" height="180%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.015 0.05" numOctaves="2" seed="7" result="noise" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
                            </filter>
                        </svg>
                        */}

            <div
              ref={backgroundRef}
              className={styles.background}
              style={{ backgroundImage: `url(${assetBase}background1.png)` }}
              aria-hidden='true'
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
              aria-hidden='true'
            >
              {/* <div className={styles.islandGlow} /> UNUSED: no CSS rule, renders an empty div */}
              <img
                className={styles.island}
                alt=''
                aria-hidden='true'
                src={`${assetBase}floatingisland.png`}
              />
              <div className={styles.trailWrap}>
                <svg
                  className={styles.trailSvg}
                  viewBox='0 0 562 363'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  preserveAspectRatio='xMidYMid meet'
                  aria-hidden='true'
                >
                  {/* Visible trail strokes (two segments with gap) */}
                  <path
                    d='M560.523 361.761C293.335 280.614 -343.389 227.67 237.506 62.9024'
                    stroke='#7787FF'
                    strokeWidth='1.11538'
                    strokeLinecap='round'
                  />
                  <path
                    d='M379.513 43.6052C484.905 18.8653 490.756 16.8861 507.085 0.557739'
                    stroke='#7787FF'
                    strokeWidth='1.11538'
                    strokeLinecap='round'
                  />
                  {/* Hidden combined path for bird motion:
                                        segment 1 → smooth bridge → segment 2 → extension */}
                  <path
                    ref={trailPathRef}
                    d='M560.523 361.761C293.335 280.614 -343.389 227.67 237.506 62.9024C290 54 340 47 379.513 43.6052C484.905 18.8653 490.756 16.8861 507.085 0.557739C518 -8 530 -18 545 -30'
                    stroke='none'
                    fill='none'
                  />
                </svg>
              </div>
              <div ref={birdLayerRef} className={styles.birdLayer}>
                <div ref={birdRef} className={styles.bird}>
                  <div ref={birdFlipperRef} className={styles.birdFlipper}>
                    <img
                      className={styles.birdImg}
                      alt=''
                      aria-hidden='true'
                      src={`${assetBase}bird.svg`}
                    />
                  </div>
                </div>
              </div>
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
              aria-hidden='true'
            >
              <img
                className={styles.ground}
                alt=''
                aria-hidden='true'
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
              alt=''
              aria-hidden='true'
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
              <div
                ref={t1Ref}
                className={styles.t1Inner}
                style={{
                  '--title-mask': `url(${isMobile ? `${assetBase}tathva_mobile.svg` : `${assetBase}tathva_text.png`})`,
                }}
              >
                <div className={styles.titleVideoWrap}>
                  <video
                    ref={videoRef}
                    className={styles.titleVideo}
                    style={titleVideoStyle}
                    src={`${assetBase}titlebg.mp4`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload='auto'
                    aria-hidden='true'
                  />
                </div>
                <img
                  className={styles.titleLetter}
                  alt=''
                  aria-hidden='true'
                  src={
                    isMobile
                      ? `${assetBase}tathva_mobile.svg`
                      : `${assetBase}tathva_text.svg`
                  }
                />
              </div>
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
              aria-hidden='true'
            >
              {/* <div
                className={styles.portalHalo}
                style={{ backgroundImage: `url(${assetBase}portal-glow.png)` }}
              /> */}
              {/* REMOVED (baked into portal-glow.png):
                            <div className={styles.portalGlow} />
                            <div className={styles.portalHaze} />
                            <div className={styles.portalGroundGlow} />
                            <div className={styles.portalRim} />
                            */}
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
              aria-hidden='true'
            >
              <img
                className={styles.girl}
                alt=''
                aria-hidden='true'
                src={`${assetBase}girl4.png`}
              />
              <div className={styles.girlContact} />
            </div>

            <span className='sr-only' role='status' aria-live='polite'>
              {hasEntered ? 'Entering Tathva 26' : ''}
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}

'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useGSAP } from '@gsap/react'
import { animateBird, TRAIL_START, BRIDGE, TRAIL_END, FLIGHT_PATH } from './birdFlight'
import styles from './Hero.module.css'
// import { MotionPathPlugin } from "gsap/MotionPathPlugin"

// Register once at module level so ScrollTrigger.refresh() is safe to
// call from any effect, regardless of effect order.
gsap.registerPlugin(ScrollTrigger, useGSAP, MotionPathPlugin)
gsap.config({ force3D: true })

// The animated clip-path hole (see syncPortalFrame) repaints the whole scene on software/
// low-VRAM raster. Default to a plain cross-fade of the back layers instead; append ?clip=1
// to the URL to force the old hole-cut path for comparison/debugging.
const USE_CLIP_HOLE =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('clip') === '1'



const assetBase = '/images/hero/'

// Size of the blue spark that replaces the bird (design-space rem). The sprite is drawn
// heading right with its tail on the left; birdOrientation rotates it along the flight path.
const SPARK_SIZE = '4rem'

// The portal is drawn by this video; it sits over a hole cut in the scene (the real Frame shows
// through the hole) and fades out as the portal grows. PORTAL_IMG_FADE_END = portal progress (0..1) at which it is fully gone.
const PORTAL_VIDEO = 'portalloop.mp4' // small, low-res, muted, seamless loop
const PORTAL_POSTER = 'img.png' // shown until the first video frame is ready
const PORTAL_IMG_FADE_END = 0.85

// Decorative PNG frame around the portal. It sits inside the portal div, so it zooms with it.
// All values are static (set once, never animated) except the fade.
//   scale            multiplies the PNG size around its centre (1 = as sized by outset)
//   offsetX/offsetY  nudge the PNG, in % of its own width / height (+x right, +y down)
//   outsetX/outsetY  how far the PNG extends past the portal box, in % of portal width / height
//                    (0 = exactly the portal box)
//   opacity          max opacity while visible (0..1)
//   fadeStart/End    portal progress (0..1) where it starts / finishes fading out
//                    (fadeEnd optional: defaults to PORTAL_IMG_FADE_END)
//   aboveVideo       true = over the portal video, false = under it
const PORTAL_FRAME = {
  src: 'frame.png',
  scale: 1.2,
  offsetX: 0,
  offsetY: 3,
  outsetX: 0,
  outsetY: 0,
  opacity: 1,
  fadeStart: 0.8,
  fadeEnd: 1,
  aboveVideo: true,
}

// ---------------------------------------------------------------------
// SCENE LAYOUT (desktop) — positions/sizes in .scene design-space rem
// (88.3125 x 49.0625rem canvas, cover-scaled to the viewport).
// driftX/driftY (px) and scaleTo drive the scroll parallax. Depth order,
// nearest to farthest: girl, ground/portal, bgrocks, t1, island,
// background. z / zLift = z-index at rest / added by end of scroll.
// ---------------------------------------------------------------------
const LAYOUT = {
    background: {
        driftY: -1, scaleFrom: 1.08, scaleTo: 1.1, // scaleFrom = zoom at the start of the scroll (default 1)
        z: 0, zLift: 0,
    },
    island: {
        top: 2, left: 38.8, width: 45, height: 37,
        driftX: 0, driftY: -50, scaleTo: 1.04,
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
        top: 15.5, left: -1, width: 85, height: 30.6,
        driftX: 0, driftY: -25, scaleTo: 1,
        z: 3, zLift: 0,
    },
    portal: {
        top: 31.5, left: 36.25, width: 9.125, height: 20.1875,
        zoomMultiplier: 1.04, // slight overshoot so it fully covers the viewport
        z: 4, zLift: 0,
    },
    girl: {
        top: 36.5, left: 12.5, width: 65, height: 15,
        driftX: 2100, driftY: 500, scaleTo: 15.55,
        z: 5, zLift: 10,
    },
};

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
  portal: { scrub: 0.9, ease: 'none' },
  girl: { scrub: 0.9, ease: 'none' },
}

// ---------------------------------------------------------------------
// FIXED HERO CHROME (desktop) — reference points in .scene design-space
// rem. The layout effect converts each one to an exact on-screen pixel
// position and writes it to CSS variables (--theme-left etc.).
// ---------------------------------------------------------------------
const CHROME = {
    identity: { top: 7, left: 82.125 },
    coords: { top: 18.7125, left: 81.875 },
    exhibits: { top: 34.8125, left: 77.6875 },
    theme: { top: 8.125, left: 3.25 },
    enter: { top: 39.625, left: 9.8125, width: 11.0625, height: 3.0625 },
};

// ---------------------------------------------------------------------
// MOBILE LAYOUT — portrait canvas 24.375 x 49.0625 rem (~390 x 785 px).
// ---------------------------------------------------------------------
const LAYOUT_MOBILE = {
  background: {
    driftY: -1,
    scaleFrom: 1.08,
    scaleTo: 1.1,
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
    top: 31,
    left: -1.9,
    width: 35.5,
    height: 20,
    driftX: 2590,
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
  const backLayersRef = useRef(null)
  const portalVideoRef = useRef(null)
  const portalFrameImgRef = useRef(null)
  const islandRef = useRef(null)
  const trailPathRef = useRef(null)
  const frontStrokeRef = useRef(null)
  const clipBackRef = useRef(null)
  const clipFrontRef = useRef(null)
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

  const designScaleRef = useRef(1)
  const forceSyncRef = useRef(null)

  const onProgressRef = useRef(onProgress)
  const onScrollBeyondEndRef = useRef(onScrollBeyondEnd)
  const onAutoEnterRef = useRef(onAutoEnter || onEnter)
  useEffect(() => {
    onProgressRef.current = onProgress
    onScrollBeyondEndRef.current = onScrollBeyondEnd
    onAutoEnterRef.current = onAutoEnter || onEnter
  })

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      if (isActive) video.play().catch(() => {})
      else video.pause()
    }
    const pv = portalVideoRef.current
    if (pv) {
      if (isActive) pv.play().catch(() => {})
      else pv.pause()
    }
    scrollerRef.current?.toggleAttribute('data-paused', !isActive)

    if (isActive) {
      const id = requestAnimationFrame(() => forceSyncRef.current?.())
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [isActive])

  useEffect(() => {
    if (!isMobile) return undefined
    const retryPlayback = () => {
      if (!isActive) return
      videoRef.current?.play().catch(() => {})
      portalVideoRef.current?.play().catch(() => {})
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') retryPlayback()
    }
    window.addEventListener('touchstart', retryPlayback, { once: true, passive: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('touchstart', retryPlayback)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isMobile, isActive])

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
  }, [hasEntered])

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

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useLayoutEffect(() => {
    const scene = sceneRef.current
    const viewport = viewportRef.current
    if (!scene || !viewport) return undefined

    let lastKey = ''
    let refreshTimer = 0
    let lastMobileViewportW = 0
    let lastMobileViewportH = 0

    const updateDesignScale = () => {
      const designWidth = scene.offsetWidth
      const designHeight = scene.offsetHeight
      const viewportWidth = viewport.clientWidth
      const viewportHeight = viewport.clientHeight
      if (!designWidth || !designHeight || !viewportWidth || !viewportHeight) {
        return
      }

      const mobileMode = window.matchMedia('(max-width: 768px)').matches

      if (mobileMode) {
        if (
          lastMobileViewportW &&
          viewportWidth === lastMobileViewportW &&
          Math.abs(viewportHeight - lastMobileViewportH) < 140
        ) {
          return
        }
        lastMobileViewportW = viewportWidth
        lastMobileViewportH = viewportHeight
      }

      const key = `${designWidth}|${designHeight}|${viewportWidth}|${viewportHeight}|${mobileMode}`
      if (key === lastKey) return
      lastKey = key

      const scale = mobileMode
        ? Math.max(viewportWidth / designWidth, viewportHeight / designHeight)
        : viewportHeight / designHeight

      designScaleRef.current = scale
      scene.style.setProperty('--design-scale', scale)
      scrollerRef.current?.style.setProperty('--design-scale', scale)

      const canvasW = mobileMode ? 24.375 : 88.3125
      const chrome = mobileMode ? CHROME_MOBILE : CHROME
      const remToPx = designWidth / canvasW
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
          const navEl = document.querySelector('.nb')
          const navH = navEl ? navEl.getBoundingClientRect().bottom : 68
          const PAD = 20

          set('--theme-left', PAD)
          set('--theme-top', navH + 16)
          set('--identity-left', viewportWidth - PAD)
          set('--identity-top', navH + 16)
          set('--coords-left', viewportWidth - PAD)
          set('--coords-top', navH + 120)
          set('--exhibits-left', viewportWidth - PAD)
          set('--exhibits-top', viewportHeight - 190)
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

  useGSAP(
    () => {
      const L = isMobile ? LAYOUT_MOBILE : LAYOUT

      const scrollTriggerBase = {
        scroller: scrollerRef.current,
        trigger: runwayRef.current,
        start: 'top top',
        end: 'bottom bottom',
      }

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

      const createParallaxLayer = (ref, config, motion, fadeAt, counterRef) => {
        if (!ref.current) return
        const fromVars = { scale: config.scaleFrom ?? 1, x: 0, y: 0 }
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
        const portalTargetScale = () => {
          return (
            (Math.max(
              viewportRef.current.clientWidth / portalRef.current.offsetWidth,
              viewportRef.current.clientHeight / portalRef.current.offsetHeight,
            ) *
              L.portal.zoomMultiplier) /
            (designScaleRef.current || 1)
          )
        }

        const sceneOrigin = () => {
          const sr = sceneRef.current.getBoundingClientRect()
          const vr = viewportRef.current.getBoundingClientRect()
          return { ox: sr.left - vr.left, oy: sr.top - vr.top }
        }

        const m = { left: 0, top: 0, w: 1, h: 1, ox: 0, oy: 0, vw: 1, vh: 1, sw: 1, sh: 1, target: 2 }
        const measure = () => {
          const portalEl = portalRef.current
          if (!portalEl) return
          m.left = portalEl.offsetLeft
          m.top = portalEl.offsetTop
          m.w = portalEl.offsetWidth
          m.h = portalEl.offsetHeight
          m.vw = viewportRef.current.clientWidth
          m.vh = viewportRef.current.clientHeight
          m.sw = sceneRef.current.offsetWidth
          m.sh = sceneRef.current.offsetHeight
          const o = sceneOrigin()
          m.ox = o.ox
          m.oy = o.oy
          m.target = portalTargetScale()
        }

        let lastClip = ''
        let lastVideoOpacity = -1
        let lastFrameImgOpacity = -1
        let lastWrapOpacity = -1
        let lastGirlHidden = false
        let lastGirlOpacity = -1
        const syncPortalFrame = () => {
          const portalEl = portalRef.current
          if (!portalEl) return
          const s = gsap.getProperty(portalEl, 'scaleX')
          const tx = gsap.getProperty(portalEl, 'x')
          const ty = gsap.getProperty(portalEl, 'y')
          const p = gsap.utils.clamp(0, 1, (s - 1) / (m.target - 1))

          const pv = portalVideoRef.current
          if (pv) {
            const o = 1 - gsap.utils.clamp(0, 1, p / PORTAL_IMG_FADE_END)
            if (o !== lastVideoOpacity) {
              lastVideoOpacity = o
              pv.style.opacity = o
            }
          }

          const frameImg = portalFrameImgRef.current
          if (frameImg) {
            const fadeEnd = PORTAL_FRAME.fadeEnd ?? PORTAL_IMG_FADE_END
            const fo =
              PORTAL_FRAME.opacity *
              (1 -
                gsap.utils.clamp(
                  0,
                  1,
                  (p - PORTAL_FRAME.fadeStart) /
                    Math.max(0.0001, fadeEnd - PORTAL_FRAME.fadeStart),
                ))
            if (fo !== lastFrameImgOpacity) {
              lastFrameImgOpacity = fo
              frameImg.style.opacity = fo
            }
          }

          if (girlRef.current && isMobile) {
            const go = 1 - gsap.utils.clamp(0, 1, (p - 0.55) / 0.25)
            if (go !== lastGirlOpacity) {
              lastGirlOpacity = go
              girlRef.current.style.opacity = go
            }
            const hideGirl = p >= 0.8
            if (hideGirl !== lastGirlHidden) {
              lastGirlHidden = hideGirl
              girlRef.current.style.visibility = hideGirl ? 'hidden' : 'visible'
            }
          } else if (girlRef.current) {
            const hideGirl = p >= 0.9
            if (hideGirl !== lastGirlHidden) {
              lastGirlHidden = hideGirl
              girlRef.current.style.visibility = hideGirl ? 'hidden' : 'visible'
            }
          }

          const wrap = backLayersRef.current
          if (!wrap) return

          if (!USE_CLIP_HOLE) {
            const wo = 1 - gsap.utils.clamp(0, 1, (p - 0.5) / 0.4)
            if (wo !== lastWrapOpacity) {
              lastWrapOpacity = wo
              wrap.style.opacity = wo
            }
            return
          }

          const cx = m.left + m.w / 2 + tx
          const cy = m.top + m.h / 2 + ty
          const hw = (m.w * s) / 2
          const hh = (m.h * s) / 2
          const x0 = cx - hw
          const x1 = cx + hw
          const y0 = cy - hh
          const y1 = cy + hh

          const d = designScaleRef.current || 1
          const open =
            m.ox + d * x0 <= 0 &&
            m.oy + d * y0 <= 0 &&
            m.ox + d * x1 >= m.vw &&
            m.oy + d * y1 >= m.vh
          if (open) {
            return
          }

          const P = 50
          const clampX = (v) => Math.min(m.sw + P, Math.max(-P, v))
          const clampY = (v) => Math.min(m.sh + P, Math.max(-P, v))
          const X0 = clampX(x0)
          const X1 = clampX(x1)
          const Y0 = clampY(y0)
          const Y1 = clampY(y1)
          const f = (n) => Math.round(n)
          const clip = `path(evenodd, "M${-P} ${-P}H${m.sw + P}V${m.sh + P}H${-P}Z M${f(X0)} ${f(Y0)}H${f(X1)}V${f(Y1)}H${f(X0)}Z")`
          if (clip !== lastClip) {
            lastClip = clip
            wrap.style.clipPath = clip
          }
        }
        measure()

        const portalTl = gsap
          .timeline({
            onUpdate: () => {
              syncPortalFrame()
              onProgressRef.current?.(portalTl.progress())
            },
            scrollTrigger: {
              ...scrollTriggerBase,
              scrub: MOTION.portal.scrub,
              invalidateOnRefresh: true,
              onRefresh: () => {
                measure()
                syncPortalFrame()
              },
            },
          })
          .fromTo(
            portalRef.current,
            { scale: 1, x: 0, y: 0 },
            {
              scale: portalTargetScale,
              x: () =>
                (viewportRef.current.clientWidth / 2 - sceneOrigin().ox) /
                  (designScaleRef.current || 1) -
                (portalRef.current.offsetLeft +
                  portalRef.current.offsetWidth / 2),
              y: () =>
                (viewportRef.current.clientHeight / 2 - sceneOrigin().oy) /
                  (designScaleRef.current || 1) -
                (portalRef.current.offsetTop +
                  portalRef.current.offsetHeight / 2),
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
        syncPortalFrame()

        forceSyncRef.current = () => {
          lastClip = ''
          lastVideoOpacity = -1
          lastFrameImgOpacity = -1
          lastWrapOpacity = -1
          syncPortalFrame()
        }
      }

      if (birdRef.current && birdFlipperRef.current && trailPathRef.current && birdLayerRef.current) {
        return animateBird({
          path: trailPathRef.current,
          bird: birdRef.current,
          flipper: birdFlipperRef.current,
          layer: birdLayerRef.current,
          viewport: viewportRef.current,
          frontStrokes: [frontStrokeRef.current],
          clipBack: clipBackRef.current,
          clipFront: clipFrontRef.current,
        })
      }
    },
    { scope: scrollerRef, dependencies: [isMobile], revertOnUpdate: true },
  )

  const activeLayout = isMobile ? LAYOUT_MOBILE : LAYOUT
  const activeChrome = isMobile ? CHROME_MOBILE : CHROME
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
      style={{ background: 'transparent' }}
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
            <div
              ref={backLayersRef}
              className={styles.backLayers}
            >
            <div
              aria-hidden='true'
              style={{ position: 'absolute', inset: '-40px', background: '#000' }}
            />
            <div
              ref={backgroundRef}
              className={styles.background}
              style={{ backgroundImage: `url(${assetBase}bg.png)` }}
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
  <img
    className={styles.island}
    alt=''
    aria-hidden='true'
    src={`${assetBase}islandv2.png`}
  />
  {/* zIndex 0 = behind the island image (z-index 1), so the line passes behind the castle */}
  <div className={styles.trailWrap} style={{ zIndex: 0 }}>
    <svg
      className={styles.trailSvg}
      viewBox='0 0 562 363'
      style={{ overflow: 'visible' }}
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      preserveAspectRatio='xMidYMid meet'
      aria-hidden='true'
    >
      <defs>
        {/* Back copy of the line shows only AFTER the curve (rect is sized in birdFlight.js) */}
        <clipPath id='trailBackClip'>
          <rect ref={clipBackRef} x='-2000' y='-2000' width='5000' height='2000' />
        </clipPath>
      </defs>
      <path
        data-flight-trail=''
        style={{ visibility: 'hidden' }}
        d={`${TRAIL_START}${BRIDGE}`}
        clipPath='url(#trailBackClip)'
        stroke='#7787FF'
        strokeWidth='1.11538'
        strokeLinecap='round'
      />
      <path
        data-flight-trail=''
        style={{ visibility: 'hidden' }}
        d={TRAIL_END}
        stroke='#7787FF'
        strokeWidth='1.11538'
        strokeLinecap='round'
      />
      <path ref={trailPathRef} d={FLIGHT_PATH} stroke='none' fill='none' />
    </svg>
  </div>
  {/* Front copy of the line: sits IN FRONT of the island (z 2) and shows only the
      part BEFORE the curve. After the curve the line is the back copy above. */}
  <div className={styles.trailWrap} style={{ zIndex: 2 }}>
    <svg
      className={styles.trailSvg}
      viewBox='0 0 562 363'
      style={{ overflow: 'visible' }}
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      preserveAspectRatio='xMidYMid meet'
      aria-hidden='true'
    >
      <defs>
        <clipPath id='trailFrontClip'>
          <rect ref={clipFrontRef} x='-2000' y='0' width='5000' height='5000' />
        </clipPath>
      </defs>
      <path
        ref={frontStrokeRef}
        style={{ visibility: 'hidden' }}
        d={`${TRAIL_START}${BRIDGE}`}
        clipPath='url(#trailFrontClip)'
        stroke='#7787FF'
        strokeWidth='1.11538'
        strokeLinecap='round'
      />
    </svg>
  </div>
  {/* birdLayer: z-index is driven by animateBird (birdFlight.js) */}
              <div ref={birdLayerRef} className={styles.birdLayer}>
                <div
                  ref={birdRef}
                  className={styles.bird}
                  style={{ visibility: 'hidden', width: SPARK_SIZE, height: SPARK_SIZE }}
                >
                  <div
                    ref={birdFlipperRef}
                    className={styles.birdFlipper}
                    style={{ width: '100%', height: '100%', transformOrigin: '50% 50%' }}
                  >
                    <svg
                      viewBox='0 0 100 100'
                      aria-hidden='true'
                      focusable='false'
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        overflow: 'visible',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    >
                      <defs>
                        {/* Streamlined directional spark body gradient */}
                        <radialGradient id='singleSparkGrad' cx='56%' cy='50%' r='48%'>
                          <stop offset='0%' stopColor='#93c5fd' stopOpacity='1' />
                          <stop offset='25%' stopColor='#3b82f6' stopOpacity='1' />
                          <stop offset='65%' stopColor='#1d4ed8' stopOpacity='1' />
                          <stop offset='100%' stopColor='#0f172a' stopOpacity='1' />
                        </radialGradient>
                      </defs>

                      {/* Single streamlined blue spark centered at (50, 50) */}
                      <path
                        d='M 38 50 C 44 43, 51 43, 62 48 C 66 50, 66 50, 62 52 C 51 57, 44 57, 38 50 Z'
                        fill='url(#singleSparkGrad)'
                      />
                      <circle cx='54' cy='50' r='2.2' fill='#ffffff' />
                    </svg>
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
                  disablePictureInPicture
                  disableRemotePlayback
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

            </div>

            <div
              ref={portalRef}
              className={styles.portal}
              style={{
                top: `${activeLayout.portal.top}rem`,
                left: `${activeLayout.portal.left}rem`,
                width: `${activeLayout.portal.width}rem`,
                height: `${activeLayout.portal.height}rem`,
                background: 'transparent',
              }}
              aria-hidden='true'
            >
              <video
                ref={portalVideoRef}
                src={`${assetBase}${PORTAL_VIDEO}`}
                poster={`${assetBase}${PORTAL_POSTER}`}
                autoPlay
                loop
                muted
                playsInline
                preload='auto'
                disablePictureInPicture
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
              <img
                ref={portalFrameImgRef}
                src={`${assetBase}${PORTAL_FRAME.src}`}
                alt=''
                aria-hidden='true'
                decoding='async'
                style={{
                  position: 'absolute',
                  left: `${-PORTAL_FRAME.outsetX}%`,
                  top: `${-PORTAL_FRAME.outsetY}%`,
                  width: `${100 + 2 * PORTAL_FRAME.outsetX}%`,
                  height: `${100 + 2 * PORTAL_FRAME.outsetY}%`,
                  maxWidth: 'none',
                  transformOrigin: '50% 50%',
                  transform: `translate(${PORTAL_FRAME.offsetX}%, ${PORTAL_FRAME.offsetY}%) scale(${PORTAL_FRAME.scale})`,
                  zIndex: PORTAL_FRAME.aboveVideo ? 2 : 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
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
                src={`${assetBase}girl4.webp`}
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
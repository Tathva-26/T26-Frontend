'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  FRAME_COUNT,
  FRAME_SCROLL_VH,
  SHRINK_START_FRAME,
  START_FRAME,
  TOTAL_SCROLL_VH,
  TV_ART_STYLE,
  HOLD_SCROLL_VH,
  HOLD_START_VH,
  frameAtScrollVh,
  getRobowarsTvScreenRect,
  holdWeightAtScrollVh,
} from './robowarsHandoff'
import { holdLoader } from '@/lib/loadGate'
// import styles from "./WheelsExperience.module.css";

const ASPECT_RATIO = 16 / 9

const FRAME_PROGRESS_END = FRAME_SCROLL_VH / TOTAL_SCROLL_VH

// The footage only moves while the page is scrolled, and there are several
// screens of it: when the scroll has been still for this long partway through,
// a "scroll to move the car" pop-up fades in. Any scroll hides it again.
const SCROLL_HINT_IDLE_MS = 700

// While the footage is held for the car's details, the car idles: it drifts
// forward LOOP_FRAMES frames and eases back, once every LOOP_SECONDS. A cosine
// ease-in-out has zero speed at both ends, so the turnaround never shows, and
// the offset is 0 at the loop's start/end, so it is seamless however long it runs.
const LOOP_FRAMES = 30
const LOOP_SECONDS = 8

const getFramePath = (index) => {
  const frameNum = (START_FRAME + index).toString().padStart(3, '0')
  return `https://cdn-next-main.tathva.org/wheels/frames/ezgif-frame-${frameNum}.webp`
}

// =========================================================================
// TV & ANIMATION ALIGNMENT CONFIGURATION
// You can adjust these values anytime to manually fine-tune the alignment:
// - fullscreenShiftX: horizontal shift in fullscreen (+ moves right, - moves left)
// - fullscreenShiftY: vertical shift in fullscreen (+ moves down, - moves up)
// - dockedShiftX: horizontal shift at final docked position (+ moves right, - moves left)
// - dockedShiftY: vertical shift at final docked position (+ moves down, - moves up)
// =========================================================================
export const ALIGN_CONFIG = {
  fullscreenShiftX: 0,
  fullscreenShiftY: 0,
  dockedShiftX: 0,
  dockedShiftY: 50,
}

// revealUnderlay: the next section (Robowars) is pinned underneath this one.
// Wheels' black backdrop fades out as the TV shrinks to reveal it, the TV docks
// onto Robowars' TV prop, then fades away once its screen has gone dark.
export default function WheelsExperience({ revealUnderlay = false }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const imagesRef = useRef([])
  const targetFrameRef = useRef(0)
  const currentFrameRef = useRef(0)
  const lastDrawnFrameRef = useRef(-1)
  const fadeOverlayRef = useRef(null)
  const backdropRef = useRef(null)
  const introVignetteRef = useRef(null)
  const targetFadeRef = useRef(0)
  const currentFadeRef = useRef(0)
  const holdWeightRef = useRef(0)

  const wheelsSceneRef = useRef(null)
  const wheelsLeftRef = useRef(null)
  const wheelsRightRef = useRef(null)
  const wheelsTickerRef = useRef(null)
  const scrollHintRef = useRef(null)

  const tvContainerRef = useRef(null)
  const tvFrameRef = useRef(null)
  const tvScreenRef = useRef(null)
  const wheelsTextRef = useRef(null)
  const layoutMetricsRef = useRef({
    startTvScale: 8,
    startTvY: 0,
    animTop: 0,
    animW: 0,
    animH: 0,
    dockScale: 1,
    dockX: 0,
    dockY: 0,
    robowarsOriginX: 50,
    robowarsOriginY: 50,
    robowarsZoomStart: 1,
  })

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    ScrollTrigger.config({ ignoreMobileResize: true })

    const scroller = document.querySelector('.main-scroll') || window
    const robowarsStage = revealUnderlay
      ? document.querySelector('[data-robowars-stage]')
      : null
    // The static Robowars TV prop (xl + tablet variants, only one ever
    // rendered/visible) that this section's own TV docks onto. Kept hidden
    // until the shrink animation has actually converged on that exact spot —
    // see the opacity ramp in updateTvShrinkAnimation — so it never shows
    // through as a second, not-yet-matching screen while still mid-shrink.
    const robowarsTvScreens = robowarsStage
      ? robowarsStage.querySelectorAll('[data-robowars-tv-screen]')
      : []

    const coverRef = { x: 0, y: 0, w: 0, h: 0, dpr: 1, isMobile: false }
    const timeoutIds = []
    let isActive = true

    const updateCanvasDimensions = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const parent = canvas.closest('.wheels-viewport')
      const viewportWidth = parent ? parent.clientWidth : window.innerWidth
      const viewportHeight = parent ? parent.clientHeight : window.innerHeight
      const isMobile = viewportWidth <= 768 || 'ontouchstart' in window
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2)

      const tvTargetWidth = Math.min(352, viewportWidth * 0.86)
      const animW = tvTargetWidth * (1262 / 1672)
      const animH = animW / ASPECT_RATIO
      const scaleCover = Math.max(viewportWidth / animW, viewportHeight / animH)

      const targetWidth = Math.max(1, Math.floor(animW * scaleCover * dpr))
      const targetHeight = Math.max(1, Math.floor(animH * scaleCover * dpr))

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth
        canvas.height = targetHeight
      }

      let destinationWidth = targetWidth
      let destinationHeight = targetWidth / ASPECT_RATIO
      if (destinationHeight < targetHeight) {
        destinationHeight = targetHeight
        destinationWidth = targetHeight * ASPECT_RATIO
      }

      coverRef.x = Math.round((targetWidth - destinationWidth) / 2)
      coverRef.y = Math.round((targetHeight - destinationHeight) / 2)
      coverRef.w = Math.round(destinationWidth)
      coverRef.h = Math.round(destinationHeight)
      coverRef.dpr = dpr
      coverRef.isMobile = isMobile

      const context = canvas.getContext('2d')
      if (context) {
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = isMobile ? 'low' : 'medium'
      }
    }

    const updateLayoutMetrics = () => {
      const parent = tvContainerRef.current?.parentElement
      const vpW = parent ? parent.clientWidth : window.innerWidth
      const vpH = parent ? parent.clientHeight : window.innerHeight
      const tvTargetWidth = Math.min(352, vpW * 0.86)
      const animW = tvTargetWidth * (1262 / 1672)
      const animH = animW / ASPECT_RATIO
      const tvTop = Math.max(16, Math.min(32, vpH * 0.03))

      // Native screen in tv.webp: X=205..1466 (W=1262), Y=282..816 (H=535), Total=1672x941
      const animTop = tvTop + (282 / 535) * animH
      const animCenterY = animTop + animH / 2

      const scaleCover = Math.max(vpW / animW, vpH / animH)
      const startY = vpH / 2 - animCenterY

      // Docked spot: exactly over Robowars' TV prop when it's underneath,
      // otherwise the top of the viewport (final visual top of -5px).
      const dock = revealUnderlay ? getRobowarsTvScreenRect(vpW, vpH) : null

      layoutMetricsRef.current = {
        startTvScale: scaleCover,
        startTvY: startY,
        animTop,
        animW,
        animH,
        dockScale: dock ? dock.width / animW : 1,
        dockX: dock
          ? dock.x + dock.width / 2 - vpW / 2
          : ALIGN_CONFIG.dockedShiftX,
        dockY: dock
          ? dock.y + dock.height / 2 - animCenterY
          : -5 - animTop + ALIGN_CONFIG.dockedShiftY,
        // Zoom out around the TV's docked screen position, so the background
        // reveal reads as the camera pulling back from that spot. The start
        // scale is a "cover" fit of that same rect over the whole viewport —
        // matching exactly what the wheels TV itself is showing there — so
        // the crop alone hides the rest of the arena with no separate
        // darkening overlay needed; zooming out from it just pulls the
        // camera back to reveal more of the arena for real.
        robowarsOriginX: dock ? ((dock.x + dock.width / 2) / vpW) * 100 : 50,
        robowarsOriginY: dock ? ((dock.y + dock.height / 2) / vpH) * 100 : 50,
        robowarsZoomStart: dock
          ? Math.max(vpW / dock.width, vpH / dock.height)
          : 1,
      }

      const tvContainer = tvContainerRef.current
      if (tvContainer) {
        tvContainer.style.top = `${animTop.toFixed(2)}px`
        tvContainer.style.width = `${animW.toFixed(2)}px`
        tvContainer.style.height = `${animH.toFixed(2)}px`
      }
    }

    updateCanvasDimensions()
    updateLayoutMetrics()

    let loadedCount = 0
    const images = []
    const renderFrame = (index) => {
      const canvas = canvasRef.current
      if (!canvas) return false
      const context = canvas.getContext('2d')
      if (!context) return false
      const image = imagesRef.current[index]
      if (!image || !image.complete || image.naturalWidth === 0) return false
      if (coverRef.w <= 0 || coverRef.h <= 0) updateCanvasDimensions()

      let panRatio = 1
      const SHRINK_START = SHRINK_START_FRAME
      const SHRINK_END = FRAME_COUNT - 1
      if (index > SHRINK_START) {
        const shrinkProgress =
          (index - SHRINK_START) / (SHRINK_END - SHRINK_START)
        const easeOut = 1 - shrinkProgress
        panRatio = easeOut * easeOut * (3 - 2 * easeOut)
      }

      const scrollShiftX =
        window.innerWidth <= 768
          ? Math.round(index * 2 * panRatio * coverRef.dpr)
          : 0

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        coverRef.x - scrollShiftX,
        coverRef.y,
        coverRef.w,
        coverRef.h,
      )
      return true
    }

    // The preloader stays up until the footage is in: scrubbing it while
    // frames are still arriving is what makes Wheels stutter.
    const releaseLoader = holdLoader('wheels frames')
    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const image = new Image()
      image.src = getFramePath(index)
      const handleImageLoad = (imageIndex) => {
        if (!isActive) return
        loadedCount += 1
        setLoadProgress(Math.floor((loadedCount / FRAME_COUNT) * 100))

        const currentTarget = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round(currentFrameRef.current)),
        )
        if (imageIndex === currentTarget || lastDrawnFrameRef.current === -1) {
          if (renderFrame(imageIndex)) lastDrawnFrameRef.current = imageIndex
        }
        if (loadedCount === FRAME_COUNT) {
          setIsLoaded(true)
          ScrollTrigger.refresh()
          releaseLoader()
        }
      }
      image.onload = () => handleImageLoad(index)
      image.onerror = () => handleImageLoad(index)
      images.push(image)
    }
    imagesRef.current = images

    const updateCinematicText = (progress) => {
      if (
        !wheelsSceneRef.current ||
        !wheelsLeftRef.current ||
        !wheelsRightRef.current ||
        !wheelsTickerRef.current
      ) {
        return
      }

      let opacity = 0
      let leftY = 0
      let rightY = 0
      let tickerY = 0
      if (progress < 0.35) {
        wheelsSceneRef.current.style.visibility = 'visible'
        // Fully visible through the whole hold (frame HOLD_FRAME ≈ 0.18).
        opacity =
          progress <= 0.2 ? 1 : Math.max(0, 1 - (progress - 0.2) / 0.15)
        const factor = progress / 0.32
        leftY = -factor * 40
        rightY = -factor * 30
        tickerY = factor * 25
      } else {
        wheelsSceneRef.current.style.visibility = 'hidden'
      }

      wheelsSceneRef.current.style.opacity = opacity.toFixed(3)
      wheelsLeftRef.current.style.transform = `translate3d(0, ${leftY.toFixed(1)}px, 0)`
      wheelsRightRef.current.style.transform = `translate3d(0, ${rightY.toFixed(1)}px, 0)`
      wheelsTickerRef.current.style.transform = `translate3d(0, ${tickerY.toFixed(1)}px, 0)`
    }

    const updateTvShrinkAnimation = (currentFrame) => {
      const tvContainer = tvContainerRef.current
      const tvFrame = tvFrameRef.current
      const tvScreen = tvScreenRef.current
      const wheelsText = wheelsTextRef.current
      if (!tvContainer || !tvFrame || !tvScreen) return

      const SHRINK_START = SHRINK_START_FRAME // Starts earlier to slow down the animation speed
      const SHRINK_END = FRAME_COUNT - 1 // 135 (frame 240)

      const {
        startTvScale,
        startTvY,
        animTop,
        animW,
        animH,
        dockScale,
        dockX,
        dockY,
        robowarsOriginX,
        robowarsOriginY,
        robowarsZoomStart,
      } = layoutMetricsRef.current

      // Keep dimensions and top anchor strictly applied even through React re-renders
      tvContainer.style.top = `${animTop.toFixed(2)}px`
      tvContainer.style.width = `${animW.toFixed(2)}px`
      tvContainer.style.height = `${animH.toFixed(2)}px`

      if (robowarsStage) {
        robowarsStage.style.transformOrigin = `${robowarsOriginX.toFixed(2)}% ${robowarsOriginY.toFixed(2)}%`
      }

      if (currentFrame <= SHRINK_START) {
        if (robowarsStage) robowarsStage.style.transform = 'scale(1)'
        const initX = ALIGN_CONFIG.fullscreenShiftX
        const initY = startTvY + ALIGN_CONFIG.fullscreenShiftY
        tvContainer.style.transform = `translate3d(${initX.toFixed(2)}px, ${initY.toFixed(2)}px, 0) scale(${startTvScale.toFixed(4)})`
        tvFrame.style.opacity = '0'
        tvScreen.style.borderRadius = '0px'
        if (backdropRef.current) backdropRef.current.style.opacity = '1'
        if (wheelsText) {
          wheelsText.style.opacity = '0'
          wheelsText.style.transform = 'scale(0.85)'
        }
        robowarsTvScreens.forEach((el) => {
          el.style.opacity = '0'
        })
        return
      }

      const shrinkRatio = Math.min(
        1,
        Math.max(
          0,
          (currentFrame - SHRINK_START) / (SHRINK_END - SHRINK_START),
        ),
      )
      // Smoothstep easing for silky-smooth start and end
      const curEase = shrinkRatio * shrinkRatio * (3 - 2 * shrinkRatio)

      // Single unified container transform: both TV and screen scale and move as one
      const curTvScale = startTvScale + (dockScale - startTvScale) * curEase
      const curTvX =
        ALIGN_CONFIG.fullscreenShiftX * (1 - curEase) + dockX * curEase
      const initY = startTvY + ALIGN_CONFIG.fullscreenShiftY
      const curTvY = initY * (1 - curEase) + dockY * curEase

      tvContainer.style.transform = `translate3d(${curTvX.toFixed(2)}px, ${curTvY.toFixed(2)}px, 0) scale(${curTvScale.toFixed(4)})`

      // TV frame fades in over the first 20% of the shrink
      const tvOpacity = Math.min(1, shrinkRatio / 0.2)
      tvFrame.style.opacity = tvOpacity.toFixed(3)

      // TV screen corners smoothly round to 6px
      tvScreen.style.borderRadius = `${(curEase * 6).toFixed(1)}px`

      // Smoothly fade out Wheels' black backdrop to reveal Robowars underneath
      // without extreme GPU texture scaling on the stage
      if (revealUnderlay && backdropRef.current) {
        backdropRef.current.style.opacity = Math.max(0, 1 - curEase).toFixed(3)
      }

      if (robowarsStage) {
        const robowarsScale = 1 + 0.03 * (1 - curEase)
        robowarsStage.style.transform = `scale(${robowarsScale.toFixed(4)})`
      }

      // Stay invisible until the shrink has all but converged on the dock
      // spot (both screens the same size/position), then snap in quickly —
      // rather than track curEase 1:1 the whole way, which risked a visible
      // second screen any frame the two weren't pixel-matched yet.
      const robowarsTvOpacity =
        Math.min(1, Math.max(0, (curEase - 0.96) / 0.1)) * 6
      robowarsTvScreens.forEach((el) => {
        el.style.opacity = robowarsTvOpacity.toFixed(3)
      })

      // Wheels text fades in near the very end
      if (wheelsText) {
        const textOpacity = Math.max(0, (shrinkRatio - 0.82) / 0.18)
        wheelsText.style.opacity = textOpacity.toFixed(3)
        wheelsText.style.transform = `scale(${(0.85 + 0.15 * textOpacity).toFixed(3)})`
      }
    }

    const updateIntroVignette = (currentFrame) => {
      const vignette = introVignetteRef.current
      const canvas = canvasRef.current
      const INTRO_FRAME_COUNT = 16

      if (currentFrame >= INTRO_FRAME_COUNT) {
        if (vignette && vignette.style.opacity !== '0') {
          vignette.style.opacity = '0'
          vignette.style.visibility = 'hidden'
        }
        if (canvas && canvas.style.filter) {
          canvas.style.filter = ''
        }
        return
      }

      const progress = Math.min(
        1,
        Math.max(0, currentFrame / INTRO_FRAME_COUNT),
      )
      const ease = progress * progress * (3 - 2 * progress)
      const factor = 1 - ease

      if (vignette) {
        vignette.style.visibility = 'visible'
        vignette.style.opacity = factor.toFixed(3)
      }

      if (canvas) {
        const brightness = 0.68 + 0.32 * (1 - factor)
        canvas.style.filter = `brightness(${brightness.toFixed(3)})`
      }
    }

    // Pause the render loop entirely while this section is nowhere near the
    // viewport, so it doesn't keep drawing to canvas + writing styles forever
    // while the user is scrolled somewhere else on the page.
    let isIntersecting = true
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting
      },
      { rootMargin: '50% 0px 50% 0px' },
    )
    if (containerRef.current) intersectionObserver.observe(containerRef.current)

    let animationFrameId
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    const lerpRate = isTouchDevice ? 0.2 : 0.08
    const renderLoop = () => {
      if (!isIntersecting || document.hidden) {
        animationFrameId = requestAnimationFrame(renderLoop)
        return
      }

      // Once the handoff to Robowars is fully done (screen faded to black,
      // TV gone), this section still geometrically overlaps the viewport for
      // a while longer (its "invisible carry-away" tail, by design — see the
      // ScrollTrigger comment below) even though nothing here changes
      // anymore. That used to mean this loop kept redrawing the canvas and
      // writing styles every single frame regardless, right as Robowars'
      // robot animation is happening on top of it and competing for the same
      // main thread. Once fully converged with nothing left to animate,
      // stand down to a cheap no-op check instead of doing the full render.
      const handoffSettled =
        revealUnderlay &&
        targetFadeRef.current >= 1 &&
        currentFadeRef.current >= 0.999 &&
        targetFrameRef.current >= FRAME_COUNT - 1 &&
        currentFrameRef.current >= FRAME_COUNT - 1.001
      if (handoffSettled) {
        animationFrameId = requestAnimationFrame(renderLoop)
        return
      }

      const difference = targetFrameRef.current - currentFrameRef.current
      currentFrameRef.current =
        Math.abs(difference) > 0.001
          ? currentFrameRef.current + difference * lerpRate
          : targetFrameRef.current

      const loopPhase = (performance.now() / 1000 / LOOP_SECONDS) % 1
      const loopOffset = LOOP_FRAMES * (0.5 - 0.5 * Math.cos(loopPhase * 2 * Math.PI))
      const frameToDraw = Math.min(
        FRAME_COUNT - 1,
        Math.max(
          0,
          Math.round(currentFrameRef.current + holdWeightRef.current * loopOffset),
        ),
      )
      if (
        frameToDraw !== lastDrawnFrameRef.current ||
        lastDrawnFrameRef.current === -1
      ) {
        if (renderFrame(frameToDraw)) {
          lastDrawnFrameRef.current = frameToDraw
        } else {
          for (let offset = 1; offset < FRAME_COUNT; offset += 1) {
            const previous = frameToDraw - offset
            if (previous >= 0 && renderFrame(previous)) break
            const next = frameToDraw + offset
            if (next < FRAME_COUNT && renderFrame(next)) break
          }
        }
      }

      updateCinematicText(currentFrameRef.current / (FRAME_COUNT - 1))
      updateTvShrinkAnimation(currentFrameRef.current)
      updateIntroVignette(currentFrameRef.current)

      const fadeDifference = targetFadeRef.current - currentFadeRef.current
      currentFadeRef.current =
        Math.abs(fadeDifference) > 0.001
          ? currentFadeRef.current + fadeDifference * lerpRate
          : targetFadeRef.current
      if (fadeOverlayRef.current) {
        fadeOverlayRef.current.style.opacity = currentFadeRef.current.toFixed(3)
      }
      // Once the screen is nearly black, fade the whole TV out onto the
      // identical Robowars prop underneath so nothing slides away on unpin.
      // Driven by the raw (unlerped) scroll progress rather than the smoothed
      // currentFadeRef: the lerp can still be catching up right as the pin
      // releases, leaving a faint leftover TV that visibly scrolls/"lifts"
      // away with the page once Wheels unpins. Tying it directly to scroll
      // guarantees it's fully gone by the moment that happens.
      if (revealUnderlay && tvContainerRef.current) {
        const tvFadeOut = Math.min(
          1,
          Math.max(0, (targetFadeRef.current - 0.6) / 0.4),
        )
        tvContainerRef.current.style.opacity = (1 - tvFadeOut).toFixed(3)
      }

      animationFrameId = requestAnimationFrame(renderLoop)
    }
    animationFrameId = requestAnimationFrame(renderLoop)
    updateCinematicText(0)
    updateTvShrinkAnimation(0)
    updateIntroVignette(0)

    let lastViewportWidth = window.innerWidth
    let lastViewportHeight = window.innerHeight
    const handleResize = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const isMobile = viewportWidth <= 768 || 'ontouchstart' in window
      if (
        isMobile &&
        viewportWidth === lastViewportWidth &&
        Math.abs(viewportHeight - lastViewportHeight) < 75
      )
        return
      lastViewportWidth = viewportWidth
      lastViewportHeight = viewportHeight
      updateCanvasDimensions()
      updateLayoutMetrics()
      updateTvShrinkAnimation(currentFrameRef.current)
      updateIntroVignette(currentFrameRef.current)
      renderFrame(
        lastDrawnFrameRef.current >= 0 ? lastDrawnFrameRef.current : 0,
      )
    }
    window.addEventListener('resize', handleResize)

    // "Scroll to move the car" pop-up: see SCROLL_HINT_IDLE_MS.
    let scrollHintTimer = 0
    const setScrollHint = (shown) => {
      if (scrollHintRef.current)
        scrollHintRef.current.dataset.show = shown ? 'true' : 'false'
    }
    const queueScrollHint = (self) => {
      setScrollHint(false)
      window.clearTimeout(scrollHintTimer)
      scrollHintTimer = window.setTimeout(() => {
        const container = containerRef.current
        if (!container) return
        const viewportHeight =
          scroller === window ? window.innerHeight : scroller.clientHeight
        const scrollerTop =
          scroller === window ? 0 : scroller.getBoundingClientRect().top
        // Wheels has the screen to itself once it is a fifth of a screen
        // into its pin: until then GPC is still fading out on top of it
        // (--gpc-handoff in gpc.css).
        const top = container.getBoundingClientRect().top - scrollerTop
        const onScreen = top <= -viewportHeight * 0.2
        // Nothing left to scroll for once the footage is nearly through.
        const footageLeft = self.progress < FRAME_PROGRESS_END * 0.97
        setScrollHint(onScreen && footageLeft)
      }, SCROLL_HINT_IDLE_MS)
    }

    // Touch screens scroll natively, on momentum. A scripted glide started in
    // the middle of that fights it for the page and shows as a jump, so the
    // landing below is for wheel / trackpad only.
    const touchScreen = window.matchMedia('(pointer: coarse)').matches
    let handoffSnapStarted = false

    // Wheel / trackpad only. Scrolling down into Wheels glides on to the
    // details hold (APPROACH), and the next scroll down from the hold glides
    // the rest of the way to Robowars (EXIT) instead of scrubbing through.
    const HOLD_MID_VH = HOLD_START_VH + HOLD_SCROLL_VH / 2
    const HOLD_END_VH = HOLD_START_VH + HOLD_SCROLL_VH
    const APPROACH_FROM_VH = 2 // as soon as Wheels starts coming in
    const SETTLE_MS = 200 // wheel quiet this long = the gesture that got here is over
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    let gliding = false
    let approachDone = false
    let exitArmed = false
    let armTimer = 0
    const armExitSoon = () => {
      window.clearTimeout(armTimer)
      exitArmed = false
      armTimer = window.setTimeout(() => {
        exitArmed = true
      }, SETTLE_MS)
    }
    // Lenis never calls onComplete for a glide that gets cut short (another
    // section stopping it, say). `gliding` would then stay set forever and every
    // later snap would be dead, so a timer clears it regardless.
    let glideTimer = 0
    const endGlide = () => {
      window.clearTimeout(glideTimer)
      if (!gliding) return
      gliding = false
      armExitSoon()
    }
    const glide = (lenis, target, duration, easing) => {
      gliding = true
      exitArmed = false
      window.clearTimeout(armTimer)
      window.clearTimeout(glideTimer)
      glideTimer = window.setTimeout(endGlide, duration * 1000 + 400)
      lenis.scrollTo(target, {
        duration,
        lock: true,
        force: true,
        easing,
        onComplete: endGlide,
      })
    }
    // The later of Wheels' fade completion and Robowars' timeline end: the
    // exact fully revealed Robowars frame, rather than merely the point where
    // its underlay first appears.
    const handoffTarget = (lenis, self) => {
      const robowarsTimeline = document.querySelector('[data-robowars-timeline]')
      const scrollerRect = scroller === window ? null : scroller.getBoundingClientRect()
      const scrollerBottom = scrollerRect ? scrollerRect.bottom : window.innerHeight
      const robowarsEnd = robowarsTimeline
        ? lenis.scroll + robowarsTimeline.getBoundingClientRect().bottom - scrollerBottom
        : self.end
      return Math.min(lenis.limit, Math.max(self.end, robowarsEnd))
    }

    const trigger = ScrollTrigger.create({
      scroller,
      trigger: containerRef.current,
      // Begin scrubbing as Wheels enters from the bottom of the viewport so
      // the opening frames are already moving when the section reaches full screen.
      start: 'top bottom',
      // CSS `position: sticky` naturally releases its pin during the final
      // viewport-height of its containing block (that's just how sticky
      // works). End the trigger's progress exactly at that pin boundary so
      // the frame-scrub + fade-to-black finish while the screen is still
      // fully pinned, and the last viewport-height of scroll is spent
      // carrying an already-black frame away (invisible) into Robowars.
      // The earlier start adds one viewport of active scroll. Extending the
      // range by that same amount keeps the existing handoff point unchanged.
      end: () => `+=${containerRef.current?.offsetHeight || 0}`,
      scrub: 0,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        queueScrollHint(self)

        const lenis = window.__lenis
        const scrollVh = self.progress * TOTAL_SCROLL_VH
        const vhToScroll = (vh) => self.start + ((self.end - self.start) * vh) / TOTAL_SCROLL_VH
        const inHold = scrollVh >= HOLD_START_VH && scrollVh <= HOLD_END_VH

        // Any scroll back up re-arms the approach for the next way down.
        if (scrollVh < APPROACH_FROM_VH || (self.direction < 0 && !gliding))
          approachDone = false

        if (revealUnderlay && lenis && !touchScreen && !gliding) {
          if (
            !approachDone &&
            self.direction > 0 &&
            scrollVh >= APPROACH_FROM_VH &&
            scrollVh < HOLD_MID_VH - 6
          ) {
            approachDone = true
            glide(lenis, vhToScroll(HOLD_MID_VH), 2.8, easeInOutCubic)
          } else if (exitArmed && inHold && self.direction > 0) {
            approachDone = true
            handoffSnapStarted = true
            glide(lenis, handoffTarget(lenis, self), 4.2, easeInOutCubic)
          } else if (inHold) {
            approachDone = true
            armExitSoon()
          } else {
            exitArmed = false
            window.clearTimeout(armTimer)
          }
        }

        if (self.direction < 0 && self.progress < FRAME_PROGRESS_END) {
          handoffSnapStarted = false
        } else if (
          revealUnderlay &&
          lenis &&
          !touchScreen &&
          !handoffSnapStarted &&
          !gliding &&
          self.direction > 0 &&
          self.progress >= FRAME_PROGRESS_END
        ) {
          // When the frame sequence reaches its final frame, land on the
          // fully revealed Robowars frame.
          handoffSnapStarted = true
          lenis.scrollTo(handoffTarget(lenis, self), {
            duration: 0.9,
            lock: true,
            force: true,
            easing: (progress) => 1 - Math.pow(1 - progress, 3),
          })
        }

        if (self.progress <= FRAME_PROGRESS_END) {
          const scrollVh = self.progress * TOTAL_SCROLL_VH
          targetFrameRef.current = frameAtScrollVh(scrollVh)
          holdWeightRef.current = holdWeightAtScrollVh(scrollVh)
          targetFadeRef.current = 0
        } else {
          targetFrameRef.current = FRAME_COUNT - 1
          holdWeightRef.current = 0
          targetFadeRef.current =
            (self.progress - FRAME_PROGRESS_END) / (1 - FRAME_PROGRESS_END)
        }
      },
    })

    // One scroll tick down from the hold is enough to leave it: read off the
    // wheel itself, not off the page having moved.
    const onHoldWheel = (event) => {
      const lenis = window.__lenis
      if (!lenis || touchScreen || !revealUnderlay || event.ctrlKey) return
      const vh =
        ((lenis.scroll - trigger.start) / (trigger.end - trigger.start)) *
        TOTAL_SCROLL_VH
      const inHold = vh >= HOLD_START_VH && vh <= HOLD_END_VH
      if (gliding) {
        if (event.cancelable) event.preventDefault()
        return
      }
      if (!inHold) return
      if (exitArmed && event.deltaY > 4) {
        if (event.cancelable) event.preventDefault()
        approachDone = true
        handoffSnapStarted = true
        glide(lenis, handoffTarget(lenis, trigger), 4.2, easeInOutCubic)
        return
      }
      armExitSoon()
    }
    if (revealUnderlay && !touchScreen)
      scroller.addEventListener('wheel', onHoldWheel, { passive: false })

    return () => {
      scroller.removeEventListener('wheel', onHoldWheel)
      isActive = false
      releaseLoader()
      cancelAnimationFrame(animationFrameId)
      window.clearTimeout(scrollHintTimer)
      window.clearTimeout(armTimer)
      window.clearTimeout(glideTimer)
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
      images.forEach((image) => {
        image.onload = null
        image.onerror = null
      })
      window.removeEventListener('resize', handleResize)
      intersectionObserver.disconnect()
      trigger.kill()
    }
  }, [revealUnderlay])

  return (
    <div
      ref={containerRef}
      className={`relative z-10 w-full shrink-0 ${revealUnderlay ? '' : 'bg-black'}`}
      style={{ height: `${TOTAL_SCROLL_VH}vh` }}
    >
      <style>{`
        @keyframes ticker-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes wheels-hint-wheel {
          0% { transform: translateY(0); opacity: 0; }
          25% { opacity: 1; }
          70% { transform: translateY(7px); opacity: 0; }
          100% { transform: translateY(7px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wheels-hint-wheel { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
      <div className='wheels-viewport sticky top-0 w-full h-dvh overflow-hidden'>
        <div
          ref={backdropRef}
          className='pointer-events-none absolute inset-0 bg-black'
        />
        {/* Source of truth: Animation Viewport Unit */}
        <div
          ref={tvContainerRef}
          style={{ transformOrigin: 'center center' }}
          className='absolute left-0 right-0 mx-auto pointer-events-none will-change-transform z-10'
        >
          {/* TV Outer Frame: scaled and positioned around the animation viewport */}
          <img
            ref={tvFrameRef}
            src='https://cdn-next-main.tathva.org/wheels/tv.webp'
            alt='TV'
            className='absolute pointer-events-none select-none z-10 opacity-0'
            style={TV_ART_STYLE}
          />

          {/* Animation Viewport / TV Inner Screen */}
          <div
            ref={tvScreenRef}
            className='absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-20 flex items-center justify-center rounded-[6px]'
          >
            <canvas
              ref={canvasRef}
              className='block w-full h-full object-cover'
            />
            <span
              ref={wheelsTextRef}
              className="absolute z-20 text-white font-['Space_Grotesk',sans-serif] text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-none tracking-[-0.02em] text-center [text-shadow:0_0_16px_rgba(255,255,255,0.45)] uppercase select-none opacity-0 scale-[0.85]"
            >
              Wheels
            </span>
            {/* Fades just the screen's content to black as you scroll past it — the
                TV frame itself stays put, its screen simply goes dark. */}
            <div
              ref={fadeOverlayRef}
              className='pointer-events-none absolute inset-0 z-30 bg-black opacity-0'
            />
          </div>
        </div>

        {/* Intro dark vignette & brightness overlay for first 15 frames */}
        <div
          ref={introVignetteRef}
          className='pointer-events-none absolute inset-0 z-20 will-change-[opacity]'
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.96) 100%)',
          }}
        />

        <div className='absolute inset-0 z-30 overflow-hidden pointer-events-none'>
          <div
            ref={wheelsSceneRef}
            className='absolute inset-0 flex flex-col justify-between p-[clamp(28px,4.5vw,64px)] max-md:px-[clamp(16px,4vw,20px)] max-md:py-[clamp(16px,4vw,24px)] pointer-events-none will-change-[transform,opacity]'
          >
            <div className='flex w-full items-start justify-between gap-8 max-md:relative max-md:gap-3'>
              <div
                ref={wheelsLeftRef}
                className='flex max-w-[65%] flex-col will-change-transform max-md:max-w-[58%]'
              >
                <img
                  src='https://cdn-next-main.tathva.org/wheels/Wheels.svg'
                  alt='Wheels'
                  className='block w-[clamp(180px,24vw,334px)] h-auto object-contain opacity-95 max-md:w-[clamp(130px,38vw,190px)]'
                />
                <img
                  src='https://cdn-next-main.tathva.org/wheels/Auto%20Show.svg'
                  alt='Auto Show'
                  className='block w-[clamp(100px,13vw,183px)] h-auto mt-2 object-contain opacity-95 max-md:w-[clamp(72px,21vw,105px)] max-md:mt-1'
                />
              </div>
              <div
                ref={wheelsRightRef}
                className="absolute top-[160px] right-[82px] block w-[152px] h-[455px] text-white font-['VCR_OSD_Mono',monospace] text-[17.141px] font-normal leading-normal text-right whitespace-pre-wrap opacity-90 will-change-transform max-md:top-[clamp(8px,1.5vh,20px)] max-md:right-0 max-md:w-[clamp(130px,38vw,175px)] max-md:h-auto max-md:text-[clamp(11.5px,2.9vw,13.5px)] max-md:leading-[1.38]"
              >
                <p className='m-0 mb-[1em] last:mb-0 max-md:mb-[0.55em] max-md:last:mb-0'>
                  <span className='text-[#a682d3] max-md:text-[clamp(12px,3.1vw,14px)] max-md:tracking-[0.01em]'>
                    Featured
                  </span>
                  <span className='text-[#634b7d]'>:</span>
                  <br />
                  BMW E-Series
                </p>
                <p className='m-0 mb-[1em] last:mb-0 max-md:mb-[0.55em] max-md:last:mb-0'>
                  <span className='text-[#a682d3] max-md:text-[clamp(12px,3.1vw,14px)] max-md:tracking-[0.01em]'>
                    Character:
                  </span>{' '}
                  Classic BMW design
                </p>
                <p className='m-0 mb-[1em] last:mb-0 max-md:mb-[0.55em] max-md:last:mb-0'>
                  <span className='text-[#a682d3] max-md:text-[clamp(12px,3.1vw,14px)] max-md:tracking-[0.01em]'>
                    Focus:
                  </span>{' '}
                  Driver-first engineering
                </p>
                <p className='m-0 mb-[1em] last:mb-0 max-md:mb-[0.55em] max-md:last:mb-0'>
                  <span className='text-[#a682d3] max-md:text-[clamp(12px,3.1vw,14px)] max-md:tracking-[0.01em]'>
                    Objective:
                  </span>
                  <br />
                  Bring precision, performance, and presence to the show.
                </p>
                <p className='m-0 mb-[1em] last:mb-0 max-md:mb-[0.55em] max-md:last:mb-0'>
                  <span className='text-[#a682d3] max-md:text-[clamp(12px,3.1vw,14px)] max-md:tracking-[0.01em]'>
                    Experience:
                  </span>{' '}
                  A timeless drive with unmistakable BMW spirit
                </p>
              </div>
            </div>
            <div
              ref={wheelsTickerRef}
              className='absolute bottom-[22px] left-[193px] flex w-[1028px] max-w-[calc(100vw-220px)] h-[47px] items-center overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_30px,#000_calc(100%-30px),transparent)] [mask-image:linear-gradient(to_right,transparent,#000_30px,#000_calc(100%-30px),transparent)] will-change-transform max-md:right-0 max-md:bottom-[max(16px,env(safe-area-inset-bottom,16px))] max-md:left-0 max-md:w-[calc(100vw-clamp(24px,6vw,40px))] max-md:h-8 max-md:mx-auto max-md:[-webkit-mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)] max-md:[mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)] max-md:[transform:translateZ(0)]'
            >
              <div className='flex w-max items-center whitespace-nowrap animate-[ticker-marquee_16s_linear_infinite] max-md:[animation-duration:12s] will-change-transform'>
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className="inline-flex items-center text-white font-['VCR_OSD_Mono',monospace] text-[30px] font-normal leading-[36.5px] tracking-[0.04em] whitespace-nowrap opacity-95 max-md:text-[clamp(13px,3.6vw,17px)] max-md:leading-normal"
                  >
                    <span className='inline-block mx-2 text-[#a682d3] [text-shadow:0_0_10px_rgba(166,130,211,0.55)] max-md:mx-1 max-md:[text-shadow:0_0_6px_rgba(166,130,211,0.55)]'>
                      •
                    </span>{' '}
                    09 OCT 2026 11:00 AM{' '}
                    <span className='inline-block mx-2 text-[#a682d3] [text-shadow:0_0_10px_rgba(166,130,211,0.55)] max-md:mx-1 max-md:[text-shadow:0_0_6px_rgba(166,130,211,0.55)]'>
                      •
                    </span>{' '}
                    RALLIES{' '}
                    <span className='inline-block mx-2 text-[#a682d3] [text-shadow:0_0_10px_rgba(166,130,211,0.55)] max-md:mx-1 max-md:[text-shadow:0_0_6px_rgba(166,130,211,0.55)]'>
                      •
                    </span>{' '}
                    CAR REVEALS{' '}
                    <span className='inline-block mx-2 text-[#a682d3] [text-shadow:0_0_10px_rgba(166,130,211,0.55)] max-md:mx-1 max-md:[text-shadow:0_0_6px_rgba(166,130,211,0.55)]'>
                      •
                    </span>{' '}
                    STUNTS&nbsp;&nbsp;
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* "Scroll to move the car" pop-up, shown by queueScrollHint while the scroll is idle */}
        <div
          ref={scrollHintRef}
          data-show='false'
          aria-hidden='true'
          className="pointer-events-none absolute bottom-[92px] left-1/2 z-40 flex -translate-x-1/2 translate-y-3 scale-95 items-center gap-4 whitespace-nowrap rounded-2xl border border-[#a682d3]/60 bg-black/75 py-3.5 pr-7 pl-5 text-white font-['VCR_OSD_Mono',monospace] opacity-0 shadow-[0_0_28px_rgba(166,130,211,0.35)] backdrop-blur-md transition-[opacity,transform] duration-500 ease-out data-[show=true]:translate-y-0 data-[show=true]:scale-100 data-[show=true]:opacity-100 max-md:bottom-[calc(max(16px,env(safe-area-inset-bottom,16px))+52px)] max-md:gap-3 max-md:py-2.5 max-md:pr-5 max-md:pl-4"
        >
          <span className='relative block h-[30px] w-[19px] shrink-0 rounded-full border-2 border-[#a682d3] max-md:h-[24px] max-md:w-[15px]'>
            <span className='wheels-hint-wheel absolute top-[5px] left-1/2 -ml-px block h-[6px] w-[2px] rounded-full bg-white animate-[wheels-hint-wheel_1.4s_ease-out_infinite]' />
          </span>
          <span className='flex flex-col gap-1.5 leading-none uppercase'>
            <span className='text-[17px] tracking-[0.16em] max-md:text-[13px]'>
              Scroll to move the car
            </span>
            <span className='text-[11px] tracking-[0.22em] text-[#a682d3] max-md:text-[9.5px]'>
              Keep scrolling to drive on
            </span>
          </span>
        </div>

        {!isLoaded && (
          <div className='absolute bottom-[30px] left-1/2 z-30 w-[200px] h-1 overflow-hidden rounded-[2px] bg-white/10 -translate-x-1/2'>
            <div
              className='h-full bg-white transition-[width] duration-100 ease-linear'
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

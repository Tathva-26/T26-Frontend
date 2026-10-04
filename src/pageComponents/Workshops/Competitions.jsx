'use client'

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/refs */

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'
import { useRouter } from 'next/navigation'
import Navbar from '@/pageComponents/Navbar/Navbar'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import { useEvents } from '@/hooks/useEvents'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin)
}

const competitionsStyles = `
@import url('https://fonts.googleapis.com/css2?family=Jaro:opsz@6..72&family=Jost:wght@400;600&display=swap');

@font-face {
  font-family: 'Competitions Fragment Serif';
  src: url('https://cdn-next-main.tathva.org/fonts/PPFragment-SerifExtraBold.otf') format('opentype');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

.competitions-page .competitions-fragment-serif {
  font-family: 'Competitions Fragment Serif', serif;
}

.competitions-page .competitions-jaro {
  font-family: 'Jaro', sans-serif;
}
`

// Competitions come from GET /api/events/all?type=competitions. The type is
// matched exactly and lowercased on write, so it must not be capitalised.
const EVENT_TYPE = 'competitions'
const CARD_LABEL = 'Competition'

// `picture` is non-null on every event in production today, but the field is
// nullable and next/image requires a src.
const FALLBACK_IMAGE = 'https://cdn-next-main.tathva.org/images/workshops/workshop-astronaut.jpg'

// Tunable hover-response constants — focal card (Step 3 movement unchanged)
const MAX_TRANSLATE = 15
const MAX_TILT = 3
const HOVER_SCALE = 1.07
const LIFT_Z = 18
const REST_SHADOW = '0 4px 16px -3px rgba(0,0,0,0.45)'
const HOVER_SHADOW = '0 20px 34px -9px rgba(0,0,0,0.58)'
const ENTER_DURATION = 0.95
const MOVE_DURATION = 1.92
const LEAVE_DURATION = 0.6
const EASE = 'power2.out'

// Focal-card material/depth response (Step 5)
const REST_EDGE_BG = 'rgba(18, 18, 24, 0.95)'
const FOCUS_EDGE_BG = 'rgba(9, 9, 13, 0.98)'
const REST_EDGE_HIGHLIGHT_TOP = 'rgba(255,255,255,0.08)'
const FOCUS_EDGE_HIGHLIGHT_TOP = 'rgba(255,255,255,0.18)'
const REST_EDGE_HIGHLIGHT_LEFT = 'rgba(255,255,255,0.05)'
const FOCUS_EDGE_HIGHLIGHT_LEFT = 'rgba(255,255,255,0.11)'

// Surrounding-card "make room" response — Step 4
const GRID_GAP_PX = 32
const MAX_SURROUND_DISPLACEMENT = 100
const FALLOFF_STRENGTH = 0.4
const NEAR_LAG = 0.001
const FAR_LAG = 0.015
const RAMP_IN_MS = 20
const FIELD_RETURN_DURATION = 1.75

// Step 6 — annotation/callout (replaces the old rectangular info panel)
// Geometry
const CALLOUT_LABEL_WIDTH = 280 // text-wrap width, not a visual box
const CALLOUT_LABEL_HEIGHT_ESTIMATE = 220
const CALLOUT_GAP = 34 // distance from card edge to label's near edge
const CALLOUT_STUB = 16 // short initial leader segment away from the card
const CALLOUT_VIEWPORT_MARGIN = 20
const CALLOUT_LABEL_ANCHOR_OFFSET_Y = 12 // aligns the line's end with the title line
const CALLOUT_LABEL_LAG = 0.06 // smoothing factor while following a moving card
// Motion
const CALLOUT_CONTAINER_FADE_IN = 0.18
const CALLOUT_EXIT_DURATION = 0.4
const LINE_DRAW_DURATION = 0.45 // within the 350–550ms target
const LINE_DRAW_EASE = 'power2.out' // engineered/precise, no overshoot
// Decode sequencing (connector starts drawing at t=0)
const TITLE_START = 0.2
const TITLE_DECODE_DURATION = 0.4
const META_START = 0.4
const META_DECODE_DURATION = 0.4
const DESC_START = 0.55
const DESC_DECODE_DURATION = 0.55
const PRICE_START = 0.85
const PRICE_DECODE_DURATION = 0.3
// Decode character set for the "untangling" effect
const SCRAMBLE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-+=<>/\\|[]{}'

// Step 7 — subtle center-composition resting stagger
const MAX_STAGGER = 18
const STAGGER_ROW_TOLERANCE = 4
const STAGGER_MIN_ROW_SIZE = 3

// Step 8 — subtle focus field / surrounding quieting
const QUIET_OPACITY = 0.9
const QUIET_BRIGHTNESS = 0.94
const COLUMN_MATE_BRIGHTNESS = 0.5 // cards sharing the focal card's column (see setSlotLevel)
const FOCAL_OPACITY = 1
const FOCAL_BRIGHTNESS = 1
const FOCUS_FIELD_DURATION = 0.6
const FOCUS_FIELD_LEAVE_DURATION = 0.75

// Step 9 — digital activation / pixelated entry response
const ACTIVATION_DURATION = 0.7
const ACTIVATION_FADE_DURATION = 0.1
const ACTIVATION_EASE = 'power2.in'
const ACTIVATION_RING_SPREAD = 145
const ACTIVATION_RING_BAND = 20
const ACTIVATION_GRID_BAND = 21
const ACTIVATION_GLOW_ALPHA = 0.14
const ACTIVATION_GRID_ALPHA = 0.6
const ACTIVATION_GRID_CELL = 10

// Step 10 — continuous digital pulse
const PULSE_CYCLE_MIN = 1.7
const PULSE_CYCLE_MAX = 2.3
const PULSE_RISE_FRACTION = 0.3
const PULSE_MAX_RADIUS = 150
const PULSE_PEAK_ALPHA = 0.2
const PULSE_FOLLOW_DURATION = 0.25
const PULSE_LEAVE_FADE = 0.5

// Step 11 — global dark focus overlay (page-wide dim pulse that originates
// from the hovered card). See the "── Step 11: global dark focus overlay ──"
// block below for how it integrates with the existing hover lifecycle.
const FOCUS_OVERLAY_Z = 15 // between resting card z-index (1) and focused card z-index (20)
const FOCUS_OVERLAY_COLOR = 'rgba(4, 5, 9, 0.56)'
const FOCUS_PULSE_DURATION = 1.7 // slow, cinematic expansion from the hovered card
const FOCUS_PULSE_EASE = 'power2.out'
const FOCUS_CLEAR_DURATION = 1.6 // clearing pulse that reverses the dark state
const FOCUS_CLEAR_EASE = 'power2.out'
const FOCUS_RECENTER_DURATION = 0.55 // gliding focus directly between cards while already dark
const FOCUS_MASK_EDGE = 2 // px soft edge between the hole/dark/reveal bands of the mask

// Idle suspended floating / wobble motion
const IDLE_FLOAT_Y_MIN = 1.2
const IDLE_FLOAT_Y_MAX = 1.8
const IDLE_FLOAT_X_MIN = 0.8
const IDLE_FLOAT_X_MAX = 1.4
const IDLE_FLOAT_ROT_MIN = 0.35
const IDLE_FLOAT_ROT_MAX = 0.55
const IDLE_FLOAT_TILT_MIN = 0.2
const IDLE_FLOAT_TILT_MAX = 0.4
const IDLE_YIELD_DURATION = 0.5
const IDLE_RESTORE_DURATION = 0.85

export default function CompetitionsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const { events, loading, error, reload } = useEvents(EVENT_TYPE, {
    label: CARD_LABEL,
    fallbackImage: FALLBACK_IMAGE,
  })

  const [mounted, setMounted] = useState(false)

  // Step 6 — annotation callout render state
  const [calloutCompetition, setCalloutCompetition] = useState(null)
  const [calloutSide, setCalloutSide] = useState('right')

  // Click Zoom Transition state & locks
  const [activeTransition, setActiveTransition] = useState(null)
  const isNavigatingRef = useRef(false)
  const pageRef = useRef(null)
  const transitionOverlayRef = useRef(null)
  const transitionImgRef = useRef(null)
  const transitionTlRef = useRef(null)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousBodyBackground = body.style.backgroundColor

    html.style.overflow = 'auto'
    body.style.overflow = 'visible'
    body.style.backgroundColor = '#06070d'

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      body.style.backgroundColor = previousBodyBackground
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return undefined

    let targetScrollY = window.scrollY
    let animationFrame = null

    const clampScrollY = (value) => {
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight
      return Math.min(Math.max(value, 0), Math.max(maxScrollY, 0))
    }

    const animateScroll = () => {
      const currentScrollY = window.scrollY
      const nextScrollY =
        currentScrollY + (targetScrollY - currentScrollY) * 0.2

      window.scrollTo(0, nextScrollY)

      if (Math.abs(targetScrollY - nextScrollY) > 0.5) {
        animationFrame = requestAnimationFrame(animateScroll)
      } else {
        window.scrollTo(0, targetScrollY)
        animationFrame = null
      }
    }

    const handleWheel = (event) => {
      if (event.ctrlKey || event.deltaY === 0) return

      event.preventDefault()

      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
      targetScrollY = clampScrollY(targetScrollY + delta * 1.25)

      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(animateScroll)
      }
    }

    const syncScrollTarget = () => {
      if (animationFrame === null) targetScrollY = window.scrollY
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('scroll', syncScrollTarget, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', syncScrollTarget)
      if (animationFrame !== null) cancelAnimationFrame(animationFrame)
    }
  }, [])

  const slotRefs = useRef({})
  const floatRefs = useRef({})
  const cardRefs = useRef({})
  const frontFaceRefs = useRef({})
  const artRefs = useRef({})
  const isFinePointer = useRef(true)
  const prefersReducedMotion = useRef(false)
  const focusedIdRef = useRef(null)

  // Idle floating bookkeeping
  const idleWeightsRef = useRef({})
  const idleParamsRef = useRef({})
  const idleTickRef = useRef(null)

  const fieldActiveRef = useRef(false)
  const rampStartRef = useRef(0)
  const rectCacheRef = useRef({})
  const tickerRunningRef = useRef(false)
  const tickRef = useRef(null)

  // Page-load entrance animation
  const entranceCompleteRef = useRef(false)
  const entranceTlRef = useRef(null)

  // Step 6 — annotation callout refs
  const calloutOverlayRef = useRef(null)
  const calloutPathRef = useRef(null)
  const calloutLabelRef = useRef(null)
  const calloutTitleRef = useRef(null)
  const calloutMetaRef = useRef(null)
  const calloutDescRef = useRef(null)
  const calloutPriceRef = useRef(null)
  const calloutSideRef = useRef('right')
  const calloutVisibleRef = useRef(false)
  const calloutAnimatingRef = useRef(false)
  const calloutTimelineRef = useRef(null)
  const calloutDecodeRef = useRef({})

  // Step 9 bookkeeping
  const activationOverlayRefs = useRef({})
  const activationTimelineRefs = useRef({})

  // Step 10 bookkeeping
  const pulseOverlayRefs = useRef({})
  const pulseTimelineRefs = useRef({})
  const pulseFollowRefs = useRef({})

  // Step 11 — global dark focus overlay bookkeeping
  const focusOverlayRef = useRef(null)
  const focusTweenRef = useRef(null)
  const focusEngagedRef = useRef(false)
  const focusOriginRef = useRef({ x: 0, y: 0 })
  const focusMaxRadiusRef = useRef(0)

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    isFinePointer.current = hoverQuery.matches
    prefersReducedMotion.current = motionQuery.matches

    const handleHoverChange = (e) => {
      isFinePointer.current = e.matches
    }
    const handleMotionChange = (e) => {
      prefersReducedMotion.current = e.matches
      if (e.matches) {
        Object.values(floatRefs.current).forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, rotationZ: 0, rotationX: 0 })
        })
      }
    }

    hoverQuery.addEventListener('change', handleHoverChange)
    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      hoverQuery.removeEventListener('change', handleHoverChange)
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Idle floating params
  const getIdleParams = (id) => {
    let hash = 0
    const str = String(id ?? '')
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    }
    const s1 = (hash % 1000) / 1000
    const s2 = (Math.floor(hash / 1000) % 1000) / 1000
    const s3 = (Math.floor(hash / 1000000) % 1000) / 1000
    const s4 = ((hash ^ 0x5a5a5a5a) % 1000) / 1000

    return {
      freqY: (2 * Math.PI) / (4.2 + s1 * 1.8),
      freqX: (2 * Math.PI) / (4.8 + s2 * 1.6),
      freqRot: (2 * Math.PI) / (4.0 + s3 * 2.0),
      freqTilt: (2 * Math.PI) / (3.6 + s4 * 1.6),
      phaseY: s1 * Math.PI * 2,
      phaseX: s2 * Math.PI * 2,
      phaseRot: s3 * Math.PI * 2,
      phaseTilt: s4 * Math.PI * 2,
      ampY: IDLE_FLOAT_Y_MIN + s1 * (IDLE_FLOAT_Y_MAX - IDLE_FLOAT_Y_MIN),
      ampX: IDLE_FLOAT_X_MIN + s2 * (IDLE_FLOAT_X_MAX - IDLE_FLOAT_X_MIN),
      ampRot:
        IDLE_FLOAT_ROT_MIN + s3 * (IDLE_FLOAT_ROT_MAX - IDLE_FLOAT_ROT_MIN),
      ampTilt:
        IDLE_FLOAT_TILT_MIN + s4 * (IDLE_FLOAT_TILT_MAX - IDLE_FLOAT_TILT_MIN),
    }
  }

  // Continuous idle floating loop
  useEffect(() => {
    const idleTick = () => {
      if (!isFinePointer.current || prefersReducedMotion.current) return

      const t = performance.now() * 0.001
      const floatMap = floatRefs.current
      const weightsMap = idleWeightsRef.current
      const paramsMap = idleParamsRef.current

      for (const id in floatMap) {
        const el = floatMap[id]
        if (!el) continue

        const wObj = weightsMap[id]
        const weight = wObj !== undefined ? wObj.weight : 1

        if (weight <= 0.001) {
          if (el._hasIdleTransform) {
            gsap.set(el, { x: 0, y: 0, rotationZ: 0, rotationX: 0 })
            el._hasIdleTransform = false
          }
          continue
        }

        let p = paramsMap[id]
        if (!p) {
          p = getIdleParams(id)
          paramsMap[id] = p
        }

        const y = Math.sin(t * p.freqY + p.phaseY) * p.ampY * weight
        const x = Math.sin(t * p.freqX + p.phaseX) * p.ampX * weight
        const rotZ = Math.sin(t * p.freqRot + p.phaseRot) * p.ampRot * weight
        const rotX = Math.cos(t * p.freqTilt + p.phaseTilt) * p.ampTilt * weight

        gsap.set(el, {
          x,
          y,
          rotationZ: rotZ,
          rotationX: rotX,
        })
        el._hasIdleTransform = true
      }
    }

    idleTickRef.current = idleTick
    gsap.ticker.add(idleTick)

    return () => {
      gsap.ticker.remove(idleTick)
    }
  }, [])

  const getPointerResponse = (e, slotEl) => {
    const rect = slotEl.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const nx = Math.min(Math.max(px - 0.5, -0.5), 0.5)
    const ny = Math.min(Math.max(py - 0.5, -0.5), 0.5)

    return {
      x: nx * 2 * MAX_TRANSLATE,
      y: ny * 2 * MAX_TRANSLATE,
      rotationY: nx * 2 * MAX_TILT,
      rotationX: -ny * 2 * MAX_TILT,
    }
  }

  const measureSlots = () => {
    const cache = {}
    Object.keys(slotRefs.current).forEach((id) => {
      const el = slotRefs.current[id]
      if (!el) return
      const rect = el.getBoundingClientRect()
      cache[id] = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
    })
    rectCacheRef.current = cache
  }

  const applyRestingStagger = () => {
    if (!isFinePointer.current) {
      Object.values(slotRefs.current).forEach((slotEl) => {
        if (slotEl) slotEl.style.transform = ''
      })
      return
    }

    const cache = rectCacheRef.current
    const ids = Object.keys(cache)
    if (ids.length === 0) return

    const rows = {}
    ids.forEach((id) => {
      const top = cache[id].top
      const rowKey =
        Math.round(top / STAGGER_ROW_TOLERANCE) * STAGGER_ROW_TOLERANCE
      if (!rows[rowKey]) rows[rowKey] = []
      rows[rowKey].push(id)
    })

    Object.values(rows).forEach((rowIds) => {
      if (rowIds.length < STAGGER_MIN_ROW_SIZE) {
        rowIds.forEach((id) => {
          const slotEl = slotRefs.current[id]
          if (slotEl) slotEl.style.transform = ''
        })
        return
      }

      const xs = rowIds.map((id) => cache[id].cx)
      const rowMinX = Math.min(...xs)
      const rowMaxX = Math.max(...xs)
      const rowCenterX = (rowMinX + rowMaxX) / 2
      const halfWidth = (rowMaxX - rowMinX) / 2 || 1

      rowIds.forEach((id) => {
        const slotEl = slotRefs.current[id]
        if (!slotEl) return
        const normalizedDist = Math.min(
          Math.abs(cache[id].cx - rowCenterX) / halfWidth,
          1,
        )
        const factor = Math.cos((normalizedDist * Math.PI) / 2)
        const stagger = -MAX_STAGGER * factor
        slotEl.style.transform = stagger !== 0 ? `translateY(${stagger}px)` : ''
      })
    })
  }

  const remeasureAndStagger = () => {
    Object.values(slotRefs.current).forEach((slotEl) => {
      if (slotEl) slotEl.style.transform = ''
    })
    measureSlots()
    applyRestingStagger()
  }

  // The focal card's whole column is lifted above the dark overlay (a
  // column is its own stacking context because of its scroll-offset
  // transform), so slot z-index alone isn't enough.
  const setSlotLevel = (slotEl, raised) => {
    if (!slotEl) return
    slotEl.style.zIndex = raised ? '20' : '1'
    const columnEl = slotEl.parentElement
    if (columnEl) columnEl.style.zIndex = raised ? '20' : ''
  }

  const applyFocusField = (focalId) => {
    const focalSlot = slotRefs.current[focalId]
    const focalColumn = focalSlot ? focalSlot.parentElement : null

    Object.keys(cardRefs.current).forEach((otherId) => {
      const cardEl = cardRefs.current[otherId]
      if (!cardEl) return

      const isFocal = String(otherId) === String(focalId)
      const otherSlot = slotRefs.current[otherId]
      // Neighbours in the focal column ride above the overlay with the focal
      // card, so they are dimmed directly to match the rest of the page.
      const isColumnMate =
        !isFocal &&
        focalColumn &&
        otherSlot &&
        otherSlot.parentElement === focalColumn
      const brightness = isFocal
        ? FOCAL_BRIGHTNESS
        : isColumnMate
          ? COLUMN_MATE_BRIGHTNESS
          : QUIET_BRIGHTNESS

      gsap.killTweensOf(cardEl, 'opacity,filter')
      gsap.to(cardEl, {
        opacity: isFocal ? FOCAL_OPACITY : QUIET_OPACITY,
        filter: `brightness(${brightness})`,
        duration: FOCUS_FIELD_DURATION,
        ease: EASE,
        overwrite: 'auto',
      })
    })
  }

  const releaseFocusField = () => {
    Object.values(cardRefs.current).forEach((cardEl) => {
      if (!cardEl) return
      gsap.killTweensOf(cardEl, 'opacity,filter')
      gsap.to(cardEl, {
        opacity: FOCAL_OPACITY,
        filter: `brightness(${FOCAL_BRIGHTNESS})`,
        duration: FOCUS_FIELD_LEAVE_DURATION,
        ease: EASE,
        overwrite: 'auto',
      })
    })
  }

  const computeFocusGeometry = (cardEl) => {
    const overlayEl = focusOverlayRef.current
    if (!overlayEl || !cardEl) return null

    const overlayRect = overlayEl.getBoundingClientRect()
    const cardRect = cardEl.getBoundingClientRect()
    if (overlayRect.width === 0 || overlayRect.height === 0) return null

    const originX = cardRect.left + cardRect.width / 2 - overlayRect.left
    const originY = cardRect.top + cardRect.height / 2 - overlayRect.top
    const dx = Math.max(originX, overlayRect.width - originX)
    const dy = Math.max(originY, overlayRect.height - originY)

    return { x: originX, y: originY, maxRadius: Math.sqrt(dx * dx + dy * dy) }
  }

  const hardResetFocusOverlay = () => {
    if (focusTweenRef.current) {
      focusTweenRef.current.kill()
      focusTweenRef.current = null
    }
    focusEngagedRef.current = false
    const overlayEl = focusOverlayRef.current
    if (overlayEl) {
      gsap.set(overlayEl, {
        opacity: 0,
        '--focus-reveal': 0,
        '--focus-hole': 0,
      })
    }
  }

  const startFocusDarkPulse = (id) => {
    const overlayEl = focusOverlayRef.current
    const cardEl = cardRefs.current[id]
    if (!overlayEl || !cardEl) return

    const geometry = computeFocusGeometry(cardEl)
    if (!geometry) return

    const wasEngaged = focusEngagedRef.current
    focusEngagedRef.current = true
    focusOriginRef.current = { x: geometry.x, y: geometry.y }
    focusMaxRadiusRef.current = geometry.maxRadius

    if (focusTweenRef.current) {
      focusTweenRef.current.kill()
      focusTweenRef.current = null
    }

    gsap.set(overlayEl, {
      '--focus-x': geometry.x,
      '--focus-y': geometry.y,
      opacity: 1,
    })

    if (wasEngaged) {
      focusTweenRef.current = gsap.to(overlayEl, {
        '--focus-hole': 0,
        '--focus-reveal': geometry.maxRadius,
        duration: FOCUS_RECENTER_DURATION,
        ease: FOCUS_PULSE_EASE,
        overwrite: 'auto',
        onComplete: () => {
          focusTweenRef.current = null
        },
      })
      return
    }

    gsap.set(overlayEl, { '--focus-reveal': 0, '--focus-hole': 0 })
    focusTweenRef.current = gsap.to(overlayEl, {
      '--focus-reveal': geometry.maxRadius,
      duration: FOCUS_PULSE_DURATION,
      ease: FOCUS_PULSE_EASE,
      overwrite: 'auto',
      onComplete: () => {
        focusTweenRef.current = null
      },
    })
  }

  const startFocusClearPulse = () => {
    const overlayEl = focusOverlayRef.current
    if (!overlayEl || !focusEngagedRef.current) return

    focusEngagedRef.current = false

    if (focusTweenRef.current) {
      focusTweenRef.current.kill()
      focusTweenRef.current = null
    }

    focusTweenRef.current = gsap.to(overlayEl, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: () => {
        focusTweenRef.current = null

        gsap.set(overlayEl, {
          opacity: 0,
          '--focus-reveal': 0,
          '--focus-hole': 0,
        })
      },
    })
  }

  const runCardActivation = (id, e) => {
    const overlayEl = activationOverlayRefs.current[id]
    const frontFaceEl = frontFaceRefs.current[id]
    if (!overlayEl || !frontFaceEl) return

    const feRect = frontFaceEl.getBoundingClientRect()
    if (feRect.width === 0 || feRect.height === 0) return

    const originX = Math.min(
      Math.max(((e.clientX - feRect.left) / feRect.width) * 100, 0),
      100,
    )
    const originY = Math.min(
      Math.max(((e.clientY - feRect.top) / feRect.height) * 100, 0),
      100,
    )

    if (activationTimelineRefs.current[id]) {
      activationTimelineRefs.current[id].kill()
    }

    const tl = gsap.timeline({
      onComplete: () => {
        delete activationTimelineRefs.current[id]
      },
    })
    activationTimelineRefs.current[id] = tl

    tl.set(overlayEl, {
      '--activation-x': `${originX}%`,
      '--activation-y': `${originY}%`,
      '--activation-progress': 0,
      opacity: 1,
    })
    tl.to(
      overlayEl,
      {
        '--activation-progress': 1,
        duration: ACTIVATION_DURATION,
        ease: ACTIVATION_EASE,
      },
      0,
    )
    tl.to(
      overlayEl,
      {
        opacity: 0,
        duration: ACTIVATION_FADE_DURATION,
        ease: 'power1.out',
      },
      ACTIVATION_DURATION - ACTIVATION_FADE_DURATION,
    )
  }

  const resetCardActivation = (id) => {
    const tl = activationTimelineRefs.current[id]
    if (tl) {
      tl.kill()
      delete activationTimelineRefs.current[id]
    }
    const overlayEl = activationOverlayRefs.current[id]
    if (overlayEl) {
      gsap.set(overlayEl, { opacity: 0, '--activation-progress': 0 })
    }
  }

  const resetAllCardActivations = () => {
    Object.keys(activationTimelineRefs.current).forEach((id) => {
      activationTimelineRefs.current[id].kill()
    })
    activationTimelineRefs.current = {}
    Object.values(activationOverlayRefs.current).forEach((overlayEl) => {
      if (overlayEl) {
        gsap.killTweensOf(overlayEl)
        gsap.set(overlayEl, { opacity: 0, '--activation-progress': 0 })
      }
    })
  }

  const getOriginPercent = (e, el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return { x: 50, y: 50 }
    }
    return {
      x: Math.min(
        Math.max(((e.clientX - rect.left) / rect.width) * 100, 0),
        100,
      ),
      y: Math.min(
        Math.max(((e.clientY - rect.top) / rect.height) * 100, 0),
        100,
      ),
    }
  }

  const startCardPulse = (id, originXPercent, originYPercent) => {
    const overlayEl = pulseOverlayRefs.current[id]
    if (!overlayEl) return

    const alreadyPulsing = Boolean(pulseTimelineRefs.current[id])

    if (!alreadyPulsing) {
      gsap.set(overlayEl, {
        '--pulse-x': originXPercent,
        '--pulse-y': originYPercent,
        '--pulse-alpha': 0,
        '--pulse-radius': 0,
        opacity: 1,
      })
    }

    if (!pulseFollowRefs.current[id]) {
      pulseFollowRefs.current[id] = {
        x: gsap.quickTo(overlayEl, '--pulse-x', {
          duration: PULSE_FOLLOW_DURATION,
          ease: 'power2.out',
        }),
        y: gsap.quickTo(overlayEl, '--pulse-y', {
          duration: PULSE_FOLLOW_DURATION,
          ease: 'power2.out',
        }),
      }
    }

    if (alreadyPulsing) return

    const cycle =
      PULSE_CYCLE_MIN + Math.random() * (PULSE_CYCLE_MAX - PULSE_CYCLE_MIN)
    const riseDur = cycle * PULSE_RISE_FRACTION
    const fallDur = cycle - riseDur

    const tl = gsap.timeline({ repeat: -1 })

    tl.to(
      overlayEl,
      {
        '--pulse-alpha': PULSE_PEAK_ALPHA,
        duration: riseDur,
        ease: 'sine.out',
      },
      0,
    )

    tl.to(
      overlayEl,
      {
        '--pulse-radius': PULSE_MAX_RADIUS,
        duration: cycle,
        ease: 'sine.out',
      },
      0,
    )

    tl.to(
      overlayEl,
      {
        '--pulse-alpha': 0,
        duration: fallDur,
        ease: 'sine.in',
      },
      riseDur,
    )

    tl.set(overlayEl, { '--pulse-radius': 0 }, cycle)

    pulseTimelineRefs.current[id] = tl
  }

  const updateCardPulseOrigin = (id, xPercent, yPercent) => {
    const follow = pulseFollowRefs.current[id]
    if (!follow) return

    follow.x(xPercent)
    follow.y(yPercent)
  }

  const stopCardPulse = (id, { fade = true } = {}) => {
    const tl = pulseTimelineRefs.current[id]

    if (tl) {
      tl.kill()
      delete pulseTimelineRefs.current[id]
    }

    delete pulseFollowRefs.current[id]

    const overlayEl = pulseOverlayRefs.current[id]
    if (!overlayEl) return

    gsap.killTweensOf(overlayEl)

    if (fade) {
      gsap.to(overlayEl, {
        '--pulse-alpha': 0,
        duration: PULSE_LEAVE_FADE,
        ease: 'sine.out',
        overwrite: 'auto',
        onComplete: () => {
          gsap.set(overlayEl, {
            '--pulse-radius': 0,
            opacity: 0,
          })
        },
      })
    } else {
      gsap.set(overlayEl, {
        '--pulse-alpha': 0,
        '--pulse-radius': 0,
        opacity: 0,
      })
    }
  }

  const stopAllCardPulses = () => {
    Object.keys(pulseOverlayRefs.current).forEach((id) => {
      stopCardPulse(id, { fade: false })
    })
  }

  const computeCalloutSide = (slotEl) => {
    const rect = slotEl.getBoundingClientRect()
    const needed = CALLOUT_LABEL_WIDTH + CALLOUT_GAP + CALLOUT_STUB + 24
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left
    if (spaceRight >= needed) return 'right'
    if (spaceLeft >= needed) return 'left'
    return spaceRight >= spaceLeft ? 'right' : 'left'
  }

  const computeCalloutRaw = (id, side) => {
    const cardEl = cardRefs.current[id]
    if (!cardEl) return null

    const rect = cardEl.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null

    const cardLeft = rect.left
    const cardTop = rect.top
    const cardRight = rect.right
    const cardCenterY = cardTop + rect.height / 2

    const anchor =
      side === 'right'
        ? { x: cardRight, y: cardCenterY }
        : { x: cardLeft, y: cardCenterY }

    const labelX =
      side === 'right'
        ? cardRight + CALLOUT_GAP
        : cardLeft - CALLOUT_GAP - CALLOUT_LABEL_WIDTH

    let labelY = cardCenterY - CALLOUT_LABEL_HEIGHT_ESTIMATE / 2
    labelY = Math.min(
      Math.max(labelY, CALLOUT_VIEWPORT_MARGIN),
      window.innerHeight -
        CALLOUT_LABEL_HEIGHT_ESTIMATE -
        CALLOUT_VIEWPORT_MARGIN,
    )

    return { anchor, labelTarget: { x: labelX, y: labelY } }
  }

  const buildCalloutPath = (anchor, labelAnchor, side) => {
    const stubX =
      side === 'right' ? anchor.x + CALLOUT_STUB : anchor.x - CALLOUT_STUB
    return `M ${anchor.x} ${anchor.y} L ${stubX} ${anchor.y} L ${stubX} ${labelAnchor.y} L ${labelAnchor.x} ${labelAnchor.y}`
  }

  const getCalloutLabelAnchor = (labelX, labelY, side) =>
    side === 'right'
      ? { x: labelX, y: labelY + CALLOUT_LABEL_ANCHOR_OFFSET_Y }
      : {
          x: labelX + CALLOUT_LABEL_WIDTH,
          y: labelY + CALLOUT_LABEL_ANCHOR_OFFSET_Y,
        }

  const randomScrambleChar = () =>
    SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]

  const buildResolveThresholds = (length) => {
    const thresholds = new Array(length)
    for (let i = 0; i < length; i++) {
      const base = length > 1 ? i / (length - 1) : 0
      thresholds[i] = Math.min(base * 0.75 + Math.random() * 0.25, 1)
    }
    return thresholds
  }

  const renderDecodeText = (el, text, thresholds, progress) => {
    if (!el) return
    if (progress >= 1) {
      el.textContent = text
      return
    }
    let out = ''
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (ch === ' ') {
        out += ch
      } else if (progress >= thresholds[i]) {
        out += ch
      } else {
        out += randomScrambleChar()
      }
    }
    el.textContent = out
  }

  const triggerDecodeAudioHook = () => {}

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        })
      : 'TBA'

  const getVenueName = (venue) =>
    typeof venue === 'object' ? venue?.name : venue

  const hardResetCallout = () => {
    if (calloutTimelineRef.current) {
      calloutTimelineRef.current.kill()
      calloutTimelineRef.current = null
    }
    calloutAnimatingRef.current = false
    calloutVisibleRef.current = false

    const labelEl = calloutLabelRef.current
    const pathEl = calloutPathRef.current
    if (labelEl) {
      gsap.killTweensOf(labelEl)
      gsap.set(labelEl, { opacity: 0 })
    }
    if (pathEl) {
      gsap.killTweensOf(pathEl)
      gsap.set(pathEl, { opacity: 0 })
    }
  }

  const fadeOutCallout = () => {
    if (!calloutVisibleRef.current) return

    if (calloutTimelineRef.current) {
      calloutTimelineRef.current.kill()
      calloutTimelineRef.current = null
    }
    calloutAnimatingRef.current = false
    calloutVisibleRef.current = false

    const labelEl = calloutLabelRef.current
    const pathEl = calloutPathRef.current

    if (labelEl) {
      gsap.killTweensOf(labelEl)
      gsap.to(labelEl, {
        opacity: 0,
        duration: CALLOUT_EXIT_DURATION,
        ease: EASE,
        overwrite: 'auto',
        onComplete: () => setCalloutCompetition(null),
      })
    } else {
      setCalloutCompetition(null)
    }

    if (pathEl) {
      gsap.killTweensOf(pathEl)
      gsap.to(pathEl, {
        opacity: 0,
        duration: CALLOUT_EXIT_DURATION,
        ease: EASE,
        overwrite: 'auto',
      })
    }
  }

  const startCallout = (id, slotEl, competition) => {
    hardResetCallout()

    const labelEl = calloutLabelRef.current
    const pathEl = calloutPathRef.current
    if (!labelEl || !pathEl) return

    const side = computeCalloutSide(slotEl)
    calloutSideRef.current = side
    setCalloutSide(side)
    setCalloutCompetition(competition)

    const titleText = String(
      competition.fullTitle ?? competition.title ?? 'Untitled',
    ).toUpperCase()
    const venueName = getVenueName(competition.venue)
    const metaText = `${competition.dateMonth} ${competition.dateDay}${competition.time ? ` · ${competition.time}` : ''}${venueName ? ` · ${venueName}` : ''}`
    const descText = String(
      competition.description ?? 'No description available',
    )
    const priceText = `${competition.fee != null ? competition.fee : 'N/A'}`

    calloutDecodeRef.current = {
      title: {
        text: titleText,
        thresholds: buildResolveThresholds(titleText.length),
      },
      meta: {
        text: metaText,
        thresholds: buildResolveThresholds(metaText.length),
      },
      desc: {
        text: descText,
        thresholds: buildResolveThresholds(descText.length),
      },
      price: {
        text: priceText,
        thresholds: buildResolveThresholds(priceText.length),
      },
    }

    if (calloutTitleRef.current) calloutTitleRef.current.textContent = ''
    if (calloutMetaRef.current) calloutMetaRef.current.textContent = ''
    if (calloutDescRef.current) calloutDescRef.current.textContent = ''
    if (calloutPriceRef.current) calloutPriceRef.current.textContent = ''

    const geometry = computeCalloutRaw(id, side)
    if (!geometry) return

    gsap.set(labelEl, {
      x: geometry.labelTarget.x,
      y: geometry.labelTarget.y,
      opacity: 0,
    })

    const labelAnchor = getCalloutLabelAnchor(
      geometry.labelTarget.x,
      geometry.labelTarget.y,
      side,
    )
    const pathD = buildCalloutPath(geometry.anchor, labelAnchor, side)
    pathEl.setAttribute('d', pathD)
    const length = pathEl.getTotalLength()
    gsap.set(pathEl, {
      opacity: 1,
      strokeDasharray: length,
      strokeDashoffset: length,
    })

    calloutVisibleRef.current = true
    calloutAnimatingRef.current = true

    const tl = gsap.timeline({
      onComplete: () => {
        calloutAnimatingRef.current = false
      },
    })
    calloutTimelineRef.current = tl

    tl.to(
      labelEl,
      { opacity: 1, duration: CALLOUT_CONTAINER_FADE_IN, ease: 'power1.out' },
      0,
    )
    tl.to(
      pathEl,
      {
        strokeDashoffset: 0,
        duration: LINE_DRAW_DURATION,
        ease: LINE_DRAW_EASE,
      },
      0,
    )

    const titleProxy = { p: 0 }
    tl.to(
      titleProxy,
      {
        p: 1,
        duration: TITLE_DECODE_DURATION,
        ease: 'none',
        onStart: triggerDecodeAudioHook,
        onUpdate: () =>
          renderDecodeText(
            calloutTitleRef.current,
            calloutDecodeRef.current.title.text,
            calloutDecodeRef.current.title.thresholds,
            titleProxy.p,
          ),
      },
      TITLE_START,
    )

    const metaProxy = { p: 0 }
    tl.to(
      metaProxy,
      {
        p: 1,
        duration: META_DECODE_DURATION,
        ease: 'none',
        onUpdate: () =>
          renderDecodeText(
            calloutMetaRef.current,
            calloutDecodeRef.current.meta.text,
            calloutDecodeRef.current.meta.thresholds,
            metaProxy.p,
          ),
      },
      META_START,
    )

    const descProxy = { p: 0 }
    tl.to(
      descProxy,
      {
        p: 1,
        duration: DESC_DECODE_DURATION,
        ease: 'none',
        onUpdate: () =>
          renderDecodeText(
            calloutDescRef.current,
            calloutDecodeRef.current.desc.text,
            calloutDecodeRef.current.desc.thresholds,
            descProxy.p,
          ),
      },
      DESC_START,
    )

    const priceProxy = { p: 0 }
    tl.to(
      priceProxy,
      {
        p: 1,
        duration: PRICE_DECODE_DURATION,
        ease: 'none',
        onUpdate: () =>
          renderDecodeText(
            calloutPriceRef.current,
            calloutDecodeRef.current.price.text,
            calloutDecodeRef.current.price.thresholds,
            priceProxy.p,
          ),
      },
      PRICE_START,
    )
  }

  // Continuous propagation ticker
  if (tickRef.current === null) {
    tickRef.current = () => {
      const focalId = focusedIdRef.current
      if (focalId === null) return

      const focalCard = cardRefs.current[focalId]
      const focalRect = rectCacheRef.current[focalId]
      if (!focalCard || !focalRect) return

      const liveX = gsap.getProperty(focalCard, 'x') || 0
      const liveY = gsap.getProperty(focalCard, 'y') || 0
      const focalCx = focalRect.cx + liveX
      const focalCy = focalRect.cy + liveY
      const cellSpacing = focalRect.width + GRID_GAP_PX

      const now = performance.now()
      const rampT = Math.min(1, (now - rampStartRef.current) / RAMP_IN_MS)
      const ramp = rampT * rampT * (3 - 2 * rampT)

      const deltaRatio = gsap.ticker.deltaRatio(60)

      Object.keys(cardRefs.current).forEach((otherId) => {
        if (String(otherId) === String(focalId)) return

        const cardEl = cardRefs.current[otherId]
        const rc = rectCacheRef.current[otherId]
        if (!cardEl || !rc) return

        const dx = rc.cx - focalCx
        const dy = rc.cy - focalCy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const dirX = dx / dist
        const dirY = dy / dist

        const steps = dist / cellSpacing
        const influence = 1 / (1 + steps * steps * FALLOFF_STRENGTH)

        const targetX = dirX * influence * MAX_SURROUND_DISPLACEMENT * ramp
        const targetY = dirY * influence * MAX_SURROUND_DISPLACEMENT * ramp

        const lagFactor = FAR_LAG + influence * (NEAR_LAG - FAR_LAG)
        const frameFactor = 1 - Math.pow(1 - lagFactor, deltaRatio)

        const curX = gsap.getProperty(cardEl, 'x') || 0
        const curY = gsap.getProperty(cardEl, 'y') || 0

        gsap.set(cardEl, {
          x: curX + (targetX - curX) * frameFactor,
          y: curY + (targetY - curY) * frameFactor,
        })
      })

      if (calloutVisibleRef.current) {
        const side = calloutSideRef.current
        const raw = computeCalloutRaw(focalId, side)
        const labelEl = calloutLabelRef.current
        const pathEl = calloutPathRef.current

        if (raw && labelEl && pathEl) {
          const curLX = gsap.getProperty(labelEl, 'x') || 0
          const curLY = gsap.getProperty(labelEl, 'y') || 0
          const labelFrameFactor =
            1 - Math.pow(1 - CALLOUT_LABEL_LAG, deltaRatio)
          const newLX = curLX + (raw.labelTarget.x - curLX) * labelFrameFactor
          const newLY = curLY + (raw.labelTarget.y - curLY) * labelFrameFactor
          gsap.set(labelEl, { x: newLX, y: newLY })

          const labelAnchor = getCalloutLabelAnchor(newLX, newLY, side)
          pathEl.setAttribute(
            'd',
            buildCalloutPath(raw.anchor, labelAnchor, side),
          )

          if (!calloutAnimatingRef.current) {
            const len = pathEl.getTotalLength()
            pathEl.setAttribute('stroke-dasharray', String(len))
            pathEl.setAttribute('stroke-dashoffset', '0')
          }
        }
      }
    }
  }

  const startTicker = () => {
    if (tickerRunningRef.current) return
    tickerRunningRef.current = true
    gsap.ticker.add(tickRef.current)
  }

  const stopTicker = () => {
    if (!tickerRunningRef.current) return
    tickerRunningRef.current = false
    gsap.ticker.remove(tickRef.current)
  }

  const handleCardEnter = (id, e, competition) => {
    if (isNavigatingRef.current) return
    if (!isFinePointer.current || prefersReducedMotion.current) return

    const slotEl = slotRefs.current[id]
    const cardEl = cardRefs.current[id]
    if (!slotEl || !cardEl) return

    const idleWeightObj =
      idleWeightsRef.current[id] || (idleWeightsRef.current[id] = { weight: 1 })
    gsap.killTweensOf(idleWeightObj)
    gsap.to(idleWeightObj, {
      weight: 0,
      duration: IDLE_YIELD_DURATION,
      ease: 'power2.out',
      overwrite: 'auto',
    })

    setSlotLevel(slotEl, true)

    const wasFieldActive = fieldActiveRef.current

    if (!wasFieldActive) {
      fieldActiveRef.current = true
      rampStartRef.current = performance.now()
      measureSlots()
      startTicker()
    }

    focusedIdRef.current = id

    const { x, y, rotationX, rotationY } = getPointerResponse(e, slotEl)

    gsap.killTweensOf(
      cardEl,
      'x,y,rotationX,rotationY,scale,z,boxShadow,backgroundColor',
    )
    gsap.to(cardEl, {
      x,
      y,
      rotationX,
      rotationY,
      scale: HOVER_SCALE,
      z: LIFT_Z,
      boxShadow: HOVER_SHADOW,
      backgroundColor: FOCUS_EDGE_BG,
      duration: ENTER_DURATION,
      ease: EASE,
      overwrite: 'auto',
    })

    const frontFaceEl = frontFaceRefs.current[id]
    if (frontFaceEl) {
      gsap.killTweensOf(frontFaceEl)
      gsap.to(frontFaceEl, {
        borderTopColor: FOCUS_EDGE_HIGHLIGHT_TOP,
        borderLeftColor: FOCUS_EDGE_HIGHLIGHT_LEFT,
        duration: ENTER_DURATION,
        ease: EASE,
        overwrite: 'auto',
      })
    }

    applyFocusField(id)
    startFocusDarkPulse(id)
    runCardActivation(id, e)

    const pulseFrontFaceEl = frontFaceRefs.current[id]
    if (pulseFrontFaceEl) {
      const pulseOrigin = getOriginPercent(e, pulseFrontFaceEl)
      startCardPulse(id, pulseOrigin.x, pulseOrigin.y)
    }

    startCallout(id, slotEl, competition)
  }

  const handleCardMove = (id, e) => {
    if (isNavigatingRef.current) return
    if (!isFinePointer.current || prefersReducedMotion.current) return

    const slotEl = slotRefs.current[id]
    const cardEl = cardRefs.current[id]
    if (!slotEl || !cardEl) return

    const { x, y, rotationX, rotationY } = getPointerResponse(e, slotEl)

    gsap.to(cardEl, {
      x,
      y,
      rotationX,
      rotationY,
      duration: MOVE_DURATION,
      ease: EASE,
      overwrite: 'auto',
    })

    const pulseFrontFaceEl = frontFaceRefs.current[id]
    if (pulseFrontFaceEl) {
      const pulseOrigin = getOriginPercent(e, pulseFrontFaceEl)
      updateCardPulseOrigin(id, pulseOrigin.x, pulseOrigin.y)
    }
  }

  const handleCardLeave = (id) => {
    if (isNavigatingRef.current) return
    if (!isFinePointer.current) return

    const slotEl = slotRefs.current[id]
    const cardEl = cardRefs.current[id]
    if (!slotEl || !cardEl) return

    const idleWeightObj =
      idleWeightsRef.current[id] || (idleWeightsRef.current[id] = { weight: 0 })
    gsap.killTweensOf(idleWeightObj)
    gsap.to(idleWeightObj, {
      weight: 1,
      duration: IDLE_RESTORE_DURATION,
      delay: 0.1,
      ease: 'power2.inOut',
      overwrite: 'auto',
    })

    gsap.killTweensOf(
      cardEl,
      'x,y,rotationX,rotationY,scale,z,boxShadow,backgroundColor',
    )
    gsap.to(cardEl, {
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      z: 0,
      boxShadow: REST_SHADOW,
      backgroundColor: REST_EDGE_BG,
      duration: LEAVE_DURATION,
      ease: EASE,
      overwrite: 'auto',
    })

    const frontFaceEl = frontFaceRefs.current[id]
    if (frontFaceEl) {
      gsap.killTweensOf(frontFaceEl)
      gsap.to(frontFaceEl, {
        borderTopColor: REST_EDGE_HIGHLIGHT_TOP,
        borderLeftColor: REST_EDGE_HIGHLIGHT_LEFT,
        duration: LEAVE_DURATION,
        ease: EASE,
        overwrite: 'auto',
      })
    }

    setSlotLevel(slotEl, false)
    resetCardActivation(id)
    stopCardPulse(id)

    if (String(focusedIdRef.current) === String(id)) {
      fadeOutCallout()
      focusedIdRef.current = null

      requestAnimationFrame(() => {
        if (focusedIdRef.current === null) {
          startFocusClearPulse()
        }
      })
    }
  }

  const handleGridLeave = () => {
    if (isNavigatingRef.current) return
    if (!isFinePointer.current) return
    if (!fieldActiveRef.current) return

    fieldActiveRef.current = false
    focusedIdRef.current = null
    stopTicker()

    Object.keys(cardRefs.current).forEach((id) => {
      const cardEl = cardRefs.current[id]
      const slotEl = slotRefs.current[id]
      if (!cardEl) return

      gsap.killTweensOf(cardEl, 'x,y,rotationX,rotationY,scale,z,boxShadow')
      gsap.to(cardEl, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        z: 0,
        boxShadow: REST_SHADOW,
        duration: FIELD_RETURN_DURATION,
        ease: EASE,
        overwrite: 'auto',
      })

      setSlotLevel(slotEl, false)
    })

    Object.keys(floatRefs.current).forEach((cardId) => {
      const wObj =
        idleWeightsRef.current[cardId] ||
        (idleWeightsRef.current[cardId] = { weight: 0 })
      gsap.killTweensOf(wObj)
      gsap.to(wObj, {
        weight: 1,
        duration: IDLE_RESTORE_DURATION,
        ease: 'power2.inOut',
        overwrite: 'auto',
      })
    })

    releaseFocusField()
    fadeOutCallout()
    resetAllCardActivations()
    stopAllCardPulses()
    startFocusClearPulse()
  }

  // ── Click → Zoom → Navigate handler ──
  const handleCardClick = (e, id, href, displayImage) => {
    if (isNavigatingRef.current) {
      e.preventDefault()
      return
    }

    if (prefersReducedMotion.current) {
      isNavigatingRef.current = true
      router.push(href)
      return
    }

    e.preventDefault()
    isNavigatingRef.current = true

    // Remove callout, activation wave, pulse, dark focus overlay
    hardResetCallout()
    resetCardActivation(id)
    stopCardPulse(id, { fade: false })
    stopTicker()
    hardResetFocusOverlay()
    focusedIdRef.current = null

    const cardEl = cardRefs.current[id]
    const targetEl = artRefs.current[id] || frontFaceRefs.current[id] || cardEl

    if (!targetEl) {
      router.push(href)
      return
    }

    // Lock the clicked card's hover transforms
    if (cardEl) gsap.killTweensOf(cardEl)

    const rect = targetEl.getBoundingClientRect()

    setActiveTransition({
      id,
      href,
      displayImage,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    })
  }

  // ── Zoom animation effect ──
  useEffect(() => {
    if (!activeTransition) return undefined

    const { id, href } = activeTransition
    const overlayEl = transitionOverlayRef.current
    const imgEl = transitionImgRef.current
    const clickedCard = cardRefs.current[id]

    if (!overlayEl) return undefined

    if (clickedCard) gsap.set(clickedCard, { opacity: 0 })

    const tl = gsap.timeline()
    transitionTlRef.current = tl

    // Page content recedes while the picture expands to fill the viewport.
    // (Applied to <main>, not the page root, so the fixed navbar and
    // background are never given a transform.)
    if (pageRef.current) {
      const mainRect = pageRef.current.getBoundingClientRect()
      gsap.set(pageRef.current, {
        transformOrigin: `50% ${window.innerHeight / 2 - mainRect.top}px`,
      })
      tl.to(
        pageRef.current,
        { opacity: 0, scale: 0.94, duration: 0.8, ease: 'power3.inOut' },
        0,
      )
    }

    tl.to(
      overlayEl,
      {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        borderRadius: '0px',
        boxShadow: '0 0 0px rgba(0,0,0,0)',
        duration: 0.8,
        ease: 'power3.inOut',
      },
      0,
    )
    tl.to(imgEl, { opacity: 0, duration: 0.22, ease: 'power2.in' }, 0.18)

    if (imgEl) {
      tl.to(imgEl, { scale: 1.08, duration: 0.8, ease: 'power3.inOut' }, 0)
    }

    tl.to(imgEl, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0.8)

    tl.add(() => {
      router.push(href)
    }, 1.05)

    return () => {
      if (transitionTlRef.current) {
        transitionTlRef.current.kill()
        transitionTlRef.current = null
      }
    }
  }, [activeTransition, router])

  useEffect(() => {
    fieldActiveRef.current = false
    focusedIdRef.current = null
    stopTicker()

    if (pageRef.current) {
      gsap.set(pageRef.current, { clearProps: 'opacity,transform,transformOrigin' })
    }

    Object.values(cardRefs.current).forEach((cardEl) => {
      if (cardEl) {
        gsap.killTweensOf(cardEl)
        gsap.set(cardEl, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          z: 0,
          scale: 1,
          boxShadow: REST_SHADOW,
          backgroundColor: REST_EDGE_BG,
          opacity: FOCAL_OPACITY,
          filter: `brightness(${FOCAL_BRIGHTNESS})`,
        })
      }
    })
    Object.values(frontFaceRefs.current).forEach((frontFaceEl) => {
      if (frontFaceEl) {
        gsap.killTweensOf(frontFaceEl)
        gsap.set(frontFaceEl, {
          borderTopColor: REST_EDGE_HIGHLIGHT_TOP,
          borderLeftColor: REST_EDGE_HIGHLIGHT_LEFT,
        })
      }
    })
    Object.values(slotRefs.current).forEach((slotEl) => {
      if (slotEl) setSlotLevel(slotEl, false)
    })
    Object.values(floatRefs.current).forEach((floatEl) => {
      if (floatEl) {
        gsap.set(floatEl, { x: 0, y: 0, rotationZ: 0, rotationX: 0 })
      }
    })
    Object.keys(idleWeightsRef.current).forEach((cardId) => {
      const wObj = idleWeightsRef.current[cardId]
      if (wObj) {
        gsap.killTweensOf(wObj)
        wObj.weight = 1
      }
    })

    hardResetCallout()
    setCalloutCompetition(null)
    resetAllCardActivations()
    stopAllCardPulses()
    hardResetFocusOverlay()
    remeasureAndStagger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  useEffect(() => {
    const handleResize = () => {
      if (!isFinePointer.current) return
      remeasureAndStagger()

      if (focusEngagedRef.current && focusedIdRef.current !== null) {
        const cardEl = cardRefs.current[focusedIdRef.current]
        const overlayEl = focusOverlayRef.current
        if (cardEl && overlayEl) {
          const geometry = computeFocusGeometry(cardEl)
          if (geometry) {
            focusOriginRef.current = { x: geometry.x, y: geometry.y }
            focusMaxRadiusRef.current = geometry.maxRadius
            gsap.set(overlayEl, {
              '--focus-x': geometry.x,
              '--focus-y': geometry.y,
              '--focus-reveal': geometry.maxRadius,
            })
          }
        }
      }
    }
    const handleScroll = () => {
      if (fieldActiveRef.current) {
        measureSlots()
      }
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      stopTicker()
      resetAllCardActivations()
      stopAllCardPulses()
      hardResetCallout()
      hardResetFocusOverlay()
      if (idleTickRef.current) {
        gsap.ticker.remove(idleTickRef.current)
      }
      if (entranceTlRef.current) {
        entranceTlRef.current.kill()
        entranceTlRef.current = null
      }
      if (transitionTlRef.current) {
        transitionTlRef.current.kill()
        transitionTlRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll progress for the staggered competition columns
  const [scrollProgress, setScrollProgress] = useState(0)
  const [columnCount, setColumnCount] = useState(4)
  const gridRef = React.useRef(null)
  const lastRowRef = React.useRef(null)

  useEffect(() => {
    const updateColumnCount = () => {
      const nextColumnCount =
        window.innerWidth < 768 ? 2 : window.innerWidth < 1024 ? 3 : 4

      setColumnCount(nextColumnCount)
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)

    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current) return

      const gridRect = gridRef.current.getBoundingClientRect()
      const firstColumn = gridRef.current.firstElementChild
      const firstCard = firstColumn?.firstElementChild
      const secondCard = firstColumn?.children[1]

      if (!firstCard) return

      const firstCardRect = firstCard.getBoundingClientRect()
      const rowGap = secondCard
        ? secondCard.getBoundingClientRect().top - firstCardRect.bottom
        : 18
      const rowPitch = firstCardRect.height + rowGap
      const rowsInViewport = Math.max(
        1,
        Math.floor((window.innerHeight + rowGap) / rowPitch),
      )

      const gridTop = window.scrollY + gridRect.top

      // Start when the grid enters the viewport
      const start = gridTop - window.innerHeight

      // Finish when the measured rows that fill the viewport have entered it.
      const end =
        gridTop + rowsInViewport * rowPitch - rowGap - window.innerHeight

      const progress = (window.scrollY - start) / (end - start)

      setScrollProgress(Math.min(Math.max(progress, 0), 1))
    }

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    })

    window.addEventListener('resize', handleScroll)

    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])
  // Filtered competitions
  // Searching a precomputed haystack rather than individual fields: the old
  // UI searched `item.instructor`, which the API has no field for.
  const filteredCompetitions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query ? events.filter((item) => item.searchText.includes(query)) : events
  }, [events, searchQuery])

  return (
    <div className='competitions-page min-h-screen bg-[#06070d] text-slate-100 font-sans relative overflow-x-clip selection:bg-indigo-600 selection:text-white pb-24'>
      <div className='hidden lg:block'>
        <Navbar />
      </div>
      <TathvaMenu />
      <style>{competitionsStyles}</style>

      {/* BACKGROUND AMBIENT STARS & GRADIENT */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        <div className='absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60' />

        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-950/20 via-purple-950/10 to-transparent blur-3xl' />
      </div>

      {/* MAIN CONTAINER */}
      <main
        ref={pageRef}
        className='relative z-10 px-4 sm:px-6 lg:px-8 pt-4'
      >
        {/* Step 11 — global dark focus overlay. Lives inside <main> so the
            raised focal column (z 20) sits above it (z 15) while every other
            column sits below. Purely visual; never blocks pointer events. */}
        <div
          ref={focusOverlayRef}
          aria-hidden='true'
          className='competition-focus-overlay pointer-events-none absolute inset-0'
          style={{ zIndex: FOCUS_OVERLAY_Z, opacity: 0 }}
        />

        {/* HERO COSMIC EXPLOSION BANNER */}
        <div className='relative w-full overflow-hidden group mb-8'>
          <div className='relative aspect-[677/197] w-full'>
            <Image
              src='https://cdn-next-main.tathva.org/images/competitions/cosmic-banner.webp?v=2'
              alt="Tathva '26 Competitions Cosmic Supernova Banner"
              fill
              priority
              sizes='(max-width: 768px) 100vw, 1280px'
              className='object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out'
            />

            <div className='absolute inset-0 bg-gradient-to-t from-[#06070d] via-transparent to-transparent opacity-80' />

            <div className='absolute inset-0 bg-gradient-to-b from-[#06070d]/50 via-transparent to-transparent' />
          </div>
        </div>

        {/* TITLE & DESCRIPTION HEADER SECTION */}
        <section className='mb-6 border-b border-white/50 pb-5'>
          <div className='w-full flex flex-col md:flex-row items-center gap-4'>
            {/* LEFT TITLE */}
            <div className='w-full md:w-[60%]'>
              <h1
                style={{
                  fontFamily: "'Jaro', sans-serif",
                  fontSize: 'clamp(72px, 6vw, 88px)',
                  fontWeight: 400,
                }}
                className='text-white leading-none m-0'
              >
                COMPETITIONS
              </h1>
            </div>

            {/* RIGHT DESCRIPTION */}
            <div className='w-full md:w-[40%] flex items-center'>
              <p className="m-0 max-w-lg break-words text-[clamp(12px,1vw,16px)] leading-normal text-white [font-family:'Jost',sans-serif]">
                <span className='font-semibold'>
                  Get ready to innovate and create
                </span>
                {`. The `}
                <span className='font-semibold'>TATHVA&apos;26</span>
                {` Competitions bring you face-to-face with cutting-edge technologies and industry experts. Dive into interactive, practical sessions, build functional projects from scratch, and earn `}
                <span className='font-semibold'>Activity Points</span>
                {` along with an `}
                <span className='font-semibold'>official Certificate</span>
                {` to elevate your portfolio.`}
              </p>
            </div>
          </div>
        </section>

        {/* WORKSHOP CARDS GRID */}
        <section className='relative w-full'>
          {loading ? (
            <div className='py-20 text-center text-slate-400'>
              <p className='text-lg'>Loading competitions…</p>
            </div>
          ) : error ? (
            <div className='py-20 text-center text-slate-400'>
              <p className='text-lg'>{error}</p>
              <button
                onClick={reload}
                className='mt-3 text-sm text-indigo-400 hover:underline cursor-pointer'
              >
                Try again
              </button>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className='py-20 text-center text-slate-400'>
              <p className='text-lg'>
                {searchQuery.trim()
                  ? 'No competitions found matching your search.'
                  : 'No competitions have been announced yet.'}
              </p>

              {searchQuery.trim() && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                  }}
                  className='mt-3 text-sm text-indigo-400 hover:underline cursor-pointer'
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            (() => {
              /*
               * Split the competitions into four columns.
               *
               * Column 1 → starts at 0px
               * Column 2 → starts at 60px
               * Column 3 → starts at 0px
               * Column 4 → starts at 60px
               *
               * As scrollProgress reaches 1,
               * all columns become aligned.
               */

              const columns = Array.from(
                { length: columnCount },
                (_, columnIndex) =>
                  filteredCompetitions.filter(
                    (_, i) => i % columnCount === columnIndex,
                  ),
              )

              return (
                <div
                  ref={gridRef}
                  id='competition-grid'
                  className='mx-auto grid w-full grid-cols-2 gap-x-[30px] gap-y-[18px] md:grid-cols-3 lg:grid-cols-4'
                  onMouseLeave={handleGridLeave}
                >
                  {columns.map((column, columnIndex) => {
                    const initialOffset = columnIndex % 2 === 0 ? 0 : 180

                    const offset = initialOffset * (1 - scrollProgress)

                    return (
                      <div
                        key={columnIndex}
                        className='flex flex-col gap-[18px]'
                        style={{
                          transform: `translateY(${offset}px)`,
                        }}
                      >
                        {column.map((competition, rowIndex) => (
                          <div
                            key={competition.id}
                            className='relative cursor-pointer'
                            ref={(el) => {
                              if (el) slotRefs.current[competition.id] = el
                              else delete slotRefs.current[competition.id]
                              if (
                                columnIndex === 0 &&
                                rowIndex === column.length - 1 &&
                                lastRowRef
                              ) {
                                lastRowRef.current = el
                              }
                            }}
                            style={{
                              zIndex: 1,
                              background: 'rgba(0, 0, 0, 0.001)',
                              perspective: '1000px',
                              transformOrigin: 'center center',
                              willChange: 'transform',
                            }}
                            onMouseEnter={(e) =>
                              handleCardEnter(competition.id, e, competition)
                            }
                            onMouseMove={(e) =>
                              handleCardMove(competition.id, e)
                            }
                            onMouseLeave={() => handleCardLeave(competition.id)}
                            onClick={(e) =>
                              handleCardClick(
                                e,
                                competition.id,
                                `/competitions/${competition.id}`,
                                competition.image,
                              )
                            }
                          >
                            <div
                              ref={(el) => {
                                if (el) floatRefs.current[competition.id] = el
                                else delete floatRefs.current[competition.id]
                              }}
                              style={{
                                transformStyle: 'preserve-3d',
                                willChange: 'transform',
                              }}
                            >
                              <div
                                ref={(el) => {
                                  if (el) cardRefs.current[competition.id] = el
                                  else delete cardRefs.current[competition.id]
                                }}
                                className='group relative aspect-[0.9] w-full overflow-hidden bg-[#0d101c]'
                                style={{
                                  transformStyle: 'preserve-3d',
                                  transformOrigin: 'center center',
                                  boxShadow: REST_SHADOW,
                                  backgroundColor: REST_EDGE_BG,
                                  containerType: 'inline-size',
                                  willChange:
                                    'transform, box-shadow, background-color',
                                }}
                              >
                                <div
                                  ref={(el) => {
                                    if (el)
                                      frontFaceRefs.current[competition.id] = el
                                    else
                                      delete frontFaceRefs.current[
                                        competition.id
                                      ]
                                  }}
                                  className='relative flex flex-col justify-between'
                                  style={{
                                    width: 'calc(100% - 3px)',
                                    height: 'calc(100% - 5px)',
                                    transformStyle: 'preserve-3d',
                                    borderTop: `1px solid ${REST_EDGE_HIGHLIGHT_TOP}`,
                                    borderLeft: `1px solid ${REST_EDGE_HIGHLIGHT_LEFT}`,
                                  }}
                                >
                                  {/* Step 9 — digital activation pixelated overlay */}
                                  <div
                                    ref={(el) => {
                                      if (el)
                                        activationOverlayRefs.current[
                                          competition.id
                                        ] = el
                                      else
                                        delete activationOverlayRefs.current[
                                          competition.id
                                        ]
                                    }}
                                    className='competition-activation-overlay pointer-events-none absolute inset-0 z-10'
                                  />

                                  {/* Step 10 — continuous digital pulse overlay */}
                                  <div
                                    ref={(el) => {
                                      if (el)
                                        pulseOverlayRefs.current[
                                          competition.id
                                        ] = el
                                      else
                                        delete pulseOverlayRefs.current[
                                          competition.id
                                        ]
                                    }}
                                    className='competition-pulse-overlay pointer-events-none absolute inset-0 z-10'
                                  />

                                  {/* ORIGINAL CARD SHAPE — kept at its original
                                      proportions so the mask, cutout and border
                                      artwork are not stretched */}
                                  <div className='absolute inset-x-0 top-0 aspect-[0.9825]'>
                                    {/* CARD VISUAL ARTWORK — the real event picture, shown directly.
                                        The description now lives in the hover callout. */}
                                    <div
                                      ref={(el) => {
                                        if (el) artRefs.current[competition.id] = el
                                        else delete artRefs.current[competition.id]
                                      }}
                                      className='absolute inset-[0_0.15%_1.61%_0] overflow-hidden bg-slate-900'
                                      style={{
                                        maskImage:
                                          "url('https://cdn-next-main.tathva.org/images/competitions/competition-card-image.png')",
                                        WebkitMaskImage:
                                          "url('https://cdn-next-main.tathva.org/images/competitions/competition-card-image.png')",
                                        maskPosition: 'center',
                                        WebkitMaskPosition: 'center',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskSize: '100% 100%',
                                        WebkitMaskSize: '100% 100%',
                                      }}
                                    >
                                      <Image
                                        src={competition.image}
                                        alt={competition.fullTitle}
                                        fill
                                        sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                                        className='object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105'
                                      />
                                    </div>

                                    {/* BACKGROUND CUTOUT OUTSIDE THE BORDER */}
                                    <div
                                      className='pointer-events-none absolute inset-0 z-15 bg-[#06070d]'
                                      style={{
                                        clipPath:
                                          'polygon(32.18% 90.64%, 100% 90.64%, 100% 100%, 23.29% 100%, 24.64% 99%)',
                                      }}
                                    />

                                    <div className='pointer-events-none absolute inset-[0_0.15%_1.61%_0] z-30'>
                                      <img
                                        src='https://cdn-next-main.tathva.org/images/competitions/competition-card-border.svg'
                                        alt=''
                                        className='absolute inset-[-0.38%] h-full w-full'
                                      />
                                    </div>
                                  </div>

                                  {/* EXTRA LABEL SPACE — continues the cutout
                                      colour below the original card shape so the
                                      title has room to wrap onto two lines */}
                                  <div
                                    className='pointer-events-none absolute inset-x-0 bottom-0 z-15 bg-[#06070d]'
                                    style={{ top: 'calc(100cqw / 0.9825)' }}
                                  />

                                  {/* TITLE — max 2 lines. Line 1 sits beside the
                                      notch, line 2 starts at the card's left edge */}
                                  <div
                                    className='absolute left-0 right-0 z-20 text-right'
                                    style={{
                                      top: 'calc(100cqw / 0.9825 * 0.9064 + 2.5cqw)',
                                      paddingLeft: '1cqw',
                                      paddingRight: '4cqw',
                                      maxHeight: '13.2cqw',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {/* PRICE — sits in the notch cut out of the
                                        card's bottom-left corner. Same float
                                        footprint the old invisible spacer used,
                                        so the title still wraps around it. */}
                                    <span
                                      className='m-0 block text-left text-[4.4cqw] font-bold leading-[1.1] text-white'
                                      style={{
                                        float: 'left',
                                        width: '33cqw',
                                        height: '6.6cqw',
                                      }}
                                    >
                                      {competition.fee}
                                    </span>
                                    <p className='m-0 break-words text-[5.5cqw] font-bold leading-[1.2] text-white'>
                                      {competition.fullTitle || competition.title}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            })()
          )}
        </section>

        {/* GSAP OVERLAYS AND PORTALS */}
        {mounted &&
          createPortal(
            <div
              ref={calloutOverlayRef}
              style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 9999,
                overflow: 'hidden',
              }}
              aria-hidden='true'
            >
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                <path
                  ref={calloutPathRef}
                  fill='none'
                  stroke='rgba(255,255,255,0.5)'
                  strokeWidth='1'
                  strokeLinecap='butt'
                  strokeLinejoin='miter'
                  style={{ opacity: 0 }}
                />
              </svg>

              <div
                ref={calloutLabelRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${CALLOUT_LABEL_WIDTH}px`,
                  opacity: 0,
                  textAlign: calloutSide === 'left' ? 'right' : 'left',
                  willChange: 'transform, opacity',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-24px -32px',
                    background:
                      'radial-gradient(ellipse at center, rgba(6, 7, 12, 0.32) 0%, rgba(6, 7, 12, 0.16) 48%, rgba(6, 7, 12, 0) 78%)',
                    pointerEvents: 'none',
                    zIndex: -1,
                    borderRadius: '9999px',
                  }}
                  aria-hidden='true'
                />

                {calloutCompetition && (
                  <>
                    <div
                      ref={calloutTitleRef}
                      style={{
                        fontSize: '1.18rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        lineHeight: 1.25,
                        textShadow:
                          '0 1px 3px rgba(0,0,0,0.98), 0 2px 10px rgba(0,0,0,0.9)',
                      }}
                    />
                    <div
                      ref={calloutMetaRef}
                      style={{
                        marginTop: '8px',
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: '0.72rem',
                        letterSpacing: '0.04em',
                        color: 'rgba(255,255,255,0.72)',
                        lineHeight: 1.45,
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      }}
                    />
                    <div
                      style={{
                        marginTop: '12px',
                        marginBottom: '12px',
                        width: '32px',
                        height: '1px',
                        background: 'rgba(255,255,255,0.32)',
                        marginLeft: calloutSide === 'left' ? 'auto' : 0,
                      }}
                    />
                    <div
                      ref={calloutDescRef}
                      style={{
                        fontSize: '1.04rem',
                        fontWeight: 450,
                        letterSpacing: '0.012em',
                        color: 'rgba(255,255,255,0.95)',
                        lineHeight: 1.54,
                        textShadow:
                          '0 1px 3px rgba(0,0,0,0.98), 0 2px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7)',
                      }}
                    />
                    <div
                      ref={calloutPriceRef}
                      style={{
                        marginTop: '16px',
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: '0.96rem',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        color: '#ffffff',
                        textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                      }}
                    />
                  </>
                )}
              </div>
            </div>,
            document.body,
          )}

        {/* Click-zoom transition layer */}
        {mounted &&
          activeTransition &&
          createPortal(
            <div
              ref={transitionOverlayRef}
              style={{
                position: 'fixed',
                left: `${activeTransition.rect.left}px`,
                top: `${activeTransition.rect.top}px`,
                width: `${activeTransition.rect.width}px`,
                height: `${activeTransition.rect.height}px`,
                zIndex: 99999,
                overflow: 'hidden',
                borderRadius: '6px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                pointerEvents: 'none',
                willChange: 'left, top, width, height, border-radius',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={transitionImgRef}
                src={activeTransition.displayImage}
                alt=''
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
              />
            </div>,
            document.body,
          )}
      </main>

      {/* GSAP SPECIFIC CSS */}
      <style jsx global>{`
        .competition-focus-overlay {
          background: ${FOCUS_OVERLAY_COLOR};
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-image: radial-gradient(
            circle at calc(var(--focus-x, 0) * 1px) calc(var(--focus-y, 0) * 1px),
            transparent 0px,
            transparent calc(var(--focus-hole, 0) * 1px),
            black calc(var(--focus-hole, 0) * 1px + ${FOCUS_MASK_EDGE}px),
            black calc(var(--focus-reveal, 0) * 1px),
            transparent calc(var(--focus-reveal, 0) * 1px + ${FOCUS_MASK_EDGE}px),
            transparent 100%
          );
          mask-image: radial-gradient(
            circle at calc(var(--focus-x, 0) * 1px) calc(var(--focus-y, 0) * 1px),
            transparent 0px,
            transparent calc(var(--focus-hole, 0) * 1px),
            black calc(var(--focus-hole, 0) * 1px + ${FOCUS_MASK_EDGE}px),
            black calc(var(--focus-reveal, 0) * 1px),
            transparent calc(var(--focus-reveal, 0) * 1px + ${FOCUS_MASK_EDGE}px),
            transparent 100%
          );
        }

        .competition-pulse-overlay {
          overflow: hidden;
          opacity: 0;
          border-radius: inherit;
          background: radial-gradient(
            circle at
              calc(var(--pulse-x, 50) * 1%)
              calc(var(--pulse-y, 50) * 1%),
            rgba(255, 255, 255, var(--pulse-alpha, 0)) 0%,
            rgba(255, 255, 255, 0)
              calc(var(--pulse-radius, 0) * 1%)
          );
        }

        .competition-activation-overlay {
          overflow: hidden;
          opacity: 0;
          border-radius: inherit;
        }

        .competition-activation-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at var(--activation-x, 50%) var(--activation-y, 50%),
            transparent calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}% - ${ACTIVATION_RING_BAND}%),
            rgba(255, 255, 255, ${ACTIVATION_GLOW_ALPHA}) calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}%),
            transparent calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}% + ${ACTIVATION_RING_BAND}%)
          );
          mix-blend-mode: screen;
        }

        .competition-activation-overlay::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.9) 0px,
              rgba(255, 255, 255, 0.9) 1px,
              transparent 1px,
              transparent ${ACTIVATION_GRID_CELL}px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.9) 0px,
              rgba(255, 255, 255, 0.9) 1px,
              transparent 1px,
              transparent ${ACTIVATION_GRID_CELL}px
            );
          opacity: ${ACTIVATION_GRID_ALPHA};
          mix-blend-mode: overlay;
          -webkit-mask-image: radial-gradient(
            circle at var(--activation-x, 50%) var(--activation-y, 50%),
            transparent calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}% - ${ACTIVATION_GRID_BAND}%),
            black calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}%),
            transparent calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}% + ${ACTIVATION_GRID_BAND}%)
          );
          mask-image: radial-gradient(
            circle at var(--activation-x, 50%) var(--activation-y, 50%),
            transparent calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}% - ${ACTIVATION_GRID_BAND}%),
            black calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}%),
            transparent calc(var(--activation-progress, 0) * ${ACTIVATION_RING_SPREAD}% + ${ACTIVATION_GRID_BAND}%)
          );
        }
      `}</style>

    </div>
  )
}
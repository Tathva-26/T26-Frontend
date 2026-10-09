'use client'
import React from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const background = 'https://cdn-next-main.tathva.org/images/techconclave/background.webp'
const person1 = 'https://cdn-next-main.tathva.org/images/techconclave/person2.webp'
const person2 = 'https://cdn-next-main.tathva.org/images/techconclave/person1.webp'
const robot = 'https://cdn-next-main.tathva.org/images/techconclave/robot.webp'
const logo = 'https://cdn-next-main.tathva.org/images/techconclave/logo.png'
const ted='https://cdn-next-main.tathva.org/images/techconclave/tedx.png'
/*
  ── HOW THIS FILE IS ORGANISED ───────────────────────────────────────────
  DesktopPoster  → your existing, pixel-tuned layout for 1280×800 / 1440×900.
                   Untouched. Shown only at widths >= 1025px.
  MobilePoster   → a new layout for phones (< 640px). It reflows the same
                   images/text into a flex-wrap stack.
  TabletPoster   → layout for 640px – 1024px.
  All are rendered; CSS `display` (via matching media queries) shows only
  one at a time, so there's no layout-shift/hydration flicker.

  SPEAKER CARDS — every speaker tile (all three layouts) is a `.tc-card`:
    • hover/focus lift   → scale(1.05) translateY(-8px) + purple glow
    • inner image zoom   → image scales to 1.1 inside the clipped card
    • cursor spotlight   → radial gradient driven by --mx / --my
    • accent ring        → 1.5px #7c3aed border fades in
    • floating badge     → slides/fades in at the bottom-left corner
  ──────────────────────────────────────────────────────────────────────── */

const FW = 1413
const FH = 753
const W = 1550
const H = Math.round(W * (FH / FW))

const fbox = (x, y, w, h) => ({
  left: `${(x / FW) * 100}%`,
  top: `${(y / FH) * 100}%`,
  width: `${(w / FW) * 100}%`,
  height: `${(h / FH) * 100}%`,
})
const box = (x, y, w, h) => ({
  left: `${(x / FW) * 100}%`,
  top: `${(y / FH) * 100}%`,
  width: `${(w / FW) * 100}%`,
  height: `${(h / FH) * 100}%`,
})

/* Only 2 speakers now (both purple), STACKED VERTICALLY: one card on top,
   the other directly below it, same size, same column. The photo box is
   taller than its black shape so the head pops out above the shape.
   Tweak the numbers here to resize / move the pair on desktop. */
const womanTiles = [
  { color: '#000000', shape: [760, 60, 210, 240], img: [760, 20, 210, 280] },
]

const manTiles = [
  { color: '#000000', shape: [760, 350, 210, 240], img: [760, 310, 210, 280] },
]

const deskSpeakers = [
  { tile: womanTiles[0], src: person1, glow: 'purple', col: 'tc-col-left' },
  { tile: manTiles[0], src: person2, glow: 'purple', col: 'tc-col-right' },
]

/* used by both the mobile and tablet grids (now just 2, stacked) */
const gridSpeakers = [
  { ...womanTiles[0], img: person1, glow: 'purple' },
  { ...manTiles[0], img: person2, glow: 'purple' },
]

const Plus = ({ style, rotate = 0 }) => (
  <svg
    className='tc-abs tc-deco'
    style={{ ...style, transform: `rotate(${rotate}deg)` }}
    viewBox='0 0 10 10'
    aria-hidden='true'
  >
    <path d='M3.5 0h3v3.5H10v3H6.5V10h-3V6.5H0v-3h3.5z' fill='#7c3aed' />
  </svg>
)

/* ───────────────────────── FLOAT ON VIEW HOOK ─────────────────────────
   Adds data-floating="true" on <main> while the poster is on screen.
   CSS uses that to run the floating animation on the speaker cards. */
function useFloatOnView(ref) {
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        el.dataset.floating = entry.isIntersecting ? 'true' : 'false'
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
}

function usePosterRef() {
  const ref = React.useRef(null)
  useFloatOnView(ref)
  return ref
}

/* One shared clock drives every card's float, so they always move together.
   Same motion as the old tc-float: 5s period, 10px travel. On hover/tap/focus
   a card's float eases out to 0 (steady lift) and eases back in afterwards. */
function useSyncedFloat() {
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined

    const PERIOD = 5 // seconds
    const AMP = 10 // px

    const tick = () => {
      const t = performance.now() / 1000
      const y = -(AMP / 2) * (1 - Math.cos((2 * Math.PI * t) / PERIOD))
      const k = 1 - Math.pow(1 - 0.12, gsap.ticker.deltaRatio(60))

      document.querySelectorAll('.tc-card').forEach((el) => {
        if (!el.closest('[data-floating="true"]')) {
          el.style.translate = ''
          return
        }
        let hovered = el.classList.contains('tc-active')
        try {
          hovered = hovered || el.matches(':focus-visible')
        } catch (_) {}
        const w = el._fw ?? 1
        const nw = w + ((hovered ? 0 : 1) - w) * k
        el._fw = nw
        el.style.translate = `0 ${(y * nw).toFixed(2)}px`
      })
    }

    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      document.querySelectorAll('.tc-card').forEach((el) => {
        el.style.translate = ''
      })
    }
  }, [])
}

function useIntroAnimation(ref) {
  React.useLayoutEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined
    const scroller = root.closest('.main-scroll')

    const context = gsap.context(() => {
      const title = root.querySelectorAll('.tc-animate-title')
      const cards = root.querySelectorAll('.tc-animate-card')
      const meta = root.querySelectorAll('.tc-animate-meta')
      const robot = root.querySelector('.tc-animate-robot')
      const logo = root.querySelector('.tc-animate-logo')

      gsap.set([...title, ...cards, ...meta, logo].filter(Boolean), {
        autoAlpha: 0,
      })
      gsap.set(title, { x: -32 })
      gsap.set(cards, { y: 18 })
      gsap.set(meta, { y: 12 })
      if (logo) gsap.set(logo, { scale: 0.86, transformOrigin: 'center' })

      const reveal = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: root,
          scroller,
          start: 'top 78%',
          once: true,
        },
      })

      reveal
        .to(title, { autoAlpha: 1, x: 0, duration: 0.65, stagger: 0.08 })
        .to(
          cards,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.06,
            // An inline transform left behind by the intro would beat the
            // stylesheet's hover lift (.tc-card.tc-active), so cards never rose.
            clearProps: 'transform',
          },
          '-=0.25',
        )
        .to(meta, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.2')
        .to(logo, { autoAlpha: 1, scale: 1, duration: 0.55 }, '-=0.3')

      if (robot) {
        gsap.to(robot, {
          yPercent: -2.5,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            scroller,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        })
      }
    }, root)

    return () => context.revert()
  }, [ref])
}

/* ───────────────────────── SPEAKER CALLOUT ─────────────────────────────
   Ported from the Workshops page "annotation callout": a leader line draws
   out of the hovered card and a label decodes (scramble → text) with the
   speaker's name, role and description.

   • Mouse / pen (laptop, desktop, tablet with a mouse)
       hover or keyboard-focus a card → line + label.
   • Touch (phones, tablets)
       tap a card → the SAME leader-line + decoding label animation plays
       (identical to the laptop hover). Tap the card again, tap elsewhere,
       or press Escape to close.

   In both cases the label width shrinks to the space available beside the
   card. Only if there is genuinely no room on either side does it fall back
   to the bottom sheet.

   The card's lift / glow / zoom is driven by the `tc-active` class (set on
   mouse hover and on touch tap, cleared when the callout closes) instead of
   CSS :hover, so touch devices don't get a "stuck" hover state.

   One overlay, portalled to <body>, shared by the desktop, mobile and tablet
   posters. It never re-renders React: everything is driven by refs + GSAP,
   so it can't disturb the poster's own layout or animations.
   ──────────────────────────────────────────────────────────────────────── */

/* ── EDIT THESE: one entry per speaker card, in card order (index 0-1).
      `side` is the preferred side for the leader line on roomy screens. ── */
const SPEAKERS = [
  {
    name: 'Joseph Annamkutty Jose',
    role: '9 October — Beyond the Noise · Entry: 2:30 PM · Show: 3:00–4:30 PM · Aryabhatta Hall',
    bio: 'Join us for an engaging talk show with Joseph Annamkutty Jose, renowned storyteller and writer. The session will feature an interactive segment, giving the audience an opportunity to connect and engage with him.',
    side: 'left',
  },
  {
    name: 'Mahadevan A.R.',
    role: '10 October — Laugh Out Loud (LOL!!) · Entry: 2:30 PM · Show: 3:00–4:00 PM · Aryabhatta Hall',
    bio: 'Get ready for an evening of laughter with Mahadevan A.R. and his Malayalam stand-up comedy show. Stay tuned for more updates and surprises from TechConclave \'26!',
    side: 'right',
  },
]

// Geometry
const CALLOUT_MAX_WIDTH = 280
const CALLOUT_MIN_WIDTH = 170
const CALLOUT_MIN_WIDTH_TOUCH = 120 // phones have less room beside a card
const CALLOUT_GAP = 34 // card edge → label near edge
const CALLOUT_STUB = 16 // short first leader segment
const CALLOUT_MARGIN = 16 // viewport margin
const CALLOUT_ANCHOR_Y = 26 // where the line meets the label (title line)
const CALLOUT_LABEL_LAG = 0.06 // smoothing while following a moving card
const SHEET_MAX_WIDTH = 420
const SHEET_BOTTOM_OFFSET = 14
// Motion
const CALLOUT_FADE_IN = 0.18
const CALLOUT_EXIT_DURATION = 0.4
const LINE_DRAW_DURATION = 0.45
const LINE_DRAW_EASE = 'power2.out'
const TITLE_START = 0.2
const TITLE_DECODE = 0.4
const ROLE_START = 0.4
const ROLE_DECODE = 0.4
const DESC_START = 0.55
const DESC_DECODE = 0.55
const SCRAMBLE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-+=<>/\\|[]{}'

/* ── decode helpers (same technique as the workshop callout) ── */
const randomScrambleChar = () =>
  SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]

const buildDecodeThresholds = (length) => {
  const t = new Array(length)
  for (let i = 0; i < length; i++) {
    const base = length > 1 ? i / (length - 1) : 0
    t[i] = Math.min(base * 0.75 + Math.random() * 0.25, 1)
  }
  return t
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
    out += ch === ' ' || progress >= thresholds[i] ? ch : randomScrambleChar()
  }
  el.textContent = out
}

const SpeakerCalloutContext = React.createContext(null)

/* Cards call this; outside a provider it is a harmless no-op. */
function useSpeakerCallout() {
  const ctx = React.useContext(SpeakerCalloutContext)
  return ctx || { bind: () => ({}) }
}

function SpeakerCalloutProvider({ children }) {
  const [mounted, setMounted] = React.useState(false)

  const pathRef = React.useRef(null)
  const labelRef = React.useRef(null)
  const titleRef = React.useRef(null)
  const roleRef = React.useRef(null)
  const descRef = React.useRef(null)

  const st = React.useRef({
    el: null,
    index: null,
    mode: 'line', // 'line' | 'sheet'
    side: 'right',
    width: CALLOUT_MAX_WIDTH,
    height: 120,
    visible: false,
    animating: false,
    tl: null,
    lastPointerType: 'mouse',
  })

  React.useEffect(() => {
    // One-time hydration guard so client-only UI renders after mount, not
    // a cascade — this effect only ever runs once, on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const api = React.useMemo(() => {
    const s = st.current

    /* `tc-active` = the card is "hovered" (mouse) or "tapped" (touch).
       The CSS lift / glow / zoom reads this class, not :hover. */
    let activeEl = null
    const setActive = (el) => {
      if (activeEl && activeEl !== el) activeEl.classList.remove('tc-active')
      activeEl = el
      if (el) el.classList.add('tc-active')
    }
    const clearActive = (el) => {
      if (!activeEl || (el && activeEl !== el)) return
      activeEl.classList.remove('tc-active')
      activeEl = null
    }

    const reducedMotion = () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* decide line vs bottom sheet for this card.
       Touch uses the same leader-line animation as mouse hover; it just
       accepts a narrower label (CALLOUT_MIN_WIDTH_TOUCH) because phones have
       less room beside a card. The sheet is only a last-resort fallback. */
    const pickMode = (el, pointerType, preferred) => {
      const minWidth =
        pointerType === 'touch' ? CALLOUT_MIN_WIDTH_TOUCH : CALLOUT_MIN_WIDTH
      const rect = el.getBoundingClientRect()
      const chrome = CALLOUT_GAP + CALLOUT_STUB + CALLOUT_MARGIN
      const spaceFor = (side) =>
        side === 'right'
          ? window.innerWidth - rect.right - chrome
          : rect.left - chrome
      const order = preferred === 'left' ? ['left', 'right'] : ['right', 'left']
      for (const side of order) {
        const space = spaceFor(side)
        if (space >= minWidth) {
          return {
            mode: 'line',
            side,
            width: Math.min(CALLOUT_MAX_WIDTH, space),
          }
        }
      }
      return { mode: 'sheet' }
    }

    const lineGeometry = (rect) => {
      const { side, width, height } = s
      const cy = rect.top + rect.height / 2
      const anchor = {
        x: side === 'right' ? rect.right : rect.left,
        y: cy,
      }
      const labelX =
        side === 'right'
          ? rect.right + CALLOUT_GAP
          : rect.left - CALLOUT_GAP - width
      const labelY = Math.min(
        Math.max(cy - height / 2, CALLOUT_MARGIN),
        Math.max(window.innerHeight - height - CALLOUT_MARGIN, CALLOUT_MARGIN),
      )
      return { anchor, labelX, labelY }
    }

    const buildPath = (anchor, labelX, labelY) => {
      const { side, width } = s
      const stubX =
        side === 'right' ? anchor.x + CALLOUT_STUB : anchor.x - CALLOUT_STUB
      const endX = side === 'right' ? labelX : labelX + width
      const endY = labelY + CALLOUT_ANCHOR_Y
      return `M ${anchor.x} ${anchor.y} L ${stubX} ${anchor.y} L ${stubX} ${endY} L ${endX} ${endY}`
    }

    const sheetPosition = () => ({
      x: (window.innerWidth - s.width) / 2,
      y: window.innerHeight - s.height - SHEET_BOTTOM_OFFSET,
    })

    function tick() {
      if (!s.visible || s.mode !== 'line' || !s.el) return
      const pathEl = pathRef.current
      const labelEl = labelRef.current
      if (!pathEl || !labelEl) return

      const rect = s.el.getBoundingClientRect()
      // card hidden (breakpoint switched) or unmounted → close
      if (!s.el.isConnected || rect.width === 0 || rect.height === 0) {
        hide()
        return
      }

      const g = lineGeometry(rect)
      const f = 1 - Math.pow(1 - CALLOUT_LABEL_LAG, gsap.ticker.deltaRatio(60))
      const curX = gsap.getProperty(labelEl, 'x') || 0
      const curY = gsap.getProperty(labelEl, 'y') || 0
      const nx = curX + (g.labelX - curX) * f
      const ny = curY + (g.labelY - curY) * f
      gsap.set(labelEl, { x: nx, y: ny })
      pathEl.setAttribute('d', buildPath(g.anchor, nx, ny))
    }

    const hardReset = () => {
      if (s.tl) {
        s.tl.kill()
        s.tl = null
      }
      s.animating = false
      s.visible = false
      gsap.ticker.remove(tick)
      if (labelRef.current) {
        gsap.killTweensOf(labelRef.current)
        gsap.set(labelRef.current, { opacity: 0 })
      }
      if (pathRef.current) {
        gsap.killTweensOf(pathRef.current)
        gsap.set(pathRef.current, { opacity: 0 })
      }
    }

    function hide(index) {
      if (index === undefined) clearActive()
      if (index !== undefined && s.index !== index) return
      if (!s.visible) return
      if (s.tl) {
        s.tl.kill()
        s.tl = null
      }
      s.animating = false
      s.visible = false
      s.index = null
      gsap.ticker.remove(tick)

      if (labelRef.current) {
        gsap.killTweensOf(labelRef.current)
        gsap.to(labelRef.current, {
          opacity: 0,
          duration: CALLOUT_EXIT_DURATION,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
      if (pathRef.current) {
        gsap.killTweensOf(pathRef.current)
        gsap.to(pathRef.current, {
          opacity: 0,
          duration: CALLOUT_EXIT_DURATION,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
    }

    function show(index, el, pointerType) {
      const data = SPEAKERS[index]
      const labelEl = labelRef.current
      const pathEl = pathRef.current
      if (!data || !el || !labelEl || !pathEl) return

      hardReset()

      const picked = pickMode(el, pointerType, data.side)
      s.el = el
      s.index = index
      s.mode = picked.mode

      const sheet = picked.mode === 'sheet'
      if (sheet) {
        s.width = Math.min(
          SHEET_MAX_WIDTH,
          window.innerWidth - CALLOUT_MARGIN * 2,
        )
      } else {
        s.side = picked.side
        s.width = picked.width
      }

      const title = String(data.name ?? '').toUpperCase()
      const role = String(data.role ?? '')
      const desc = String(data.bio ?? '')

      /* measure the final text first so the label is positioned with its
         real height, then blank it for the decode */
      gsap.set(labelEl, { width: s.width })
      titleRef.current.textContent = title
      roleRef.current.textContent = role
      descRef.current.textContent = desc
      roleRef.current.style.display = role ? 'block' : 'none'
      s.height = labelEl.offsetHeight || 120
      titleRef.current.textContent = ''
      roleRef.current.textContent = ''
      descRef.current.textContent = ''

      labelEl.style.background = sheet
        ? 'rgba(10, 10, 20, 0.92)'
        : 'rgba(8, 8, 16, 0.74)'

      const still = reducedMotion()

      if (sheet) {
        const p = sheetPosition()
        gsap.set(labelEl, { x: p.x, y: p.y, opacity: 0 })
        gsap.set(pathEl, { opacity: 0 })
      } else {
        const g = lineGeometry(el.getBoundingClientRect())
        gsap.set(labelEl, { x: g.labelX, y: g.labelY, opacity: 0 })
        pathEl.setAttribute('d', buildPath(g.anchor, g.labelX, g.labelY))
        const len = pathEl.getTotalLength()
        gsap.set(pathEl, {
          opacity: 1,
          strokeDasharray: len,
          strokeDashoffset: still ? 0 : len,
        })
        gsap.ticker.add(tick)
      }

      s.visible = true

      if (still) {
        titleRef.current.textContent = title
        roleRef.current.textContent = role
        descRef.current.textContent = desc
        gsap.set(labelEl, { opacity: 1 })
        return
      }

      s.animating = true
      const tl = gsap.timeline({
        onComplete: () => {
          s.animating = false
          if (!sheet && pathRef.current) {
            // drop the dash so the line can follow the moving card freely
            gsap.set(pathRef.current, {
              strokeDasharray: 'none',
              strokeDashoffset: 0,
            })
          }
        },
      })
      s.tl = tl

      tl.to(
        labelEl,
        { opacity: 1, duration: CALLOUT_FADE_IN, ease: 'power1.out' },
        0,
      )
      if (!sheet) {
        tl.to(
          pathEl,
          {
            strokeDashoffset: 0,
            duration: LINE_DRAW_DURATION,
            ease: LINE_DRAW_EASE,
          },
          0,
        )
      }

      const decode = (elRef, text, start, dur) => {
        const thresholds = buildDecodeThresholds(text.length)
        const proxy = { p: 0 }
        tl.to(
          proxy,
          {
            p: 1,
            duration: dur,
            ease: 'none',
            onUpdate: () =>
              renderDecodeText(elRef.current, text, thresholds, proxy.p),
          },
          start,
        )
      }
      decode(titleRef, title, TITLE_START, TITLE_DECODE)
      decode(roleRef, role, ROLE_START, ROLE_DECODE)
      decode(descRef, desc, DESC_START, DESC_DECODE)
    }

    /* props spread onto each speaker card */
    const bind = (index) => ({
      onPointerEnter: (e) => {
        if (e.pointerType === 'touch') return
        setActive(e.currentTarget)
        show(index, e.currentTarget, e.pointerType || 'mouse')
      },
      onPointerLeave: (e) => {
        if (e.pointerType === 'touch') return
        clearActive(e.currentTarget)
        hide(index)
      },
      onPointerDown: (e) => {
        s.lastPointerType = e.pointerType || 'mouse'
      },
      /* Touch is handled on pointerup (not click): the cards are constantly
         floating/lifting, and a `click` can be dropped or retargeted when the
         element moves between press and release. pointerup always fires on the
         card the finger started on, and is not sent after a scroll/pan
         (that becomes pointercancel), so scrolling never opens the callout.
         Tap = same line + decode animation as laptop hover. */
      onPointerUp: (e) => {
        if (e.pointerType !== 'touch') return
        if (s.visible && s.index === index) {
          clearActive(e.currentTarget)
          hide(index)
        } else {
          setActive(e.currentTarget)
          show(index, e.currentTarget, 'touch')
        }
      },
      onClick: () => {
        // touch is fully handled by onPointerUp above; nothing to do here
      },
      onFocus: (e) => {
        // keyboard focus only — a touch tap also focuses, but is handled by onPointerUp
        let kb = false
        try {
          kb = e.currentTarget.matches(':focus-visible')
        } catch (_) {}
        if (kb) show(index, e.currentTarget, 'mouse')
      },
      onBlur: () => hide(index),
    })

    // Document-level dismissers: tap outside, scroll (sheet), resize, Escape
    const onDocPointerDown = (e) => {
      if (!s.visible) return
      if (e.target && e.target.closest && e.target.closest('.tc-card')) return
      hide()
    }
    const onScroll = () => {
      if (s.visible && s.mode === 'sheet') hide()
    }
    const onResize = () => hide()
    const onKey = (e) => {
      if (e.key === 'Escape') hide()
    }

    return {
      bind,
      hide,
      attach() {
        document.addEventListener('pointerdown', onDocPointerDown)
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onResize)
        window.addEventListener('keydown', onKey)
      },
      detach() {
        document.removeEventListener('pointerdown', onDocPointerDown)
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('keydown', onKey)
        clearActive()
        hardReset()
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    api.attach()
    return () => api.detach()
  }, [api])

  return (
    <SpeakerCalloutContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-hidden='true'
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 9999,
              overflow: 'hidden',
            }}
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
                ref={pathRef}
                fill='none'
                stroke='rgba(255,255,255,0.55)'
                strokeWidth='1'
                strokeLinecap='butt'
                strokeLinejoin='miter'
                style={{ opacity: 0 }}
              />
            </svg>

            <div
              ref={labelRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${CALLOUT_MAX_WIDTH}px`,
                boxSizing: 'border-box',
                padding: '14px 16px',
                opacity: 0,
                textAlign: 'left',
                border: '1px solid rgba(124, 58, 237, 0.5)',
                borderRadius: '12px',
                background: 'rgba(8, 8, 16, 0.74)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                willChange: 'transform, opacity',
              }}
            >
              <div
                ref={titleRef}
                style={{
                  fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
                  fontSize: '1.45rem',
                  fontWeight: 400,
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                  lineHeight: 1.15,
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  overflowWrap: 'anywhere',
                }}
              />
              <div
                ref={roleRef}
                style={{
                  marginTop: '6px',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                  color: '#8f9cff',
                  lineHeight: 1.45,
                  overflowWrap: 'anywhere',
                }}
              />
              <div
                style={{
                  margin: '10px 0',
                  width: '32px',
                  height: '1px',
                  background: 'rgba(255,255,255,0.32)',
                }}
              />
              <div
                ref={descRef}
                style={{
                  fontFamily: '"Space Grotesk", system-ui, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  letterSpacing: '0.012em',
                  color: 'rgba(255,255,255,0.94)',
                  lineHeight: 1.5,
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  overflowWrap: 'anywhere',
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </SpeakerCalloutContext.Provider>
  )
}

/* ───────────────────────── SPEAKER CARD HELPERS ───────────────────────── */

/* Writes the pointer position into CSS vars so the spotlight follows the
   cursor. Touches the DOM directly — no React state, no re-renders. */
const trackLight = (e) => {
  // Only execute for mouse/pointer devices, skip touch/mobile interactions
  if (e.pointerType === 'touch') return

  const light = e.currentTarget.querySelector('.tc-card-light')
  const rect = (light || e.currentTarget).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  e.currentTarget.style.setProperty('--light-x', `${x}px`)
  e.currentTarget.style.setProperty('--light-y', `${y}px`)
}

/* Desktop tile: the photo is taller than its black shape so the head pops
   out above it. The card box = photo box; shape / light / ring are placed
   inside it at the shape's exact original position. */
function DeskTile({ tile, src, alt, col, glow, index }) {
  const callout = useSpeakerCallout()
  const [ix, iy, iw, ih] = tile.img
  const [sx, sy, sw, sh] = tile.shape
  const inner = {
    left: `${((sx - ix) / iw) * 100}%`,
    top: `${((sy - iy) / ih) * 100}%`,
    width: `${(sw / iw) * 100}%`,
    height: `${(sh / ih) * 100}%`,
  }

  return (
    <div
      className={`tc-card tc-card--desk tc-animate-card ${col} ${glow === 'red' ? 'tc-card--red' : ''}`}
      style={{ ...box(...tile.img), '--i': index }}
      tabIndex={0}
      onPointerMove={trackLight}
      {...callout.bind(index)}
    >
      <div
        className='tc-card-shape tc-shape'
        style={{ ...inner, background: tile.color }}
      />
      <div className='tc-card-clip'>
        <img className='tc-person tc-card-img' src={src} alt={alt} />
      </div>
      <span className='tc-card-light' style={inner} />
      <span className='tc-card-ring' style={inner} />
    </div>
  )
}

/* ───────────────────────── DESKTOP (unchanged) ───────────────────────── */

function DesktopPoster() {
  const driftRef = usePosterRef()
  useIntroAnimation(driftRef)

  return (
    <main
      ref={driftRef}
      className='tc-page tc-desktop-only'
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})`,
      }}
    >
      <section className='tc-stage' aria-label='Tech Conclave, October 9-10'>
        {/* colour blocks behind the robot */}
        <div
          className='tc-abs tc-deco'
          style={{ ...box(10, 38, 290, 550), background: '#8A38F5C2' }}
        />
        <div
          className='tc-abs tc-deco'
          style={{ ...box(20, 588, 600, 170), background: '#9C03A0BA' }}
        />

        {/* decorations */}
        <Plus style={box(1128, 42, 92, 92)} rotate={20} />
        <p className='tc-eyebrow tc-abs' style={box(40, 770, 600, 40)}>
          TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.
        </p>

        {/* people grid — interactive speaker cards */}
        {deskSpeakers.map((s, i) => (
          <DeskTile
            key={i}
            tile={s.tile}
            src={s.src}
            alt={i === 0 ? 'Speaker' : ''}
            col={s.col}
            glow={s.glow}
            index={i}
          />
        ))}

        {/* stretched display type */}
        <svg
          className='tc-abs tc-type'
          style={{ inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio='none'
          aria-hidden='true'
        >
          <text
            x='335'
            y='140'
            fontSize='135'
            fill='#ffffff'
            textLength='235'
            lengthAdjust='spacingAndGlyphs'
          >
            TECH
          </text>
          <text
            transform='translate(550, 635) rotate(-90)'
            fontSize='270'
            fill='#6d7fff'
            textLength='485'
            lengthAdjust='spacingAndGlyphs'
          >
            CONCLAVE
          </text>
          <text
            x='1170'
            y='820'
            fontSize='180'
            fill='#6d7fff'
            textLength='200'
            lengthAdjust='spacingAndGlyphs'
          >
            OCT
          </text>
          <text
            x='1400'
            y='800'
            fontSize='90'
            fill='#6d7fff'
            textLength='150'
            lengthAdjust='spacingAndGlyphs'
          >
            9-10
          </text>
        </svg>

        {/* robot */}
        <img
          className='tc-abs-robot robot-img tc-deco tc-animate-robot'
          style={box(-270, -70, 970, 950)}
          src={robot}
          alt='Waving robot'
        />
      {/* <img
  className='tc-ted-d tc-deco tc-animate-meta'
  style={box(492, 400, 180, 180)}
  src={ted}
  alt='TEDx'
/> */}
        {/* right column */}
        <div
          className='tc-abs tc-hero-heading'
          style={box(1080, 230, 510, 450)}
          aria-label='Tech Conclave title'
        >
          <span className='tc-hero-word tc-animate-title'>
            <span className='tc-hero-tech'>TECH</span>
            <span className='tc-hero-conclave'>CONCLAVE</span>
          </span>
        </div>
        <img
          className='tc-abs logo-img tc-deco tc-animate-logo'
          style={box(970, 510, 220, 220)}
          src={logo}
          alt='Tech Conclave'
        />
        <p
          className='tc-abs tc-tagline tc-animate-meta'
          style={box(1112, 328, 420, 170)}
        >
          A space for inspiring
          <br />
          personalities engaging
          <br />
          conversations and
          <br />
          unforgettable experiences
        </p>
      </section>
    </main>
  )
}

/* ─────────────────────── MOBILE (flex-wrap) ────────────────────────
   TECH / CONCLAVE stacked title, the robot + colour-block + people-grid +
   pink block treated as one illustration group, an eyebrow line, the big
   OCT date, then a compact logo lockup + tagline at the bottom.

   The illustration itself is one composited scene, so its pieces are
   placed with percentage coordinates *inside that one scene only*
   (mbox helper, on its own small canvas).
------------------------------------------------------------------------ */

const MW = 424
const MH = 335
const mbox = (x, y, w, h) => ({
  left: `${(x / MW) * 100}%`,
  top: `${(y / MH) * 100}%`,
  width: `${(w / MW) * 100}%`,
  height: `${(h / MH) * 100}%`,
})

function MobilePoster() {
  const driftRef = usePosterRef()
  useIntroAnimation(driftRef)
  const callout = useSpeakerCallout()

  return (
    <main
      ref={driftRef}
      className='tc-page tc-mobile-only'
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})`,
      }}
    >
      <section className='tc-m-stage' aria-label='Tech Conclave, October 9-10'>
        {/* ── visual group: title + illustration + eyebrow ── */}
        <div className='tc-m-panel tc-m-panel--visual'>
          <div className='tc-m-titlewrap'>
           <h1 className='tc-m-title tc-animate-title'>
  <span className='tc-m-tech'>TECH</span>
  <span className='tc-m-conclave-row'>
    <span className='tc-m-conclave'>CONCLAVE</span>
  </span>
</h1>
          </div>

          <div className='tc-m-hero'>
            <div
              className='tc-abs tc-deco'
              style={{ ...mbox(30, -7, 130, 280), background: '#8A38F5C2' }}
            />
            <div
              className='tc-abs tc-deco'
              style={{ ...mbox(30, 270, 280, 70), background: '#9C03A0BA' }}
            />

            <div
              className='tc-abs tc-m-people'
              style={mbox(270, -2, 112, 240)}
              role='list'
              aria-label='Speakers'
            >
              {gridSpeakers.map((t, i) => (
                <div
                  className={`tc-m-tile tc-card tc-animate-card ${t.glow === 'red' ? 'tc-card--red' : ''}`}
                  style={{ '--tile-color': t.color, '--i': i }}
                  key={i}
                  role='listitem'
                  tabIndex={0}
                  onPointerMove={trackLight}
                  {...callout.bind(i)}
                >
                  <img
                    className='tc-m-tile-img tc-card-img'
                    src={t.img}
                    alt=''
                  />
                  <span className='tc-card-light' />
                  <span className='tc-card-ring' />
                </div>
              ))}
            </div>

            <img
              className='tc-abs tc-m-robot tc-deco tc-animate-robot'
              style={mbox(-75, 35, 350, 350)}
              src={robot}
              alt='Waving robot'
            />

            {/* TEDx: pinned to the pink block's top-right corner (block =
                x 30–310, y 270–340 on the 424×335 scene). Width is a % of the
                scene, height follows via aspect-ratio, so it scales with it. */}
            {/* <img
              className='tc-m-ted tc-deco'
              style={{ ...mbox(200, 275, 100, 100), height: 'auto' }}
              src={ted}
              alt='TEDx'
            /> */}

          </div>

          <p className='tc-m-eyebrow tc-animate-meta'>
            TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.
          </p>
        </div>

        {/* ── info group: date + logo lockup + tagline ── */}
        <div className='tc-m-panel tc-m-panel--info'>
          <div className='tc-m-date tc-animate-meta'>
            <span className='tc-m-oct'>OCT</span>
            <span className='tc-m-days'>9-10</span>
          </div>

          <div className='tc-m-footer tc-animate-meta'>
            <h2 className='tc-m-subheading'>
              <span className='tc-m-subheading-tech'>tech</span>
              <span className='tc-m-subheading-conclave'>conclave</span>
            </h2>
            <p className='tc-m-tagline'>
              <span>A space for inspiring</span>
              <span>personalities engaging</span>
              <span>conversations and</span>
              <span>unforgettable experiences.</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
/*------------------------------TABLET------------------------------------------------*/
function TabletPlus({ style, rotate = 0 }) {
  return (
    <svg
      className='tc-t-abs tc-t-plus tc-deco'
      style={{ ...style, transform: `rotate(${rotate}deg)` }}
      viewBox='0 0 10 10'
      aria-hidden='true'
    >
      <path d='M3.5 0h3v3.5H10v3H6.5V10h-3V6.5H0v-3h3.5z' fill='#7c3aed' />
    </svg>
  )
}

function TabletPoster() {
  const driftRef = usePosterRef()
  useIntroAnimation(driftRef)
  const callout = useSpeakerCallout()

  return (
    <main
      ref={driftRef}
      className='tc-t-page'
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${background})`,
      }}
    >
      <section className='tc-t-stage' aria-label='Tech Conclave, October 9-10'>
        <div className='tc-t-visual'>
         <h1 className='tc-t-title tc-animate-title'>
  <span className='tc-t-tech'>TECH</span>
  <span className='tc-t-conclave-row'>
    <span className='tc-t-conclave'>CONCLAVE</span>
    {/* <img className='tc-t-ted tc-deco' src={ted} alt='TEDx' /> */}
  </span>
</h1>
          <div className='tc-t-art'>
            <div
              className='tc-t-abs tc-t-block tc-deco'
              style={{ ...mbox(30, -7, 130, 280), background: '#8A38F5C2' }}
            />
            <div
              className='tc-t-abs tc-t-pink-block tc-deco'
              style={{ ...mbox(30, 270, 280, 70), background: '#9C03A0BA' }}
            />
            <div
              className='tc-t-abs tc-t-speakers'
              style={mbox(250, 14, 112, 240)}
              role='list'
              aria-label='Speakers'
            >
              {gridSpeakers.map((speaker, index) => (
                <div
                  className={`tc-t-speaker tc-card tc-animate-card ${speaker.glow === 'red' ? 'tc-card--red' : ''}`}
                  style={{ '--tile-color': speaker.color, '--i': index }}
                  key={index}
                  role='listitem'
                  tabIndex={0}
                  onPointerMove={trackLight}
                  {...callout.bind(index)}
                >
                  <img
                    className='tc-t-speaker-img tc-card-img'
                    src={speaker.img}
                    alt=''
                  />
                  <span className='tc-card-light' />
                  <span className='tc-card-ring' />
                </div>
              ))}
            </div>
            <img
              className='tc-t-abs tc-t-robot tc-deco tc-animate-robot'
              style={mbox(-100, 5, 400, 400)}
              src={robot}
              alt='Waving robot'
            />
          </div>

          <p className='tc-t-eyebrow tc-animate-meta'>
            TALKS . SHOWS . CONVERSATIONS . EXPERIENCES.
          </p>
        </div>

        <div className='tc-t-info'>
          <div className='tc-t-lockup'>
            <h2 className='tc-t-name tc-animate-meta'>
              <span className='tc-t-name-tech'>TECH</span>{' '}
              <span className='tc-t-name-conclave'>CONCLAVE</span>
            </h2>
            <p className='tc-t-description tc-animate-meta'>
              A space for inspiring personalities, engaging conversations, and
              unforgettable experiences.
            </p>
          </div>
          <div className='tc-t-date tc-animate-meta' aria-label='October 9-10'>
            <span className='tc-t-oct'>OCT</span>
            <span className='tc-t-days'>9-10</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function TechConclave() {
  useSyncedFloat()
  return (
    <SpeakerCalloutProvider>
      <style>{css}</style>
      <DesktopPoster />
      <MobilePoster />
      <TabletPoster />
    </SpeakerCalloutProvider>
  )
}

/**
 * Wraps the whole section and snaps it flush into (or fully past) view —
 * same snap mechanism as Robowars' hero: the snap lives on a *scrubbed*
 * timeline's scrollTrigger (not a bare `ScrollTrigger.create()`), which is
 * what actually arms GSAP's scroll-stopped detection reliably — a snap
 * with no scrub attached to it never fired. The timeline itself drives a
 * throwaway object, not anything visual; only the scrub/snap machinery is
 * being reused.
 *
 * Lenis owns `.main-scroll`'s real scrollTop on its own rAF tick, so
 * letting ScrollTrigger's snap tween that value itself would fight Lenis
 * for it every frame. Instead `snapTo` hands the actual move to
 * `lenis.scrollTo()` and returns the *current* value so ScrollTrigger just
 * rests where it is while Lenis eases there — same handoff Robowars uses.
 */
export function TechConclaveSection({ children, className = '' }) {
  const rootRef = React.useRef(null)

  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined
    const scroller = root.closest('.main-scroll')

    const ctx = gsap.context(() => {
      const dummy = { p: 0 }
      gsap.to(dummy, {
        p: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          scroller,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (value, self) => {
              const lenis = window.__lenis
              if (!lenis || lenis.isStopped || lenis.isLocked) return value

              const target = value < 0.5 ? 0 : 1
              if (Math.abs(target - value) < 0.001) return value

              const range = self.end - self.start
              lenis.scrollTo(self.start + range * target, {
                duration: 0.5,
                easing: (t) => 1 - Math.pow(1 - t, 3),
              })
              return value
            },
            duration: { min: 0.2, max: 0.5 },
            ease: 'power2.out',
          },
        },
      })

      // Everything above this section (Hero, Artist, GPC, Wheels, Robowars)
      // pins/resizes itself well after first paint — fonts, images, and
      // each section's own ScrollTrigger all shift this trigger's true
      // start/end position later. Without a refresh once that settles, the
      // snap keeps using whatever (wrong, too-early) offsets it was first
      // measured with, and jumps to a stale position instead of this
      // section's real top/bottom.
      const onSettle = () => ScrollTrigger.refresh()
      window.addEventListener('load', onSettle, { once: true })
      document.fonts?.ready.then(onSettle)
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      {children}
    </div>
  )
}

const css = `
/* Bebas Neue, Space Grotesk, Syne served from globals.css @font-face (R2 CDN) */

html, body { margin: 0; padding: 0; }

.tc-page {
  --tc-scale: 0.82;
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  margin: 0;
  background-color: #101014;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow-x: clip; /* Clips horizontal artwork without creating a nested y scroller */
}

/* toggle desktop vs mobile layout — no JS, no hydration flicker */
.tc-desktop-only { display: grid; }
.tc-mobile-only { display: none; }
@media (max-width: 1024px) {
  .tc-desktop-only { display: none; }
  .tc-mobile-only { display: grid; }
}

/* ============================ DESKTOP ============================ */

.tc-stage {
  position: relative;
  width: calc(min(100vw, 100vh * 1413 / 753) * var(--tc-scale));
  aspect-ratio: 1413 / 753;
  container-type: inline-size;
}

.tc-m-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 424 / 335;
  margin-top: 24px; /* Increase this value (e.g., 30px, 40px) to push the whole group further down */
}

.tc-hero-heading {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 5;
  pointer-events: none;
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif;
}

.tc-hero-word {
  display: inline-flex;
  align-items: baseline;
  gap: 0.03em;
  line-height: 0.9;
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-size: clamp(2.6rem, 7.4cqw, 5.2rem);
}

.tc-hero-tech { display: inline-block; color: #ffffff; font-size: 1em; font-weight: 400; }
.tc-hero-conclave { display: inline-block; color: #6d7fff; font-size: 1em; font-weight: 400; }

.robot-img { transform: translateX(-7.5%) ; transform-origin: left center; }
// .logo-img { transform: scale(1.65) translate(-1%, -3%); transform-origin: right center; z-index: 4; }
.tc-abs-robot { position: absolute; display: block; }
.tc-abs { position: absolute; display: block; object-fit: contain; }
.tc-shape {
  border-top-right-radius: 15%;
  border-top-left-radius: 15%;
  border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%;
  }
.tc-person { object-fit: cover; object-position: center top; border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%; }
.tc-type text { font-family: "Bebas Neue", "Oswald", Impact, sans-serif; }

.tc-tagline {
  margin: 0;
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 400;
  font-size: 1.95cqw;
  line-height: 1.34;
  color: #e9e9f2;
}
.tc-eyebrow {
  margin: 0;
  text-align: left;
  font-family: "Bebas Neue", sans-serif;
  font-weight:800;
  font-size: 2.5cqw;
  color: #6d7fff;
  line-height: 1;
  z-index: 10;
  pointer-events: none;
  /* Removed transform translateY which was causing offset bugs */
}
/* ============================ MOBILE (flex-wrap) ============================ */

.tc-m-stage {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 22px 36px;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;         /* ← stacks on phones, sits side-by-side once there's room */
  align-items: flex-start;
  gap: 28px;
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif;
}

/* each panel takes the full row on a phone */
.tc-m-panel { display: flex; flex-direction: column; gap: 16px; }

.tc-m-panel--visual {
  flex: 3 1 380px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center; /* Center children horizontally */
  width: 100%;
}
.tc-m-panel--info { flex: 1 1 240px; min-width: 220px; }

.tc-m-titlewrap {
  position: relative;
  z-index: 100;
  width: 100%;
  display: flex;
  justify-content: center; /* Horizontally center title block */
  text-align: center;

}

.tc-m-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 0.92;
  letter-spacing: -0.01em;
  width: 100%;
  text-align: center;
}
.tc-m-tech {
  color: #ffffff;
  font-size: clamp(2rem, 8vw, 2.6rem);
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif;
  text-align: left;
  width: 100%;
}
.tc-m-conclave {
 color: #7787ff; /* Matching purple/indigo accent */
  font-family: "Syne", "Druk Wide Bold", "Monument Extended", sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  font-size: clamp(2.2rem, 9.4vw, 3.7rem);
  line-height: 0.86;
  letter-spacing: 0.01em;
  transform: translateX(-6px)!important;
  // transform: scaleY(0.8);
  // transform-origin: left top;
}

.tc-m-globe {
  position: absolute;
  top: -18px;
  right: -8px;
  width: 88px;
  height: 88px;
  opacity: 0.85;
  pointer-events: none;
}

.tc-m-hero {
  position: relative;
  width: 100%;
  aspect-ratio: ${MW} / ${MH};
}

.tc-m-eyebrow {
  margin: 0;
  text-align: left;
  font-family: Bebas Neue;
  /* scales down on very small phones so the line never runs off-screen;
     resolves to the original 17px from ~390px wide upwards */
  font-size: clamp(12px, 4.4vw, 17px);
  white-space: nowrap;
  color: #6d7fff;
  transform: translate(-36px, -3px);
}

.tc-m-date {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: #7787ff;
  // transform: translateX(45px);
    font-weight: 500;

}
.tc-m-oct {
  /* capped by viewport width so OCT + 10-11 fit on ~320px phones;
     identical to the original 7.6rem from ~370px upwards */
  font-size: min(7.6rem, 33vw);
  line-height: 1;
  transform: translateY(-0.2em);
  font-weight: 500;
}
.tc-m-days {
  font-weight: 500;
  font-style: medium;
  font-size: min(4.9rem, 21vw);
   transform: translateY(-0.3em);
}
.tc-m-footer { display: flex; flex-direction: column; gap: 8px; }
.tc-m-logo { height: 22px; width: auto; object-fit: contain; align-self: flex-start; }

.tc-m-subheading {
  margin: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.08em;
  font-family: Bebas Neue;
font-weight: 400;
font-style: Regular;
font-size: 40px;
leading-trim: NONE;
line-height: 100%;
letter-spacing: 0%;
text-align: center;
  font-size: 3.1rem;
  line-height: 1;
  // letter-spacing: 0.08em;
  text-transform: lowercase;
  // transform: translateX(28px);
}

.tc-m-subheading-tech {
  color: #d9d9f2;
}

.tc-m-subheading-conclave {
  color: #7787ff;
}

.tc-m-tagline {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  font-style: medium;
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 500;
  font-size: 17px;
  line-height: 1.35;
  color: #e9e9f2;
  max-width: 29ch;
  // transform: translate(28px, -2px);

}

.tc-m-tagline span {
  display: block;
}
.tc-m-robot {
  object-fit: cover !important; /* or object-fit: fill */
  max-width: none !important;
  max-height: none !important;
}
.tc-abs {
  object-fit: cover !important; /* or object-fit: fill */
  max-width: none !important;
  max-height: none !important;
}

/* the speaker stack: 2 cards, ONE ABOVE THE OTHER (single column) */
.tc-m-people {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  margin-left: 0 !important;
}

.tc-m-tile {
  flex: 0 0 auto;
  width: 100%;
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: visible !important;
}

/* the rounded "body" shape only — sits lower than the tile itself so the
   head has room to pop out above it. This is the layer that owns the
   colour fill and the hover glow (not the tile / not the image). */
.tc-m-tile::before {
  content: "";
  position: absolute;
  top: 26%;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--tile-color);
  border-radius: 15%;
  z-index: 1;
  transition: box-shadow 0.45s var(--tc-ease);
}

.tc-m-tile:is(.tc-active, :focus-visible)::before {
  box-shadow: var(--tc-glow);
}

.tc-m-tile-img {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 122%;
  object-fit: cover;
  object-position: center bottom;
  border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%;
  z-index: 5;
  pointer-events: none;
}

/*-------------------------------TABLETS----------------------------------------------*/
.tc-t-page {
  /* no forced full-screen height: the page is exactly as tall as its content,
     so tall tablets (iPad portrait / Pro) don't get a big empty band */
  min-height: 0;
  width: 100%;
  overflow-x: clip;
  background-color: #101014;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #f2f0ff;
  font-family: "Space Grotesk", sans-serif;
}

.tc-t-stage {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: clamp(20px, 3vw, 40px); /* fixed-range gap (was 4vh, which grew on tall screens) */
  width: 100%;
  min-height: 0;               /* was 100vh */
  margin: 0 auto;
  padding: clamp(28px, 5vw, 56px) clamp(48px, 8vw, 88px) clamp(28px, 5vw, 56px) clamp(64px, 10vw, 110px);
}

.tc-t-visual,
.tc-t-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.tc-t-visual { flex: 0 0 auto; justify-content: center; }
.tc-t-info {
  flex: 0 0 auto;               /* sits right under the art — no stretching into leftover height */
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.tc-t-title {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  line-height: 0.88;
  position: relative;
z-index: 100;
}

.tc-t-tech {
  color: #fff;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(3rem, 9vw, 6rem);
  font-weight: 400;
  transform: translateY(-15px);
}

.tc-t-conclave {
  color: #7787ff;
  font-family: "Syne", sans-serif;
  font-size: clamp(2.6rem, 8vw, 5.4rem);
  font-weight: 800;
  line-height: 0.96;
   transform: translateY(-9px);
}

.tc-t-art {
  position: relative;
  width: 100%;
  margin-top: clamp(12px, 2vw, 24px);
  aspect-ratio: ${MW} / ${MH};
}

.tc-t-abs {
  position: absolute;
  display: block;
  max-width: none;
  max-height: none;
  object-fit: contain;
}

.tc-t-block { border-top-right-radius: 0%; }
.tc-t-pink-block { z-index: 0; }
.tc-t-plus { z-index: 2; }
.tc-t-robot { z-index: 2; }

/* the speaker stack: 2 cards, ONE ABOVE THE OTHER (single column) */
.tc-t-speakers {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  transform: translateX(30px);
}
.tc-t-speaker:is(.tc-active, :focus-visible) {
  z-index: 10;
}

.tc-t-speaker {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: visible !important;
}

/* same "body" shape pattern as mobile: colour + glow live on this lower
   layer, not on the tile itself, so the glow never crosses the forehead */
.tc-t-speaker::before {
  content: "";
  position: absolute;
  top: 26%;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--tile-color);
  border-radius: 15%;
  z-index: 1;
  transition: box-shadow 0.8s var(--tc-ease);
}

.tc-t-speaker:is(.tc-active, :focus-visible)::before {
  box-shadow: var(--tc-glow);
}

.tc-t-speaker-img {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 122%;
  object-fit: cover;
  object-position: center bottom;
  border-bottom-right-radius: 15%;
  border-bottom-left-radius: 15%;
  z-index: 5;
  pointer-events: none;
}

.tc-t-eyebrow {
  margin: 8px 0 0 24px;
  color: #6d7fff;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(25px, 2.4vw, 24px);
  transform: translateX(21px)
}

.tc-t-lockup { flex: 1 1 0; min-width: 0; max-width: 34ch; }
.tc-t-kicker {
  margin: 0 0 12px;
  color: #9C03A0BA;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(14px, 1.5vw, 18px);
}

.tc-t-name {
  margin: 0;
  color: #d9d9f2;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(3.3rem, 6vw, 4.6rem);
  font-weight: 400;
  line-height: 0.95;
  transform:none;
}

  .tc-t-name-tech { color: #ffffff; }
  .tc-t-name-conclave { color: #7787ff; }

.tc-t-description {
  margin: 16px 0 0;
  color: #e9e9f2;
  font-size: clamp(18px, 2.4vw, 24px);
  line-height: 1.45;
  transform:none;
}

.tc-t-date {
  display: flex;
  align-items: baseline;
  gap: clamp(8px, 1.5vw, 16px);
  white-space: nowrap;
  color: #7787ff;
  font-family: "Bebas Neue", sans-serif;
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  transform:none;
}
.tc-t-date { flex: 0 0 auto; }

.tc-t-oct {
  font-size: clamp(6rem, 17vw, 11rem);
  line-height: 0.9;
}

.tc-t-days {
  font-size: clamp(2.8rem, 8vw, 6rem);
  line-height: 0.9;
}

/* ===================== SPEAKER CARDS — floating hover ===================== */

/* decorative layers (robot, stars, colour blocks, display type, logo) sit on
   top of the tiles in places — let the pointer pass through them */
.tc-deco,
.tc-type { pointer-events: none; }

.tc-card {
  --tc-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --tc-accent: #7c3aed;
  --tc-glow: 0 12px 28px rgba(124, 58, 237, 0.45), 0 0 22px rgba(124, 58, 237, 0.3);
  container-type: inline-size;   /* badge text scales with the tile */
  cursor: pointer;
  outline: none;
  border: none;
  -webkit-tap-highlight-color: transparent;
  transform: scale(1) translateY(0);
  transition:
    transform 0.45s var(--tc-ease),
    box-shadow 0.45s var(--tc-ease);
  will-change: transform, translate;
}

/* red glow variant (3 of the 5 speakers) — purple stays the default */
.tc-card--red {
  --tc-glow: 0 12px 28px rgba(239, 68, 68, 0.45), 0 0 22px rgba(239, 68, 68, 0.3);
  --tc-ring: rgba(239, 68, 68, 0.35);
}

/* 1 ─ floating lift + glow */
.tc-card:is(.tc-active, :focus-visible) {
  transform: scale(1.05) translateY(-8px);
  z-index: 6;
}
.tc-card:not(.tc-card--desk):not(.tc-m-tile):not(.tc-t-speaker):is(.tc-active, :focus-visible) {
  box-shadow: var(--tc-glow);
}

/* 3 ─ inner image zoom (card itself stays clipped) */
.tc-card-img {
  transform: scale(1);
  transform-origin: center bottom;
  transition: transform 0.6s var(--tc-ease), filter 0.6s var(--tc-ease);
}
.tc-card:is(.tc-active, :focus-visible) .tc-card-img {
  transform: scale(1.1);
  filter: saturate(1.08) contrast(1.04);
}


.tc-card-img,
.tc-person,
.tc-m-tile-img,
.tc-t-speaker-img {
  position: relative;
  z-index: 10; /* Set higher than other card layers (like background shapes or overlays) */
}

.tc-card-ring {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 14px var(--tc-ring, rgba(124, 58, 237, 0.35));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s var(--tc-ease);
}

.tc-card:is(.tc-active, :focus-visible) .tc-card-ring {
  opacity: 1;
}

/* cursor spotlight: a soft glow that follows the pointer (--light-x/--light-y,
   written by trackLight), over the photo and clipped to the card's shape */
.tc-card-light {
  position: absolute;
  inset: 0;
  z-index: 11; /* above the photo (.tc-card-img is 10) */
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.35s var(--tc-ease);
  background: radial-gradient(
    180px circle at var(--light-x, 50%) var(--light-y, 50%),
    rgba(255, 255, 255, 0.22),
    transparent 70%
  );
}
.tc-card:is(.tc-active, :focus-visible) .tc-card-light {
  opacity: 1;
}

/* on mobile/tablet tiles the ring should trace the lower "body" shape
   (same box as the ::before glow), not the full square, or it would cut
   across the forehead the same way the old glow did */
.tc-m-tile .tc-card-ring,
.tc-t-speaker .tc-card-ring,
.tc-m-tile .tc-card-light,
.tc-t-speaker .tc-card-light {
  top: 26%;
  border-radius: 15%;
}

/* mobile/tablet: the lone 5th speaker sits centred in its own wrapped row */
.tc-m-tile:nth-child(5),
.tc-t-speaker:nth-child(5) {
  margin-left: auto;
  margin-right: auto;
}

/* desktop tile: card = photo box; shape / light / ring sit at the shape spot */
.tc-card--desk { position: absolute; display: block; }
.tc-card-shape {
  position: absolute;
  z-index: 0;
  transition: box-shadow 0.45s var(--tc-ease);
}
.tc-card--desk:is(.tc-active, :focus-visible) .tc-card-shape { box-shadow: var(--tc-glow); }

/* clips the zoom on the sides and (rounded) bottom but leaves headroom on
   top so the head still breaks out of the shape */
.tc-card-clip {
  position: absolute;
  inset: 0;
  z-index: 1;
  clip-path: inset(-20% 0 0 0 round 0 0 15% 15%);
}
.tc-card--desk .tc-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.tc-card--desk ,
.tc-card--desk {
  inset: auto;
  border-radius: 15%;   /* matches .tc-shape */
}

.tc-card--desk:is(.tc-active, :focus-visible) { opacity: 1; }


/* ===================== FLOATING CARDS ===================== */
/* The bob itself is now driven by one shared clock (useSyncedFloat in JS)
   so every card moves in lock-step; it sets the CSS \`translate\` property. */
@keyframes tc-float {
  0%, 100% { translate: 0 0; }
  50%      { translate: 0 -10px; }
}

/* respect reduced-motion: keep glow, ring and badge, drop the movement */
@media (prefers-reduced-motion: reduce) {
  .tc-card,
  .tc-card-img,
  .tc-badge { transition-duration: 0.01ms; }
  .tc-card:is(.tc-active, :focus-visible),
  .tc-card:is(.tc-active, :focus-visible) .tc-card-img,
  .tc-card:is(.tc-active, :focus-visible) .tc-badge { transform: none; }
  .tc-card { animation: none !important; }
}

/* Clean, non-conflicting width ranges */
.tc-desktop-only { display: grid; }
.tc-mobile-only { display: none; }
.tc-t-page { display: none; }

/* Mobile (0px - 639px) */
@media (max-width: 639px) {
  .tc-desktop-only { display: none !important; }
  .tc-mobile-only { display: grid !important; }
  .tc-t-page { display: none !important; }
}
/* Hide pointer light overlay on tablet and mobile viewports */

/* Tablet (640px - 1024px) */
@media (min-width: 640px) and (max-width: 1024px) {
  .tc-desktop-only { display: none !important; }
  .tc-mobile-only { display: none !important; }
  .tc-t-page { display: block !important; }
}


/* Desktop (1025px+) */
@media (min-width: 1025px) {
  .tc-desktop-only { display: grid !important; }
  .tc-mobile-only { display: none !important; }
  .tc-t-page { display: none !important; }
}

@media (width: 1024px) and (height: 768px) {
  .tc-t-eyebrow {
    transform: translate(21px, 20px);
  }
}

/* Phones: height follows the content instead of forcing a full screen,
   so tall phones don't get extra empty background above/below the poster.
   (Placed last so it wins over the shared .tc-page min-height.) */
.tc-page.tc-mobile-only { min-height: 0; }

/* ===================== TEDx LOGO ===================== */
/* desktop: sits to the right of the CONCLAVE word, next to the drone */
.tc-ted-d {
  position: absolute;
  display: block;
  object-fit: contain;
  z-index: 6;
  rotate: -90deg;
}

/* mobile: the row only wraps the CONCLAVE word now (the logo no longer
   lives in the title) */
.tc-m-conclave-row {
  position: relative;
  display: block;
  width: fit-content;
  align-self: center;
   z-index: 20;
}
/* mobile logo: a square box inside .tc-m-hero, pinned to the pink block's
   top-right corner. left/top/width are % of the scene (set inline), height
   comes from aspect-ratio, so it keeps its place at every phone width.
   object-fit keeps the PNG undistorted; rotate matches the desktop logo —
   delete that line if your PNG is already vertical. */
.tc-m-ted {
  position: absolute;
  z-index: 6;
  display: block;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  max-width: none;
}

/* tablet: same idea, with its own tunable values */
.tc-t-conclave-row {
  position: relative;
  display: block;
  width: fit-content;
  align-self: flex-start;
  z-index:20;
}
.tc-t-ted {
  position: absolute;
  z-index:21;
  left: 30%;
  top: 900%;
  height: 70%;
  width: auto;
  margin-left: clamp(4px, 1.2vw, 10px);
  object-fit: contain;
  max-width: none;
  /* match the CONCLAVE text's own translateY(-9px) */
  transform: translateY(200px);
  transform: translateX(75px);

}
.tc-m-tile::before,
.tc-t-speaker::before {
  bottom: -22%;
}

.tc-m-tile .tc-card-ring,
.tc-t-speaker .tc-card-ring {
  bottom: -22%;
}
`
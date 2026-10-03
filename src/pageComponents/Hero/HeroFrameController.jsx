'use client'
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePathname } from 'next/navigation'
import { Hero } from '@/pageComponents/Hero'
import { Frame } from '@/pageComponents/W1/Frame'
import Navbar from '@/pageComponents/Navbar/Navbar'
import { NavbarScope } from '@/pageComponents/Navbar/NavbarContext'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'

// Hero progress at which the portal fills the screen -> Frame takes over.
// (Just under 1.0 so a smoothed wheel scroll that stops a few px short still triggers it.)
const AUTO_ENTER_PROGRESS = 0.995

// Mobile only (see handleFrameScroll / swapTo): Frame reports a raw delta on every touchmove
// tick, which jitters in both directions within a single continuous swipe and can even spike
// right at a hero<->frame handoff (the panel that just became active hasn't re-anchored its own
// touch baseline yet). These tune how much accumulated same-direction movement counts as a real
// swipe, and how long to ignore further transitions after one fires.
const MOBILE_SWIPE_THRESHOLD = 40 // px
const MOBILE_SWIPE_COOLDOWN_MS = 400 // ms
const MOBILE_GESTURE_IDLE_MS = 150 // gap between deltas long enough to treat as a new gesture

// Desktop only: a trackpad flick keeps firing wheel events for a second or more after the portal
// has opened. Frame must not read that tail as a fresh scroll-down, or one big scroll from Hero
// would carry straight through W1 into the next section. Frame ignores downward wheel input until
// the wheel has been quiet for this long, so W1 always gets to be seen and takes its own gesture.
const FRAME_GESTURE_GAP_MS = 140
// ...and never sooner than this after Frame took over, however the wheel reports its events
// (a free-spinning mouse wheel can leave gaps longer than the one above mid-spin).
const FRAME_MIN_DWELL_MS = 500

// Frame -> content. Leaving W1 is a single eased glide down to the first section rather than
// whatever the wheel happened to deliver, and it is locked, so a hard scroll can't carry past it.
const CONTENT_GLIDE_S = 1.2
// The glide stops this far inside the first section, so that section's own scroll logic sees
// the page arrive (at exactly its top edge it isn't "in" it yet).
const CONTENT_GLIDE_INSET_PX = 4
// Touch screens: how long the page has to be still before it counts as at rest, and how far it
// has to have travelled since it last rested for that to count as a direction.
const TOUCH_IDLE_MS = 160
const TOUCH_INTENT_PX = 24
const easeInOut = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// Same breakpoint Hero uses for its mobile layout.
const MOBILE_QUERY = '(max-width: 768px)'
const subscribeMobile = (cb) => {
  const mq = window.matchMedia(MOBILE_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches
// Server snapshot is "desktop" so SSR output matches the first client render (no hydration error);
// on mobile React re-renders right after hydration and drops TathvaMenu.
const getIsMobileServer = () => false

// --- Ready gate: keep a black cover up until the first-view hero images are decoded ---
const HERO_BASE = '/images/hero/'
const READY_TIMEOUT_MS = 1500 // never leave the user on black longer than this

const preloadImage = (src) =>
  new Promise((resolve) => {
    const img = new window.Image()
    img.src = src
    ;(img.decode ? img.decode() : Promise.reject()).then(resolve, resolve)
  })

export default function HeroFrameController({ children }) {
  const pathname = usePathname()
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getIsMobile,
    getIsMobileServer,
  )

  // false until the critical hero images are ready; drives the black cover below
  const [ready, setReady] = useState(false)

  // Page background black while this route is mounted, so nothing white can show at the edges.
  useEffect(() => {
    const prev = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#000'
    return () => {
      document.body.style.backgroundColor = prev
    }
  }, [])

  // Wait only for the images that make up the first view (not videos / fonts), then re-measure
  // once and reveal.
  useEffect(() => {
    if (ready) return undefined
    let cancelled = false

    const CRITICAL = [
      'bg.png',
      'islandv2.png',
      'rockyground.png',
      'girl4.webp',
      isMobile ? 'tathva_mobile.svg' : 'tathva_text.svg',
    ]

    const images = CRITICAL.map((f) => preloadImage(HERO_BASE + f))
    const timeout = new Promise((r) => setTimeout(r, READY_TIMEOUT_MS))

    Promise.race([Promise.all(images), timeout]).then(() => {
      if (cancelled) return
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          window.__lenis?.resize()
          ScrollTrigger.refresh()
          setReady(true)
        }),
      )
    })

    return () => {
      cancelled = true
    }
  }, [isMobile, ready])

  const [section, setSection] = useState('hero') // "hero" | "frame"
  const sectionRef = useRef('hero')
  // Only Hero is ever hidden. Frame is the real, always-painted background: Hero cuts a hole
  // through itself (the portal) and Frame shows through it, so the hand-over is just hiding Hero.
  const [heroVisible, setHeroVisible] = useState(true)
  // latest progress of Hero's portal animation (0..1)
  const heroProgressRef = useRef(0)

  // Once Frame is showing and the user keeps scrolling down, stop intercepting the wheel and
  // let normal page scroll reach `children`. Scrolling back up to the very top re-locks.
  const [unlocked, setUnlocked] = useState(false)
  // `children` are heavy, so they only mount once the user has got as far as Frame
  // (see CONTENT_PREMOUNT_DELAY_MS), or unlocks past it before that.
  const [hasReachedContent, setHasReachedContent] = useState(false)
  // wrapper around `children`, observed so ScrollTrigger can re-measure when content settles
  const contentRef = useRef(null)
  // Mobile swipe debounce state (see constants above). Unused on desktop.
  const mobileCooldownUntilRef = useRef(0)
  const mobileTouchAccumRef = useRef(0)
  const mobileTouchDirRef = useRef(0)
  const mobileTouchLastAtRef = useRef(0)
  // Desktop Frame wheel gate (see FRAME_GESTURE_GAP_MS). Closed whenever Frame has just taken over.
  const frameGateClosedRef = useRef(false)
  const frameLastWheelAtRef = useRef(0)
  const frameEnteredAtRef = useRef(0)

  useEffect(() => {
    sectionRef.current = section
  }, [section])

  // Hero <-> Frame. Frame is already painted underneath and the open portal looks exactly like
  // it, so the swap is just showing/hiding the Hero panel (no waiting for a repaint).
  const swapTo = useCallback(
    (target) => {
      if (sectionRef.current === target) return
      // Mobile only: ignore a transition that lands within the cooldown window of the last one
      // (see handleFrameScroll) — this is what stops a single noisy swipe from bouncing the
      // panel back and forth.
      if (isMobile && performance.now() < mobileCooldownUntilRef.current) return
      sectionRef.current = target
      if (target === 'frame') {
        frameGateClosedRef.current = true
        frameLastWheelAtRef.current = performance.now()
        frameEnteredAtRef.current = performance.now()
      }
      setSection(target)
      setHeroVisible(target === 'hero')
      if (isMobile && performance.now() < mobileCooldownUntilRef.current) return
      sectionRef.current = target
      if (target === 'frame') {
        frameGateClosedRef.current = true
        frameLastWheelAtRef.current = performance.now()
        frameEnteredAtRef.current = performance.now()
      }
      setSection(target)
      setHeroVisible(target === 'hero')
      if (isMobile) {
        mobileCooldownUntilRef.current =
          performance.now() + MOBILE_SWIPE_COOLDOWN_MS
      }
    },
    [isMobile],
  )

  // Hero -> Frame.
  const enterFrame = useCallback(() => swapTo('frame'), [swapTo])

  // Frame -> Hero. Hero is still parked at the end of its runway (portal fully open, which
  // looks exactly like Frame), so scrolling up just plays the portal back.
  const returnToHero = useCallback(() => swapTo('hero'), [swapTo])

  const handleHeroProgress = useCallback(
    (progress) => {
      heroProgressRef.current = progress
      if (sectionRef.current === 'hero' && progress >= AUTO_ENTER_PROGRESS)
        enterFrame()
    },
    [enterFrame],
  )

  // Wheeling past the end only counts once the portal has actually finished opening.
  const handleHeroScrollBeyondEnd = useCallback(() => {
    if (heroProgressRef.current >= AUTO_ENTER_PROGRESS) enterFrame()
  }, [enterFrame])

  const handleFrameScroll = useCallback(
    (deltaY, timeStamp) => {
      if (!isMobile) {
        // When the wheel event happened, not when it got handled: events held up behind a busy
        // main thread arrive in a burst, and must not look like a pause followed by a new gesture.
        const now = timeStamp ?? performance.now()
        const quietFor = now - frameLastWheelAtRef.current
        frameLastWheelAtRef.current = now
        if (deltaY < 0) {
          returnToHero()
        } else if (deltaY > 0) {
          if (frameGateClosedRef.current) {
            if (quietFor < FRAME_GESTURE_GAP_MS) return
            if (now - frameEnteredAtRef.current < FRAME_MIN_DWELL_MS) return
            frameGateClosedRef.current = false
          }
          setUnlocked(true)
          setHasReachedContent(true)
        }
        return
      }

      // Mobile: accumulate same-direction movement instead of acting on every raw touchmove
      // delta — see the MOBILE_* constants above for why.
      const now = performance.now()
      if (now < mobileCooldownUntilRef.current) return
      if (now - mobileTouchLastAtRef.current > MOBILE_GESTURE_IDLE_MS) {
        mobileTouchAccumRef.current = 0
        mobileTouchDirRef.current = 0
      }
      mobileTouchLastAtRef.current = now

      const dir = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0
      if (dir === 0) return
      if (dir !== mobileTouchDirRef.current) {
        mobileTouchDirRef.current = dir
        mobileTouchAccumRef.current = 0
      }
      mobileTouchAccumRef.current += Math.abs(deltaY)
      if (mobileTouchAccumRef.current < MOBILE_SWIPE_THRESHOLD) return

      mobileTouchAccumRef.current = 0
      if (dir < 0) {
        returnToHero() // swapTo applies its own cooldown
      } else {
        setUnlocked(true)
        setHasReachedContent(true)
        mobileCooldownUntilRef.current = now + MOBILE_SWIPE_COOLDOWN_MS
      }
    },
    [returnToHero, isMobile],
  )

  // Lenis and ScrollTrigger need a nudge when the wrapper's height changes or children mount.
  useEffect(() => {
    window.__lenis?.resize()
    if (hasReachedContent) ScrollTrigger.refresh()
  }, [unlocked, hasReachedContent])

  // Mount `children` behind the preloader. (A frame late, so Hero gets its first paint first.)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHasReachedContent(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Frame <-> content. The stretch of scroll between W1 and the first section is never left to
  // the wheel: going down it is one eased, locked glide onto that section (see CONTENT_GLIDE_S),
  // going up the same glide back to W1, so the page can't be left hanging half way between the
  // two and a hard scroll can't carry past either. Defined after the effect above, which has
  // already let Lenis and ScrollTrigger re-measure the now-unclipped page.
  useEffect(() => {
    if (!unlocked) return undefined
    const lenis = window.__lenis
    if (!lenis) return undefined

    const glide = (direction) => {
      const content = contentRef.current
      const scroller = content?.closest('.main-scroll')
      if (!content || !scroller || lenis.isLocked || lenis.isStopped) return
      const scroll = scroller.scrollTop
      // cheap way out for every scroll further down the page
      if (scroll > scroller.clientHeight * 2) return
      const top =
        scroll +
        content.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top
      if (scroll >= top || (direction < 0 && scroll <= 0)) return
      lenis.scrollTo(direction < 0 ? 0 : top + CONTENT_GLIDE_INSET_PX, {
        duration: CONTENT_GLIDE_S,
        easing: easeInOut,
        lock: true,
        force: true,
      })
    }

    // Just unlocked: glide down. A couple of frames late, so that when `children` have to mount
    // at this very moment the dropped frames aren't counted as part of the glide.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        lenis.resize()
        glide(1)
      })
    })
    // Scrolled back up out of the first section (or dragged into the gap): finish the trip.
    // Not while a finger is down: a native drag can't be taken over until it is released.
    // Touch screens scroll natively (finger, then momentum), and a scripted glide run against
    // that makes the page judder. There nothing is done while the page is moving: once it has
    // come to rest in the gap with the finger off, it is eased (not locked, a touch takes it
    // back) to whichever of the two it was taken towards since it last rested.
    const touchScreen = window.matchMedia('(pointer: coarse)').matches
    let idle = 0
    let rested = 0
    const settle = () => {
      const content = contentRef.current
      const scroller = content?.closest('.main-scroll')
      if (!content || !scroller) return
      if (lenis.isTouching || lenis.isLocked || lenis.isStopped) return
      const scroll = scroller.scrollTop
      const travelled = scroll - rested
      rested = scroll
      if (scroll > scroller.clientHeight * 2) return
      const top =
        scroll +
        content.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top
      if (scroll <= 0 || scroll >= top) return
      const down =
        Math.abs(travelled) >= TOUCH_INTENT_PX
          ? travelled > 0
          : scroll > top / 2
      lenis.scrollTo(down ? top + CONTENT_GLIDE_INSET_PX : 0, {
        duration: 0.5,
        easing: easeInOut,
      })
    }
    const settleSoon = () => {
      window.clearTimeout(idle)
      idle = window.setTimeout(settle, TOUCH_IDLE_MS)
    }
    const offScroll = lenis.on('scroll', () => {
      if (touchScreen) settleSoon()
      else if (!lenis.isTouching && lenis.direction !== 0)
        glide(lenis.direction)
    })
    const scrollerEl = contentRef.current?.closest('.main-scroll')
    if (touchScreen)
      scrollerEl?.addEventListener('touchend', settleSoon, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(idle)
      scrollerEl?.removeEventListener('touchend', settleSoon)
      offScroll()
    }
  }, [unlocked])

  // `children` mount AFTER the page's load event, so ScrollTrigger's own auto-refresh has already
  // run. Images / videos / fonts inside them keep changing the layout after that, leaving every
  // pin and scrub measured against stale positions (worst when scrolling back UP through them:
  // clipped / glitching sections). Re-measure (debounced) whenever the content's size changes.
  useEffect(() => {
    const el = contentRef.current
    if (!hasReachedContent || !el) return undefined
    let timer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        window.__lenis?.resize()
        ScrollTrigger.refresh()
      }, 200)
    })
    ro.observe(el)
    return () => {
      window.clearTimeout(timer)
      ro.disconnect()
    }
  }, [hasReachedContent])

  // Coming back to the tab (or window) after Chrome has dropped its GPU tiles: pins from the
  // sections below can still be in their "fixed" state until the next scroll event, so they paint
  // over Hero for a few frames. Re-sync every trigger as soon as the tab is visible again.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      window.__lenis?.resize()
      requestAnimationFrame(() => ScrollTrigger.update())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Re-lock when the user scrolls up past the very top of the page while unlocked.
  useEffect(() => {
    if (!unlocked) return undefined
    const mainScroll = document.querySelector('.main-scroll')
    if (!mainScroll) return undefined

    const handleWheel = (e) => {
      if (e.deltaY >= 0 || mainScroll.scrollTop > 0) return
      e.preventDefault()
      // stop Lenis carrying leftover momentum into the locked state
      window.__lenis?.scrollTo(0, { immediate: true })
      setUnlocked(false)
    }

    // Touch screens: the same, as a pull down on W1 while the page is already at the very top.
    let touchY = 0
    let pulled = 0
    const handleTouchStart = (e) => {
      touchY = e.touches[0].clientY
      pulled = 0
    }
    const handleTouchMove = (e) => {
      const y = e.touches[0].clientY
      const moved = y - touchY // finger down = pulling the page down
      touchY = y
      if (mainScroll.scrollTop > 0 || moved <= 0) {
        pulled = 0
        return
      }
      pulled += moved
      if (pulled < MOBILE_SWIPE_THRESHOLD) return
      pulled = 0
      window.__lenis?.scrollTo(0, { immediate: true })
      mobileCooldownUntilRef.current =
        performance.now() + MOBILE_SWIPE_COOLDOWN_MS
      setUnlocked(false)
    }

    mainScroll.addEventListener('wheel', handleWheel, { passive: false })
    return () => mainScroll.removeEventListener('wheel', handleWheel)
  }, [unlocked])

  // Hero is visually empty (portal fully open, matching Frame) once it's not the front panel,
  // so there's nothing to gain by hiding it for the hero<->frame swap — only block its input.
  // `unlocked` is the one case that really hides it: the user has scrolled past Frame into the
  // real page content underneath.
  const heroInteractive = heroVisible && !unlocked

  return (
    <NavbarScope>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: unlocked ? 'auto' : '100svh',
          overflow: unlocked ? 'visible' : 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            visibility: unlocked ? 'hidden' : 'visible',
            pointerEvents: heroInteractive ? 'auto' : 'none',
            zIndex: 3, // always above Frame, so the outgoing panel stays on top during a swap
          }}
          aria-hidden={!heroInteractive}
          inert={!heroInteractive}
        >
          <Hero
            onProgress={handleHeroProgress}
            onScrollBeyondEnd={handleHeroScrollBeyondEnd}
            onAutoEnter={enterFrame}
            isActive={section === 'hero' && !unlocked}
          />
        </div>

        <div
          style={{
            position: unlocked ? 'relative' : 'absolute',
            inset: unlocked ? undefined : 0,
            zIndex: unlocked ? undefined : 2,
          }}
        >
          <Frame
            onScroll={handleFrameScroll}
            isActive={section === 'frame' && !unlocked}
          />
        </div>

        {pathname !== '/' && <Navbar />}
        <TathvaMenu />

        {/* While locked, `children` stay mounted but hidden. `visibility: hidden` also hides
          position: fixed descendants (pinned sections, underlays), which overflow: hidden on the
          wrapper above does NOT clip, so nothing can paint over Hero / Frame. */}
        {hasReachedContent && (
          <div
            ref={contentRef}
            style={{ visibility: unlocked ? 'visible' : 'hidden' }}
          >
            {children}
          </div>
        )}

        {/* Black cover until the critical hero images are ready. Fixed + 2px bleed so no sliver
          of the page behind it shows; below the Navbar (z-index 1000). Fully hidden after the fade. */}
        <div
          aria-hidden='true'
          style={{
            position: 'fixed',
            inset: '-2px',
            zIndex: 20000,
            background: '#000',
            opacity: ready ? 0 : 1,
            visibility: ready ? 'hidden' : 'visible',
            transition: ready
              ? 'opacity 0.4s ease, visibility 0s linear 0.4s'
              : 'none',
            pointerEvents: 'none',
          }}
        />
      </div>
    </NavbarScope>
  )
}

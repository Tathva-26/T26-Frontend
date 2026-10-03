'use client'

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  memo,
} from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EasePack } from 'gsap/EasePack'
import TopoBackground from '@/components/TopoBackground'
import { watchVisible } from '@/lib/watchVisible'
import { touchStop } from '@/lib/touchStop'

gsap.registerPlugin(ScrollTrigger, EasePack)

const assetPathPrefix = '/images/artist'

const artists = [
  {
    name: 'Day 2 Artists',
    background: `${assetPathPrefix}/21bbf.svg`,
    portrait: `${assetPathPrefix}/day2_main.svg`,
    portraitClassName: 'artist-portrait artist-portrait--arijit',
    cardPortrait: `${assetPathPrefix}/day2_anim_1.svg`,
    cardSecondary: `${assetPathPrefix}/day2_anim_2.svg`,
    avatar: `${assetPathPrefix}/day2_anim_3.svg`,
    avatar2: `${assetPathPrefix}/day2_anim_4.svg`,
  },
  {
    name: 'Day 3 Artists',
    background: `${assetPathPrefix}/bef85.svg`,
    portrait: `${assetPathPrefix}/day3.svg`,
    portraitClassName: 'artist-portrait artist-portrait--day3',
    cardPortrait: `${assetPathPrefix}/day3_anim_2.svg`,
    cardSecondary: `${assetPathPrefix}/day3_anim_3.svg`,
    avatar: `${assetPathPrefix}/day3_anim_1.svg`,
  },
]

// The days the artists play on: the same on every layout.
const DAYS = ['DAY 2', 'DAY 3']

function ScheduleCard({ artist, activeIndex = 0, onSelectDay }) {
  const days = DAYS

  return (
    <div className='schedule-card'>
      <div className='schedule-days'>
        {days.map((day, idx) => (
          <button
            key={day}
            type='button'
            className={idx === activeIndex ? 'is-active' : ''}
            onClick={() => onSelectDay && onSelectDay(idx)}
          >
            {day}
          </button>
        ))}
      </div>
      <p>
        Brace yourselves for a magical night as the legendary {artist.name}{' '}
        takes the stage. Get ready to sing, sway, and make memories!
      </p>
    </div>
  )
}

// --- Easing ---------------------------------------------------------------
const PORTRAIT_EASE = 'sine.inOut'
const PORTRAIT_EXIT = -60

// --- Scroll pacing --------------------------------------------------------
// Each artist is held still, whole, before and after its transition, so the
// crossfade reads as "artist, slide, artist" instead of one continuous morph.
// In timeline units: HOLD, transition (1), HOLD, transition, ... HOLD.
const HOLD = 0.5
const STEP = 1 + HOLD // one transition plus the hold that follows it
// Touch screens: how far inside an artist's hold a settling page is brought.
const TOUCH_HOLD_INSET = 0.06
// Touch screens: which way a swipe was going is read off how far it took the
// page from where it began to where it came to rest, at least this many px.
// (Not off its last movement: a finger wobbles as it lifts, and momentum can
// tick back a pixel as it dies; either would send the page back the way it
// came.)
const TOUCH_INTENT_PX = 24
const timelineTotal = (count) => HOLD + Math.max(0, count - 1) * STEP
// Scroll spent on one timeline unit. 100dvh per unit = a full screen of wheel
// for each transition, half a screen for each hold.
const SCROLL_PER_UNIT_DVH = 100

// GPC sits on top of the end of this section: its track starts (100dvh +
// --gpc-lead) early (see gpc.css), so its stage slides up into view while this
// section is still scrolling. The crossfade is finished by then, which leaves
// the last artist held still and whole for GPC to pull back out of.
//   272 = 100 (the viewport) + 100 + 72 (--gpc-lead above 768px)
//   200 = 100 (the viewport) + 100 + 0  (no lead at 768px and below)
const CROSSFADE_END_DVH = 272
const SECTION_SCROLL_DVH = timelineTotal(2) * SCROLL_PER_UNIT_DVH

// How far GPC's track reaches back over this section, in px. Read off its own
// margin so --gpc-lead and its breakpoint never have to be repeated here; 0 on
// routes without GPC and for reduced motion, where it doesn't overlap at all.
function gpcOverlapPx() {
  const track =
    typeof document !== 'undefined'
      ? document.querySelector('.gpc-track')
      : null
  if (!track) return 0
  const overlap = -parseFloat(window.getComputedStyle(track).marginTop || '0')
  return Number.isFinite(overlap) && overlap > 0 ? overlap : 0
}

function useScrubCrossfade(
  ref,
  { bgRefs, portraitRefs, boardRefs, onIndexChange, snap = true },
) {
  // Set while the timeline is alive: maps an artist index to the scroll
  // position where that artist is shown whole (see scrollToIndex below).
  const scrollForIndex = useRef(null)
  // null means the user has not landed on an artist yet (e.g. entering from W1).
  // -1 / `count` mean the section was last left through its top / bottom, so
  // coming back in lands on the first / last artist, not one further along.
  const settledArtistIndex = useRef(null)

  useLayoutEffect(() => {
    const section = ref.current
    if (!section) return
    if (
      typeof window !== 'undefined' &&
      window.getComputedStyle(section).display === 'none'
    )
      return
    const scroller = section.closest('.main-scroll')
    const touchScreen = window.matchMedia('(pointer: coarse)').matches
    let stopTouchStops = null

    const context = gsap.context(() => {
      const bgs = (bgRefs?.current || []).filter(Boolean)
      const ports = (portraitRefs?.current || []).filter(Boolean)
      const boards = (boardRefs?.current || []).filter(Boolean)
      const count = Math.max(bgs.length, boards.length, ports.length)
      if (count < 2) return
      // The wide layout's section also wraps the phone layout, so on a phone
      // it is on the page but its own layers are not laid out at all. Without
      // this both copies would drive the scroll there, one of them animating
      // nothing anyone can see.
      const probe = bgs[0] || boards[0] || ports[0]
      if (probe && probe.getClientRects().length === 0) return

      // Hide sticky/promoted layers whenever this section is off-screen so
      // they can never paint over neighbouring pages.
      const syncVisibility = (self) =>
        section.classList.toggle('is-offscreen', !self.isActive)
      ScrollTrigger.create({
        trigger: section,
        ...(scroller ? { scroller } : {}),
        start: 'top bottom',
        // Touch screens: GPC is a plain opaque page there, and once it has
        // slid all the way up (this section's bottom at the bottom of the
        // screen) nothing of the artists can be seen, so they stop there and
        // stop animating underneath it. Elsewhere GPC's entry shows the last
        // artist through the console's screen, so they stay until they are
        // really off the top.
        end: touchScreen && gpcOverlapPx() ? 'bottom bottom' : 'bottom top',
        onToggle: syncVisibility,
        onRefresh: syncVisibility,
      })
      if (bgs.length > 1) gsap.set(bgs.slice(1), { autoAlpha: 0 })
      if (ports.length > 1)
        gsap.set(ports.slice(1), { autoAlpha: 0 })
      if (boards.length > 1)
        gsap.set(boards.slice(1), { autoAlpha: 0 })

      const total = timelineTotal(count)
      const artistStops = Array.from(
        { length: count },
        (_, index) => (HOLD / 2 + index * STEP) / total,
      )
      let pendingArtistIndex = null
      let snappingWithLenis = false
      // Where the page was last settled on an artist. ScrollTrigger can ask
      // to snap again once a glide has ended without the user having scrolled
      // at all; that must not count as another gesture and skip an artist.
      let restingScroll = null
      // Set when the scroll comes into this section from outside it, to the
      // side it came in through; taken (and cleared) by the next snap.
      let enteredFrom = null // 'top' | 'bottom' | null
      // Touch screens: where the page was when the current swipe began (see
      // TOUCH_INTENT_PX), or null when there is no swipe to account for.
      let gestureStart = null
      // Touch screens: the artist the current swipe started on (-1 above the
      // section, `count` below it), or null when no swipe is being followed.
      let gestureFrom = null

      const tl = gsap.timeline({
        defaults: { duration: 1 },
        scrollTrigger: {
          trigger: section,
          ...(scroller ? { scroller } : {}),
          start: 'top top',
          // Done by the time GPC's stage comes into view at the bottom, so the
          // last artist is already held still when GPC starts pulling back
          // out of it. (A function so it is re-read on every refresh.)
          end: () => `bottom bottom+=${gpcOverlapPx()}`,
          // Let the snap tween itself carry the crossfade; a second scrub lag
          // made the visible artist continue changing after the scroll settled.
          scrub: true,
          ...(snap && {
            // Settle on the fully visible hold for each artist. Leave the
            // ranges beyond the first/last artist free so adjacent sections
            // (especially GPC) can take over without being pulled back here.
            snap: {
              snapTo: (value, trigger) => {
                const here = () =>
                  gsap.utils.clamp(
                    0,
                    1,
                    (trigger.scroll() - trigger.start) / (trigger.end - trigger.start),
                  )
                // Touch screens. A swipe is native scroll with momentum: it
                // goes as far as it was thrown, so "one artist per gesture"
                // can't be kept without taking the page away from the finger,
                // and a locked glide after every swipe swallows the next one.
                // So nothing is locked and nothing is remembered there: a
                // page that comes to rest on an artist's hold is left alone,
                // and one left mid-way between two artists is eased onto the
                // one it was heading for. A new touch takes over at once.
                if (touchScreen) {
                  // How far this swipe took the page, start to rest.
                  const scroll = trigger.scroll()
                  const travelled =
                    gestureStart === null ? 0 : scroll - gestureStart
                  gestureStart = null
                  gestureFrom = null // the swipe is over: see the stops below
                  const swiped = Math.abs(travelled) >= TOUCH_INTENT_PX
                  const range = trigger.end - trigger.start
                  const toScroll = (time) => trigger.start + range * (time / total)
                  const time = here() * total
                  const index = Math.min(count - 1, Math.floor(time / STEP))
                  const onHold = index >= count - 1 || time - index * STEP <= HOLD

                  let target = null
                  if (!onHold) {
                    // Between two artists: on to the one it was heading for
                    // (too little travel to tell: whichever is nearer).
                    const forward = swiped
                      ? travelled > 0
                      : time - index * STEP - HOLD > 0.5
                    target = toScroll(
                      forward
                        ? (index + 1) * STEP + TOUCH_HOLD_INSET
                        : index * STEP + HOLD - TOUCH_HOLD_INSET,
                    )
                  } else if (swiped && travelled > 0) {
                    // A swipe that never left this artist still means "next":
                    // the hold is a long stretch in which nothing moves, and a
                    // swipe that does nothing reads as the page being stuck.
                    // Past the last artist, next is GPC's resting spot.
                    target =
                      index < count - 1
                        ? toScroll((index + 1) * STEP + TOUCH_HOLD_INSET)
                        : trigger.end + gpcOverlapPx()
                  } else if (swiped) {
                    // ...and "previous": above the first artist that is
                    // whatever comes before this section (W1 on the home page).
                    target =
                      index > 0
                        ? toScroll((index - 1) * STEP + HOLD - TOUCH_HOLD_INSET)
                        : Math.max(
                          0,
                          trigger.start - (scroller?.clientHeight ?? 0) * 1.2,
                        )
                  }
                  if (target === null || Math.abs(target - scroll) < 2)
                    return here()

                  const lenis = window.__lenis
                  if (!lenis)
                    return gsap.utils.clamp(0, 1, (target - trigger.start) / range)
                  if (!lenis.isStopped && !lenis.isLocked) {
                    lenis.scrollTo(target, {
                      duration: 0.45,
                      easing: (progress) => 1 - Math.pow(1 - progress, 3),
                    })
                  }
                  return here()
                }

                // Still gliding to an artist. If Lenis is no longer locked the
                // glide was cut short by something stopping it (GPC holding
                // the page), and it will never report back: carry on as usual.
                if (snappingWithLenis && window.__lenis?.isLocked) return here()
                snappingWithLenis = false
                if (
                  restingScroll !== null &&
                  Math.abs(trigger.scroll() - restingScroll) < 2
                )
                  return here()

                // Not inside the section yet (it is measured at the very top
                // of a still-locked page while it waits, hidden, under W1).
                if (trigger.scroll() <= trigger.start) return here()

                // Arriving from a neighbouring section (the glide down from
                // W1, GPC handing the page back). Coming in through the top
                // always lands on the first artist, through the bottom on the
                // last, whatever was settled the last time round. Already
                // resting inside that artist's hold: it is whole and still,
                // so take it as settled instead of scrolling on.
                // (`value` is where ScrollTrigger reckons the scroll would
                // coast to; returning it would send the page there, so these
                // return where the page actually is.)
                const time = here() * total
                if (enteredFrom === 'top') {
                  enteredFrom = null
                  if (time <= HOLD) {
                    settledArtistIndex.current = 0
                    restingScroll = trigger.scroll()
                    return here()
                  }
                  settledArtistIndex.current = -1
                } else if (enteredFrom === 'bottom') {
                  enteredFrom = null
                  if (time >= total - HOLD) {
                    settledArtistIndex.current = count - 1
                    restingScroll = trigger.scroll()
                    return here()
                  }
                  settledArtistIndex.current = count
                }
                const settled = settledArtistIndex.current

                const direction = trigger.direction
                if (direction > 0) {
                  pendingArtistIndex = settled === null ? 0 : settled + 1
                } else if (direction < 0) {
                  pendingArtistIndex = settled === null ? count - 1 : settled - 1
                } else {
                  // On the homepage the Artists trigger can first become
                  // active in the same frame that content is unlocked from
                  // W1. ScrollTrigger may report direction 0 for that first
                  // snap; choosing the nearest stop then can land on artist 1
                  // after a large unlock delta. The first unresolved snap is
                  // always Arijit, independent of the sampled progress.
                  pendingArtistIndex =
                    settledArtistIndex.current === null
                      ? 0
                      : artistStops.reduce(
                        (nearest, point, index) =>
                          Math.abs(point - value) <
                            Math.abs(artistStops[nearest] - value)
                            ? index
                            : nearest,
                        0,
                      )
                }

                // Advance exactly one artist per completed scroll gesture.
                // At either edge, let the page continue into the neighboring
                // section instead of snapping back to an artist.
                if (pendingArtistIndex < 0 || pendingArtistIndex >= count) {
                  pendingArtistIndex = null
                  // Lenis is already carrying the page where the user sent
                  // it; don't have ScrollTrigger tween it somewhere as well.
                  return window.__lenis ? here() : value
                }

                const lenis = window.__lenis
                // Something else is holding the page (a locked glide, GPC):
                // a scrollTo would be dropped and never report back.
                if (lenis && (lenis.isStopped || lenis.isLocked)) {
                  pendingArtistIndex = null
                  return here()
                }
                if (lenis) {
                  const targetIndex = pendingArtistIndex
                  const target =
                    trigger.start +
                    (trigger.end - trigger.start) * artistStops[targetIndex]
                  snappingWithLenis = true
                  lenis.scrollTo(target, {
                    duration: 0.7,
                    lock: true,
                    easing: (progress) => 1 - Math.pow(1 - progress, 3),
                    onComplete: () => {
                      settledArtistIndex.current = targetIndex
                      pendingArtistIndex = null
                      snappingWithLenis = false
                      restingScroll = trigger.scroll()
                    },
                  })
                  // Lenis owns the home scroller; avoid a competing native
                  // ScrollTrigger scroll tween.
                  return here()
                }

                return artistStops[pendingArtistIndex]
              },
              delay: 0.1,
              duration: { min: 0.45, max: 0.85 },
              ease: 'power2.out',
              onComplete: () => {
                if (pendingArtistIndex !== null) {
                  settledArtistIndex.current = pendingArtistIndex
                  pendingArtistIndex = null
                }
              },
              onInterrupt: () => {
                pendingArtistIndex = null
              },
            },
          }),
          invalidateOnRefresh: true,
          onEnter: () => {
            enteredFrom = 'top'
          },
          onEnterBack: () => {
            enteredFrom = 'bottom'
          },
          onLeave: () => {
            settledArtistIndex.current = count
          },
          onLeaveBack: () => {
            settledArtistIndex.current = -1
          },
          onUpdate: (self) => {
            if (onIndexChange) {
              // Which artist is showing, counting the holds: the label flips
              // halfway through each transition.
              const t = self.progress * total
              const idx = gsap.utils.clamp(
                0,
                count - 1,
                Math.round((t - HOLD) / STEP),
              )
              onIndexChange(idx)
            }
          },
        },
      })

      for (let i = 0; i < count - 1; i++) {
        const t = HOLD + i * STEP

        if (bgs[i] && bgs[i + 1]) {
          tl.to(bgs[i], { autoAlpha: 0, ease: 'none' }, t).to(
            bgs[i + 1],
            { autoAlpha: 1, ease: 'none' },
            t,
          )
        }

        if (ports[i] && ports[i + 1]) {
          tl.to(
            ports[i],
            { autoAlpha: 0, ease: PORTRAIT_EASE },
            t,
          ).to(
            ports[i + 1],
            { autoAlpha: 1, ease: PORTRAIT_EASE },
            t,
          )
        }

        // Synchronized vertical sliding animation matching the left side portraits
        if (boards[i] && boards[i + 1]) {
          tl.to(
            boards[i],
            { autoAlpha: 0, ease: PORTRAIT_EASE },
            t,
          ).to(
            boards[i + 1],
            { autoAlpha: 1, ease: PORTRAIT_EASE },
            t,
          )
        }
      }

      // The last hold has to be a real part of the timeline: without it the
      // timeline would end on the last transition and the scroll after it
      // would do nothing because there is nothing left, not because the last
      // artist is being held.
      tl.to({}, { duration: HOLD }, total - HOLD)

      // Touch screens: one artist per swipe, as with the wheel. A swipe goes
      // as far as it was thrown, so the page is stopped (see lib/touchStop)
      // the moment it reaches the next artist along from the one the swipe
      // started on, in either direction. Past the last artist it is GPC that
      // stops it, and above the first it runs on to W1.
      if (touchScreen && snap && scroller && tl.scrollTrigger) {
        const st = tl.scrollTrigger
        const stopper = touchStop(scroller)
        const timeAt = (scroll) =>
          ((scroll - st.start) / (st.end - st.start)) * total
        const artistAt = (scroll) => {
          const time = timeAt(scroll)
          if (time < 0) return -1
          if (time > total) return count
          return gsap.utils.clamp(0, count - 1, Math.round((time - HOLD / 2) / STEP))
        }
        let last = scroller.scrollTop
        // On screen for real: while the page is still locked on Hero / W1
        // this section waits underneath, hidden, at the top of a clipped
        // page, and by its measurements there a swipe on W1 is a swipe on it.
        const showing = () =>
          typeof section.checkVisibility !== 'function' ||
          section.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true })
        const onTouchStart = () => {
          last = scroller.scrollTop
          gestureStart = null
          gestureFrom = null
          if (!showing()) return
          // Only a swipe that begins on the artists counts as "next" or
          // "previous" for them. One that begins on W1 or GPC and ends up
          // here has already done its job by arriving.
          if (last >= st.start && last <= st.end) gestureStart = last
          gestureFrom = artistAt(last)
        }
        // A tap (the day tabs, say) is not a swipe: forget it, or wherever
        // the page is sent next would be put down to it.
        const onTouchEnd = () => {
          if (gestureStart === null) return
          if (Math.abs(scroller.scrollTop - gestureStart) >= 3) return
          gestureStart = null
          gestureFrom = null
        }
        const onScroll = () => {
          const scroll = scroller.scrollTop
          const moved = scroll - last
          last = scroll
          if (gestureFrom === null || stopper.stopped || moved === 0) return
          // A screen or more in one step is the page being sent somewhere.
          if (Math.abs(moved) >= scroller.clientHeight) return
          const next = gestureFrom + Math.sign(moved)
          if (next < 0 || next > count - 1) return
          // The near edge of that artist's hold, coming from this side.
          const edge =
            moved > 0
              ? next * STEP + TOUCH_HOLD_INSET
              : next * STEP + HOLD - TOUCH_HOLD_INSET
          const time = timeAt(scroll)
          if (moved > 0 ? time < edge : time > edge) return
          // Stopped here: the swipe is spent, and nothing more is owed to it.
          gestureFrom = null
          gestureStart = null
          stopper.stopAt(st.start + (st.end - st.start) * (edge / total))
        }
        const passive = { passive: true }
        scroller.addEventListener('touchstart', onTouchStart, passive)
        scroller.addEventListener('touchend', onTouchEnd, passive)
        scroller.addEventListener('scroll', onScroll, passive)
        stopTouchStops = () => {
          scroller.removeEventListener('touchstart', onTouchStart)
          scroller.removeEventListener('touchend', onTouchEnd)
          scroller.removeEventListener('scroll', onScroll)
          stopper.dispose()
        }
      }

      // Where to scroll to show artist `idx` whole: the end of its hold, as a
      // fraction of this trigger's own scroll range.
      scrollForIndex.current = (idx) => {
        const st = tl.scrollTrigger
        if (!st) return null
        const time = HOLD + gsap.utils.clamp(0, count - 1, idx) * STEP
        return st.start + (st.end - st.start) * (time / total)
      }
    }, section)

    return () => {
      stopTouchStops?.()
      context.revert()
      scrollForIndex.current = null
      section.classList.remove('is-offscreen')
    }
  }, [ref, bgRefs, portraitRefs, boardRefs, onIndexChange, snap])

  // Jump to an artist (the day tabs). Lenis drives .main-scroll on the home
  // page, so going through it keeps its own target in step; elsewhere this is
  // a plain smooth scroll.
  return useCallback(
    (idx) => {
      const targetIndex = Math.trunc(idx)
      settledArtistIndex.current = targetIndex
      const target = scrollForIndex.current?.(targetIndex)
      if (target == null) return
      const scroller = ref.current?.closest('.main-scroll')
      if (window.__lenis) window.__lenis.scrollTo(target)
      else if (scroller) scroller.scrollTo({ top: target, behavior: 'smooth' })
      else window.scrollTo({ top: target, behavior: 'smooth' })
    },
    [ref],
  )
}

// Point where the line from the rect's center in direction (dx, dy) leaves the
// shape. Circular/elliptical shapes (rect.round) use the real ellipse edge so
// arrows touch the circle instead of stopping at the bounding-box corner.
function edgePoint(rect, dx, dy, gap = 4) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  let scale
  if (rect.round) {
    const a = rect.width / 2 + gap
    const b = rect.height / 2 + gap
    scale = 1 / Math.sqrt((dx / a) ** 2 + (dy / b) ** 2)
  } else {
    scale = Math.min(
      (rect.width / 2 + gap) / Math.abs(dx || Infinity),
      (rect.height / 2 + gap) / Math.abs(dy || Infinity),
    )
  }
  return { x: cx + dx * scale, y: cy + dy * scale }
}

function segmentBetween(rectA, rectB) {
  const centerA = {
    x: rectA.left + rectA.width / 2,
    y: rectA.top + rectA.height / 2,
  }
  const centerB = {
    x: rectB.left + rectB.width / 2,
    y: rectB.top + rectB.height / 2,
  }
  const dx = centerB.x - centerA.x
  const dy = centerB.y - centerA.y
  return { start: edgePoint(rectA, dx, dy, 6), end: edgePoint(rectB, -dx, -dy, 6) }
}

function buildCurve(start, end, bend = 1) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy) || 1
  const perpX = (-dy / distance) * bend
  const perpY = (dx / distance) * bend
  const curvature = distance * 0.18
  const c1 = {
    x: start.x + dx / 3 + perpX * curvature,
    y: start.y + dy / 3 + perpY * curvature,
  }
  const c2 = {
    x: start.x + (dx * 2) / 3 + perpX * curvature,
    y: start.y + (dy * 2) / 3 + perpY * curvature,
  }
  return {
    d: `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`,
    angle: Math.atan2(end.y - c2.y, end.x - c2.x) * (180 / Math.PI),
  }
}

// Duration each arrow takes to travel from its start image to its end image.
const CONNECTOR_DURATION = 1.8

function placeArrowheadAt(path, arrowhead, length, distance) {
  const eps = 1
  const point = path.getPointAtLength(distance)
  const a = path.getPointAtLength(Math.max(0, distance - eps))
  const b = path.getPointAtLength(Math.min(length, distance + eps))
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
  arrowhead.setAttribute(
    'transform',
    `translate(${point.x} ${point.y}) rotate(${angle})`,
  )
}

const ConnectorArrow = forwardRef(function ConnectorArrow(
  { getFrom, getTo, slideRef, bend = 1 },
  ref,
) {
  const [segment, setSegment] = useState(null)
  const pathRef = useRef(null)
  const arrowheadRef = useRef(null)
  const progressRef = useRef(0)
  const lengthRef = useRef(null)
  const segmentKeyRef = useRef('')

  const getFromRef = useRef(getFrom)
  const getToRef = useRef(getTo)
  useLayoutEffect(() => {
    getFromRef.current = getFrom
    getToRef.current = getTo
  })

  useLayoutEffect(() => {
    const measure = () => {
      const slide = slideRef.current
      const fromEl = getFromRef.current()
      const toEl = getToRef.current()
      if (!slide || !fromEl || !toEl) {
        segmentKeyRef.current = ''
        return setSegment(null)
      }

      // Measure with getBoundingClientRect relative to the slide instead of
      // offsetLeft/offsetTop. offset* values are rounded to whole pixels and
      // depend on the offsetParent chain, which made arrows start/end short
      // of the images. Both elements sit inside the same translated track, so
      // the difference between their rects is unaffected by the marquee.
      const slideBox = slide.getBoundingClientRect()
      if (slideBox.width === 0) {
        segmentKeyRef.current = ''
        return setSegment(null)
      }
      const rectOf = (el) => {
        if (!(el instanceof Element)) return el
        const r = el.getBoundingClientRect()
        const isAvatar = el.classList.contains('slide__avatar')
        const radius = window.getComputedStyle(el).borderTopLeftRadius || ''
        const round = isAvatar || (radius.includes('%') && parseFloat(radius) >= 50)
        return {
          left: r.left - slideBox.left,
          top: r.top - slideBox.top,
          width: r.width,
          height: r.height,
          round,
        }
      }
      const seg = segmentBetween(rectOf(fromEl), rectOf(toEl))
      const key = [seg.start.x, seg.start.y, seg.end.x, seg.end.y]
        .map((n) => n.toFixed(1))
        .join(',')
      if (key === segmentKeyRef.current) return
      segmentKeyRef.current = key
      setSegment(seg)
    }
    measure()
    const raf = requestAnimationFrame(measure)
    const ro = new ResizeObserver(measure)
    if (slideRef.current) ro.observe(slideRef.current)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [slideRef, bend])

  const applyProgress = (p) => {
    progressRef.current = p
    const path = pathRef.current
    const head = arrowheadRef.current
    if (!path || !head) return
    // Measuring an SVG path is slow and this runs every frame, so the length
    // is measured once per shape (see the effect below, which forgets it).
    if (lengthRef.current === null) lengthRef.current = path.getTotalLength()
    const length = lengthRef.current
    path.style.strokeDasharray = `${length} ${length}`
    path.style.strokeDashoffset = `${length * (1 - p)}`
    if (p <= 0) {
      head.style.opacity = '0'
    } else {
      head.style.opacity = '1'
      placeArrowheadAt(path, head, length, length * p)
    }
  }

  useLayoutEffect(() => {
    lengthRef.current = null // a new shape: measure it again
    applyProgress(progressRef.current)
  }, [segment])

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (p) => applyProgress(p),
      getProgress: () => progressRef.current,
      canStart() {
        const slide = slideRef.current
        const to = getToRef.current()
        const board = slide?.closest('.artist-board')
        if (!board || !slide || !to || !pathRef.current) return false
        const b = board.getBoundingClientRect()
        if (b.width === 0) return false
        const left =
          to instanceof Element
            ? to.getBoundingClientRect().left
            : slide.getBoundingClientRect().left + to.left
        return left < b.right - 4
      },
    }),
    [],
  )

  if (!segment) return null
  const { d } = buildCurve(segment.start, segment.end, bend)
  return (
    <>
      <path ref={pathRef} d={d} className='connector-line' />
      <path
        ref={arrowheadRef}
        className='connector-arrowhead'
        d='M0,0 L-9,-4.5 L-9,4.5 Z'
      />
    </>
  )
})

function ArtistContent({
  artist,
  onRegisterConnector,
  connectorBaseIndex = 0,
}) {
  const slideRef = useRef(null)
  const avatarRef = useRef(null)
  const secondaryRef = useRef(null)
  const primaryRef = useRef(null)
  const avatar2Ref = useRef(null)

  const getNextAvatar = () => {
    const slide = slideRef.current
    const avatar = avatarRef.current
    if (!slide || !avatar) return null
    const next = slide.nextElementSibling?.querySelector('.slide__avatar')
    if (next) return next
    // Last slide in the track: fake the next avatar one slide-width to the
    // right, in coordinates relative to this slide.
    const slideBox = slide.getBoundingClientRect()
    const avatarBox = avatar.getBoundingClientRect()
    return {
      left: avatarBox.left - slideBox.left + slideBox.width,
      top: avatarBox.top - slideBox.top,
      width: avatarBox.width,
      height: avatarBox.height,
      round: true,
    }
  }

  return (
    <div className={`artist-content-slide slide--${artist.name.replace(/\s+/g, '-').toLowerCase()}`} ref={slideRef}>
      <img
        ref={avatarRef}
        className='slide__avatar'
        src={artist.avatar}
        alt=''
      />

      <svg className='connector-overlay' aria-hidden='true'>
        {artist.avatar2 ? (
          <>
            <ConnectorArrow
              ref={(el) => onRegisterConnector?.(connectorBaseIndex + 0, el)}
              slideRef={slideRef}
              bend={1}
              getFrom={() => avatarRef.current}
              getTo={() => secondaryRef.current}
            />
            <ConnectorArrow
              ref={(el) => onRegisterConnector?.(connectorBaseIndex + 1, el)}
              slideRef={slideRef}
              bend={-1}
              getFrom={() => secondaryRef.current}
              getTo={() => avatar2Ref.current}
            />
            <ConnectorArrow
              ref={(el) => onRegisterConnector?.(connectorBaseIndex + 2, el)}
              slideRef={slideRef}
              bend={1}
              getFrom={() => avatar2Ref.current}
              getTo={() => primaryRef.current}
            />
            <ConnectorArrow
              ref={(el) => onRegisterConnector?.(connectorBaseIndex + 3, el)}
              slideRef={slideRef}
              bend={-1}
              getFrom={() => primaryRef.current}
              getTo={getNextAvatar}
            />
          </>
        ) : (
          <>
            <ConnectorArrow
              ref={(el) => onRegisterConnector?.(connectorBaseIndex + 0, el)}
              slideRef={slideRef}
              bend={1}
              getFrom={() => avatarRef.current}
              getTo={() => secondaryRef.current}
            />
            <ConnectorArrow
              ref={(el) => onRegisterConnector?.(connectorBaseIndex + 1, el)}
              slideRef={slideRef}
              bend={-1}
              getFrom={() => secondaryRef.current}
              getTo={() => primaryRef.current}
            />
            <ConnectorArrow
              ref={(el) => onRegisterConnector?.(connectorBaseIndex + 2, el)}
              slideRef={slideRef}
              bend={1}
              getFrom={() => primaryRef.current}
              getTo={getNextAvatar}
            />
          </>
        )}
      </svg>

      <img
        ref={secondaryRef}
        className='slide__secondary'
        src={artist.cardSecondary}
        alt={`${artist.name} on stage`}
      />
      <img
        ref={primaryRef}
        className='slide__primary'
        src={artist.cardPortrait}
        alt={`${artist.name} performing`}
      />

      {artist.avatar2 && (
        <img
          ref={avatar2Ref}
          className='slide__avatar2'
          src={artist.avatar2}
          alt=''
        />
      )}

      <h2 className='slide__name'>{artist.name}</h2>
    </div>
  )
}

const ArtistBoard = memo(function ArtistBoard({ artist }) {
  const dupes = [artist, artist, artist]
  const numConnectors = artist.avatar2 ? 4 : 3
  const connectorRefs = useRef([])
  const loopsRef = useRef(0)
  const trackRef = useRef(null)

  const registerConnector = (index, el) => {
    connectorRefs.current[index] = el
  }

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const START = -100 / 3
    const END = -200 / 3
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      gsap.set(track, { xPercent: START })
      return
    }

    const swapConnectors = () => {
      loopsRef.current += 1
      const arrows = connectorRefs.current
      const total = arrows.length
      for (let i = 0; i < total - numConnectors; i++) {
        const from = arrows[i + numConnectors]
        const to = arrows[i]
        if (from && to) to.setProgress(from.getProgress())
      }
      for (let i = Math.max(0, total - numConnectors); i < total; i++) {
        arrows[i]?.setProgress(0)
      }
    }

    const tween = gsap.fromTo(
      track,
      { xPercent: START },
      {
        xPercent: END,
        duration: 7,
        ease: 'none',
        repeat: -1,
        onRepeat: swapConnectors,
      },
    )
    const stopWatching = watchVisible(track, (visible) => tween.paused(!visible))
    return () => {
      stopWatching()
      tween.kill()
    }
  }, [numConnectors])

  useLayoutEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      connectorRefs.current.forEach((a) => a?.setProgress(1))
      return
    }

    let cancelled = false
    let timer = null
    let tween = null
    let L = numConnectors
    let seen = true
    for (let i = 0; i < numConnectors; i++) connectorRefs.current[i]?.setProgress(1)

    const wait = () => {
      timer = setTimeout(step, seen ? 60 : 400)
    }
    const stopWatching = trackRef.current
      ? watchVisible(trackRef.current, (visible) => {
        seen = visible
        tween?.paused(!visible)
      })
      : null

    const step = () => {
      if (cancelled) return
      if (!seen) return wait()
      const loops = loopsRef.current
      if (L < numConnectors * loops) L = numConnectors * loops
      const arrow = connectorRefs.current[L - numConnectors * loops]
      if (!arrow) return wait()
      if (arrow.getProgress() >= 1) {
        L += 1
        return step()
      }
      if (!arrow.canStart()) return wait()

      const current = L
      const prog = { v: 0 }
      tween = gsap.to(prog, {
        v: 1,
        duration: numConnectors === 4 ? 1.2 : 1.8,
        ease: 'power1.inOut',
        onUpdate: () => {
          connectorRefs.current[current - numConnectors * loopsRef.current]?.setProgress(
            prog.v,
          )
        },
        onComplete: () => {
          connectorRefs.current[current - numConnectors * loopsRef.current]?.setProgress(1)
          L = current + 1
          step()
        },
      })
    }

    step()

    return () => {
      cancelled = true
      stopWatching?.()
      clearTimeout(timer)
      tween?.kill()
    }
  }, [numConnectors])

  return (
    <div className='artist-board'>
      <img
        className='artist-board__texture'
        src={`${assetPathPrefix}/88fac.svg`}
        alt=''
      />
      <div className='board-marquee'>
        <div className='board-marquee-track' ref={trackRef}>
          {dupes.map((a, i) => (
            <ArtistContent
              artist={a}
              key={`${a.name}-${i}`}
              onRegisterConnector={registerConnector}
              connectorBaseIndex={i * numConnectors}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

function ArtistMobile() {
  const days = DAYS
  const sectionRef = useRef(null)
  const mobileBgRefs = useRef([])
  const mobileBoardRefs = useRef([])
  const [activeDay, setActiveDay] = useState(0)

  const scrollToArtist = useScrubCrossfade(sectionRef, {
    bgRefs: mobileBgRefs,
    portraitRefs: null,
    boardRefs: mobileBoardRefs,
    onIndexChange: setActiveDay,
  })

  const goToDay = (index) => {
    setActiveDay(index)
    scrollToArtist(index % artists.length)
  }

  return (
    <section
      ref={sectionRef}
      className='proshow-mobile'
      aria-label='Proshow artists mobile'
    >
      <div className='mobile-sticky-container'>
        <div className='mobile-bg-stack' aria-hidden='true'>
          {artists.map((artist, index) => (
            <div
              className='mobile-bg-layer'
              key={`m-bg-${artist.name}`}
              ref={(el) => {
                mobileBgRefs.current[index] = el
              }}
            >
              <TopoBackground
                fixed={false}
                background='#1c1c1c'
                lineColor='220, 220, 220'
                lineOpacity={0.16}
                seed={index + 7}
                style={{ zIndex: 0 }}
              />
            </div>
          ))}
        </div>

        <nav className='mobile-days' aria-label='Performance days'>
          {days.map((label, i) => (
            <button
              key={label}
              type='button'
              aria-selected={activeDay === i}
              className={activeDay === i ? 'is-active' : ''}
              onClick={() => goToDay(i)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className='mobile-pages-stack'>
          {artists.map((artist, index) => (
            <div
              key={artist.name}
              ref={(el) => {
                mobileBoardRefs.current[index] = el
              }}
              className='mobile-page-layer'
            >
              <div className='mobile-stage'>
                <ArtistBoard artist={artist} />
              </div>
              <h2 className='mobile-name'>{artist.name}</h2>
              <p className='mobile-desc'>
                Brace yourselves for a magical night as the legendary{' '}
                {artist.name} takes the stage. Get ready to sing, sway, and make
                memories!
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const sectionRef = useRef(null)
  const bgRefs = useRef([])
  const portraitRefs = useRef([])
  const boardRefs = useRef([])
  const [activeArtistIndex, setActiveArtistIndex] = useState(0)

  const scrollToArtist = useScrubCrossfade(sectionRef, {
    bgRefs,
    portraitRefs,
    boardRefs,
    onIndexChange: setActiveArtistIndex,
  })

  const handleSelectDay = (dayIndex) => {
    scrollToArtist(dayIndex % artists.length)
  }

  return (
    <div className='artist-root'>
      <style jsx global>{`
        @font-face {
          font-family: 'VCR OSD Mono';
          src: url('/fonts/VCR_OSD_MONO.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Bebas Neue';
          src: url('/fonts/BebasNeue-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Space Grotesk';
          src: url('/fonts/SpaceGrotesk-Variable.ttf') format('truetype');
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }

        html,
        body,
        .main-scroll {
          overscroll-behavior: none;
        }

        .artist-root {
          --background: #ffffff;
          --foreground: #171717;
          --font-bebas: 'Bebas Neue', sans-serif;
          --font-space: 'Space Grotesk', sans-serif;
          --font-vcr: 'VCR OSD Mono', monospace;
          --font-jockey: 'Jockey One', sans-serif;
          --color-background: var(--background);
          --color-foreground: var(--foreground);
          --font-sans: var(--font-space);
          --font-mono: var(--font-vcr);
          min-height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--background);
          color: var(--foreground);
          font-family: 'Space Grotesk', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .artist-root .font-jockey {
          font-family: 'Jockey One', sans-serif;
          font-weight: 400;
        }

        @media (prefers-color-scheme: dark) {
          .artist-root {
            --background: #0a0a0a;
            --foreground: #ededed;
          }
        }

        @font-face {
          font-family: 'Bebas Neue:Regular';
          src: url('https://static.figma.com/font/BebasNeue-Regular_1')
            format('woff2');
          font-style: normal;
          font-weight: 400;
        }

        @font-face {
          font-family: 'Hammersmith One:Regular';
          src: url('https://static.figma.com/font/HammersmithOne-Regular_2')
            format('woff2');
          font-style: normal;
          font-weight: 400;
        }

        @font-face {
          font-family: 'La Belle Aurore:Regular';
          src: url('https://static.figma.com/font/LaBelleAurore_1')
            format('woff2');
          font-style: normal;
          font-weight: 400;
        }

        @font-face {
          font-family: 'Mona Sans:Regular';
          src: url('https://static.figma.com/font/MonaSans_wdth_wght__1')
            format('woff2');
          font-style: normal;
          font-weight: 400;
        }

        .proshow-section {
          display: grid;
          grid-template-columns: minmax(0, 38%) minmax(0, 62%);
          background: #1c1c1c;
          position: relative;
          overflow: clip;
          isolation: isolate;
        }

        .global-bg-container {
          grid-column: 1 / -1;
          grid-row: 1 / -1;
          position: sticky;
          top: 0;
          height: 100dvh;
          width: 100%;
          z-index: 0;
          overflow: hidden;
        }

        .featured-column {
          grid-column: 1 / 2;
          grid-row: 1 / -1;
          position: relative;
          z-index: 1;
        }

        .featured-viewport {
          position: sticky;
          top: 0;
          height: 100dvh;
          overflow: visible;
        }

        .featured-bg-layer {
          position: absolute;
          inset: 0;
          overflow: hidden;
          will-change: opacity;
        }

        .featured-portrait-layer {
          position: absolute;
          inset: 0;
          overflow: visible;
          will-change: transform, opacity;
          z-index: 1;
        }

        .featured-portrait-layer:not(:first-child) {
          opacity: 0;
          visibility: hidden;
        }

        .schedule-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 3;
        }

        .schedule-layer .schedule-card {
          pointer-events: auto;
        }

        .featured-background {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .featured-bg-layer:first-child .featured-background {
          object-position: 58% center;
        }

        .featured-bg-layer:nth-child(2) .featured-background {
          object-position: center;
        }

        .artist-portrait {
          position: absolute;
          z-index: 1;
          pointer-events: none;
          object-fit: contain;
          object-position: bottom;
        }

        .artist-portrait--arijit {
          position: absolute;
          bottom: 0;
          left: 5%;
          width: 90%;
          height: 100%;
          max-width: none;
          object-fit: contain;
          object-position: bottom;
          transform: none;
        }

        .artist-portrait--day3 {
          position: absolute;
          bottom: 0;
          left: -4%;
          width: 91%;
          height: 100%;
          object-fit: contain;
          object-position: bottom;
        }

        /* -------------------------------------------------------------
           DESKTOP/LAPTOP SCHEDULE CARD: Shifted Higher & Proportionally Sized
           ------------------------------------------------------------- */
        .schedule-card {
          position: absolute;
          z-index: 3;
          top: 25%;
          right: -5%;
          width: min(320px, 50%);
          min-width: 260px;
          overflow: hidden;
          border: 1px solid #323231;
          border-radius: 14px;
          background: #202020;
          transition: border-color 0.3s ease, transform 0.3s ease;
        }

        /* Laptop View: proportionally scaled down without affecting inner layout */
        @media (max-width: 1440px) and (min-width: 769px) {
          .schedule-card {
            transform: scale(0.85);
            transform-origin: top right;
          }
        }

        .schedule-days {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: center;
          justify-items: center;
          height: 56px;
          padding: 0 14px;
          border-bottom: 1px solid #858585;
          font-family: 'Arial Black', sans-serif;
          font-size: 12px;
          font-weight: 900;
        }

        .schedule-days button {
          width: 100%;
          max-width: 110px;
          height: 36px;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          transition:
            background-color 0.3s ease,
            color 0.3s ease;
          color: #fff;
          cursor: pointer;
        }

        .schedule-days .is-active {
          background: rgb(235 154 88 / 90%);
          color: #1c1c1c;
        }

        .schedule-card p {
          margin: 0;
          padding: 20px 28px 20px;
          font-size: 15px;
          line-height: 1.2;
          font-variation-settings: 'wdth' 100;
          transition: opacity 0.25s ease;
        }

        .artist-list {
          grid-column: 2 / 3;
          grid-row: 1 / -1;
          position: relative;
          z-index: 2;
          min-width: 0;
        }

        .artist-list-viewport {
          position: sticky;
          top: 0;
          height: 100dvh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0;
        }

        .artist-board-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          overflow: hidden;
          will-change: transform, opacity;
          padding: 0;
        }

        .artist-board-layer:not(:first-child) {
          opacity: 0;
          visibility: hidden;
        }

        .artist-board {
          position: relative;
          height: 88dvh;
          width: auto;
          max-width: none;
          aspect-ratio: 831 / 743;
          overflow: hidden;
          border-radius: 24px;
          outline: 1px solid #85858463;
          container-type: inline-size;
          margin-left: 5vw;
          margin-right: -2vw;
          transform: translate(2vh, 2.5vh);
        }

        .artist-board__texture {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }

        .board-marquee {
          position: absolute;
          inset: 0;
          z-index: 3;
          overflow: hidden;
        }

        .board-marquee-track {
          display: flex;
          width: max-content;
          height: 100%;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .artist-content-slide {
          position: relative;
          width: 100cqi;
          aspect-ratio: 831 / 743;
          flex-shrink: 0;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .slide__avatar, .slide__avatar2 {
          position: absolute;
          z-index: 2;
          width: 16%;
          aspect-ratio: 1;
          border-radius: 50%;
          object-fit: cover;
        }

        .slide__secondary, .slide__primary {
          position: absolute;
          z-index: 2;
          width: 24%;
          height: 38%;
          object-fit: cover;
          border-radius: 12px;
        }

        /* --- DAY 2 SPECIFIC LAYOUT --- */
        .slide--day-2-artists .slide__avatar {
          top: 25%;
          left: 4%;
          width: 18%;
          height: 34%;
          aspect-ratio: auto;
          border-radius: 12px;
          object-position: center top;
        }
        .slide--day-2-artists .slide__secondary {
          top: 55%;
          left: 30%;
          width: 18%;
          height: 34%;
          border-radius: 12px;
        }
        .slide--day-2-artists .slide__avatar2 {
          top: 25%;
          left: 56%;
          width: 16%;
          height: auto;
          aspect-ratio: 1;
          border-radius: 50%;
        }
        .slide--day-2-artists .slide__primary {
          top: 55%;
          left: 80%;
          width: 16%;
          height: auto;
          aspect-ratio: 1;
          border-radius: 50%;
        }
        .slide--day-2-artists .slide__name {
          top: 10%;
          left: 40%;
        }

        /* --- DAY 3 SPECIFIC LAYOUT --- */
        .slide--day-3-artists .slide__avatar {
          top: 32%;
          left: 5%;
        }
        .slide--day-3-artists .slide__secondary {
          top: 55%;
          left: 32%;
        }
        .slide--day-3-artists .slide__primary {
          top: 10%;
          left: 68%;
        }
        .slide--day-3-artists .slide__name {
          top: 65%;
          left: 65%;
        }

        .slide__name {
          position: absolute;
          z-index: 3;
          margin: 0;
          color: white;
          font-family: 'La Belle Aurore:Regular', cursive;
          font-size: clamp(28px, 3.2vw, 52px);
          transform: rotate(-10deg);
        }

        .connector-overlay {
          position: absolute;
          inset: 0;
          z-index: 3;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }

        .connector-line {
          fill: none;
          stroke: #eb9a58;
          stroke-width: 3;
          stroke-linecap: round;
        }

        .connector-arrowhead {
          fill: #eb9a58;
        }

        @media (prefers-reduced-motion: reduce) {
          .featured-bg-layer,
          .featured-portrait-layer,
          .artist-board-layer {
            will-change: auto;
          }
        }

        .proshow-section.is-offscreen .global-bg-container,
        .proshow-section.is-offscreen .featured-viewport,
        .proshow-section.is-offscreen .artist-list-viewport,
        .proshow-mobile.is-offscreen .mobile-sticky-container {
          visibility: hidden;
        }

        .proshow-mobile {
          display: none;
        }

        /* -----------------------------------------------------------------
           MOBILE VIEW MODIFICATIONS
           ----------------------------------------------------------------- */
        @media (max-width: 768px) {
          html,
          body,
          .artist-root,
          .proshow-mobile,
          .main-scroll {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          html::-webkit-scrollbar,
          body::-webkit-scrollbar,
          .artist-root::-webkit-scrollbar,
          .proshow-mobile::-webkit-scrollbar,
          .main-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }

          .proshow-section {
            display: block;
            min-height: 0 !important;
          }

          .global-bg-container,
          .featured-column,
          .artist-list {
            display: none;
          }

          .proshow-mobile {
            display: block;
            position: relative;
            background: #1c1c1c;
            /* 200dvh of crossfade scroll + the 200dvh GPC overlaps at the end
               (one screen + its one-screen track margin; no --gpc-lead here).
               Keep in step with CROSSFADE_END_DVH / SECTION_SCROLL_DVH. */
            height: 400dvh;
          }

          .mobile-sticky-container {
            position: sticky;
            top: 0;
            height: 100dvh;
            width: 100%;
            overflow: hidden;
          }

          .mobile-bg-stack {
            position: absolute;
            inset: 0;
            z-index: 0;
          }

          .mobile-bg-layer {
            position: absolute;
            inset: 0;
            will-change: opacity;
          }

          .mobile-bg-layer img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.5;
          }

          .mobile-days {
            position: absolute;
            left: 6px;
            top: calc(65% - 35dvh - 48px);
            z-index: 10;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 16px;
            width: 58px;
            padding: 19px 18px;
            border: 1px solid #323231;
            border-radius: 12px;
            background: #202020;
          }

          .mobile-days button {
            padding: 18px 8px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #fff;
            font-family: 'Bebas Neue', 'Bebas Neue:Regular', sans-serif;
            font-size: 20px;
            letter-spacing: 0.04em;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            cursor: pointer;
            transition: background 0.3s ease, color 0.3s ease;
          }

          .mobile-days .is-active {
            background: #7786ff;
            color: #fff;
          }

          .mobile-pages-stack {
            position: absolute;
            inset: 0;
            z-index: 1;
          }

          .mobile-page-layer {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 12px 14px 24px 73px;
            will-change: opacity;
          }

          .mobile-page-layer:not(:first-child) {
            opacity: 0;
            visibility: hidden;
          }

          .mobile-stage {
            width: 100%;
            max-width: calc(100vw - 76px);
            margin: 0;
          }

          .mobile-stage .artist-board {
            border-radius: 18px;
            height: 54dvh;
            max-height: 460px;
            aspect-ratio: auto;
            margin-left: 0;
            margin-right: 0;
            transform: translate(-2px, 21px);
          }

          .mobile-stage .artist-content-slide {
            width: auto;
            height: 100%;
          }

          .mobile-name {
            position: relative;
            top: 34px;
            margin: 22px 0 0;
            color: #fff;
            font-family: 'Bebas Neue', 'Bebas Neue:Regular', sans-serif;
            font-size: clamp(6px, 12vw, 66px);
            line-height: 0.95;
            text-transform: uppercase;
          }

          .mobile-desc {
            position: relative;
            top: 24px;
            margin: 12px 0 0;
            font-size: 20.5px;
            line-height: 1.25;
            opacity: 0.92;
          }
        }
      `}</style>
      <main
        ref={sectionRef}
        className='proshow-section'
        id='proshow'
        // The crossfade's own scroll, plus the stretch at the end that GPC
        // overlaps (see CROSSFADE_END_DVH). Plain layout, not measured after
        // mount, so everything below is laid out against the right height from
        // the first render. Phones override it: .proshow-mobile is the section
        // there, and carries the same sum.
        style={{
          minHeight: `calc(${CROSSFADE_END_DVH}dvh + ${SECTION_SCROLL_DVH}dvh)`,
        }}
      >
        <div className='global-bg-container'>
          {artists.map((artist, index) => (
            <div
              className='featured-bg-layer'
              key={`bg-${artist.name}`}
              ref={(el) => {
                bgRefs.current[index] = el
              }}
            >
              <TopoBackground
                fixed={false}
                background='#1c1c1c'
                lineColor='220, 220, 220'
                lineOpacity={0.16}
                seed={index + 7}
                style={{ zIndex: 0 }}
              />
            </div>
          ))}
        </div>

        <section className='featured-column' aria-label='Featured artist'>
          <div className='featured-viewport'>
            {artists.map((artist, index) => (
              <div
                className='featured-portrait-layer'
                key={`portrait-${artist.name}`}
                ref={(el) => {
                  portraitRefs.current[index] = el
                }}
              >
                <img
                  className={artist.portraitClassName}
                  src={artist.portrait}
                  alt={`${artist.name} featured artist`}
                />
              </div>
            ))}
            <div className='schedule-layer'>
              <ScheduleCard
                artist={artists[activeArtistIndex]}
                activeIndex={activeArtistIndex}
                onSelectDay={handleSelectDay}
              />
            </div>
          </div>
        </section>

        <section className='artist-list' aria-label='Proshow artists'>
          <div className='artist-list-viewport'>
            {artists.map((artist, index) => (
              <div
                className='artist-board-layer'
                key={`board-layer-${artist.name}`}
                ref={(el) => {
                  boardRefs.current[index] = el
                }}
              >
                <ArtistBoard artist={artist} />
              </div>
            ))}
          </div>
        </section>

        <ArtistMobile />
      </main>
    </div>
  )
}
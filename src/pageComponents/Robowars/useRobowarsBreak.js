import { useEffect } from 'react'
import { touchStop } from '@/lib/touchStop'

// A break in the page just after Robowars: the spot where its last reveal is
// done and the section's bottom is at the bottom of the screen. Coming down out
// of Wheels, a hard scroll (a flick, a trackpad's momentum) carries on through
// the whole of Robowars and into the next section without it ever being seen.
// Here the page is stopped dead instead, however hard it was thrown, and the
// next scroll is what moves it on.
//
// The wheel / trackpad and the finger are different problems, so they are
// handled differently, the same way Artist and GPC do it:
//   - wheel / trackpad: Lenis is stopped at the break and held until the wheel
//     has been quiet for a moment, so the tail of the gesture that brought the
//     page here can't be read as the start of the next one.
//   - touch: scrolling is native (the finger, then momentum) and script has no
//     say while it moves, so the page is frozen at the break (lib/touchStop).
// Only coming down into the break stops. Scrolling up through it, or on past it
// with a fresh gesture, is untouched.

// The wheel has to be quiet this long before the page is handed back.
const GESTURE_GAP_MS = 180
// How far above the break the page has to have been for reaching it to count as
// an arrival to stop at, so a page resting on the spot isn't stopped again by
// the smallest nudge.
const ARM_PX = 80

export function useRobowarsBreak(timelineRef) {
  useEffect(() => {
    const timeline = timelineRef.current
    // Only the home page scrolls inside .main-scroll; the standalone /robowars
    // route scrolls the window and has nothing after Robowars to run into.
    const scroller = timeline?.closest('.main-scroll')
    if (!timeline || !scroller) return undefined

    // scrollTop at which the end of Robowars' timeline sits at the bottom of the
    // scroller: its own ScrollTrigger's `end`, and where Wheels already glides
    // to. Measured each time, since layout shifts as images load.
    const breakAt = () =>
      scroller.scrollTop +
      timeline.getBoundingClientRect().bottom -
      scroller.getBoundingClientRect().bottom

    const touchScreen = window.matchMedia('(pointer: coarse)').matches
    let last = scroller.scrollTop
    let armed = last < breakAt() - ARM_PX

    if (touchScreen) {
      const stopper = touchStop(scroller)

      const onScroll = () => {
        const scroll = scroller.scrollTop
        if (stopper.stopped) {
          last = scroll
          return
        }
        const at = breakAt()
        // (A jump of a screen or more in one step is the page being sent
        // somewhere, not a swipe.)
        const swiped = Math.abs(scroll - last) < scroller.clientHeight
        if (armed && swiped && last < at && scroll >= at) {
          armed = false
          stopper.stopAt(at)
          last = at
          return
        }
        if (scroll < at - ARM_PX) armed = true
        last = scroll
      }

      scroller.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        scroller.removeEventListener('scroll', onScroll)
        stopper.dispose()
      }
    }

    let held = false
    let braking = false
    let gateTimer = 0

    const release = () => {
      held = false
      window.__lenis?.start()
    }
    // Kept held for as long as the wheel is still moving.
    const holdUntilQuiet = () => {
      window.clearTimeout(gateTimer)
      gateTimer = window.setTimeout(release, GESTURE_GAP_MS)
    }

    const onScroll = () => {
      const scroll = scroller.scrollTop
      if (held || braking) {
        last = scroll
        return
      }
      const at = breakAt()
      if (armed && last < at && scroll >= at) {
        armed = false
        braking = true
        const lenis = window.__lenis
        // Back onto the spot, over any overshoot, and with no glide left running.
        lenis?.scrollTo(at, { immediate: true, force: true })
        if (Math.abs(scroller.scrollTop - at) > 0.5) scroller.scrollTop = at
        lenis?.stop()
        held = true
        holdUntilQuiet()
        braking = false
        last = at
        return
      }
      if (scroll < at - ARM_PX) armed = true
      last = scroll
    }
    const onWheel = () => {
      if (held) holdUntilQuiet()
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    scroller.addEventListener('wheel', onWheel, { capture: true, passive: true })
    // Lenis reports each step it takes before the frame is painted; the native
    // scroll event is a frame late, which at speed is a lot of overshoot.
    const offLenisScroll = window.__lenis?.on('scroll', onScroll)

    return () => {
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('wheel', onWheel, { capture: true })
      offLenisScroll?.()
      window.clearTimeout(gateTimer)
      if (held) window.__lenis?.start()
    }
  }, [timelineRef])
}

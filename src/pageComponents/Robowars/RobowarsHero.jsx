'use client'

import { useRef } from 'react'
import Image from 'next/image'
import localFont from 'next/font/local'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  ROBOWARS_FRAME_HEIGHT,
  ROBOWARS_FRAME_WIDTH,
  ROBOWARS_TV_SCREEN,
  TV_ART_STYLE,
} from '../wheels/robowarsHandoff'
import './robowars.css'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import { useRobowarsBreak } from './useRobowarsBreak'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Figma: "Calm Serif" — used for the main serif headline
const calmSerif = localFont({
  src: '../../../public/fonts/calm-serif-demo.woff2',
  variable: '--font-calm-serif-local',
  display: 'swap',
})

// Figma: "Alata" — used for date, arena specs, prize text
const alata = localFont({
  src: '../../../public/fonts/alata-regular.woff2',
  variable: '--font-alata-local',
  display: 'swap',
})

// "Bowlby One SC" — used for ROBO WARS headline
const bowlbyOneSC = localFont({
  src: '../../../public/fonts/BowlbyOneSC-Regular.woff2',
  variable: '--font-bowlby-one-sc-local',
  display: 'swap',
})

const ASSET_ROOT = 'https://cdn-next-main.tathva.org/images/Robowars'
const FRAME_WIDTH = ROBOWARS_FRAME_WIDTH
const FRAME_HEIGHT = ROBOWARS_FRAME_HEIGHT
const MOBILE_FRAME_WIDTH = 412
const MOBILE_FRAME_HEIGHT = 594

function frameStyle({
  x,
  y,
  width,
  height,
  frameWidth = FRAME_WIDTH,
  frameHeight = FRAME_HEIGHT,
}) {
  return {
    left: `${(x / frameWidth) * 100}%`,
    top: `${(y / frameHeight) * 100}%`,
    width: `${(width / frameWidth) * 100}%`,
    height: `${(height / frameHeight) * 100}%`,
  }
}

function Art({
  src,
  alt = '',
  x,
  y,
  width,
  height,
  frameWidth,
  frameHeight,
  priority = false,
  className = '',
}) {
  return (
    <div
      className={`absolute ${className}`}
      style={frameStyle({ x, y, width, height, frameWidth, frameHeight })}
    >
      <Image
        src={`${ASSET_ROOT}/${src}`}
        alt={alt}
        fill
        priority={priority}
        sizes={`${Math.ceil(width)}px`}
        draggable={false}
        className='robowars-art select-none object-fill'
      />
    </div>
  )
}

function DesktopFrame({ className, scale = 'desktop', containerRef }) {
  const isTablet = scale === 'tablet'

  return (
    <div
      ref={containerRef}
      className={`absolute left-1/2 top-1/2 aspect-[1413/697] -translate-x-1/2 -translate-y-1/2 [container-type:size] ${className}`}
    >
      <Image
        src={`${ASSET_ROOT}/arena-bg.webp`}
        alt=''
        fill
        priority={!isTablet}
        sizes={isTablet ? '112vw' : '100vw'}
        draggable={false}
        className='object-cover'
      />

      {/* The docked Wheels TV, now dark, carried over as a background prop to
          bridge the two sections. Same geometry as
          the Wheels TV, which docks exactly on top of it before fading out. */}
      <div
        aria-hidden='true'
        data-robowars-tv-screen
        className='pointer-events-none absolute opacity-90'
        style={frameStyle(ROBOWARS_TV_SCREEN)}
      >
        <div className='absolute' style={TV_ART_STYLE}>
          <Image
            src='https://cdn-next-main.tathva.org/wheels/tv.webp'
            alt=''
            fill
            sizes='440px'
            className='object-fill'
          />
        </div>
        <div className='absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[6px] bg-black/95 px-3 py-2'>
          <span className='robowars-motion robowars-sponsor-text font-alata text-[0.65cqw] uppercase tracking-[0.25em] text-white/75 mb-1.5 select-none'>
            In Association With
          </span>
          <div className='relative w-[90%] aspect-[1200/360] max-h-[62%] flex items-center justify-center'>
            {/* White BOT LEAGUE Text - appears first */}
            <div className='robowars-motion robowars-sponsor-text absolute inset-0 w-full h-full will-change-transform'>
              <Image
                src='/images/Robowars/bot-league-text.png'
                alt='Bot League'
                fill
                sizes='320px'
                className='object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.35)]'
              />
            </div>
            {/* Blue bar - slides in from left */}
            <div className='robowars-motion robowars-sponsor-blue absolute inset-0 w-full h-full will-change-transform'>
              <Image
                src='/images/Robowars/bot-league-blue.png'
                alt=''
                fill
                sizes='320px'
                className='object-contain drop-shadow-[0_0_10px_rgba(0,102,255,0.7)]'
              />
            </div>
            {/* Red bar - slides in from right */}
            <div className='robowars-motion robowars-sponsor-red absolute inset-0 w-full h-full will-change-transform'>
              <Image
                src='/images/Robowars/bot-league-red.png'
                alt=''
                fill
                sizes='320px'
                className='object-contain drop-shadow-[0_0_10px_rgba(255,30,30,0.7)]'
              />
            </div>
          </div>
        </div>
      </div>

      <Art
        src='arena-left-robot.webp'
        alt=''
        x={isTablet ? -28 : -14}
        y={isTablet ? 108 : 109}
        width={368}
        height={612}
        priority={!isTablet}
        className='robowars-motion robowars-robot robowars-left-robot pointer-events-none'
      />
      <Art
        src='arena-right-robot.webp'
        alt=''
        x={1047}
        y={isTablet ? 59 : 60}
        width={394}
        height={661}
        priority={!isTablet}
        className='robowars-motion robowars-robot robowars-right-robot pointer-events-none'
      />

      <div
        className='pointer-events-none absolute grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start justify-center gap-x-[1.9cqw] text-white uppercase'
        style={frameStyle({ x: 405, y: 217, width: 602, height: 174 })}
      >
        <div className='robowars-motion robowars-title-left font-bowlby-one-sc text-right text-[5.71cqw] leading-[0.95] will-change-transform'>
          ROBO
        </div>
        <div className='robowars-motion robowars-title-right font-bowlby-one-sc text-left text-[5.71cqw] leading-[0.95] will-change-transform'>
          WARS
        </div>
        <div className='robowars-motion robowars-title-left font-calm-serif text-right text-[4.58cqw] leading-[1.15] will-change-transform'>
          ENTER
        </div>
        <div className='robowars-motion robowars-title-right font-calm-serif text-left text-[4.58cqw] leading-[1.15] will-change-transform'>
          ARENA
        </div>
      </div>

      <div
        className='robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform'
        style={frameStyle({ x: 496, y: 408, width: 422, height: 30 })}
      >
        <span className='h-[2px] w-[32%] bg-white' />
        <span className='font-alata whitespace-nowrap text-[1.85cqw] leading-[1.25]'>
          OCT 9,10
        </span>
        <span className='h-[2px] w-[32%] bg-white' />
      </div>

      <div
        className='robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[1.38cqw] leading-[1.18] uppercase will-change-transform'
        style={frameStyle({ x: 489, y: 480, width: 183, height: 56 })}
      >
        <p className='m-0 text-white'>PRIZES WORTH INR</p>
        <p className='m-0 text-[#eb9a58]'>8 LAKH</p>
      </div>
      <div
        className='robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[1.38cqw] leading-[1.22] uppercase text-white will-change-transform'
        style={frameStyle({ x: 739, y: 480, width: 252, height: 56 })}
      >
        <p className='m-0'>16 x 16 FT. ARENA</p>
        <p className='m-0'>8KG \ 15KG</p>
      </div>
      <div
        className='robowars-motion robowars-date pointer-events-none absolute w-px bg-white/55 will-change-transform'
        style={frameStyle({ x: 706, y: 488, width: 1, height: 37 })}
      />
    </div>
  )
}

function MobileFrame({ containerRef }) {
  return (
    <div
      ref={containerRef}
      className='absolute left-1/2 top-1/2 aspect-[412/594] w-screen -translate-x-1/2 -translate-y-1/2 [container-type:size] md:hidden'
    >
      <Image
        src={`${ASSET_ROOT}/mobile-background.webp`}
        alt=''
        fill
        priority
        sizes='(max-width: 767px) 100vw, 0px'
        draggable={false}
        className='object-cover'
      />

      <Art
        src='arena-left-robot.webp'
        alt=''
        x={-54}
        y={34}
        width={228}
        height={379}
        frameWidth={MOBILE_FRAME_WIDTH}
        frameHeight={MOBILE_FRAME_HEIGHT}
        priority
        className='robowars-motion robowars-robot robowars-left-robot pointer-events-none'
      />
      <Art
        src='arena-right-robot.webp'
        alt=''
        x={240}
        y={42}
        width={226}
        height={378}
        frameWidth={MOBILE_FRAME_WIDTH}
        frameHeight={MOBILE_FRAME_HEIGHT}
        priority
        className='robowars-motion robowars-robot robowars-right-robot pointer-events-none'
      />

      {/* Sponsor Lockup - Centered directly above ROBO WARS */}
      <div
        className='pointer-events-none absolute flex flex-col items-center justify-center text-center'
        style={frameStyle({
          x: 0,
          y: 318,
          width: MOBILE_FRAME_WIDTH,
          height: 60,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <span className='robowars-motion robowars-sponsor-text font-alata text-[2.2cqw] uppercase tracking-[0.25em] text-white/75 mb-1.5 select-none'>
          In Association With
        </span>
        <div className='relative w-[150px] aspect-[1200/360] max-h-[30px] flex items-center justify-center'>
          {/* White BOT LEAGUE Text - appears first */}
          <div className='robowars-motion robowars-sponsor-text absolute inset-0 w-full h-full will-change-transform'>
            <Image
              src='/images/Robowars/bot-league-text.png'
              alt='Bot League'
              fill
              sizes='150px'
              className='object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]'
            />
          </div>
          {/* Blue bar - slides in from left */}
          <div className='robowars-motion robowars-sponsor-blue absolute inset-0 w-full h-full will-change-transform'>
            <Image
              src='/images/Robowars/bot-league-blue.png'
              alt=''
              fill
              sizes='150px'
              className='object-contain drop-shadow-[0_0_8px_rgba(0,102,255,0.7)]'
            />
          </div>
          {/* Red bar - slides in from right */}
          <div className='robowars-motion robowars-sponsor-red absolute inset-0 w-full h-full will-change-transform'>
            <Image
              src='/images/Robowars/bot-league-red.png'
              alt=''
              fill
              sizes='150px'
              className='object-contain drop-shadow-[0_0_8px_rgba(255,30,30,0.7)]'
            />
          </div>
        </div>
      </div>

      <div
        className='pointer-events-none absolute text-center uppercase text-white'
        style={frameStyle({
          x: 63,
          y: 386,
          width: 286,
          height: 66,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <p className='robowars-motion robowars-title-left m-0 whitespace-nowrap font-bowlby-one-sc text-[8.35cqw] leading-[0.95] will-change-transform'>
          ROBO WARS
        </p>
        <p className='robowars-motion robowars-title-right m-0 font-calm-serif text-[6.9cqw] leading-[1.05] normal-case will-change-transform'>
          Enter Arena
        </p>
      </div>

      <div
        className='robowars-motion robowars-date pointer-events-none absolute flex items-center justify-between text-white will-change-transform'
        style={frameStyle({
          x: 134,
          y: 460,
          width: 164,
          height: 12,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <span className='h-px w-[31%] bg-white/70' />
        <span className='font-alata whitespace-nowrap text-[2.45cqw] tracking-[0.18em] uppercase leading-none text-white/90'>
          OCT 9–10
        </span>
        <span className='h-px w-[31%] bg-white/70' />
      </div>

      <div
        className='robowars-motion robowars-prizes pointer-events-none absolute text-right font-alata text-[2.25cqw] leading-[1.15] uppercase will-change-transform'
        style={frameStyle({
          x: 118,
          y: 498,
          width: 81,
          height: 42,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <p className='m-0 text-white'>PRIZES WORTH</p>
        <p className='m-0 text-white'>INR</p>
        <p className='m-0 text-[#eb9a58]'>8 LAKH</p>
      </div>
      <div
        className='robowars-motion robowars-arena pointer-events-none absolute text-left font-alata text-[2.25cqw] leading-[1.38] uppercase text-white will-change-transform'
        style={frameStyle({
          x: 219,
          y: 498,
          width: 145,
          height: 30,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      >
        <p className='m-0'>16 x 16 FT. ARENA</p>
        <p className='m-0'>8KG \ 15KG</p>
      </div>
      <div
        className='robowars-motion robowars-date pointer-events-none absolute w-px bg-white/55 will-change-transform'
        style={frameStyle({
          x: 209,
          y: 501,
          width: 1,
          height: 24,
          frameWidth: MOBILE_FRAME_WIDTH,
          frameHeight: MOBILE_FRAME_HEIGHT,
        })}
      />
    </div>
  )
}

// leadInVh: extra scroll distance the stage stays pinned before its own scroll
// animation starts — used when it's pulled up underneath Wheels on the home page.
export default function RobowarsHero({ leadInVh = 0 }) {
  const sectionRef = useRef(null)
  const timelineRef = useRef(null)
  const desktopXlRef = useRef(null)
  const desktopTabletRef = useRef(null)
  const mobileRef = useRef(null)

  useRobowarsBreak(timelineRef)

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      let media
      let refreshTimer

      const ctx = gsap.context(() => {
        const pieces = gsap.utils.toArray('.robowars-motion')

        if (reduceMotion) {
          gsap.set(pieces, {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
          })
          return
        }

        // root scopes every selector to the one currently-visible frame variant
        // (desktop-xl / tablet / mobile all share class names and sit in the DOM
        // at once, only one shown via CSS at a time) — without this, every scrub
        // tween below was driving 3x the elements it needed to, tripling the
        // per-frame style work for two copies nobody can see.
        const setInitialMotion = (
          root,
          { robotDistance, titleDistance, detailDistance },
        ) => {
          gsap.set(root.querySelectorAll('.robowars-left-robot'), {
            opacity: 0.3,
            transform: `translate3d(-${robotDistance}%, 0, 0) scale(0.96)`,
          })
          gsap.set(root.querySelectorAll('.robowars-right-robot'), {
            opacity: 0.3,
            transform: `translate3d(${robotDistance}%, 0, 0) scale(0.96)`,
          })
          gsap.set(root.querySelectorAll('.robowars-sponsor-text'), {
            opacity: 0,
            transform: 'scale(0.88) translate3d(0, -8px, 0)',
          })
          gsap.set(root.querySelectorAll('.robowars-sponsor-blue'), {
            opacity: 0,
            transform: 'translate3d(-50px, 0, 0)',
          })
          gsap.set(root.querySelectorAll('.robowars-sponsor-red'), {
            opacity: 0,
            transform: 'translate3d(50px, 0, 0)',
          })
          gsap.set(root.querySelectorAll('.robowars-title-left'), {
            opacity: 0,
            transform: `translate3d(-${titleDistance}%, 0, 0) scale(0.97)`,
          })
          gsap.set(root.querySelectorAll('.robowars-title-right'), {
            opacity: 0,
            transform: `translate3d(${titleDistance}%, 0, 0) scale(0.97)`,
          })
          gsap.set(root.querySelectorAll('.robowars-date'), {
            opacity: 0,
            transform: `translate3d(0, ${detailDistance}%, 0) scale(0.98)`,
          })
          gsap.set(root.querySelectorAll('.robowars-prizes'), {
            opacity: 0,
            transform: `translate3d(-${detailDistance}%, 14%, 0) scale(0.98)`,
          })
          gsap.set(root.querySelectorAll('.robowars-arena'), {
            opacity: 0,
            transform: `translate3d(${detailDistance}%, 14%, 0) scale(0.98)`,
          })
        }

        // Quick camera-shake on the whole section, played once each time the
        // scrub crosses the point where the two robots meet at center.
        const triggerCollisionShake = () => {
          const target = sectionRef.current
          if (!target) return
          gsap
            .timeline()
            .to(target, { x: 14, y: -8, duration: 0.05, ease: 'power1.out' })
            .to(target, { x: -12, y: 8, duration: 0.06 })
            .to(target, { x: 9, y: -6, duration: 0.06 })
            .to(target, { x: -6, y: 4, duration: 0.07 })
            .to(target, { x: 3, y: -2, duration: 0.07 })
            .to(target, { x: 0, y: 0, duration: 0.09, ease: 'power2.out' })
        }

        // A `.call()` inside a scrubbed timeline only fires if the scrub's own
        // catch-up tween happens to render through that exact position, which
        // it can skip during fast or uneven scrolling — that's why the shake
        // was intermittent. Watching this trigger's own onUpdate and firing on
        // a progress-0.5 crossing instead reads the *raw* scroll-driven
        // progress directly (not the smoothed scrub tween), so it can't be
        // skipped, and it's exactly aligned with the robots' own tween (which
        // starts at timeline position 0 and finishes at 0.5, its default
        // duration) since it's the same self.progress the timeline itself
        // uses — unlike a separate "50% top" trigger, whose position string
        // ignores viewport height and lands half a screen off from where the
        // scrub's progress actually reaches 0.5.
        let lastProgress = 0
        // Tracks the fastest speed (px/s) seen since the last time a snap
        // decision consumed it. Coming to rest *means* decelerating to ~0,
        // so by the time the snap's debounce fires — after scrolling has
        // already stopped — the instantaneous velocity is always near zero,
        // for a hard flick exactly as much as a slow scroll. The peak over
        // the gesture is what actually tells them apart.
        let peakVelocity = 0
        const checkCollisionCrossing = (self) => {
          const velocity = Math.abs(self.getVelocity())
          if (velocity > peakVelocity) peakVelocity = velocity
          const progress = self.progress
          if (lastProgress < 0.5 !== progress < 0.5) triggerCollisionShake()
          lastProgress = progress
        }

        // Timeline positions (in timeline-time, not 0-1 progress) where each
        // reveal beat starts. Named so the snap stops below can't drift out
        // of sync with the tweens that actually define them.
        const BEAT_ROBOTS = 0
        const BEAT_TITLE = 0.22
        const BEAT_DATE = 0.38
        const BEAT_DETAILS = 0.5

        // A gesture whose peak speed (px/s) exceeded this counts as "hard"
        // for snapping purposes. Below it, scroll behaves exactly as before
        // — free, 1:1 scrubbing — so a deliberate scroll-and-read never gets
        // yanked anywhere. This only means anything for wheel/trackpad
        // input, which Lenis itself smooths (`smoothWheel`) — self.getVelocity()
        // is reading Lenis's own eased output.
        const HARD_SCROLL_VELOCITY = 900

        // Touch screens scroll natively — Lenis's `syncTouch` is off (see
        // SmoothScroll), so a swipe's momentum is driven by the OS, not
        // Lenis, and there's no Lenis-smoothed velocity for it to read a
        // "hard flick" off of the way wheel input has. Gating on
        // HARD_SCROLL_VELOCITY there means the gate just never opens, so
        // every touch gesture is instead treated as reaching for whichever
        // beat it's closest to once it comes to rest (same reasoning as the
        // Artist section's touch handling).
        const touchScreen = window.matchMedia('(pointer: coarse)').matches

        const buildTimeline = (root) => {
          const timeline = gsap.timeline({
            defaults: { ease: 'power2.out' },
            scrollTrigger: {
              scroller: document.querySelector('.main-scroll') || window,
              trigger: timelineRef.current,
              start: 'top top',
              end: 'bottom bottom',
              // Lenis already smooths the scroll position itself (momentum,
              // inertia), so a numeric scrub here would add a *second*,
              // independent second of catch-up lag on top of that — the
              // animation visibly chasing an already-smoothed value. `true`
              // ties it directly to Lenis's output with no extra delay.
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: checkCollisionCrossing,
              // A hard/fast scroll otherwise blows straight through the
              // whole robots -> title -> date -> details reveal in one
              // motion, since scrub:true maps scroll position to animation
              // progress 1:1 with no resistance. This catches only that
              // case: a fast gesture eases to rest on the nearest reveal
              // beat instead of wherever raw momentum would have landed, so
              // the sequence visibly pauses there instead of flashing past.
              snap: {
                snapTo: (value, trigger) => {
                  const velocity = peakVelocity
                  peakVelocity = 0
                  if (!touchScreen && velocity < HARD_SCROLL_VELOCITY) {
                    return value
                  }

                  const total = timeline.duration()
                  const stops = [
                    BEAT_ROBOTS / total,
                    BEAT_TITLE / total,
                    BEAT_DATE / total,
                    BEAT_DETAILS / total,
                    1,
                  ]
                  const target = stops.reduce((nearest, stop) =>
                    Math.abs(stop - value) < Math.abs(nearest - value)
                      ? stop
                      : nearest,
                  )
                  if (Math.abs(target - value) < 0.001) return value

                  // Lenis owns `.main-scroll`'s real scrollTop and keeps
                  // writing it on its own rAF tick, so letting ScrollTrigger
                  // tween the scroll position itself here would fight Lenis
                  // for the same value every frame. Handing the move to
                  // Lenis and resting ScrollTrigger at its current value
                  // (below) avoids that fight — see the Artist section's
                  // snap, which does the same for the same reason.
                  const lenis = window.__lenis
                  if (!lenis || lenis.isStopped || lenis.isLocked) {
                    return value
                  }
                  const range = trigger.end - trigger.start
                  lenis.scrollTo(trigger.start + range * target, {
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

          timeline
            .to(
              root.querySelectorAll('.robowars-sponsor-text'),
              {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                duration: 0.32,
              },
              BEAT_ROBOTS,
            )
            .to(
              root.querySelectorAll(
                '.robowars-sponsor-blue, .robowars-sponsor-red',
              ),
              {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                duration: 0.36,
              },
              BEAT_ROBOTS + 0.12,
            )
            .to(
              root.querySelectorAll(
                '.robowars-left-robot, .robowars-right-robot',
              ),
              {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                duration: 0.3,
              },
              BEAT_ROBOTS,
            )
            .to(
              root.querySelectorAll(
                '.robowars-title-left, .robowars-title-right',
              ),
              {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                duration: 0.24,
              },
              BEAT_TITLE,
            )
            .to(
              root.querySelectorAll('.robowars-date'),
              {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                duration: 0.2,
              },
              BEAT_DATE,
            )
            .to(
              root.querySelectorAll('.robowars-prizes, .robowars-arena'),
              {
                opacity: 1,
                transform: 'translate3d(0, 0, 0) scale(1)',
                duration: 0.2,
              },
              BEAT_DETAILS,
            )
        }

        media = gsap.matchMedia()
        media.add('(max-width: 767px)', () => {
          const root = mobileRef.current
          if (!root) return
          setInitialMotion(root, {
            robotDistance: 36,
            titleDistance: 8,
            detailDistance: 12,
          })
          buildTimeline(root)
        })
        media.add('(min-width: 768px) and (max-width: 1279px)', () => {
          const root = desktopTabletRef.current
          if (!root) return
          setInitialMotion(root, {
            robotDistance: 45,
            titleDistance: 10,
            detailDistance: 14,
          })
          buildTimeline(root)
        })
        media.add('(min-width: 1280px)', () => {
          const root = desktopXlRef.current
          if (!root) return
          setInitialMotion(root, {
            robotDistance: 50,
            titleDistance: 12,
            detailDistance: 18,
          })
          buildTimeline(root)
        })
      }, sectionRef)

      const refreshTrigger = () => {
        window.clearTimeout(refreshTimer)
        refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
      }

      const animationFrame = window.requestAnimationFrame(() =>
        ScrollTrigger.refresh(),
      )
      window.addEventListener('orientationchange', refreshTrigger)
      window.visualViewport?.addEventListener('resize', refreshTrigger)

      return () => {
        window.cancelAnimationFrame(animationFrame)
        window.clearTimeout(refreshTimer)
        window.removeEventListener('orientationchange', refreshTrigger)
        window.visualViewport?.removeEventListener('resize', refreshTrigger)
        media?.revert()
        ctx.revert()
      }
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      aria-labelledby='robowars-title'
      className={`${calmSerif.variable} ${alata.variable} ${bowlbyOneSC.variable} relative w-full shrink-0 bg-black text-white [--robowars-h:max(180dvh,900px)] md:[--robowars-h:max(180dvh,1100px)] xl:[--robowars-h:max(180dvh,940px)] motion-reduce:[--robowars-h:100dvh]`}
      style={{ height: `calc(${leadInVh}vh + var(--robowars-h))` }}
    >
      {/* Scroll range of the robots/title animation: the section minus the lead-in */}
      <div
        ref={timelineRef}
        data-robowars-timeline
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-(--robowars-h)"
      />

      <h1 id='robowars-title' className='sr-only'>
        Robo Wars Enter Arena
      </h1>

      <div
        data-robowars-stage
        className='sticky top-0 h-dvh min-h-[560px] w-full overflow-hidden will-change-transform'
      >
        {/* Zoomed in by default; WheelsExperience scales this back down to 1
            as the docking TV's backdrop fades, so the arena zooms out in sync
            with the TV shrinking instead of popping in at full size early. */}
        {/* Width grows past 100vw/112vw whenever the viewport is taller/narrower
            than the 1413:697 arena art — aspect-ratio then derives the height
            from that wider box, so arena-bg (object-cover) always fills the
            full viewport instead of letterboxing top and bottom. */}
        <DesktopFrame
          className='hidden min-w-full min-h-full w-[max(100vw,203dvh)] xl:block'
          containerRef={desktopXlRef}
        />
        <DesktopFrame
          className='hidden min-w-full min-h-full w-[max(112vw,228dvh)] md:block xl:hidden'
          scale='tablet'
          containerRef={desktopTabletRef}
        />
        <MobileFrame containerRef={mobileRef} />
      </div>
    </section>
  )
}

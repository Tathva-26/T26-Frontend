'use client'

import { useState } from 'react'
import { PASS_EVENT_TYPE } from '@/lib/api'
import { useEvents } from '@/hooks/useEvents'
import Checkout from '@/components/Checkout/Checkout'
import Navbar from '@/pageComponents/Navbar/Navbar'
import { useNavbarScope } from '@/pageComponents/Navbar/NavbarContext'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import LightPillar from '@/components/LightPillar/LightPillar'

// `picture` is nullable on a pass event, and next/image (and a plain <img>)
// need a src, so unillustrated passes fall back to a generic ticket graphic.
const FALLBACK_IMAGE = 'https://cdn-next-main.tathva.org/images/tickets/day2pass.webp'

// A short tap buzz for switching tickets. No-op on browsers/devices without
// the Vibration API (desktop, iOS Safari) — feature-detected, never thrown.
const vibrate = (duration = 12) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(duration)
}

export default function TathvaPasses() {
  const inNavbarScope = useNavbarScope()

  // null = no manual selection yet, so the carousel opens centred on
  // whichever pass loads in, without setState-in-an-effect to get there.
  const [chosenIndex, setChosenIndex] = useState(null)

  // Passes are ordinary bookable events (GET /api/events/all?type=passes) —
  // the carousel is built straight from whatever the backend returns, not a
  // hardcoded list, so an added/removed/repriced pass shows up on its own.
  const { events: passes, loading } = useEvents(PASS_EVENT_TYPE, {
    label: 'Pass',
    fallbackImage: FALLBACK_IMAGE,
  })

  const activeIndex =
    chosenIndex !== null ? chosenIndex : Math.floor((passes.length - 1) / 2)

  const active = passes[activeIndex] ?? null

  const handlePrev = () => {
    vibrate()
    setChosenIndex(activeIndex === 0 ? passes.length - 1 : activeIndex - 1)
  }

  const handleNext = () => {
    vibrate()
    setChosenIndex(activeIndex === passes.length - 1 ? 0 : activeIndex + 1)
  }

  return (
    <main className='relative flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden bg-black select-none font-sans text-white'>
      {!inNavbarScope && <Navbar />}
      <TathvaMenu />
      <div className='pointer-events-none absolute inset-0 z-[5] overflow-hidden'>
        <LightPillar
          topColor='#5227FF'
          bottomColor='#FF9FFC'
          intensity={0.6}
          rotationSpeed={0.2}
          glowAmount={0.002}
          pillarWidth={7.4}
          pillarHeight={0.2}
          noiseIntensity={0.1}
          pillarRotation={58}
          interactive={false}
          mixBlendMode='normal'
          quality='medium'
        />
      </div>

      {/* -------------------------------------------------------------
          CYBERPUNK SIDE GLOW RODS (MIDDLE-ALIGNED ON MOBILE & DESKTOP)
      ------------------------------------------------------------- */}
      {/* <div className='pointer-events-none absolute left-1 sm:left-4 md:left-8 top-[55%] sm:top-1/2 z-20 -translate-y-1/2'>
        <img
          src='https://cdn-next-main.tathva.org/images/tickets/leftrod.svg'
          alt=''
          className='h-[55vh] sm:h-[65vh] max-h-[580px] w-auto object-contain drop-shadow-[0_0_15px_rgba(138,56,245,0.8)]'
        />
      </div> */}

      {/* <div className='pointer-events-none absolute right-1 sm:right-4 md:right-8 top-[55%] sm:top-1/2 z-20 -translate-y-1/2'>
        <img
          src='https://cdn-next-main.tathva.org/images/tickets/rightrod.svg'
          alt=''
          className='h-[55vh] sm:h-[65vh] max-h-[580px] w-auto object-contain drop-shadow-[0_0_15px_rgba(138,56,245,0.8)]'
        />
      </div> */}

      {/* -------------------------------------------------------------
          HERO TITLE & SUBTITLE (AKIRA EXPANDED FONT)
      ------------------------------------------------------------- */}
      <div className='relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 pt-28 sm:pt-28 md:pt-28 lg:pt-32 pb-10 sm:pb-14 text-center'>
        <h1
          className='text-4xl font-black tracking-[0.12em] text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]'
          style={{ fontFamily: "'Akira Expanded', 'Orbitron', sans-serif" }}
        >
          TATHVA PASSES
        </h1>
        <p
          className='mt-2 text-[10px] font-bold tracking-[0.22em] text-white sm:text-xs md:text-sm lg:text-base'
          style={{ fontFamily: "'Akira Expanded', 'Orbitron', sans-serif" }}
        >
          GET THE PASS ENJOY EVERY MOMENT
        </p>

        {/* -------------------------------------------------------------
            TICKET CAROUSEL & NAVIGATION
            Mobile: Vertical rotation (Top/Center/Bottom/Far) with middle largest
            Desktop: Horizontal rotation (Left/Center/Right + Far at bottom middle)
        ------------------------------------------------------------- */}
        <div className='relative mt-32 sm:mt-16 md:mt-20 lg:mt-24 flex w-full max-w-[1700px] items-center justify-center px-2 sm:px-8 md:px-16'>
          {/* Left Arrow Button (Previous) */}
          <button
            type='button'
            onClick={handlePrev}
            aria-label='Previous ticket'
            className='group absolute left-2 sm:left-4 md:left-6 lg:left-8 top-full mt-4 sm:top-1/2 sm:mt-0 sm:-translate-y-[100%] z-40 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white shadow-xl backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black md:h-14 md:w-14'
          >
            <svg
              className='h-5 w-5 rotate-90 sm:rotate-0 md:h-6 md:w-6 transition-transform group-hover:-translate-x-0.5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2.5'
                d='M19 12H5M12 19l-7-7 7-7'
              />
            </svg>
          </button>

          {/* Ticket Showcase Stack */}
          <div className='relative flex h-[400px] sm:h-[320px] md:h-[370px] lg:h-[400px] w-full max-w-3xl items-center justify-center'>
            {passes.map((ticket, index) => {
              let offset = index - activeIndex
              if (offset < -1) offset += passes.length
              if (offset > 1) offset -= passes.length

              const isCenter = offset === 0
              const isLeft = offset === -1
              const isRight = offset === 1

              /* With exactly 4 passes, the leftover card (offset ±2) gets its
                 own "far" slot (bottom middle on desktop, bottom of the
                 vertical stack on phones), so all four stay visible and each
                 one travels around the loop as you navigate.
                 With 5+ passes, anything beyond the four slots is parked
                 invisibly so it can't pile up behind another card. */
              const isFar =
                !isCenter && !isLeft && !isRight && passes.length === 4
              const isHidden = !isCenter && !isLeft && !isRight && !isFar

              /* Each slot gets an explicit layer so paint order never falls
                 back to array order: centre on top, side cards next, the far
                 card behind the right one. */
              const layer = isCenter ? 'z-30' : isLeft || isRight ? 'z-20' : 'z-10'

              return (
                <div
                  key={ticket.id}
                  aria-hidden={isHidden}
                  onClick={() => {
                    if (isHidden) return
                    vibrate()
                    setChosenIndex(index)
                  }}
                  className={`absolute left-1/2 top-1/2 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform ${layer} ${
                    isHidden ? 'pointer-events-none' : 'cursor-pointer'
                  } ${
                    isCenter
                      ? // Dead centre, elevated a bit more on desktop for the hero look.
                        '-translate-x-1/2 -translate-y-1/2 sm:-translate-y-[58%] md:-translate-y-[62%] scale-110 sm:scale-115 md:scale-120 opacity-100 drop-shadow-[0_25px_55px_rgba(0,0,0,0.95)]'
                      : isLeft
                        ? '-translate-x-1/2 sm:-translate-x-[95%] md:-translate-x-[100%] lg:-translate-x-[105%] -translate-y-[66%] sm:-translate-y-[44%] md:-translate-y-[45%] scale-75 sm:scale-80 opacity-75 sm:opacity-85 hover:opacity-100 drop-shadow-[0_12px_25px_rgba(0,0,0,0.8)]'
                        : isRight
                          ? '-translate-x-1/2 sm:translate-x-[-5%] md:translate-x-[0%] lg:translate-x-[5%] -translate-y-[34%] sm:-translate-y-[44%] md:-translate-y-[45%] scale-75 sm:scale-80 opacity-75 sm:opacity-85 hover:opacity-100 drop-shadow-[0_12px_25px_rgba(0,0,0,0.8)]'
                          : isFar
                            ? // Fourth slot.
                              // Phone: below the "next" card, tucked behind it, so a strip peeks out.
                              // Desktop: bottom middle, between the left and right cards (unchanged).
                              '-translate-x-1/2 -translate-y-[27%] scale-65 sm:-translate-y-[30%] md:-translate-y-[28%] sm:scale-70 opacity-70 sm:opacity-90 hover:opacity-100 drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]'
                            : // 5th+ pass: parked invisibly.
                              '-translate-x-1/2 -translate-y-1/2 scale-50 opacity-0'
                  }`}
                >
                  <div className='relative w-[360px] sm:w-[420px] md:w-[540px] lg:w-[640px] xl:w-[700px]'>
                    <img
                      src={ticket.image}
                      alt={ticket.fullTitle}
                      // The backend/mock can point `picture` at an asset that 404s —
                      // fall back to the known-good ticket art so the carousel always
                      // has something to show (and to animate) instead of going blank.
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMAGE) {
                          e.currentTarget.src = FALLBACK_IMAGE
                        }
                      }}
                      className='aspect-[0.72/1] h-auto w-full object-contain filter transition-all duration-500 hover:brightness-105'
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Next Arrow — bottom of the stack on phone (vertical wheel), right on desktop */}
          <button
            type='button'
            onClick={handleNext}
            aria-label='Next ticket'
            className='group absolute right-2 sm:right-4 md:right-6 lg:right-8 top-full mt-4 sm:top-1/2 sm:mt-0 sm:-translate-y-[100%] z-40 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white shadow-xl backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black md:h-14 md:w-14'
          >
            <svg
              className='h-5 w-5 rotate-90 sm:rotate-0 md:h-6 md:w-6 transition-transform group-hover:translate-x-0.5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2.5'
                d='M5 12h14M12 5l7 7-7 7'
              />
            </svg>
          </button>
        </div>

        {/*
          * The artwork promises "REGISTER" but nothing was ever clickable.
          * The control belongs to whichever pass is centred.
        */}
        <div className='relative z-30 mt-8 flex min-h-[210px] w-full max-w-[320px] flex-col justify-center sm:mt-10 sm:min-h-[230px] sm:max-w-[420px] md:max-w-[460px] rounded-2xl border border-white/15 bg-black/35 px-6 py-6 backdrop-blur-sm shadow-[0_0_50px_rgba(91,99,230,0.35)]'>
          {loading ? (
            <p className='text-center text-base sm:text-lg tracking-[0.18em] text-white/60'>
              CHECKING AVAILABILITY…
            </p>
          ) : active ? (
            <>
              <p className='mb-3 text-center text-lg sm:text-xl font-semibold tracking-[0.18em] text-white'>
                {active.fullTitle}
                {active.priceInPaise !== null && ` · ${active.fee}`}
              </p>
              <div className='[&_button]:py-3 [&_button]:text-2xl sm:[&_button]:text-3xl [&_dl]:text-sm'>
                {/* Keyed by pass: the ticket count, passcode and any error
                    belong to the pass they were entered for, and must not
                    carry over to the next one the carousel lands on. */}
                <Checkout key={active.id} event={active} />
              </div>
            </>
          ) : (
            /* No pass events from the backend yet, so there is nothing to sell. */
            <p className='text-center text-base sm:text-lg leading-relaxed tracking-[0.14em] text-white/60'>
              REGISTRATIONS OPENING SOON
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
'use client'

import { useEffect, useState } from 'react'
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

export default function TathvaPasses() {
  const inNavbarScope = useNavbarScope()

  const [activeIndex, setActiveIndex] = useState(0)

  // Passes are ordinary bookable events (GET /api/events/all?type=passes) —
  // the carousel is built straight from whatever the backend returns, not a
  // hardcoded list, so an added/removed/repriced pass shows up on its own.
  const { events: passes, loading } = useEvents(PASS_EVENT_TYPE, {
    label: 'Pass',
    fallbackImage: FALLBACK_IMAGE,
  })

  // Once the passes load, start on the middle one rather than index 0.
  useEffect(() => {
    if (passes.length) setActiveIndex(Math.floor((passes.length - 1) / 2))
  }, [passes.length])

  const active = passes[activeIndex] ?? null


  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? passes.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === passes.length - 1 ? 0 : prev + 1))
  }

  return (
    <main className='relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-black select-none font-sans text-white'>
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
      <div className='relative z-10 my-0 sm:my-auto flex w-full flex-col items-center justify-center px-4 pt-24 sm:pt-24 md:pt-20 pb-10 sm:pb-14 text-center'>
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
            Mobile: Vertical rotation (Top/Center/Bottom) with middle largest
            Desktop: Horizontal rotation (Left/Center/Right)
        ------------------------------------------------------------- */}
        <div className='relative mt-56 sm:mt-10 md:mt-14 flex w-full max-w-[1700px] items-center justify-center px-2 sm:px-8 md:px-16'>
          {/* Left Arrow Button (Previous) */}
          <button
            type='button'
            onClick={handlePrev}
            aria-label='Previous ticket'
            className='group absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 sm:-translate-y-[100%] z-40 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white shadow-xl backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black md:h-14 md:w-14'
          >
            <svg
              className='h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:-translate-x-0.5'
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
          <div className='relative flex h-[260px] sm:h-[320px] md:h-[370px] lg:h-[400px] w-full max-w-3xl items-center justify-center'>
            {passes.map((ticket, index) => {
              let offset = index - activeIndex
              if (offset < -1) offset += passes.length
              if (offset > 1) offset -= passes.length

              const isCenter = offset === 0
              const isLeft = offset === -1

              return (
                <div
                  key={ticket.id}
                  onClick={() => setActiveIndex(index)}
                  className={`absolute left-1/2 top-1/2 cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform ${
                    isCenter
                      ? 'z-30 -translate-x-1/2 -translate-y-[52%] sm:-translate-y-[58%] scale-110 sm:scale-115 md:scale-120 opacity-100 drop-shadow-[0_25px_55px_rgba(0,0,0,0.95)]'
                      : isLeft
                        ? 'z-10 -translate-x-1/2 sm:-translate-x-[95%] md:-translate-x-[100%] lg:-translate-x-[105%] -translate-y-[100%] sm:-translate-y-[28%] scale-75 sm:scale-80 opacity-75 sm:opacity-85 hover:opacity-100 drop-shadow-[0_12px_25px_rgba(0,0,0,0.8)]'
                        : 'z-10 -translate-x-1/2 sm:translate-x-[-5%] md:translate-x-[0%] lg:translate-x-[5%] translate-y-[20%] sm:-translate-y-[28%] scale-75 sm:scale-80 opacity-75 sm:opacity-85 hover:opacity-100 drop-shadow-[0_12px_25px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  <div className='relative w-[260px] sm:w-[420px] md:w-[540px] lg:w-[640px] xl:w-[700px]'>
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

          {/* Right Arrow Button (Next) */}
          <button
            type='button'
            onClick={handleNext}
            aria-label='Next ticket'
            className='group absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 sm:-translate-y-[100%] z-40 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white shadow-xl backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black md:h-14 md:w-14'
          >
            <svg
              className='h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-0.5'
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
            <p className='text-center text-sm tracking-[0.18em] text-white/60'>
              CHECKING AVAILABILITY…
            </p>
          ) : active ? (
            <>
              <p className='mb-3 text-center text-sm sm:text-base font-semibold tracking-[0.18em] text-white'>
                {active.fullTitle}
                {active.priceInPaise !== null && ` · ${active.fee}`}
              </p>
              <div className='[&_button]:py-3 [&_button]:text-xl sm:[&_button]:text-2xl'>
                <Checkout event={active} />
              </div>
            </>
          ) : (
            /* No pass events from the backend yet, so there is nothing to sell. */
            <p className='text-center text-sm leading-relaxed tracking-[0.14em] text-white/60'>
              REGISTRATIONS OPENING SOON
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Navbar from '@/pageComponents/Navbar/Navbar'
import { useNavbarScope } from '@/pageComponents/Navbar/NavbarContext'
import TathvaMenu from '@/components/TathvaMenu/TathvaMenu'
import LightPillar from '@/components/LightPillar/LightPillar'

const TICKETS = [
  {
    id: 'day-3',
    title: 'DAY 3',
    date: 'OCT 11 2026',
    price: 'Rs. 1399/-',
    details: 'COMPETITIONS | EVENTS | CONCLAVE',
    src: '/images/tickets/ticket3.svg',
    alt: 'Tathva Pass Day 3 - Oct 11 2026',
  },
  {
    id: 'day-all',
    title: 'DAY ALL',
    date: 'OCT ALL 2026',
    price: 'Rs. 1999/-',
    details: 'PROSHOW | EVENTS | CONCLAVE',
    src: '/images/tickets/ticket1.svg',
    alt: 'Tathva Pass Day All - Oct 2026',
  },
  {
    id: 'day-1',
    title: 'DAY 1',
    date: 'OCT 9 2026',
    price: 'Rs. 399/-',
    details: 'WHEELS | ROBOWARS | CONCLAVE',
    src: '/images/tickets/ticket2.svg',
    alt: 'Tathva Pass Day 1 - Oct 9 2026',
  },
]

export default function TathvaPasses() {
  const inNavbarScope = useNavbarScope()

  // Center ticket index default 1 -> DAY ALL
  const [activeIndex, setActiveIndex] = useState(1)

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? TICKETS.length - 1 : prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === TICKETS.length - 1 ? 0 : prev + 1))
  }, [])

  // Left/right arrow keys drive the same carousel as the on-screen buttons.
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (isTypingTarget) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

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
          quality='high'
        />
      </div>

      {/* -------------------------------------------------------------
          CYBERPUNK SIDE GLOW RODS (MIDDLE-ALIGNED ON MOBILE & DESKTOP)
      ------------------------------------------------------------- */}
      {/* <div className='pointer-events-none absolute left-1 sm:left-4 md:left-8 top-[55%] sm:top-1/2 z-20 -translate-y-1/2'>
        <img
          src='/images/tickets/leftrod.svg'
          alt=''
          className='h-[55vh] sm:h-[65vh] max-h-[580px] w-auto object-contain drop-shadow-[0_0_15px_rgba(138,56,245,0.8)]'
        />
      </div> */}

      {/* <div className='pointer-events-none absolute right-1 sm:right-4 md:right-8 top-[55%] sm:top-1/2 z-20 -translate-y-1/2'>
        <img
          src='/images/tickets/rightrod.svg'
          alt=''
          className='h-[55vh] sm:h-[65vh] max-h-[580px] w-auto object-contain drop-shadow-[0_0_15px_rgba(138,56,245,0.8)]'
        />
      </div> */}

      {/* -------------------------------------------------------------
          HERO TITLE & SUBTITLE (AKIRA EXPANDED FONT)
      ------------------------------------------------------------- */}
      <div className='relative z-10 my-0 sm:my-auto flex w-full flex-col items-center justify-center px-4 pt-24 sm:pt-24 md:pt-20 text-center'>
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
          <div className='relative flex h-[300px] sm:h-[380px] md:h-[440px] lg:h-[480px] w-full max-w-4xl items-center justify-center'>
            {TICKETS.map((ticket, index) => {
              let offset = index - activeIndex
              if (offset < -1) offset += TICKETS.length
              if (offset > 1) offset -= TICKETS.length

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
                      src={ticket.src}
                      alt={ticket.alt}
                      className='h-auto w-full object-contain filter transition-all duration-500 hover:brightness-105'
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
      </div>
    </main>
  )
}

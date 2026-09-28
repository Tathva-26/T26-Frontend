'use client';

import { useState } from 'react';
import Image from 'next/image';

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
];

// Mobile-only Up/Down button (same look as the desktop arrows).
// Slightly smaller on short phones (e.g. iPhone SE) so the group fits between the rods.
const MOBILE_BTN =
  'group relative z-40 flex h-10 w-10 [@media(max-width:639px)_and_(max-height:700px)]:h-9 [@media(max-width:639px)_and_(max-height:700px)]:w-9 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white shadow-xl backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black sm:hidden';

// Haptic tick: mobile-width screens only, silently skipped where unsupported
const haptic = (ms = 12) => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!window.matchMedia('(max-width: 639px)').matches) return;
  if ('vibrate' in navigator) navigator.vibrate(ms);
};

export default function TathvaPasses() {
  // Center ticket index default 1 -> DAY ALL
  const [activeIndex, setActiveIndex] = useState(1);

  const handlePrev = () => {
    haptic();
    setActiveIndex((prev) => (prev === 0 ? TICKETS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    haptic();
    setActiveIndex((prev) => (prev === TICKETS.length - 1 ? 0 : prev + 1));
  };

  const handleSelect = (index) => {
    if (index !== activeIndex) haptic();
    setActiveIndex(index);
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-black select-none font-sans text-white">
      {/* -------------------------------------------------------------
          BACKGROUND IMAGE (OBJECT-TOP ON MOBILE FOR SHIFTED SKYLINE)
      ------------------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/tickets/bg-city.png"
          alt="Tathva Background"
          fill
          priority
          className="object-cover object-top sm:object-center"
        />
      </div>

      {/* -------------------------------------------------------------
          CYBERPUNK SIDE GLOW RODS (MIDDLE-ALIGNED ON MOBILE & DESKTOP)
      ------------------------------------------------------------- */}
      <div className="pointer-events-none absolute left-1 sm:left-4 md:left-8 top-[55%] sm:top-1/2 z-20 -translate-y-1/2">
        <img
          src="/images/tickets/leftrod.svg"
          alt=""
          className="h-[55vh] sm:h-[65vh] max-h-[580px] w-auto object-contain drop-shadow-[0_0_15px_rgba(138,56,245,0.8)]"
        />
      </div>

      <div className="pointer-events-none absolute right-1 sm:right-4 md:right-8 top-[55%] sm:top-1/2 z-20 -translate-y-1/2">
        <img
          src="/images/tickets/rightrod.svg"
          alt=""
          className="h-[55vh] sm:h-[65vh] max-h-[580px] w-auto object-contain drop-shadow-[0_0_15px_rgba(138,56,245,0.8)]"
        />
      </div>

      {/* -------------------------------------------------------------
          HERO TITLE & SUBTITLE (AKIRA EXPANDED FONT)
          Note: "relative" applies only from sm: up, so on mobile the
          carousel is positioned against the full screen (like the rods).
      ------------------------------------------------------------- */}
      <div className="z-10 sm:relative my-0 sm:my-auto flex w-full flex-col items-center justify-center px-4 pt-8 sm:pt-16 md:pt-20 text-center">
        <h1
          className="text-4xl font-black tracking-[0.12em] text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "'Akira Expanded', 'Orbitron', sans-serif" }}
        >
          TATHVA PASSES
        </h1>
        <p
          className="mt-2 text-[10px] font-bold tracking-[0.22em] text-white sm:text-xs md:text-sm lg:text-base"
          style={{ fontFamily: "'Akira Expanded', 'Orbitron', sans-serif" }}
        >
          GET THE PASS ENJOY EVERY MOMENT
        </p>

        {/* -------------------------------------------------------------
            TICKET CAROUSEL & NAVIGATION
            Mobile: centered between the rods -> Up button, tickets, Down button
            Desktop: horizontal rotation with left/right arrows (unchanged)
        ------------------------------------------------------------- */}
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 sm:relative sm:left-auto sm:top-auto sm:translate-x-0 sm:translate-y-0 mt-0 sm:mt-8 md:mt-12 flex w-[80vw] sm:w-full max-w-[1700px] flex-col items-center justify-center gap-3 [@media(max-width:639px)_and_(max-height:700px)]:gap-2 sm:flex-row sm:gap-0 px-0 sm:px-8 md:px-16">
          {/* Up Button (mobile only) = Previous */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous ticket"
            className={MOBILE_BTN}
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>

          {/* Left Arrow Button (Previous) - desktop only */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous ticket"
            className="group absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 sm:-translate-y-[100%] z-40 hidden sm:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white shadow-xl backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black md:h-14 md:w-14"
          >
            <svg
              className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Ticket Showcase Stack */}
          <div className="relative flex h-[340px] [@media(max-width:639px)_and_(max-height:700px)]:h-[250px] sm:h-[320px] md:h-[370px] lg:h-[400px] w-full max-w-3xl items-center justify-center">
            {TICKETS.map((ticket, index) => {
              let offset = index - activeIndex;
              if (offset < -1) offset += TICKETS.length;
              if (offset > 1) offset -= TICKETS.length;

              const isCenter = offset === 0;
              const isLeft = offset === -1;

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelect(index)}
                  className={`absolute left-1/2 top-1/2 cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform ${isCenter
                    ? 'z-30 -translate-x-1/2 -translate-y-[52%] sm:-translate-y-[58%] scale-110 sm:scale-115 md:scale-120 opacity-100 drop-shadow-[0_25px_55px_rgba(0,0,0,0.95)]'
                    : isLeft
                      ? 'z-10 -translate-x-1/2 sm:-translate-x-[95%] md:-translate-x-[100%] lg:-translate-x-[105%] -translate-y-[115%] sm:-translate-y-[40%] scale-75 sm:scale-80 opacity-75 sm:opacity-85 hover:opacity-100 drop-shadow-[0_12px_25px_rgba(0,0,0,0.8)]'
                      : 'z-10 -translate-x-1/2 sm:translate-x-[-5%] md:translate-x-[0%] lg:translate-x-[5%] translate-y-[10%] sm:-translate-y-[40%] scale-75 sm:scale-80 opacity-75 sm:opacity-85 hover:opacity-100 drop-shadow-[0_12px_25px_rgba(0,0,0,0.8)]'
                    }`}
                >
                  <div className="relative w-[68vw] sm:w-[380px] md:w-[480px] lg:w-[560px]">
                    <img
                      src={ticket.src}
                      alt={ticket.alt}
                      className="h-auto w-full object-contain filter transition-all duration-500 hover:brightness-105"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow Button (Next) - desktop only */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next ticket"
            className="group absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 sm:-translate-y-[100%] z-40 hidden sm:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white shadow-xl backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black md:h-14 md:w-14"
          >
            <svg
              className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {/* Down Button (mobile only) = Next */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next ticket"
            className={MOBILE_BTN}
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
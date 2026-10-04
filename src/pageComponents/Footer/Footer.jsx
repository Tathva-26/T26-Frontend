'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Bebas_Neue, Varela } from 'next/font/google'
import Link from 'next/link'
import { GlowLetters } from './glow'
import { DotsBackground } from '@/components/AmbientBackground'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})
const varela = Varela({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-varela',
})

const linkColumns = [
  {
    heading: 'EXPLORE',
    links: [
      { label: 'HOME', href: '/' },
      { label: 'CONTACTS', href: '/contact' },
    ],
  },
  {
    heading: 'ABOUT',
    links: [
      { label: 'WORKSHOPS', href: '/workshops' },
      { label: 'LECTURES', href: '/lectures' },
      { label: 'COMPETITIONS', href: '/competitions' },
      { label: 'PASSES', href: '/passes' },
    ],
  },
  {
    heading: 'MORE',
    links: [
      { label: 'PROSHOW', href: '/proshow' },
      { label: 'ACCOMMODATION', href: '/accommodation' },
      { label: 'PROFILE', href: '/profile' },
    ],
  },
]

export default function Footer() {
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const headlineRef = useRef(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          scroller: document.querySelector('.main-scroll') || window,
          trigger: rootRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      tl.from(headlineRef.current, {
        y: 35,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      })
        .from(
          panelRef.current,
          { y: 45, opacity: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.3',
        )
        .from(
          '.footer-col',
          {
            y: 18,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
          },
          '-=0.4',
        )
    },
    { scope: rootRef },
  )

  return (
    <footer
      ref={rootRef}
      className={`${bebasNeue.variable} ${varela.variable} footer-typography relative mt-auto w-full bg-transparent pb-4 pt-4 text-white lg:pb-5 lg:pt-6`}
    >
      <DotsBackground />
      <style>{`
        @font-face {
          font-family: 'Akira Expanded';
          src: url('https://cdn-next-main.tathva.org/fonts/AkiraExpanded.otf') format('opentype');
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }

        .font-akira { font-family: 'Akira Expanded', 'Anton', sans-serif; }
        .font-bebas { font-family: var(--font-bebas), sans-serif; }
        .font-varela { font-family: var(--font-varela), sans-serif; }
        .footer-typography {
          font-family: var(--font-bebas), sans-serif;
          font-weight: 400;
          font-style: normal;
          font-size: 15.8px;
          line-height: 100%;
          letter-spacing: 0.1em;
        }
        :where(.footer-typography *) {
          font-family: inherit;
          font-weight: 400;
          font-style: normal;
          line-height: 100%;
          letter-spacing: 0.1em;
        }
        .footer-typography h2 {
          font-family: 'Akira Expanded', 'Anton', sans-serif;
          font-weight: 800;
          font-style: normal;
          line-height: 100%;
          letter-spacing: 0;
          color: transparent;
          -webkit-text-stroke: 1.5px #444444;
          cursor: default;
          -webkit-user-select: none;
          user-select: none;
        }
        .footer-panel-shape-mobile {
          display: none;
        }

        @media (max-width: 767px) {
          .footer-typography h2 {
            font-size: clamp(48px, 16vw, 96px);
            color: #FFFFFF !important;
            -webkit-text-stroke: 0 !important;
          }

          .footer-typography h2 canvas {
            display: none !important;
          }

          .footer-typography .footer-panel {
            min-height: 0;
            max-width: 370px;
            margin-left: auto;
            margin-right: auto;
            display: block;
          }

          .footer-panel-shape-desktop {
            display: none;
          }

          .footer-panel-shape-mobile {
            display: block;
          }

          .footer-typography .footer-panel-content {
            min-height: 0;
            padding: 1.75rem 1.4rem 2rem 1.4rem;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .footer-typography h2 {
            font-size: clamp(72px, 12vw, 126px);
          }
        }
      `}</style>

      <div className='relative mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-12'>
        {/* ASTERIA BACKGROUND TEXT */}
        <div className='relative z-10 -translate-y-1 -mb-[18px] sm:-mb-[32px] lg:-mb-[45px]'>
          <h2
            ref={headlineRef}
            className='relative z-20 w-full max-w-full text-center font-akira text-[15vw] font-extrabold uppercase leading-[100%] tracking-[0%] sm:text-[14vw] lg:text-[150px] xl:text-[180px]'
          >
            ASTERIA
            <GlowLetters
              text='ASTERIA'
              textColor='transparent'
              textFit={0.905}
              textY={0.5}
              fontFamily="'Akira Expanded', 'Anton', sans-serif"
              fontWeight={800}
              measureRef={headlineRef}
              radius={132}
              spread={1.4}
              zIndex={-1}
            />
          </h2>
        </div>

        {/* MAIN CHAMFERED PANEL FRAME */}
        <div
          ref={panelRef}
          className='footer-panel relative z-10 w-full flex flex-col justify-center min-h-[250px] md:min-h-[285px] lg:min-h-[310px]'
        >
          {/* Vector 3.svg — desktop panel (1331x295) */}
          <svg
            className='footer-panel-shape-desktop pointer-events-none absolute inset-0 h-full w-full drop-shadow-xl'
            viewBox='0 0 1331 295'
            preserveAspectRatio='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M0 255.042V43.3222L34.5879 0H215.213H226.044H446.498L482.483 43.3222H824.169L865.395 0H1293.73L1330.06 43.3222V245.958L1293.73 294.521H48.9121L0 255.042Z'
              fill='#2A2A2A'
            />
          </svg>

          {/* Vector 29.svg — mobile panel (370x319) */}
          <svg
            className='footer-panel-shape-mobile pointer-events-none absolute inset-0 h-full w-full drop-shadow-xl'
            viewBox='0 0 370 319'
            preserveAspectRatio='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M0.245361 78.5901V13.2432L27.1142 0.242188H341.794L369.147 13.1291V78.8182L358.496 84.1783V258.665L369.389 263.683V297.668L342.52 310.213L253.441 310.555L236.013 318.31H123.212L105.542 310.441H26.8721L0.971545 298.01L0.245361 263.797L11.6222 258.893V84.1783L0.245361 78.5901Z'
              fill='#2A2A2A'
            />
          </svg>

          <div className='footer-panel-content relative z-10 w-full flex flex-col md:grid md:grid-cols-[auto_1fr] md:justify-between items-center gap-6 md:gap-8 lg:gap-12 xl:gap-16 px-6 py-5 sm:px-8 lg:px-[54px] xl:px-[68px] md:my-auto md:py-6 lg:py-8'>
            {/* NEWSLETTER SECTION */}
            <div className='footer-newsletter w-full self-center'>
              <p className='font-bebas text-[20px] sm:text-[23px] lg:text-[25px] leading-[26px] sm:leading-[28px] tracking-[0.02em] text-white font-normal lg:whitespace-nowrap'>
                GET THE LATESTUPDATES &amp; SIGNALS
              </p>
              <p className='mt-2.5 w-full font-bebas text-[14px] leading-[18px] text-[#A0A0A0] sm:w-[250px] sm:text-[15px] lg:w-auto lg:text-[16px]'>
                BE THE FIRST TO KNOW ABOUT EVENTS,
                <br />
                WORKSHOPS,PASSES AND MORE
              </p>

              <form
                onSubmit={(e) => e.preventDefault()}
                className='relative mt-4 h-[42px] w-full max-w-[435px] sm:mt-5'
              >
                <svg
                  viewBox='0 0 297 44'
                  preserveAspectRatio='none'
                  className='pointer-events-none absolute inset-0 h-full w-full'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M0.838867 34.6907 V11.7501 L8.39247 0.839355 H286.197 L295.709 8.95248 V34.6907 L286.197 43.0836 H243.393 H10.9103 L0.838867 34.6907 Z'
                    stroke='#80858C'
                    strokeWidth='1.2'
                    strokeLinecap='round'
                    fill='#222222'
                  />
                  <path
                    d='M255.982 25.7383 L243.113 40.0063 H283.399 L292.911 31.6134 V11.1907 L284.798 4.7561 H256.262 L255.982 25.7383 Z'
                    fill='#3F7393'
                  />
                  <path
                    d='M271.836 22.5004 H283.249 M277.542 28.2068 L283.249 22.5004 L277.542 16.7939'
                    stroke='#F5F5F5'
                    strokeWidth='1.6'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>

                <input
                  type='email'
                  required
                  placeholder='Enter Your Email'
                  className='absolute inset-0 w-full bg-transparent pl-4 pr-[50px] text-center md:text-left md:pl-[20px] md:pr-[55px] font-varela text-[12px] sm:text-[13px] font-normal leading-none tracking-[0.22em] text-white outline-none placeholder:text-[#9A9A9A]'
                />

                <button
                  type='submit'
                  aria-label='Subscribe'
                  className='absolute right-0 top-0 h-full w-[48px] sm:w-[48px] lg:w-[73px] cursor-pointer'
                />
              </form>
            </div>

            {/* NAVIGATION COLUMNS */}
            <div className='footer-navigation mt-7 w-full grid grid-cols-3 gap-2 md:mt-0 md:flex md:h-auto md:flex-row md:items-start md:justify-end md:gap-5 lg:gap-8 xl:gap-10 md:translate-y-2 lg:translate-y-3'>
              {linkColumns.map((column) => (
                <div
                  key={column.heading}
                  className='footer-col flex flex-col items-start w-full md:w-[115px] lg:w-[135px] xl:w-[150px]'
                >
                  {/* Header with extending divider line on desktop */}
                  <div className='flex w-full items-center gap-2 mb-2 md:mb-3'>
                    <h3 className='font-bebas text-[15px] md:text-[17px] xl:text-[18px] leading-none tracking-[0.08em] text-white whitespace-nowrap'>
                      {column.heading}
                    </h3>
                    <div className='hidden md:block h-[1px] flex-1 bg-[#444444]' />
                  </div>

                  <ul className='space-y-1.5 md:space-y-1 w-full'>
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className='group flex items-center justify-between gap-1.5 font-bebas text-[12px] sm:text-[13px] tracking-[0.08em] text-[#B0B0B0] hover:text-white transition-colors block leading-tight'
                        >
                          <span className='transition-transform duration-200 group-hover:translate-x-0.5'>
                            {link.label}
                          </span>
                          {/* Pink arrow for desktop view */}
                          <svg
                            width='13'
                            height='13'
                            viewBox='0 0 20 20'
                            fill='none'
                            className='hidden md:block shrink-0 transition-transform duration-200 group-hover:translate-x-1'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              d='M4 10H16M10 4L16 10L10 16'
                              stroke='#F19EDC'
                              strokeWidth='2'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM FRAME & COPYRIGHT OVERLAY */}
        <div className='relative z-20 -mt-[10px] sm:-mt-[14px] w-full max-w-[370px] md:max-w-none mx-auto lg:-mt-[18px]'>
          <svg
            viewBox='0 0 1339 76'
            fill='none'
            preserveAspectRatio='none'
            className='h-[34px] sm:h-[48px] w-full lg:h-[58px]'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M1.04785 9.08366V40.8765L44.7194 74.7657H498.904L536.636 54.8514H830.458L860.853 74.7657L1301.41 71.9707L1337.05 30.3954V1.0481'
              stroke='#fffdfe'
              strokeWidth='1.8'
              strokeLinecap='round'
            />
          </svg>

          {/* Mobile Labels Layout */}
          <div className='footer-bottom-labels-mobile flex flex-col items-center pt-2.5 pb-2 md:hidden'>
            <span className='font-varela text-[12.5px] tracking-[0.25em] text-[#E0E0E0] uppercase'>
              TATHVA&apos; 26
            </span>
            <div className='w-full flex items-center justify-between px-3 pt-3 font-varela text-[7.5px] tracking-[0.2em] text-[#909090] uppercase'>
              <span>NIT CALICUT</span>
              <span>ALL RIGHTS RESERVED.</span>
            </div>
          </div>

          {/* Desktop Labels Layout */}
          <div className='footer-bottom-labels-desktop absolute inset-0 hidden md:flex flex-wrap items-end justify-between px-6 pb-1 font-varela text-[9px] uppercase tracking-[0.20em] text-[#C0C0C0] sm:flex-nowrap sm:px-12 sm:pb-1.5 sm:text-[10px] sm:tracking-[0.28em] lg:px-[105px] lg:pb-2 lg:text-[11px]'>
            <span className='translate-y-[-2px]'>NIT CALICUT</span>
            <span className='static sm:absolute sm:left-1/2 sm:-translate-x-1/2 translate-y-[-10px] lg:translate-y-[-12px]'>
              TATHVA&apos; 26
            </span>
            <span className='translate-y-[-2px]'>ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

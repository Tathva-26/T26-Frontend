'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Jockey_One, Michroma } from 'next/font/google'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNavbarScope } from '@/pageComponents/Navbar/NavbarContext'

const jockeyOne = Jockey_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

const leftMenu = [
  { label: 'HOME', href: '/' },
  { label: 'ACCOMMODATION', href: '/accommodation' },
  { label: 'LECTURES', href: '/lectures' },
  { label: 'PROSHOW', href: '/proshow' },
]

const rightMenu = [
  { label: 'PROFILE', href: '/profile' },
  { label: 'WORKSHOPS', href: '/workshops' },
  { label: 'PASSES', href: '/passes' },
  { label: 'COMPETITIONS', href: '/competitions' },
  { label: 'CONTACT', href: '/contact' },
]

/* -----------------------------------------------------------------------
   Portal text hover (ported from the reference Navbar's FlipLink)
   ----------------------------------------------------------------------- */

const PORTAL_DURATION = 520 // ms, whole transition (first letter to last)
const PORTAL_SPREAD = 0.3 // share of the duration used to ripple outward from the cursor
const PORTAL_SIGMA_EM = 2.8 // width of the warp falloff, in em
const PORTAL_PINCH = 0.28 // how strongly letters are pulled toward the cursor x
const PORTAL_STRETCH = 0.45 // extra vertical stretch at the contact point
const PORTAL_SQUASH = 0.16 // horizontal squeeze at the contact point
const PORTAL_SKEW = 14 // degrees of shear at maximum influence

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)

function PortalText({ text }) {
  const wrapRef = useRef(null)
  const outgoingRef = useRef([])
  const incomingRef = useRef([])
  const animationRef = useRef(null)
  const runningRef = useRef(false)

  const trigger = (event) => {
    const wrap = wrapRef.current
    if (!wrap || runningRef.current) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const out = outgoingRef.current
    const inc = incomingRef.current
    if (!out[0] || !inc[0]) return

    runningRef.current = true

    const pointerX = event.clientX - wrap.getBoundingClientRect().left
    const H = inc[0].offsetHeight
    const sigma =
      parseFloat(window.getComputedStyle(wrap).fontSize) * PORTAL_SIGMA_EM

    const cells = []
    for (let i = 0; i < text.length; i++) {
      const char = out[i]
      if (!char) {
        cells.push({ d: 0, w: 0 })
        continue
      }
      const d = char.offsetLeft + char.offsetWidth / 2 - pointerX
      cells.push({ d, w: Math.exp(-((d / sigma) * (d / sigma))) })
    }

    const render = (t) => {
      for (let i = 0; i < text.length; i++) {
        const o = out[i]
        const n = inc[i]
        if (!o || !n) continue

        const { d, w } = cells[i]

        const local = clamp01(
          (t - PORTAL_SPREAD * (1 - w)) / (1 - PORTAL_SPREAD),
        )
        const p = easeOutQuart(local)

        const bell = Math.sin(Math.PI * p) * w

        const dx = -d * PORTAL_PINCH * bell
        const skew = (d / sigma) * PORTAL_SKEW * bell
        const sx = 1 - PORTAL_SQUASH * bell
        const sy = 1 + PORTAL_STRETCH * bell
        const shape = ` skewX(${skew}deg) scale(${sx}, ${sy})`

        o.style.transform = `translate3d(${dx}px, ${-p * H}px, 0)` + shape
        n.style.transform = `translate3d(${dx}px, ${H - p * H}px, 0)` + shape

        o.style.opacity = String(1 - clamp01((p - 0.6) / 0.4))
        n.style.opacity = '1'
      }
    }

    render(0)

    const start = performance.now()

    const tick = (now) => {
      const raw = clamp01((now - start) / PORTAL_DURATION)
      render(raw)

      if (raw < 1) {
        animationRef.current = requestAnimationFrame(tick)
        return
      }

      for (let i = 0; i < text.length; i++) {
        const o = out[i]
        const n = inc[i]
        if (!o || !n) continue
        o.style.transform = `translate3d(0, ${-H}px, 0)`
        o.style.opacity = '0'
        n.style.transform = 'none'
        n.style.opacity = '1'
      }

      runningRef.current = false
      animationRef.current = null
    }

    animationRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <span ref={wrapRef} className='mlink-flip' onPointerEnter={trigger}>
      <span className='mlink-portal'>
        {/* OUTGOING */}
        <span className='mlink-row mlink-outgoing'>
          {text.split('').map((char, index) => (
            <span
              key={`out-${index}`}
              ref={(el) => {
                outgoingRef.current[index] = el
              }}
              className='mlink-char'
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>

        {/* INCOMING */}
        <span className='mlink-row mlink-incoming' aria-hidden='true'>
          {text.split('').map((char, index) => (
            <span
              key={`in-${index}`}
              ref={(el) => {
                incomingRef.current[index] = el
              }}
              className='mlink-char'
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}

const allMenuItems = [...leftMenu, ...rightMenu]

function getPageName(pathname) {
  if (!pathname || pathname === '/' || pathname === '/hero') return 'TATHVA-26'
  const match = allMenuItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  if (match) return match.label
  return pathname.split('/').filter(Boolean)[0].replace(/[-_]/g, ' ').toUpperCase()
}

export default function TathvaMenu() {
  const inNavbarScope = useNavbarScope()

  if (inNavbarScope) return null

  return <TathvaMenuOverlay />
}

function TathvaMenuOverlay() {
  const pathname = usePathname()
  const basePageName = getPageName(pathname)

  // Track the current dynamic section name
  const [activeSectionName, setActiveSectionName] = useState(basePageName)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showArrow, setShowArrow] = useState(true)

  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const dividerRef = useRef(null)
  const triggerRef = useRef(null)

  const leftColumnRef = useRef(null)
  const rightColumnRef = useRef(null)

  const timelineRef = useRef(null)

  // Sync section name with route changes (e.g., navigating to /workshops).
  // Done during render rather than in an effect, so the reset lands in the same
  // render as the new route instead of cascading into a second one.
  const [syncedPathname, setSyncedPathname] = useState(pathname)
  if (syncedPathname !== pathname) {
    setSyncedPathname(pathname)
    setActiveSectionName(basePageName)
    setIsOpen(false)
    setIsMobileOpen(false)
    setShowArrow(true)
  }

  // Scroll spy for dynamic multi-section scroll in page.js
  useEffect(() => {
    const isHomePage = pathname === '/' || pathname === '/'
    if (!isHomePage) return

    let rafId = null
    let timeoutId = null

    const update = () => {
      rafId = null

      const scroller = document.querySelector('.main-scroll')
      const scrollTop = scroller ? scroller.scrollTop : window.scrollY
      const sections = document.querySelectorAll('[data-section-name]')

      if (scrollTop < 5 || !sections.length) {
        setActiveSectionName(basePageName)
        return
      }

      const viewTop = scroller ? scroller.getBoundingClientRect().top : 0
      const viewHeight = scroller ? scroller.clientHeight : window.innerHeight
      const line = viewTop + viewHeight * 0.2

      let current = null
      let bestTop = -Infinity
      sections.forEach((sec) => {
        const r = sec.getBoundingClientRect()
        if (r.height === 0) return
        if (r.top <= line && r.bottom > line && r.top >= bestTop) {
          bestTop = r.top
          current = sec
        }
      })

      const name = current ? current.getAttribute('data-section-name') : null
      setActiveSectionName(name || basePageName)
    }

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update)
    }

    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)

    timeoutId = setTimeout(update, 150)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (rafId !== null) cancelAnimationFrame(rafId)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname, basePageName])

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isMobileOpen) setIsMobileOpen(false)
        if (isOpen && timelineRef.current) {
          timelineRef.current.reverse()
          setIsOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen, isOpen])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (
        !panelRef.current ||
        !dividerRef.current ||
        !triggerRef.current ||
        !leftColumnRef.current ||
        !rightColumnRef.current
      ) {
        return
      }

      const leftItems = Array.from(leftColumnRef.current.children)
      const rightItems = Array.from(rightColumnRef.current.children)

      /* -----------------------------------------------
         INITIAL STATE (Desktop)
      ------------------------------------------------ */

      gsap.set(panelRef.current, {
        width: 110,
        height: 0,
      })

      gsap.set(dividerRef.current, {
        height: 0,
        opacity: 0,
      })

      gsap.set([...leftItems, ...rightItems], {
        opacity: 0,
        y: -14,
      })

      gsap.set(triggerRef.current, {
        y: 0,
      })

      /* -----------------------------------------------
         MAIN MENU TIMELINE (Desktop)
      ------------------------------------------------ */

      const tl = gsap.timeline({
        paused: true,
        onReverseComplete: () => {
          // Arrow only shows again after the panel is fully closed and tucked away
          setShowArrow(true)
        },
      })

      timelineRef.current = tl

      /* 1. VERTICAL UNROLL: STRIP DROPS & PANEL UNROLLS */
      tl.to(
        triggerRef.current,
        {
          y: 375,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        0,
      )

      tl.to(
        panelRef.current,
        {
          height: 385,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        0,
      )

      /* 2. HORIZONTAL EXPANSION */
      tl.to(
        panelRef.current,
        {
          width: () => Math.min(580, window.innerWidth * 0.92),
          duration: 0.55,
          ease: 'expo.out',
        },
        '>',
      )

      /* 3. CENTER LINE FALLS */
      tl.to(
        dividerRef.current,
        {
          height: 320,
          opacity: 1,
          duration: 0.35,
          ease: 'power3.out',
        },
        '-=0.25',
      )

      /* 4. TEXT APPEARS */
      tl.to(
        [...leftItems, ...rightItems],
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: {
            each: 0.035,
          },
          ease: 'power2.out',
        },
        '-=0.15',
      )
    }, rootRef)

    return () => {
      ctx.revert()
    }
  }, [pathname])

  const toggleMenu = () => {
    const timeline = timelineRef.current

    if (!timeline) return
    if (timeline.isActive()) return

    if (!isOpen) {
      // Instantly hide the arrow when opening begins
      setShowArrow(false)
      timeline.play()
      setIsOpen(true)
    } else {
      // Ensure the arrow stays hidden while closing
      setShowArrow(false)
      timeline.reverse()
      setIsOpen(false)
    }
  }

  useEffect(() => {
    window.__tathvaMenuToggle = toggleMenu
    return () => {
      if (window.__tathvaMenuToggle === toggleMenu) {
        delete window.__tathvaMenuToggle
      }
    }
  }, [toggleMenu])

  return (
    <div
      ref={rootRef}
      className='
        pointer-events-none
        fixed
        inset-0
        z-[9999]
        h-full
        w-full
      '
    >
      {/* =================================================
          MOBILE NAVIGATION HEADER & HAMBURGER (Below lg)
      ================================================= */}
      <header
        className="
          pointer-events-auto
          fixed
          inset-x-0
          top-0
          z-[10002]
          flex
          h-16
          items-center
          justify-between
          px-5
          sm:px-8
          lg:hidden
        "
      >
        <Link
          href="/"
          aria-label="Tathva home"
          className="pointer-events-auto inline-flex items-center"
        >
          <img
            src="https://cdn-next-main.tathva.org/images/hero/tathvalogo.png"
            alt="Tathva"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Menu trigger */}
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
          className="
            pointer-events-auto
            flex
            h-11
            w-11
            items-center
            justify-center
            p-2
            text-white
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-white
            transition-transform
            active:scale-95
          "
        >
          <span className="sr-only">Toggle navigation menu</span>
          <svg
            width="27"
            height="18"
            viewBox="0 0 27 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <line
              x1="6.5"
              y1="3.5"
              x2="20.5"
              y2="3.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="1.5"
              y1="9.5"
              x2="25.5"
              y2="9.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="6.5"
              y1="16.5"
              x2="20.5"
              y2="16.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {/* =================================================
          MOBILE MENU BACKDROP OVERLAY
      ================================================= */}
      <div
        onClick={() => setIsMobileOpen(false)}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
        className={`
          pointer-events-auto
          fixed
          inset-0
          z-[10000]
          transition-opacity
          duration-[250ms]
          ease
          lg:hidden
          ${isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden="true"
      />

      {/* =================================================
          MOBILE MENU POPOVER (opened from the top-right menu button)
      ================================================= */}
      <aside
        className={`
          pointer-events-auto
          fixed
          top-[4.5rem]
          left-auto
          right-4
          z-[10001]
          flex
          w-[min(18rem,calc(100vw-2rem))]
          max-h-[calc(100dvh-5.5rem)]
          flex-col
          rounded-[1.5rem]
          border
          border-white/10
          bg-[#28292B]/98
          shadow-2xl
          origin-top-right
          transition-[opacity,transform,visibility]
          duration-200
          ease-out
          lg:hidden
          ${
            isMobileOpen
              ? "translate-y-0 scale-100 opacity-100 visible"
              : "-translate-y-2 scale-95 opacity-0 invisible pointer-events-none"
          }
        `}
      >
        <nav
          className="
            flex-1
            overflow-y-auto
            px-4
            py-[22px]
            pb-12
            flex
            flex-col
            items-start
            gap-[14px]
          "
        >
          {allMenuItems.map((item, idx) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              style={{
                transitionDelay: isMobileOpen
                  ? `${(0.05 + idx * 0.06).toFixed(2)}s`
                  : "0s",
              }}
              className={`
                group
                relative
                flex
                w-full
                items-center
                justify-start
                gap-2.5
                px-2
                py-1.5
                rounded-lg
                text-left
                text-[19px]
                font-normal
                tracking-[1.5px]
                text-[#999999]
                no-underline
                transition-all
                duration-300
                ease
                hover:text-white
                hover:bg-white/5
                active:text-[#00E564]
                font-jockey
                ${
                  isMobileOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-[10px]"
                }
              `}
            >
              <img
                src="https://cdn-next-main.tathva.org/images/menu/leftwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[12px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  -translate-x-1
                "
              />

              <PortalText text={item.label} />

              <img
                src="https://cdn-next-main.tathva.org/images/menu/rightwave.png"
                alt=""
                draggable={false}
                className="
                  pointer-events-none
                  h-[12px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  translate-x-1
                "
              />
            </Link>
          ))}
        </nav>
      </aside>

      {/* =================================================
          DESKTOP DARK MENU PANEL (Hidden on mobile)
      ================================================= */}

      <div
        ref={panelRef}
        className='
          pointer-events-auto
          absolute
          left-1/2
          top-0
          z-30
          hidden
          lg:flex
          -translate-x-1/2
          justify-center
          overflow-hidden
          bg-[#2E2E2F]
          shadow-2xl
          [clip-path:polygon(0_0,100%_0,100%_92%,93%_100%,7%_100%,0_92%)]
        '
      >
        <div className="absolute inset-0 z-0 bg-[#2E2E2F]" aria-hidden="true" />

        {/* LEFT MENU */}

        <nav
          ref={leftColumnRef}
          className='
            relative
            z-10
            flex
            h-full
            w-1/2
            flex-col
            items-center
            justify-center
            gap-[18px]
            px-4
            py-6
          '
        >
          {leftMenu.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (isOpen) toggleMenu()
              }}
              className="
                group
                relative
                flex
                items-center
                justify-center
                gap-2.5
                whitespace-nowrap
                text-[18px]
                font-normal
                leading-none
                tracking-[1px]
                text-[rgba(205,220,255,0.72)]
                no-underline
                opacity-0
                transition-colors
                duration-200
                hover:text-white
                font-jockey
              "
            >
              <img
                src='https://cdn-next-main.tathva.org/images/menu/leftwave.png'
                alt=''
                draggable={false}
                className='
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  -translate-x-1
                '
              />

              <PortalText text={item.label} />

              <img
                src='https://cdn-next-main.tathva.org/images/menu/rightwave.png'
                alt=''
                draggable={false}
                className='
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  translate-x-1
                '
              />
            </Link>
          ))}
        </nav>

        {/* CENTER LINE */}

        <div
          ref={dividerRef}
          className='
            absolute
            left-1/2
            top-5
            z-20
            w-px
            -translate-x-1/2
            origin-top
            bg-[#444444]
          '
        />

        {/* RIGHT MENU */}

        <nav
          ref={rightColumnRef}
          className='
            relative
            z-10
            flex
            h-full
            w-1/2
            flex-col
            items-center
            justify-center
            gap-[18px]
            px-4
            py-6
          '
        >
          {rightMenu.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (isOpen) toggleMenu()
              }}
              className="
                group
                relative
                flex
                items-center
                justify-center
                gap-2.5
                whitespace-nowrap
                text-[18px]
                font-normal
                leading-none
                tracking-[1px]
                text-[rgba(205,220,255,0.72)]
                no-underline
                opacity-0
                transition-colors
                duration-200
                hover:text-white
                font-jockey
              "
            >
              <img
                src='https://cdn-next-main.tathva.org/images/menu/leftwave.png'
                alt=''
                draggable={false}
                className='
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  -translate-x-1
                '
              />

              <PortalText text={item.label} />

              <img
                src='https://cdn-next-main.tathva.org/images/menu/rightwave.png'
                alt=''
                draggable={false}
                className='
                  pointer-events-none
                  h-[14px]
                  w-auto
                  object-contain
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  translate-x-1
                '
              />
            </Link>
          ))}
        </nav>
      </div>

      {/* =================================================
          DESKTOP MAIN TATHVA TOP CENTER STRIP BUTTON (Hidden on mobile)
      ================================================= */}

      <button
        id='tathva-menu-trigger'
        ref={triggerRef}
        type='button'
        onClick={toggleMenu}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className='
          group
          pointer-events-auto
          absolute
          left-1/2
          top-5
          z-40
          hidden
          h-auto
          w-[540px]
          -translate-x-1/2
          cursor-pointer
          items-center
          justify-center
          border-0
          bg-transparent
          p-0
          outline-none
          lg:flex
        '
      >
        {/* Center Base Image */}
        <img
          src='https://cdn-next-main.tathva.org/images/menu/tathva.svg'
          alt='Tathva 26'
          draggable={false}
          className='pointer-events-none block h-auto w-full select-none object-contain'
        />

        {/* Left Wing (aligned over the center image) */}
        <img
          src='https://cdn-next-main.tathva.org/images/menu/tleft.svg'
          alt=''
          draggable={false}
          className='pointer-events-none absolute -left-2 top-1/2 h-full w-[195px] -translate-y-5.25 select-none object-contain'
        />

        {/* Right Wing (aligned over the center image) */}
        <img
          src='https://cdn-next-main.tathva.org/images/menu/tright.svg'
          alt=''
          draggable={false}
          className='pointer-events-none absolute -right-2 top-1/2 h-full w-[195px] -translate-y-5.25 select-none object-contain'
        />

        {/* Current page or scrolled section name */}
        <span
          className={`${michroma.className} pointer-events-none absolute inset-0 flex select-none items-center justify-center text-[9px] leading-none tracking-[3px] text-white -translate-y-[5px] transition-all duration-200`}
        >
          {activeSectionName}
        </span>

        {/* Downward indicator chevron (only reappears once closing completes) */}
        <span
          className={`pointer-events-none absolute -bottom-3.5 left-1/2 flex -translate-x-1/2 items-center justify-center transition-all duration-300 ${
            showArrow
              ? 'opacity-80 scale-100 group-hover:opacity-100 group-hover:translate-y-0.5'
              : 'opacity-0 scale-75 pointer-events-none -translate-y-1'
          }`}
          aria-hidden='true'
        >
          <svg
            className='h-3.5 w-3.5 text-white/70 group-hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M6 9l6 6 6-6' />
          </svg>
        </span>
      </button>

      <style>{`
        .mlink-flip {
          display: block;
          height: 1.3em;
          overflow: visible;
        }

        .mlink-portal {
          position: relative;
          display: block;
          height: 1.3em;
          overflow: visible;
          clip-path: inset(0 -0.6em);
        }

        .mlink-row {
          display: flex;
          align-items: center;
          height: 1.3em;
          line-height: 1.3em;
          white-space: nowrap;
        }

        .mlink-outgoing {
          position: relative;
        }

        .mlink-incoming {
          position: absolute;
          inset: 0;
        }

        .mlink-char {
          display: inline-block;
          will-change: transform, opacity;
        }

        .mlink-incoming .mlink-char {
          transform: translate3d(0, 110%, 0);
        }
      `}</style>
    </div>
  )
}
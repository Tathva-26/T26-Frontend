'use client'

import {
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

gsap.registerPlugin(ScrollTrigger, EasePack)

const assetPathPrefix = '/images/artist'

const artists = [
  {
    name: 'Arijit Singh',
    background: `${assetPathPrefix}/21bbf.png`,
    portrait: `${assetPathPrefix}/arijit.png`,
    portraitClassName: 'artist-portrait artist-portrait--arijit',
    cardPortrait: `${assetPathPrefix}/50195.png`,
    cardSecondary: `${assetPathPrefix}/8577e.png`,
    avatar: `${assetPathPrefix}/475ef.png`,
  },
  {
    name: 'Shreya ghoshal',
    background: `${assetPathPrefix}/bef85.png`,
    portrait: `${assetPathPrefix}/shreya.png`,
    portraitClassName: 'artist-portrait artist-portrait--shreya',
    cardPortrait: `${assetPathPrefix}/1fbda.png`,
    cardSecondary: `${assetPathPrefix}/3a288.png`,
    avatar: `${assetPathPrefix}/09bd3.png`,
  },
]

function ScheduleCard({ artist, activeIndex = 0, onSelectDay }) {
  const days = ['DAY 1', 'DAY 2', 'DAY 3']

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

function useScrubCrossfade(
  ref,
  { bgRefs, portraitRefs, boardRefs, onIndexChange, snap = false },
) {
  useLayoutEffect(() => {
    const section = ref.current
    if (!section) return
    if (
      typeof window !== 'undefined' &&
      window.getComputedStyle(section).display === 'none'
    )
      return
    const scroller = section.closest('.main-scroll')

    const context = gsap.context(() => {
      const bgs = (bgRefs?.current || []).filter(Boolean)
      const ports = (portraitRefs?.current || []).filter(Boolean)
      const boards = (boardRefs?.current || []).filter(Boolean)
      const count = bgs.length
      if (count < 2) return

      gsap.set(bgs.slice(1), { autoAlpha: 0 })
      if (ports.length > 1)
        gsap.set(ports.slice(1), { yPercent: 100, autoAlpha: 0 })
      if (boards.length > 1)
        gsap.set(boards.slice(1), { yPercent: 100, autoAlpha: 0 })

      const tl = gsap.timeline({
        defaults: { duration: 1 },
        scrollTrigger: {
          trigger: section,
          ...(scroller ? { scroller } : {}),
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (onIndexChange) {
              const idx = Math.min(
                Math.round(self.progress * (count - 1)),
                count - 1,
              )
              onIndexChange(idx)
            }
          },
        },
      })

      for (let i = 0; i < count - 1; i++) {
        const t = i

        tl.to(bgs[i], { autoAlpha: 0, ease: 'none' }, t).to(
          bgs[i + 1],
          { autoAlpha: 1, ease: 'none' },
          t,
        )

        if (ports[i] && ports[i + 1]) {
          tl.to(
            ports[i],
            { yPercent: PORTRAIT_EXIT, autoAlpha: 0, ease: PORTRAIT_EASE },
            t,
          ).to(
            ports[i + 1],
            { yPercent: 0, autoAlpha: 1, ease: PORTRAIT_EASE },
            t,
          )
        }

        // Moves the artist board synchronized at the identical scroll rate and curve as the portraits
        if (boards[i] && boards[i + 1]) {
          tl.to(
            boards[i],
            { yPercent: PORTRAIT_EXIT, autoAlpha: 0, ease: PORTRAIT_EASE },
            t,
          ).to(
            boards[i + 1],
            { yPercent: 0, autoAlpha: 1, ease: PORTRAIT_EASE },
            t,
          )
        }
      }
    }, section)

    return () => context.revert()
  }, [ref, bgRefs, portraitRefs, boardRefs, onIndexChange, snap])
}

function edgePoint(rect, dx, dy) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const scale = Math.min(
    rect.width / 2 / Math.abs(dx || Infinity),
    rect.height / 2 / Math.abs(dy || Infinity),
  )
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
  return { start: edgePoint(rectA, dx, dy), end: edgePoint(rectB, -dx, -dy) }
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

/**
 * One connector arrow. It stores its own `progress` (0 = hidden, 1 = fully
 * drawn) and re-applies it whenever it re-measures, so a drawn arrow STAYS
 * drawn. The coordinator in ArtistBoard drives progress.
 */
const ConnectorArrow = forwardRef(function ConnectorArrow(
  { getFrom, getTo, slideRef, bend = 1 },
  ref,
) {
  const [segment, setSegment] = useState(null)
  const pathRef = useRef(null)
  const arrowheadRef = useRef(null)
  const progressRef = useRef(0)
  const segmentKeyRef = useRef('')

  // Keep latest getters in refs so the measuring effect doesn't re-run
  // (and re-render) every time the parent re-renders.
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
      const slideBox = slide.getBoundingClientRect()
      const rectOf = (el) => {
        const b = el.getBoundingClientRect()
        return {
          left: b.left - slideBox.left,
          top: b.top - slideBox.top,
          width: b.width,
          height: b.height,
        }
      }
      const seg = segmentBetween(rectOf(fromEl), rectOf(toEl))
      const key = [seg.start.x, seg.start.y, seg.end.x, seg.end.y]
        .map((n) => n.toFixed(1))
        .join(',')
      if (key === segmentKeyRef.current) return // nothing changed, don't reset anything
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
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length} ${length}`
    path.style.strokeDashoffset = `${length * (1 - p)}`
    if (p <= 0) {
      head.style.opacity = '0'
    } else {
      head.style.opacity = '1'
      placeArrowheadAt(path, head, length, length * p)
    }
  }

  // Whenever the path is (re)created, restore its current progress.
  useLayoutEffect(() => {
    applyProgress(progressRef.current)
  }, [segment])

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (p) => applyProgress(p),
      getProgress: () => progressRef.current,
      // True once the target image has entered the visible board.
      canStart() {
        const to = getToRef.current()
        const board = slideRef.current?.closest('.artist-board')
        if (!board || !to || !pathRef.current) return false
        const b = board.getBoundingClientRect()
        if (b.width === 0) return false
        return to.getBoundingClientRect().left < b.right - 4
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

function ArtistContent({ artist, connectorRefs, connectorBaseIndex = 0 }) {
  const slideRef = useRef(null)
  const avatarRef = useRef(null)
  const secondaryRef = useRef(null)
  const primaryRef = useRef(null)

  // Target of the 3rd arrow: the next slide's avatar. The last slide has no
  // next sibling, so use a virtual rect one slide-width to the right; that
  // is exactly where the next (looped) slide's avatar will arrive.
  const getNextAvatar = () => {
    const next =
      slideRef.current?.nextElementSibling?.querySelector('.slide__avatar')
    if (next) return next
    const avatar = avatarRef.current
    const slide = slideRef.current
    if (!avatar || !slide) return null
    return {
      getBoundingClientRect: () => {
        const r = avatar.getBoundingClientRect()
        const w = slide.getBoundingClientRect().width
        return new DOMRect(r.left + w, r.top, r.width, r.height)
      },
    }
  }

  return (
    <div className='artist-content-slide' ref={slideRef}>
      <img
        ref={avatarRef}
        className='slide__avatar'
        src={artist.avatar}
        alt=''
      />

      <svg className='connector-overlay' aria-hidden='true'>
        <ConnectorArrow
          ref={(el) => {
            // connectorRefs is a parent-owned imperative-handle collection,
            // not render state; writing into it here is the intended pattern.
            if (connectorRefs)
              // eslint-disable-next-line react-hooks/immutability
              connectorRefs.current[connectorBaseIndex + 0] = el
          }}
          slideRef={slideRef}
          bend={1}
          getFrom={() => avatarRef.current}
          getTo={() => secondaryRef.current}
        />
        <ConnectorArrow
          ref={(el) => {
            if (connectorRefs)
              // eslint-disable-next-line react-hooks/immutability
              connectorRefs.current[connectorBaseIndex + 1] = el
          }}
          slideRef={slideRef}
          bend={-1}
          getFrom={() => secondaryRef.current}
          getTo={() => primaryRef.current}
        />
        <ConnectorArrow
          ref={(el) => {
            if (connectorRefs)
              // eslint-disable-next-line react-hooks/immutability
              connectorRefs.current[connectorBaseIndex + 2] = el
          }}
          slideRef={slideRef}
          bend={1}
          getFrom={() => primaryRef.current}
          getTo={getNextAvatar}
        />
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

      <h2 className='slide__name'>{artist.name}</h2>
    </div>
  )
}

const ArtistBoard = memo(function ArtistBoard({ artist }) {
  const dupes = [artist, artist]
  // 6 arrows: [slide0: a0 a1 a2, slide1: a0 a1 a2]
  const connectorRefs = useRef([])
  // Number of marquee loops completed so far.
  const loopsRef = useRef(0)

  // The marquee is seamless because slide 1 becomes slide 0 on every loop.
  // Mirror that for the arrows: slide 1's drawn state moves to slide 0 and
  // slide 1 starts fresh (its images are the brand-new ones arriving).
  const handleIteration = (e) => {
    if (e.target !== e.currentTarget) return
    loopsRef.current += 1
    const arrows = connectorRefs.current
    for (let i = 0; i < 3; i++) {
      const from = arrows[i + 3]
      const to = arrows[i]
      if (from && to) {
        to.setProgress(from.getProgress())
        // Let the marquee finish its loop reset before recycling the outgoing arrow.
        requestAnimationFrame(() => from.setProgress(0))
      }
    }
  }

  useLayoutEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      // No motion: show every arrow fully drawn.
      connectorRefs.current.forEach((a) => a?.setProgress(1))
      return
    }

    let cancelled = false
    let timer = null
    let tween = null
    // Logical arrow number: 0,1,2 = first slide, 3,4,5 = next slide, ...
    // Its DOM arrow is (L - 3 * loops), because each loop drops one slide.
    let L = 0

    const wait = () => {
      timer = setTimeout(step, 60)
    }

    const step = () => {
      if (cancelled) return
      const loops = loopsRef.current
      if (L < 3 * loops) L = 3 * loops // that slide already scrolled away
      const arrow = connectorRefs.current[L - 3 * loops]
      if (!arrow) return wait()
      if (arrow.getProgress() >= 1) {
        L += 1 // already drawn, it stays; move on
        return step()
      }
      // Start only when the image this arrow points to has reached the board.
      if (!arrow.canStart()) return wait()

      const current = L
      const prog = { v: 0 }
      tween = gsap.to(prog, {
        v: 1,
        duration: CONNECTOR_DURATION,
        ease: 'power1.inOut',
        onUpdate: () => {
          connectorRefs.current[current - 3 * loopsRef.current]?.setProgress(
            prog.v,
          )
        },
        onComplete: () => {
          connectorRefs.current[current - 3 * loopsRef.current]?.setProgress(1)
          L = current + 1
          step() // next arrow starts from the image this one just reached
        },
      })
    }

    step()

    return () => {
      cancelled = true
      clearTimeout(timer)
      tween?.kill()
    }
  }, [])

  return (
    <div className='artist-board'>
      <img
        className='artist-board__texture'
        src={`${assetPathPrefix}/88fac.png`}
        alt=''
      />
      <div className='board-marquee'>
        <div
          className='board-marquee-track'
          onAnimationIteration={handleIteration}
        >
          {dupes.map((a, i) => (
            <ArtistContent
              artist={a}
              key={`${a.name}-${i}`}
              connectorRefs={connectorRefs}
              connectorBaseIndex={i * 3}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

function ArtistMobile() {
  const days = ['DAY 1', 'DAY 2', 'DAY 3']
  const sectionRef = useRef(null)
  const pageRefs = useRef([])
  const mobileBgRefs = useRef([])
  const [activeDay, setActiveDay] = useState(0)

  useScrubCrossfade(sectionRef, {
    bgRefs: mobileBgRefs,
    portraitRefs: null,
    boardRefs: null,
  })

  useLayoutEffect(() => {
    const pages = pageRefs.current.filter(Boolean)
    if (!pages.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setActiveDay(Number(entry.target.dataset.index))
        })
      },
      { threshold: 0.5 },
    )
    pages.forEach((page) => observer.observe(page))
    return () => observer.disconnect()
  }, [])

  const goToDay = (index) => {
    setActiveDay(index)
    const targetIdx = index % artists.length
    pageRefs.current[targetIdx]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section
      ref={sectionRef}
      className='proshow-mobile'
      aria-label='Proshow artists mobile'
    >
      <div className='mobile-sticky' aria-hidden='true'>
        {artists.map((artist, index) => (
          <div
            className='mobile-bg-layer'
            key={`m-bg-${artist.name}`}
            ref={(el) => {
              mobileBgRefs.current[index] = el
            }}
          >
            <img src={artist.background} alt='' />
          </div>
        ))}
      </div>

      <div className='mobile-pages'>
        {artists.map((artist, index) => (
          <div
            key={artist.name}
            data-index={index}
            ref={(el) => {
              pageRefs.current[index] = el
            }}
            className='mobile-page'
          >
            <div className='mobile-body'>
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
              <div className='mobile-stage'>
                <ArtistBoard artist={artist} />
              </div>
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
    </section>
  )
}

export default function App() {
  const sectionRef = useRef(null)
  const bgRefs = useRef([])
  const portraitRefs = useRef([])
  const boardRefs = useRef([])
  const [activeArtistIndex, setActiveArtistIndex] = useState(0)

  useScrubCrossfade(sectionRef, {
    bgRefs,
    portraitRefs,
    boardRefs,
    onIndexChange: setActiveArtistIndex,
  })

  const handleSelectDay = (dayIndex) => {
    const section = sectionRef.current
    if (!section) return
    const targetIdx = dayIndex % artists.length
    const rect = section.getBoundingClientRect()
    const scroller = section.closest('.main-scroll') || window

    // Calculates position based on GSAP scroll progress formula
    const scrollStart =
      (scroller === window ? window.scrollY : scroller.scrollTop) + rect.top
    const totalScroll = rect.height - window.innerHeight
    const targetProgress = targetIdx / (artists.length - 1)
    const targetScroll = scrollStart + totalScroll * targetProgress

    scroller.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    })
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
          grid-template-columns: minmax(0, 47.2%) minmax(0, 52.8%);
          background: #1c1c1c;
          position: relative;
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
          overflow: hidden;
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
          overflow: hidden;
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
          top: 50%;
          left: 50px;
          transform: translateY(-50%);
          width: 100%;
          height: 90%;
        }

        .artist-portrait--shreya {
          left: -4%;
          bottom: -1%;
          width: 91%;
          height: 76%;
        }

        .schedule-card {
          position: absolute;
          z-index: 3;
          top: 11%;
          right: 17%;
          width: min(330px, 48%);
          min-width: 260px;
          overflow: hidden;
          border: 1px solid #323231;
          border-radius: 9px;
          background: #202020;
          transition: border-color 0.3s ease;
        }

        .schedule-days {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          height: 44px;
          padding: 6px 16px;
          border-bottom: 1px solid #d63d5e;
          font-family: 'Arial Black', sans-serif;
        }

        .schedule-days button {
          height: 28px;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          font-size: 13px;
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
          padding: 12px 24px 22px;
          font-size: 13px;
          line-height: 1.28;
          font-variation-settings: 'wdth' 100;
          transition: opacity 0.25s ease;
        }

        .artist-list {
          grid-column: 2 / 3;
          grid-row: 1 / -1;
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .artist-list-viewport {
          position: sticky;
          top: 0;
          height: 100dvh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2vw;
        }

        .artist-board-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          will-change: transform, opacity;
          padding: 2vw;
        }

        .artist-board-layer:not(:first-child) {
          opacity: 0;
          visibility: hidden;
        }

        .artist-board {
          position: relative;
          width: 100%;
          max-width: 700px;
          aspect-ratio: 831 / 743;
          overflow: hidden;
          border-radius: 24px;
          container-type: inline-size;
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
          animation: board-scroll 7s linear infinite;
        }

        @keyframes board-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .artist-content-slide {
          position: relative;
          width: 100cqi;
          aspect-ratio: 831 / 743;
          flex-shrink: 0;
        }

        .slide__avatar {
          position: absolute;
          z-index: 2;
          top: 35%;
          left: 8%;
          width: 10%;
          aspect-ratio: 1;
          border-radius: 50%;
          object-fit: cover;
        }

        .slide__secondary {
          position: absolute;
          z-index: 2;
          top: 55%;
          left: 32%;
          width: 24%;
          height: 38%;
          object-fit: cover;
          border-radius: 12px;
        }

        .slide__primary {
          position: absolute;
          z-index: 2;
          top: 10%;
          left: 68%;
          width: 24%;
          height: 38%;
          object-fit: cover;
          border-radius: 12px;
        }

        .slide__name {
          position: absolute;
          z-index: 3;
          top: 65%;
          left: 65%;
          margin: 0;
          color: white;
          font-family: 'La Belle Aurore:Regular', cursive;
          font-size: clamp(28px, 3.2vw, 52px);
          transform: rotate(-10deg);
        }

        .connector-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
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
          .board-marquee-track {
            animation: none;
          }
          .featured-bg-layer,
          .featured-portrait-layer,
          .artist-board-layer {
            will-change: auto;
          }
        }

        .proshow-mobile {
          display: none;
        }

        @media (max-width: 768px) {
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
            position: relative;
            display: block;
            background: #1c1c1c;
          }

          .mobile-sticky {
            position: sticky;
            top: 0;
            height: 100dvh;
            overflow: hidden;
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

          .mobile-pages {
            position: relative;
            z-index: 1;
            margin-top: -100dvh;
          }

          .mobile-page {
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 12px 12px 24px;
          }

          .mobile-body {
            display: flex;
            gap: 10px;
          }

          .mobile-days {
            display: flex;
            flex-direction: column;
            gap: 26px;
            align-items: center;
            padding: 26px 8px;
            border: 1px solid #323231;
            border-radius: 9px;
            background: #202020;
            margin-top: 50px;
          }

          .mobile-days button {
            padding: 4px 8px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #fff;
            font-family: 'Bebas Neue', 'Bebas Neue:Regular', sans-serif;
            font-size: 19px;
            letter-spacing: 0.04em;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            cursor: pointer;
          }

          .mobile-days .is-active {
            background: #7786ff;
          }

          .mobile-stage {
            flex: 1;
            min-width: 0;
          }

          .mobile-stage .artist-page {
            height: auto;
            min-height: 0;
            padding: 0;
          }

          .mobile-stage .artist-board-sticky {
            position: relative;
            height: auto;
            padding: 0;
          }

          .mobile-stage .artist-board {
            border-radius: 18px;
            height: 75dvh;
            aspect-ratio: auto;
            margin-top: 50px;
          }

          .mobile-stage .artist-content-slide {
            width: auto;
            height: 100%;
          }

          .mobile-name {
            position: relative;
            z-index: 1;
            margin: 18px 0 0;
            color: #fff;
            font-family: 'Bebas Neue', 'Bebas Neue:Regular', sans-serif;
            font-size: 72px;
            line-height: 0.95;
          }

          .mobile-desc {
            position: relative;
            z-index: 1;
            margin: 10px 0 0;
            max-width: 34ch;
            font-size: 12px;
            line-height: 1.4;
            opacity: 0.9;
          }
        }
      `}</style>
      <main
        ref={sectionRef}
        className='proshow-section'
        id='proshow'
        style={{ minHeight: `${artists.length * 300}dvh` }}
      >
        {/* Global Backgrounds - Spans entire width, sticky */}
        <div className='global-bg-container'>
          {artists.map((artist, index) => (
            <div
              className='featured-bg-layer'
              key={`bg-${artist.name}`}
              ref={(el) => {
                bgRefs.current[index] = el
              }}
            >
              <img
                className='featured-background'
                src={artist.background}
                alt=''
              />
            </div>
          ))}
        </div>

        <section className='featured-column' aria-label='Featured artist'>
          <div className='featured-viewport'>
            {/* Portraits - separate layer, these slide */}
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
            {/* Static Schedule Card positioned at the top; active tab switches with scroll */}
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

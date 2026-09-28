"use client";

import { useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "./Artist.css"

gsap.registerPlugin(ScrollTrigger)

const assetPathPrefix = "/images/artist"

const artists = [
  {
    name: "Arijit Singh",
    background: `${assetPathPrefix}/21bbf.png`,
    portrait: `${assetPathPrefix}/af3e8.png`,
    portraitClassName: "artist-portrait artist-portrait--arijit",
    cardPortrait: `${assetPathPrefix}/50195.png`,
    cardSecondary: `${assetPathPrefix}/8577e.png`,
    avatar: `${assetPathPrefix}/475ef.png`,
  },
  {
    name: "Shreya ghoshal",
    background: `${assetPathPrefix}/bef85.png`,
    portrait: `${assetPathPrefix}/ec2ea.png`,
    portraitClassName: "artist-portrait artist-portrait--shreya",
    cardPortrait: `${assetPathPrefix}/1fbda.png`,
    cardSecondary: `${assetPathPrefix}/3a288.png`,
    avatar: `${assetPathPrefix}/09bd3.png`,
  },
]

function FestivalMark() {
  return (
    <div className="festival-mark" aria-label="Tathva 2026">
      <span>TATHVA 2026</span>
      <small>NIT CALICUT</small>
    </div>
  )
}

function ScheduleCard() {
  return (
    <div className="schedule-card">
      <div className="schedule-days">
        <button type="button">DAY 1</button>
        <button className="is-active" type="button">
          DAY 2
        </button>
        <button type="button">DAY 3</button>
      </div>
      <p>
        Brace yourselves for a magical night as the legendary Shreya Ghoshal
        takes the stage alongside an electrifying Artist 3. Get ready to sing,
        sway, and make memories!
      </p>
    </div>
  )
}

// --- Connector geometry -----------------------------------------------
// Connectors join the real rendered boxes of two elements, so moving a card
// in CSS re-solves every arrow on the next resize instead of drifting.

// Shared scrub crossfade: bg fades while portrait slides, scoped to `ref`.
function useScrubCrossfade(ref, bgSel, portraitSel) {
  useLayoutEffect(() => {
    const section = ref.current
    if (!section) return
    const context = gsap.context(() => {
      const backgrounds = gsap.utils.toArray(bgSel)
      const portraits = portraitSel ? gsap.utils.toArray(portraitSel) : []
      gsap.set(backgrounds.slice(1), { autoAlpha: 0 })
      gsap.set(portraits.slice(1), { yPercent: 100, autoAlpha: 0 })
      const timeline = gsap.timeline({
        scrollTrigger: {
          scroller: document.querySelector(".main-scroll") || window,
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          // Lenis (added globally) already smooths the scroll position
          // itself, so a numeric scrub here compounds a second, separate
          // second-plus of catch-up lag on top of that — `true` tracks the
          // already-smoothed position directly instead of double-lagging.
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      portraits.slice(1).forEach((incoming, index) => {
        timeline
          .to(backgrounds[index], { autoAlpha: 0, ease: "none" })
          .to(backgrounds[index + 1], { autoAlpha: 1, ease: "none" }, "<")
          .to(portraits[index], { yPercent: -15, autoAlpha: 0, ease: "none" }, "<")
          .to(incoming, { yPercent: 0, autoAlpha: 1, ease: "none" }, "<")
      })
      if (!portraits.length && backgrounds.length > 1) {
        backgrounds.slice(1).forEach((incoming, index) => {
          timeline
            .to(backgrounds[index], { autoAlpha: 0, ease: "none" })
            .to(incoming, { autoAlpha: 1, ease: "none" }, "<")
        })
      }
    }, section)
    return () => context.revert()
  }, [])
}

// Ray/box exit point of a ray from `rect`'s center towards (dx, dy).
function edgePoint(rect, dx, dy) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const scale = Math.min(rect.width / 2 / Math.abs(dx || Infinity), rect.height / 2 / Math.abs(dy || Infinity))
  return { x: cx + dx * scale, y: cy + dy * scale }
}

function segmentBetween(rectA, rectB) {
  const centerA = { x: rectA.left + rectA.width / 2, y: rectA.top + rectA.height / 2 }
  const centerB = { x: rectB.left + rectB.width / 2, y: rectB.top + rectB.height / 2 }
  const dx = centerB.x - centerA.x
  const dy = centerB.y - centerA.y
  return { start: edgePoint(rectA, dx, dy), end: edgePoint(rectB, -dx, -dy) }
}

// Straight start->end segment as a gentle cubic bow; returns `d` plus the
// arrival angle so the head trails the curve's own direction.
function buildCurve(start, end, bend = 1) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy) || 1
  const perpX = (-dy / distance) * bend
  const perpY = (dx / distance) * bend
  const curvature = distance * 0.18
  const c1 = { x: start.x + dx / 3 + perpX * curvature, y: start.y + dy / 3 + perpY * curvature }
  const c2 = { x: start.x + (dx * 2) / 3 + perpX * curvature, y: start.y + (dy * 2) / 3 + perpY * curvature }
  return {
    d: `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`,
    angle: Math.atan2(end.y - c2.y, end.x - c2.x) * (180 / Math.PI),
  }
}

// Static arrow between two elements, re-measured on resize.
function ConnectorArrow({ getFrom, getTo, slideRef, bend = 1 }) {
  const [segment, setSegment] = useState(null)

  useLayoutEffect(() => {
    const measure = () => {
      const slide = slideRef.current
      const fromEl = getFrom?.()
      const toEl = getTo?.()
      if (!slide || !fromEl || !toEl) return setSegment(null)
      const slideBox = slide.getBoundingClientRect()
      if (slideBox.width === 0 || slideBox.height === 0) return setSegment(null)
      const rectOf = (el) => {
        const b = el.getBoundingClientRect()
        return { left: b.left - slideBox.left, top: b.top - slideBox.top, width: b.width, height: b.height }
      }
      setSegment(segmentBetween(rectOf(fromEl), rectOf(toEl)))
    }
    measure()
    const raf = requestAnimationFrame(measure)
    const ro = new ResizeObserver(measure)
    if (slideRef.current) ro.observe(slideRef.current)
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  if (!segment) return null
  const { d, angle } = buildCurve(segment.start, segment.end, bend)
  return (
    <>
      <path d={d} className="connector-line" />
      <g
        className="connector-arrowhead-group"
        transform={`translate(${segment.end.x} ${segment.end.y}) rotate(${angle})`}
      >
        <path
          className="connector-arrowhead"
          d="M0,0 L-9,-4.5 L-9,4.5 Z"
        />
      </g>
    </>
  )
}

// Draws the three connector arrows in on scroll-into-view, one after another;
// only once the last arrowhead lands does `onArrowsComplete` fire, so the
// caller can hold the image marquee still until the arrows are done (melius.com-style reveal).
function ArtistContent({ artist, isIntro = false, onArrowsComplete }) {
  const slideRef = useRef(null)
  const avatarRef = useRef(null)
  const secondaryRef = useRef(null)
  const primaryRef = useRef(null)

  useLayoutEffect(() => {
    if (!isIntro) return
    const slide = slideRef.current
    if (!slide) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onArrowsComplete?.()
      return
    }

    let raf = 0
    let cancelled = false
    let hiddenApplied = false
    let hasPlayed = false
    let intersecting = false
    let ctx = null

    const initHidden = () => {
      const lines = slide.querySelectorAll(".connector-line")
      const heads = slide.querySelectorAll(".connector-arrowhead")
      if (lines.length < 3 || heads.length < 3) return false
      if (!hiddenApplied) {
        lines.forEach((line) => {
          const len = Math.ceil(line.getTotalLength()) + 5
          gsap.set(line, { strokeDasharray: len, strokeDashoffset: len })
        })
        gsap.set(heads, { autoAlpha: 0, scale: 0, transformOrigin: "0px 0px" })
        hiddenApplied = true
      }
      return true
    }

    const tryPlay = () => {
      if (cancelled || hasPlayed) return
      if (!initHidden()) {
        raf = requestAnimationFrame(tryPlay)
        return
      }
      if (!intersecting) return
      hasPlayed = true

      ctx = gsap.context(() => {
        const lines = slide.querySelectorAll(".connector-line")
        const heads = slide.querySelectorAll(".connector-arrowhead")

        const tl = gsap.timeline({
          delay: 0.25,
          onComplete: () => {
            gsap.set(lines, { clearProps: "strokeDasharray,strokeDashoffset" })
            gsap.set(heads, { clearProps: "transform,opacity,visibility" })
            onArrowsComplete?.()
          },
        })

        lines.forEach((line, i) => {
          tl.to(line, {
            strokeDashoffset: 0,
            duration: 0.65,
            ease: "power2.inOut",
          }).to(
            heads[i],
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.25,
              ease: "back.out(2)",
            },
            "-=0.12"
          )
        })
      }, slide)
    }

    raf = requestAnimationFrame(tryPlay)

    const scroller = document.querySelector(".main-scroll") || null
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting = true
            tryPlay()
            observer.disconnect()
          }
        })
      },
      {
        root: scroller,
        threshold: 0.2,
      }
    )
    observer.observe(slide)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      ctx?.revert()
    }
  }, [isIntro])

  return (
    <div className="artist-content-slide" ref={slideRef}>
      <img ref={avatarRef} className="slide__avatar" src={artist.avatar} alt="" />

      <svg className="connector-overlay" aria-hidden="true">
        <ConnectorArrow
          slideRef={slideRef}
          bend={1}
          getFrom={() => avatarRef.current}
          getTo={() => secondaryRef.current}
        />
        <ConnectorArrow
          slideRef={slideRef}
          bend={-1}
          getFrom={() => secondaryRef.current}
          getTo={() => primaryRef.current}
        />
        <ConnectorArrow
          slideRef={slideRef}
          bend={1}
          getFrom={() => primaryRef.current}
          getTo={() => {
            const next = slideRef.current?.nextElementSibling
            if (next) {
              const avatar = next.querySelector(".slide__avatar")
              if (avatar) return avatar
            }
            // For the last slide in the track, wrap around to the next loop iteration:
            // The next avatar is positioned at (avatar.left + slide.offsetWidth)
            const avatar = avatarRef.current
            const slide = slideRef.current
            if (!avatar || !slide) return null
            const b = avatar.getBoundingClientRect()
            const s = slide.getBoundingClientRect()
            return {
              getBoundingClientRect: () => ({
                left: b.left + s.width,
                top: b.top,
                right: b.right + s.width,
                bottom: b.bottom,
                width: b.width,
                height: b.height,
              }),
            }
          }}
        />
      </svg>

      <img
        ref={secondaryRef}
        className="slide__secondary"
        src={artist.cardSecondary}
        alt={`${artist.name} on stage`}
      />
      <img
        ref={primaryRef}
        className="slide__primary"
        src={artist.cardPortrait}
        alt={`${artist.name} performing`}
      />

      <h2 className="slide__name">{artist.name}</h2>
    </div>
  )
}

function ArtistBoard({ artist }) {
  // ponytail: 2 copies is the minimum seamless -50% marquee loop; add more only if a gap shows on ultrawide
  const dupes = [artist, artist]
  // Marquee starts paused (see .board-marquee-track in Artist.css) and only
  // unpauses once the first slide's arrows finish drawing in.
  const [marqueeActive, setMarqueeActive] = useState(false)
  return (
    <div className="artist-page snap-start snap-always">
      <div className="artist-board">
        {/* Static texture background */}
        <img
          className="artist-board__texture"
          src={`${assetPathPrefix}/88fac.png`}
          alt=""
        />
        {/* Marquee of artist content scrolling inside the board */}
        <div className="board-marquee">
          <div className={`board-marquee-track${marqueeActive ? " is-playing" : ""}`}>
            {dupes.map((a, i) => (
              <ArtistContent
                artist={a}
                key={`${a.name}-${i}`}
                isIntro={i === 0}
                onArrowsComplete={i === 0 ? () => setMarqueeActive(true) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArtistMobile() {
  const days = ["DAY 1", "DAY 2", "DAY 3"]
  const sectionRef = useRef(null)
  const pageRefs = useRef([])
  const [activeDay, setActiveDay] = useState(0)

  // ponytail: mobile portrait layers are display:none in CSS, so only backgrounds crossfade here
  useScrubCrossfade(sectionRef, ".mobile-bg-layer", null)

  // Highlight the day tab of the artist currently in view.
  useLayoutEffect(() => {
    const pages = pageRefs.current.filter(Boolean)
    if (!pages.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveDay(Number(entry.target.dataset.index))
        })
      },
      { threshold: 0.5 }
    )
    pages.forEach((page) => observer.observe(page))
    return () => observer.disconnect()
  }, [])

  const goToDay = (index) => {
    setActiveDay(index)
    // ponytail: 3 day tabs over 2 artists, cycle with % instead of new data
    pageRefs.current[index % artists.length]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section ref={sectionRef} className="proshow-mobile" aria-label="Proshow artists mobile">
      <div className="mobile-sticky" aria-hidden="true">
        {artists.map((artist) => (
          <div className="mobile-bg-layer" key={`m-bg-${artist.name}`}>
            <img src={artist.background} alt="" />
          </div>
        ))}
      </div>

      <div className="mobile-pages">
        {artists.map((artist, index) => (
          <div
            key={artist.name}
            data-index={index}
            ref={(el) => {
              pageRefs.current[index] = el
            }}
            className="mobile-page snap-start snap-always"
          >
            <div className="mobile-body">
              <nav className="mobile-days" aria-label="Performance days">
                {days.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    aria-selected={activeDay === i}
                    className={activeDay === i ? "is-active" : ""}
                    onClick={() => goToDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="mobile-stage">
                <ArtistBoard artist={artist} />
              </div>
            </div>
            <h2 className="mobile-name">{artist.name}</h2>
            <p className="mobile-desc">
              Brace yourselves for a magical night as the legendary {artist.name}{" "}
              takes the stage. Get ready to sing, sway, and make memories!
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const sectionRef = useRef(null)

  // This section is composed onto the home page's shared `.main-scroll`
  // container alongside other scroll-scrubbed sections (Wheels, Robowars),
  // so it can't claim document-level scroll-snap for itself the way it could
  // as a standalone route — snapping `.main-scroll` would fight those
  // sections' own scrub animations. Scoped snapping within a shared scroller
  // would need its own opt-in redesign, so it's left off here for now.

  useScrubCrossfade(sectionRef, ".featured-bg-layer", ".featured-portrait-layer")

  return (
    <main ref={sectionRef} className="proshow-section" id="proshow">
      {/* Global Backgrounds - Spans entire width, sticky */}
      <div className="global-bg-container">
        {artists.map((artist) => (
          <div className="featured-bg-layer" key={`bg-${artist.name}`}>
            <img
              className="featured-background"
              src={artist.background}
              alt=""
            />
          </div>
        ))}
      </div>

      <section className="featured-column" aria-label="Featured artist">
        <div className="featured-viewport">
          {/* Portraits - separate layer, these slide */}
          {artists.map((artist) => (
            <div className="featured-portrait-layer" key={`portrait-${artist.name}`}>
              <img
                className={artist.portraitClassName}
                src={artist.portrait}
                alt={`${artist.name} featured artist`}
              />
            </div>
          ))}
          <ScheduleCard />
        </div>
      </section>

      {/* Desktop badge: direct child so .featured-viewport's overflow:hidden doesn't slice it. */}
      <FestivalMark />

      <section className="artist-list" aria-label="Proshow artists">
        {artists.map((artist) => (
          <ArtistBoard artist={artist} key={artist.name} />
        ))}
      </section>

      <ArtistMobile />
    </main>
  )
}
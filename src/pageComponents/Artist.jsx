"use client";

import { useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const assetPathPrefix = "/images/artist"

const artists = [
  {
    name: "Arijit Singh",
    background: `${assetPathPrefix}/21bbf.png`,
    portrait: `${assetPathPrefix}/af3e8.png`,
    portraitClassName: "artist-portrait artist-portrait--arijit",
    portraitStyle: { width: "100%", height: "90%" },
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

function Header() {
  return (
    <header className="site-header">
      <img
        className="site-logo"
        src={`${assetPathPrefix}/32c3b.png`}
        alt="Tathva"
      />
      <button className="menu-button" type="button" aria-label="Open menu">
        <img src={`${assetPathPrefix}/4e2c4.svg`} alt="" />
      </button>
      <nav aria-label="Main navigation">
        <a href="#proshow">PROSHOW</a>
        <i>/</i>
        <a href="#workshops">WORKSHOPS</a>
        <i>/</i>
        <a href="#campus">CAMPUS AMBASADOR</a>
        <i>/</i>
        <a href="#gallery">GALLERY</a>
      </nav>
      <FestivalMark />
    </header>
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
// Instead of hand-tuned top/left/width/rotate() values on a static arrow
// image (which drift out of alignment the moment .slide__avatar,
// .slide__secondary or .slide__primary get repositioned), we measure the
// REAL rendered boxes of the two elements a connector should join and draw
// a line between the edges that face each other. Move a card in CSS and
// every connector touching it re-solves itself on the next paint/resize.

// Where a ray from `from`'s center towards `to`'s center exits `from`'s
// rectangle (classic ray/box intersection).
function edgePoint(rect, dx, dy) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const halfW = rect.width / 2
  const halfH = rect.height / 2
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity
  const scale = Math.min(scaleX, scaleY)
  return { x: cx + dx * scale, y: cy + dy * scale }
}

function segmentBetween(rectA, rectB) {
  const centerA = { x: rectA.left + rectA.width / 2, y: rectA.top + rectA.height / 2 }
  const centerB = { x: rectB.left + rectB.width / 2, y: rectB.top + rectB.height / 2 }
  const dx = centerB.x - centerA.x
  const dy = centerB.y - centerA.y
  return {
    start: edgePoint(rectA, dx, dy),
    end: edgePoint(rectB, -dx, -dy),
  }
}

// Turns a straight start->end segment into a gentle cubic-bezier bow.
// `bend` flips which side it bulges towards (used to zig-zag the three
// connectors instead of having them all bow the same way). Returns the
// path's `d` plus the tangent angle the curve actually arrives at end
// with — NOT the straight start->end angle, since the curve approaches
// from the direction of its second control point.
function buildCurve(start, end, bend = 1) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy) || 1
  const perpX = (-dy / distance) * bend
  const perpY = (dx / distance) * bend
  const curvature = distance * 0.18

  const c1 = { x: start.x + dx / 3 + perpX * curvature, y: start.y + dy / 3 + perpY * curvature }
  const c2 = { x: start.x + (dx * 2) / 3 + perpX * curvature, y: start.y + (dy * 2) / 3 + perpY * curvature }

  const d = `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`
  const angle = Math.atan2(end.y - c2.y, end.x - c2.x) * (180 / Math.PI)

  return { d, angle }
}

// Draws one arrow between two elements, resolved fresh from getFrom/getTo
// (plain functions so connector-3 can reach into the *next* marquee slide,
// which doesn't exist as a ref on this component). `delay` staggers the
// draw-in animation so the three arrows don't all pulse in sync. `visible`
// comes from the parent slide's IntersectionObserver: the arrow draws in
// once when the slide is in frame, stays fully drawn while it remains in
// frame, and only resets while the slide is off-screen (so the reset is
// never actually seen — it's already invisible when it happens). `animate`
// renders the arrow fully drawn with no draw-in animation (used for the two
// left arrows — only the rightmost arrow animates).
function ConnectorArrow({ getFrom, getTo, slideRef, visible, delay = 0, bend = 1, animate = true }) {
  const [segment, setSegment] = useState(null)
  const lineRef = useRef(null)
  const headRef = useRef(null)
  const drawnRef = useRef(false)

  useLayoutEffect(() => {
    const measure = () => {
      const slide = slideRef.current
      const fromEl = getFrom()
      const toEl = getTo()
      if (!slide || !fromEl || !toEl) {
        setSegment(null)
        return
      }
      const slideBox = slide.getBoundingClientRect()
      const rectOf = (el) => {
        const b = el.getBoundingClientRect()
        return { left: b.left - slideBox.left, top: b.top - slideBox.top, width: b.width, height: b.height }
      }
      setSegment(segmentBetween(rectOf(fromEl), rectOf(toEl)))
    }

    measure()
    // The "next slide" sibling (for connector-3) may not exist on the very
    // first paint of a freshly duplicated marquee slide, so re-check once
    // after mount as well as on resize.
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

  // Runs only once this arrow actually has real coordinates, so it never
  // races the measurement above.
  useLayoutEffect(() => {
    if (!segment || !lineRef.current || !headRef.current) return
    const line = lineRef.current
    const head = headRef.current
    const length = line.getTotalLength()

    if (!animate) {
      // Static connector: always fully drawn, no draw-in animation.
      gsap.killTweensOf([line, head])
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: 0 })
      gsap.set(head, { opacity: 1 })
      return
    }

    if (!visible) {
      // Off-screen: reset instantly. Nothing is visibly "disappearing"
      // here — the slide has already scrolled out of the frame, so this
      // just arms the arrow to draw in fresh next time it enters.
      drawnRef.current = false
      gsap.killTweensOf([line, head])
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
      gsap.set(head, { opacity: 0 })
      return
    }

    if (drawnRef.current) {
      // Already fully drawn and holding — just keep the dash length in
      // sync in case a resize changed the curve's geometry, without
      // replaying the reveal.
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: 0 })
      return
    }

    // SVG marker-end sits at the path's endpoint regardless of
    // stroke-dasharray/dashoffset, so it used to render at full opacity
    // before the dash animation ever "reached" it. Drawing our own
    // triangle and fading it in only once the line finishes fixes that.
    drawnRef.current = true
    gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
    gsap.set(head, { opacity: 0 })
    const tl = gsap.timeline({ delay })
    tl.to(line, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" })
    tl.to(head, { opacity: 1, duration: 0.15 }, "-=0.1")

    return () => tl.kill()
  }, [segment, visible, delay, animate])

  if (!segment) return null

  const { d, angle } = buildCurve(segment.start, segment.end, bend)

  return (
    <>
      <path ref={lineRef} d={d} className="connector-line" />
      {/* Tip sits exactly at segment.end; base trails back along the curve's own arrival direction. */}
      <path
        ref={headRef}
        className="connector-arrowhead"
        d="M0,0 L-9,-4.5 L-9,4.5 Z"
        transform={`translate(${segment.end.x} ${segment.end.y}) rotate(${angle})`}
      />
    </>
  )
}

function ArtistContent({ artist }) {
  const slideRef = useRef(null)
  const avatarRef = useRef(null)
  const secondaryRef = useRef(null)
  const primaryRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useLayoutEffect(() => {
    const slide = slideRef.current
    if (!slide) return
    // .board-marquee is the overflow:hidden frame the cards scroll through,
    // so intersection with it is exactly "is this slide currently on screen".
    const root = slide.closest(".board-marquee") || null
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      root,
      threshold: 0,
    })
    observer.observe(slide)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="artist-content-slide" ref={slideRef}>
      <img ref={avatarRef} className="slide__avatar" src={artist.avatar} alt="" />

      <svg className="connector-overlay" aria-hidden="true">
        <ConnectorArrow
          slideRef={slideRef}
          visible={visible}
          animate={false}
          bend={1}
          getFrom={() => avatarRef.current}
          getTo={() => secondaryRef.current}
        />
        <ConnectorArrow
          slideRef={slideRef}
          visible={visible}
          animate={false}
          bend={-1}
          getFrom={() => secondaryRef.current}
          getTo={() => primaryRef.current}
        />
        <ConnectorArrow
          slideRef={slideRef}
          visible={visible}
          delay={1}
          bend={1}
          getFrom={() => primaryRef.current}
          getTo={() => slideRef.current?.nextElementSibling?.querySelector(".slide__avatar")}
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

function ArtistBoard({ artist, artistIdx }) {
  const dupes = [artist, artist, artist, artist, artist, artist]
  return (
    <div className="artist-page">
      <div className="artist-board">
        {/* Static texture background */}
        <img
          className="artist-board__texture"
          src={`${assetPathPrefix}/88fac.png`}
          alt=""
        />
        {/* Marquee of artist content scrolling inside the board */}
        <div className="board-marquee">
          <div className="board-marquee-track">
            {dupes.map((a, i) => (
              <ArtistContent artist={a} key={`${a.name}-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const sectionRef = useRef(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const context = gsap.context(() => {
      const backgrounds = gsap.utils.toArray(".featured-bg-layer")
      const portraits = gsap.utils.toArray(".featured-portrait-layer")

      gsap.set(backgrounds.slice(1), { autoAlpha: 0 })
      gsap.set(portraits.slice(1), { yPercent: 100, autoAlpha: 0 })

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
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
    }, section)

    return () => context.revert()
  }, [])

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
                style={artist.portraitStyle}
                src={artist.portrait}
                alt={`${artist.name} featured artist`}
              />
            </div>
          ))}
          <Header />
          <ScheduleCard />
        </div>
      </section>

      <section className="artist-list" aria-label="Proshow artists">
        {artists.map((artist, artistIdx) => (
          <ArtistBoard artist={artist} artistIdx={artistIdx} key={artist.name} />
        ))}
      </section>
    </main>
  )
}
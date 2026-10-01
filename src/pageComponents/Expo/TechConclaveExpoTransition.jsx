'use client'

import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TechConclave from '../TechConclave/TechConclave'
import Expo from './Expo'
import Crystal3D from './Crystal3D'
import { expoJourney, expoExit, journeyScreenPoint } from './expoJourney.mjs'
import HorizontalGallery from '../HorizontalGallery/HorizontalGallery'
import styles from './ExpoTransition.module.css'
import expoStyles from './Expo.module.css'

const subscribeMotion = (callback) => {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
const motionSnapshot = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches
const serverSnapshot = () => false

export default function TechConclaveExpoTransition() {
  const animated = useSyncExternalStore(subscribeMotion, motionSnapshot, serverSnapshot)
  const root = useRef(null)
  const crystal = useRef(null)
  const journey = useRef(expoJourney(0))
  const geometry = useRef(null)
  const paths = useRef([])

  const project = useCallback((points) => {
    // Canvas and connector SVG share the same viewport; cached geometry avoids
    // forced layout reads for every animated frame.
    const plane = geometry.current
    if (!plane) return
    const mobile = plane.width < 768
    const labels = mobile
      ? [[.30, .31], [.69, .74], [.45, .82]]
      : [[.32, .29], [.74, .55], [.34, .86]]
    points.forEach((point, index) => {
      const x = (point.x * .5 + .5) * plane.width
      const y = (-point.y * .5 + .5) * plane.height
      const lx = labels[index][0] * plane.width
      const ly = labels[index][1] * plane.height
      paths.current[index]?.setAttribute('d', `M${lx},${ly} H${lx + (x - lx) * .45} L${x},${y} m-3,0 h6 m-3,-3 v6`)
    })
  }, [])

  useLayoutEffect(() => {
    if (!animated) return
    gsap.registerPlugin(ScrollTrigger)
    const element = root.current
    const tc = element.querySelector('[data-conclave]')
    const page = element.querySelector('[data-expo-page]')
    const plane = element.querySelector('[data-expo-plane]')
    const slot = element.querySelector('[data-expo-slot]')
    const mist = element.querySelector('[data-expo-mist]')
    const lines = element.querySelector('[data-expo-connectors]')
    const copy = page.querySelectorAll(`.${expoStyles.title}, .${expoStyles.intro}, .${expoStyles.description}, .${expoStyles.explore}`)
    const scroller = document.querySelector('.main-scroll')
    let trigger
    let disposed = false

    const measure = () => {
      if (disposed) return
      const viewport = plane.getBoundingClientRect()
      const destination = slot.getBoundingClientRect()
      const robot = [...tc.querySelectorAll('img[src="/images/techconclave/robot.png"]')]
        .find((image) => image.getBoundingClientRect().width > 0)
      const source = robot?.getBoundingClientRect()
      const tcBox = tc.getBoundingClientRect()
      const navigation = [...document.querySelectorAll('nav, header')]
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > viewport.width * .8 && rect.top >= 0 && rect.top < 10 && rect.height < viewport.height * .2)
      // Measure against the last viewport of TechConclave, independent of scroll.
      // On tall phone posters the robot is above that viewport: its column still
      // supplies the origin, with mist covering the lower emergence point.
      const sourceY = source ? source.top + source.height * .55 - (tcBox.bottom - viewport.height) : viewport.height * .6
      geometry.current = {
        width: viewport.width,
        height: viewport.height,
        slotWidth: destination.width,
        slotHeight: destination.height,
        // Fixed navigation is measured in viewport coordinates. Before pinning
        // or during a resize, the plane itself may still be far offscreen.
        navigationBottom: Math.max(64, ...navigation.map((rect) => rect.bottom)),
        endX: destination.left - viewport.left + destination.width / 2,
        endY: destination.top - viewport.top + destination.height / 2,
        startX: Math.max(viewport.width * .18, Math.min(viewport.width * .72, source ? source.left + source.width * .55 - viewport.left : viewport.width * .3)),
        startY: Math.max(viewport.height * .35, Math.min(viewport.height * .8, sourceY)),
      }
    }
    const render = (progress) => {
      if (disposed || !crystal.current) return
      // Timeline units: entry 0–1, readable Expo hold 1–1.45, exit 1.45–2.15.
      const phase = progress * 2.15
      const exit = Math.min(1, Math.max(0, (phase - 1.45) / .70))
      const entry = Math.min(1, phase)
      const pose = phase > 1.45 ? expoExit(exit) : expoJourney(entry)
      const box = geometry.current
      if (!box) return
      pose.layout = box
      journey.current = pose
      const { x, y } = journeyScreenPoint(pose, box)
      gsap.set(crystal.current, {
        width: box.width, height: box.height, opacity: exit > 0 ? 1 : pose.opacity,
        pointerEvents: entry > .72 && exit === 0 ? 'auto' : 'none',
      })
      const fallback = crystal.current.querySelector('img')
      // Keep opacity in CSS so the ready state can hide the illustration when
      // the model loads, even if scrolling is paused at that moment.
      gsap.set(fallback, { '--journey-fallback-opacity': pose.opacity, width: box.slotWidth, height: box.slotHeight, x: x - box.slotWidth / 2, y: y - box.slotHeight / 2, scale: pose.scale * 8 / (8 - pose.depth), rotationX: pose.pitch * 180 / Math.PI })
      const veil = exit > 0 ? Math.sin(exit * Math.PI) : Math.sin(Math.PI * Math.min(1, Math.max(0, (entry - .04) / .66)))
      gsap.set(mist, { opacity: veil * .48, '--veil-drift': `${progress * -18}%` })
      gsap.set(tc, { filter: `blur(${veil * 3}px) saturate(${1 - veil * .35})` })
      // Erode the poster through a fixed cloud field, rather than opening a
      // geometric window around the incoming exhibit. Alpha thresholds are
      // deterministic so reversing scroll reconstructs the same poster.
      const dissolve = Math.min(1, Math.max(0, (entry - .16) / .36))
      const cloudMask = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><filter id="cloud"><feTurbulence type="fractalNoise" baseFrequency=".012 .018" numOctaves="3" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 4 4 4 0 ${2 - dissolve * 14}"/></filter><rect width="100%" height="100%" filter="url(#cloud)"/></svg>`
      tc.style.maskImage = dissolve === 0 ? 'none' : `url("data:image/svg+xml,${encodeURIComponent(cloudMask)}")`
      tc.style.maskSize = '100% 100%'
      page.style.pointerEvents = entry > .80 && exit === 0 ? 'auto' : 'none'
      gsap.set(lines, { scale: 1 - exit * .65, transformOrigin: `${box.endX}px ${box.endY}px` })
      if (crystal.current.querySelector('[data-crystal-state]')?.dataset.crystalState !== 'ready') {
        const effectiveScale = pose.scale * 8 / (8 - pose.depth)
        const points = [[-.25, -.25], [.30, 0], [-.12, .30]].map(([dx, dy]) => ({ x: (x + dx * box.slotWidth * effectiveScale) / box.width * 2 - 1, y: 1 - (y + dy * box.slotHeight * effectiveScale) / box.height * 2 }))
        project(points)
      }
      element.dataset.expoProgress = progress.toFixed(3)
      element.dataset.expoExit = exit.toFixed(3)
      if (trigger) {
        element.dataset.expoStart = trigger.start
        element.dataset.expoEnd = trigger.end
      }
    }
    const context = gsap.context(() => {
      measure()
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: 'techconclave-expo', trigger: element, pin: element,
          scroller: scroller || undefined,
          start: 'bottom bottom', end: () => `+=${plane.clientHeight * (plane.clientWidth < 768 ? 1.5 : 2.4) * 2.15}`,
          // Lenis already smooths input. Additional scrub lag can leave the
          // exit clouds onscreen while the gallery has advanced underneath.
          scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
          // Upstream Artist/Wheels pins register in effects after this layout
          // effect. Measure Expo after their pin spacing has been applied.
          refreshPriority: -10,
          onRefresh: (self) => {
            measure(); render(self.animation?.progress() ?? 0)
            element.dataset.expoStart = self.start
            element.dataset.expoEnd = self.end
          },
        },
      })
      trigger = timeline.scrollTrigger
      timeline.to({}, { duration: 2.15, onUpdate: () => render(timeline.progress()) }, 0)
        .fromTo(page, { autoAlpha: 0 }, { autoAlpha: 1, duration: .32, ease: 'none' }, .22)
        .fromTo(tc, { autoAlpha: 1 }, { autoAlpha: 0, duration: .16, ease: 'none' }, .40)
        .fromTo(copy, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: .025, duration: .12 }, .78)
        .fromTo(lines, { opacity: 0 }, { opacity: .8, duration: .12 }, .83)
        .to(copy, { autoAlpha: 0, y: -12, duration: .14, stagger: .015 }, 1.45)
        .to(lines, { opacity: 0, duration: .16 }, 1.45)
        .to(page, { autoAlpha: 0, duration: .44, ease: 'none' }, 1.58)
      render(0)
    }, element)
    const resize = new ResizeObserver(() => {
      measure()
      render(trigger?.animation?.progress() ?? 0)
    })
    resize.observe(plane)
    // HeroFrameController can change the page's available height after mount.
    const refresh = requestAnimationFrame(() => { ScrollTrigger.refresh(); window.__lenis?.resize() })
    return () => {
      disposed = true
      cancelAnimationFrame(refresh)
      resize.disconnect()
      context.revert()
      tc.style.removeProperty('mask-image')
      tc.style.removeProperty('mask-size')
      page.style.removeProperty('pointer-events')
      delete element.dataset.expoProgress
      delete element.dataset.expoStart
      delete element.dataset.expoEnd
      delete element.dataset.expoExit
      window.__lenis?.resize()
    }
  }, [animated, project])

  return (
    <>
    <div ref={root} className={`${styles.bridge} ${animated ? styles.animated : ''}`}>
      <div data-conclave><TechConclave /></div>
      <Expo sharedCrystal={animated} />
      {animated && <div className={styles.plane} data-expo-plane>
        <div className={styles.mist} data-expo-mist aria-hidden='true' />
        <div ref={crystal} className={styles.crystal}>
          <Crystal3D journey={journey} onProject={project} />
        </div>
        <svg className={styles.connectors} data-expo-connectors aria-hidden='true'>
          {[0, 1, 2].map((index) => <path key={index} ref={(node) => { paths.current[index] = node }} />)}
        </svg>
      </div>}
    </div>
    <div className={animated ? styles.galleryHandoff : ''}><HorizontalGallery coordinatedEntrance={animated} /></div>
    </>
  )
}

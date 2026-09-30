'use client'

import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TechConclave from '../TechConclave/TechConclave'
import Expo from './Expo'
import Crystal3D from './Crystal3D'
import { expoJourney, journeyScreenPoint } from './expoJourney.mjs'
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
    const box = crystal.current?.getBoundingClientRect()
    const plane = root.current?.querySelector('[data-expo-plane]')?.getBoundingClientRect()
    if (!box || !plane) return
    const mobile = plane.width < 768
    const labels = mobile
      ? [[.30, .31], [.69, .74], [.45, .82]]
      : [[.32, .29], [.74, .55], [.34, .86]]
    points.forEach((point, index) => {
      const x = box.left - plane.left + (point.x * .5 + .5) * box.width
      const y = box.top - plane.top + (-point.y * .5 + .5) * box.height
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
      const pose = expoJourney(progress)
      const box = geometry.current
      if (!box) return
      pose.layout = box
      journey.current = pose
      const { x, y } = journeyScreenPoint(pose, box)
      gsap.set(crystal.current, {
        width: box.width, height: box.height, opacity: pose.opacity,
        maskImage: pose.emerge > .99 ? 'none' : `radial-gradient(ellipse at ${box.startX}px ${box.startY}px, #000 ${pose.emerge * box.height * 1.2}px, transparent ${pose.emerge * box.height * 1.2 + 45}px)`,
        pointerEvents: progress > .72 ? 'auto' : 'none',
      })
      const fallback = crystal.current.querySelector('img')
      gsap.set(fallback, { width: box.slotWidth, height: box.slotHeight, x: x - box.slotWidth / 2, y: y - box.slotHeight / 2, scale: pose.scale * 8 / (8 - pose.depth), rotationX: pose.pitch * 180 / Math.PI })
      const veil = Math.sin(Math.PI * Math.min(1, Math.max(0, (progress - .04) / .66)))
      gsap.set(mist, { opacity: veil * .48, '--veil-drift': `${progress * -18}%` })
      gsap.set(tc, { filter: `blur(${veil * 3}px) saturate(${1 - veil * .35})` })
      page.style.pointerEvents = progress > .80 ? 'auto' : 'none'
      if (crystal.current.querySelector('[data-crystal-state]')?.dataset.crystalState !== 'ready') {
        const effectiveScale = pose.scale * 8 / (8 - pose.depth)
        const points = [[-.25, -.25], [.30, 0], [-.12, .30]].map(([dx, dy]) => ({ x: (x + dx * box.slotWidth * effectiveScale) / box.width * 2 - 1, y: 1 - (y + dy * box.slotHeight * effectiveScale) / box.height * 2 }))
        project(points)
      }
      element.dataset.expoProgress = progress.toFixed(3)
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
          start: 'bottom bottom', end: () => `+=${plane.clientHeight * (plane.clientWidth < 768 ? 1.5 : 2.4)}`,
          scrub: .45, invalidateOnRefresh: true, anticipatePin: 1,
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
      timeline.to({}, { duration: 1, onUpdate: () => render(timeline.progress()) }, 0)
        .fromTo(page, { autoAlpha: 0 }, { autoAlpha: 1, duration: .32, ease: 'none' }, .22)
        .fromTo(tc, { autoAlpha: 1 }, { autoAlpha: 0, duration: .34, ease: 'none' }, .16)
        .fromTo(copy, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: .025, duration: .12 }, .78)
        .fromTo(lines, { opacity: 0 }, { opacity: .8, duration: .12 }, .83)
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
      page.style.removeProperty('pointer-events')
      delete element.dataset.expoProgress
      delete element.dataset.expoStart
      delete element.dataset.expoEnd
      window.__lenis?.resize()
    }
  }, [animated, project])

  return (
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
  )
}

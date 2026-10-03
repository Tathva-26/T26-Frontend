import gsap from 'gsap'
import { createBirdOrientation } from './birdOrientation.mjs'

// Original curves, including the intentionally invisible bridge and exit.
export const TRAIL_START = 'M560.523 361.761C293.335 280.614 -343.389 227.67 237.506 62.9024'
// Match the neighboring tangents across the invisible bridge. The last visible
// handle levels out by a few pixels, then the invisible extension stays level.
const BRIDGE = 'C290 48.0125 340 52.8806 379.513 43.6052'
export const TRAIL_END = 'M379.513 43.6052C484.905 18.8653 490.756 0.557739 507.085 0.557739'
export const FLIGHT_PATH = `${TRAIL_START}${BRIDGE}${TRAIL_END.slice(TRAIL_END.indexOf('C'))}C520 0.557739 533 0.557739 545 0.557739`

const FLIGHT_DURATION = 11 / 1.15
const TRAIL_HOLD = 2.5
const TRAIL_FADE = 0.9
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const mix = (a, b, t) => a + (b - a) * t
const smoothstep = t => t * t * (3 - 2 * t)
// Retain the original sine easing with a small cruising speed at either end.
// This prevents a stop when the bird crosses between the route and offscreen legs.
const routeEase = t => 0.2 * t + 0.8 * (1 - Math.cos(Math.PI * t)) / 2

export function animateBird({ path, bird, flipper, layer, viewport }) {
  const svg = path.ownerSVGElement
  const strokes = [...svg.querySelectorAll('[data-flight-trail]')]
  const prefix = path.cloneNode()
  prefix.setAttribute('d', TRAIL_START + BRIDGE)
  const starts = [0, prefix.getTotalLength()]
  const lengths = strokes.map(stroke => stroke.getTotalLength())
  const caps = strokes.map(stroke => Number(stroke.getAttribute('stroke-width')) / 2)
  const totalLength = path.getTotalLength()
  const visibleEnd = starts[1] + lengths[1]
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const elements = [bird, flipper, layer, ...strokes]
  const originalStyles = elements.map(el => el.getAttribute('style'))
  const originalPhase = bird.getAttribute('data-flight-phase')
  const edgeSpeed = 0.2 * totalLength / FLIGHT_DURATION
  const cruiseSpeed = totalLength / FLIGHT_DURATION
  let mapping, leg
  const updateOrientation = createBirdOrientation()
  let elapsed = 0
  let distance = reduced ? totalLength : 0
  let point = path.getPointAtLength(distance)
  let phase = 'FOLLOW_PATH'
  let trailAge = null
  let running = false
  let disposed = false

  const tangent = length => {
    const a = path.getPointAtLength(Math.max(0, length - 0.75))
    const b = path.getPointAtLength(Math.min(totalLength, length + 0.75))
    const size = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: (b.x - a.x) / size, y: (b.y - a.y) / size }
  }
  const firstDirection = tangent(0)
  const lastDirection = tangent(totalLength)
  let direction = reduced ? lastDirection : firstDirection
  const lookAhead = length => {
    const a = path.getPointAtLength(length)
    const ahead = length + 140
    const b = path.getPointAtLength(Math.min(totalLength, ahead))
    // Anticipate the exit with the same direction, even near the SVG endpoint.
    const beyond = Math.max(0, ahead - totalLength)
    const x = b.x + lastDirection.x * beyond - a.x
    const y = b.y + lastDirection.y * beyond - a.y
    const size = Math.hypot(x, y)
    return { x: x / size, y: y / size }
  }

  const setPhase = next => {
    phase = next
    elapsed = 0
    bird.setAttribute('data-flight-phase', next)
  }

  const orient = (dt, reset = false) => {
    flipper.style.transform = updateOrientation(direction, dt, distance / totalLength, reset)
  }

  const render = () => {
    if (!mapping) return
    const { matrix, left, top, scaleX, scaleY } = mapping
    const x = (matrix.a * point.x + matrix.c * point.y + matrix.e - left) / scaleX
    const y = (matrix.b * point.x + matrix.d * point.y + matrix.f - top) / scaleY
    bird.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
    bird.style.visibility = 'visible'
    const opacity = trailAge === null ? 1 : 1 - smoothstep(clamp((trailAge - TRAIL_HOLD) / TRAIL_FADE, 0, 1))
    strokes.forEach((stroke, i) => {
      const drawn = clamp(distance - starts[i] - caps[i], 0, lengths[i])
      stroke.style.strokeDashoffset = `${lengths[i] - drawn}`
      stroke.style.visibility = drawn > 0 ? 'visible' : 'hidden'
      stroke.style.opacity = `${opacity}`
    })
  }

  const measure = () => {
    const matrix = svg.getScreenCTM()
    const rect = layer.getBoundingClientRect()
    if (!matrix || !rect.width || !rect.height) return
    const size = getComputedStyle(layer)
    mapping = {
      matrix, left: rect.left, top: rect.top,
      scaleX: rect.width / parseFloat(size.width),
      scaleY: rect.height / parseFloat(size.height),
    }
    render()
  }

  // Intersect a ray with the viewport expanded by the entire sprite radius.
  // All movement stays in SVG coordinates; only these phase boundaries measure
  // screen geometry. There are no layout reads on ordinary animation frames.
  const outsidePoint = (origin, vector) => {
    const matrix = svg.getScreenCTM()
    const bounds = viewport.getBoundingClientRect()
    const box = bird.getBoundingClientRect()
    const padding = Math.hypot(box.width, box.height) * 0.65 + 24
    const screen = new DOMPoint(origin.x, origin.y).matrixTransform(matrix)
    const dx = matrix.a * vector.x + matrix.c * vector.y
    const dy = matrix.b * vector.x + matrix.d * vector.y
    const left = Math.max(0, bounds.left) - padding
    const right = Math.min(window.innerWidth, bounds.right) + padding
    const top = Math.max(0, bounds.top) - padding
    const bottom = Math.min(window.innerHeight, bounds.bottom) + padding
    const candidates = []
    if (dx > 0) candidates.push((right - screen.x) / dx)
    if (dx < 0) candidates.push((left - screen.x) / dx)
    if (dy > 0) candidates.push((bottom - screen.y) / dy)
    if (dy < 0) candidates.push((top - screen.y) / dy)
    const travel = Math.max(1, Math.min(...candidates))
    return { x: origin.x + vector.x * travel, y: origin.y + vector.y * travel }
  }

  const makeLeg = (from, to, startSpeed, endSpeed) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    return { from, to, startSpeed, endSpeed, length, duration: 2 * length / (startSpeed + endSpeed) }
  }
  const flyLeg = () => {
    const t = clamp(elapsed / leg.duration, 0, 1)
    // Integrate a smooth speed change; endpoints match the route's speed.
    const fraction = (leg.startSpeed * t + (leg.endSpeed - leg.startSpeed) * (t ** 3 - t ** 4 / 2)) / ((leg.startSpeed + leg.endSpeed) / 2)
    point = { x: mix(leg.from.x, leg.to.x, fraction), y: mix(leg.from.y, leg.to.y, fraction) }
    direction = { x: (leg.to.x - leg.from.x) / leg.length, y: (leg.to.y - leg.from.y) / leg.length }
  }
  const beginReturn = () => {
    setPhase('RETURN_OFFSCREEN')
    const start = path.getPointAtLength(0)
    const origin = outsidePoint(start, { x: -firstDirection.x, y: -firstDirection.y })
    // The old position and the new position are both completely offscreen.
    point = origin
    distance = 0
    trailAge = null
    direction = firstDirection
    orient(0, true)
    layer.style.zIndex = '2'
    leg = makeLeg(origin, start, cruiseSpeed, edgeSpeed)
    setPhase('REJOIN_PATH')
  }
  const beginExit = () => {
    setPhase('EXIT_SCREEN')
    direction = lastDirection
    leg = makeLeg(point, outsidePoint(point, direction), edgeSpeed, cruiseSpeed)
  }

  const tick = (_time, deltaMs) => {
    if (!mapping || document.hidden || bird.closest('[data-paused]')) return
    const dt = Math.min(deltaMs / 1000, 0.05)
    elapsed += dt
    if (trailAge !== null) trailAge += dt
    if (phase === 'FOLLOW_PATH') {
      distance = routeEase(clamp(elapsed / FLIGHT_DURATION, 0, 1)) * totalLength
      point = path.getPointAtLength(distance)
      direction = lookAhead(distance)
      if (distance >= visibleEnd && trailAge === null) trailAge = 0
      if (elapsed >= 6 / 1.15) layer.style.zIndex = '0'
      if (elapsed >= FLIGHT_DURATION) beginExit()
    } else if (phase === 'EXIT_SCREEN' || phase === 'REJOIN_PATH') {
      flyLeg()
      if (elapsed >= leg.duration) {
        if (phase === 'EXIT_SCREEN') setPhase('TRAIL_FADE')
        else setPhase('FOLLOW_PATH')
      }
    } else if (phase === 'TRAIL_FADE' && trailAge >= TRAIL_HOLD + TRAIL_FADE) {
      beginReturn()
    }
    orient(dt)
    render()
  }

  const resize = () => {
    measure()
    // Extend an exit if the window grows while the bird is leaving. A hidden
    // waiting bird is also kept outside the newly measured viewport.
    if (phase === 'EXIT_SCREEN') {
      const speed = mix(leg.startSpeed, leg.endSpeed, smoothstep(clamp(elapsed / leg.duration, 0, 1)))
      leg = makeLeg(point, outsidePoint(point, lastDirection), speed, cruiseSpeed)
      elapsed = 0
    } else if (phase === 'TRAIL_FADE') {
      point = outsidePoint(path.getPointAtLength(totalLength), lastDirection)
      render()
    }
  }
  const startFlight = () => {
    if (running || reduced || disposed) return
    running = true
    gsap.ticker.add(tick)
  }

  strokes.forEach((stroke, i) => {
    stroke.style.strokeDasharray = `${lengths[i]} ${lengths[i]}`
  })
  setPhase(reduced ? 'REDUCED_MOTION' : 'FOLLOW_PATH')
  orient(0, true)
  measure()
  const observer = new ResizeObserver(resize)
  observer.observe(svg)
  observer.observe(layer)
  window.addEventListener('resize', resize)
  window.addEventListener('tathva:ready', startFlight, { once: true })
  if (reduced) layer.style.zIndex = '0'
  else if (!document.querySelector('[data-preloader]')) startFlight()

  return () => {
    disposed = true
    observer.disconnect()
    gsap.ticker.remove(tick)
    window.removeEventListener('resize', resize)
    window.removeEventListener('tathva:ready', startFlight)
    if (originalPhase === null) bird.removeAttribute('data-flight-phase')
    else bird.setAttribute('data-flight-phase', originalPhase)
    elements.forEach((el, i) => {
      if (originalStyles[i] === null) el.removeAttribute('style')
      else el.setAttribute('style', originalStyles[i])
    })
  }
}

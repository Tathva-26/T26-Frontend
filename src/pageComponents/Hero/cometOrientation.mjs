const RAD = Math.PI / 180
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const shortestAngle = (from, to) => ((to - from + 180) % 360 + 360) % 360 - 180

// The spark is drawn heading right (0deg) with its tail on the left, so it only needs
// to be rotated to its direction of travel. No 3D flip: a symmetric spark would
// collapse edge-on while turning.
const MAX_TURN_RATE = 120 // deg/s
const TURN_TAU = 0.25 // seconds

export function createCometOrientation() {
  let heading

  return (direction, dt, progress, reset = false) => {
    const desired = Math.atan2(direction.y, direction.x) / RAD
    const previous = reset || heading === undefined ? desired : heading
    // Unwrap the target around the previous heading: 175 -> -175 is 175 -> 185.
    // Never wrap the accumulated heading back into [-180, 180].
    const unwrapped = previous + shortestAngle(previous, desired)
    const blend = reset ? 1 : 1 - Math.exp(-dt / TURN_TAU)
    const step = reset ? 0 : clamp((unwrapped - previous) * blend, -MAX_TURN_RATE * dt, MAX_TURN_RATE * dt)
    heading = previous + step
    const depth = 1 + 0.025 * Math.sin(Math.PI * progress)
    return `rotate(${heading}deg) scale(${depth})`
  }
}

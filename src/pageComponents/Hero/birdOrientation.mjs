// Only the math modules are needed: the existing image is the textured CSS 3D
// plane, so there is no additional canvas, WebGL renderer, or texture upload.
import { Quaternion } from 'three/src/math/Quaternion.js'
import { Euler } from 'three/src/math/Euler.js'
import { Matrix4 } from 'three/src/math/Matrix4.js'

const RAD = Math.PI / 180
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const shortestAngle = (from, to) => ((to - from + 180) % 360 + 360) % 360 - 180

export function createBirdOrientation() {
  const current = new Quaternion()
  const target = new Quaternion()
  const euler = new Euler(0, 0, 0, 'ZYX')
  const matrix = new Matrix4()
  let heading
  let bank = 0

  return (direction, dt, progress, reset = false) => {
    const desired = Math.atan2(direction.y, direction.x) / RAD
    const previous = reset || heading === undefined ? desired : heading
    // Unwrap the target around the previous heading: 175 -> -175 is 175 -> 185.
    // Never wrap the accumulated heading back into [-180, 180].
    const unwrapped = previous + shortestAngle(previous, desired)
    const blend = reset ? 1 : 1 - Math.exp(-dt / 0.42)
    const step = reset ? 0 : clamp((unwrapped - previous) * blend, -55 * dt, 55 * dt)
    heading = previous + step
    const horizontal = Math.cos(heading * RAD)
    const vertical = Math.sin(heading * RAD)
    // Spread yaw over the whole change in direction instead of flipping across
    // a narrow horizontal threshold. Roll remains restrained and settles level.
    const yaw = Math.acos(clamp(horizontal, -1, 1))
    const desiredBank = reset ? 0 : clamp(-step / Math.max(dt, 0.001) * 0.06, -5, 5)
    bank = reset ? 0 : bank + (desiredBank - bank) * (1 - Math.exp(-dt / 0.5))
    const roll = clamp(Math.asin(vertical) / RAD, -11, 11) * horizontal + bank
    target.setFromEuler(euler.set(bank * 0.35 * RAD, yaw, roll * RAD))
    if (reset) current.copy(target)
    else {
      const angle = current.angleTo(target)
      const fraction = Math.min(1 - Math.exp(-dt / 0.3), angle > 0 ? 55 * RAD * dt / angle : 1)
      current.slerp(target, fraction)
    }
    matrix.makeRotationFromQuaternion(current)
    const depth = 1 + 0.025 * Math.sin(Math.PI * progress)
    return `perspective(650px) matrix3d(${matrix.elements.join(',')}) scale(${depth})`
  }
}

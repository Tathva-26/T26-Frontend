import test from 'node:test'
import assert from 'node:assert/strict'
import { createBirdOrientation, shortestAngle } from '../src/pageComponents/Hero/birdOrientation.mjs'

const vector = degrees => ({ x: Math.cos(degrees * Math.PI / 180), y: Math.sin(degrees * Math.PI / 180) })
const matrix = css => css.match(/matrix3d\(([^)]+)\)/)[1].split(',').map(Number)
// Angular difference from two rotation matrices, independent of the slerp code.
const separation = (a, b) => {
  const trace = [0, 1, 2, 4, 5, 6, 8, 9, 10].reduce((sum, i) => sum + a[i] * b[i], 0)
  return Math.acos(Math.max(-1, Math.min(1, (trace - 1) / 2))) * 180 / Math.PI
}

test('unwraps the 180-degree seam without a full turn', () => {
  assert.equal(shortestAngle(175, -175), 10)
  assert.equal(shortestAngle(-175, 175), -10)
  const update = createBirdOrientation()
  let previous = matrix(update(vector(175), 0, 0, true))
  let travel = 0
  for (let i = 0; i < 360; i++) {
    const next = matrix(update(vector(-175), 1 / 60, 0))
    travel += separation(previous, next)
    previous = next
  }
  assert(travel < 25, `Small heading change rotated ${travel} degrees`)
})

test('limits 3D rotation speed and stays consistent at different frame rates', () => {
  const results = [30, 60, 120].map(fps => {
    const update = createBirdOrientation()
    let previous = matrix(update(vector(-165), 0, 0, true))
    for (let frame = 1; frame <= fps * 3; frame++) {
      const time = frame / fps
      const desired = -165 + 150 * Math.min(1, time / 1.5)
      const next = matrix(update(vector(desired), 1 / fps, 0.5))
      assert(separation(previous, next) <= 55 / fps + 0.0001)
      previous = next
    }
    return previous
  })
  assert(separation(results[0], results[2]) < 2)
  assert(separation(results[1], results[2]) < 1)
})

test('settles into a level forward glide', () => {
  const update = createBirdOrientation()
  update(vector(-40), 0, 1, true)
  let pose
  for (let frame = 0; frame < 600; frame++) pose = matrix(update(vector(0), 1 / 60, 1))
  const level = matrix(createBirdOrientation()(vector(0), 0, 1, true))
  assert(separation(pose, level) < 0.01)
})

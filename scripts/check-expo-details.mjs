import assert from 'node:assert/strict'
import { detailMotion, detailDuration } from '../src/pageComponents/Expo/expoDetailMotion.mjs'

const start = detailMotion(0)
const end = detailMotion(1)
assert.equal(start.depth, 0)
assert.equal(start.optical, 0)
assert.equal(start.interaction, 1)
assert.equal(end.optical, 0, 'No extra optical pass in the settled detail view')
assert.equal(end.interaction, 0)
assert.equal(end.text, 1)
assert.equal(end.copy, 0)
assert.ok(detailMotion(.52).depth > 3, 'The surge travels in depth')
assert.ok(detailMotion(.52).depth > end.depth * 5)
let previous = start
const forward = []
for (let i = 0; i <= 1000; i++) {
  const p = i / 1000
  const pose = detailMotion(p)
  forward.push(pose)
  for (const [key, value] of Object.entries(pose)) {
    assert.ok(Number.isFinite(value), `${key} must be finite`)
    assert.ok(Math.abs(value - previous[key]) < .04, `${key} must be continuous`)
  }
  for (const key of ['depth', 'pitch', 'roll', 'optical', 'pulse']) assert.equal(detailMotion(p, true)[key], 0)
  previous = pose
}
for (let i = 1000; i >= 0; i--) assert.deepEqual(detailMotion(i / 1000), forward[i], 'Closing retraces the same curve')
assert.equal(detailDuration(false), 1.1)
assert.equal(detailDuration(true), .15)
console.log('Expo details: depth surge, continuous reversible curves, idle pass bypass and reduced motion passed.')

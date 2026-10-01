import assert from 'node:assert/strict'
import { springStep, fractureSector } from '../src/pageComponents/Expo/crystalInteraction.mjs'

for (const fps of [20, 30, 60, 120]) {
  let position = .22, velocity = 0, crossed = false
  for (let frame = 0; frame < fps * 3; frame++) {
    const next = springStep(position, velocity, 0, 1 / fps)
    assert.ok(Number.isFinite(next.position) && Number.isFinite(next.velocity))
    assert.ok(Math.abs(next.position) <= .23, 'return must remain bounded')
    crossed ||= next.position < 0
    ;({ position, velocity } = next)
  }
  assert.ok(crossed, 'release should rock through its resting position')
  assert.ok(Math.abs(position) < .0001 && Math.abs(velocity) < .0001, 'spring must settle')
}
const segments = [-.5, .9, .66, -.3, .7, .66, .3, -.7, .66, .5, -.9, .66]
assert.equal(fractureSector({ x: -.4, y: .8 }, segments), 3)
assert.equal(fractureSector({ x: .4, y: -.8 }, segments), 1)
assert.equal(fractureSector({ x: 2, y: 2 }, segments), -1)
console.log('Crystal interaction: bounded spring return and fracture hit regions passed.')

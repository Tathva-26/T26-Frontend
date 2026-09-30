import assert from 'node:assert/strict'
import { expoJourney, journeyScreenPoint } from '../src/pageComponents/Expo/expoJourney.mjs'

const layouts = [
  { width: 1440, height: 900, slotHeight: 702, startX: 300, startY: 500, endX: 799, endY: 509, navigationBottom: 64 },
  { width: 390, height: 844, slotHeight: 346, startX: 100, startY: 350, endX: 187, endY: 439, navigationBottom: 56 },
  { width: 844, height: 390, slotHeight: 261, startX: 220, startY: 240, endX: 451, endY: 216, navigationBottom: 56 },
]

for (const layout of layouts) {
  const release = journeyScreenPoint(expoJourney(.30), layout)
  const destination = journeyScreenPoint(expoJourney(1), layout)
  assert.ok(destination.y - release.y > layout.height * .15, 'descent must be visibly downward')
  assert.ok(release.y - layout.slotHeight * .84 * .68 / 2 >= layout.navigationBottom, 'release must clear navigation')
  assert.ok(Math.abs(destination.x - layout.endX) < 1e-8)
  assert.ok(Math.abs(destination.y - layout.endY) < 1e-8)
  let previous = expoJourney(0)
  for (let step = 1; step <= 1000; step++) {
    const progress = step / 1000
    const pose = expoJourney(progress)
    const point = journeyScreenPoint(pose, layout)
    for (const value of Object.values(pose)) assert.ok(Number.isFinite(value))
    assert.ok(pose.opacity >= 0 && pose.opacity <= 1)
    assert.ok(pose.interaction >= 0 && pose.interaction <= 1)
    assert.ok(pose.scale >= previous.scale && pose.scale <= 1)
    assert.ok(Math.abs(pose.pitch - previous.pitch) < .05, 'angular motion must stay continuous')
    if (progress > .301 && progress <= .76) {
      const lastPoint = journeyScreenPoint(previous, layout)
      assert.ok(point.y >= lastPoint.y - 1e-8, 'the tumble must descend throughout its travel')
    }
    previous = pose
  }
  assert.ok(Math.abs(expoJourney(.76).pitch - Math.PI * 2) < 1e-8, 'complete the revolution before settling')
  assert.ok(Math.abs(expoJourney(1).depth) < 1e-8)
  assert.equal(expoJourney(1).interaction, 1)
}
console.log('Expo motion: downward travel, full roll, continuity, framing and final anchors passed on three layouts.')

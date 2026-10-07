import assert from 'node:assert/strict'
import { touchGesture, insideCrystalSlot } from '../src/pageComponents/Expo/crystalTouch.mjs'
import { interactionTargets } from '../src/pageComponents/Expo/crystalGeometry.mjs'

assert.equal(touchGesture(4, 3), 'pending')
assert.equal(touchGesture(2, 30), 'scroll')
assert.equal(touchGesture(12, 12), 'scroll')
assert.equal(touchGesture(30, 2), 'drag')
assert.equal(touchGesture(2, 80, 'drag'), 'drag')
assert.equal(insideCrystalSlot(50, 150, { left: 20, top: 100, width: 100, height: 100 }), true)
assert.equal(insideCrystalSlot(50, 50, { left: 20, top: 100, width: 100, height: 100 }), false)
assert.equal(interactionTargets({ x: 1, y: 1 }, { x: 0, y: 0 }, true).tiltY, 0)
assert.ok(interactionTargets({ x: 0, y: 0 }, { x: .2, y: 0 }, true).tiltY > .1)
console.log('Expo touch: tap tolerance, scroll priority, drag lock, hit region and relative tilt passed.')

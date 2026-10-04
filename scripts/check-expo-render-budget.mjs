import assert from 'node:assert/strict'
import { sampleFrameBudget, canRevealCrystal } from '../src/pageComponents/Expo/expoRenderBudget.mjs'
import { expoJourney, expoExit } from '../src/pageComponents/Expo/expoJourney.mjs'

let budget = { seconds: 0, frames: 0, strikes: 0, recoveries: 0, degraded: false }
const run = (fps, seconds) => {
  for (let i = 0; i < fps * seconds; i++) budget = sampleFrameBudget(budget, 1 / fps)
}
for (const delta of [NaN, Infinity, -1, 0, 10]) assert.deepEqual(sampleFrameBudget(budget, delta), budget)
run(30, 3.1)
assert.equal(budget.degraded, false, 'One slow sampling window must not change quality')
run(30, 3.1)
assert.equal(budget.degraded, true, 'Sustained slow frames reduce quality')
run(60, 7)
assert.equal(budget.degraded, true, 'Recovery must not oscillate quality')
run(60, 9)
assert.equal(budget.degraded, false, 'Sustained fast frames restore quality')
assert.equal(canRevealCrystal(expoJourney(0)), true)
assert.equal(canRevealCrystal(expoJourney(.5)), false)
assert.equal(canRevealCrystal(expoJourney(1)), true)
assert.equal(canRevealCrystal(expoExit(.5)), false)
assert.equal(canRevealCrystal(expoJourney(1), 'opening'), false)
console.log('Expo rendering: sustained quality adaptation, pause rejection and safe model admission passed.')

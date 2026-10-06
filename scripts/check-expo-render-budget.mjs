import assert from 'node:assert/strict'
import { sampleFrameBudget } from '../src/pageComponents/Expo/expoRenderBudget.mjs'

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
console.log('Expo rendering: sustained quality adaptation and pause rejection passed.')

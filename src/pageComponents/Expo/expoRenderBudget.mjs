// Sustained frame time, rather than one slow upload or a resumed tab, owns quality.
// The frame loop passes state as result to reuse its accumulator. Other callers
// retain the default, independent result object.
// The frame loop passes state as result to reuse its accumulator. Other callers
// retain the default, independent result object.
export function sampleFrameBudget(state, delta, result = {}) {
  if (!Number.isFinite(delta) || delta <= 0 || delta > .15) return state
  const seconds = state.seconds + delta
  const frames = state.frames + 1
  const strikes = seconds < 3 ? state.strikes : seconds / frames > 1 / 38 ? state.strikes + 1 : 0
  const recoveries = seconds < 3 ? state.recoveries : seconds / frames < 1 / 55 ? state.recoveries + 1 : 0
  const degraded = seconds < 3 ? state.degraded : strikes >= 2 ? true : recoveries >= 4 ? false : state.degraded
  result.seconds = seconds < 3 ? seconds : 0
  result.frames = seconds < 3 ? frames : 0
  result.strikes = strikes; result.recoveries = recoveries; result.degraded = degraded
  return result
}

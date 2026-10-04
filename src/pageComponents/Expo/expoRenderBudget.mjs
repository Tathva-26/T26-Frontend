// Sustained frame time, rather than one slow upload or a resumed tab, owns quality.
export function sampleFrameBudget(state, delta) {
  if (!Number.isFinite(delta) || delta <= 0 || delta > .15) return state
  const next = { ...state, seconds: state.seconds + delta, frames: state.frames + 1 }
  if (next.seconds < 3) return next
  const slow = next.seconds / next.frames > 1 / 38
  const fast = next.seconds / next.frames < 1 / 55
  const strikes = slow ? state.strikes + 1 : 0
  const recoveries = fast ? state.recoveries + 1 : 0
  return { seconds: 0, frames: 0, strikes, recoveries,
    degraded: strikes >= 2 ? true : recoveries >= 4 ? false : state.degraded }
}

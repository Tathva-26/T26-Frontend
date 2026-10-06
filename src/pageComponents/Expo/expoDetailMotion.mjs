const clamp = value => Math.max(0, Math.min(1, value))
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x) }

// Pure, reversible curves shared by the DOM, model and optical pass.
// Supply a dedicated result object to reuse storage in animation loops.
export function detailMotion(progress, reduced = false, result = {}) {
  const p = clamp(progress)
  const surge = smooth((p - .12) / .40) * (1 - smooth((p - .52) / .23))
  result.copy = 1 - smooth((p - .09) / .32)
  result.dark = smooth((p - .40) / .33)
  result.text = smooth((p - .59) / .41)
  result.interaction = 1 - smooth(p / .18)
  result.pulse = reduced ? 0 : Math.sin(clamp(p / .25) * Math.PI)
  result.depth = reduced ? 0 : surge * 3.2 + smooth(p) * .35
  result.pitch = reduced ? 0 : surge * -.20
  result.roll = reduced ? 0 : surge * .10
  result.optical = reduced ? 0 : smooth((p - .22) / .16) * (1 - smooth((p - .52) / .16))
  return result
}

export const detailDuration = reduced => reduced ? .15 : 1.1

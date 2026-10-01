const clamp = value => Math.max(0, Math.min(1, value))
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x) }

// Pure, reversible curves shared by the DOM, model and optical pass.
export function detailMotion(progress, reduced = false) {
  const p = clamp(progress)
  const surge = smooth((p - .12) / .40) * (1 - smooth((p - .52) / .23))
  return {
    copy: 1 - smooth((p - .09) / .32),
    dark: smooth((p - .40) / .33),
    text: smooth((p - .59) / .41),
    interaction: 1 - smooth(p / .18),
    pulse: reduced ? 0 : Math.sin(clamp(p / .25) * Math.PI),
    depth: reduced ? 0 : surge * 3.2 + smooth(p) * .35,
    pitch: reduced ? 0 : surge * -.20,
    roll: reduced ? 0 : surge * .10,
    optical: reduced ? 0 : smooth((p - .22) / .16) * (1 - smooth((p - .52) / .16)),
  }
}

export const detailDuration = reduced => reduced ? .15 : 1.1

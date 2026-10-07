const smooth = value => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p) }

// Reversible curves follow scroll/detail progress rather than starting timers.
export function shardMotion(entry, detail, index, reduced, result = {}) {
  const settle = smooth((entry - .70 - index * .018) / .20)
  const gather = smooth(detail / .42)
  result.spread = reduced ? 1 : (.58 + .42 * settle) * (1 - gather * .58)
  result.rise = reduced ? 0 : (1 - settle) * -.28 + gather * .14
  result.turn = reduced ? 0 : (1 - settle) * -.65 + gather * .45
  return result
}

export function animationDelta(delta) {
  return Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
}

export function pulseStrength(time, startedAt) {
  const age = time - startedAt
  return Number.isFinite(age) && age >= 0 ? Math.exp(-age * 3.8) : 0
}

// Substeps keep the soft return stable on both fast and slower render loops.
// X and Y springs each own a result object so their samples remain independent.
export function springStep(position, velocity, target, delta, result = {}) {
  const steps = Math.max(1, Math.ceil(Math.min(delta, .05) * 120))
  const dt = Math.min(delta, .05) / steps
  for (let i = 0; i < steps; i++) {
    velocity += ((target - position) * 110 - velocity * 14) * dt
    position += velocity * dt
  }
  result.position = position; result.velocity = velocity
  return result
}

export function fractureSector(point, positions) {
  let nearest = Infinity
  for (let i = 0; i < positions.length; i += 6) {
    const ax = positions[i], ay = positions[i + 1]
    const dx = positions[i + 3] - ax, dy = positions[i + 4] - ay
    const t = Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.y - ay) * dy) / (dx * dx + dy * dy || 1)))
    nearest = Math.min(nearest, Math.hypot(point.x - ax - dx * t, point.y - ay - dy * t))
  }
  return nearest < .20 ? Math.max(0, Math.min(3, Math.floor((point.y + 1.6) / .8))) : -1
}

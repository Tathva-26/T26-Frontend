// Substeps keep the soft return stable on both fast and slower render loops.
export function springStep(position, velocity, target, delta) {
  const steps = Math.max(1, Math.ceil(Math.min(delta, .05) * 120))
  const dt = Math.min(delta, .05) / steps
  for (let i = 0; i < steps; i++) {
    velocity += ((target - position) * 110 - velocity * 14) * dt
    position += velocity * dt
  }
  return { position, velocity }
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

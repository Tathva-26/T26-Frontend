const clamp = (value) => Math.max(0, Math.min(1, value))
const smooth = (value) => { const t = clamp(value); return clamp(t * t * t * (t * (t * 6 - 15) + 10)) }

// Preserve the full revolution as an unwrapped angle. The crystal clears its
// origin first, then rolls DOWN from a release point into the Expo showcase.
export function expoJourney(progress) {
  const emerge = smooth((progress - .08) / .22)
  const travel = smooth((progress - .30) / .46)
  const settle = clamp((progress - .76) / .14)
  const wobble = Math.sin(settle * Math.PI * 3) * (1 - settle) ** 2
  return {
    emerge,
    travel,
    progress: clamp(progress),
    opacity: smooth((progress - .10) / .12),
    scale: .46 + .22 * emerge + .32 * travel,
    depth: -2.8 * (1 - emerge) + Math.sin(travel * Math.PI) * .65,
    pitch: travel * Math.PI * 2 - (1 - emerge) * .22 + wobble * .13,
    yaw: Math.sin(travel * Math.PI) * .45,
    roll: Math.sin(travel * Math.PI * 2) * .22 + wobble * .045,
    interaction: smooth((progress - .74) / .16),
  }
}

export function journeyScreenPoint(pose, layout) {
  const releaseX = layout.startX + (layout.endX - layout.startX) * .18
  // Keep the top of the released shell below the measured navigation edge.
  const safeTop = (layout.navigationBottom ?? 64) + layout.slotHeight * .84 * .68 / 2
  const releaseY = Math.max(safeTop, Math.min(layout.startY - layout.height * .12, layout.endY - layout.height * .32))
  const emergeX = layout.startX + (releaseX - layout.startX) * pose.emerge
  const emergeY = layout.startY + (releaseY - layout.startY) * pose.emerge
  return {
    x: emergeX + (layout.endX - emergeX) * pose.travel + Math.sin(pose.travel * Math.PI) * layout.width * .035,
    y: emergeY + (layout.endY - emergeY) * pose.travel,
  }
}

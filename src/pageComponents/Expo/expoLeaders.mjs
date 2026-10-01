export function measureExpoLabels(stage, origin) {
  const stageBox = stage.getBoundingClientRect()
  const rect = (selector) => {
    const node = stage.querySelector(selector)
    // Use resting layout, excluding GSAP's temporary copy reveal/exit translation.
    const left = stageBox.left + node.offsetLeft, top = stageBox.top + node.offsetTop
    return { left, top, right: left + node.offsetWidth, bottom: top + node.offsetHeight, height: node.offsetHeight }
  }
  const intro = rect('[data-expo-intro]')
  const description = rect('[data-expo-description]')
  const explore = rect('[data-expo-explore]')
  const portrait = origin.width < 768 && origin.height > origin.width
  return [
    [intro.left - origin.left, intro.bottom - origin.top + 12],
    [portrait ? description.left - origin.left : description.left - origin.left - 12, portrait ? description.top - origin.top - 12 : description.top - origin.top + description.height / 2],
    [portrait ? explore.left - origin.left : explore.right - origin.left - 12, explore.top - origin.top + explore.height / 2],
  ]
}

export function expoLeaderPaths(points, layout) {
  const xy = points.map(p => [(p.x * .5 + .5) * layout.width, (-p.y * .5 + .5) * layout.height])
  const [[ix, iy], [dx, dy], [bx, by]] = layout.labels
  const [[ax, ay], [ux, uy], [lx, ly], [ex, ey]] = xy
  if (layout.width < 768 && layout.height > layout.width) return [
    `M${ix},${iy} H${ix + (ax - ix) * .45} L${ax},${ay}`,
    `M${ex},${ey} V${dy} H${dx}`,
    `M${lx},${ly} L${bx - 18},${by} H${bx}`,
  ]
  return [
    `M${ix},${iy} H${ix + (ax - ix) * .45} L${ax},${ay}`,
    `M${ux},${uy} L${dx},${dy} L${lx},${ly}`,
    `M${ex},${ey} L${bx + (ex - bx) * .55},${by} H${bx}`,
  ]
}

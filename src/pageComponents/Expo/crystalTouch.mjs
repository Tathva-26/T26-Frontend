// Lock a gesture only after it clearly leaves the tap tolerance. Vertical
// motion belongs to the browser; horizontal motion tilts the exhibit.
export function touchGesture(dx, dy, previous = 'pending') {
  if (previous !== 'pending') return previous
  if (Math.hypot(dx, dy) < 10) return 'pending'
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? 'drag' : 'scroll'
}

export function insideCrystalSlot(x, y, rect) {
  return x >= rect.left && x <= rect.left + rect.width &&
    y >= rect.top && y <= rect.top + rect.height
}

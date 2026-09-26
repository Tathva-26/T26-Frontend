// Thin wrapper over the Vibration API. No-op where unsupported (desktop, iOS Safari).
const buzz = (pattern) => {
  try {
    if (typeof navigator !== "undefined") navigator.vibrate?.(pattern);
  } catch {}
};

export const haptics = {
  tick: () => buzz(8), // light: touch-down, snapping to an item
  select: () => buzz(15), // medium: taps, menu toggle
  hold: (p = 0) => buzz(6 + Math.round(p * 14)), // hold ramp: grows with progress
  success: () => buzz([30, 40, 60]), // hold completed
  cancel: () => buzz(0), // stop any running vibration
};

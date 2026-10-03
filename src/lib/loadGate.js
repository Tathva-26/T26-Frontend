// What the preloader waits for, beyond the <img> and <video> elements it can
// see in the page for itself: anything that loads its assets from script (a
// frame sequence built from `new Image()`, say) takes a hold while it loads
// and lets go when it is ready. The preloader keeps spinning until every hold
// is released.
//
//   const release = holdLoader("wheels frames");
//   ...when the last frame has loaded (or failed)...
//   release();
//
// A hold taken after the preloader has already finished does nothing.

const holds = new Set();
const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener());

export function holdLoader(label) {
  const hold = { label };
  holds.add(hold);
  notify();
  return function release() {
    if (holds.delete(hold)) notify();
  };
}

export const loaderHolds = () => holds.size;

/** Calls `listener` whenever a hold is taken or released; returns the unsubscribe. */
export function onLoaderHoldsChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

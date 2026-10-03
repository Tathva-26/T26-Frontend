// Stopping a touch scroll dead at a given position.
//
// On a touch screen the page scrolls natively: under the finger, then on
// momentum, and script has no say over either while they are moving. The one
// thing that ends them is the scroller ceasing to be scrollable, so a stop is:
// freeze the scroller (overflow hidden), put the page on the spot, and hand it
// back a moment after the finger is off the screen. The browser's own
// scrolling runs a frame or two ahead of script, so momentum that was already
// under way can carry the page a little further after the freeze; it is dead
// by then, so the page is simply put back on the spot.
//
// One stopper is shared per scroller, so sections that each stop the page at
// their own positions never freeze or release it under one another.
const HOLD_MS = 160; // how long it stays frozen once the finger is off

const stoppers = new WeakMap();

export function touchStop(scroller) {
  const shared = stoppers.get(scroller);
  if (shared) {
    shared.users += 1;
    return shared.api;
  }

  let position = null; // where the page is held; null when it is free
  let fingerDown = false;
  let timer = 0;
  const releaseListeners = new Set();

  const release = () => {
    if (fingerDown) {
      timer = window.setTimeout(release, HOLD_MS);
      return;
    }
    position = null;
    scroller.style.overflowY = "";
    window.__lenis?.start();
    releaseListeners.forEach((listener) => listener());
  };

  const onScroll = () => {
    if (position !== null && Math.abs(scroller.scrollTop - position) > 0.5) scroller.scrollTop = position;
  };
  const onDown = () => {
    fingerDown = true;
  };
  const onUp = (event) => {
    fingerDown = event.touches.length > 0;
  };

  const passive = { passive: true };
  scroller.addEventListener("scroll", onScroll, passive);
  scroller.addEventListener("touchstart", onDown, passive);
  scroller.addEventListener("touchend", onUp, passive);
  scroller.addEventListener("touchcancel", onUp, passive);

  const entry = { users: 1, api: null };
  entry.api = {
    /** Stop the page at `at` (a scrollTop). */
    stopAt(at) {
      position = at;
      scroller.style.overflowY = "hidden";
      const lenis = window.__lenis;
      lenis?.stop();
      lenis?.scrollTo(at, { immediate: true, force: true });
      if (Math.abs(scroller.scrollTop - at) > 0.5) scroller.scrollTop = at;
      window.clearTimeout(timer);
      timer = window.setTimeout(release, HOLD_MS);
    },
    get stopped() {
      return position !== null;
    },
    get fingerDown() {
      return fingerDown;
    },
    /** Calls `listener` each time the page is handed back; returns the unsubscribe. */
    onRelease(listener) {
      releaseListeners.add(listener);
      return () => releaseListeners.delete(listener);
    },
    /** Each touchStop() call is paired with one dispose(). */
    dispose() {
      entry.users -= 1;
      if (entry.users > 0) return;
      window.clearTimeout(timer);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("touchstart", onDown);
      scroller.removeEventListener("touchend", onUp);
      scroller.removeEventListener("touchcancel", onUp);
      if (position !== null) {
        position = null;
        scroller.style.overflowY = "";
        window.__lenis?.start();
      }
      stoppers.delete(scroller);
    },
  };
  stoppers.set(scroller, entry);
  return entry.api;
}

// Tells an animation whether anyone can actually see it, so it can stop
// working when they can't. "Visible" here means all of: in (or just outside)
// the viewport, not hidden by `visibility: hidden` / `display: none` on itself
// or anything above it, and the tab itself showing.
//
// `onChange(visible)` is called once with the first answer and then on every
// change. Returns a function that stops watching.
//
// The viewport part comes from an IntersectionObserver. Being hidden by CSS
// doesn't fire anything, so while the element is in the viewport that part is
// re-checked a few times a second, which is cheap.
const RECHECK_MS = 300;

export function watchVisible(element, onChange) {
  let inViewport = false;
  let visible = null;
  let timer = 0;

  const shownByCss = () =>
    typeof element.checkVisibility !== "function" ||
    element.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true });

  const check = () => {
    const now = inViewport && !document.hidden && shownByCss();
    if (now === visible) return;
    visible = now;
    onChange(now);
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      inViewport = entry.isIntersecting;
      window.clearInterval(timer);
      if (inViewport) timer = window.setInterval(check, RECHECK_MS);
      check();
    },
    { rootMargin: "10% 0px 10% 0px" }
  );
  observer.observe(element);
  document.addEventListener("visibilitychange", check);

  return () => {
    observer.disconnect();
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", check);
  };
}

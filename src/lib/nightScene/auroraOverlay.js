const MAX_DELTA = 0.05;

// Positioned over where the aurora already sits in banner.png (upper-right
// sky, above the ridgeline). Tune xRatio/widthRatio here once the real
// object-position crop is checked against these values.
const AURORA_RAYS = [
  { angle: -16, xRatio: 0.55, widthRatio: 0.26, hue: 285, alpha: 0.4, speed: 0.28 },
  { angle: -12, xRatio: 0.72, widthRatio: 0.3, hue: 300, alpha: 0.34, speed: 0.21 },
  { angle: -20, xRatio: 0.88, widthRatio: 0.22, hue: 270, alpha: 0.3, speed: 0.36 },
];

function drawAuroraRay(ctx, ray, w, h, index, t, progress) {
  const x = w * ray.xRatio + Math.sin(t * ray.speed + index) * w * 0.015;
  const rayWidth = w * ray.widthRatio;
  const dx = Math.sin((ray.angle * Math.PI) / 180) * h * 0.6;
  const topY = -h * 0.05;
  const bottomY = topY + h * 0.58 - progress * h * 0.02;

  const gradient = ctx.createLinearGradient(x, topY, x, bottomY);
  gradient.addColorStop(0, `hsla(${ray.hue}, 85%, 72%, 0)`);
  gradient.addColorStop(0.35, `hsla(${ray.hue}, 85%, 72%, ${ray.alpha})`);
  gradient.addColorStop(0.7, `hsla(${ray.hue + 10}, 85%, 68%, ${ray.alpha * 0.6})`);
  gradient.addColorStop(1, `hsla(${ray.hue}, 85%, 72%, 0)`);

  ctx.beginPath();
  ctx.moveTo(x - rayWidth / 2, topY);
  ctx.lineTo(x + rayWidth / 2, topY);
  ctx.lineTo(x + dx + rayWidth / 2.6, bottomY);
  ctx.lineTo(x + dx - rayWidth / 2.6, bottomY);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}

/**
 * Animated aurora drawn on a transparent canvas, meant to sit via CSS
 * mix-blend-mode: screen on top of the real banner.png photo - it adds
 * moving light over the aurora already in the image rather than redrawing
 * the scene. Empty canvas area stays fully transparent.
 *
 * `options.getProgress`, if given, is polled each frame (0-1) for a subtle
 * scroll-driven nudge to how far the rays extend.
 *
 * Returns a cleanup function.
 */
export function mountAuroraOverlay(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const getProgress = options.getProgress ?? (() => 0);
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  let t = 0;
  let lastTime = 0;
  let frameId = 0;
  let running = false;
  let dpr = 1;
  let cw = 0;
  let ch = 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, canvas.offsetWidth);
    const h = Math.max(1, canvas.offsetHeight);
    if (w === cw && h === ch) return;
    cw = w;
    ch = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame() {
    const w = cw;
    const h = ch;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = "blur(9px)";
    const progress = getProgress();
    AURORA_RAYS.forEach((ray, index) => drawAuroraRay(ctx, ray, w, h, index, t, progress));
    ctx.restore();
  }

  function frame(time) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min((time - lastTime) / 1000, MAX_DELTA);
    lastTime = time;
    t += dt;
    resize();
    drawFrame();
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    running = false;
    cancelAnimationFrame(frameId);
  }

  if (reduceMotion) {
    resize();
    drawFrame();
    return () => {};
  }

  const io = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? start() : stopLoop()),
    { threshold: 0 }
  );
  io.observe(canvas);

  return () => {
    stopLoop();
    io.disconnect();
  };
}
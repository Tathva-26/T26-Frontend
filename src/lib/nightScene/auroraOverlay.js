const MAX_DELTA = 0.05;

// Soft light needs no detail, so the canvas is drawn at a fraction of its
// on-screen size and the browser's own upscaling does the smoothing. No blur
// filter is involved (canvas `ctx.filter` is missing in Safari, and a CSS blur
// over a full-screen layer is far too slow without a GPU).
const DOWNSCALE = 8;

// The light drifts slowly, so redrawing it this often looks the same as doing
// it on every display frame and repaints the (large) layer far less.
const DRAW_FPS = 24;

// Each ray is drawn as this many stacked layers, widest and faintest first,
// so it fades out towards its sides instead of ending on a hard edge.
const FEATHER_LAYERS = 6;
const FEATHER_WIDEST = 1.2;
const FEATHER_NARROWEST = 0.3;

// Positioned over where the aurora already sits in banner.png (upper-right
// sky, above the ridgeline).
const AURORA_RAYS = [
  { angle: -16, xRatio: 0.55, widthRatio: 0.26, hue: 285, alpha: 0.4, speed: 0.28 },
  { angle: -12, xRatio: 0.72, widthRatio: 0.3, hue: 300, alpha: 0.34, speed: 0.21 },
  { angle: -20, xRatio: 0.88, widthRatio: 0.22, hue: 270, alpha: 0.3, speed: 0.36 },
];

function drawAuroraRay(ctx, ray, w, h, index, t) {
  const x = w * ray.xRatio + Math.sin(t * ray.speed + index) * w * 0.015;
  const rayWidth = w * ray.widthRatio;
  const dx = Math.sin((ray.angle * Math.PI) / 180) * h * 0.6;
  const topY = -h * 0.05;
  const bottomY = topY + h * 0.58;
  const alpha = ray.alpha / FEATHER_LAYERS;

  const gradient = ctx.createLinearGradient(x, topY, x, bottomY);
  gradient.addColorStop(0, `hsla(${ray.hue}, 85%, 72%, 0)`);
  gradient.addColorStop(0.35, `hsla(${ray.hue}, 85%, 72%, ${alpha})`);
  gradient.addColorStop(0.7, `hsla(${ray.hue + 10}, 85%, 68%, ${alpha * 0.6})`);
  gradient.addColorStop(1, `hsla(${ray.hue}, 85%, 72%, 0)`);
  ctx.fillStyle = gradient;

  for (let layer = 0; layer < FEATHER_LAYERS; layer += 1) {
    const spread = FEATHER_WIDEST - ((FEATHER_WIDEST - FEATHER_NARROWEST) * layer) / (FEATHER_LAYERS - 1);
    const top = (rayWidth * spread) / 2;
    const bottom = (rayWidth * spread) / 2.6;
    ctx.beginPath();
    ctx.moveTo(x - top, topY);
    ctx.lineTo(x + top, topY);
    ctx.lineTo(x + dx + bottom, bottomY);
    ctx.lineTo(x + dx - bottom, bottomY);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Animated aurora drawn on a transparent canvas, meant to sit via CSS
 * mix-blend-mode: screen on top of the real banner.png photo - it adds
 * moving light over the aurora already in the image rather than redrawing
 * the scene. Empty canvas area stays fully transparent.
 *
 * `options.isPaused`, if given, is called once per frame. While it returns
 * true nothing is updated or drawn.
 *
 * Returns a cleanup function.
 */
export function mountAuroraOverlay(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const isPaused = options.isPaused ?? (() => false);
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  let t = 0;
  let lastTime = 0;
  let lastDraw = 0;
  let frameId = 0;
  let running = false;
  let cw = 0;
  let ch = 0;

  function resize() {
    const w = Math.max(1, canvas.offsetWidth);
    const h = Math.max(1, canvas.offsetHeight);
    if (w === cw && h === ch) return;
    cw = w;
    ch = h;
    canvas.width = Math.max(1, Math.round(w / DOWNSCALE));
    canvas.height = Math.max(1, Math.round(h / DOWNSCALE));
    // Keep drawing in CSS pixels; the transform maps them onto the small canvas.
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
  }

  function drawFrame() {
    const w = cw;
    const h = ch;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    AURORA_RAYS.forEach((ray, index) => drawAuroraRay(ctx, ray, w, h, index, t));
    ctx.restore();
  }

  function frame(time) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min((time - lastTime) / 1000, MAX_DELTA);
    lastTime = time;
    if (isPaused()) return;
    t += dt;
    if (time - lastDraw < 1000 / DRAW_FPS) return;
    lastDraw = time;
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

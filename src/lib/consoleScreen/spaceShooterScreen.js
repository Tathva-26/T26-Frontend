import { GAME, SPRITE_PATHS } from "@/lib/spaceShooter/constants";
import { loadSprites } from "@/lib/spaceShooter/sprites";
import { createAttractDemo } from "./attractDemo";
import { createSpaceBackdrop } from "./spaceBackdrop";

// Logical drawing resolution: the same box the real game draws in, so it
// fills the screen cutout with a single uniform scale, no stretch.
const W = GAME.width;
const H = GAME.height;

const MAX_DELTA = 0.05; // clamp dt so a backgrounded tab doesn't jump on return
const MAX_PIXEL_RATIO = 3;

// Faint scanlines: one row of the canvas's own pixels in every this many.
const SCANLINES = { every: 3, color: "rgba(0, 0, 0, 0.16)" };

// Old-TV switch-on: for the first POWER_LINE of `power` a bright line grows
// across the middle of a dark tube, then it opens vertically into the picture.
// (Exported so the scroll sequence's switch-off can be its exact reverse.)
export const POWER_LINE = 0.35;
const TUBE_OFF = "#04030c";

// Outro: the game's ships fade out over the first SHIPS_GONE of `outro`,
// and only then does the screen announce the next section. Each line is
// typed out between the two `outro` values given, then the loading bar fills.
const SHIPS_GONE = 0.1;
const OUTRO = {
  clear: { text: "LEVEL COMPLETE", size: 40, y: 120, color: "#ffffff", typed: [0.1, 0.22] },
  next: { text: "NEXT STAGE", size: 26, y: 218, color: "#c9a7ff", typed: [0.24, 0.33] },
  name: { text: "WHEELS", size: 66, y: 290, color: "#ffffff", typed: [0.33, 0.44] },
  bar: { y: 366, width: 560, height: 40, segments: 20, fills: [0.46, 0.94], statusSize: 22 },
  speedUp: 5, // the stars fall this many times faster by the end
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * A decorative, autonomous space-shooter scene for the console's screen:
 * the game playing itself (see attractDemo) in front of drifting space (see
 * spaceBackdrop), drawn with the same sprites as the real game, so it reads
 * as a preview of it. This is ambient flavor only, not the playable game.
 *
 * `options.spill`, if given, is kept as a small blurred copy of every frame,
 * meant to be shown blurred + screen-blended over the console's bezel so
 * the screen's own light bleeds onto the plastic around it.
 *
 * `options.isBackgroundOnly`, if given, is called once per frame. While it
 * returns true, the self-playing game stops and is not drawn, and only the
 * space behind it keeps animating - used when this same canvas is showing
 * through underneath the real, player-controlled game (SpaceShooterCanvas,
 * drawn on top with a transparent clear) as its background, so the two
 * ships/enemy sets don't visually collide.
 *
 * `options.isPaused`, if given, is called once per frame. While it returns
 * true nothing is updated or drawn, e.g. while the game overlay covers this.
 *
 * `options.getScale`, if given, returns how much an ancestor's CSS transform
 * enlarges this canvas on screen (the hero Stage's fit scale), so the backing
 * store is sized for what is actually displayed instead of the layout size.
 *
 * `options.getPower`, if given, returns 0-1: 0 is a switched-off tube, 1 is
 * the normal picture, and the values between play an old TV switching on.
 *
 * `options.getOutro`, if given, returns 0-1: above 0 the ships fade out and
 * the screen types out "LEVEL COMPLETE / NEXT STAGE: WHEELS" over a
 * starfield that speeds up, then fills a loading bar as the value rises to 1.
 * The text uses the canvas element's own CSS font-family.
 *
 * `options.getPicture`, if given, returns `{ image, alpha }` (or null): an
 * image shown whole on the screen (letterboxed), on top of everything above,
 * at that opacity. The scroll sequence uses it to play the next section's footage.
 *
 * Returns a cleanup function.
 */
export function mountConsoleScreen(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const spill = options.spill ?? null;
  const sctx = spill?.getContext("2d") ?? null;
  const isBackgroundOnly = options.isBackgroundOnly ?? (() => false);
  const isPaused = options.isPaused ?? (() => false);
  const getScale = options.getScale ?? (() => 1);
  const getPower = options.getPower ?? (() => 1);
  const getOutro = options.getOutro ?? (() => 0);
  const getPicture = options.getPicture ?? (() => null);
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const sprites = loadSprites(SPRITE_PATHS);

  const backdrop = createSpaceBackdrop();
  // The CSS font-family of the canvas element (the pixel font), for canvas text.
  let fontFamily = "";
  const font = () => (fontFamily ||= getComputedStyle(canvas).fontFamily || "monospace");
  const demo = createAttractDemo(sprites, font, { calm: reduceMotion });
  let scanlines = null;
  let lastTime = 0;
  let frameId = 0;
  let running = false;
  let ratio = 0;
  let cw = 0;
  let ch = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Use offsetWidth/offsetHeight to avoid CSS transform complications
    // from ancestor animations during measurement.
    const w = Math.max(1, canvas.offsetWidth);
    const h = Math.max(1, canvas.offsetHeight);
    const nextRatio = Math.min(MAX_PIXEL_RATIO, dpr * (getScale() || 1));
    if (w === cw && h === ch && nextRatio === ratio) return;
    cw = w;
    ch = h;
    ratio = nextRatio;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    // The game's box is mapped onto the whole canvas. The canvas's size is
    // rounded to whole pixels, so the two scales can differ by a fraction of
    // a percent; one shared scale would leave its last row or column unpainted.
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    scanlines = createScanlines();
    if (spill) {
      spill.width = Math.max(1, Math.round(w / 6));
      spill.height = Math.max(1, Math.round(h / 6));
    }
  }

  function createScanlines() {
    const tile = document.createElement("canvas");
    tile.width = 1;
    tile.height = SCANLINES.every;
    const tileContext = tile.getContext("2d");
    tileContext.fillStyle = SCANLINES.color;
    tileContext.fillRect(0, SCANLINES.every - 1, 1, 1);
    return ctx.createPattern(tile, "repeat");
  }

  // Drawn in the canvas's own pixels, not the game's box, so the lines stay
  // crisp and evenly spaced at any size.
  function drawScanlines() {
    if (!scanlines) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = scanlines;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // One line of the outro, typed out left to right from a fixed position so
  // the letters already shown don't shift as more appear.
  function typeLine({ text, size, y, color, typed: [from, to] }, outro) {
    const shown = Math.round(text.length * clamp01((outro - from) / (to - from)));
    if (shown <= 0) return;
    ctx.font = `${size}px ${font()}`;
    ctx.fillStyle = color;
    ctx.fillText(text.slice(0, shown), (W - ctx.measureText(text).width) / 2, y);
  }

  function drawOutro(outro) {
    if (outro <= 0) return;

    // Darken the starfield a little so the text reads.
    ctx.globalAlpha = Math.min(0.5, outro * 5);
    ctx.fillStyle = "#050414";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    typeLine(OUTRO.clear, outro);
    typeLine(OUTRO.next, outro);
    typeLine(OUTRO.name, outro);

    const { bar } = OUTRO;
    if (outro < bar.fills[0] - 0.02) return;
    const fill = clamp01((outro - bar.fills[0]) / (bar.fills[1] - bar.fills[0]));
    const left = (W - bar.width) / 2;
    ctx.strokeStyle = "#c9a7ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(left, bar.y, bar.width, bar.height);
    const gap = 5;
    const segment = (bar.width - gap) / bar.segments;
    const lit = Math.round(fill * bar.segments);
    for (let i = 0; i < lit; i += 1) {
      ctx.fillStyle = i === lit - 1 && fill < 1 ? "#ffffff" : "#a56bff";
      ctx.fillRect(left + gap + i * segment, bar.y + gap, segment - gap, bar.height - gap * 2);
    }
    ctx.font = `${bar.statusSize}px ${font()}`;
    ctx.fillStyle = "#c9a7ff";
    const status = fill < 1 ? `LOADING ${Math.round(fill * 100)}%` : "READY";
    ctx.fillText(status, (W - ctx.measureText(status).width) / 2, bar.y + bar.height + 44);
  }

  // An image shown whole on the screen, the way a TV shows a picture that
  // isn't its own shape: as large as fits, on dark bars.
  function drawPicture(picture) {
    const image = picture?.image;
    if (!image || !image.complete || !image.naturalWidth || !(picture.alpha > 0)) return;
    const fit = Math.min(W / image.naturalWidth, H / image.naturalHeight);
    const w = image.naturalWidth * fit;
    const h = image.naturalHeight * fit;
    ctx.globalAlpha = Math.min(1, picture.alpha);
    ctx.fillStyle = TUBE_OFF;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(image, (W - w) / 2, (H - h) / 2, w, h);
    ctx.globalAlpha = 1;
  }

  // Covers the finished frame with whatever of the tube is still dark.
  function drawPower(power) {
    if (power >= 1) return;
    ctx.fillStyle = TUBE_OFF;

    if (power <= POWER_LINE) {
      ctx.fillRect(0, 0, W, H);
      if (power <= 0) return;
      const lineWidth = W * (power / POWER_LINE);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#c9a7ff";
      ctx.fillRect((W - lineWidth) / 2, H / 2 - 7, lineWidth, 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect((W - lineWidth) / 2, H / 2 - 1.5, lineWidth, 3);
      return;
    }

    const open = (power - POWER_LINE) / (1 - POWER_LINE);
    const half = Math.max(2, (H / 2) * Math.pow(open, 1.3));
    ctx.fillRect(0, 0, W, H / 2 - half);
    ctx.fillRect(0, H / 2 + half, W, H / 2 - half);
    // The picture burns white-violet while the tube warms up, brightest at
    // the start, and the band's two edges stay lit until it is fully open.
    ctx.globalAlpha = Math.pow(1 - open, 1.2) * 0.95;
    ctx.fillStyle = "#d4b0ff";
    ctx.fillRect(0, H / 2 - half, W, half * 2);
    ctx.globalAlpha = (1 - open) * 0.9;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, H / 2 - half - 1.5, W, 3);
    ctx.fillRect(0, H / 2 + half - 1.5, W, 3);
    ctx.globalAlpha = 1;
  }

  function drawFrame(dt) {
    const outro = clamp01(getOutro() || 0);
    // During the outro the stars fall faster and stretch, as if picking up speed.
    backdrop.draw(ctx, dt, 1 + outro * (OUTRO.speedUp - 1));

    if (!isBackgroundOnly()) {
      demo.update(dt);
      // The game clears off the screen as the outro begins.
      demo.draw(ctx, 1 - outro / SHIPS_GONE);
    }

    drawOutro(outro);
    drawScanlines();
    drawPicture(getPicture());
    drawPower(getPower());

    if (sctx && spill) sctx.drawImage(canvas, 0, 0, spill.width, spill.height);
  }

  function frame(time) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min((time - lastTime) / 1000, MAX_DELTA);
    lastTime = time;
    if (isPaused()) return;
    resize();
    drawFrame(dt);
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

  // Reduced motion: a single still frame, redrawn as each sprite arrives.
  if (reduceMotion) {
    const still = () => {
      resize();
      drawFrame(0);
    };
    Object.values(sprites).forEach((sprite) => sprite.addEventListener("load", still));
    still();
    return () => Object.values(sprites).forEach((sprite) => sprite.removeEventListener("load", still));
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
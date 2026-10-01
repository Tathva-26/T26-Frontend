import { GAME, SPRITE_PATHS } from "@/lib/spaceShooter/constants";
import { randomBetween } from "@/lib/spaceShooter/random";

// Logical drawing resolution: the same box the real game draws in, so it
// fills the screen cutout with a single uniform scale, no stretch.
const W = GAME.width;
const H = GAME.height;

const STAR_COUNT = 90;
const ENEMY_COUNT = 4;
const SHIP = { size: 46, y: H - 70 };
const ENEMY_SIZE = 38;
const BULLET = { width: 4, height: 14, speed: 340 };
const FIRE_INTERVAL = [0.5, 1.0]; // seconds between shots, randomized
const MAX_DELTA = 0.05; // clamp dt so a backgrounded tab doesn't jump on return
const MAX_PIXEL_RATIO = 3;

const loadSprite = (src) => Object.assign(new Image(), { src });

const createStars = () =>
  Array.from({ length: STAR_COUNT }, () => ({
    x: randomBetween(0, W),
    y: randomBetween(0, H),
    size: randomBetween(0.6, 2),
    speed: randomBetween(20, 65),
    phase: randomBetween(0, Math.PI * 2),
  }));

const createEnemy = (startAboveScreen) => ({
  x: randomBetween(50, W - 50),
  y: startAboveScreen ? randomBetween(-420, -ENEMY_SIZE) : randomBetween(-160, -ENEMY_SIZE),
  speed: randomBetween(55, 110),
});

// Centre-to-centre test: things here are positioned by their centre, unlike
// the real game's top-left boxes in spaceShooter/collision.js.
const overlaps = (a, b, sizeA, sizeB) =>
  Math.abs(a.x - b.x) < (sizeA + sizeB) / 2 && Math.abs(a.y - b.y) < (sizeA + sizeB) / 2;

/**
 * A decorative, autonomous space-shooter scene for the console's screen:
 * a starfield, drifting enemies, and a ship that fires on them - drawn with
 * the same sprites as the real game, so it reads as a preview of it. This
 * is ambient flavor only, not the playable game (no score, no input).
 *
 * `options.spill`, if given, is kept as a small blurred copy of every frame,
 * meant to be shown blurred + screen-blended over the console's bezel so
 * the screen's own light bleeds onto the plastic around it.
 *
 * `options.isBackgroundOnly`, if given, is called once per frame. While it
 * returns true, the decorative ship/enemies/bullets stop drawing and only
 * the starfield keeps animating - used when this same canvas is showing
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
 * Returns a cleanup function.
 */
export function mountConsoleScreen(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const spill = options.spill ?? null;
  const sctx = spill?.getContext("2d") ?? null;
  const isBackgroundOnly = options.isBackgroundOnly ?? (() => false);
  const isPaused = options.isPaused ?? (() => false);
  const getScale = options.getScale ?? (() => 1);
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const sprites = {
    ship: loadSprite(SPRITE_PATHS.ship),
    enemy: loadSprite(SPRITE_PATHS.enemy),
    bullet: loadSprite(SPRITE_PATHS.bullet),
  };

  const stars = createStars();
  const enemies = Array.from({ length: ENEMY_COUNT }, () => createEnemy(true));
  let bullets = [];
  let particles = [];
  let fireTimer = randomBetween(...FIRE_INTERVAL);
  let t = 0;
  let lastTime = 0;
  let frameId = 0;
  let running = false;
  let ratio = 0;
  let cw = 0;
  let ch = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const nextRatio = Math.min(MAX_PIXEL_RATIO, dpr * (getScale() || 1));
    // Use offsetWidth/offsetHeight to avoid CSS transform complications
    // from ancestor animations during measurement.
    const w = Math.max(1, canvas.offsetWidth);
    const h = Math.max(1, canvas.offsetHeight);
    if (w === cw && h === ch && nextRatio === ratio) return;
    cw = w;
    ch = h;
    ratio = nextRatio;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    const scale = Math.min(canvas.width / W, canvas.height / H);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (spill) {
      spill.width = Math.max(1, Math.round(w / 6));
      spill.height = Math.max(1, Math.round(h / 6));
    }
  }

  function drawBackground(dt) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#050414");
    gradient.addColorStop(1, "#0a0b2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    stars.forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > H) {
        star.y = 0;
        star.x = randomBetween(0, W);
      }
      const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + star.phase);
      ctx.globalAlpha = 0.35 + twinkle * 0.55;
      ctx.fillStyle = "#bcd6ff";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;
  }

  function updateShip() {
    return { x: W / 2 + Math.sin(t * 0.9) * 150, y: SHIP.y };
  }

  function updateEnemies(dt) {
    enemies.forEach((enemy) => {
      enemy.y += enemy.speed * dt;
      if (enemy.y > H + ENEMY_SIZE) Object.assign(enemy, createEnemy(false));
    });
  }

  function fire(dt, shipPos) {
    fireTimer -= dt;
    if (fireTimer > 0) return;
    fireTimer = randomBetween(...FIRE_INTERVAL);
    bullets.push({ x: shipPos.x, y: shipPos.y - SHIP.size / 2 });
  }

  function spawnBurst(x, y) {
    for (let i = 0; i < 10; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(40, 140);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
      });
    }
  }

  function updateBullets(dt) {
    bullets.forEach((bullet) => {
      bullet.y -= BULLET.speed * dt;
    });
    bullets = bullets.filter((bullet) => {
      const target = enemies.find((enemy) => overlaps(bullet, enemy, 4, ENEMY_SIZE));
      if (!target) return bullet.y > -BULLET.height;
      spawnBurst(target.x, target.y);
      Object.assign(target, createEnemy(true));
      return false;
    });
  }

  function updateParticles(dt) {
    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt * 1.6;
    });
    particles = particles.filter((particle) => particle.life > 0);
  }

  function drawSprite(image, x, y, size) {
    if (!image.complete) return;
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
  }

  function drawParticles() {
    particles.forEach((particle) => {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = "#ff8a5c";
      ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  function drawFrame(dt) {
    drawBackground(dt);

    if (!isBackgroundOnly()) {
      const shipPos = updateShip();
      updateEnemies(dt);
      fire(dt, shipPos);
      updateBullets(dt);
      updateParticles(dt);

      enemies.forEach((enemy) => drawSprite(sprites.enemy, enemy.x, enemy.y, ENEMY_SIZE));
      drawParticles();
      bullets.forEach((bullet) => drawSprite(sprites.bullet, bullet.x, bullet.y, BULLET.height));
      drawSprite(sprites.ship, shipPos.x, shipPos.y, SHIP.size);
    }

    drawVignette();

    if (sctx && spill) sctx.drawImage(canvas, 0, 0, spill.width, spill.height);
  }

  function frame(time) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min((time - lastTime) / 1000, MAX_DELTA);
    lastTime = time;
    if (isPaused()) return;
    t += dt;
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

  if (reduceMotion) {
    resize();
    drawFrame(0);
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
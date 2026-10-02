import { GAME, SHIP, ENEMY, DIFFICULTY, BULLET, RULES, EFFECTS } from "./constants";
import { createInput } from "./input";
import { overlaps } from "./collision";
import { loadSprites } from "./sprites";
import { randomBetween } from "./random";
import { loadHighScore, saveHighScore } from "./highScore";
import { clamp } from "./math";

const enemyCountAt = (elapsed) =>
  Math.min(
    DIFFICULTY.maxEnemies,
    DIFFICULTY.startEnemies + Math.floor(elapsed / DIFFICULTY.secondsPerEnemy)
  );

const enemySpeedAt = (elapsed) =>
  Math.min(DIFFICULTY.maxSpeed, DIFFICULTY.startSpeed + elapsed * DIFFICULTY.speedPerSecond);

const spawnEnemy = () => ({
  x: randomBetween(0, GAME.width - ENEMY.size),
  y: -ENEMY.size - randomBetween(0, 150),
  w: ENEMY.size,
  h: ENEMY.size,
});

const createWorld = () => ({
  phase: "ready",
  score: 0,
  lives: RULES.lives,
  elapsed: 0,
  cooldown: 0,
  invulnerable: 0,
  ship: {
    x: (GAME.width - SHIP.size) / 2,
    y: GAME.height - SHIP.size - SHIP.margin,
    w: SHIP.size,
    h: SHIP.size,
  },
  enemies: Array.from({ length: DIFFICULTY.startEnemies }, spawnEnemy),
  bullets: [],
});

const centerOf = (box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });

/**
 * Creates a Space Shooter bound to a canvas.
 * `spritePaths` maps ship/enemy/bullet to image URLs. Returns
 * { resize, start, setPaused, setJoystick, setFiring, destroy }.
 * `onStats` fires only when phase, score, high score or lives change, so
 * React never re-renders per frame. `onHit` fires when the ship loses a life.
 */
export function createSpaceShooter(canvas, { onStats, onHit, spritePaths } = {}) {
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let world = createWorld();
  let highScore = loadHighScore();
  let sprites = null;
  let spritesFailed = false;
  let particles = [];
  let flash = 0;
  let frameId = 0;
  let lastTime = 0;
  let paused = false;
  let lastStats = "";

  const input = createInput((code) => {
    if ((code === "Space" || code === "Enter") && world.phase !== "playing") start();
  });

  function start() {
    if (world.phase === "playing") return;
    world = createWorld();
    world.phase = "playing";
  }

  function endRound() {
    world.phase = "over";
    if (world.score > highScore) {
      highScore = world.score;
      saveHighScore(highScore);
    }
  }

  function spawnBurst({ x, y }, color) {
    for (let i = 0; i < EFFECTS.burstCount; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(60, 220);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
    }
  }

  function moveShip(dt) {
    const { ship } = world;
    ship.x = clamp(ship.x + input.getAxis("x") * SHIP.speed * dt, 0, GAME.width - ship.w);
    ship.y = clamp(ship.y + input.getAxis("y") * SHIP.speed * dt, 0, GAME.height - ship.h);
  }

  function fire(dt) {
    world.cooldown = Math.max(0, world.cooldown - dt);
    const canFire = world.cooldown === 0 && world.bullets.length < BULLET.max;
    if (!input.isDown("Space") || !canFire) return;

    const { ship } = world;
    world.bullets.push({
      x: ship.x + (ship.w - BULLET.width) / 2,
      y: ship.y - BULLET.height,
      w: BULLET.width,
      h: BULLET.height,
    });
    world.cooldown = BULLET.cooldown;
  }

  function advance(dt) {
    world.bullets.forEach((bullet) => {
      bullet.y -= BULLET.speed * dt;
    });
    world.bullets = world.bullets.filter((bullet) => bullet.y + bullet.h > 0);

    while (world.enemies.length < enemyCountAt(world.elapsed)) world.enemies.push(spawnEnemy());

    const speed = enemySpeedAt(world.elapsed);
    world.enemies.forEach((enemy) => {
      enemy.y += speed * dt;
      if (enemy.y > GAME.height) Object.assign(enemy, spawnEnemy());
    });
  }

  function resolveCollisions(dt) {
    world.bullets = world.bullets.filter((bullet) => {
      const target = world.enemies.find((enemy) => overlaps(bullet, enemy));
      if (!target) return true;
      spawnBurst(centerOf(target), EFFECTS.killColor);
      Object.assign(target, spawnEnemy());
      world.score += RULES.killScore;
      return false;
    });

    world.invulnerable = Math.max(0, world.invulnerable - dt);
    if (world.invulnerable > 0) return;

    const { ship } = world;
    const hitbox = {
      x: ship.x + SHIP.hitInset,
      y: ship.y + SHIP.hitInset,
      w: ship.w - SHIP.hitInset * 2,
      h: ship.h - SHIP.hitInset * 2,
    };
    const rammer = world.enemies.find((enemy) => overlaps(hitbox, enemy));
    if (!rammer) return;
    spawnBurst(centerOf(rammer), EFFECTS.hitColor);
    Object.assign(rammer, spawnEnemy());
    world.lives = Math.max(0, world.lives - 1);
    world.invulnerable = RULES.invulnerableSeconds;
    if (!reduceMotion) flash = EFFECTS.flashSeconds;
    onHit?.();
    if (world.lives === 0) endRound();
  }

  function update(dt) {
    world.elapsed += dt;
    moveShip(dt);
    fire(dt);
    advance(dt);
    resolveCollisions(dt);
  }

  function updateEffects(dt) {
    flash = Math.max(0, flash - dt);
    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt * EFFECTS.burstFade;
    });
    particles = particles.filter((particle) => particle.life > 0);
  }

  // Plain shapes, only used if the sprite images could not be loaded.
  function drawFallback(kind, box) {
    ctx.fillStyle = { enemy: "#ff5d73", bullet: "#ffe066", ship: "#7ad7ff" }[kind];
    if (kind !== "ship") {
      ctx.fillRect(box.x, box.y, box.w, box.h);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(box.x + box.w / 2, box.y);
    ctx.lineTo(box.x + box.w, box.y + box.h);
    ctx.lineTo(box.x, box.y + box.h);
    ctx.closePath();
    ctx.fill();
  }

  function drawEntity(kind, box) {
    if (sprites) ctx.drawImage(sprites[kind], box.x, box.y, box.w, box.h);
    else if (spritesFailed) drawFallback(kind, box);
  }

  function draw() {
    ctx.clearRect(0, 0, GAME.width, GAME.height);

    world.enemies.forEach((enemy) => drawEntity("enemy", enemy));
    world.bullets.forEach((bullet) => drawEntity("bullet", bullet));

    const half = EFFECTS.burstSize / 2;
    particles.forEach((particle) => {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - half, particle.y - half, EFFECTS.burstSize, EFFECTS.burstSize);
    });

    const blinking = world.invulnerable > 0 && Math.floor(world.invulnerable * 10) % 2 === 0;
    ctx.globalAlpha = blinking ? 0.35 : 1;
    drawEntity("ship", world.ship);
    ctx.globalAlpha = 1;

    if (flash > 0) {
      ctx.globalAlpha = (flash / EFFECTS.flashSeconds) * 0.28;
      ctx.fillStyle = EFFECTS.hitColor;
      ctx.fillRect(0, 0, GAME.width, GAME.height);
      ctx.globalAlpha = 1;
    }
  }

  function emitStats() {
    const stats = { phase: world.phase, score: world.score, highScore, lives: world.lives };
    const key = JSON.stringify(stats);
    if (key === lastStats) return;
    lastStats = key;
    onStats?.(stats);
  }

  function frame(time) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min((time - lastTime) / 1000, RULES.maxDelta);
    lastTime = time;

    if (!paused && !document.hidden) {
      if (world.phase === "playing") update(dt);
      updateEffects(dt);
    }
    draw();
    emitStats();
  }

  function resize(cssWidth) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round((canvas.width * GAME.height) / GAME.width);
    const scale = canvas.width / GAME.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  loadSprites(spritePaths)
    .then((loaded) => {
      sprites = loaded;
    })
    .catch((error) => {
      spritesFailed = true;
      console.error("Space Shooter: failed to load sprites", error);
    });

  frameId = requestAnimationFrame(frame);

  return {
    resize,
    start,
    setPaused(value) {
      paused = value;
    },
    setJoystick: (x, y) => input.setJoystick(x, y),
    setFiring: (isDown) => input.setVirtualFire(isDown),
    destroy() {
      cancelAnimationFrame(frameId);
      input.dispose();
    },
  };
}

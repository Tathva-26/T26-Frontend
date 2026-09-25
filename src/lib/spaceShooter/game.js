import {
  BULLET,
  DIFFICULTY,
  ENEMY,
  GAME,
  RULES,
  SHIP,
} from "./constants";
import { overlaps } from "./collision";
import { createInput } from "./input";
import { loadHighScore, saveHighScore } from "./highScore";
import { randomBetween } from "./random";
import { loadSprites } from "./sprites";

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

const enemyCountAt = (elapsed) =>
  Math.min(
    DIFFICULTY.maxEnemies,
    DIFFICULTY.startEnemies +
      Math.floor(
        elapsed / DIFFICULTY.secondsPerEnemy
      )
  );

const enemySpeedAt = (elapsed) =>
  Math.min(
    DIFFICULTY.maxSpeed,
    DIFFICULTY.startSpeed +
      elapsed * DIFFICULTY.speedPerSecond
  );

const spawnEnemy = () => ({
  x: randomBetween(
    0,
    GAME.width - ENEMY.size
  ),
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
    y:
      GAME.height -
      SHIP.size -
      SHIP.margin,
    w: SHIP.size,
    h: SHIP.size,
  },
  enemies: Array.from(
    {
      length: DIFFICULTY.startEnemies,
    },
    spawnEnemy
  ),
  bullets: [],
});

export function createSpaceShooter(
  canvas,
  { onStats, spritePaths } = {}
) {
  const ctx = canvas.getContext("2d");

  let world = createWorld();
  let highScore = loadHighScore();
  let sprites = null;
  let frameId = 0;
  let lastTime = 0;
  let paused = false;
  let lastStats = "";

  const input = createInput((code) => {
    if (
      (code === "Space" || code === "Enter") &&
      world.phase !== "playing"
    ) {
      start();
    }
  });

  const axis = (negative, positive) =>
    Number(input.isDown(positive)) -
    Number(input.isDown(negative));

  function start() {
    if (world.phase === "playing") {
      return;
    }

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

  function moveShip(dt) {
    const { ship } = world;

    ship.x = clamp(
      ship.x +
        axis(
          "ArrowLeft",
          "ArrowRight"
        ) *
          SHIP.speed *
          dt,
      0,
      GAME.width - ship.w
    );

    ship.y = clamp(
      ship.y +
        axis(
          "ArrowUp",
          "ArrowDown"
        ) *
          SHIP.speed *
          dt,
      0,
      GAME.height - ship.h
    );
  }

  function fire(dt) {
    world.cooldown = Math.max(
      0,
      world.cooldown - dt
    );

    const canFire =
      world.cooldown === 0 &&
      world.bullets.length < BULLET.max;

    if (
      !input.isDown("Space") ||
      !canFire
    ) {
      return;
    }

    const { ship } = world;

    world.bullets.push({
      x:
        ship.x +
        (ship.w - BULLET.width) / 2,
      y:
        ship.y -
        BULLET.height,
      w: BULLET.width,
      h: BULLET.height,
    });

    world.cooldown = BULLET.cooldown;
  }

  function advance(dt) {
    world.bullets.forEach((bullet) => {
      bullet.y -= BULLET.speed * dt;
    });

    world.bullets = world.bullets.filter(
      (bullet) =>
        bullet.y + bullet.h > 0
    );

    while (
      world.enemies.length <
      enemyCountAt(world.elapsed)
    ) {
      world.enemies.push(spawnEnemy());
    }

    const speed = enemySpeedAt(
      world.elapsed
    );

    world.enemies.forEach((enemy) => {
      enemy.y += speed * dt;

      if (enemy.y > GAME.height) {
        Object.assign(
          enemy,
          spawnEnemy()
        );
      }
    });
  }

  function resolveCollisions(dt) {
    world.bullets =
      world.bullets.filter((bullet) => {
        const target = world.enemies.find(
          (enemy) =>
            overlaps(bullet, enemy)
        );

        if (!target) {
          return true;
        }

        Object.assign(
          target,
          spawnEnemy()
        );

        world.score += RULES.killScore;

        return false;
      });

    world.invulnerable = Math.max(
      0,
      world.invulnerable - dt
    );

    if (world.invulnerable > 0) {
      return;
    }

    const rammer = world.enemies.find(
      (enemy) =>
        overlaps(world.ship, enemy)
    );

    if (!rammer) {
      return;
    }

    Object.assign(
      rammer,
      spawnEnemy()
    );

    world.lives = Math.max(
      0,
      world.lives - 1
    );

    world.invulnerable =
      RULES.invulnerableSeconds;

    if (world.lives === 0) {
      endRound();
    }
  }

  function update(dt) {
    world.elapsed += dt;
    moveShip(dt);
    fire(dt);
    advance(dt);
    resolveCollisions(dt);
  }

  function draw() {
    ctx.clearRect(
      0,
      0,
      GAME.width,
      GAME.height
    );

    if (!sprites) {
      return;
    }

    world.enemies.forEach((enemy) => {
      ctx.drawImage(
        sprites.enemy,
        enemy.x,
        enemy.y,
        enemy.w,
        enemy.h
      );
    });

    world.bullets.forEach((bullet) => {
      ctx.drawImage(
        sprites.bullet,
        bullet.x,
        bullet.y,
        bullet.w,
        bullet.h
      );
    });

    const blinking =
      world.invulnerable > 0 &&
      Math.floor(
        world.invulnerable * 10
      ) %
        2 ===
        0;

    ctx.globalAlpha = blinking
      ? 0.35
      : 1;

    const { ship } = world;

    ctx.drawImage(
      sprites.ship,
      ship.x,
      ship.y,
      ship.w,
      ship.h
    );

    ctx.globalAlpha = 1;
  }

  function emitStats() {
    const stats = {
      phase: world.phase,
      score: world.score,
      highScore,
      lives: world.lives,
    };

    const key = JSON.stringify(stats);

    if (key === lastStats) {
      return;
    }

    lastStats = key;
    onStats?.(stats);
  }

  function frame(time) {
    frameId =
      requestAnimationFrame(frame);

    const dt = Math.min(
      (time - lastTime) / 1000,
      RULES.maxDelta
    );

    lastTime = time;

    if (
      !paused &&
      !document.hidden &&
      world.phase === "playing"
    ) {
      update(dt);
    }

    draw();
    emitStats();
  }

  function resize(cssWidth) {
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width = Math.round(
      cssWidth * dpr
    );

    canvas.height = Math.round(
      (canvas.width * GAME.height) /
        GAME.width
    );

    const scale =
      canvas.width / GAME.width;

    ctx.setTransform(
      scale,
      0,
      0,
      scale,
      0,
      0
    );
  }

  loadSprites(spritePaths)
    .then((loaded) => {
      sprites = loaded;
    })
    .catch((error) => {
      console.error(
        "Space Shooter: failed to load sprites",
        error
      );
    });

  frameId =
    requestAnimationFrame(frame);

  return {
    resize,
    start,

    setPaused(value) {
      paused = value;
    },

    destroy() {
      cancelAnimationFrame(frameId);
      input.dispose();
    },
  };
}
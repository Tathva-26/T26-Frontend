import { EFFECTS, ENEMIES, PICKUPS, RULES, SHIP, SHOT } from "./constants";
import { randomBetween } from "./random";

const BULLET = { width: 10, height: 26, trail: 30 };
const HURT_FLASH = 0.08; // seconds; the world sets an enemy's `flash` to this when it is hit
const BANNER_Y = 0.48; // where the wave announcement sits, as a share of the screen's height
const PICKUP_LOOK = {
  power: { color: "#ffd166", glow: "255, 200, 90", letter: "P" },
  shield: { color: "#6ad7ff", glow: "90, 200, 255", letter: "S" },
  life: { color: "#ff5d7a", glow: "255, 90, 120", letter: null }, // drawn as a heart
};
const FALLBACK = { ship: "#7ad7ff", enemy: "#ff5d73", bullet: "#ffe066" };

// prettier-ignore
const HEART = [
  "0110110",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

const loaded = (image) => image.complete && image.naturalWidth > 0;
const failed = (image) => image.complete && image.naturalWidth === 0;

// A soft round glow fading out from `inner` to nothing, drawn once and reused
// at any size ("r, g, b" colours).
function createGlow(core, inner, outer) {
  const sprite = document.createElement("canvas");
  sprite.width = 96;
  sprite.height = 96;
  const ctx = sprite.getContext("2d");
  const gradient = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  gradient.addColorStop(0, `rgba(${core}, 1)`);
  gradient.addColorStop(0.3, `rgba(${inner}, 0.85)`);
  gradient.addColorStop(0.65, `rgba(${outer}, 0.3)`);
  gradient.addColorStop(1, `rgba(${outer}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);
  return sprite;
}

// A copy of a sprite washed with a colour, keeping its own shape.
function createTinted(image, tint, strength) {
  const sprite = document.createElement("canvas");
  sprite.width = 128;
  sprite.height = 128;
  const ctx = sprite.getContext("2d");
  ctx.drawImage(image, 0, 0, 128, 128);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = `rgba(${tint}, ${strength})`;
  ctx.fillRect(0, 0, 128, 128);
  return sprite;
}

/**
 * Draws a world (see world.js) onto a 2D canvas context, in the world's own
 * units: the caller sets whatever transform maps the play area onto its
 * canvas. `sprites` is { ship, enemy, bullet } images; anything not loaded
 * yet is simply left out, and plain shapes stand in for any that failed.
 *
 * Returns `{ draw(ctx, state, options) }`, with options:
 *   font  - CSS font-family for the text on screen
 *   alpha - opacity of everything drawn (default 1)
 *   calm  - true to leave out the screen shake and the hit flash
 */
export function createRenderer(sprites) {
  const fire = createGlow("255, 255, 255", "255, 214, 140", "255, 100, 90");
  const plasma = createGlow("255, 255, 255", "255, 120, 220", "210, 60, 255");
  const halos = Object.fromEntries(
    Object.entries(PICKUP_LOOK).map(([kind, look]) => [kind, createGlow("255, 255, 255", look.glow, look.glow)])
  );
  let enemyLooks = null; // the enemy sprite in each kind's colour, once it has loaded

  function looks() {
    if (enemyLooks || !loaded(sprites.enemy)) return enemyLooks;
    enemyLooks = { hurt: createTinted(sprites.enemy, "255, 255, 255", 0.85) };
    Object.entries(ENEMIES).forEach(([kind, spec]) => {
      enemyLooks[kind] = spec.tint ? createTinted(sprites.enemy, spec.tint, 0.42) : sprites.enemy;
    });
    return enemyLooks;
  }

  function drawTurned(ctx, image, x, y, width, height, turn = 0, squash = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.scale(squash, 1);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  function drawGlow(ctx, sprite, x, y, size) {
    ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
  }

  function drawEnemies(ctx, state, alpha) {
    const variants = looks();
    state.enemies.forEach((foe) => {
      // A diver taking aim shudders on the spot.
      const shudder = foe.state === "aim" ? randomBetween(-2, 2) : 0;
      const turn =
        foe.state === "dive"
          ? Math.atan2(foe.vy, foe.vx) - Math.PI / 2
          : foe.kind === "boss"
            ? 0
            : Math.sin(foe.age * 3 + foe.phase) * 0.08 - foe.vx * 0.0012;
      if (variants) {
        drawTurned(ctx, variants[foe.kind], foe.x + shudder, foe.y, foe.size, foe.size, turn);
        if (foe.flash > 0) {
          // A hit shows as a white flash over it that fades at once.
          ctx.globalAlpha = alpha * Math.min(1, foe.flash / HURT_FLASH) * 0.75;
          drawTurned(ctx, variants.hurt, foe.x + shudder, foe.y, foe.size, foe.size, turn);
          ctx.globalAlpha = alpha;
        }
      } else if (failed(sprites.enemy)) {
        ctx.fillStyle = FALLBACK.enemy;
        ctx.fillRect(foe.x - foe.size / 2, foe.y - foe.size / 2, foe.size, foe.size);
      }
    });
  }

  function drawShots(ctx, state) {
    ctx.globalCompositeOperation = "lighter";
    state.shots.forEach((shot) => drawGlow(ctx, plasma, shot.x, shot.y, SHOT.radius * 6.5));
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffe9ff";
    state.shots.forEach((shot) => {
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, SHOT.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawBullets(ctx, state, alpha) {
    state.bullets.forEach((bullet) => {
      const turn = Math.atan2(bullet.vx, -bullet.vy);
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(turn);
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = "#ffd76a";
      ctx.fillRect(-2, 0, 4, BULLET.trail); // the streak it leaves
      ctx.globalAlpha = alpha;
      if (loaded(sprites.bullet)) {
        ctx.drawImage(sprites.bullet, -BULLET.width / 2, -BULLET.height / 2, BULLET.width, BULLET.height);
      } else if (failed(sprites.bullet)) {
        ctx.fillStyle = FALLBACK.bullet;
        ctx.fillRect(-3, -BULLET.height / 2, 6, BULLET.height);
      }
      ctx.restore();
    });
  }

  // Engine flames: a flickering violet tongue with a white-hot core.
  function drawFlames(ctx, ship) {
    const base = ship.y + SHIP.size * 0.36;
    const thrust = 1 - Math.max(-1, Math.min(1, ship.vy / SHIP.speed)) / 2; // longer when climbing
    ctx.globalCompositeOperation = "lighter";
    [-SHIP.engines, SHIP.engines].forEach((engine) => {
      const length = randomBetween(14, 26) * thrust;
      [
        ["rgba(150, 90, 255, 0.8)", 6, length],
        ["rgba(255, 255, 255, 0.9)", 2.6, length * 0.55],
      ].forEach(([color, half, reach]) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ship.x + engine - half, base);
        ctx.lineTo(ship.x + engine + half, base);
        ctx.lineTo(ship.x + engine - ship.lean * 8, base + reach);
        ctx.closePath();
        ctx.fill();
      });
    });
    ctx.globalCompositeOperation = "source-over";
  }

  function drawShip(ctx, state, alpha) {
    const { ship } = state;
    if (ship.dead) return;

    const blinking = state.invulnerable > 0 && Math.floor(state.invulnerable * 10) % 2 === 0;
    ctx.globalAlpha = alpha * (blinking ? 0.35 : 1);
    drawFlames(ctx, ship);
    // It banks into its turns: it leans and narrows a little.
    const { lean } = ship;
    if (loaded(sprites.ship)) {
      drawTurned(ctx, sprites.ship, ship.x, ship.y, SHIP.size, SHIP.size, lean * 0.22, 1 - Math.abs(lean) * 0.22);
    } else if (failed(sprites.ship)) {
      ctx.fillStyle = FALLBACK.ship;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y - SHIP.size / 2);
      ctx.lineTo(ship.x + SHIP.size / 2, ship.y + SHIP.size / 2);
      ctx.lineTo(ship.x - SHIP.size / 2, ship.y + SHIP.size / 2);
      ctx.closePath();
      ctx.fill();
    }

    if (state.muzzle > 0) {
      ctx.globalCompositeOperation = "lighter";
      [-SHIP.guns, SHIP.guns].forEach((gun) => drawGlow(ctx, fire, ship.x + gun, ship.y - SHIP.size * 0.36, 26));
      ctx.globalCompositeOperation = "source-over";
    }

    if (state.shield) {
      ctx.globalAlpha = alpha * (0.55 + 0.25 * Math.sin(state.time * 6));
      ctx.strokeStyle = PICKUP_LOOK.shield.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, SHIP.size * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
  }

  function drawHeart(ctx, x, y, pixel) {
    const left = x - (HEART[0].length * pixel) / 2;
    const top = y - (HEART.length * pixel) / 2;
    HEART.forEach((row, rowIndex) => {
      [...row].forEach((filled, column) => {
        if (filled === "1") ctx.fillRect(left + column * pixel, top + rowIndex * pixel, pixel, pixel);
      });
    });
  }

  function drawPickups(ctx, state, alpha, font) {
    state.pickups.forEach((item) => {
      const look = PICKUP_LOOK[item.kind];
      const y = item.y + Math.sin(item.age * 4) * 3;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha * (0.55 + 0.25 * Math.sin(item.age * 7));
      drawGlow(ctx, halos[item.kind], item.x, y, PICKUPS.radius * 4.4);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;

      ctx.fillStyle = "#0b0822";
      ctx.strokeStyle = look.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(item.x, y, PICKUPS.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = look.color;
      if (look.letter) {
        ctx.font = `${PICKUPS.radius}px ${font}`;
        ctx.fillText(look.letter, item.x + 1, y + 1);
      } else {
        drawHeart(ctx, item.x, y + 1, 2.4);
      }
    });
  }

  function drawBlasts(ctx, state, alpha) {
    ctx.globalCompositeOperation = "lighter";
    state.blasts.forEach((one) => {
      if (one.age < EFFECTS.glowSeconds) {
        const g = one.age / EFFECTS.glowSeconds;
        ctx.globalAlpha = alpha * (1 - g * g);
        drawGlow(ctx, fire, one.x, one.y, 110 * one.scale * (0.55 + 0.45 * g));
      }
      const k = one.age / EFFECTS.blastSeconds;
      ctx.globalAlpha = alpha * (1 - k);
      ctx.strokeStyle = one.color ?? "#ffb86b";
      ctx.lineWidth = 5 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(one.x, one.y, (12 + 52 * Math.sqrt(k)) * one.scale, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over";

    state.debris.forEach((bit) => {
      ctx.globalAlpha = alpha * Math.min(1, bit.life * 1.6);
      ctx.fillStyle = bit.color;
      ctx.fillRect(bit.x - bit.size / 2, bit.y - bit.size / 2, bit.size, bit.size);
    });
    ctx.globalAlpha = alpha;
  }

  function drawPopups(ctx, state, alpha, font) {
    ctx.font = `14px ${font}`;
    state.popups.forEach((one) => {
      const k = one.age / EFFECTS.popupSeconds;
      ctx.globalAlpha = alpha * (1 - k * k);
      ctx.fillStyle = one.color;
      ctx.fillText(one.text, one.x, one.y - 16 - 34 * k);
    });
    ctx.globalAlpha = alpha;
  }

  // What sits over the action: the boss's health, the wave announcement and
  // the score multiplier.
  function drawOverlay(ctx, state, alpha, font) {
    const { field } = state;

    const boss = state.enemies.find((foe) => foe.kind === "boss");
    if (boss) {
      const width = field.width * 0.4;
      const left = (field.width - width) / 2;
      const top = field.height * 0.105;
      ctx.fillStyle = "rgba(10, 6, 30, 0.7)";
      ctx.fillRect(left - 2, top - 2, width + 4, 11);
      ctx.fillStyle = "#ff3d7f";
      ctx.fillRect(left, top, width * Math.max(0, boss.hp / boss.maxHp), 7);
    }

    if (state.banner) {
      const { banner } = state;
      const fade = Math.min(1, banner.age * 5) * Math.min(1, (EFFECTS.bannerSeconds - banner.age) * 3);
      const blink = banner.boss && Math.floor(banner.age * 6) % 2 ? 0.45 : 1;
      ctx.globalAlpha = alpha * Math.max(0, fade) * blink;
      ctx.fillStyle = banner.boss ? "#ff4d6d" : "#ffffff";
      ctx.font = `30px ${font}`;
      ctx.fillText(banner.text, field.width / 2, field.height * BANNER_Y);
      if (banner.sub) {
        ctx.font = `12px ${font}`;
        ctx.fillText(banner.sub, field.width / 2, field.height * BANNER_Y + 34);
      }
      ctx.globalAlpha = alpha;
    }

    if (state.multiplier > 1) {
      const left = 16;
      const bottom = field.height - 16;
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffe066";
      ctx.font = `20px ${font}`;
      ctx.fillText(`x${state.multiplier}`, left, bottom - 14);
      ctx.fillStyle = "rgba(255, 224, 102, 0.3)";
      ctx.fillRect(left, bottom - 2, 56, 4);
      ctx.fillStyle = "#ffe066";
      ctx.fillRect(left, bottom - 2, 56 * Math.max(0, state.comboTimer / RULES.comboSeconds), 4);
      ctx.textAlign = "center";
    }
  }

  return {
    draw(ctx, state, { font = "monospace", alpha = 1, calm = false } = {}) {
      if (alpha <= 0) return;
      const { field } = state;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.save();
      if (!calm && state.shake > 0) {
        const jolt = EFFECTS.shake * state.shake * state.shake;
        ctx.translate(randomBetween(-1, 1) * jolt, randomBetween(-1, 1) * jolt);
      }
      drawPickups(ctx, state, alpha, font);
      drawEnemies(ctx, state, alpha);
      drawShots(ctx, state);
      drawBullets(ctx, state, alpha);
      drawShip(ctx, state, alpha);
      drawBlasts(ctx, state, alpha);
      drawPopups(ctx, state, alpha, font);
      ctx.restore();

      drawOverlay(ctx, state, alpha, font);

      if (!calm && state.flash > 0) {
        ctx.globalAlpha = alpha * (state.flash / EFFECTS.flashSeconds) * 0.28;
        ctx.fillStyle = EFFECTS.hitColor;
        ctx.fillRect(0, 0, field.width, field.height);
      }
      ctx.restore();
    },
  };
}

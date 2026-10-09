import { EFFECTS, ENEMIES, GAME, PICKUPS, RULES, SHIP, SHOT, WAVES, WEAPON } from "./constants";
import { clamp } from "./math";
import { randomBetween } from "./random";

const range = (count) => Array.from({ length: count }, (_, index) => index);
const pick = (list) => list[Math.floor(randomBetween(0, list.length))];
const near = (a, b, distance) => Math.hypot(a.x - b.x, a.y - b.y) < distance;

// An enemy that enters sideways loses that speed at this rate (1/s), so one
// starting at `vx` travels vx / ENTRY_DRAG across before it straightens out.
const ENTRY_DRAG = 0.9;
const SWEEP = { speed: 260, inset: 60 }; // px/s at least, and how far inside the edge it must end up

// The shapes a wave arrives in. Each returns where its enemies start, above
// (or beside) a screen of the given size: { x, y } plus, optionally, a
// sideways speed that dies away (`vx`) or a side-to-side weave (`sway`, `phase`).
const FORMATIONS = [
  // A "V", point first.
  (count, { width }) => {
    const gap = Math.min(72, (width * 0.8) / count);
    const middle = randomBetween(width * 0.4, width * 0.6);
    return range(count).map((index) => {
      const slot = Math.ceil(index / 2) * (index % 2 ? 1 : -1); // 0, 1, -1, 2, -2, ...
      return { x: middle + slot * gap, y: -40 - Math.abs(slot) * 54 };
    });
  },
  // A diagonal line, one after another.
  (count, { width }) => {
    const side = randomBetween(0, 1) < 0.5 ? -1 : 1;
    const step = (width * 0.72) / Math.max(1, count - 1);
    return range(count).map((index) => ({ x: width / 2 + side * (index * step - width * 0.36), y: -40 - index * 58 }));
  },
  // A row that weaves from side to side as it comes down.
  (count, { width }) =>
    range(count).map((index) => ({
      x: width * 0.12 + ((index + 0.5) * width * 0.76) / count,
      y: -40 - (index % 2) * 46,
      sway: 46,
      phase: index * 0.7,
    })),
  // Two groups sweeping in from the sides. The ones at the back start further
  // out, so they come in faster: enough to carry every one of them on screen.
  (count, { width }) =>
    range(count).map((index) => {
      const from = index % 2 ? 1 : -1;
      const rank = Math.floor(index / 2);
      const outside = 40 + rank * 46;
      const speed = Math.max(SWEEP.speed, (outside + SWEEP.inset) * ENTRY_DRAG);
      return { x: width / 2 + from * (width / 2 + outside), y: -20 - rank * 54, vx: -from * speed };
    }),
  // Stragglers, anywhere.
  (count, { width }) => range(count).map((index) => ({ x: randomBetween(40, width - 40), y: -40 - index * 70 })),
  // Two columns.
  (count, { width }) =>
    range(count).map((index) => ({ x: width * (index % 2 ? 0.68 : 0.32) + randomBetween(-12, 12), y: -40 - index * 50 })),
];

// Which kinds of enemy a wave is made of: all grunts at first, then a few of
// each tougher kind as the waves go on. Tanks take the rear.
function waveKinds(wave, count) {
  const kinds = range(count).map(() => "grunt");
  const tanks = wave >= 4 ? Math.min(3, 1 + Math.floor((wave - 4) / 4)) : 0;
  const shooters = wave >= 3 ? Math.min(6, 1 + Math.floor((wave - 3) / 2)) : 0;
  const divers = wave >= 2 ? Math.min(4, 1 + Math.floor((wave - 2) / 3)) : 0;
  range(tanks).forEach((index) => {
    kinds[count - 1 - index] = "tank";
  });
  const free = range(count - tanks).sort(() => randomBetween(-1, 1));
  free.slice(0, shooters).forEach((slot) => {
    kinds[slot] = "shooter";
  });
  free.slice(shooters, shooters + divers).forEach((slot) => {
    kinds[slot] = "diver";
  });
  return kinds;
}

const freshState = (field) => ({
  field,
  phase: "ready", // "ready" | "playing" | "over"
  time: 0,
  score: 0,
  lives: RULES.lives,
  wave: 0,
  bosses: 0, // how many have been beaten
  nextWaveIn: null, // seconds until the announced wave arrives; null while one is on screen
  // `lean` (-1 to 1) is how hard it is moving sideways.
  ship: { x: field.width / 2, y: field.height - SHIP.size / 2 - 20, vx: 0, vy: 0, lean: 0, dead: false },
  weapon: 1,
  shield: false,
  invulnerable: 0,
  cooldown: 0,
  muzzle: 0, // seconds left of the flash at the guns
  dying: 0,
  chain: 0, // kills in the current streak
  comboTimer: 0,
  multiplier: 1,
  enemies: [],
  bullets: [], // the ship's
  shots: [], // the enemies'
  pickups: [],
  blasts: [],
  delayedBlasts: [],
  debris: [],
  popups: [],
  banner: null,
  shake: 0,
  flash: 0,
});

/**
 * The game itself: a ship, waves of enemies, shots, pickups and score, as
 * plain data that moves forward in time. It knows nothing about canvases,
 * keys or React, so the same thing runs the playable game (see engine) and
 * the console's self-playing preview (see consoleScreen/attractDemo).
 *
 * `field` is the size of the play area: the game's full 800 x 515, or
 * something smaller with the same shape for a small screen, on which the
 * same sprites then show larger (see setField). `pace`, if given, fixes how
 * fast everything moves (1 is the full field's speed) instead of following
 * the field's size. `firstWave` is the wave a round starts on, and
 * `waveDelay` the pause (seconds) before each wave arrives. `onEvent(name)`
 * is told of "hit", "shield", "kill", "pickup", "boss" and "over".
 *
 * Returns `{ state, start(), setField(field), step(dt, controls) }`. `state`
 * is one object, kept up to date in place, for a renderer to read.
 * `controls` is `{ x, y, fire }`: the stick from -1 to 1 on each axis, and
 * the trigger.
 */
export function createWorld({ field: firstField = GAME, pace: fixedPace, firstWave = 1, waveDelay = WAVES.delay, onEvent } = {}) {
  let field = firstField;
  const state = freshState(field);
  const emit = (name) => onEvent?.(name);

  // A smaller field has less room and less time to react in, so things move
  // more slowly on it, and its waves are a little smaller.
  const pace = () => fixedPace ?? Math.sqrt(field.width / GAME.width);
  const speedUp = () => pace() * (1 + Math.min(WAVES.maxSpeedUp, Math.max(0, state.wave - 1) * WAVES.speedPerWave));
  const shotSpeed = () => pace() * Math.min(SHOT.maxSpeed, SHOT.speed + state.wave * SHOT.speedPerWave);
  const fireRate = () => 1 + Math.min(WAVES.maxFireRateUp, state.wave * WAVES.fireRatePerWave);

  function start() {
    Object.assign(state, freshState(field), { phase: "playing", wave: firstWave - 1 });
  }

  // Changes the size of the play area. It only takes effect between rounds:
  // a round in progress keeps the field it started on.
  function setField(next) {
    if (next.width === field.width && next.height === field.height) return;
    field = next;
    if (state.phase === "ready") Object.assign(state, freshState(field));
  }

  // ---- effects -----------------------------------------------------------

  function popup(x, y, text, color = "#ffe066") {
    state.popups.push({ x, y, text, color, age: 0 });
  }

  function blast(x, y, scale = 1, color = null) {
    state.blasts.push({ x, y, scale, color, age: 0 });
    const count = Math.round(EFFECTS.debris * Math.min(2, scale));
    for (let i = 0; i < count; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(60, 300) * Math.sqrt(scale);
      state.debris.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randomBetween(4, 8) * Math.sqrt(scale),
        life: randomBetween(0.6, 1),
        color: color ?? EFFECTS.debrisColors[i % EFFECTS.debrisColors.length],
      });
    }
    state.shake = Math.min(1, state.shake + 0.45 * scale);
  }

  function spark(x, y) {
    for (let i = 0; i < 3; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      state.debris.push({ x, y, vx: Math.cos(angle) * 140, vy: Math.sin(angle) * 140, size: 3, life: 0.35, color: "#ffffff" });
    }
  }

  function ageEffects(dt) {
    state.shake = Math.max(0, state.shake - dt * 5);
    state.flash = Math.max(0, state.flash - dt);
    state.muzzle = Math.max(0, state.muzzle - dt);

    state.delayedBlasts = state.delayedBlasts.filter((later) => {
      if (later.at > state.time) return true;
      blast(later.x, later.y, later.scale);
      return false;
    });
    state.debris.forEach((bit) => {
      const drag = Math.exp(-dt * 2.2);
      bit.vx *= drag;
      bit.vy *= drag;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      bit.life -= dt * 1.5;
    });
    state.debris = state.debris.filter((bit) => bit.life > 0);
    state.blasts.forEach((one) => {
      one.age += dt;
    });
    state.blasts = state.blasts.filter((one) => one.age < EFFECTS.blastSeconds);
    state.popups.forEach((one) => {
      one.age += dt;
    });
    state.popups = state.popups.filter((one) => one.age < EFFECTS.popupSeconds);
    if (state.banner) {
      state.banner.age += dt;
      if (state.banner.age > EFFECTS.bannerSeconds) state.banner = null;
    }
  }

  // ---- the ship ----------------------------------------------------------

  function moveShip(dt, controls) {
    const { ship } = state;
    const ease = Math.min(1, SHIP.response * dt);
    const speed = SHIP.speed * pace();
    ship.vx += (clamp(controls.x, -1, 1) * speed - ship.vx) * ease;
    ship.vy += (clamp(controls.y, -1, 1) * speed - ship.vy) * ease;
    const edge = SHIP.size / 2 + SHIP.margin;
    const from = ship.x;
    ship.x = clamp(ship.x + ship.vx * dt, edge, field.width - edge);
    ship.y = clamp(ship.y + ship.vy * dt, edge, field.height - edge);
    if (dt > 0) ship.lean += (clamp((ship.x - from) / dt / speed, -1, 1) - ship.lean) * ease;
  }

  function fire(dt, controls) {
    state.cooldown = Math.max(0, state.cooldown - dt);
    if (!controls.fire || state.cooldown > 0) return;
    const { ship } = state;
    const level = WEAPON.levels[state.weapon - 1];
    const y = ship.y - SHIP.size * 0.3;
    level.angles.forEach((angle) => {
      [-1, 1].forEach((side) => {
        state.bullets.push({
          x: ship.x + side * SHIP.guns,
          y,
          vx: Math.sin(angle * side) * WEAPON.bulletSpeed,
          vy: -Math.cos(angle) * WEAPON.bulletSpeed,
        });
      });
    });
    state.cooldown = level.cooldown;
    state.muzzle = 0.05;
  }

  function breakCombo() {
    state.chain = 0;
    state.comboTimer = 0;
    state.multiplier = 1;
  }

  function hitShip() {
    const { ship } = state;
    if (ship.dead || state.invulnerable > 0) return;

    if (state.shield) {
      state.shield = false;
      state.invulnerable = RULES.shieldGraceSeconds;
      blast(ship.x, ship.y, 0.8, "#6ad7ff");
      emit("shield");
      return;
    }

    state.lives -= 1;
    state.weapon = Math.max(1, state.weapon - 1);
    state.invulnerable = RULES.invulnerableSeconds;
    state.flash = EFFECTS.flashSeconds;
    breakCombo();
    blast(ship.x, ship.y, 1, EFFECTS.hitColor);
    emit("hit");

    if (state.lives > 0) return;
    ship.dead = true;
    state.dying = RULES.deathSeconds;
    blast(ship.x, ship.y, 2.2);
  }

  // ---- pickups -----------------------------------------------------------

  // What a drop would be of most use as, weighted; the ship is never offered
  // a shield or a life it can't take.
  function choosePickup() {
    const kinds = ["power", "power", "power"];
    if (!state.shield) kinds.push("shield", "shield");
    if (state.lives < RULES.lives) kinds.push("life");
    return pick(kinds);
  }

  function drop(x, y, kind = choosePickup()) {
    state.pickups.push({ kind, x: clamp(x, 30, field.width - 30), y, age: 0 });
  }

  function collect(item) {
    const { ship } = state;
    if (item.kind === "shield" && !state.shield) {
      state.shield = true;
      popup(ship.x, ship.y - 30, "SHIELD", "#6ad7ff");
    } else if (item.kind === "life" && state.lives < RULES.lives) {
      state.lives += 1;
      popup(ship.x, ship.y - 30, "1UP", "#ff8fa3");
    } else if (item.kind === "power" && state.weapon < WEAPON.levels.length) {
      state.weapon += 1;
      popup(ship.x, ship.y - 30, "POWER UP");
    } else {
      const bonus = PICKUPS.bonus * state.multiplier;
      state.score += bonus;
      popup(ship.x, ship.y - 30, `+${bonus}`);
    }
    emit("pickup");
  }

  function movePickups(dt) {
    state.pickups.forEach((item) => {
      item.age += dt;
      item.y += PICKUPS.speed * pace() * dt;
    });
    state.pickups = state.pickups.filter((item) => {
      if (!state.ship.dead && near(item, state.ship, PICKUPS.reach)) {
        collect(item);
        return false;
      }
      return item.y < field.height + PICKUPS.radius * 2;
    });
  }

  // ---- enemies -----------------------------------------------------------

  function spawn(kind, slot) {
    const spec = ENEMIES[kind];
    const x = kind === "boss" || slot.vx ? slot.x : clamp(slot.x, 34, field.width - 34);
    // The slow kinds start just off the top whatever their place in the
    // formation, or they would take an age to come into view.
    const y = spec.speed < ENEMIES.grunt.speed && kind !== "boss" ? Math.max(slot.y, -spec.size) : slot.y;
    state.enemies.push({
      kind,
      x,
      y,
      baseX: x,
      vx: slot.vx ?? 0,
      vy: spec.speed * speedUp(),
      sway: slot.sway ?? 0,
      phase: slot.phase ?? randomBetween(0, Math.PI * 2),
      age: 0,
      size: spec.size,
      hp: kind === "boss" ? spec.hp + state.bosses * spec.hpPerBoss : spec.hp,
      maxHp: kind === "boss" ? spec.hp + state.bosses * spec.hpPerBoss : spec.hp,
      flash: 0, // seconds left of the white flash from being hit
      state: "arrive",
      timer: 0,
      fireIn: randomBetween(...(spec.fireEvery ?? spec.attackEvery ?? [0, 0])),
      attack: 0,
    });
  }

  // One enemy shot from (x, y), `angle` radians off a straight line to the ship.
  function shoot(x, y, angle = 0, straightDown = false) {
    const aim = straightDown ? Math.PI / 2 : Math.atan2(state.ship.y - y, state.ship.x - x);
    const speed = shotSpeed();
    state.shots.push({ x, y, vx: Math.cos(aim + angle) * speed, vy: Math.sin(aim + angle) * speed });
  }

  function drift(foe, dt) {
    foe.vx *= Math.exp(-dt * ENTRY_DRAG); // a sideways entrance straightens out
    foe.baseX += foe.vx * dt;
    foe.y += foe.vy * dt;
    foe.x = foe.baseX + Math.sin(foe.age * 2.2 + foe.phase) * foe.sway;
  }

  function moveDiver(foe, dt) {
    const spec = ENEMIES.diver;
    if (foe.state === "arrive") {
      drift(foe, dt);
      foe.hoverY ??= randomBetween(...spec.hoverY) * field.height;
      if (foe.y < foe.hoverY) return;
      foe.state = "aim";
      foe.timer = spec.aimSeconds;
    } else if (foe.state === "aim") {
      foe.timer -= dt;
      if (foe.timer > 0) return;
      const angle = Math.atan2(state.ship.y - foe.y, state.ship.x - foe.x);
      foe.vx = Math.cos(angle) * spec.diveSpeed * pace();
      foe.vy = Math.sin(angle) * spec.diveSpeed * pace();
      foe.state = "dive";
    } else {
      foe.x += foe.vx * dt;
      foe.y += foe.vy * dt;
    }
  }

  function moveBoss(foe, dt) {
    const spec = ENEMIES.boss;
    if (foe.state === "arrive") {
      foe.y += foe.vy * dt;
      if (foe.y < spec.holdY * field.height) return;
      foe.state = "fight";
      foe.timer = 0;
    }
    foe.timer += dt;
    foe.x = field.width / 2 + Math.sin(foe.timer * 0.7) * spec.sweep * field.width;

    foe.fireIn -= dt;
    if (foe.fireIn > 0) return;
    // It attacks faster once it is badly hurt.
    foe.fireIn = (randomBetween(...spec.attackEvery) * (foe.hp < foe.maxHp * 0.4 ? 0.65 : 1)) / (1 + state.bosses * 0.15);
    const mouth = foe.y + foe.size * 0.3;
    const divers = state.enemies.filter((other) => other.kind === "diver").length;
    const attack = foe.attack % 3;
    foe.attack += 1;
    if (attack === 0) {
      [-0.3, -0.15, 0, 0.15, 0.3].forEach((angle) => shoot(foe.x, mouth, angle));
    } else if (attack === 1) {
      range(9).forEach((index) => shoot(foe.x, mouth, (index - 4) * 0.3, true));
    } else if (divers < 4) {
      [-1, 1].forEach((side) => spawn("diver", { x: foe.x + side * foe.size * 0.5, y: foe.y }));
    } else {
      [-0.12, 0.12].forEach((angle) => shoot(foe.x, mouth, angle));
    }
  }

  // Shooters and tanks fire while properly on screen and still above the ship.
  function openFire(foe, dt) {
    const spec = ENEMIES[foe.kind];
    if (!spec.fireEvery || foe.y < 20 || foe.y > field.height * 0.7) return;
    foe.fireIn -= dt;
    if (foe.fireIn > 0) return;
    foe.fireIn = randomBetween(...spec.fireEvery) / fireRate();
    const fan = spec.fan ?? 1;
    range(fan).forEach((index) => shoot(foe.x, foe.y + foe.size * 0.3, (index - (fan - 1) / 2) * 0.24));
  }

  function moveEnemies(dt) {
    state.enemies.forEach((foe) => {
      foe.age += dt;
      foe.flash = Math.max(0, foe.flash - dt);
      if (foe.kind === "boss") moveBoss(foe, dt);
      else if (foe.kind === "diver") moveDiver(foe, dt);
      else {
        drift(foe, dt);
        openFire(foe, dt);
      }
    });

    const gone = (foe) =>
      foe.y > field.height + foe.size || (foe.state === "dive" && (foe.x < -foe.size || foe.x > field.width + foe.size || foe.y < -foe.size * 3));
    state.enemies = state.enemies.filter((foe) => !gone(foe));
  }

  function kill(foe) {
    const spec = ENEMIES[foe.kind];
    const boss = foe.kind === "boss";
    state.chain += 1;
    state.comboTimer = RULES.comboSeconds;
    state.multiplier = Math.min(RULES.maxMultiplier, 1 + Math.floor(state.chain / RULES.killsPerMultiplier));
    const points = spec.score * state.multiplier * (boss ? state.bosses + 1 : 1);
    state.score += points;
    popup(foe.x, foe.y, `+${points}`);
    blast(foe.x, foe.y, foe.size / ENEMIES.grunt.size);

    if (boss) {
      state.bosses += 1;
      // It goes up in a string of explosions, takes its shots with it, and
      // leaves a weapon upgrade and a life behind.
      range(7).forEach((index) => {
        state.delayedBlasts.push({
          at: state.time + 0.12 * (index + 1),
          x: foe.x + randomBetween(-0.4, 0.4) * foe.size,
          y: foe.y + randomBetween(-0.35, 0.35) * foe.size,
          scale: randomBetween(1, 2),
        });
      });
      state.shots.forEach((shot) => spark(shot.x, shot.y));
      state.shots = [];
      drop(foe.x - 30, foe.y, "power");
      drop(foe.x + 30, foe.y, "life");
      emit("boss");
    } else if (randomBetween(0, 1) < (foe.kind === "tank" ? PICKUPS.tankChance : PICKUPS.chance)) {
      drop(foe.x, foe.y);
    }
    emit("kill");
  }

  function moveBullets(dt) {
    state.bullets.forEach((bullet) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
    });
    state.bullets = state.bullets.filter((bullet) => {
      const hit = state.enemies.find(
        (foe) => foe.y > -foe.size / 2 && near(bullet, foe, foe.size * (foe.kind === "boss" ? 0.38 : 0.42) + WEAPON.bulletRadius)
      );
      if (!hit) return bullet.y > -20 && bullet.x > -20 && bullet.x < field.width + 20;
      hit.hp -= 1;
      hit.flash = 0.08;
      if (hit.hp > 0) {
        spark(bullet.x, bullet.y);
      } else {
        state.enemies = state.enemies.filter((foe) => foe !== hit);
        kill(hit);
      }
      return false;
    });
  }

  function moveShots(dt) {
    state.shots.forEach((shot) => {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
    });
    state.shots = state.shots.filter(
      (shot) => shot.y < field.height + 20 && shot.y > -40 && shot.x > -20 && shot.x < field.width + 20
    );
  }

  function collide() {
    const { ship } = state;
    if (ship.dead || state.invulnerable > 0) return;

    const shot = state.shots.find((one) => near(one, ship, SHOT.radius + SHIP.hitRadius));
    if (shot) {
      state.shots = state.shots.filter((one) => one !== shot);
      hitShip();
      return;
    }

    const rammer = state.enemies.find((foe) => near(foe, ship, foe.size * 0.36 + SHIP.hitRadius));
    if (!rammer) return;
    // Anything but a boss is destroyed by the collision too.
    if (rammer.kind !== "boss") {
      state.enemies = state.enemies.filter((foe) => foe !== rammer);
      blast(rammer.x, rammer.y, rammer.size / ENEMIES.grunt.size);
    }
    hitShip();
  }

  // ---- waves -------------------------------------------------------------

  function sendWave() {
    if (state.wave % WAVES.bossEvery === 0) {
      spawn("boss", { x: field.width / 2, y: -ENEMIES.boss.size / 2 });
      return;
    }
    const count = Math.round(Math.min(WAVES.maxCount, WAVES.startCount + state.wave) * Math.sqrt(field.width / GAME.width));
    const kinds = waveKinds(state.wave, count);
    pick(FORMATIONS)(count, field).forEach((slot, index) => spawn(kinds[index], slot));
  }

  // When the screen is clear the next wave is announced, then sent.
  function directWaves(dt) {
    if (state.enemies.length > 0) return;
    if (state.nextWaveIn === null) {
      state.wave += 1;
      state.nextWaveIn = waveDelay;
      const boss = state.wave % WAVES.bossEvery === 0;
      state.banner = { text: boss ? "WARNING" : `WAVE ${state.wave}`, sub: boss ? "BOSS APPROACHING" : "", boss, age: 0 };
      return;
    }
    state.nextWaveIn -= dt;
    if (state.nextWaveIn > 0) return;
    state.nextWaveIn = null;
    sendWave();
  }

  function step(dt, controls) {
    if (state.phase === "playing") {
      state.time += dt;
      state.invulnerable = Math.max(0, state.invulnerable - dt);
      if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) breakCombo();
      }

      if (!state.ship.dead) {
        moveShip(dt, controls);
        fire(dt, controls);
        directWaves(dt);
      }
      moveEnemies(dt);
      moveBullets(dt);
      moveShots(dt);
      movePickups(dt);
      collide();

      if (state.ship.dead) {
        state.dying -= dt;
        if (state.dying <= 0) {
          state.phase = "over";
          emit("over");
        }
      }
    }
    ageEffects(dt);
  }

  return { state, start, setField, step };
}

import { SHIP, WEAPON } from "./constants";
import { clamp } from "./math";

const IDLE = { x: 0, y: 0, fire: false };

// How far ahead (seconds) it looks for things about to hit it, and how much
// room (px) it likes to keep around the ship.
const LOOK_AHEAD = 1.1;
const ROOM = 30;
const STEP = 22; // spacing of the places it considers moving to
const REACH = 9; // how many of those either side of where it is

/**
 * A computer player, for the console's self-playing preview. It flies the
 * ship the way a decent player would: lines up on the lowest enemy, goes for
 * pickups, and gets out of the way of anything about to hit it.
 *
 * `engage` is how far down the screen (as a share of its height) an enemy
 * has to come before the pilot goes for it: 0 shoots things as they appear,
 * more lets them come in first, so the fight happens in view.
 *
 * Returns a function from the world's `state` to its `controls`.
 */
export function createPilot({ engage = 0 } = {}) {
  // How dangerous it would be to be at (x, y): everything that will pass
  // through that spot soon counts, the sooner and the closer the worse.
  function danger(state, x, y) {
    let total = 0;
    const threat = (thing, vx, vy, radius) => {
      const room = radius + ROOM;
      if (Math.abs(thing.y - y) < room && Math.abs(thing.x - x) < room) total += 400; // on top of it already
      if (vy <= 0) return;
      const time = (y - thing.y) / vy;
      if (time < 0 || time > LOOK_AHEAD) return;
      const miss = Math.abs(thing.x + vx * time - x);
      if (miss < room) total += (room - miss) * (LOOK_AHEAD + 0.3 - time) * 6;
    };
    state.shots.forEach((shot) => threat(shot, shot.vx, shot.vy, 6));
    state.enemies.forEach((foe) => threat(foe, foe.state === "dive" ? foe.vx : 0, foe.vy, foe.size * 0.4));
    return total;
  }

  // Where it would like to be if nothing were in the way: under a pickup
  // that is nearly down, else lined up on the lowest enemy.
  function wish(state) {
    const { ship, field } = state;
    const pickup = state.pickups.find((item) => item.y > field.height * 0.3);
    if (pickup) return pickup.x;

    let target = null;
    state.enemies.forEach((foe) => {
      if (foe.y < Math.max(10, engage * field.height) || foe.y > ship.y - 40) return;
      if (!target || foe.y > target.y) target = foe;
    });
    if (!target) return field.width / 2 + Math.sin(state.time * 0.8) * field.width * 0.18;
    const lead = (ship.y - target.y) / WEAPON.bulletSpeed;
    const weave = Math.cos(target.age * 2.2 + target.phase) * target.sway * 2.2;
    return target.x + (target.state === "dive" ? target.vx : weave) * lead;
  }

  return function pilot(state) {
    const { ship, field } = state;
    if (state.phase !== "playing" || ship.dead) return IDLE;

    const home = field.height - SHIP.size / 2 - 26;
    const wanted = wish(state);
    let best = ship.x;
    let bestCost = Infinity;
    for (let slot = -REACH; slot <= REACH; slot += 1) {
      const x = clamp(ship.x + slot * STEP, SHIP.size / 2, field.width - SHIP.size / 2);
      const cost = danger(state, x, ship.y) + Math.abs(x - wanted) * 0.06 + Math.abs(slot) * 0.4;
      if (cost < bestCost) {
        bestCost = cost;
        best = x;
      }
    }

    // Holds the trigger whenever something is roughly ahead; the wider the
    // weapon's spread, the more "ahead" covers.
    const cone = 60 + (state.weapon - 1) * 110;
    const fire = state.enemies.some(
      (foe) => foe.y > engage * field.height && foe.y < ship.y && Math.abs(foe.x - ship.x) < foe.size / 2 + cone
    );

    return { x: clamp((best - ship.x) / 26, -1, 1), y: clamp((home - ship.y) / 26, -1, 1), fire };
  };
}

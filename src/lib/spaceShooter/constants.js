// Matches the console screen cutout's own aspect ratio (~1.553), so the game
// and the hero's preview screen both fill it with one uniform scale.
export const GAME = {
  width: 800,
  height: 515,
};

// On a small screen the game plays on a smaller field (the same shape),
// shown larger, so the ship stays big enough to see and steer. The field is
// this many game units wide for each CSS px of screen, from `minWidth` up to
// the full width above.
export const SMALL_SCREEN = { unitsPerPixel: 1.7, minWidth: 500 };

export const SPRITE_PATHS = {
  ship: "/images/GPC/space-shooter/spaceship.png",
  enemy: "/images/GPC/space-shooter/enemy2.png",
  bullet: "/images/GPC/space-shooter/bullet.png",
};

export const SHIP = {
  size: 58,
  speed: 430,
  response: 14, // how quickly it reaches the speed asked of it (1/s)
  margin: 6, // how close its edge may get to the screen's
  // Only this much of it can be hit: the sprite is mostly wings and air.
  hitRadius: 12,
  guns: 13, // each gun's distance from the centre line
  engines: 10,
};

// Each weapon level fires the twin guns straight ahead (angle 0) plus one
// more pair of shots per extra angle (radians either side of straight up).
export const WEAPON = {
  bulletSpeed: 780,
  bulletRadius: 6,
  levels: [
    { cooldown: 0.2, angles: [0] },
    { cooldown: 0.19, angles: [0, 0.17] },
    { cooldown: 0.17, angles: [0, 0.15, 0.32] },
  ],
};

// `speed` is how fast it comes down the screen, before the wave's own factor.
// `tint` ("r, g, b") colours the one enemy sprite so the kinds can be told apart.
export const ENEMIES = {
  grunt: { size: 50, hp: 1, score: 10, speed: 105, tint: null },
  // Comes down to hover, takes aim, then lunges at where the player is.
  diver: { size: 46, hp: 1, score: 20, speed: 150, tint: "255, 150, 50", hoverY: [0.14, 0.3], aimSeconds: 0.7, diveSpeed: 440 },
  // Fires single aimed shots.
  shooter: { size: 54, hp: 2, score: 30, speed: 62, tint: "70, 210, 255", fireEvery: [1.6, 2.7] },
  // Slow and tough; fires a fan of shots.
  tank: { size: 78, hp: 7, score: 60, speed: 44, tint: "190, 110, 255", fireEvery: [2.3, 3.1], fan: 3 },
  boss: {
    size: 168,
    hp: 70,
    hpPerBoss: 35, // each later boss is this much tougher
    score: 500,
    speed: 90,
    tint: "255, 60, 120",
    holdY: 0.23, // where it stops, as a share of the screen's height
    sweep: 0.3, // how far it swings either side of the centre, as a share of the width
    attackEvery: [1.5, 2.3],
  },
};

// Enemy fire.
export const SHOT = {
  radius: 6,
  speed: 190,
  speedPerWave: 8,
  maxSpeed: 350,
};

export const WAVES = {
  bossEvery: 5,
  delay: 1.5, // seconds between a wave ending and the next arriving
  startCount: 5,
  maxCount: 14,
  speedPerWave: 0.045, // everything gets this much faster each wave...
  maxSpeedUp: 0.9, // ...up to this much in all
  fireRatePerWave: 0.05, // and enemies fire this much more often...
  maxFireRateUp: 1.2, // ...up to this much in all
};

export const PICKUPS = {
  chance: 0.07, // of an ordinary enemy dropping one
  tankChance: 0.6,
  speed: 85,
  radius: 14,
  reach: 32, // how close the ship has to get to collect it
  bonus: 100, // points for one the ship has no use for
};

export const RULES = {
  lives: 3,
  invulnerableSeconds: 1.6,
  shieldGraceSeconds: 0.7,
  maxDelta: 0.05,
  // Kills in quick succession build a multiplier on every score.
  comboSeconds: 2.6,
  killsPerMultiplier: 3,
  maxMultiplier: 8,
  deathSeconds: 1.3, // between the ship blowing up and "game over"
};

export const EFFECTS = {
  debris: 14,
  debrisColors: ["#ffffff", "#ffe066", "#ff8a5c", "#ff4d6d", "#c9a7ff"],
  blastSeconds: 0.42,
  glowSeconds: 0.24,
  popupSeconds: 0.8,
  bannerSeconds: 1.5,
  flashSeconds: 0.25,
  hitColor: "#ff4d6d",
  shake: 7, // px, at its strongest
};

export const HIGH_SCORE_KEY =
  "tathva26:gpc:spaceShooterHighScore";

export const MOVE_KEYS = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
};

export const GAME_KEYS = [
  ...Object.values(MOVE_KEYS).flat(),
  "Space",
  "Enter",
];

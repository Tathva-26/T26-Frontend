// Matches the console screen cutout's own aspect ratio (~1.553), so the game
// and the hero's preview screen both fill it with one uniform scale.
export const GAME = {
  width: 800,
  height: 515,
};

export const SPRITE_PATHS = {
  ship: "/images/GPC/space-shooter/spaceship.png",
  enemy: "/images/GPC/space-shooter/enemy2.png",
  bullet: "/images/GPC/space-shooter/bullet.png",
};

export const SHIP = {
  size: 50,
  speed: 420,
  margin: 20,
  // The sprite's corners are transparent; only this much of it can be rammed.
  hitInset: 9,
};

export const ENEMY = {
  size: 50,
};

export const DIFFICULTY = {
  startEnemies: 2,
  maxEnemies: 9,
  secondsPerEnemy: 12,
  startSpeed: 70,
  maxSpeed: 340,
  speedPerSecond: 3.5,
};

export const BULLET = {
  width: 6,
  height: 12,
  speed: 900,
  cooldown: 0.22,
  max: 6,
};

export const RULES = {
  lives: 3,
  killScore: 10,
  invulnerableSeconds: 1.5,
  maxDelta: 0.05,
};

export const EFFECTS = {
  burstCount: 12,
  burstSize: 5,
  burstFade: 1.8,
  killColor: "#ff8a5c",
  hitColor: "#ff4d6d",
  flashSeconds: 0.25,
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

export const GAME = {
  width: 800,
  height: 510,
};

export const SHIP = {
  size: 50,
  speed: 420,
  margin: 20,
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

export const HIGH_SCORE_KEY =
  "tathva26:gpc:spaceShooterHighScore";

export const GAME_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "Enter",
];
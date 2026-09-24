// Logical game resolution. Matches the console screen's ~1.57:1 aspect ratio;
// the canvas is scaled to fit, so gameplay is identical at any viewport size.
export const GAME = { width: 800, height: 510 };

export const SHIP = { size: 50, speed: 420, margin: 20 };
export const ENEMY = { size: 50, count: 7, baseSpeed: 150, rampPerSecond: 2, maxBonus: 200 };
export const BULLET = { width: 6, height: 12, speed: 900, cooldown: 0.22, max: 6 };
export const RULES = { lives: 3, killScore: 10, invulnerableSeconds: 1.5, maxDelta: 0.05 };

export const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter"];

import { GAME, RULES, SMALL_SCREEN } from "./constants";
import { loadHighScore, saveHighScore } from "./highScore";
import { createInput } from "./input";
import { clamp } from "./math";
import { createRenderer } from "./render";
import { loadSprites } from "./sprites";
import { createWorld } from "./world";

// The play area for a screen `cssWidth` px wide: the full field where there
// is room, a smaller one (same shape) on a small screen, where the same
// sprites then show larger.
function fieldFor(cssWidth) {
  const width = clamp(Math.round(cssWidth * SMALL_SCREEN.unitsPerPixel), SMALL_SCREEN.minWidth, GAME.width);
  return { width, height: Math.round((width * GAME.height) / GAME.width) };
}

/**
 * The playable Space Shooter, bound to a canvas: the world (world.js) driven
 * by the keyboard and the touch controls, and drawn by the renderer.
 * `spritePaths` maps ship/enemy/bullet to image URLs. Returns
 * { resize, start, setPaused, setJoystick, setFiring, destroy }.
 * `onStats` fires only when the phase, score, high score, lives or wave
 * change, so React never re-renders per frame. `onHit` fires when the ship
 * loses a life. Text on the canvas uses the canvas element's CSS font-family.
 */
export function createSpaceShooter(canvas, { onStats, onHit, spritePaths } = {}) {
  const ctx = canvas.getContext("2d");
  const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const renderer = createRenderer(loadSprites(spritePaths));
  let highScore = loadHighScore();
  let newBest = false;
  let cssWidth = 0;
  let font = "";
  let frameId = 0;
  let lastTime = 0;
  let paused = false;
  let lastStats = "";

  const world = createWorld({
    onEvent(name) {
      if (name === "hit") onHit?.();
      if (name === "over") endRound();
    },
  });
  const { state } = world;

  const input = createInput((code) => {
    if ((code === "Space" || code === "Enter") && state.phase !== "playing") start();
  });

  function start() {
    if (state.phase === "playing") return;
    newBest = false;
    if (cssWidth) world.setField(fieldFor(cssWidth));
    world.start();
  }

  function endRound() {
    if (state.score <= highScore) return;
    highScore = state.score;
    newBest = true;
    saveHighScore(highScore);
  }

  function emitStats() {
    const stats = { phase: state.phase, score: state.score, highScore, lives: state.lives, wave: state.wave, newBest };
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
      world.step(dt, { x: input.getAxis("x"), y: input.getAxis("y"), fire: input.isDown("Space") });
    }

    font ||= getComputedStyle(canvas).fontFamily || "monospace";
    const { field } = state;
    ctx.setTransform(canvas.width / field.width, 0, 0, canvas.height / field.height, 0, 0);
    ctx.clearRect(0, 0, field.width, field.height);
    renderer.draw(ctx, state, { font, calm });
    emitStats();
  }

  function resize(width) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssWidth = width;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round((canvas.width * GAME.height) / GAME.width);
    // Before a round starts the field follows the screen; a round in
    // progress keeps its own (see world.setField).
    world.setField(fieldFor(width));
  }

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

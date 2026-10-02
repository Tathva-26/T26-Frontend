import { GAME, RULES } from "@/lib/spaceShooter/constants";
import { createPilot } from "@/lib/spaceShooter/pilot";
import { createRenderer } from "@/lib/spaceShooter/render";
import { createWorld } from "@/lib/spaceShooter/world";

const W = GAME.width;
const H = GAME.height;

// The console's screen is small, so the preview plays on a smaller field
// shown larger: the same game, with everything this many times bigger.
const ZOOM = 1.38;
const FIELD = { width: W / ZOOM, height: H / ZOOM };

const HUD = { x: 26, y: 34, labelSize: 20, scoreSize: 28, digits: 5, heart: 4, color: "#c9a7ff" };
const WARM_UP = 5; // seconds played up front, so the first frame shown is mid-fight
// It plays these waves over and over: late enough to show every kind of
// enemy and a boss, and stopping before the game gets too frantic to read.
const FIRST_WAVE = 3;
const LAST_WAVE = 8;
const ENGAGE = 0.15; // the pilot lets enemies come this far down the screen first
const WAVE_DELAY = 0.6; // shorter than the game's own, so the screen is seldom empty
const RESTART_AFTER = 1.5; // seconds after the pilot is shot down

// prettier-ignore
const HEART = [
  "0110110",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

/**
 * The game playing itself, for the console's screen - an arcade machine's
 * attract mode. It is the real game (the same world and renderer as the
 * playable one), flown by a computer pilot, with the score and lives drawn
 * on the canvas since there is no page HUD around it here.
 *
 * `sprites` is { ship, enemy, bullet } images; `getFont` returns the CSS
 * font-family for the text; `calm` leaves out the shake and flashes.
 * Returns `{ update(dt), draw(ctx, alpha) }`, both in the 800 x 515 box.
 */
export function createAttractDemo(sprites, getFont, { calm = false } = {}) {
  const world = createWorld({ field: FIELD, pace: 1, firstWave: FIRST_WAVE, waveDelay: WAVE_DELAY });
  const { state } = world;
  const pilot = createPilot({ engage: ENGAGE });
  const renderer = createRenderer(sprites);
  let overFor = 0;

  function update(dt) {
    world.step(dt, pilot(state));
    if (state.phase === "over") overFor += dt;
    if (overFor < RESTART_AFTER && state.wave <= LAST_WAVE) return;
    overFor = 0;
    world.start();
  }

  function drawHud(ctx, alpha, font) {
    ctx.globalAlpha = alpha;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `${HUD.labelSize}px ${font}`;
    ctx.fillStyle = HUD.color;
    ctx.fillText("SCORE", HUD.x, HUD.y);
    const labelWidth = ctx.measureText("SCORE ").width;
    ctx.font = `${HUD.scoreSize}px ${font}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(state.score).padStart(HUD.digits, "0"), HUD.x + labelWidth, HUD.y);

    // Lives, as pixel hearts in the opposite corner; lost ones are dimmed.
    const heartWidth = HEART[0].length * HUD.heart;
    for (let life = 0; life < RULES.lives; life += 1) {
      const slot = RULES.lives - 1 - life; // counted from the right
      const left = W - HUD.x - (slot + 1) * heartWidth - slot * HUD.heart * 2;
      const top = HUD.y - (HEART.length * HUD.heart) / 2;
      ctx.fillStyle = life < state.lives ? "#ff4d6d" : "rgba(255, 255, 255, 0.2)";
      HEART.forEach((row, y) => {
        [...row].forEach((pixel, x) => {
          if (pixel === "1") ctx.fillRect(left + x * HUD.heart, top + y * HUD.heart, HUD.heart, HUD.heart);
        });
      });
    }
    ctx.globalAlpha = 1;
  }

  // `alpha` fades the whole fight out (the scroll sequence clears the screen).
  function draw(ctx, alpha = 1) {
    if (alpha <= 0) return;
    const font = getFont();
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    renderer.draw(ctx, state, { font, alpha, calm });
    ctx.restore();
    drawHud(ctx, alpha, font);
  }

  world.start();
  for (let warmed = 0; warmed < WARM_UP; warmed += 1 / 30) update(1 / 30);

  return { update, draw };
}

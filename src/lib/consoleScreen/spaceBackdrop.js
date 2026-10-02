import { GAME } from "@/lib/spaceShooter/constants";
import { randomBetween } from "@/lib/spaceShooter/random";

const W = GAME.width;
const H = GAME.height;

// Three depths of stars: the nearer, the larger, brighter and faster.
// `streak` is how many seconds of its own travel a star is stretched by.
const STAR_LAYERS = [
  { count: 70, size: [1.6, 2.6], speed: [10, 22], alpha: [0.3, 0.65], streak: 0 },
  { count: 34, size: [2.6, 3.8], speed: [32, 60], alpha: [0.55, 0.95], streak: 0 },
  { count: 10, size: [3, 4], speed: [130, 210], alpha: [0.6, 0.9], streak: 0.035 },
];
const STAR_COLORS = ["#bcd6ff", "#bcd6ff", "#bcd6ff", "#ffffff", "#e3c8ff", "#ffd6f0"];

// Soft clouds of colour drifting down behind the stars ("r, g, b").
const CLOUD_COLORS = ["150, 70, 255", "255, 60, 170", "70, 110, 255", "130, 60, 230"];
const CLOUD = { sprite: 128, radius: [190, 320], speed: [5, 11], alpha: 0.5 };

// The sky, the clouds and the darkened corners change slowly, so they are
// painted into one small layer a few times a second and that layer is
// stretched over the screen each frame, which is far cheaper than blending
// them all across the full canvas every frame.
const SKY = { scale: 0.4, every: 0.12 };

const COMET = { every: [3.5, 9], speed: 620, life: 0.7, tail: 90 };

const pick = (list) => list[Math.floor(randomBetween(0, list.length))];

function createStars() {
  return STAR_LAYERS.flatMap((layer) =>
    Array.from({ length: layer.count }, () => ({
      x: randomBetween(0, W),
      y: randomBetween(0, H),
      size: randomBetween(...layer.size),
      speed: randomBetween(...layer.speed),
      alpha: randomBetween(...layer.alpha),
      phase: randomBetween(0, Math.PI * 2),
      color: pick(STAR_COLORS),
      streak: layer.streak,
    }))
  );
}

// One soft round blob per colour, drawn once and reused at any size.
function createCloudSprite(color) {
  const sprite = document.createElement("canvas");
  sprite.width = CLOUD.sprite;
  sprite.height = CLOUD.sprite;
  const ctx = sprite.getContext("2d");
  const half = CLOUD.sprite / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, `rgba(${color}, 0.9)`);
  gradient.addColorStop(0.45, `rgba(${color}, 0.35)`);
  gradient.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CLOUD.sprite, CLOUD.sprite);
  return sprite;
}

const createCloud = (sprites, y) => ({
  sprite: pick(sprites),
  x: randomBetween(0, W),
  y,
  radius: randomBetween(...CLOUD.radius),
  speed: randomBetween(...CLOUD.speed),
});

/**
 * The space behind the console's game: clouds of colour, three depths of
 * stars and the odd shooting star, all drifting downwards as if the ship were
 * flying up through them, with the corners darkened like an old tube's.
 * Everything is drawn in the game's own 800 x 515 box.
 *
 * Returns `{ draw(ctx, dt, rush) }`. `rush` (1 or more) is how many times
 * faster than usual the stars fall; above 1 they also stretch into streaks.
 */
export function createSpaceBackdrop() {
  const stars = createStars();
  const cloudSprites = CLOUD_COLORS.map(createCloudSprite);
  const clouds = [0.1, 0.4, 0.7, 1].map((share) => createCloud(cloudSprites, H * share));
  const sky = document.createElement("canvas");
  sky.width = Math.round(W * SKY.scale);
  sky.height = Math.round(H * SKY.scale);
  const skyContext = sky.getContext("2d");
  skyContext.scale(sky.width / W, sky.height / H);
  let skyAge = Infinity; // seconds since the layer was last painted
  let comet = null;
  let cometTimer = randomBetween(...COMET.every);
  let t = 0;

  function paintSky(dt) {
    const ctx = skyContext;
    const fill = ctx.createLinearGradient(0, 0, 0, H);
    fill.addColorStop(0, "#050414");
    fill.addColorStop(1, "#0a0b2e");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = CLOUD.alpha;
    clouds.forEach((cloud) => {
      cloud.y += cloud.speed * dt;
      if (cloud.y - cloud.radius > H) Object.assign(cloud, createCloud(cloudSprites, -cloud.radius));
      ctx.drawImage(cloud.sprite, cloud.x - cloud.radius, cloud.y - cloud.radius, cloud.radius * 2, cloud.radius * 2);
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const corners = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
    corners.addColorStop(0, "rgba(0, 0, 0, 0)");
    corners.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = corners;
    ctx.fillRect(0, 0, W, H);
  }

  function drawSky(ctx, dt) {
    skyAge += dt;
    if (skyAge >= SKY.every) {
      paintSky(Number.isFinite(skyAge) ? skyAge : 0);
      skyAge = 0;
    }
    ctx.drawImage(sky, 0, 0, W, H);
  }

  function drawStars(ctx, dt, rush) {
    stars.forEach((star) => {
      star.y += star.speed * rush * dt;
      if (star.y > H) {
        star.y = -star.size;
        star.x = randomBetween(0, W);
      }
      const twinkle = star.streak ? 1 : 0.6 + 0.4 * Math.sin(t * 2 + star.phase);
      const length = star.size + star.speed * rush * (star.streak + (rush - 1) * 0.012);
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = star.color;
      // A streaking star is a thin line; the others are square dots.
      ctx.fillRect(star.x, star.y - length, star.streak ? star.size * 0.55 : star.size, length);
    });
    ctx.globalAlpha = 1;
  }

  function drawComet(ctx, dt) {
    if (!comet) {
      cometTimer -= dt;
      if (cometTimer > 0) return;
      cometTimer = randomBetween(...COMET.every);
      const angle = randomBetween(2.2, 2.6); // down and to the left
      comet = { x: randomBetween(W * 0.35, W * 1.1), y: randomBetween(-20, H * 0.3), dx: Math.cos(angle), dy: Math.sin(angle), age: 0 };
    }
    comet.age += dt;
    comet.x += comet.dx * COMET.speed * dt;
    comet.y += comet.dy * COMET.speed * dt;
    const fade = 1 - comet.age / COMET.life;
    if (fade <= 0) {
      comet = null;
      return;
    }
    const tailX = comet.x - comet.dx * COMET.tail;
    const tailY = comet.y - comet.dy * COMET.tail;
    const gradient = ctx.createLinearGradient(comet.x, comet.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${fade})`);
    gradient.addColorStop(1, "rgba(190, 160, 255, 0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(comet.x, comet.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
  }

  return {
    draw(ctx, dt, rush = 1) {
      t += dt;
      drawSky(ctx, dt);
      drawStars(ctx, dt, rush);
      drawComet(ctx, dt);
    },
  };
}

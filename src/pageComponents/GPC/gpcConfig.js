export const STAGE = { width: 1413, height: 698 };

export const ASSETS = {
  banner: "/images/GPC/hero/banner.png",
  dragon: "/images/GPC/hero/dragon.png",
  console: "/images/GPC/hero/console.png",
  exit: "/images/GPC/game/exit.png",
  spaceShooterBackground: "/images/GPC/space-shooter/background.png",
};

export const CLIP = {
  start: "inset(59px 0px 0px 0px)",
  end: "inset(0px 0px 157px 0px)",
};

export const SPRITE_PATHS = {
  ship: "/images/GPC/space-shooter/spaceship.png",
  enemy: "/images/GPC/space-shooter/enemy2.png",
  bullet: "/images/GPC/space-shooter/bullet.png",
};

export const HERO_SCROLL = { end: "+=150%", scrub: 1 };

// The dragon: one asset, resized and repositioned between frame 1 and
// frame 2 - it shrinks and drifts back as you scroll, no fade. Measured
// from Figma: frame 1 (node 69:1088) has it at 754,0 640x385; frame 2
// (node 165:1712) has the same asset at 877,24 510x322.
export const DRAGON_FRAME_1 = { x: 754, y: 0, width: 640, height: 385 };
export const DRAGON_FRAME_2 = { x: 877, y: 24, width: 510, height: 322 };

// The console's animated screen (spaceShooterScreen.js) and its blurred
// "spill" copy that bleeds light onto the plastic. Measured against
// console.png: the black screen cutout spans x 74..874, y 91..606 of a
// 966x843 image. Shared by the hero's small preview AND the full-screen
// game view - it's the SAME console.png in both places, never a separate
// bezel asset, so the same percentages apply either way. spillBlur is in
// design-unit space - scale it up if the console screen is being shown much
// bigger and the bleed looks too faint.
export const CONSOLE_SCREEN_INSET = {
  left: 7.66,
  top: 10.795,
  width: 82.816,
  height: 61.091,
  radius: "1.75% / 2.72%",
  spillBlur: 8,
};

// The full-screen game view sizes itself to console.png's own aspect ratio
// (966x843) rather than a separate bezel box, since it's the same image.
export const GAME_BOX = { width: 966, height: 843 };

// Exit button position, as % of console.png's own width/height - top-right
// corner of the plastic, clear of the antenna knob and the screen. This is
// an estimate off the image, not a Figma measurement - nudge it here if it's
// not quite in the right spot.
export const EXIT_BUTTON = { right: 3, top: 2.5, size: 6 };

export const TIMING = { open: 1.1, close: 0.9, reveal: 0.18, ease: "power3.inOut" };

// Hotspots on the clickable console, measured against the real console.png
// (966x843px). Its aspect ratio matches the rendered box exactly (966:843 =
// 322:281), so these percentages line up with no extra math. CONSOLE_BUTTON
// is the round red press-button between the D-pad and the two small side
// buttons (not the tiny power LED in the corner). left/top = its top-left
// corner, size = its diameter.
export const CONSOLE_BUTTON = { left: 47.5, top: 82.6, size: 5 };

// CLICK_TO_PLAY: vertical position (top, % of console height) and font size
// (px, in the Stage's design-unit space) for the "[CLICK TO PLAY]" label.
export const CLICK_TO_PLAY = { top: 25, fontSize: 10 };
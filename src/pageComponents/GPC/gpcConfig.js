export const STAGE = { width: 1413, height: 698 };

export const ASSETS = {
  banner: "/images/GPC/hero/banner.png",
  dragon: "/images/GPC/hero/dragon.png",
  console: "/images/GPC/hero/console.png",
  bezel: "/images/GPC/game/bezel.png",
  exit: "/images/GPC/game/exit.png",
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

export const CONSOLE_FRAME = { x: 281, y: 64, width: 891, height: 608 };
export const SCREEN_INSET = { left: 6.1, top: 9.9, width: 86.8, height: 81.1 };
export const EXIT_BUTTON = { x: 1087, y: 64, size: 100 };

export const TIMING = { open: 1.1, close: 0.9, fadeShare: 0.4, ease: "power3.inOut" };

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

// The console's animated screen (console-screen.js) and its blurred "spill"
// copy that bleeds light onto the bezel plastic. Measured against the same
// console.png: the black screen cutout spans x 74..874, y 91..606 of a
// 966x843 image. spillBlur is in the Stage's design-unit space - the source
// demo used 18px on a ~760px-wide box, so this is scaled down to match our
// 322-unit-wide console (18 * 322/760 ~= 8).
export const HERO_SCREEN_INSET = {
  left: 7.66,
  top: 10.795,
  width: 82.816,
  height: 61.091,
  radius: "1.75% / 2.72%",
  spillBlur: 8,
};
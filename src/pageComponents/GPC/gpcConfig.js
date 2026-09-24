// Design constants measured from the Figma file (frames 69:1088, 165:1712, 537:1502).
// All positions are in "stage units" (the 1413px-wide Figma artboard).

export const STAGE = { width: 1413, height: 698 };

export const ASSETS = {
  banner: "/images/GPC/hero/banner.png",
  dragon: "/images/GPC/hero/dragon.png",
  console: "/images/GPC/hero/console.png",
  bezel: "/images/GPC/game/bezel.png",
  backdrop: "/images/GPC/game/backdrop.png",
  exit: "/images/GPC/game/exit.png",
};

// Banner clip: frame 1 shows 150-621, frame 2 shows 91-464 of a 91-621 wrapper.
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

// Console bezel in the game frame, and the screen inside it (% of bezel).
export const CONSOLE_FRAME = { x: 281, y: 64, width: 891, height: 608 };
export const SCREEN_INSET = { left: 6.1, top: 9.9, width: 86.8, height: 81.1 };
export const EXIT_BUTTON = { x: 1087, y: 64, size: 100 };

export const TIMING = { open: 1.1, close: 0.9, ease: "power3.inOut" };

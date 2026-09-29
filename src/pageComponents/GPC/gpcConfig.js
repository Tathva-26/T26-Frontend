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

export const DRAGON_FRAME_1 = { x: 754, y: 0, width: 640, height: 385 };
export const DRAGON_FRAME_2 = { x: 877, y: 24, width: 510, height: 322 };

export const CONSOLE_SCREEN_INSET = {
  left: 7.66,
  top: 10.795,
  width: 82.816,
  height: 61.091,
  radius: "1.75% / 2.72%",
  spillBlur: 8,
};

export const GAME_BOX = { width: 966, height: 843 };

export const EXIT_BUTTON = { right: 3, top: 2.5, size: 6 };

export const TIMING = { open: 1.1, close: 0.9, reveal: 0.18, ease: "power3.inOut" };

export const CONSOLE_BUTTON = { left: 47.5, top: 82.6, size: 5 };

// CLICK_TO_PLAY: vertical position (top, % of console height) and font size
// (px, in the Stage's design-unit space) for the "[CLICK TO PLAY]" label.
export const CLICK_TO_PLAY = { top: 25, fontSize: 10 };
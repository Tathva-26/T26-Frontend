export const STAGE = { width: 1413, height: 698 };

// A section wider than this (width / height) gets the fit-scaled desktop
// Stage; anything taller (portrait phones and tablets) gets the stacked layout.
export const STACKED_MAX_ASPECT = 1.2;

export const ASSETS = {
  banner: "/images/GPC/hero/banner.png",
  dragon: "/images/GPC/hero/dragon.png",
  console: "/images/GPC/hero/console.png",
  exit: "/images/GPC/game/exit.png",
};

// Desktop banner band, in Stage design units. It spans the full section
// width; only the part above `cropBottom` is shown.
export const BANNER = { top: 91, height: 530, cropBottom: 157 };

export const CONSOLE_SCREEN_INSET = {
  left: 7.66,
  top: 10.795,
  width: 82.816,
  height: 61.091,
  radius: "1.75% / 2.72%",
  spillBlur: 8,
};

export const GAME_BOX = { width: 966, height: 843 };

// Exit button on the game console: position and size as % of the console.
// `minHit` / `minIcon` (px) keep it tappable when the console is small.
export const EXIT_BUTTON = { right: 3, top: 2.5, size: 6, minHit: 44, minIcon: 30 };

export const TIMING = { open: 1.1, close: 0.9, reveal: 0.18, ease: "power3.inOut" };

export const CONSOLE_BUTTON = { left: 47.5, top: 82.6, size: 5 };

// Play label on the hero console: vertical position (% of console height)
// and font size (% of console width, so it scales with the console).
export const CLICK_TO_PLAY = { top: 25, fontSize: 3.1 };

// Dragon animation: list every frame here, in order. One entry = static image.
// e.g. ["/images/GPC/hero/dragon/1.png", "/images/GPC/hero/dragon/2.png", ...]
export const DRAGON_FRAMES = [ASSETS.dragon];
export const DRAGON_FPS = 12;

// Desktop dragon placement (Stage design units), sitting above the console.
export const DRAGON_STATIC = { x: 460, y: 8, width: 480, height: 290 };

// The dragon image's own size; its box keeps these proportions.
export const DRAGON_SIZE = { width: 637, height: 361 };

// Home page scroll sequence. The hero sticks for a few screens of scroll
// (the distance itself is --gpc-travel in gpc.css), starting on top of the
// section above and ending on top of the first screen of Wheels. Each beat
// below is [start, end] as a percentage of that pinned scroll.
export const SEQUENCE = {
  // The entry, where the section above is stuck in place while it plays
  // (wide screens: see --gpc-lead in gpc.css, which is where `off` ends).
  entry: {
    // The camera pulls back out of the console's screen: what looked like
    // the page above turns out to be showing on it.
    pullback: [0, 13],
    // That picture switches off like an old TV: it closes to a bright line,
    // and the line shrinks to nothing.
    off: [13, 18],
  },
  // The entry where the section above is a list that keeps scrolling
  // (phones). It can't be held still on the console, so there the page
  // itself switches off first, full-screen, and the camera then pulls back
  // from the dark screen.
  entryScrolling: {
    off: [0, 5],
    pullback: [4, 18],
  },
  power: [19, 33], // the switch-off in reverse: the screen switches on to the game
  title: [32, 45], // "GPC" flickers on, letter by letter
  tagline: [42, 51],
  // 51-58: nothing moves (but for the "click to play" prompt fading out at
  // the end). This is the hero at rest, where the game is played.
  outro: [58, 69], // the console announces Wheels and "loads" it
  film: [68, 71], // the Wheels footage comes up on the screen
  // From here the camera pushes into the screen until the footage sits
  // exactly where Wheels shows it. It ends where the handoff begins, which
  // the sequence works out from where Wheels actually is (see --gpc-handoff).
  diveStart: 71,
};

// How far the pull-back starts beyond "the screen just fills the view".
export const PULLBACK_OVERSHOOT = 1.06;

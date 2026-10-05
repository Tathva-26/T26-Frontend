// Shared numbers for the Wheels → Robowars handoff on the home page.
// Plain module (no "use client") so the server page can read them too.

export const START_FRAME = 105;
export const END_FRAME = 240;
export const FRAME_COUNT = END_FRAME - START_FRAME + 1;
// Frame at which the fullscreen TV starts shrinking towards its docked spot.
export const SHRINK_START_FRAME = 80;

// Scroll distance (in viewport heights) spent scrubbing through the car frames,
// followed by extra distance spent fading the docked TV screen to black.
const SCRUB_SCROLL_VH = 700;
export const FADE_SCROLL_VH = 70;

// The footage stops on HOLD_FRAME for HOLD_SCROLL_VH of scrolling while the car's
// details are on screen (the car idles in a seamless loop meanwhile, see
// WheelsExperience). The hold fades in / out over HOLD_RAMP_VH at either end.
export const HOLD_FRAME = 24;
export const HOLD_SCROLL_VH = 120;
export const HOLD_RAMP_VH = 20;

export const FRAME_SCROLL_VH = SCRUB_SCROLL_VH + HOLD_SCROLL_VH;
export const TOTAL_SCROLL_VH = FRAME_SCROLL_VH + FADE_SCROLL_VH;

export const HOLD_START_VH = (HOLD_FRAME / (FRAME_COUNT - 1)) * SCRUB_SCROLL_VH;

// Which frame the footage is on `vh` viewport-heights into Wheels' scroll range
// (counted from where its top edge enters the bottom of the screen).
export function frameAtScrollVh(vh) {
  const scrubbed = vh <= HOLD_START_VH ? vh : Math.max(HOLD_START_VH, vh - HOLD_SCROLL_VH);
  return Math.min(1, Math.max(0, scrubbed / SCRUB_SCROLL_VH)) * (FRAME_COUNT - 1);
}

// 0..1: how much of the idle loop applies at `vh` (1 in the middle of the hold).
export function holdWeightAtScrollVh(vh) {
  const into = Math.min(vh - HOLD_START_VH, HOLD_START_VH + HOLD_SCROLL_VH - vh);
  return Math.min(1, Math.max(0, into / HOLD_RAMP_VH));
}

// Wheels is pinned for all but its last viewport-height, and the frames scrub
// across FRAME_SCROLL_VH / TOTAL_SCROLL_VH of that pinned distance. (The hold is
// added on top of the original, un-held figure so the Robowars underlay lead,
// which is measured from the end of Wheels, stays where it was.)
const PINNED_SCROLL_VH = SCRUB_SCROLL_VH + FADE_SCROLL_VH - 100;
const SHRINK_START_VH =
  (SHRINK_START_FRAME / (FRAME_COUNT - 1)) * (SCRUB_SCROLL_VH / (SCRUB_SCROLL_VH + FADE_SCROLL_VH)) * PINNED_SCROLL_VH +
  HOLD_SCROLL_VH;

// How far (vh) Robowars is pulled up underneath Wheels. It must already be
// pinned in place when the TV starts shrinking, because that's when Wheels'
// black backdrop starts fading out to reveal it.
export const UNDERLAY_VH = Math.ceil(TOTAL_SCROLL_VH - SHRINK_START_VH + 40);
// Scroll distance Robowars sits pinned behind Wheels before Wheels unpins and
// Robowars' own scroll animation takes over.
export const UNDERLAY_LEAD_IN_VH = UNDERLAY_VH - 100;

export const ROBOWARS_FRAME_WIDTH = 1413;
export const ROBOWARS_FRAME_HEIGHT = 697;

// Screen of the dark TV prop in the Robowars desktop frame, in frame units.
// The Wheels TV docks its screen exactly onto this rect before handing off.
const TV_SCREEN_WIDTH = 241.5;
const TV_SCREEN_HEIGHT = (TV_SCREEN_WIDTH * 9) / 16;
export const ROBOWARS_TV_SCREEN = {
  x: 585.2,
  y: 125 - TV_SCREEN_HEIGHT / 2,
  width: TV_SCREEN_WIDTH,
  height: TV_SCREEN_HEIGHT,
};

// tv.webp (1672x941, screen hole at 205..1466 x 282..816) stretched around a 16:9 screen.
export const TV_ART_STYLE = {
  left: "-16.244%",
  top: "-52.710%",
  width: "132.488%",
  height: "175.888%",
  maxWidth: "none",
};

const ROBOWARS_FRAME_ASPECT = ROBOWARS_FRAME_WIDTH / ROBOWARS_FRAME_HEIGHT;

// Where the Robowars TV prop's screen sits on screen, in px, while Robowars is
// pinned. Mirrors DesktopFrame's own "cover" sizing (RobowarsHero.jsx): the
// frame is 100vw/112vw (xl/md) UNLESS the viewport is taller/narrower than
// the arena art's aspect ratio, in which case it grows past that so arena-bg
// still fully covers the viewport height instead of letterboxing. Getting
// this out of sync with DesktopFrame is what makes the Wheels TV dock at the
// wrong spot/size — visibly a second screen instead of landing exactly on
// this prop. Returns null below md, where there's no TV prop.
export function getRobowarsTvScreenRect(stageWidth, stageHeight) {
  if (!window.matchMedia("(min-width: 768px)").matches) return null;

  const isXl = window.matchMedia("(min-width: 1280px)").matches;
  const baseScale = isXl ? 1 : 1.12;
  const frameWidth = baseScale * Math.max(stageWidth, stageHeight * ROBOWARS_FRAME_ASPECT);
  const unit = frameWidth / ROBOWARS_FRAME_WIDTH;
  const frameLeft = (stageWidth - frameWidth) / 2;
  const frameTop = (Math.max(stageHeight, 560) - ROBOWARS_FRAME_HEIGHT * unit) / 2;

  return {
    x: frameLeft + ROBOWARS_TV_SCREEN.x * unit,
    y: frameTop + ROBOWARS_TV_SCREEN.y * unit,
    width: ROBOWARS_TV_SCREEN.width * unit,
    height: ROBOWARS_TV_SCREEN.height * unit,
  };
}

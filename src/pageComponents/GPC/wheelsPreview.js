import {
  FRAME_COUNT,
  FRAME_SCROLL_VH,
  START_FRAME,
  TOTAL_SCROLL_VH,
} from "@/pageComponents/wheels/robowarsHandoff";

// Wheels (the section after GPC) scrubs through its car footage as it scrolls.
// The end of GPC's scroll sequence plays the same frames on the console's
// screen and zooms into them, so this mirrors how Wheels picks its frame:
// the numbers come from Wheels' own shared constants, the frame files are the
// ones it loads itself (so the browser fetches them once), and its position
// is read from its element. If Wheels changes how it works, this is the one
// file in GPC to update.
const WHEELS_VIEWPORT = ".wheels-viewport";
const framePath = (index) => `/wheels/frames/ezgif-frame-${String(START_FRAME + index).padStart(3, "0")}.webp`;

// On narrow screens Wheels slides its picture left by this many px per frame.
const NARROW_SCREEN = 768;
const PAN_PER_FRAME = 2;

// GPC only ever shows the opening of the footage.
const PREVIEW_FRAMES = 30;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * The opening frames of the Wheels footage, in step with Wheels itself.
 * `section` is Wheels' own tall element, or null if it isn't on the page.
 */
export function createWheelsPreview() {
  const section = document.querySelector(WHEELS_VIEWPORT)?.parentElement ?? null;
  const images = section
    ? Array.from({ length: Math.min(PREVIEW_FRAMES, FRAME_COUNT) }, (_, index) =>
        Object.assign(new Image(), { decoding: "async", src: framePath(index) })
      )
    : [];

  // Which frame Wheels is on: it starts scrubbing when its top edge enters
  // the bottom of the screen and runs through its frames over a set share of
  // its own height.
  function frame() {
    if (!section) return 0;
    const box = section.getBoundingClientRect();
    const progress = (window.innerHeight - box.top) / box.height;
    return clamp01(progress / (FRAME_SCROLL_VH / TOTAL_SCROLL_VH)) * (FRAME_COUNT - 1);
  }

  // The frame Wheels reaches at the moment it fills the screen and sticks.
  function pinnedFrame() {
    if (!section) return 0;
    const progress = window.innerHeight / section.getBoundingClientRect().height;
    return clamp01(progress / (FRAME_SCROLL_VH / TOTAL_SCROLL_VH)) * (FRAME_COUNT - 1);
  }

  return {
    section,

    /** The loaded image for the current frame, or the nearest earlier one. */
    image() {
      for (let index = Math.min(images.length - 1, Math.round(frame())); index >= 0; index -= 1) {
        if (images[index].complete && images[index].naturalWidth) return images[index];
      }
      return null;
    },

    /**
     * Where Wheels' 16:9 picture sits at that moment, in a screen of the
     * given size: sized to cover it, centred, and on narrow screens nudged
     * left by however many frames have gone by.
     */
    pinnedPicture(width, height) {
      const pan = window.innerWidth <= NARROW_SCREEN ? pinnedFrame() * PAN_PER_FRAME : 0;
      return { centerX: width / 2 - pan, centerY: height / 2, height: Math.max(height, (width * 9) / 16) };
    },
  };
}

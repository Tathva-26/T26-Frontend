


/**
 * Shared light state.
 *  - <GlowLetters /> (glow.jsx) writes to it every frame.
 *  - Anything else on the page can read it (e.g. to follow the light's position).
 *
 * <DotsBackground /> does NOT read it: the dots track the pointer on their own and
 * always stay white, whether or not the pointer is over the letters.
 */
export const light = {
  mounted: 0,   // how many <GlowLetters /> are on the page
  x: 0,         // light centre, viewport (clientX/clientY) coordinates
  y: 0,
  hover: 0,     // 0..1, current growth progress (0 = closed, 1 = full size)
  R: 0,         // current active radius in px (shrinks to 0 on exit)
  angle: 0,     // current direction of the colour gradient (radians)
};
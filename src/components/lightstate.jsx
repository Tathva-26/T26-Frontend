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
  hover: 0,     // 0..1, fades in on hover / out on leave
  R: 170,       // current radius of the light (px)
  angle: 0,     // current direction of the colour gradient (radians)
};
# Tathva Expo handoff

## Optimization update — 2026-10-04

Current branch: `fix/expo_optimization-adithyaa`. This update supersedes the
older renderer-latch and timing descriptions below: current entry hold ends
at phase 1.2 on desktop and 1.4 on mobile; departure lasts .45 phase units.

- Homepage crystal loading starts within 1200 px of the viewport. Standalone
  `/expo` still requests it immediately. Readiness includes a GPU warm-up frame.
- A late model becomes visible as soon as its shell renders. There is no
  phase admission gate. Reduced motion retains the 3D scene with idle motion
  suppressed. The image is only a loading/error placeholder.
- Edge lighting owns its own world-position varying, independent of Three's
  transmission define, including instanced reflection-only compact shards.
- Context loss keeps the canvas mounted; restoration rebuilds the scene.
  Shader failures are reported rather than silently marked ready; Retry 3D
  is available for a real loading/renderer failure.
- Desktop poster masks reuse 33 deterministic thresholds. Compact viewport
  transitions omit poster blur/masks and hide DOM mist when the model is live.
- Cloud shaders use two noise octaves on compact hardware and four otherwise;
  their mesh is hidden outside the transition interval.
- Frame-time sampling reduces DPR/transmission resolution after two slow
  three-second windows; four fast windows restore quality. Long resume gaps
  are excluded. Compact shards use reflections without transmission.
- Model DOM references are cached; connector projection is limited to 20/30 Hz.
  Inactive shard instances are skipped and bounds refresh matches picking cadence.

Additional check: `node scripts/check-expo-render-budget.mjs`.
Physical-device FPS and production build performance remain unmeasured.

Repo: T26-Frontend
Branch: dev/expo-adithyaa
Stack: Next.js 16.3.4, React 19, Three.js/R3F, GSAP ScrollTrigger, Lenis.

Read AGENTS.md and the relevant node_modules/next/dist/docs/ guide before editing. Keep changes scoped to Expo. Final detail-view text has not been supplied.

## References
- Figma Expo frame: https://www.figma.com/design/L9cB9cvVtlQKAg3pP9jEyp/w1?node-id=1490-2669
- Igloo: https://www.igloo.inc/
- User's recording: 20261001-1307-28.5020430.mp4. It shows a crystal surging toward the viewer, optical distortion, a dark detail view, then a reversible Close transition. Transfer this file separately if visual comparison is needed.
- Local `igloo` project is a reconstruction; it does not contain the recorded detail view.

## Current flow
The homepage renders `TechConclaveExpoTransition` inside `HeroFrameController`. `/expo` renders standalone `Expo`. Homepage scrolling happens inside `.main-scroll` via `SmoothScroll.jsx` and `window.__lenis`.

One shared crystal canvas stays mounted across Tech Conclave and Expo. Its GSAP phase is:
- 0–1: emerge from Conclave clouds, tumble downward one full turn, settle.
- 1–1.45: readable, interactive Expo hold.
- 1.45–2.15: retract copy/connectors, tumble upward into clouds, reveal gallery.

The gallery follows the bridge and must begin at Placeholder 01. A previous bug skipped to Placeholder 08. Do not advance the desktop gallery track while clouds obscure it.

## Main files
- `src/pageComponents/Expo/TechConclaveExpoTransition.jsx`: shared canvas, scroll pin, section handoff, renderer latch.
- `expoJourney.mjs`: deterministic entry/exit poses and screen path.
- `Expo.jsx` / `Expo.module.css`: Figma layout, copy, Explore button, fallback activation.
- `Crystal3D.jsx`: asset readiness, static fallback, reduced motion, context-loss handling.
- `CrystalScene.jsx`: canvas, mouse/touch/keyboard input, device budgets.
- `CrystalModel.jsx`: shell, robot, hover lighting, idle movement, detail depth motion.
- `CrystalShards.jsx`, `ConclaveVeil.jsx`, `expoLeaders.mjs`: shards, mist, connectors.
- `ExpoDetails.jsx` / `ExpoDetails.module.css`: detail controller, native dialog, Close, scroll lock.
- `expoDetailMotion.mjs`: reversible opening/closing curves.
- `CrystalOptics.jsx`: temporary radial refraction and colour separation.
- `expoDetailContent.mjs`: clearly marked placeholder. Replace this module when final text arrives.
- `src/pageComponents/HorizontalGallery/HorizontalGallery.jsx`: coordinated gallery start.
- `ASSETS.md`: asset provenance; some older interaction descriptions are superseded by current code.

## Crystal interaction
The live shell is licensed Igloo Draco geometry with KTX2 maps and EXR lighting under `public/images/expo/crystal/`. The robot-head SVG is a local reconstruction. `/images/expo/crystal-figma.png` is the static fallback.

Raycasting the actual shell drives a contained cyan light, nearby fracture highlights, gentle spring tilt, and small hover enlargement. The robot moves independently; the core breathes. No external ring or expanding click halo. Drag tilts; vertical touch swipes scroll. Primary click/tap opens details only if release hits the shell and movement stays under 8 px. Enter/Space also opens it.

## Detail view
`ExpoDetailsProvider` owns `closed → opening → open → closing → closed`. Crystal and Explore share it. On the homepage, opening is permitted only during the settled phase `[1,1.45)`.

The reversible 1.1-second curve pulses the core, fades Expo copy/shards, moves the crystal forward in depth, briefly applies optical distortion, darkens the atmosphere, and reveals detail text. Closing reverses from the current progress, including mid-opening. The Close button stays fixed at top-right; Escape also closes. Reduced motion uses a 0.15-second fade.

The native dialog keeps text and Close sharp above the effect. Its content scrolls independently. Opening stops Lenis and locks `.main-scroll`; closing restores the saved scroll phase, prior lock state, crystal interaction, and focus. Resize recalculates the restored pin position. The optical pass runs only during the surge; idle and settled details use the normal render path.

## Safeguards and checks
The model/fallback choice is latched before visible emergence so late asset loading cannot pop the model into a tumble. WebGL failure and reduced motion retain a static crystal and usable detail dialog. Phone DPR is capped at 1, tablet at 1.25, desktop at 1.5; the optical target is smaller on compact devices.

Run:
- `npx eslint src/pageComponents/Expo scripts/check-expo-details.mjs`
- `node scripts/check-expo-details.mjs`
- `node scripts/check-expo-motion.mjs`
- `node scripts/check-crystal-interaction.mjs`

These passed in the previous session. Browser checks covered desktop, tablet, phone, short landscape, touch tap versus swipe,   drag cancellation, keyboard, Close/Escape, focus, long content, reduced motion, simulated WebGL failure, and gallery Placeholder 01. Physical mobile FPS remains unmeasured.

The latest production build was not verified: existing Google Fonts requests failed without network; a retry encountered Windows EPERM on a generated `.next/build` file while the dev server used `.next`. Avoid deleting user-owned build files or stopping their server without reason.

# Expo crystal assets and visual implementation

The user confirmed that they hold a license and explicitly authorized copying igloo assets
in this conversation on 2026-09-25. No license grant was inferred from the repository README.
The repository does not contain the user's license document; retain their license terms with
any distribution. The igloo working tree itself is unchanged.

## Licensed igloo assets

These files are copied byte-for-byte, with T26-local filenames:

| Local path under public/images/expo | Original path under igloo/assets | Bytes |
| --- | --- | ---: |
| crystal/shell.drc | geometries/cubes/cube3.drc | 40,339 |
| crystal/shell-normal.ktx2 | images/cubes/cube3_normal.ktx2 | 1,134,430 |
| crystal/shell-roughness.ktx2 | images/cubes/cube3_roughness.ktx2 | 240,240 |
| crystal/studio.exr | images/cubes_env.exr | 259,130 |

All three reference shells were rendered for comparison. The tall, chipped `cube3.drc`
(Pudgy Penguins' shell in igloo's portfolio scene) matches the supplied crystal silhouette.
Its imported normals and UVs are preserved; a cloned geometry is centred and uniformly scaled.
The source mesh has 8,038 triangles. The glass shell and dark interior render the same geometry
at different scales, approximately 16,080 triangles including the head and glow planes.

Igloo uses a custom physical material, three-sample chromatic refraction, front/back rendering,
normal/roughness maps, EXR-to-PMREM reflections, interactive frost, and six-level bloom.
Its base settings include roughness 0.65, IOR 1.18, reflectivity 0.3, environment intensity 0.91,
and a custom transmission uniform of 1 (the built-in material transmission is 0).

T26 retains the original shell/maps/environment, PMREM technique, IOR, and reflectivity.
It uses Three's single physical transmission pass with a small original shader adjustment:
transparent refraction-buffer samples become navy instead of white, face reflections are
restrained, and grazing edges receive blue/pink highlights. No igloo application bundle,
frost simulation, inner portfolio logo, audio, or postprocessing stack is copied.
Tone mapping is disabled to preserve the saturated blue core; exposure remains 1.

## Tathva artwork

- `robot-head.svg`: original head-only vector reconstruction from the supplied reference.
  All locally cached T26 branches and igloo assets were searched; the exact reference head
  was not available. This is not represented as an extracted official source asset.
- `crystal-fallback.png`: transparent browser render of the new model, 534 x 703 pixels.
  It replaces the displayed fallback. The previous SVG and its generator remain available.
- `crystal-fallback.svg`, `tathva-robot.png`, and `scripts/generate-expo-fallback.mjs`:
  retained previous illustration/assets, no longer used for the live crystal.
- `tathva-robot.png` originally came byte-for-byte from
  `origin/dev/durga:public/images/techconclave/robot.png`, commit
  `f9a516f3501433ae2678af34b6662fe9023767f8`.
- `tathva-mark.svg` comes byte-for-byte from
  `origin/dev/h0niin:public/images/hero/tathvawhitelogo-1.svg`, commit
  `b9c3d773315a7f8a601aaa6c2c2bcb0dcafc8d69`.
- The header badge remains `public/images/menu/tathva.png`.

The background keeps its existing gradient positions with darker navy/blue colours.
The existing star image and star positions are unchanged; opacity and brightness increase in CSS.
No layout coordinates, breakpoints, DOM content, or navigation behaviour were changed.

## Rendering budget and behaviour

- No new npm dependencies. Draco/Basis decoder binaries are copied from the installed Three
  package; their README and Apache/MIT license notices are included beside them.
- Normal map: 2048 x 2048, GPU-compressed KTX2. Roughness: 1024 x 1024 KTX2.
  Reflection EXR: 512 x 256, converted to a small PMREM environment.
- Head: 512 x 512 SVG texture; generated energy texture: 512 x 512; glow: 128 x 128.
- Phone/coarse-pointer DPR remains 1; desktop remains capped at 1.5.
- Refraction buffer uses 0.75 of canvas resolution per axis. Transmission is enabled;
  shadows, postprocessing, and the reference's frost simulation remain disabled.
- Decoder workers are limited to one per format and released once loading completes.
- Offscreen/hidden rendering pause, input handlers, touch scroll behaviour, damping, idle
  motion, reduced-motion behaviour, and failure handling remain unchanged.

## Verification

The pre-edit files were compared against the result: pointer handlers, interaction math,
useFrame animation/damping, and Expo DOM are unchanged. Desktop and mobile renders were
visually inspected against the supplied image. Browser checks use headless Chrome/software
WebGL; physical Android FPS is not claimed.

Final checks passed: production build, lint (eight pre-existing unrelated warnings),
desktop hover/leave, tablet/desktop resizing, mobile touch drag/release, vertical touch
scrolling, mobile navigation, context loss, missing head texture, reduced motion, and
disabled JavaScript. Normal browser pages reported no runtime errors. The igloo working
tree remains unchanged.

## TechConclave to Expo transition (2026-10-01)

The homepage now composes both sections in `TechConclaveExpoTransition.jsx`.
One crystal stays mounted above both backgrounds: it emerges at the visible
TechConclave robot's column, rolls end-over-end along a curved path, and settles
into the existing Expo crystal slot. Tall phone posters finish their readable
content before pinning; an offscreen robot's column supplies a clamped origin.

`expoJourney.mjs` supplies deterministic travel, scale, tumble and settling
values. GSAP uses the existing `.main-scroll`/Lenis integration, with a lower
refresh priority so upstream pin spacing is measured first. Desktop travel
occupies 2.4 viewport heights; phones use 1.5. Reversing scroll reverses the
same motion. Scroll, idle and pointer rotations use separate nested model groups.
Projected SVG connectors follow the live crystal; fallback rendering keeps
approximate anchors. Reduced motion removes the shared canvas and pin entirely.
The standalone `/expo` route retains its own crystal with idle and pointer motion.

The revised transition uses one viewport-sized camera. No geometric canvas mask
is used. TechConclave blurs and erodes through a deterministic SVG turbulence
alpha mask, while `ConclaveVeil.jsx` renders viewport-wide procedural mist with
displaced samples of the existing Conclave background. Dense foreground clouds
conceal the incoming crystal, then noise contours open into drifting wisps so
the robot and crystal facets emerge before the descent finishes.
Expo appears underneath during this overlap. The crystal then travels downward
through one complete, unwrapped end-over-end revolution, rocks into place, and
receives idle/pointer motion before the Expo copy and connectors finish revealing.
CSS mist and a positioned illustration remain available when WebGL fails.
The turbulence mask is removed when reduced motion disables the transition.

Browser checks covered desktop and phone layouts, viewport resizing, reverse
scroll, gallery release, cursor response, modal open/Escape/focus return, live
motion-preference changes and simulated WebGL context loss. The revised flow was
also checked after live resizing through desktop, portrait and landscape layouts.
`node scripts/check-expo-motion.mjs` checks finite values, bounded scale/interaction,
angular continuity, downward descent, navigation clearance, a complete revolution,
and final anchors on those three layouts. Scoped lint passed;
repository lint reported zero errors and 84 existing warnings. Production build
verification was blocked by Google Fonts download failures; the network-enabled
retry also encountered an EPERM error on a generated `.next/build` chunk.
These checks do not establish performance on physical mobile hardware.

## Expo to gallery exit

The shared timeline now has entry (0–1), an interactive reading hold (1–1.45),
and departure (1.45–2.15). `expoExit` keeps the crystal's rotation unwrapped
through a second full revolution, moves it upward and into depth, reduces its
scale, and eases out pointer influence. Its glow lifts during departure.
Copy fades and connectors contract first; charcoal/purple cloud coverage then
conceals the crystal and clears over the actual gallery. Exit clouds do not
sample the TechConclave poster.

The bridge owns one gallery instance, following it with a one-viewport overlap
only when motion is enabled. Desktop gallery scrolling starts at `top top`
after the handoff; its refresh priority follows the bridge's pin calculation.
Phones retain the vertical gallery. Reduced motion removes the overlap and pin.
The standalone Expo route remains independent.

Checks passed for upward motion, a complete exit revolution, continuity, shrinking
scale, final invisibility, desktop/mobile handoff, live resizing, reverse return,
Explore/Escape/focus return, reduced-motion toggling, and WebGL fallback. Scoped
lint has no errors; the gallery retains four existing image-element warnings.

The gallery's coordinated start is explicitly anchored to the bridge's release
scroll coordinate. Its track uses a zero-based `fromTo` on every rebuild, and
horizontal travel ends before the sticky viewport releases (`bottom bottom`).
The bridge follows Lenis directly, avoiding a second scrub delay that could
leave clouds obscuring an already-advancing gallery. Wheel checks showed the
opening cards after the handoff, all ten cards became fully visible before
release, and both desktop resize checks returned to a zero track offset.
Reimplementation from `b7661fa` additionally verifies that the ready 3D model
hides its illustration through CSS, while context loss restores that fallback.
Browser assertions covered the wheel-driven opening, all ten fully visible
desktop cards, a zero offset after resizing, and the phone's first gallery card.

## Living crystal interaction

The ice now uses bounded multi-frequency idle rotation and bobbing; the robot
has a separate floating group with delayed counter-rotation. The core's energy
brightness and glow breathe slowly. Surface raycasting drives damped hover
enlargement (up to 2.5%), stronger tilt, a local cyan point light, and animated
fracture highlights around the hit point. Reflections brighten slightly on hover.
Forty-eight small motes and one faint procedural mist sheet provide atmosphere.
These effects share the existing render loop and use no additional render target
or postprocessing pass. The journey's interaction weight removes them during
entry/exit, and the existing reduced-motion fallback remains static.

Scoped lint and motion checks passed. Desktop/shared and standalone views were
visually checked; phone touch drag/release, modal focus return, reduced motion,
and simulated context loss were checked in the browser. Physical phone frame
rate has not been measured.

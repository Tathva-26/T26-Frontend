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

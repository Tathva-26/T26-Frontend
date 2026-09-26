import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

// Original Tathva silhouette. No reference geometry or sampled vertex data is used.
export const OUTLINE = [
  [-.38, 1.48], [.52, 1.73], [.84, 1.08], [.97, .43], [.83, -.24],
  [.93, -.69], [.37, -1.38], [-.06, -1.7], [-.71, -1.13],
  [-.94, -.43], [-.87, .25], [-.98, .72], [-.74, 1.18],
];

export function createCrystalGeometry() {
  const points = [];
  OUTLINE.forEach(([x, y], index) => {
    const depth = .36 + .055 * Math.sin(index * 2.17);
    points.push(new Vector3(x, y, .03 * Math.cos(index * 1.7)));
    points.push(new Vector3(x * .84 + .025, y * .88, depth));
    points.push(new Vector3(x * .73 - .04, y * .81, -depth * 1.12));
  });
  points.push(new Vector3(-.21, .35, .64), new Vector3(.24, -.62, .55), new Vector3(0, .1, -.65));
  const geometry = new ConvexGeometry(points);
  geometry.computeBoundingSphere();
  return geometry;
}

export function createCrystalRim() {
  const rings = [];
  const count = OUTLINE.length * 3;
  const layers = [[1.018, .0], [1, .16], [.955, .44], [.85, .53], [.77, .21]];
  layers.forEach(([scale, z], layer) => {
    const ring = [];
    for (let i = 0; i < count; i++) {
      const segment = Math.floor(i / 3);
      const fraction = (i % 3) / 3;
      const a = OUTLINE[segment], b = OUTLINE[(segment + 1) % OUTLINE.length];
      const jitter = Math.sin(i * 12.73 + layer * 6.17) * .019;
      ring.push([(a[0] + (b[0] - a[0]) * fraction) * scale + jitter, (a[1] + (b[1] - a[1]) * fraction) * scale + jitter, z + Math.sin(i * 3.57 + layer) * .065]);
    }
    rings.push(ring);
  });
  const vertices = [];
  for (let layer = 0; layer < rings.length - 1; layer++) {
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      const a = rings[layer][i], b = rings[layer][next], c = rings[layer + 1][next], d = rings[layer + 1][i];
      vertices.push(...a, ...c, ...b, ...a, ...d, ...c);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createCrystalVeins() {
  const chains = [
    [[-.47, 1.14], [-.24, .96], [-.31, .69], [-.06, .48], [.02, .13], [.24, -.1]],
    [[.58, .93], [.38, .76], [.51, .5], [.29, .34]],
    [[.63, -.4], [.32, -.55], [.41, -.83], [.09, -1.06], [.12, -1.36]],
    [[-.65, -.3], [-.42, -.46], [-.5, -.75], [-.28, -.9]],
  ];
  const positions = [], colors = [];
  chains.forEach((chain, chainIndex) => {
    for (let segment = 0; segment < chain.length - 1; segment++) {
      const a = chain[segment], b = chain[segment + 1];
      for (let step = 0; step < 4; step++) {
        const t = step / 4, u = (step + 1) / 4;
        positions.push(a[0] + (b[0] - a[0]) * t + Math.sin(segment * 9 + step * 3) * .028, a[1] + (b[1] - a[1]) * t, .66);
        positions.push(a[0] + (b[0] - a[0]) * u + Math.sin(segment * 9 + (step + 1) * 3) * .028, a[1] + (b[1] - a[1]) * u, .66);
        const color = chainIndex === 2 ? [.65, .19, .82] : [.12, .36, .95];
        colors.push(...color, ...color);
      }
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

export function localPointer(clientX, clientY, rect) {
  return {
    x: Math.max(-1, Math.min(1, ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1)),
    y: Math.max(-1, Math.min(1, 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2)),
  };
}

export function interactionTargets(point, drag, touch = false) {
  const gain = touch ? .75 : 1;
  return {
    tiltX: Math.max(-.15, Math.min(.15, -point.y * .105 + drag.y * .16)) * gain,
    tiltY: Math.max(-.22, Math.min(.22, point.x * .14 + drag.x * .24)) * gain,
    x: -point.x * .075 * gain,
    y: -point.y * .055 * gain,
  };
}

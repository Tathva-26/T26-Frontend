import { readFile, writeFile } from "node:fs/promises";
import { OUTLINE, createCrystalGeometry, createCrystalRim } from "../src/pageComponents/Expo/crystalGeometry.mjs";

// Reproducible, project-owned static illustration using the same original geometry.
const geometry = createCrystalGeometry();
const positions = geometry.getAttribute("position");
const normals = geometry.getAttribute("normal");
const project = (x, y) => `${(300 + x * 200 + y * 17).toFixed(1)},${(380 - y * 200 + x * 17).toFixed(1)}`;
const outline = OUTLINE.map(([x, y]) => project(x, y)).join(" ");
const robot = (await readFile(new URL("../public/images/expo/tathva-robot.png", import.meta.url))).toString("base64");
const facets = [];
for (let index = 0; index < positions.count; index += 3) {
  if (normals.getZ(index) < .05) continue;
  const points = [0, 1, 2].map((offset) => project(positions.getX(index + offset), positions.getY(index + offset))).join(" ");
  const edge = Math.abs(normals.getX(index)) + Math.abs(normals.getY(index));
  const color = normals.getX(index) > .4 ? "#c6a8f6" : "#c7e5ff";
  facets.push(`<polygon points="${points}" fill="${color}" fill-opacity="${Math.min(.22, .01 + edge * .07).toFixed(3)}" stroke="${color}" stroke-opacity=".14" stroke-width=".6"/>`);
}
const rim = createCrystalRim();
const rimPositions = rim.getAttribute("position");
const rimNormals = rim.getAttribute("normal");
for (let index = 0; index < rimPositions.count; index += 3) {
  const points = [0, 1, 2].map((offset) => project(rimPositions.getX(index + offset), rimPositions.getY(index + offset))).join(" ");
  const color = rimNormals.getX(index) > .1 ? "#9683c6" : "#abd2ed";
  facets.push(`<polygon points="${points}" fill="${color}" fill-opacity="${(.35 + Math.abs(rimNormals.getZ(index)) * .55).toFixed(2)}"/>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="760" viewBox="0 0 600 760">
<defs>
<linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#253354"/><stop offset=".24" stop-color="#030919"/><stop offset=".67" stop-color="#080b23"/><stop offset="1" stop-color="#735886"/></linearGradient>
<radialGradient id="glow"><stop stop-color="#307cff" stop-opacity=".65"/><stop offset="1" stop-color="#2863ff" stop-opacity="0"/></radialGradient>
<filter id="cyan"><feColorMatrix type="matrix" values="0.1 0.1 0.1 0 0 0.28 0.38 0.28 0 0.02 0.48 0.58 0.48 0 0.05 0 0 0 1 0"/></filter>
<filter id="blur"><feGaussianBlur stdDeviation="12"/></filter>
<clipPath id="shell"><polygon points="${outline}"/></clipPath>
</defs>
<polygon points="${outline}" fill="url(#body)" stroke="#b5d2f7" stroke-width="2"/>
<g clip-path="url(#shell)"><ellipse cx="300" cy="370" rx="180" ry="210" fill="url(#glow)"/>
<image x="145" y="240" width="310" height="260" href="data:image/png;base64,${robot}" filter="url(#cyan)"/>
${facets.join("\n")}
<path d="M212 163L386 136 M170 438L221 565 M355 525L303 654" stroke="#a9baff" stroke-width="7" opacity=".4" filter="url(#blur)"/>
</g></svg>`;
await writeFile(new URL("../public/images/expo/crystal-fallback.svg", import.meta.url), svg);
console.log(`Original shell: ${positions.count / 3} triangles; fallback: ${Buffer.byteLength(svg)} bytes`);
geometry.dispose();
rim.dispose();
let seed = 260926;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const stars = Array.from({ length: 180 }, () => `<circle cx="${(random() * 1440).toFixed(1)}" cy="${(random() * 1000).toFixed(1)}" r="${(.5 + random() * 1.2).toFixed(2)}" opacity="${(.2 + random() * .65).toFixed(2)}"/>`).join("");
await writeFile(new URL("../public/images/expo/stars.svg", import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 1000"><g fill="#ccd7ff">${stars}</g></svg>`);

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, MathUtils, ShaderChunk, SRGBColorSpace, TextureLoader, Vector3 } from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { createCrystalVeins } from "./crystalGeometry.mjs";

const geometryLoader = new DRACOLoader().setDecoderPath("/images/expo/decoders/draco/").setWorkerLimit(1);
const surfaceLoader = new KTX2Loader().setTranscoderPath("/images/expo/decoders/basis/").setWorkerLimit(1);
let decodersReleased = false;

function releaseCrystalDecoders() {
  if (decodersReleased) return;
  decodersReleased = true;
  geometryLoader.dispose();
  surfaceLoader.dispose();
}

function prepareGlass(shader) {
  // Three clears the transmission buffer to half-alpha white on a transparent
  // canvas. Replace only those empty samples with navy, avoiding a chalk-white
  // border while keeping the DOM background transparent outside the crystal.
  const transmission = ShaderChunk.transmission_pars_fragment.replace(
    "return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );",
    "vec4 sampleColor = textureBicubic(transmissionSamplerMap, fragCoord.xy, lod); sampleColor.rgb = mix(vec3(.008,.015,.035),sampleColor.rgb,clamp(sampleColor.a*1.5-.4,0.,1.)); sampleColor.a=1.; return sampleColor;",
  );
  shader.fragmentShader = shader.fragmentShader.replace("#include <transmission_pars_fragment>", transmission);
  shader.fragmentShader = shader.fragmentShader.replace(
    "vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;",
    "float edge = pow(1. - abs(dot(normal, normalize(vViewPosition))), 1.3); vec3 edgeTint = mix(vec3(.65,.82,1.),vec3(1.,.35,.85),smoothstep(.2,1.5,vWorldPosition.x-vWorldPosition.y*.3)); float pink = exp(-8.*pow(vWorldPosition.x-.75,2.)-2.*pow(vWorldPosition.y+.6,2.)); vec3 rimGlow = (vec3(.008,.025,.055)+vec3(.35,.025,.24)*pink)*edge; vec3 outgoingLight = totalDiffuse + totalSpecular * mix(.12,1.,edge) * edgeTint + totalEmissiveRadiance + rimGlow;",
  );
}

function createGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 64);
  gradient.addColorStop(0, "rgba(50,115,255,.55)");
  gradient.addColorStop(.35, "rgba(22,62,255,.14)");
  gradient.addColorStop(1, "rgba(22,50,255,0)");
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createEnergy() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const bloom = (x, y, radius, color) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color); gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
  };
  bloom(248, 212, 190, "#0b44cf");
  bloom(375, 404, 90, "#541960");
  let seed = 26;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let line = 0; line < 11; line++) {
    let x = random() * 430, y = random() * 200;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let part = 0; part < 8; part++) {
      x += (random() - .35) * 95; y += 25 + random() * 45;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = line > 7 ? "#a445b288" : "#1954b977";
    ctx.lineWidth = .6 + random(); ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 7; ctx.stroke();
  }
  ctx.shadowBlur = 0;
  bloom(356, 397, 27, "#d069cf");
  bloom(376, 418, 47, "#612aa5");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export default function CrystalModel({ target, onReady }) {
  const group = useRef();
  const shell = useRef();
  const insert = useRef();
  const started = useRef(false);
  const elapsed = useRef(0);
  const gl = useThree((state) => state.gl);
  const robotSource = useLoader(TextureLoader, "/images/expo/robot-head.svg");
  const source = useLoader(geometryLoader, "/images/expo/crystal/shell.drc");
  const [normal, roughness] = useLoader(surfaceLoader, ["/images/expo/crystal/shell-normal.ktx2", "/images/expo/crystal/shell-roughness.ktx2"], (loader) => loader.detectSupport(gl));
  const robot = useMemo(() => {
    const texture = robotSource.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [robotSource]);
  const geometry = useMemo(() => {
    const copy = source.clone();
    copy.computeBoundingBox();
    const height = copy.boundingBox.getSize(new Vector3()).y;
    copy.center();
    copy.scale(3.2 / height, 3.2 / height, 3.2 / height);
    // Keep the imported normals and UVs: the fractured edges depend on both.
    return copy;
  }, [source]);
  const veins = useMemo(() => createCrystalVeins(), []);
  const glow = useMemo(() => createGlow(), []);
  const energy = useMemo(() => createEnergy(), []);
  const energyUniforms = useMemo(() => ({ map: { value: energy } }), [energy]);
  // All decode promises have resolved before this component commits. Keep the
  // cached GPU assets, but release the now-idle decoder workers immediately.
  useEffect(releaseCrystalDecoders, []);
  useEffect(() => () => { geometry.dispose(); veins.dispose(); glow.dispose(); energy.dispose(); robot.dispose(); }, [geometry, veins, glow, energy, robot]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    elapsed.current += dt;
    const time = elapsed.current;
    const body = group.current;
    body.position.x = MathUtils.damp(body.position.x, target.current.x, 4.3, dt);
    body.position.y = MathUtils.damp(body.position.y, target.current.y, 4.3, dt);
    body.rotation.x = MathUtils.damp(body.rotation.x, target.current.tiltX, 4.1, dt);
    body.rotation.y = MathUtils.damp(body.rotation.y, target.current.tiltY, 4.1, dt);
    shell.current.position.y = Math.sin(time * 1.05) * .045;
    // Continuous, bounded idle rotation keeps the robot facing the visitor.
    shell.current.rotation.y = -.12 + Math.sin(time * .16) * .17;
    shell.current.rotation.z = -.085 + Math.sin(time * .38) * .022;
    insert.current.position.y = shell.current.position.y;
  });

  const firstFrame = () => {
    if (started.current) return;
    started.current = true;
    // onAfterRender fires only after the mesh/texture has reached the renderer.
    onReady();
  };

  return (
    <group ref={group}>
      <group ref={shell}>
        <mesh geometry={geometry} scale={[.96, .97, .48]} position={[0, 0, -.3]} onAfterRender={firstFrame}>
          <shaderMaterial
            transparent
            depthWrite={false}
            uniforms={energyUniforms}
            vertexShader={"varying vec2 vEnergyUv; void main(){vEnergyUv=position.xy/vec2(2.18,3.4)+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"}
            fragmentShader={"uniform sampler2D map; varying vec2 vEnergyUv; void main(){vec4 tex=texture2D(map,vEnergyUv); if(tex.a<0.04) discard; gl_FragColor=vec4(tex.rgb,tex.a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}"}
          />
        </mesh>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial color="#b9d0f4" metalness={0} roughness={.045} roughnessMap={roughness} normalMap={normal} normalScale={[.24, .24]} transmission={1} thickness={.12} ior={1.18} reflectivity={.3} clearcoat={0} envMapIntensity={1.7} onBeforeCompile={prepareGlass} />
        </mesh>
        {/* Undo only the shell's fixed resting orientation, preserving the front
            artwork while inheriting its idle rotation and the parent's tilt. */}
        <group rotation={[0, .12, .085, "ZYX"]}>
          <mesh position={[0, .15, .65]} scale={[2, 2.3, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={glow} transparent opacity={.8} blending={AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[0, .18, .64]} scale={[1.7, 1.7, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={robot} color={[.45, .95, 2.5]} alphaTest={.3} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <group ref={insert}>
        <lineSegments geometry={veins}>
          <lineBasicMaterial vertexColors transparent opacity={.24} blending={AdditiveBlending} depthWrite={false} />
        </lineSegments>
      </group>
    </group>
  );
}

'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  CanvasTexture,
  BufferGeometry,
  Float32BufferAttribute,
  MathUtils,
  Raycaster,
  ShaderChunk,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { createCrystalVeins } from './crystalGeometry.mjs'
import { journeyScreenPoint } from './expoJourney.mjs'
import { springStep, fractureSector } from './crystalInteraction.mjs'
import CrystalShards from './CrystalShards'

const geometryLoader = new DRACOLoader()
  .setDecoderPath('/images/expo/decoders/draco/')
  .setWorkerLimit(1)
const surfaceLoader = new KTX2Loader()
  .setTranscoderPath('/images/expo/decoders/basis/')
  .setWorkerLimit(1)
let decodersReleased = false

function releaseCrystalDecoders() {
  if (decodersReleased) return
  decodersReleased = true
  geometryLoader.dispose()
  surfaceLoader.dispose()
}

function prepareGlass(shader) {
  // Three clears the transmission buffer to half-alpha white on a transparent
  // canvas. Replace only those empty samples with navy, avoiding a chalk-white
  // border while keeping the DOM background transparent outside the crystal.
  const transmission = ShaderChunk.transmission_pars_fragment.replace(
    'return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );',
    'vec4 sampleColor = textureBicubic(transmissionSamplerMap, fragCoord.xy, lod); sampleColor.rgb = mix(vec3(.008,.015,.035),sampleColor.rgb,clamp(sampleColor.a*2.-1.,0.,1.)); sampleColor.a=1.; return sampleColor;',
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <transmission_pars_fragment>',
    transmission,
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
    'float edge = pow(1. - abs(dot(normal, normalize(vViewPosition))), 1.3); vec3 edgeTint = mix(vec3(.65,.82,1.),vec3(1.,.35,.85),smoothstep(.2,1.5,vWorldPosition.x-vWorldPosition.y*.3)); float pink = exp(-8.*pow(vWorldPosition.x-.75,2.)-2.*pow(vWorldPosition.y+.6,2.)); vec3 rimGlow = (vec3(.012,.035,.075)+vec3(.45,.045,.32)*pink)*edge; vec3 outgoingLight = totalDiffuse + totalSpecular * mix(.24,1.25,edge) * edgeTint + totalEmissiveRadiance + rimGlow;',
  )
}

function createGlow() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(50,115,255,.55)')
  gradient.addColorStop(0.35, 'rgba(22,62,255,.14)')
  gradient.addColorStop(1, 'rgba(22,50,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function createEnergy() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')
  const bloom = (x, y, radius, color) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
  }
  bloom(248, 212, 190, '#0b44cf')
  bloom(375, 404, 90, '#541960')
  let seed = 26
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let line = 0; line < 11; line++) {
    let x = random() * 430,
      y = random() * 200
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let part = 0; part < 8; part++) {
      x += (random() - 0.35) * 95
      y += 25 + random() * 45
      ctx.lineTo(x, y)
    }
    ctx.strokeStyle = line > 7 ? '#a445b288' : '#1954b977'
    ctx.lineWidth = 0.6 + random()
    ctx.shadowColor = ctx.strokeStyle
    ctx.shadowBlur = 7
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  bloom(356, 397, 27, '#d069cf')
  bloom(376, 418, 47, '#612aa5')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export default function CrystalModel({ target, compact = false, onReady, onMood, journey, onProject }) {
  const group = useRef()
  const travel = useRef()
  const idle = useRef()
  const glowMaterial = useRef()
  const shell = useRef()
  const glass = useRef()
  const robotMotion = useRef()
  const cursorLight = useRef()
  const fractures = useRef()
  const motes = useRef()
  const mist = useRef()
  const energyMaterial = useRef()
  const life = useRef({ hover: 0, hitStrength: 0, lastRay: -1, lastHit: -10, activation: 0, charge: 0, sectors: 0, pulseAt: -10, awakeUntil: -10, awake: false, vx: 0, vy: 0 })
  const intersections = useRef([])
  const projectedAnchors = useMemo(() => [[-.76, .55, .3], [.76, .35, .3], [.7, -.55, .3], [-.4, -1.05, .3]].map(([x, y, z]) => ({ source: new Vector3(x, y, z), x: 0, y: 0 })), [])
  const raycaster = useMemo(() => new Raycaster(), [])
  const pointerNdc = useMemo(() => new Vector2(), [])
  const lightPoint = useMemo(() => new Vector3(0, .2, .9), [])
  const anchor = useMemo(() => new Vector3(), [])
  const started = useRef(false)
  const gl = useThree((state) => state.gl)
  const robotSource = useLoader(TextureLoader, '/images/expo/robot-head.svg')
  const source = useLoader(geometryLoader, '/images/expo/crystal/shell.drc')
  const [normal, roughness] = useLoader(
    surfaceLoader,
    [
      '/images/expo/crystal/shell-normal.ktx2',
      '/images/expo/crystal/shell-roughness.ktx2',
    ],
    (loader) => loader.detectSupport(gl),
  )
  const robot = useMemo(() => {
    const texture = robotSource.clone()
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [robotSource])
  const geometry = useMemo(() => {
    const copy = source.clone()
    copy.computeBoundingBox()
    const height = copy.boundingBox.getSize(new Vector3()).y
    copy.center()
    copy.scale(3.2 / height, 3.2 / height, 3.2 / height)
    // Keep the imported normals and UVs: the fractured edges depend on both.
    return copy
  }, [source])
  const veins = useMemo(() => createCrystalVeins(), [])
  const glow = useMemo(() => createGlow(), [])
  const energy = useMemo(() => createEnergy(), [])
  const energyUniforms = useMemo(() => ({ map: { value: energy }, brightness: { value: 1 } }), [energy])
  const veinUniforms = useMemo(() => ({ time: { value: 0 }, hover: { value: 0 }, pulse: { value: 0 }, pointer: { value: new Vector3() } }), [])
  const mistUniforms = useMemo(() => ({ time: { value: 0 }, opacity: { value: 0 } }), [])
  const dust = useMemo(() => {
    const positions = []
    for (let i = 0; i < 48; i++) {
      const angle = i * 2.39996
      const radius = 1.45 + (Math.sin(i * 13.71) * .5 + .5) * .8
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius * .85, -.9 + Math.sin(i * 7.13) * .35)
    }
    const result = new BufferGeometry()
    result.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return result
  }, [])
  useEffect(() => { dust.setDrawRange(0, compact ? 24 : 48); }, [dust, compact])
  // All decode promises have resolved before this component commits. Keep the
  // cached GPU assets, but release the now-idle decoder workers immediately.
  useEffect(releaseCrystalDecoders, [])
  useEffect(
    () => () => {
      geometry.dispose()
      veins.dispose()
      glow.dispose()
      energy.dispose()
      robot.dispose()
      dust.dispose()
    },
    [geometry, veins, glow, energy, robot, dust],
  )
  useFrame(({ clock, camera, size }, delta) => {
    const dt = Math.min(delta, 0.05)
    const body = group.current
    const pose = journey?.current
    const influence = pose ? pose.interaction : 1
    const time = clock.elapsedTime
    // Raycast the actual ice, not the viewport rectangle surrounding it.
    const activationPending = target.current.activation !== life.current.activation
    if ((target.current.active || activationPending) && influence > .01) {
      // Surface picking need not run at render frequency. Reuse its result
      // between samples; damping still runs every frame.
      if (activationPending || time - life.current.lastRay >= (compact ? 1 / 20 : 1 / 30)) {
        life.current.lastRay = time
        travel.current.updateWorldMatrix(true, true)
        pointerNdc.set(target.current.x, target.current.y)
        raycaster.setFromCamera(pointerNdc, camera)
        intersections.current.length = 0
        raycaster.intersectObject(shell.current, false, intersections.current)
        const hit = intersections.current[0]
        life.current.hitStrength = hit ? 1 : 0
        if (hit) {
          life.current.lastHit = time
          anchor.copy(hit.point)
          body.worldToLocal(anchor)
          lightPoint.lerp(anchor, .35)
          const sector = fractureSector(anchor, veins.attributes.position.array)
          if (sector >= 0 && !(life.current.sectors & (1 << sector)) && time > life.current.awakeUntil + 1) {
            life.current.sectors |= 1 << sector
            const bits = life.current.sectors
            const traced = (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1) + ((bits >> 3) & 1)
            if (traced >= 3) life.current.charge = 1.01
          }
        }
      }
    } else {
      life.current.hitStrength = 0
    }
    if (activationPending) {
      const activations = Math.min(3, target.current.activation - life.current.activation)
      life.current.activation = target.current.activation
      if (influence > .8 && (life.current.hitStrength || target.current.keyboard)) {
        life.current.lastHit = time
        life.current.pulseAt = time
        if (time > life.current.awakeUntil + 1) life.current.charge += .36 * activations
      }
    }
    life.current.charge = Math.max(0, life.current.charge - dt * (time - life.current.lastHit > 2 ? .18 : .025))
    if (time - life.current.lastHit > 5) life.current.sectors = 0
    if (influence < .1) { life.current.charge = 0; life.current.sectors = 0; life.current.awakeUntil = -10 }
    if (life.current.charge >= 1 && time > life.current.awakeUntil + 1) {
      life.current.charge = 0; life.current.sectors = 0
      life.current.awakeUntil = time + 2.4
      life.current.pulseAt = time
    }
    const awake = time < life.current.awakeUntil && influence > .8
    if (awake !== life.current.awake) { life.current.awake = awake; onMood?.(awake) }
    const age = time - life.current.pulseAt
    const pulse = Math.exp(-age * 3.8) * influence
    const bits = life.current.sectors
    const traceLevel = ((bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1) + ((bits >> 3) & 1)) * .32
    const chargeLevel = Math.max(life.current.charge, traceLevel)
    life.current.hover = MathUtils.damp(life.current.hover, life.current.hitStrength * influence, 5.2, dt)
    const hover = life.current.hover
    cursorLight.current.position.set(lightPoint.x, lightPoint.y, 1.2)
    cursorLight.current.intensity = hover * 1.6
    glass.current.envMapIntensity = 2.2 + hover * .25
    glass.current.roughness = .045 - hover * .012
    body.scale.setScalar(1 + hover * .025 + pulse * .012)
    // Warm the hidden canvas once so GPU upload/readiness can finish before entry.
    // After that first render, offscreen/transparent journey poses stay hidden.
    travel.current.visible = !started.current || !pose || pose.opacity > .005
    const breath = Math.sin(time * 1.15) * .065 + Math.sin(time * .47) * .025
    glowMaterial.current.opacity = .8 + (breath + hover * .12 + chargeLevel * .15 + (awake ? .25 : 0)) * influence + Math.sin((pose?.exit ?? 0) * Math.PI) * .2
    // Press feedback lives on the inner shell and its fractures, never a screen-space halo.
    energyMaterial.current.uniforms.brightness.value = 1.6 + (breath + hover * .18 + chargeLevel * .25) * influence + pulse * 1.2
    fractures.current.uniforms.time.value = time
    fractures.current.uniforms.hover.value = hover
    fractures.current.uniforms.pulse.value = pulse
    fractures.current.uniforms.pointer.value.copy(lightPoint)
    const sx = springStep(body.rotation.x, life.current.vx, target.current.tiltX * influence * (1 + hover * .55), dt)
    const sy = springStep(body.rotation.y, life.current.vy, target.current.tiltY * influence * (1 + hover * .55), dt)
    body.rotation.x = sx.position; life.current.vx = sx.velocity
    body.rotation.y = sy.position; life.current.vy = sy.velocity
    travel.current.rotation.set(pose?.pitch ?? 0, pose?.yaw ?? 0, pose?.roll ?? 0)
    if (pose?.layout) {
      const point = journeyScreenPoint(pose, pose.layout)
      const halfHeight = Math.tan(camera.fov * Math.PI / 360) * (8 - pose.depth)
      const halfWidth = halfHeight * size.width / size.height
      travel.current.position.set((point.x / size.width * 2 - 1) * halfWidth, (1 - point.y / size.height * 2) * halfHeight, pose.depth)
      // Match the old slot's 3.8-unit framing, while using one viewport camera.
      const baseScale = Math.tan(camera.fov * Math.PI / 360) * 16 * pose.layout.slotHeight / size.height / 3.8
      travel.current.scale.setScalar(baseScale * pose.scale)
      camera.position.x = MathUtils.damp(camera.position.x, target.current.tiltY * .4 * influence, 3.2, dt)
      camera.position.y = MathUtils.damp(camera.position.y, -target.current.tiltX * .3 * influence, 3.2, dt)
      camera.lookAt(0, 0, 0)
      camera.updateMatrixWorld()
    }
    idle.current.position.y = (Math.sin(time * .85) * .035 + Math.sin(time * .31) * .012) * influence
    idle.current.rotation.set(Math.sin(time * .48) * .055 * influence, (Math.sin(time * .24) * .18 + Math.sin(time * .53) * .035) * influence, Math.sin(time * .39) * .045 * influence)
    robotMotion.current.rotation.set(
      MathUtils.damp(robotMotion.current.rotation.x, (.035 * Math.sin(time * .43) - body.rotation.x * .35 + lightPoint.y * hover * .055 + Math.sin(age * 9) * pulse * .09) * influence, 2.8, dt),
      .12 + MathUtils.damp(robotMotion.current.rotation.y - .12, (awake ? -.12 : .065 * Math.sin(time * .35) - body.rotation.y * .30 + lightPoint.x * hover * .10) * influence, 2.8, dt),
      .085 + Math.sin(time * .42) * .035 * influence, 'ZYX')
    robotMotion.current.position.y = Math.sin(time * .67 + .8) * .025 * influence
    motes.current.rotation.z = Math.sin(time * .12) * .12
    motes.current.position.y = Math.sin(time * .23) * .10
    motes.current.material.opacity = .18 * influence
    mist.current.position.x = Math.sin(time * .16) * .22
    mist.current.material.uniforms.time.value = time
    mist.current.material.uniforms.opacity.value = .10 * influence * (1 - hover * .45)
    if (onProject && influence > .01) {
      travel.current.updateWorldMatrix(true, true)
      projectedAnchors.forEach((point) => {
        anchor.copy(point.source).applyMatrix4(body.matrixWorld).project(camera)
        point.x = anchor.x; point.y = anchor.y
      })
      onProject(projectedAnchors)
    }
  })

  const firstFrame = () => {
    if (started.current) return
    started.current = true
    // onAfterRender fires only after the mesh/texture has reached the renderer.
    onReady()
  }

  return (
    <group ref={travel}>
      <group ref={idle}>
      <group ref={group}>
      <CrystalShards journey={journey} compact={compact} prepareGlass={prepareGlass} />
      <pointLight ref={cursorLight} color='#75dfff' intensity={0} distance={4} decay={2} />
      <points ref={motes} geometry={dust}>
        <pointsMaterial color='#acdfff' map={glow} size={.055} transparent opacity={.18} depthWrite={false} blending={AdditiveBlending} />
      </points>
      <mesh ref={mist} position={[0, -.4, -.9]} scale={[4.5, 2.2, 1]}>
        <planeGeometry />
        <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending} uniforms={mistUniforms}
          vertexShader={'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'}
          fragmentShader={'uniform float time,opacity; varying vec2 vUv; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);} void main(){vec2 p=vUv*vec2(5.,2.)+vec2(time*.06,-time*.015);float n=noise(p)*.65+noise(p*2.1)*.35; float feather=smoothstep(0.,.18,vUv.x)*smoothstep(0.,.18,1.-vUv.x)*smoothstep(0.,.22,vUv.y)*smoothstep(0.,.22,1.-vUv.y);float band=exp(-pow((vUv.y-.5-sin(vUv.x*6.+time*.12)*.12)*4.,2.));gl_FragColor=vec4(.20,.43,.65,opacity*feather*band*smoothstep(.24,.72,n));\n#include <colorspace_fragment>\n}'} />
      </mesh>
      <group>
        <mesh
          geometry={geometry}
          scale={[0.96, 0.97, 0.48]}
          position={[0, 0, -0.3]}
          onAfterRender={firstFrame}
        >
          <shaderMaterial
            ref={energyMaterial}
            transparent
            depthWrite={false}
            uniforms={energyUniforms}
            vertexShader={
              'varying vec2 vEnergyUv; void main(){vEnergyUv=position.xy/vec2(2.18,3.4)+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'
            }
            fragmentShader={
              'uniform sampler2D map; uniform float brightness; varying vec2 vEnergyUv; void main(){vec4 tex=texture2D(map,vEnergyUv); if(tex.a<0.04) discard; gl_FragColor=vec4(tex.rgb*brightness,tex.a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
            }
          />
        </mesh>
        <mesh ref={shell} geometry={geometry}>
          <meshPhysicalMaterial
            ref={glass}
            color='#b9d0f4'
            metalness={0}
            roughness={0.045}
            roughnessMap={roughness}
            normalMap={normal}
            normalScale={[0.24, 0.24]}
            transmission={1}
            thickness={0.12}
            ior={1.18}
            reflectivity={0.3}
            clearcoat={0}
            envMapIntensity={2.2}
            onBeforeCompile={prepareGlass}
          />
        </mesh>
        {/* Preserve the artwork's fixed alignment with the shell geometry. */}
        <group ref={robotMotion} rotation={[0, 0.12, 0.085, 'ZYX']}>
          <mesh position={[0, 0.15, 0.65]} scale={[2, 2.3, 1]}>
            <planeGeometry />
            <meshBasicMaterial
              ref={glowMaterial}
              map={glow}
              transparent
              opacity={0.8}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.18, 0.64]} scale={[1.7, 1.7, 1]} renderOrder={10}>
            <planeGeometry />
            <meshBasicMaterial
              map={robot}
              color={[0.27, 0.57, 1.5]}
              alphaTest={0.1}
              transparent
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
        <group>
          <lineSegments geometry={veins}>
            <shaderMaterial
              ref={fractures}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              uniforms={veinUniforms}
              vertexShader={'varying vec3 vLocal; void main(){vLocal=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'}
              fragmentShader={'uniform float time,hover,pulse; uniform vec3 pointer; varying vec3 vLocal; void main(){float near=exp(-length(vLocal.xy-pointer.xy)*2.8); float scan=.5+.5*sin(vLocal.y*5.-time*2.2); float activation=pulse*(.35+.65*near); vec3 base=mix(vec3(.18,.45,1.),vec3(.75,.25,.9),smoothstep(.0,.8,vLocal.x-vLocal.y*.3)); vec3 color=mix(base,vec3(.55,.94,1.),clamp(near*hover+activation,0.,1.)); gl_FragColor=vec4(color,clamp(.38+hover*near*(.50+scan*.24)+activation*.65,0.,1.));\n#include <colorspace_fragment>\n}'}
            />
          </lineSegments>
        </group>
      </group>
      </group>
      </group>
    </group>
  )
}

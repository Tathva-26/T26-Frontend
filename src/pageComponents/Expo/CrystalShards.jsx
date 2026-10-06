'use client'
/* eslint-disable react-hooks/immutability -- The R3F frame loop updates Three objects and the shared mutable input ref. */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExpoDetails } from './ExpoDetails'
import { Color, IcosahedronGeometry, MathUtils, Object3D, Raycaster, Vector2, Vector3 } from 'three'
import { animationDelta } from './crystalInteraction.mjs'
import { shardMotion } from './expoShardMotion.mjs'

// Figma's asymmetric arrangement, expressed in the main crystal's local space.
const SHARDS = [
  [-1.45, .45, -.1, .20, -.65], [-1.75, -.45, -.2, .14, -.85],
  [1.45, .85, -.2, .14, -.65], [1.9, -.85, .1, .20, -.6],
  [2.65, -.65, -.2, .36, -.65], [-.55, -1.8, .1, .14, -.65],
]

export default function CrystalShards({ journey, compact, reduced, prepareGlass, target }) {
  const details = useExpoDetails()
  const mesh = useRef()
  const geometry = useMemo(() => new IcosahedronGeometry(1, 1), [])
  const dummy = useMemo(() => new Object3D(), [])
  const state = useRef(SHARDS.map(() => ({ x: 0, y: 0, hover: 0, spin: 0, pulse: 0 })))
  const timer = useRef(0)
  const activation = useRef(0)
  const boundsAt = useRef(-1)
  const choreography = useRef({})
  const picking = useMemo(() => ({ ray: new Raycaster(), pointer: new Vector2(), center: new Vector3(), color: new Color(), hits: [], last: -1, hit: -1 }), [])
  useEffect(() => {
    // Compile the colored instancing variant during warm-up, before the first
    // animation frame creates an instanceColor attribute.
    picking.color.setRGB(1, 1, 1)
    for (let index = 0; index < SHARDS.length; index++) mesh.current.setColorAt(index, picking.color)
  }, [picking])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(({ camera, size: viewport }, delta) => {
    const dt = animationDelta(delta)
    timer.current += dt
    const time = timer.current
    const visualTime = reduced ? 0 : time
    const pose = journey?.current
    const detail = details?.progress.current
    const reveal = (pose ? (pose.exit != null ? 1 - pose.exit : pose.interaction) : 1) * (1 - Math.min(1, (detail?.value ?? 0) / .42))
    const available = (pose?.progress ?? 1) >= 1 && !(pose?.exit > 0) && (!detail || detail.state === 'closed')
    const input = target.current
    mesh.current.visible = reveal > .005
    if (!mesh.current.visible) {
      // Consume input while occluded so closing details cannot replay a click.
      activation.current = input.activation
      input.shardHover = false
      picking.hit = -1
      return
    }
    const pending = input.activation !== activation.current
    const count = compact ? 4 : 6
    mesh.current.count = count
    if (available && (input.active || pending) && (pending || time - picking.last > (compact ? .05 : 1 / 30))) {
      picking.last = time
      mesh.current.updateWorldMatrix(true, false)
      picking.pointer.set(input.x, input.y)
      picking.ray.setFromCamera(picking.pointer, camera)
      picking.hits.length = 0
      picking.ray.intersectObject(mesh.current, false, picking.hits)
      picking.hit = picking.hits[0]?.instanceId ?? -1
    } else if (!available || !input.active) picking.hit = -1
    input.shardHover = picking.hit >= 0
    if (pending) {
      activation.current = input.activation
      if (available && !input.keyboard && picking.hit >= 0) {
        const shard = state.current[picking.hit]
        if (!reduced) shard.spin += Math.PI
        shard.pulse = 1
        input.shardResonance = (input.shardResonance ?? 0) + 1
      }
    }
    SHARDS.forEach(([x, y, z, size, angle], index) => {
      if (index >= count) return
      const shard = state.current[index]
      picking.center.set(x, y, z).applyMatrix4(mesh.current.matrixWorld).project(camera)
      const dx = (input.x - picking.center.x) * viewport.width / 2
      const dy = (input.y - picking.center.y) * viewport.height / 2
      const reach = compact ? 80 : 150
      const proximity = available && input.active ? Math.max(0, 1 - Math.hypot(dx, dy) / reach) : 0
      const weight = 5 + (1 - size) * 4
      shard.x = MathUtils.damp(shard.x, MathUtils.clamp(dx / reach, -1, 1) * proximity * .10, weight, dt)
      shard.y = MathUtils.damp(shard.y, MathUtils.clamp(dy / reach, -1, 1) * proximity * .10, weight, dt)
      shard.hover = MathUtils.damp(shard.hover, available && picking.hit === index ? 1 : 0, 9, dt)
      shard.spin = MathUtils.damp(shard.spin, 0, 3, dt)
      shard.pulse = MathUtils.damp(shard.pulse, 0, 4, dt)
      const motion = available ? 1 : Math.max(0, 1 - (detail?.value ?? 0) * 5) * (pose?.interaction ?? 1)
      const flight = shardMotion(pose?.progress ?? 1, detail?.value ?? 0, index, reduced, choreography.current)
      dummy.position.set(x * flight.spread + shard.x * motion, y * flight.spread + flight.rise + (shard.y + Math.sin(visualTime * .8 + index) * .025) * motion, z)
      dummy.rotation.set(.4 + shard.y * motion, index * .8 + flight.turn + (shard.spin + Math.sin(visualTime * .5 + index) * .06) * motion, angle - shard.x * motion)
      const scale = reveal * (1 + shard.hover * .04 + shard.pulse * .04)
      dummy.scale.set(size * .55 * scale, size * 1.5 * scale, size * .48 * scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
      picking.color.setRGB(1 + shard.hover * .25 + shard.pulse * .35, 1 + shard.hover * .3 + shard.pulse * .2, 1 + shard.hover * .35 + shard.pulse * .4)
      mesh.current.setColorAt(index, picking.color)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.instanceColor.needsUpdate = true
    // Raycasting needs fresh bounds only at the same cadence as surface picking.
    if (time - boundsAt.current > (compact ? .05 : 1 / 30)) {
      mesh.current.computeBoundingSphere()
      boundsAt.current = time
    }
  })
  return <instancedMesh name='expo-shards' ref={mesh} args={[geometry, undefined, 6]} frustumCulled={false}>
    <meshPhysicalMaterial color='#a9bbff' metalness={.1} roughness={.08} transmission={.85} thickness={.25} ior={1.5} envMapIntensity={4.5} onBeforeCompile={prepareGlass} flatShading />
  </instancedMesh>
}

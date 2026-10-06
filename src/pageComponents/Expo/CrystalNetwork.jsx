'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, MathUtils } from 'three'
import { animationDelta } from './crystalInteraction.mjs'
import { useExpoDetails } from './ExpoDetails'

// Fixed connections keep geometry uploads and neighbour searches out of frames.
export default function CrystalNetwork({ target, reduced, compact }) {
  const root = useRef(null)
  const lines = useRef(null)
  const points = useRef(null)
  const state = useRef({ time: 0, pulse: 0, activation: 0 })
  const details = useExpoDetails()
  const geometry = useMemo(() => {
    const vertices = []
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6
      vertices.push(Math.cos(angle) * (.64 + .09 * Math.sin(index * 2.3)), Math.sin(angle) * 1.16, -.08 + .10 * Math.cos(index * 1.7))
    }
    const edges = []
    for (let index = 0; index < 12; index++) {
      edges.push(...vertices.slice(index * 3, index * 3 + 3), ...vertices.slice((index + 1) % 12 * 3, (index + 1) % 12 * 3 + 3))
      if (index % 2 === 0) edges.push(...vertices.slice(index * 3, index * 3 + 3), ...vertices.slice((index + 3) % 12 * 3, (index + 3) % 12 * 3 + 3))
    }
    const dots = new BufferGeometry()
    dots.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    const links = new BufferGeometry()
    links.setAttribute('position', new Float32BufferAttribute(edges, 3))
    return { dots, links }
  }, [])
  useEffect(() => () => { geometry.dots.dispose(); geometry.links.dispose() }, [geometry])
  useFrame((_, delta) => {
    const dt = animationDelta(delta)
    const detail = details?.progress.current.value ?? 0
    root.current.visible = detail < .62
    if (!root.current.visible) { state.current.activation = target.current.activation; return }
    if (!reduced) state.current.time += dt
    if (state.current.activation !== target.current.activation) {
      state.current.activation = target.current.activation
      state.current.pulse = reduced ? 0 : 1
    }
    state.current.pulse = MathUtils.damp(state.current.pulse, 0, 4, dt)
    const pulse = Math.max(state.current.pulse, reduced ? 0 : Math.sin(Math.min(1, detail / .3) * Math.PI))
    const fade = 1 - Math.min(1, detail / .62)
    lines.current.opacity = (.10 + pulse * .25) * fade
    points.current.opacity = (.38 + pulse * .35) * fade
    root.current.rotation.z = reduced ? 0 : Math.sin(state.current.time * .18) * .045
    // Same materials across quality changes: no shader or asset replacement.
    geometry.links.setDrawRange(0, compact ? 24 : 36)
    geometry.dots.setDrawRange(0, compact ? 8 : 12)
  })
  return <group ref={root} position={[0, 0, .12]}>
    {/* Transmission glass writes depth; draw this faint internal emission after
        the shell, while keeping the robot's later render order unobstructed. */}
    <lineSegments geometry={geometry.links} renderOrder={3}>
      <lineBasicMaterial ref={lines} color='#65d7ff' transparent opacity={.1} depthTest={false} depthWrite={false} blending={AdditiveBlending} />
    </lineSegments>
    <points geometry={geometry.dots} renderOrder={3}>
      <pointsMaterial ref={points} color='#b2eaff' size={.025} transparent opacity={.38} depthTest={false} depthWrite={false} blending={AdditiveBlending} />
    </points>
  </group>
}

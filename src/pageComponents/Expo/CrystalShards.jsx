'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { IcosahedronGeometry, Object3D } from 'three'

// Figma's asymmetric arrangement, expressed in the main crystal's local space.
const SHARDS = [
  [-1.45, .45, -.1, .20, -.65], [-1.75, -.45, -.2, .14, -.85],
  [1.45, .85, -.2, .14, -.65], [1.9, -.85, .1, .20, -.6],
  [2.65, -.65, -.2, .36, -.65], [-.55, -1.8, .1, .14, -.65],
]

export default function CrystalShards({ journey, compact, prepareGlass }) {
  const mesh = useRef()
  const geometry = useMemo(() => new IcosahedronGeometry(1, 1), [])
  const dummy = useMemo(() => new Object3D(), [])
  const previous = useRef({ reveal: -1, count: 0 })
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(() => {
    const pose = journey?.current
    const reveal = pose ? (pose.exit != null ? 1 - pose.exit : pose.interaction) : 1
    const count = compact ? 4 : 6
    if (previous.current.reveal === reveal && previous.current.count === count) return
    previous.current = { reveal, count }
    mesh.current.count = count
    SHARDS.forEach(([x, y, z, size, angle], index) => {
      dummy.position.set(x, y, z)
      dummy.rotation.set(.4, index * .8, angle)
      dummy.scale.set(size * .55 * reveal, size * 1.5 * reveal, size * .48 * reveal)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.visible = reveal > .005
  })
  return <instancedMesh ref={mesh} args={[geometry, undefined, 6]} frustumCulled={false}>
    <meshPhysicalMaterial color='#a9bbff' metalness={.1} roughness={.08} transmission={.85} thickness={.25} ior={1.5} envMapIntensity={4.5} onBeforeCompile={prepareGlass} flatShading />
  </instancedMesh>
}

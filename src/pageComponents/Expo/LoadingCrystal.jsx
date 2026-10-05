'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { createCrystalGeometry } from './crystalGeometry.mjs'
import { journeyScreenPoint } from './expoJourney.mjs'

// No downloads, decoders, environment map or transmission pass are required.
// This lives in Suspense's fallback and disappears when the real assets commit.
export default function LoadingCrystal({ journey, target, reduced }) {
  const group = useRef(null)
  const point = useRef({})
  const time = useRef(0)
  const geometry = useMemo(() => createCrystalGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(({ camera, size }, delta) => {
    const body = group.current
    const pose = journey?.current
    time.current += Math.min(delta, .05)
    body.visible = !pose || pose.opacity > .005
    camera.position.set(0, 0, 8)
    camera.lookAt(0, 0, 0)
    if (pose?.layout) {
      const position = journeyScreenPoint(pose, pose.layout, point.current)
      const halfHeight = Math.tan(camera.fov * Math.PI / 360) * (8 - pose.depth)
      body.position.set((position.x / size.width * 2 - 1) * halfHeight * size.width / size.height, (1 - position.y / size.height * 2) * halfHeight, pose.depth)
      body.scale.setScalar(Math.tan(camera.fov * Math.PI / 360) * 16 * pose.layout.slotHeight / size.height / 3.8 * pose.scale)
    }
    const influence = pose?.interaction ?? 1
    body.rotation.set((pose?.pitch ?? 0) + target.current.tiltX * influence, (pose?.yaw ?? 0) + target.current.tiltY * influence + (reduced ? 0 : Math.sin(time.current * .5) * .04 * influence), pose?.roll ?? 0)
  })
  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshPhongMaterial color="#6b9fce" emissive="#071727" transparent opacity={.48} shininess={100} flatShading depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, .1]} scale={[.55, .55, .55]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#168aff" wireframe transparent opacity={.7} />
      </mesh>
    </group>
  )
}

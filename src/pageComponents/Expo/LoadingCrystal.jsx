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
        <meshPhongMaterial color="#263b65" specular="#b7d7f5" emissive="#061126" transparent opacity={.62} shininess={110} flatShading depthWrite={false} />
      </mesh>
      {/* Asset-free robot proxy keeps the loading exhibit recognisable. */}
      <group position={[0, .18, .5]} rotation={[0, .12, .085]}>
        <mesh scale={[.49, .44, .25]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#126fff" />
        </mesh>
        <mesh position={[0, -.035, .24]} scale={[.35, .20, .06]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshBasicMaterial color="#061337" />
        </mesh>
        {[-1, 1].map(side => <group key={side}>
          <mesh position={[side * .51, 0, 0]} scale={[.09, .19, .12]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#168aff" />
          </mesh>
          <mesh position={[side * .15, -.015, .30]} scale={[.075, .04, .015]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#6dddff" />
          </mesh>
        </group>)}
      </group>
    </group>
  )
}

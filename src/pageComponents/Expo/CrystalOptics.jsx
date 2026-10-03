'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { HalfFloatType, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, UnsignedByteType, Vector2, WebGLRenderTarget } from 'three'
import { useExpoDetails } from './ExpoDetails'
import { detailMotion } from './expoDetailMotion.mjs'

export default function CrystalOptics({ compact }) {
  const details = useExpoDetails()
  const target = useRef(null)
  const passRef = useRef(null)
  const pass = useMemo(() => {
    const material = new ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { source: { value: null }, amount: { value: 0 }, center: { value: new Vector2(.5, .5) }, aspect: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `
        uniform sampler2D source;
        uniform float amount, aspect;
        uniform vec2 center;
        varying vec2 vUv;
        void main(){
          vec2 delta=vUv-center;
          float radius=length(delta*vec2(aspect,1.));
          float weight=(1.-smoothstep(.08,.65,radius))*amount;
          vec2 bent=vUv-delta*weight*.16;
          vec2 split=delta*weight*.022;
          vec4 base=texture2D(source,bent);
          vec4 red=texture2D(source,bent+split);
          vec4 blue=texture2D(source,bent-split);
          vec4 smear=texture2D(source,bent-delta*weight*.045);
          float alpha=max(base.a,max(red.a,blue.a));
          vec3 color=vec3(red.r,base.g,blue.b);
          color=mix(color,smear.rgb,weight*.18);
          gl_FragColor=vec4(color,alpha);
          #include <colorspace_fragment>
        }`,
    })
    const geometry = new PlaneGeometry(2, 2)
    const scene = new Scene()
    scene.add(new Mesh(geometry, material))
    return { material, geometry, scene, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1) }
  }, [])
  useEffect(() => {
    passRef.current = pass
    return () => { target.current?.dispose(); target.current = null; pass.material.dispose(); pass.geometry.dispose(); passRef.current = null }
  }, [pass])
  // Positive priority owns rendering. Idle takes the exact normal one-render path.
  useFrame(({ gl, scene, camera, size }) => {
    const pass = passRef.current
    const detail = details?.progress.current
    const amount = detailMotion(detail?.value ?? 0, detail?.reduced).optical
    const canvas = gl.domElement
    const mode = pass && amount > .001 ? 'active' : 'idle'
    if (canvas.dataset.expoOptics !== mode) canvas.dataset.expoOptics = mode
    if (!pass || amount <= .001) { gl.render(scene, camera); return }
    if (!target.current) target.current = new WebGLRenderTarget(1, 1, { type: gl.extensions.has('EXT_color_buffer_float') ? HalfFloatType : UnsignedByteType, depthBuffer: true })
    const ratio = compact ? .65 : Math.min(gl.getPixelRatio(), 1.25)
    const width = Math.max(1, Math.round(size.width * ratio))
    const height = Math.max(1, Math.round(size.height * ratio))
    if (target.current.width !== width || target.current.height !== height) target.current.setSize(width, height)
    const uniforms = pass.material.uniforms
    uniforms.source.value = target.current.texture
    uniforms.amount.value = amount * (compact ? .75 : 1)
    uniforms.center.value.set(detail?.centerX ?? .5, detail?.centerY ?? .5)
    uniforms.aspect.value = size.width / Math.max(1, size.height)
    const previous = gl.getRenderTarget()
    try {
      gl.setRenderTarget(target.current)
      gl.render(scene, camera)
      gl.setRenderTarget(previous)
      gl.render(pass.scene, pass.camera)
    } finally { gl.setRenderTarget(previous) }
  }, 1)
  return null
}

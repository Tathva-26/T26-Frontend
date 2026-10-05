'use client'
/* eslint-disable react-hooks/immutability -- Three's renderer info and canvas are mutable objects; optional diagnostics update them outside React. */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { HalfFloatType, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, UnsignedByteType, Vector2, WebGLRenderTarget } from 'three'
import { useExpoDetails } from './ExpoDetails'
import { detailMotion } from './expoDetailMotion.mjs'

export default function CrystalOptics({ compact, warmupReady, assetsMounted, onFailure, journey }) {
  const gl = useThree(state => state.gl)
  const details = useExpoDetails()
  const target = useRef(null)
  const passRef = useRef(null)
  const motionResult = useRef({})
  const profile = useRef(null)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('expoProfile') !== '1') return
    const previous = gl.info.autoReset
    gl.info.autoReset = false
    profile.current = { seconds: 0, frames: 0, calls: 0, triangles: 0, cpu: 0, peak: 0, stage: '' }
    return () => {
      profile.current = null
      gl.info.autoReset = previous
      delete gl.domElement.dataset.expoProfile
    }
  }, [gl])
  const record = (sample, delta, started, stage) => {
    if (!sample || !Number.isFinite(delta) || delta <= 0 || delta > .15) return
    sample.seconds += delta; sample.frames++
    sample.calls += gl.info.render.calls; sample.triangles += gl.info.render.triangles
    sample.cpu += performance.now() - started; sample.peak = Math.max(sample.peak, delta * 1000)
    if (sample.seconds < 1) return
    gl.domElement.dataset.expoProfile = JSON.stringify({
      stage, fps: Math.round(sample.frames / sample.seconds),
      frameMs: Number((sample.seconds * 1000 / sample.frames).toFixed(2)),
      peakFrameMs: Number(sample.peak.toFixed(2)),
      calls: Number((sample.calls / sample.frames).toFixed(1)),
      triangles: Math.round(sample.triangles / sample.frames),
      cpuSubmissionMs: Number((sample.cpu / sample.frames).toFixed(2)),
      dpr: gl.getPixelRatio(), transmissionScale: gl.transmissionResolutionScale,
    })
    sample.seconds = sample.frames = sample.calls = sample.triangles = sample.cpu = sample.peak = 0
  }
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
          // Angular wedges create a reversible fracture fan around the crystal.
          // No additional texture samples or rendering passes are required.
          vec2 physical=delta*vec2(aspect,1.);
          float angle=dot(physical,physical)<.00000001 ? 0. : atan(physical.y,physical.x);
          float seam=1.-smoothstep(.015,.11,abs(sin(angle*3.+radius*7.)));
          float weight=(1.-smoothstep(.08,.65,radius))*amount;
          float facet=step(0.,sin(angle*3.+radius*7.))*2.-1.;
          vec2 tangent=vec2(-physical.y,physical.x)/vec2(aspect,1.);
          vec2 bent=vUv-delta*weight*.11+tangent*facet*weight*.045;
          vec2 split=delta*weight*(.012+seam*.018);
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
  useEffect(() => {
    let cancelled = false
    gl.compileAsync(pass.scene, pass.camera).catch(() => { if (!cancelled) onFailure?.() })
    return () => { cancelled = true }
  }, [gl, pass, onFailure])
  // Positive priority owns rendering. Idle takes the exact normal one-render path.
  useFrame(({ gl, scene, camera, size }, delta) => {
    // Render the procedural loading scene while downloads run. During shader
    // compilation retain that frame instead of drawing incomplete materials.
    if (warmupReady && !warmupReady.current && assetsMounted?.current) return
    const sample = profile.current
    const stage = details?.progress.current.state !== 'closed' && details?.progress.current.state ? 'details' :
      journey?.current.exit > 0 ? 'exit' : (journey?.current.progress ?? 1) < 1 ? 'entry' : 'idle'
    if (sample) {
      gl.info.reset()
      if (sample.stage !== stage) {
        sample.seconds = sample.frames = sample.calls = sample.triangles = sample.cpu = sample.peak = 0
        sample.stage = stage
      }
    }
    const started = sample ? performance.now() : 0
    const pass = passRef.current
    const detail = details?.progress.current
    const amount = detailMotion(detail?.value ?? 0, detail?.reduced, motionResult.current).optical
    const canvas = gl.domElement
    const mode = pass && amount > .001 ? 'active' : 'idle'
    if (canvas.dataset.expoOptics !== mode) canvas.dataset.expoOptics = mode
    if (!pass || amount <= .001) { gl.render(scene, camera); record(sample, delta, started, stage); return }
    if (!target.current) target.current = new WebGLRenderTarget(1, 1, { type: gl.extensions.has('EXT_color_buffer_float') ? HalfFloatType : UnsignedByteType, depthBuffer: true })
    const ratio = compact ? .65 : Math.min(gl.getPixelRatio(), 1.25)
    const width = Math.max(1, Math.round(size.width * ratio))
    const height = Math.max(1, Math.round(size.height * ratio))
    if (target.current.width !== width || target.current.height !== height) target.current.setSize(width, height)
    const uniforms = pass.material.uniforms
    if (uniforms.source.value !== target.current.texture) uniforms.source.value = target.current.texture
    uniforms.amount.value = amount * (compact ? .75 : 1)
    const centerX = detail?.centerX ?? .5, centerY = detail?.centerY ?? .5
    if (uniforms.center.value.x !== centerX || uniforms.center.value.y !== centerY) uniforms.center.value.set(centerX, centerY)
    const aspect = size.width / Math.max(1, size.height)
    if (uniforms.aspect.value !== aspect) uniforms.aspect.value = aspect
    const previous = gl.getRenderTarget()
    try {
      gl.setRenderTarget(target.current)
      gl.render(scene, camera)
      gl.setRenderTarget(previous)
      gl.render(pass.scene, pass.camera)
    } finally { gl.setRenderTarget(previous) }
    record(sample, delta, started, stage)
  }, 1)
  return null
}

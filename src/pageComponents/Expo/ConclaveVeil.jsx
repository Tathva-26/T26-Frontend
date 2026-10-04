'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader, Vector2 } from 'three'

// A screen-space cloud pass overlaps the outgoing DOM poster and incoming
// crystal, using the actual TechConclave background for refracted fragments.
export default function ConclaveVeil({ journey }) {
  const material = useRef(null)
  const background = useLoader(TextureLoader, '/images/techconclave/background.webp')
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uProgress: { value: 0 }, uExit: { value: 0 },
    uAspect: { value: 1 }, uImageAspect: { value: background.image.width / background.image.height },
    uBackground: { value: background }, uOrigin: { value: new Vector2(.3, .5) },
  }), [background])
  useFrame(({ clock, size }) => {
    if (!material.current) return
    const live = material.current.uniforms
    const pose = journey.current
    live.uTime.value = clock.elapsedTime
    live.uProgress.value = pose.progress
    live.uExit.value = pose.exit ?? 0
    live.uAspect.value = size.width / size.height
    if (pose.layout) {
      live.uOrigin.value.set(pose.layout.startX / size.width, 1 - pose.layout.startY / size.height)
    }
  })
  return <mesh renderOrder={100} frustumCulled={false}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial ref={material} transparent depthTest={false} depthWrite={false} uniforms={uniforms}
      vertexShader={'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }'}
      fragmentShader={`
        varying vec2 vUv;
        uniform float uTime,uProgress,uExit,uAspect,uImageAspect;
        uniform sampler2D uBackground;
        uniform vec2 uOrigin;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
        float fbm(vec2 p){float a=.5,n=0.;for(int i=0;i<4;i++){n+=noise(p)*a;p=p*2.03+vec2(3.7,8.1);a*=.5;}return n;}
        void main(){
          float envelope=smoothstep(.03,.23,uProgress)*(1.-smoothstep(.42,.72,uProgress));
          if(uExit>0.)envelope=smoothstep(.16,.50,uExit)*(1.-smoothstep(.68,1.,uExit));
          if(envelope<.001)discard;
          vec2 p=vUv*vec2(uAspect,1.);
          float cloud=fbm(p*3.4+vec2(uTime*.045,-uTime*.025)+uProgress*vec2(-1.3,1.8));
          float detail=fbm(p*7.2-vec2(uTime*.035,uTime*.015));
          // The foreground bank covers the reveal, then breaks into moving
          // wisps. Its edge is a noise contour, never a circle or ellipse.
          float opening=smoothstep(.18,.40,uProgress);
          if(uExit>0.)opening=1.-smoothstep(.20,.56,uExit);
          float front=smoothstep(.20+opening*.42,.39+opening*.42,cloud*.8+detail*.2+envelope*.20);
          vec2 displacement=vec2(cloud-.5,detail-.5)*envelope*.045;
          vec2 cover=vec2(min(1.,uAspect/uImageAspect),min(1.,uImageAspect/uAspect));
          vec2 imageUv=(vUv-.5)*cover+.5+displacement;
          vec3 art=texture2D(uBackground,imageUv).rgb;
          float core=exp(-length((vUv-uOrigin)*vec2(uAspect,1.))*5.);
          vec3 cloudColor=mix(vec3(.15,.22,.31),vec3(.55,.66,.75),smoothstep(.28,.70,cloud));
          cloudColor=mix(cloudColor,cloudColor*vec3(.62,.48,.76),smoothstep(0.,.75,uExit));
          vec3 color=mix(art*.35,cloudColor,.86)+vec3(.12,.36,.50)*core*envelope;
          // The departure must not resurrect fragments of the old poster.
          color=mix(color,cloudColor,smoothstep(0.,.20,uExit));
          float rim=smoothstep(.36,.48,cloud)*(1.-smoothstep(.48,.62,cloud));
          color+=vec3(.12,.20,.25)*rim*envelope;
          float thinning=1.-smoothstep(.25,.46,uProgress)*.75;
          if(uExit>0.)thinning=.85;
          gl_FragColor=vec4(color,front*envelope*.96*thinning);
          #include <colorspace_fragment>
        }
      `} />
  </mesh>
}

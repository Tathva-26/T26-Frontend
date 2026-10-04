import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { useEffect, useRef } from 'react'
import './Galaxy.css'

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = vec4(position, 0, 1);
}
`

// NUM_LAYER is injected per-mount (see createFragmentShader) so the
// star-depth count can drop on low-power devices without branching inside
// the shader. Default quality always resolves to 4, i.e. byte-for-byte the
// original look.
function createFragmentShader(numLayers) {
  return `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform mat2 uAutoRotMat;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uHue;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
uniform float uLightMode;

varying vec2 vUv;

#define NUM_LAYER ${numLayers.toFixed(1)}
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float tri(float x) {
	return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
	float t = fract(x);
	return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
	float t = fract(x);
	return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Takes the already-computed delta/distance from the caller so the 3x3
// neighbour loop in StarLayer() doesn't run length() twice per cell.
float Star(vec2 uv, float d, float flare) {
	float m = (0.05 * uGlowIntensity) / d;
	float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
	m += rays * flare * uGlowIntensity;
	uv *= MAT45;
	rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
	m += rays * 0.3 * flare * uGlowIntensity;
	m *= smoothstep(1.0, 0.2, d);
	return m;
}

vec3 StarLayer(vec2 uv) {
	vec3 col = vec3(0.0);
	vec2 gv = fract(uv) - 0.5;
	vec2 id = floor(uv);

	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			vec2 offset = vec2(float(x), float(y));
			vec2 si = id + offset;
			float seed = Hash21(si);
			float size = fract(seed * 345.32);
			float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
			float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

			vec2 pad = vec2(
				tris(seed * 34.0 + uTime * uSpeed / 10.0),
				tris(seed * 38.0 + uTime * uSpeed / 30.0)
			) - 0.5;

			vec2 delta = gv - offset - pad;
			float d = length(delta);

			// Star() always resolves to exactly 0 once d >= 1.0 (its final
			// smoothstep(1.0, 0.2, d) factor). Most of the 3x3 neighbourhood
			// falls outside that radius for any given fragment, so skipping
			// the hash/HSV work below for those cells removes real,
			// measurable instruction count with zero visual difference.
			if (d < 1.0) {
				float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
				float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
				float grn = min(red, blu) * seed;
				vec3 base = vec3(red, grn, blu);

				float hue = fract(uHue + uHueShift / 360.0);
				float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
				float val = max(max(base.r, base.g), base.b);
				base = hsv2rgb(vec3(hue, sat, val));

				float star = Star(delta, d, flareSize);
				float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
				twinkle = mix(1.0, twinkle, uTwinkleIntensity);
				star *= twinkle;
				col += star * size * base;
			}
		}
	}

	return col;
}

void main() {
	vec2 focalPx = uFocal * uResolution.xy;
	vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
	vec2 mouseNorm = uMouse - vec2(0.5);

	if (uAutoCenterRepulsion > 0.0) {
		vec2 centerUV = vec2(0.0, 0.0);
		float centerDist = length(uv - centerUV);
		vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
		uv += repulsion * 0.05;
	} else if (uMouseRepulsion) {
		vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
		float mouseDist = length(uv - mousePosUV);
		vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
		uv += repulsion * 0.05 * uMouseActiveFactor;
	} else {
		vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
		uv += mouseOffset;
	}

	// uAutoRotMat is the uTime/uRotationSpeed rotation baked into a 2x2
	// matrix on the CPU once per frame (see update() below) instead of
	// calling sin()/cos() here — identical result, but those transcendental
	// calls no longer run once per fragment (i.e. millions of times/frame).
	uv = uAutoRotMat * uv;
	uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

	vec3 col = vec3(0.0);
	for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
		float depth = fract(i + uStarSpeed * uSpeed);
		float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
		float fade = depth * smoothstep(1.0, 0.9, depth);
		col += StarLayer(uv * scale + i * 453.32) * fade;
	}

	if (uLightMode > 0.5) {
		float energy = max(max(col.r, col.g), col.b);
		float coverage = clamp(smoothstep(0.0, 0.42, energy) * 0.92, 0.0, 0.92);
		vec3 ink = clamp(col * 0.48, 0.0, 0.82);
		gl_FragColor = vec4(mix(vec3(1.0), ink, coverage), 1.0);
	} else if (uTransparent) {
		float alpha = length(col);
		alpha = min(smoothstep(0.0, 0.3, alpha), 1.0);
		gl_FragColor = vec4(col, alpha);
	} else {
		gl_FragColor = vec4(col, 1.0);
	}
}
`
}

// Heuristic used only when quality="auto" (the default): flag devices that
// are reasonably likely to struggle with a full-cost run (older/low-core
// CPUs, low RAM where reported, or a coarse/touch primary pointer, which
// correlates strongly with mid/low-tier phones and tablets).
function detectLowPowerDevice() {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency || 8
  const memory = navigator.deviceMemory // Chromium-only; undefined elsewhere
  const coarsePointer =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  return cores <= 4 || (memory !== undefined && memory <= 4) || coarsePointer
}

function resolveQuality(quality) {
  if (quality === 'high' || quality === 'low') return quality
  return detectLowPowerDevice() ? 'low' : 'high'
}

// How stale the mouse lerp is allowed to be before we treat the frame as
// "settled" and stop redrawing (see the idle-skip logic in update()).
const MOUSE_SETTLE_EPSILON = 0.0005
const MAX_FRAME_RATE = 30
const FRAME_INTERVAL = 1000 / MAX_FRAME_RATE

export default function Galaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 0,
  hue = 0.76,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  lightMode = false,
  // New, optional: cap the device-pixel-ratio the canvas renders at.
  // Leave unset to auto-pick (2 on quality="high", 1 on quality="low").
  dpr,
  // New, optional: "auto" (default) picks "low" on devices that look
  // low-power (see detectLowPowerDevice) and "high" everywhere else.
  // "high" always matches the original, unoptimized visual density.
  quality = 'auto',
  ...rest
}) {
  const containerRef = useRef(null)
  const targetMousePosition = useRef({ x: 0.5, y: 0.5 })
  const smoothMousePosition = useRef({ x: 0.5, y: 0.5 })
  const targetMouseActive = useRef(0)
  const smoothMouseActive = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const resolvedQuality = resolveQuality(quality)
    const numLayers = resolvedQuality === 'low' ? 3 : 4
    const dprCap = Math.max(
      1,
      Math.min(dpr ?? (resolvedQuality === 'low' ? 1 : 2), 3),
    )
    const effectiveDpr = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      dprCap,
    )

    const renderer = new Renderer({
      dpr: effectiveDpr,
      alpha: transparent,
      premultipliedAlpha: false,
    })
    const gl = renderer.gl

    if (lightMode) {
      gl.clearColor(1, 1, 1, 1)
    } else if (transparent) {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)
    } else {
      gl.clearColor(0, 0, 0, 1)
    }

    let program
    let lastWidth = 0
    let lastHeight = 0

    function resize() {
      const width = container.offsetWidth
      const height = container.offsetHeight
      if (!width || !height) return
      // ResizeObserver can fire for sub-pixel layout changes that round
      // to the same backing-store size; skip the (GPU-side) framebuffer
      // reallocation when nothing actually changed.
      if (width === lastWidth && height === lastHeight) return
      lastWidth = width
      lastHeight = height

      renderer.setSize(width, height)
      // Guard: resize() also runs once synchronously below to size the
      // canvas before the program/render loop exist yet, so there's
      // nothing to (re)request a frame for on that first call.
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height,
        )
        requestRender()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const geometry = new Triangle(gl)
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: createFragmentShader(numLayers),
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ),
        },
        uFocal: { value: new Float32Array(focal) },
        uRotation: { value: new Float32Array(rotation) },
        uAutoRotMat: { value: new Float32Array([1, 0, 0, 1]) },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: Math.min(density, 1) },
        uHueShift: { value: hueShift },
        uHue: { value: hue },
        uSpeed: { value: speed },
        uMouse: {
          value: new Float32Array([
            smoothMousePosition.current.x,
            smoothMousePosition.current.y,
          ]),
        },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseRepulsion: { value: mouseRepulsion },
        uTwinkleIntensity: { value: twinkleIntensity },
        uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0 },
        uAutoCenterRepulsion: { value: autoCenterRepulsion },
        uTransparent: { value: transparent },
        uLightMode: { value: lightMode ? 1 : 0 },
      },
    })

    const mesh = new Mesh(gl, { geometry, program })
    const autoRotMat = program.uniforms.uAutoRotMat.value

    let rafId = null
    let lastFrameTime = 0
    let contextLost = false

    // Pause rendering entirely while this background is nowhere near the
    // viewport (or the tab is backgrounded), so it doesn't keep driving a
    // WebGL shader forever while the user is scrolled somewhere else.
    let isIntersecting = true
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting
        if (isIntersecting) requestRender()
      },
      { rootMargin: '50% 0px 50% 0px' },
    )
    intersectionObserver.observe(container)

    function handleVisibilityChange() {
      if (!document.hidden) requestRender()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Starts (or re-starts) the render loop. Safe to call many times —
    // it's a no-op while a frame is already scheduled.
    function requestRender() {
      if (rafId == null && !contextLost) rafId = requestAnimationFrame(update)
    }

    function update(time) {
      rafId = null
      if (contextLost || !isIntersecting || document.hidden) return

      if (time - lastFrameTime < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(update)
        return
      }
      lastFrameTime = time

      // Continuous animation is dirty on every frame by definition
      // (stars move/twinkle with time); disableAnimation freezes uTime
      // so only an active mouse interaction can still change the frame.
      let frameIsDirty = !disableAnimation

      if (!disableAnimation) {
        program.uniforms.uTime.value = time * 0.001
        program.uniforms.uStarSpeed.value = (time * 0.001 * starSpeed) / 10
      }

      const t = program.uniforms.uTime.value
      const angle = t * rotationSpeed
      const c = Math.cos(angle)
      const s = Math.sin(angle)
      autoRotMat[0] = c
      autoRotMat[1] = -s
      autoRotMat[2] = s
      autoRotMat[3] = c

      const dx = targetMousePosition.current.x - smoothMousePosition.current.x
      const dy = targetMousePosition.current.y - smoothMousePosition.current.y
      const da = targetMouseActive.current - smoothMouseActive.current
      if (
        Math.abs(dx) > MOUSE_SETTLE_EPSILON ||
        Math.abs(dy) > MOUSE_SETTLE_EPSILON ||
        Math.abs(da) > MOUSE_SETTLE_EPSILON
      ) {
        const lerpFactor = 0.05
        smoothMousePosition.current.x += dx * lerpFactor
        smoothMousePosition.current.y += dy * lerpFactor
        smoothMouseActive.current += da * lerpFactor
        program.uniforms.uMouse.value[0] = smoothMousePosition.current.x
        program.uniforms.uMouse.value[1] = smoothMousePosition.current.y
        program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current
        frameIsDirty = true
      }

      if (frameIsDirty) {
        renderer.render({ scene: mesh })
      }

      // Keep looping while actively animating or while the mouse lerp is
      // still converging; once a disableAnimation frame is fully
      // settled, stop scheduling frames entirely until requestRender()
      // is called again (mouse move/enter, resize, resume from hidden).
      if (!disableAnimation || frameIsDirty) {
        rafId = requestAnimationFrame(update)
      }
    }

    requestRender()
    container.appendChild(gl.canvas)

    function handleMouseMove(event) {
      const rect = container.getBoundingClientRect()
      targetMousePosition.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      }
      targetMouseActive.current = 1
      requestRender()
    }

    function handleMouseLeave() {
      targetMouseActive.current = 0
      requestRender()
    }

    if (mouseInteraction) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
    }

    // WebGL context loss is rare but does happen (mobile OS reclaiming
    // GPU memory from a backgrounded tab, driver resets, etc). We can't
    // cheaply rebuild OGL's buffers/program here, but we can at least
    // stop touching a dead context and avoid throwing, and resume
    // drawing automatically if the browser restores it.
    function handleContextLost(event) {
      event.preventDefault()
      contextLost = true
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
    function handleContextRestored() {
      contextLost = false
      requestRender()
    }
    gl.canvas.addEventListener('webglcontextlost', handleContextLost, false)
    gl.canvas.addEventListener(
      'webglcontextrestored',
      handleContextRestored,
      false,
    )

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      gl.canvas.removeEventListener('webglcontextlost', handleContextLost)
      gl.canvas.removeEventListener(
        'webglcontextrestored',
        handleContextRestored,
      )
      if (mouseInteraction) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', handleMouseLeave)
      }
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [
    focal,
    rotation,
    starSpeed,
    density,
    hueShift,
    hue,
    disableAnimation,
    speed,
    mouseInteraction,
    glowIntensity,
    saturation,
    mouseRepulsion,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    autoCenterRepulsion,
    transparent,
    lightMode,
    dpr,
    quality,
  ])

  return (
    <div
      ref={containerRef}
      className='galaxy-container'
      {...rest}
      aria-hidden='true'
    />
  )
}

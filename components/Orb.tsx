'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export type OrbState =
  | 'idle'
  | 'wake'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'cut'

/** Where each state pulls the shader uniforms. Everything eases toward these. */
const TARGETS: Record<
  OrbState,
  { amp: number; speed: number; wave: number; glow: number; scale: number }
> = {
  idle: { amp: 0.1, speed: 0.16, wave: 0.0, glow: 0.78, scale: 1.0 },
  wake: { amp: 0.34, speed: 0.95, wave: 0.0, glow: 1.7, scale: 1.15 },
  listening: { amp: 0.15, speed: 0.34, wave: 0.05, glow: 0.95, scale: 1.05 },
  thinking: { amp: 0.23, speed: 1.6, wave: 0.0, glow: 1.15, scale: 1.0 },
  speaking: { amp: 0.16, speed: 0.5, wave: 0.3, glow: 1.35, scale: 1.06 },
  cut: { amp: 0.02, speed: 0.1, wave: 0.0, glow: 0.22, scale: 0.85 },
}

// Ashima 3D simplex noise — the standard implementation, verbatim.
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))
    + i.y+vec4(0.0,i1.y,i2.y,1.0))
    + i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`

/** Shared displacement so the shell and the particle field breathe together. */
const DISPLACE = /* glsl */ `
uniform float uTime, uAmp, uSpeed, uWave, uCrumple;
float displace(vec3 n){
  float t = uTime * uSpeed;
  float d = snoise(n * 1.8 + vec3(0.0, 0.0, t)) * 0.62
          + snoise(n * 4.4 + vec3(t * 0.7, 0.0, 0.0)) * 0.28;
  float band = sin(n.y * 14.0 - uTime * 9.0) * uWave;
  float crumple = snoise(n * 16.0 + uTime * 4.0) * uCrumple;
  return d * uAmp + band + crumple;
}
`

const SHELL_VERT = /* glsl */ `
varying vec3 vNormal; varying vec3 vWorld; varying float vDisp;
${SNOISE}
${DISPLACE}
void main(){
  vec3 n = normalize(normal);
  float disp = displace(n);
  vDisp = disp;
  vec3 p = position + n * disp;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const SHELL_FRAG = /* glsl */ `
uniform vec3 uCore; uniform vec3 uEdge; uniform float uGlow;
varying vec3 vNormal; varying vec3 vWorld; varying float vDisp;
void main(){
  vec3 view = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - clamp(dot(normalize(vNormal), view), 0.0, 1.0), 3.4);
  float crest = smoothstep(0.06, 0.36, vDisp) * fres;
  vec3 col = mix(uCore, uEdge, fres) + uEdge * crest * 0.45;
  gl_FragColor = vec4(col * uGlow, 1.0);
}
`

const DUST_VERT = /* glsl */ `
uniform float uSize;
varying float vFade;
${SNOISE}
${DISPLACE}
void main(){
  vec3 n = normalize(position);
  vec3 p = position + n * displace(n) * 1.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vFade = smoothstep(-3.2, 1.6, mv.z);
  gl_PointSize = uSize * (12.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const DUST_FRAG = /* glsl */ `
uniform vec3 uEdge; uniform float uGlow;
varying float vFade;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d) * vFade * uGlow;
  gl_FragColor = vec4(uEdge, a * 0.85);
}
`

export default function Orb({ state }: { state: OrbState }) {
  const host = useRef<HTMLDivElement>(null)
  const stateRef = useRef<OrbState>(state)
  stateRef.current = state

  useEffect(() => {
    const el = host.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return // No WebGL: the section still reads fine without it.
    }

    const size = () => ({
      w: el.clientWidth || window.innerWidth,
      h: el.clientHeight || window.innerHeight,
    })

    const dpr = Math.min(window.devicePixelRatio, 1.75)
    renderer.setPixelRatio(dpr)
    renderer.setSize(size().w, size().h)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, size().w / size().h, 0.1, 100)
    // The stage is square now, so one distance frames the orb inside the HUD dial.
    camera.position.z = 7

    const group = new THREE.Group()
    scene.add(group)

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.1 },
      uSpeed: { value: 0.16 },
      uWave: { value: 0 },
      uCrumple: { value: 0 },
      uGlow: { value: 0.78 },
      uSize: { value: 2.4 },
      uCore: { value: new THREE.Color('#02090b') },
      uEdge: { value: new THREE.Color('#2fe0d0') },
    }

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 64),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: SHELL_VERT,
        fragmentShader: SHELL_FRAG,
      })
    )
    group.add(shell)

    const dust = new THREE.Points(
      new THREE.IcosahedronGeometry(1.3, 42),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    group.add(dust)

    // Two hairline rings — the instrument housing around the energy.
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2fe0d0,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const rings = [1.56, 1.86].map((r, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0035, 3, 220), ringMat)
      ring.rotation.x = Math.PI * (i ? 0.42 : 0.58)
      ring.rotation.y = i ? 0.4 : -0.3
      group.add(ring)
      return ring
    })

    // One reusable shock ring, fired on wake and on interrupt.
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x2fe0d0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const shock = new THREE.Mesh(new THREE.RingGeometry(1, 1.02, 128), shockMat)
    group.add(shock)
    let shockT = 2 // >1 means finished

    const composer = new EffectComposer(renderer)
    composer.setPixelRatio(dpr)
    composer.setSize(size().w, size().h)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size().w, size().h),
      0.95,
      0.62,
      0.12
    )
    composer.addPass(bloom)

    // Pointer parallax — the only thing that makes it read as a solid in space.
    const pointer = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const onResize = () => {
      const { w, h } = size()
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
      bloom.setSize(w, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    let raf = 0
    let last = performance.now()
    let prev: OrbState = 'idle'
    const clock = new THREE.Clock()

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const s = stateRef.current
      if (s !== prev) {
        if (s === 'wake' || s === 'cut') {
          shockT = 0
          shockMat.color.set(s === 'cut' ? 0xe8b455 : 0x2fe0d0)
        }
        if (s === 'cut') uniforms.uCrumple.value = 0.06
        prev = s
      }

      const t = TARGETS[s]
      // Critically-damped-ish easing: fast enough to feel like a state change,
      // slow enough that it never snaps.
      const k = 1 - Math.exp(-dt * 7)
      uniforms.uAmp.value += (t.amp - uniforms.uAmp.value) * k
      uniforms.uSpeed.value += (t.speed - uniforms.uSpeed.value) * k
      uniforms.uWave.value += (t.wave - uniforms.uWave.value) * k
      uniforms.uGlow.value += (t.glow - uniforms.uGlow.value) * k
      uniforms.uCrumple.value += (0 - uniforms.uCrumple.value) * dt * 4
      const sc = group.scale.x + (t.scale - group.scale.x) * k
      group.scale.setScalar(sc)
      bloom.strength = 0.55 + uniforms.uGlow.value * 0.5

      uniforms.uTime.value = clock.getElapsedTime() * (reduced ? 0.25 : 1)

      if (shockT <= 1) {
        shockT += dt * 1.6
        const e = 1 - Math.pow(1 - Math.min(shockT, 1), 3)
        shock.scale.setScalar(0.9 + e * 1.9)
        shockMat.opacity = (1 - e) * 0.7
        shock.quaternion.copy(camera.quaternion)
      } else {
        shockMat.opacity = 0
      }

      group.rotation.y += dt * (reduced ? 0.02 : 0.09)
      rings[0].rotation.z += dt * 0.22
      rings[1].rotation.z -= dt * 0.15

      // Parallax leans the whole assembly toward the cursor.
      group.rotation.x += (pointer.y * 0.22 - group.rotation.x) * dt * 2.2
      camera.position.x += (pointer.x * 0.3 - camera.position.x) * dt * 2.2
      camera.lookAt(0, 0, 0)

      composer.render()
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      composer.dispose()
      renderer.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[]
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={host} className="orb-stage" aria-hidden="true" />
}

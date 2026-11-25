import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
 * One mint silk ribbon made of thousands of light dots, fixed behind the light
 * sections. Its SHAPE is fixed: a single band that enters at the top-right corner
 * and sweeps diagonally down to the bottom-left. Only the silk "flows": the twist
 * travels along the path over time (and a little further with every scroll).
 */

/** Path in screen space: x -1 (left) .. 1 (right), y -1 (bottom) .. 1 (top). Starts/ends off-screen. */
const PATH: [number, number][] = [
  [1.25, 1.05], // top-right, by the "Get started" button
  [0.7, 0.66],
  [0.2, 0.3],
  [-0.25, -0.02],
  [-0.7, -0.42],
  [-1.25, -1.05], // bottom-left
];

const vert = /* glsl */ `
attribute vec2 aC;      // centre of the ribbon at this point (screen space)
attribute vec2 aT;      // tangent of the path
attribute float aU;     // 0..1 along the loop
attribute float aV;     // -1..1 across the ribbon
attribute float aSeed;
uniform float uTime;
uniform float uFlow;
uniform float uAspect;
uniform float uPR;
uniform float uSize;
uniform float uGlow;
varying vec3 vColor;
varying float vAlpha;

void main(){
  float TAU = 6.2831853;
  float phase = uTime * 0.18 + uFlow;

  // twist waves travel along the fixed path → the silk flows in the drawn direction
  float twist = aU * 6.2 - phase * 6.0;
  // same width profile as the blue ribbon; only slimmer on portrait phones
  float narrow = clamp(uAspect / 1.1, 0.6, 1.0);
  float width = (0.11 + 0.07 * sin(aU * 2.3 - phase * 1.2) + 0.05 * sin(aU * 9.0 - phase * 2.0)) * narrow;
  float c = cos(twist);
  float s = sin(twist);
  float across = aV * width;

  // offset perpendicular to the path, measured in pixel space so the band keeps its width
  vec2 tp = normalize(vec2(aT.x * uAspect, aT.y));
  vec2 np = vec2(-tp.y, tp.x);
  vec2 off = np * across * c + tp * across * s * 0.3;
  off.x /= uAspect;
  vec2 p = aC + off;
  p.y += sin(uTime * 2.0 + aSeed * 40.0) * 0.002;
  gl_Position = vec4(p, 0.0, 1.0);

  float depth = s * aV;              // -1 back .. 1 front
  float fold = 1.0 - abs(c);         // bright where the silk turns edge-on
  float sparkle = step(0.985, fract(aSeed * 91.7 + uTime * 0.15));

  vec3 deep = vec3(0.12, 0.72, 0.60);   // #1fb89a
  vec3 green = vec3(0.26, 0.90, 0.78);  // #42e5c6
  vec3 mint = vec3(0.38, 0.91, 0.81);   // #62e8cf
  float hue = 0.5 + 0.5 * sin(aU * TAU - phase * 2.0);
  vColor = mix(mix(deep, green, hue), mint, fold * 0.6 + sparkle * 0.4);
  float edge = smoothstep(0.0, 0.06, aU) * smoothstep(1.0, 0.94, aU);

  gl_PointSize = uPR * uSize * (0.75 + 0.45 * depth + 0.6 * fold + sparkle * 1.2);
  vAlpha = edge * (0.25 + 0.4 * (0.5 + 0.5 * depth) + 0.35 * fold + sparkle * 0.4) * mix(0.7, 1.0, narrow);
  if (uGlow > 0.5) {
    gl_PointSize = uPR * uSize * (0.8 + 0.5 * fold);
    vColor = mix(green, mint, 0.3);
    vAlpha = edge * (0.04 + 0.05 * fold);
  }
}`;

const frag = /* glsl */ `
uniform float uGlow;
varying vec3 vColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = uGlow > 0.5 ? smoothstep(0.5, 0.0, d) : smoothstep(0.5, 0.15, d);
  gl_FragColor = vec4(vColor, a * vAlpha);
}`;

export default function SilkRibbon({ startAfterId }: { startAfterId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const mobile = window.innerWidth < 768;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    const curve = new THREE.CatmullRomCurve3(
      PATH.map(([x, y]) => new THREE.Vector3(x, y, 0)),
      false,
      'centripetal',
    );

    const makeGeo = (NU: number, NV: number) => {
      const n = NU * NV;
      const aC = new Float32Array(n * 2);
      const aT = new Float32Array(n * 2);
      const aU = new Float32Array(n);
      const aV = new Float32Array(n);
      const aSeed = new Float32Array(n);
      for (let i = 0; i < NU; i++) {
        const u = Math.min(1, (i + Math.random() * 0.6) / NU);
        const P = curve.getPointAt(u);
        const T = curve.getTangentAt(u);
        for (let j = 0; j < NV; j++) {
          const k = i * NV + j;
          aC[k * 2] = P.x;
          aC[k * 2 + 1] = P.y;
          aT[k * 2] = T.x;
          aT[k * 2 + 1] = T.y;
          aU[k] = u;
          aV[k] = (j / (NV - 1)) * 2 - 1 + (Math.random() - 0.5) * 0.04;
          aSeed[k] = Math.random();
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aC', new THREE.BufferAttribute(aC, 2));
      g.setAttribute('aT', new THREE.BufferAttribute(aT, 2));
      g.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
      g.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
      g.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
      return g;
    };
    const shared = { uTime: { value: 0 }, uFlow: { value: 0 }, uAspect: { value: 1 }, uPR: { value: renderer.getPixelRatio() } };
    const makeMat = (size: number, glow: number) =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { ...shared, uSize: { value: size }, uGlow: { value: glow } },
      });
    // soft halo underneath (few, big, faint dots) + the crisp dotted silk on top
    const geoGlow = makeGeo(mobile ? 100 : 180, mobile ? 8 : 10);
    const geo = makeGeo(mobile ? 380 : 720, mobile ? 24 : 38);
    const matGlow = makeMat(mobile ? 22 : 30, 1);
    const mat = makeMat(mobile ? 2.4 : 2.9, 0);
    [new THREE.Points(geoGlow, matGlow), new THREE.Points(geo, mat)].forEach((pts) => {
      pts.frustumCulled = false;
      scene.add(pts);
    });

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      shared.uAspect.value = window.innerWidth / window.innerHeight;
    };
    resize();

    const clock = new THREE.Clock();
    let raf = 0;
    let flow = 0;
    let visible = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const start = document.getElementById(startAfterId);
      const startBottom = start ? start.getBoundingClientRect().bottom : 0;
      const show = startBottom < window.innerHeight * 0.5; // after the 3D journey
      if (show !== visible) {
        visible = show;
        canvas.style.opacity = show ? '1' : '0';
      }
      if (!visible) return;
      flow += (window.scrollY / 3000 - flow) * 0.06;
      shared.uTime.value = clock.getElapsedTime();
      shared.uFlow.value = flow;
      renderer.render(scene, camera);
    };
    loop();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      geo.dispose();
      geoGlow.dispose();
      mat.dispose();
      matGlow.dispose();
      renderer.dispose();
    };
  }, [startAfterId]);

  return <canvas ref={canvasRef} className="silk-ribbon" aria-hidden="true" />;
}

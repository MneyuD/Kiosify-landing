import * as THREE from 'three';
import { loadImages, type Images } from './cards';
import { glowSprite, hubLabel, tokenBag, tokenCard, tokenCart, tokenFood, tokenTap, tokenTicket } from './art';
import { buildZones, texPlane, ZONE_BG, ZONE_COLORS, type Zone } from './zones';

/** Curve parameter (0..1) where each stage's zone sits. */
export const STAGE_S = [0.22, 0.35, 0.48, 0.61, 0.74, 0.87];
/** Zones alternate sides of the rail: +1 = right, -1 = left */
const SIDE = [1, -1, 1, -1, 1, -1];
const FLOOR_Y = -4.6;

const HERO_BG = new THREE.Color('#040a16');
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type Callbacks = {
  onStage?: (index: number) => void;
  onFrame?: (state: { p: number; dissolve: number; exit: number }) => void;
};

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const logoVert = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aDir;
attribute vec3 aColor;
attribute float aSeed;
uniform float uTime;
uniform float uForm;
uniform float uDissolve;
uniform float uPR;
uniform float uSize;
uniform vec2 uMouse;
varying vec3 vColor;
varying float vAlpha;
void main(){
  float f = clamp(uForm*1.5 - aSeed*0.5, 0., 1.);
  f = 1. - pow(1. - f, 3.);
  vec3 p = mix(aStart, position, f);
  p += 0.035 * vec3(sin(uTime*1.3 + aSeed*40.), cos(uTime*1.1 + aSeed*31.), sin(uTime*.9 + aSeed*23.));
  vec2 d = p.xy - uMouse;
  float dist = length(d);
  float push = smoothstep(2.4, 0., dist) * (1. - uDissolve) * f;
  p.xy += normalize(d + 1e-4) * push * 1.1;
  p.z += push * 1.6;
  float e = uDissolve * uDissolve;
  p += aDir * e * (5. + aSeed * 16.);
  p.z += e * (6. + aSeed * 26.);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(uSize * uPR * (0.7 + aSeed * 0.7) * (24. / -mv.z), 48.);
  vColor = aColor * (1. + push * 1.5);
  vAlpha = (0.35 + 0.65 * f) * (1. - smoothstep(0.55, 1., uDissolve));
}`;

const pointFrag = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - .5);
  float a = smoothstep(.5, 0., d);
  a *= a;
  gl_FragColor = vec4(vColor * (0.7 + a), a * vAlpha);
}`;

// Floor: world-space grid that glows in the current zone colour.
const floorVert = /* glsl */ `
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const floorFrag = /* glsl */ `
uniform vec3 uTint;
uniform vec3 uBg;
uniform vec3 uCam;
uniform float uReveal;
uniform float uTime;
varying vec3 vW;
float grid(vec2 p, float s){
  vec2 q = p / s;
  vec2 g = abs(fract(q - .5) - .5) / fwidth(q);
  return 1. - min(min(g.x, g.y), 1.);
}
void main(){
  float d = length(vW.xz - uCam.xz);
  float fade = exp(-d * 0.028);
  float l = grid(vW.xz, 2.) * 0.35 + grid(vW.xz, 10.) * 0.8;
  float scan = smoothstep(0.92, 1., fract(-vW.z * 0.02 + uTime * 0.25)) * 0.5;
  vec3 col = uBg + uTint * (l * 0.55 + scan * l) * fade;
  col += uTint * 0.05 * exp(-d * 0.06);
  gl_FragColor = vec4(mix(uBg, col, uReveal), 1.);
}`;

// Rail: thin glowing tubes with order pulses travelling forward.
const railVert = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const railFrag = /* glsl */ `
uniform vec3 uTint;
uniform float uTime;
uniform float uReveal;
varying vec2 vUv;
varying float vDepth;
void main(){
  float pulse = smoothstep(0.85, 1., fract(vUv.x * 40. - uTime * 0.9));
  float fog = exp(-vDepth * 0.03);
  vec3 col = uTint * (0.45 + pulse * 2.2) * fog * uReveal;
  gl_FragColor = vec4(col, 1.);
}`;

const dustVert = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPR;
uniform float uReveal;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.4 + aSeed * 30.) * 0.4;
  p.x += cos(uTime * 0.3 + aSeed * 20.) * 0.4;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPR * (1.2 + aSeed * 2.4) * (14. / -mv.z);
  float tw = 0.5 + 0.5 * sin(uTime * 2. + aSeed * 60.);
  vAlpha = (0.25 + 0.75 * tw) * exp(-(-mv.z) * 0.025) * uReveal;
}`;
const dustFrag = /* glsl */ `
uniform vec3 uTint;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - .5);
  gl_FragColor = vec4(mix(vec3(1.), uTint, .5), smoothstep(.5, 0., d) * vAlpha);
}`;

/* ------------------------------------------------------------------ */

type Pulse = { sprite: THREE.Sprite; t0: number; dur: number };

export class Journey {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  private camCurve: THREE.CatmullRomCurve3;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private disposed = false;

  private logo?: THREE.Points;
  private logoMat?: THREE.ShaderMaterial;

  private reveal = { value: 0 };
  private tint = { value: new THREE.Color(ZONE_COLORS[0]) };
  private bgSRGB = { value: new THREE.Color().copy(HERO_BG).convertLinearToSRGB() };
  private time = { value: 0 };
  private bg = HERO_BG.clone();

  private floor!: THREE.Mesh;
  private floorMat!: THREE.ShaderMaterial;
  private sleeperMat!: THREE.MeshBasicMaterial;
  private zones: { zone: Zone; s: number }[] = [];

  private token = new THREE.Group();
  private tokenGlow!: THREE.Sprite;
  private tokenForms: THREE.Mesh[] = [];
  private form = -1;
  private bounce = 0;

  private hub = new THREE.Group();
  private hubLink!: THREE.Line;
  private pulses: Pulse[] = [];
  private glowTex = new THREE.CanvasTexture(glowSprite());
  private nextAmbientPulse = 0;

  private exitGlow!: THREE.Sprite;

  private target = 0;
  private p = 0;
  private mouse = new THREE.Vector2();
  private mouseSmooth = new THREE.Vector2();
  private mouseActive = false;
  private formStart = -1;
  private stage = -2;
  private isMobile = window.innerWidth < 768;

  constructor(private canvas: HTMLCanvasElement, private cb: Callbacks = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.isMobile, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 1.75));
    this.scene.background = this.bg;
    this.scene.fog = new THREE.FogExp2(this.bg, 0.026);

    const pts = [
      [0, 0, 24], [0, 0, 8], [0, 0, -8], [1.5, 0.4, -34], [-1.5, -0.3, -62], [-3, 0.5, -90],
      [1, -0.4, -118], [3, 0.3, -146], [0, -0.2, -174], [-2.5, 0.2, -202], [0, 0, -228], [0, 0, -246],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    this.camCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');

    this.scene.add(new THREE.AmbientLight('#9fb8d8', 0.6));
    this.buildWorld();
    this.buildToken();
    this.buildHub();
    this.resize();
    void this.buildLogo();
    void loadImages().then((imgs) => this.buildContent(imgs));
  }

  /* ---------------- world: floor, rail, dust, exit ---------------- */

  private buildWorld() {
    this.floorMat = new THREE.ShaderMaterial({
      vertexShader: floorVert,
      fragmentShader: floorFrag,
      uniforms: {
        uTint: this.tint, uBg: this.bgSRGB, uCam: { value: new THREE.Vector3() }, uReveal: this.reveal, uTime: this.time,
      },
    });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), this.floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = FLOOR_Y;
    this.scene.add(this.floor);

    // twin rails slightly below the camera path
    const railMat = new THREE.ShaderMaterial({
      vertexShader: railVert,
      fragmentShader: railFrag,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      uniforms: { uTint: this.tint, uTime: this.time, uReveal: this.reveal },
    });
    const up = new THREE.Vector3(0, 1, 0);
    [-0.55, 0.55].forEach((off) => {
      const rp: THREE.Vector3[] = [];
      for (let i = 0; i <= 120; i++) {
        const s = 0.06 + (i / 120) * 0.94;
        const P = this.camCurve.getPointAt(s);
        const T = this.camCurve.getTangentAt(s);
        const R = new THREE.Vector3().crossVectors(T, up).normalize();
        const y = P.y - 2.1;
        rp.push(P.add(R.multiplyScalar(off)).setY(y));
      }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 600, 0.035, 6, false);
      this.scene.add(new THREE.Mesh(geo, railMat));
    });
    // rail sleepers
    const sleeperCount = 220;
    this.sleeperMat = new THREE.MeshBasicMaterial({ color: '#4fe3c1', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.05, 0.12), this.sleeperMat, sleeperCount);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < sleeperCount; i++) {
      const s = 0.06 + (i / sleeperCount) * 0.94;
      const P = this.camCurve.getPointAt(s);
      const T = this.camCurve.getTangentAt(s);
      q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), T);
      m.compose(P.setY(P.y - 2.12), q, new THREE.Vector3(1, 1, 1));
      sleepers.setMatrixAt(i, m);
    }
    this.scene.add(sleepers);

    // ambient dust in a wide volume around the path
    const N = this.isMobile ? 1500 : 3000;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const P = this.camCurve.getPointAt(0.05 + Math.random() * 0.95);
      pos.set([P.x + (Math.random() - 0.5) * 50, FLOOR_Y + Math.random() * 22, P.z + (Math.random() - 0.5) * 6], i * 3);
      seed[i] = Math.random();
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.scene.add(
      new THREE.Points(
        dGeo,
        new THREE.ShaderMaterial({
          vertexShader: dustVert,
          fragmentShader: dustFrag,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { uTime: this.time, uPR: { value: this.renderer.getPixelRatio() }, uReveal: this.reveal, uTint: this.tint },
        }),
      ),
    );

    // light at the end
    this.exitGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    );
    this.exitGlow.position.copy(this.camCurve.getPointAt(1)).add(new THREE.Vector3(0, 0, -6));
    this.exitGlow.scale.set(30, 30, 1);
    this.scene.add(this.exitGlow);
  }

  /* ---------------- the order token ---------------- */

  private buildToken() {
    this.tokenGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTex, color: ZONE_COLORS[0], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    );
    this.tokenGlow.scale.set(1.7, 1.7, 1);
    (this.tokenGlow.material as THREE.SpriteMaterial).opacity = 0.75;
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }));
    this.token.add(this.tokenGlow, core);
    this.token.visible = false;
    this.scene.add(this.token);
  }

  /* ---------------- Square hub on the horizon ---------------- */

  private buildHub() {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(6, 6, 6)),
      new THREE.LineBasicMaterial({ color: '#4fe3c1', transparent: true, blending: THREE.AdditiveBlending, fog: false }),
    );
    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.6, 2.6),
      new THREE.MeshBasicMaterial({ color: '#4fe3c1', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTex, color: '#4fe3c1', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    );
    halo.scale.set(22, 22, 1);
    const cubes = new THREE.Group();
    cubes.add(edges, inner);
    const label = texPlane(hubLabel(), 2.6, { additive: true });
    (label.material as THREE.MeshBasicMaterial).fog = false;
    label.position.y = -6;
    this.hub.add(cubes, halo, label);
    this.hub.userData.cubes = cubes;
    this.hub.userData.label = label;
    this.hub.visible = false;
    this.scene.add(this.hub);

    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.hubLink = new THREE.Line(
      lg,
      new THREE.LineBasicMaterial({ color: '#4fe3c1', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    this.hubLink.frustumCulled = false;
    this.scene.add(this.hubLink);
  }

  private spawnPulse(strong: boolean) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTex, color: this.tint.value.clone(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    );
    const sc = strong ? 1.8 : 0.8;
    sprite.scale.set(sc, sc, 1);
    this.scene.add(sprite);
    this.pulses.push({ sprite, t0: this.clock.getElapsedTime(), dur: strong ? 1.3 : 2.2 });
  }

  /* ---------------- zones + token forms (need images) ---------------- */

  private buildContent(imgs: Images) {
    if (this.disposed) return;
    const up = new THREE.Vector3(0, 1, 0);
    buildZones(imgs).forEach((zone, i) => {
      const s = STAGE_S[i];
      const P = this.camCurve.getPointAt(s);
      const T = this.camCurve.getTangentAt(s);
      const R = new THREE.Vector3().crossVectors(T, up).normalize();
      zone.group.position.copy(P).add(R.multiplyScalar(SIDE[i] * (this.isMobile ? 3.1 : 4.8)));
      zone.group.scale.setScalar(this.isMobile ? 0.72 : 0.9);
      zone.group.position.y = FLOOR_Y + 4.0;
      const look = this.camCurve.getPointAt(Math.max(0, s - 0.07));
      look.y = zone.group.position.y;
      zone.group.lookAt(look);
      zone.group.visible = false;
      this.scene.add(zone.group);
      this.zones.push({ zone, s });
    });

    [tokenTap(), tokenCart(), tokenCard(), tokenTicket(), tokenFood(imgs), tokenBag()].forEach((c) => {
      const m = texPlane(c, 1.5);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.fog = false;
      mat.opacity = 0;
      m.position.y = 1.15;
      this.token.add(m);
      this.tokenForms.push(m);
    });
  }

  private async buildLogo() {
    const img = new Image();
    img.src = '/images/kiosify-logo.png';
    await img.decode().catch(() => undefined);
    if (this.disposed || !img.naturalWidth) return;
    const SW = this.isMobile ? 360 : 560;
    const SH = Math.round((SW * img.naturalHeight) / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = SW;
    c.height = SH;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, SW, SH);
    const data = ctx.getImageData(0, 0, SW, SH).data;

    const LW = 15;
    const LH = (LW * SH) / SW;
    const step = 2;
    const target: number[] = [];
    const color: number[] = [];
    const markEnd = 0.29 * SW;
    const teal = new THREE.Color('#4fe3c1');
    const white = new THREE.Color('#e9f2ff');
    const red = new THREE.Color('#ff3d3d');
    for (let y = 0; y < SH; y += step) {
      for (let x = 0; x < SW; x += step) {
        const i = (y * SW + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 110) continue;
        if ((r + g + b) / 3 > 205) continue;
        const isRed = r > 140 && g < 110 && b < 110;
        const col = isRed ? red : x < markEnd ? teal : white;
        target.push(
          (x / SW - 0.5) * LW + (Math.random() - 0.5) * 0.02,
          -(y / SH - 0.5) * LH + (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.25,
        );
        color.push(col.r, col.g, col.b);
      }
    }
    const n = target.length / 3;
    const start = new Float32Array(n * 3);
    const dir = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.randomDirection().multiplyScalar(10 + Math.random() * 22);
      start.set([v.x, v.y, v.z - 6], i * 3);
      v.randomDirection();
      dir.set([v.x * 1.6, v.y, v.z * 0.4], i * 3);
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(target, 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(color, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.logoMat = new THREE.ShaderMaterial({
      vertexShader: logoVert,
      fragmentShader: pointFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uForm: { value: 0 },
        uDissolve: { value: 0 },
        uPR: { value: this.renderer.getPixelRatio() },
        uSize: { value: this.isMobile ? 3.6 : 3.0 },
        uMouse: { value: new THREE.Vector2(99, 99) },
      },
    });
    this.logo = new THREE.Points(geo, this.logoMat);
    this.logo.frustumCulled = false;
    this.scene.add(this.logo);
    this.formStart = this.clock.getElapsedTime();
    this.resize();
  }

  /* ---------------- public API ---------------- */

  setProgress(p: number) {
    this.target = clamp01(p);
  }

  setMouse(nx: number, ny: number) {
    this.mouse.set(nx, ny);
    this.mouseActive = true;
  }

  clearMouse() {
    this.mouse.set(0, 0);
    this.mouseActive = false;
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.render();
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.isMobile = w < 768;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 66 : 50;
    this.camera.updateProjectionMatrix();
    if (this.logo) {
      const visH = 2 * 24 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      const visW = visH * this.camera.aspect;
      this.logo.scale.setScalar(Math.min(15, visW * 0.82) / 15);
      this.logo.position.y = this.isMobile ? 0.8 : 0.9;
    }
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      mats.forEach((mat) => {
        const map = (mat as THREE.MeshBasicMaterial).map;
        if (map) map.dispose();
        mat.dispose();
      });
    });
    this.renderer.dispose();
  }

  /* ---------------- frame ---------------- */

  /** Zone colour/background blended by camera position along the path. */
  private zoneBlend(s: number) {
    const idx = STAGE_S.findIndex((z) => s < z - 0.11);
    const i1 = idx === -1 ? STAGE_S.length - 1 : idx;
    const i0 = Math.max(0, i1 - 1);
    const a = i1 === i0 ? 1 : smooth(STAGE_S[i0] - 0.03, STAGE_S[i1] - 0.11, s);
    return { i0, i1, a };
  }

  private render() {
    const t = this.clock.getElapsedTime();
    this.time.value = t;
    this.p += (this.target - this.p) * 0.075;
    if (Math.abs(this.target - this.p) < 1e-5) this.p = this.target;
    this.mouseSmooth.lerp(this.mouse, 0.06);
    const p = this.p;

    const dissolve = smooth(0.025, 0.11, p);
    const camS = smooth(0.03, 0.09, p) * 0.03 + clamp01((p - 0.09) / 0.9) * 0.97;
    const exit = smooth(0.955, 1, p);
    this.reveal.value = smooth(0.04, 0.13, p);

    const s = Math.min(camS, 0.999);
    const pos = this.camCurve.getPointAt(s);
    const look = this.camCurve.getPointAt(Math.min(1, s + 0.014));
    look.y -= 0.35 * this.reveal.value; // tilt slightly toward the rail & token
    const par = 1 - dissolve * 0.4;
    pos.x += this.mouseSmooth.x * 0.6 * par;
    pos.y += this.mouseSmooth.y * 0.35 * par;
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
    this.camera.rotateZ(Math.sin(t * 0.25) * 0.012 + this.mouseSmooth.x * -0.02);

    /* zone colour + background */
    const { i0, i1, a } = this.zoneBlend(s);
    this.tint.value.set(ZONE_COLORS[i0]).lerp(new THREE.Color(ZONE_COLORS[i1]), a);
    const zoneBg = new THREE.Color(ZONE_BG[i0]).lerp(new THREE.Color(ZONE_BG[i1]), a);
    this.bg.copy(HERO_BG).lerp(zoneBg, this.reveal.value);
    (this.scene.fog as THREE.FogExp2).color.copy(this.bg);
    this.bgSRGB.value.copy(this.bg).convertLinearToSRGB();
    this.sleeperMat.color.copy(this.tint.value);
    this.sleeperMat.opacity = 0.25 * this.reveal.value;

    this.floor.position.x = pos.x;
    this.floor.position.z = pos.z;
    (this.floorMat.uniforms.uCam.value as THREE.Vector3).copy(pos);

    /* logo */
    if (this.logo && this.logoMat) {
      const u = this.logoMat.uniforms;
      u.uTime.value = t;
      u.uForm.value = this.formStart < 0 ? 0 : clamp01((t - this.formStart) / 2.6);
      u.uDissolve.value = dissolve;
      const visH = 2 * 24 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      const visW = visH * this.camera.aspect;
      const sc = this.logo.scale.x;
      if (!this.mouseActive) u.uMouse.value.set(99, 99);
      else u.uMouse.value.set((this.mouseSmooth.x * visW) / 2 / sc, ((this.mouseSmooth.y * visH) / 2 - this.logo.position.y) / sc);
      this.logo.visible = dissolve < 0.999;
    }

    /* zones */
    for (const { zone, s: zs } of this.zones) {
      const d = zone.group.position.distanceTo(pos);
      zone.group.visible = this.reveal.value > 0.02 && d < 85;
      if (!zone.group.visible) continue;
      zone.update(clamp01((s - (zs - 0.15)) / 0.11), t);
    }

    /* token form follows the stage the order has reached */
    let form = -1;
    STAGE_S.forEach((st, i) => {
      if (s > st - 0.125) form = i;
    });
    if (form !== this.form) {
      if (form > this.form && form >= 0) {
        this.bounce = 1;
        this.spawnPulse(true);
      }
      this.form = form;
    }
    this.bounce *= 0.93;

    const tp = this.camCurve.getPointAt(Math.min(0.995, s + 0.024));
    tp.y -= 1.05 - Math.sin(t * 1.6) * 0.08;
    this.token.position.copy(tp);
    this.token.visible = dissolve > 0.6 && exit < 0.9;
    this.token.scale.setScalar((this.isMobile ? 0.75 : 1) * (0.55 + 0.45 * smooth(0.6, 1, dissolve)) * (1 + this.bounce * 0.35));
    (this.tokenGlow.material as THREE.SpriteMaterial).color.copy(this.tint.value);
    this.tokenForms.forEach((m, i) => {
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity += ((i === this.form ? 1 : 0) - mat.opacity) * 0.12;
      m.visible = mat.opacity > 0.01;
      m.quaternion.copy(this.camera.quaternion);
    });

    /* Square hub floats on the horizon, ahead-right of the camera */
    const fwd = look.clone().sub(pos).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    this.hub.position.copy(pos).addScaledVector(fwd, 95).addScaledVector(right, 26).setY(pos.y + 17);
    this.hub.visible = this.reveal.value > 0.3 && exit < 0.6;
    (this.hub.userData.cubes as THREE.Group).rotation.set(t * 0.2, t * 0.3, 0);
    (this.hub.userData.label as THREE.Mesh).quaternion.copy(this.camera.quaternion);

    const lpos = this.hubLink.geometry.attributes.position as THREE.BufferAttribute;
    lpos.setXYZ(0, this.token.position.x, this.token.position.y, this.token.position.z);
    lpos.setXYZ(1, this.hub.position.x, this.hub.position.y, this.hub.position.z);
    lpos.needsUpdate = true;
    this.hubLink.visible = this.token.visible && this.hub.visible;
    (this.hubLink.material as THREE.LineBasicMaterial).color.copy(this.tint.value);

    if (this.hubLink.visible && t > this.nextAmbientPulse) {
      this.spawnPulse(false);
      this.nextAmbientPulse = t + 1.4;
    }
    this.pulses = this.pulses.filter((pl) => {
      const k = (t - pl.t0) / pl.dur;
      if (k >= 1 || !this.hubLink.visible) {
        this.scene.remove(pl.sprite);
        pl.sprite.material.dispose();
        return false;
      }
      const e = k * k * (3 - 2 * k);
      pl.sprite.position.lerpVectors(this.token.position, this.hub.position, e);
      pl.sprite.material.opacity = Math.sin(k * Math.PI);
      return true;
    });

    this.exitGlow.material.opacity = smooth(0.9, 1, s);

    /* captions */
    let active = -1;
    STAGE_S.forEach((st, i) => {
      if (s > st - 0.125 && s < st - 0.015) active = i;
    });
    if (p < 0.02) active = -1;
    if (active !== this.stage) {
      this.stage = active;
      this.cb.onStage?.(active);
    }
    this.cb.onFrame?.({ p, dissolve, exit });

    this.renderer.render(this.scene, this.camera);
  }
}

import * as THREE from 'three';
import { cookingCard, dishCard, imageCard, kioskCard, paymentCard, readyCard, type Images } from './cards';
import { bagLabel, creditCard, standScreen } from './art';
import { kdsBoard } from './kds';

/** One stop of the order journey. `update(lp, t)` gets the local progress (0 = approaching, 1 = passed). */
export type Zone = {
  group: THREE.Group;
  light: THREE.PointLight;
  update: (lp: number, t: number) => void;
};

export const ZONE_COLORS = ['#8fd8ff', '#4fe3c1', '#3ddc84', '#ff5a5a', '#ff9f43', '#5bf0c9'];
/** Dark ambient tint (background + fog) for each zone */
export const ZONE_BG = ['#050d1c', '#03121a', '#03140d', '#15060a', '#170b04', '#03140f'];

const ease = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export function texPlane(canvas: HTMLCanvasElement, height: number, opts: { additive?: boolean } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    fog: true,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry((height * canvas.width) / canvas.height, height), mat);
  return mesh;
}

function std(color: string, metal = 0.4, rough = 0.4) {
  return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
}

function lightCone(color: string, radius: number, height: number) {
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 40, 1, true), mat);
  return cone;
}

function zoneBase(i: number) {
  const group = new THREE.Group();
  const light = new THREE.PointLight(ZONE_COLORS[i], 30, 26, 1.6);
  light.position.set(0, 3, 4);
  group.add(light);
  // glowing pad on the floor
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(3.6, 3.75, 96),
    new THREE.MeshBasicMaterial({ color: ZONE_COLORS[i], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = -3.95;
  group.add(pad);
  return { group, light, pad };
}

/* 1 · Square Stand ---------------------------------------------------- */
function standZone(imgs: Images): Zone {
  const { group, light, pad } = zoneBase(0);
  const tablet = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.4, 0.16), std('#1b1f26', 0.7, 0.3));
  const screen = texPlane(standScreen(imgs), 3.06);
  screen.position.z = 0.085;
  tablet.add(body, screen);
  tablet.position.y = 1.3;
  tablet.rotation.x = -0.12;
  // stand: swivel neck + round base
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 2.6, 24), std('#d9dde3', 0.6, 0.25));
  neck.position.set(0, -1.6, -0.35);
  neck.rotation.x = 0.18;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.18, 48), std('#e7eaef', 0.5, 0.3));
  base.position.set(0, -2.9, -0.5);
  const cone = lightCone('#bfe6ff', 3.2, 7);
  cone.position.set(0, 3.2, 0);
  group.add(tablet, neck, base, cone);
  return {
    group,
    light,
    update: (lp, t) => {
      tablet.rotation.y = Math.sin(t * 0.5) * 0.06;
      light.intensity = 24 + Math.sin(t * 2) * 4 + ease(lp * 2) * 10;
      (pad.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin(t * 2.2);
    },
  };
}

/* 2 · Customer builds the order ------------------------------------- */
function orderZone(imgs: Images): Zone {
  const { group, light } = zoneBase(1);
  const kiosk = texPlane(kioskCard(imgs), 5);
  kiosk.position.y = 0.6;
  group.add(kiosk);
  const dishes = [
    { c: dishCard('pho', 'Sliced Beef Pho', 'Rare beef · rice noodles', '$14.00')(imgs), from: new THREE.Vector3(-3.6, 2.2, 1.4) },
    { c: dishCard('banhmi', 'Traditional', 'Ham · pork cake · paté', '$9.50')(imgs), from: new THREE.Vector3(3.5, 1.6, 1.2) },
    { c: dishCard('bao', 'Steam Bao Bun', '2 pcs · pork & egg', '$6.50')(imgs), from: new THREE.Vector3(-2.9, -1.4, 1.8) },
  ].map((d, i) => {
    const m = texPlane(d.c, 2.1);
    group.add(m);
    return { m, from: d.from, phase: i * 1.7 };
  });
  const cart = new THREE.Vector3(0.6, -1.4, 0.3);
  return {
    group,
    light,
    update: (lp, t) => {
      dishes.forEach((d, i) => {
        const k = ease((lp - 0.25 - i * 0.1) / 0.35);
        d.m.position.lerpVectors(d.from, cart, k);
        d.m.position.y += Math.sin(t * 0.9 + d.phase) * 0.15 * (1 - k);
        d.m.scale.setScalar(1 - k * 0.85);
        d.m.rotation.z = Math.sin(t * 0.6 + d.phase) * 0.05 + k * 0.4;
        (d.m.material as THREE.MeshBasicMaterial).opacity = 1 - ease((k - 0.8) / 0.2);
      });
      light.intensity = 26 + Math.sin(t * 1.7) * 4;
    },
  };
}

/* 3 · Payment -------------------------------------------------------- */
function paymentZone(): Zone {
  const { group, light } = zoneBase(2);
  const reader = new THREE.Mesh(new THREE.BoxGeometry(3.3, 4.2, 0.3), std('#e8ecf1', 0.3, 0.35));
  reader.position.set(0, 0.4, -0.2);
  const screen = texPlane(paymentCard(), 4.1);
  screen.position.set(0, 0.4, 0.0);
  const card = texPlane(creditCard(), 1.7);
  group.add(reader, screen, card);
  const rings = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.03, 8, 64),
      new THREE.MeshBasicMaterial({ color: '#3ddc84', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    m.position.set(0, 0.55, 0.4);
    group.add(m);
    return m;
  });
  return {
    group,
    light,
    update: (lp, t) => {
      const tap = ease((lp - 0.2) / 0.35);
      card.position.set(2.8 - tap * 2.6, -2.2 + tap * 2.5, 1.6 - tap * 1.0);
      card.rotation.set(-0.3 * (1 - tap), -0.5 * (1 - tap), 0.4 * (1 - tap));
      const approved = ease((lp - 0.5) / 0.1);
      rings.forEach((r, i) => {
        const ph = (t * 0.7 + i / rings.length) % 1;
        r.scale.setScalar(1 + ph * 3.2);
        (r.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * (0.25 + approved * 0.75);
      });
      light.intensity = 20 + approved * 40 * (0.6 + 0.4 * Math.sin(t * 6));
    },
  };
}

/* 4 · Kitchen display (KDS) ----------------------------------------- */
function kdsZone(imgs: Images): Zone {
  const { group, light } = zoneBase(3);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(8.3, 4.6, 0.2), std('#15181d', 0.6, 0.35));
  bezel.position.set(0, 1.0, -0.3);
  const board = texPlane(kdsBoard(), 4.2);
  board.position.set(0, 1.0, -0.15);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 16), std('#2a2f37'));
  pole.position.set(0, -2.4, -0.4);
  group.add(bezel, board, pole);
  const tickets = [-4.4, 4.4].map((x, i) => {
    const m = texPlane(imageCard('ticket', 576, 1080)(imgs), 3.0);
    m.position.set(x, 8, 0.4);
    m.rotation.y = x > 0 ? -0.25 : 0.25;
    group.add(m);
    return { m, x, delay: i * 0.12 };
  });
  return {
    group,
    light,
    update: (lp, t) => {
      tickets.forEach((tk) => {
        const k = ease((lp - 0.15 - tk.delay) / 0.3);
        tk.m.position.y = 8 - k * 7.4 + Math.sin(t + tk.x) * 0.08;
        (tk.m.material as THREE.MeshBasicMaterial).opacity = k;
      });
      light.intensity = 22 + Math.sin(t * 3) * 3;
    },
  };
}

/* 5 · Cooking ------------------------------------------------------- */
function cookingZone(imgs: Images): Zone {
  const { group, light } = zoneBase(4);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.6, 2.4), std('#3a3f47', 0.8, 0.3));
  counter.position.set(0, -3.1, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.12, 2.6), std('#c7ccd3', 0.9, 0.2));
  top.position.set(0, -2.25, 0);
  group.add(counter, top);
  const plateTex = (key: string) => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.clip();
    const img = imgs[key];
    if (img.naturalWidth) ctx.drawImage(img, -60, -60, 632, 632);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const plates = [
    { key: 'pho', x: -2.2 },
    { key: 'bao', x: 2.2 },
  ].map(({ key, x }) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1.0, 48), new THREE.MeshBasicMaterial({ map: plateTex(key), transparent: true, fog: true }));
    m.position.set(x, -1.62, 0.25); // above the counter top so the whole plate shows
    m.rotation.x = -Math.PI / 2 + 0.55;
    group.add(m);
    return m;
  });
  const screen = texPlane(cookingCard(), 3.0);
  screen.position.set(0, 1.6, -0.6);
  group.add(screen);
  // steam
  const N = 260;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    seed[i] = Math.random();
    pos.set([(i % 2 ? 2.2 : -2.2) + (Math.random() - 0.5) * 1.2, -2, (Math.random() - 0.5) * 0.8], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const steamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: Math.min(window.devicePixelRatio, 1.75) } },
    vertexShader: /* glsl */ `
      attribute float aSeed; uniform float uTime; uniform float uPR; varying float vA;
      void main(){
        float ph = fract(uTime * (0.18 + aSeed * 0.12) + aSeed);
        vec3 p = position;
        p.y += ph * 3.2;
        p.x += sin(ph * 6.0 + aSeed * 20.0) * 0.35 * ph;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPR * (10.0 + ph * 40.0) * (8.0 / -mv.z);
        vA = sin(ph * 3.14159) * 0.28;
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.0, 0.93, 0.85), smoothstep(.5, 0., d) * vA); }`,
  });
  group.add(new THREE.Points(geo, steamMat));
  return {
    group,
    light,
    update: (_lp, t) => {
      steamMat.uniforms.uTime.value = t;
      plates.forEach((p, i) => (p.rotation.z = t * 0.15 * (i ? -1 : 1)));
      light.intensity = 28 + Math.sin(t * 9) * 3 + Math.sin(t * 13.3) * 2; // flame flicker
    },
  };
}

/* 6 · Handoff -------------------------------------------------------- */
function handoffZone(): Zone {
  const { group, light } = zoneBase(5);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.2, 2.2), std('#2c3440', 0.4, 0.5));
  counter.position.set(0, -2.9, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.14, 2.5), std('#8a6a48', 0.1, 0.6));
  top.position.set(0, -1.75, 0);
  const bag = new THREE.Group();
  const bagBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.9), std('#c9965c', 0, 0.9));
  const label = texPlane(bagLabel(), 0.9);
  label.position.set(0, 0.05, 0.46);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 24, Math.PI), std('#8a5f30', 0, 0.8));
  handle.position.y = 0.9;
  bag.add(bagBody, label, handle);
  bag.position.set(-1.5, -0.78, 0);
  const sign = texPlane(readyCard(), 3.0);
  sign.position.set(0, 2.0, -0.6);
  const cone = lightCone('#5bf0c9', 2.6, 6);
  cone.position.set(0, 2.6, 0);
  group.add(counter, top, bag, sign, cone);
  return {
    group,
    light,
    update: (lp, t) => {
      const k = ease((lp - 0.2) / 0.45);
      bag.position.x = -1.5 + k * 1.5;
      bag.position.z = k * 0.6;
      bag.rotation.y = Math.sin(t * 0.8) * 0.08;
      const ready = ease((lp - 0.35) / 0.15);
      sign.scale.setScalar(0.85 + ready * 0.15);
      (sign.material as THREE.MeshBasicMaterial).opacity = 0.35 + ready * 0.65;
      light.intensity = 18 + ready * 30 * (0.75 + 0.25 * Math.sin(t * 3));
    },
  };
}

export function buildZones(imgs: Images): Zone[] {
  return [standZone(imgs), orderZone(imgs), paymentZone(), kdsZone(imgs), cookingZone(imgs), handoffZone()];
}

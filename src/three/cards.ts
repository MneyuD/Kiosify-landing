// Canvas-drawn "cards" that float along the journey tunnel.
// Each card is rendered once into a 2D canvas and used as a texture.

export type Images = Record<string, HTMLImageElement>;

export const IMAGE_SRC: Record<string, string> = {
  pho: '/images/pho.webp',
  banhmi: '/images/banh-mi.webp',
  bao: '/images/bao.png',
  ticket: '/images/kitchen-ticket.png',
  kds: '/images/kds-board.png',
  logo: '/images/kiosify-logo.png',
};

export function loadImages(): Promise<Images> {
  const entries = Object.entries(IMAGE_SRC).map(
    ([k, src]) =>
      new Promise<[string, HTMLImageElement]>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve([k, img]);
        img.onerror = () => resolve([k, img]);
        img.src = src;
      }),
  );
  return Promise.all(entries).then((list) => Object.fromEntries(list));
}

export const TEAL = '#4fe3c1';
export const NAVY = '#0b1f3a';
export const FONT = '"Plus Jakarta Sans", Inter, system-ui, sans-serif';
export const PAD = 36; // glow margin around every card

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w + PAD * 2;
  c.height = h + PAD * 2;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Glass frame with outer teal glow. Returns a clip-ready inner rect. */
export function frame(ctx: CanvasRenderingContext2D, w: number, h: number, fill = '#0d1b33', glow = TEAL) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 30;
  rr(ctx, PAD, PAD, w, h, 34);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.save();
  rr(ctx, PAD + 1, PAD + 1, w - 2, h - 2, 33);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(160,240,225,0.55)';
  ctx.stroke();
  ctx.restore();
}

export function clipInner(ctx: CanvasRenderingContext2D, w: number, h: number) {
  rr(ctx, PAD + 3, PAD + 3, w - 6, h - 6, 31);
  ctx.clip();
}

export function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  if (!img.naturalWidth) return;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * s;
  const ih = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

export function text(
  ctx: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 700,
  align: CanvasTextAlign = 'left',
) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t, x, y);
}

export function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bg: string) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
}

/* ---------------- 01 · Menu dishes ---------------- */
export function dishCard(key: string, name: string, desc: string, price: string) {
  return (imgs: Images) => {
    const W = 640, H = 820;
    const { c, ctx } = makeCanvas(W, H);
    frame(ctx, W, H, '#ffffff');
    ctx.save();
    clipInner(ctx, W, H);
    cover(ctx, imgs[key], PAD, PAD, W, W);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PAD, PAD + W - 8, W, H - W + 8);
    text(ctx, name, PAD + 40, PAD + W + 64, 44, NAVY, 800);
    text(ctx, desc, PAD + 40, PAD + W + 112, 26, '#6b7a90', 500);
    pill(ctx, PAD + W - 190, PAD + W + 26, 150, 60, TEAL);
    text(ctx, price, PAD + W - 115, PAD + W + 67, 32, NAVY, 800, 'center');
    ctx.restore();
    return c;
  };
}

/* ---------------- 02 · Kiosk ordering screen ---------------- */
export function kioskCard(imgs: Images) {
  const W = 720, H = 1180;
  const { c, ctx } = makeCanvas(W, H);
  frame(ctx, W, H, '#f6f8fb');
  ctx.save();
  clipInner(ctx, W, H);
  const x0 = PAD, y0 = PAD;
  // header
  const g = ctx.createLinearGradient(0, y0, 0, y0 + 170);
  g.addColorStop(0, '#c62828');
  g.addColorStop(1, '#e53935');
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, W, 170);
  text(ctx, 'BANH MI ZON', x0 + 44, y0 + 86, 46, '#fff', 800);
  text(ctx, 'Tap to customize your order', x0 + 44, y0 + 132, 26, 'rgba(255,255,255,.85)', 500);
  // tabs
  const tabs = ['Banh mi', 'Pho', 'Bao', 'Drinks'];
  let tx = x0 + 36;
  tabs.forEach((t, i) => {
    ctx.font = `700 26px ${FONT}`;
    const tw = ctx.measureText(t).width + 48;
    pill(ctx, tx, y0 + 200, tw, 56, i === 0 ? NAVY : '#e7ecf3');
    text(ctx, t, tx + tw / 2, y0 + 237, 26, i === 0 ? '#fff' : NAVY, 700, 'center');
    tx += tw + 14;
  });
  // items grid
  const items: [string, string, string][] = [
    ['banhmi', 'Traditional', '$9.50'],
    ['pho', 'Sliced Beef Pho', '$14.00'],
    ['bao', 'Steam Bao Bun', '$6.50'],
    ['banhmi', 'Spicy Pork Belly', '$10.50'],
  ];
  items.forEach(([k, name, price], i) => {
    const cx = x0 + 36 + (i % 2) * 334;
    const cy = y0 + 290 + Math.floor(i / 2) * 350;
    ctx.save();
    ctx.shadowColor = 'rgba(15,35,70,.12)';
    ctx.shadowBlur = 20;
    rr(ctx, cx, cy, 314, 330, 26);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    ctx.save();
    rr(ctx, cx, cy, 314, 220, 26);
    ctx.clip();
    cover(ctx, imgs[k], cx, cy, 314, 240);
    ctx.restore();
    text(ctx, name, cx + 22, cy + 266, 26, NAVY, 700);
    text(ctx, price, cx + 22, cy + 308, 26, '#c62828', 800);
    // add button
    ctx.beginPath();
    ctx.arc(cx + 270, cy + 290, 26, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? TEAL : NAVY;
    ctx.fill();
    text(ctx, i === 0 ? '3' : '+', cx + 270, cy + 300, 30, i === 0 ? NAVY : '#fff', 800, 'center');
  });
  // cart bar
  rr(ctx, x0 + 36, y0 + H - 150, W - 72, 110, 30);
  ctx.fillStyle = NAVY;
  ctx.fill();
  text(ctx, '8 items · Minh Anh', x0 + 76, y0 + H - 106, 26, 'rgba(255,255,255,.7)', 500);
  text(ctx, '$78.50', x0 + 76, y0 + H - 64, 40, '#fff', 800);
  pill(ctx, x0 + W - 300, y0 + H - 128, 230, 66, TEAL);
  text(ctx, 'Checkout →', x0 + W - 185, y0 + H - 84, 28, NAVY, 800, 'center');
  ctx.restore();
  return c;
}

/* ---------------- 03 · Payment ---------------- */
export function paymentCard() {
  const W = 760, H = 960;
  const { c, ctx } = makeCanvas(W, H);
  frame(ctx, W, H, '#0e1f3b');
  ctx.save();
  clipInner(ctx, W, H);
  const x0 = PAD, y0 = PAD;
  const bg = ctx.createRadialGradient(x0 + W / 2, y0 + 380, 20, x0 + W / 2, y0 + 380, 520);
  bg.addColorStop(0, '#163a5c');
  bg.addColorStop(1, '#0b172c');
  ctx.fillStyle = bg;
  ctx.fillRect(x0, y0, W, H);
  text(ctx, 'TOTAL DUE', x0 + W / 2, y0 + 110, 28, 'rgba(255,255,255,.6)', 700, 'center');
  text(ctx, '$78.50', x0 + W / 2, y0 + 210, 96, '#fff', 800, 'center');
  // contactless waves
  const cx = x0 + W / 2, cy = y0 + 470;
  ctx.beginPath();
  ctx.arc(cx, cy, 150, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(79,227,193,.12)';
  ctx.fill();
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx - 60, cy, 30 + i * 32, -Math.PI / 3.2, Math.PI / 3.2);
    ctx.strokeStyle = `rgba(79,227,193,${1 - i * 0.18})`;
    ctx.lineWidth = 14;
    ctx.stroke();
  }
  text(ctx, 'Tap, insert or swipe', x0 + W / 2, y0 + 700, 36, '#fff', 700, 'center');
  // approved chip
  pill(ctx, x0 + W / 2 - 200, y0 + 760, 400, 84, '#1fb58f');
  text(ctx, '✓  Approved', x0 + W / 2, y0 + 815, 36, '#fff', 800, 'center');
  text(ctx, 'Securely processed by Square', x0 + W / 2, y0 + 905, 24, 'rgba(255,255,255,.55)', 500, 'center');
  ctx.restore();
  return c;
}

/* ---------------- 04 · Square sync ---------------- */
export function syncCard() {
  const W = 1120, H = 760;
  const { c, ctx } = makeCanvas(W, H);
  frame(ctx, W, H, '#0c1a31');
  ctx.save();
  clipInner(ctx, W, H);
  const x0 = PAD, y0 = PAD;
  text(ctx, 'REAL-TIME SYNC', x0 + 60, y0 + 90, 26, TEAL, 800);
  text(ctx, 'Kiosify  ⇄  Square POS', x0 + 60, y0 + 160, 56, '#fff', 800);
  // two nodes
  const node = (x: number, label: string, sub: string, color: string) => {
    rr(ctx, x, y0 + 220, 300, 200, 30);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
    rr(ctx, x + 30, y0 + 255, 70, 70, 16);
    ctx.fillStyle = color;
    ctx.fill();
    text(ctx, label, x + 30, y0 + 370, 34, '#fff', 800);
    text(ctx, sub, x + 30, y0 + 404, 22, 'rgba(255,255,255,.55)', 500);
  };
  node(x0 + 60, 'Kiosify', 'Kiosk + KDS', TEAL);
  node(x0 + W - 360, 'Square', 'POS · Payments', '#e9eef6');
  // inner square icon for Square node (generic outline, not a trademark)
  rr(ctx, x0 + W - 315, y0 + 270, 40, 40, 8);
  ctx.strokeStyle = '#0c1a31';
  ctx.lineWidth = 6;
  ctx.stroke();
  // arrows
  for (let i = 0; i < 3; i++) {
    const y = y0 + 270 + i * 50;
    ctx.beginPath();
    ctx.setLineDash([14, 12]);
    ctx.moveTo(x0 + 390, y);
    ctx.lineTo(x0 + W - 390, y);
    ctx.strokeStyle = i === 1 ? 'rgba(255,255,255,.5)' : TEAL;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  text(ctx, 'menu · prices · modifiers', x0 + W / 2, y0 + 258, 22, 'rgba(255,255,255,.7)', 600, 'center');
  text(ctx, 'orders · tickets', x0 + W / 2, y0 + 308, 22, 'rgba(255,255,255,.7)', 600, 'center');
  text(ctx, 'payments · refunds', x0 + W / 2, y0 + 358, 22, 'rgba(255,255,255,.7)', 600, 'center');
  // status rows
  const rows: [string, string][] = [
    ['Catalog synced', '48 items · 12 modifiers'],
    ['Order #9684 sent to Square', '07:32:14 AM'],
    ['Payment captured', '$78.50 · Visa •••• 4242'],
  ];
  rows.forEach(([a, b], i) => {
    const y = y0 + 490 + i * 82;
    rr(ctx, x0 + 60, y, W - 120, 66, 18);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x0 + 100, y + 33, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1fb58f';
    ctx.fill();
    text(ctx, a, x0 + 132, y + 43, 26, '#fff', 700);
    text(ctx, b, x0 + W - 90, y + 43, 24, 'rgba(255,255,255,.6)', 500, 'right');
  });
  ctx.restore();
  return c;
}

/* ---------------- 05 / 06 · image based cards ---------------- */
export function imageCard(key: string, w: number, h: number, fill = '#ffffff') {
  return (imgs: Images) => {
    const { c, ctx } = makeCanvas(w, h);
    frame(ctx, w, h, fill);
    ctx.save();
    clipInner(ctx, w, h);
    cover(ctx, imgs[key], PAD, PAD, w, h);
    ctx.restore();
    return c;
  };
}

/* ---------------- 06b · cooking status ---------------- */
export function cookingCard() {
  const W = 760, H = 640;
  const { c, ctx } = makeCanvas(W, H);
  frame(ctx, W, H, '#fff7ed', '#ff9f5a');
  ctx.save();
  clipInner(ctx, W, H);
  const x0 = PAD, y0 = PAD;
  text(ctx, 'GRILL STATION', x0 + 50, y0 + 80, 26, '#c2410c', 800);
  text(ctx, '#9684 · For here', x0 + 50, y0 + 140, 46, NAVY, 800);
  const items: [string, number][] = [
    ['3 × Banh mi · Traditional', 1],
    ['2 × Banh mi · Beef Bulgogi', 1],
    ['3 × Banh mi · Spicy Pork Belly', 0.6],
  ];
  items.forEach(([t, v], i) => {
    const y = y0 + 210 + i * 120;
    text(ctx, t, x0 + 50, y + 30, 30, NAVY, 700);
    rr(ctx, x0 + 50, y + 52, W - 100, 22, 11);
    ctx.fillStyle = '#fde3cc';
    ctx.fill();
    rr(ctx, x0 + 50, y + 52, (W - 100) * v, 22, 11);
    ctx.fillStyle = v >= 1 ? '#1fb58f' : '#ff8a3d';
    ctx.fill();
  });
  text(ctx, '⏱  04:12 elapsed', x0 + 50, y0 + H - 50, 28, '#9a3412', 700);
  ctx.restore();
  return c;
}

/* ---------------- 07 · Ready for pickup ---------------- */
export function readyCard() {
  const W = 900, H = 700;
  const { c, ctx } = makeCanvas(W, H);
  frame(ctx, W, H, '#0b2a26', '#5bf0c9');
  ctx.save();
  clipInner(ctx, W, H);
  const x0 = PAD, y0 = PAD;
  const g = ctx.createRadialGradient(x0 + W / 2, y0 + 220, 10, x0 + W / 2, y0 + 220, 460);
  g.addColorStop(0, '#11564a');
  g.addColorStop(1, '#0a1f24');
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, W, H);
  ctx.beginPath();
  ctx.arc(x0 + W / 2, y0 + 210, 110, 0, Math.PI * 2);
  ctx.fillStyle = TEAL;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x0 + W / 2 - 50, y0 + 212);
  ctx.lineTo(x0 + W / 2 - 12, y0 + 252);
  ctx.lineTo(x0 + W / 2 + 56, y0 + 170);
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = NAVY;
  ctx.stroke();
  text(ctx, 'ORDER READY', x0 + W / 2, y0 + 400, 34, TEAL, 800, 'center');
  text(ctx, '#9684 · Minh Anh', x0 + W / 2, y0 + 480, 64, '#fff', 800, 'center');
  text(ctx, 'Please pick up at the counter', x0 + W / 2, y0 + 545, 30, 'rgba(255,255,255,.7)', 500, 'center');
  pill(ctx, x0 + W / 2 - 170, y0 + 590, 340, 64, 'rgba(79,227,193,.16)');
  text(ctx, 'Prep time 6m 40s', x0 + W / 2, y0 + 632, 26, TEAL, 700, 'center');
  ctx.restore();
  return c;
}


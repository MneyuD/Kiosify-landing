// Extra canvas art for the "order journey": stand screen, order-token forms, labels.
import { cover, FONT, frame, makeCanvas, NAVY, PAD, pill, rr, TEAL, text, type Images } from './cards';

/** Square Stand welcome screen (no glow frame — it sits inside the tablet bezel). */
export function standScreen(imgs: Images) {
  const W = 1100, H = 800;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);
  cover(ctx, imgs.banhmi, 0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(8,14,28,.55)');
  g.addColorStop(0.55, 'rgba(8,14,28,.35)');
  g.addColorStop(1, 'rgba(8,14,28,.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'BANH MI ZON', 60, 90, 40, '#fff', 800);
  text(ctx, 'Vietnamese Gourmet', 60, 132, 26, 'rgba(255,255,255,.75)', 500);
  text(ctx, 'Hungry?', 60, 560, 92, '#fff', 800);
  text(ctx, 'Order here & skip the line', 60, 620, 36, 'rgba(255,255,255,.85)', 600);
  pill(ctx, 60, 670, 360, 84, TEAL);
  text(ctx, 'Tap to start  →', 240, 724, 34, NAVY, 800, 'center');
  const langs = ['EN', 'VI', 'ES', 'FR', 'KO', '中文'];
  langs.forEach((l, i) => {
    const x = W - 60 - (langs.length - i) * 78;
    pill(ctx, x, 60, 66, 46, i === 0 ? '#fff' : 'rgba(255,255,255,.18)');
    text(ctx, l, x + 33, 92, 22, i === 0 ? NAVY : '#fff', 700, 'center');
  });
  return c;
}

/* ---------------- order token forms (one per stage) ---------------- */

const TOKEN_W = 520, TOKEN_H = 600;

function tokenBase(glow: string) {
  const { c, ctx } = makeCanvas(TOKEN_W, TOKEN_H);
  frame(ctx, TOKEN_W, TOKEN_H, '#0c1a31', glow);
  return { c, ctx, x0: PAD, y0: PAD, cx: PAD + TOKEN_W / 2 };
}

function tokenFooter(ctx: CanvasRenderingContext2D, cx: number, y: number, title: string, sub: string, accent: string) {
  text(ctx, title, cx, y, 46, '#fff', 800, 'center');
  text(ctx, sub, cx, y + 50, 28, accent, 700, 'center');
}

export function tokenTap() {
  const { c, ctx, y0, cx } = tokenBase('#8fd8ff');
  for (let i = 3; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(cx, y0 + 230, 60 + i * 34, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(143,216,255,${0.08 + (3 - i) * 0.07})`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, y0 + 230, 56, 0, Math.PI * 2);
  ctx.fillStyle = '#8fd8ff';
  ctx.fill();
  text(ctx, 'TAP', cx, y0 + 243, 34, NAVY, 800, 'center');
  tokenFooter(ctx, cx, y0 + 470, 'New order', '#9684 · Minh Anh', '#8fd8ff');
  return c;
}

export function tokenCart() {
  const { c, ctx, y0, cx } = tokenBase(TEAL);
  // cart icon
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 140, y0 + 120);
  ctx.lineTo(cx - 100, y0 + 120);
  ctx.lineTo(cx - 60, y0 + 300);
  ctx.lineTo(cx + 120, y0 + 300);
  ctx.lineTo(cx + 150, y0 + 170);
  ctx.lineTo(cx - 85, y0 + 170);
  ctx.stroke();
  [cx - 40, cx + 100].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, y0 + 350, 22, 0, Math.PI * 2);
    ctx.fillStyle = TEAL;
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(cx + 130, y0 + 120, 48, 0, Math.PI * 2);
  ctx.fillStyle = '#ff4d4f';
  ctx.fill();
  text(ctx, '8', cx + 130, y0 + 137, 46, '#fff', 800, 'center');
  tokenFooter(ctx, cx, y0 + 470, '8 items', '$78.50', TEAL);
  return c;
}

export function creditCard() {
  const W = 860, H = 540;
  const { c, ctx } = makeCanvas(W, H);
  ctx.save();
  ctx.shadowColor = '#3ddc84';
  ctx.shadowBlur = 30;
  rr(ctx, PAD, PAD, W, H, 40);
  const g = ctx.createLinearGradient(PAD, PAD, PAD + W, PAD + H);
  g.addColorStop(0, '#0f3d2e');
  g.addColorStop(0.5, '#147a55');
  g.addColorStop(1, '#3ddc84');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  // chip
  rr(ctx, PAD + 70, PAD + 160, 120, 90, 16);
  ctx.fillStyle = '#e9d18a';
  ctx.fill();
  // contactless
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(PAD + 250, PAD + 205, 20 + i * 22, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }
  text(ctx, '••••  ••••  ••••  4242', PAD + 70, PAD + 360, 50, '#fff', 700);
  text(ctx, 'MINH ANH', PAD + 70, PAD + 450, 32, 'rgba(255,255,255,.85)', 700);
  text(ctx, '12/29', PAD + W - 70, PAD + 450, 32, 'rgba(255,255,255,.85)', 700, 'right');
  return c;
}

export function tokenCard() {
  const { c, ctx, x0, y0, cx } = tokenBase('#3ddc84');
  ctx.save();
  ctx.translate(cx, y0 + 230);
  ctx.rotate(-0.12);
  rr(ctx, -190, -120, 380, 240, 26);
  const g = ctx.createLinearGradient(-190, -120, 190, 120);
  g.addColorStop(0, '#147a55');
  g.addColorStop(1, '#3ddc84');
  ctx.fillStyle = g;
  ctx.fill();
  rr(ctx, -150, -50, 70, 52, 10);
  ctx.fillStyle = '#e9d18a';
  ctx.fill();
  text(ctx, '•••• 4242', -150, 80, 34, '#fff', 700);
  ctx.restore();
  pill(ctx, x0 + 120, y0 + 395, TOKEN_W - 240, 64, '#1fb58f');
  text(ctx, '✓ Approved', cx, y0 + 438, 32, '#fff', 800, 'center');
  text(ctx, '$78.50 · Square', cx, y0 + 525, 30, '#3ddc84', 700, 'center');
  return c;
}

export function tokenTicket() {
  const { c, ctx, x0, y0, cx } = tokenBase('#ff5a5a');
  rr(ctx, x0 + 90, y0 + 50, TOKEN_W - 180, 380, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  text(ctx, 'KITCHEN ORDER', cx, y0 + 110, 26, NAVY, 800, 'center');
  text(ctx, '#9684', cx, y0 + 175, 56, NAVY, 800, 'center');
  ctx.fillStyle = '#d7dde6';
  ctx.fillRect(x0 + 120, y0 + 200, TOKEN_W - 240, 3);
  ['3 × Traditional', '2 × Bulgogi', '3 × Pork Belly'].forEach((t, i) => text(ctx, t, x0 + 125, y0 + 255 + i * 50, 28, '#334155', 700));
  text(ctx, 'Routed to GRILL', cx, y0 + 520, 34, '#ff7a7a', 800, 'center');
  return c;
}

export function tokenFood(imgs: Images) {
  const { c, ctx, y0, cx } = tokenBase('#ff9f43');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, y0 + 220, 170, 0, Math.PI * 2);
  ctx.clip();
  cover(ctx, imgs.banhmi, cx - 170, y0 + 50, 340, 340);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, y0 + 220, 172, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff9f43';
  ctx.lineWidth = 8;
  ctx.stroke();
  tokenFooter(ctx, cx, y0 + 470, 'Cooking', '⏱ 04:12 · 2 of 3 done', '#ffb066');
  return c;
}

export function tokenBag() {
  const { c, ctx, y0, cx } = tokenBase('#5bf0c9');
  // kraft paper bag
  ctx.fillStyle = '#c9965c';
  ctx.beginPath();
  ctx.moveTo(cx - 130, y0 + 130);
  ctx.lineTo(cx + 130, y0 + 130);
  ctx.lineTo(cx + 150, y0 + 390);
  ctx.lineTo(cx - 150, y0 + 390);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b07f48';
  ctx.fillRect(cx - 130, y0 + 130, 260, 26);
  ctx.strokeStyle = '#8a5f30';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, y0 + 130, 60, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, y0 + 265, 58, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, y0 + 265, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#e53935';
  ctx.fill();
  tokenFooter(ctx, cx, y0 + 470, 'Ready!', '#9684 · picked up', '#5bf0c9');
  return c;
}

export function bagLabel() {
  const W = 420, H = 300;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d4a46b';
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 40, 50, W - 80, H - 100, 22);
  ctx.fillStyle = '#fff';
  ctx.fill();
  text(ctx, '#9684', W / 2, 140, 64, NAVY, 800, 'center');
  text(ctx, 'Minh Anh · For here', W / 2, 192, 26, '#475569', 700, 'center');
  return c;
}

export function hubLabel() {
  const W = 900, H = 220;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.shadowColor = TEAL;
  ctx.shadowBlur = 24;
  ctx.font = `800 96px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e9fbf6';
  ctx.fillText('SQUARE POS', W / 2, 120);
  ctx.shadowBlur = 0;
  ctx.font = `600 40px ${FONT}`;
  ctx.fillStyle = 'rgba(160,240,225,.8)';
  ctx.fillText('menu · orders · payments in sync', W / 2, 190);
  return c;
}

export function glowSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return c;
}

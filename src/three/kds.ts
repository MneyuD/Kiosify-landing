// Kitchen display board drawn on canvas, matching the real KDS layout,
// with the three timer states: on time (green), due soon (yellow), late (red).
import { FONT, pill, rr, text } from './cards';

export const KDS_STATUS = {
  ok: { label: 'On time', range: '< 5 min', bar: '#22b573', bg: '#e3f7ec', ink: '#0d7a4a', btn: '#16a463', btnInk: '#ffffff' },
  warn: { label: 'Due soon', range: '5–10 min', bar: '#f5b700', bg: '#fff4cc', ink: '#8a6100', btn: '#f5b700', btnInk: '#3d2c00' },
  late: { label: 'Late', range: '> 10 min', bar: '#e5303a', bg: '#fde4e5', ink: '#b3141d', btn: '#e5303a', btnInk: '#ffffff' },
} as const;
type KdsStatus = keyof typeof KDS_STATUS;

type KdsItem = { t: string; done?: boolean; mods?: string[]; note?: string };
type KdsTicket = { id: string; type: string; name: string; time: string; status: KdsStatus; note?: string; items: KdsItem[]; state: string };

const TICKETS: KdsTicket[] = [
  {
    id: '#9684', type: 'For here', name: 'Minh Anh', time: '02:14', status: 'ok', note: 'More spicy', state: 'In progress',
    items: [
      { t: '3 × Banh mi · Traditional', done: true, note: 'No jalapeño' },
      { t: '2 × Banh mi · Bulgogi', note: 'No onion' },
      { t: '3 × Banh mi · Pork Belly', note: 'Extra sauce' },
    ],
  },
  {
    id: '#9685', type: 'To go', name: 'Eric Tran', time: '03:40', status: 'ok', state: 'Paid',
    items: [
      { t: '1 × Pho Soup', mods: ['Extra protein'] },
      { t: '1 × Green Tea', mods: ['Popping Boba'] },
      { t: '1 × Fresh Spring Rolls' },
    ],
  },
  {
    id: '#9682', type: 'Dine in', name: 'Sofia Martinez', time: '07:05', status: 'warn', state: 'In progress',
    items: [
      { t: '1 × Rice Bowls', done: true },
      { t: '1 × Fresh Spring Rolls', note: 'Pack separately.' },
      { t: '1 × Fresh lime soda', mods: ['Rainbow Jelly'] },
    ],
  },
  {
    id: '#9680', type: 'Pick up', name: 'Hannah Lee', time: '08:32', status: 'warn', state: 'Paid',
    items: [
      { t: '2 × Steam Bao Bun', mods: ['Pork & egg'] },
      { t: '1 × Bottle water', note: 'Room temperature.' },
    ],
  },
  {
    id: '#9679', type: 'Dine in', name: 'Luan Nguyen', time: '14:52', status: 'late', note: 'Khong rau', state: 'Paid',
    items: [
      { t: '1 × Banh mi', mods: ['Extra egg', 'Extra protein'] },
      { t: '1 × Vermicelli Bowls' },
    ],
  },
];

function checkbox(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, on: boolean) {
  rr(ctx, x, y, s, s, 5);
  if (on) {
    ctx.fillStyle = '#0f8a6a';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.25, y + s * 0.52);
    ctx.lineTo(x + s * 0.43, y + s * 0.7);
    ctx.lineTo(x + s * 0.76, y + s * 0.3);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#b9c3d0';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#d5dde8';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** `header: false` drops the title + location select (when the page around it already shows them). */
export function kdsBoard({ header = true }: { header?: boolean } = {}) {
  const top = header ? 0 : -70;
  const W = 1500, H = 800 + top;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f3f6fa';
  ctx.fillRect(0, 0, W, H);

  if (header) {
    text(ctx, 'Kitchen display', 32, 62, 38, '#0b2a4a', 800);
    box(ctx, 330, 28, 300, 48);
    text(ctx, 'Petaluma', 348, 60, 22, '#334155', 600);
    text(ctx, '▾', 606, 60, 20, '#334155', 700);
  }
  rr(ctx, 32, 98 + top, 170, 46, 10);
  ctx.fillStyle = '#0d6e5c';
  ctx.fill();
  text(ctx, 'Active orders', 117, 128 + top, 20, '#fff', 700, 'center');
  box(ctx, 214, 98 + top, 200, 46);
  text(ctx, 'Completed today', 314, 128 + top, 20, '#334155', 600, 'center');

  // legend (right-aligned): on time · due soon · late
  let lx = W - 32;
  (['late', 'warn', 'ok'] as KdsStatus[]).forEach((k) => {
    const s = KDS_STATUS[k];
    const label = `${s.label} ${s.range}`;
    ctx.font = `700 19px ${FONT}`;
    const w = ctx.measureText(label).width + 52;
    lx -= w;
    pill(ctx, lx, 100 + top, w, 42, s.bg);
    ctx.beginPath();
    ctx.arc(lx + 22, 121 + top, 8, 0, Math.PI * 2);
    ctx.fillStyle = s.bar;
    ctx.fill();
    text(ctx, label, lx + 38, 128 + top, 19, s.ink, 700);
    lx -= 12;
  });

  // tickets
  const gap = 16;
  const colW = (W - 64 - gap * 4) / 5;
  TICKETS.forEach((tk, i) => {
    const s = KDS_STATUS[tk.status];
    const x = 32 + i * (colW + gap);
    const y = 172 + top;
    let h = 136 + (tk.note ? 58 : 0);
    tk.items.forEach((it) => (h += 44 + (it.mods?.length ?? 0) * 34 + (it.note ? 54 : 0)));
    h += 96;

    ctx.save();
    ctx.shadowColor = tk.status === 'late' ? 'rgba(229,48,58,.28)' : 'rgba(15,35,70,.1)';
    ctx.shadowBlur = 18;
    rr(ctx, x, y, colW, h, 14);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    ctx.save();
    rr(ctx, x, y, colW, h, 14);
    ctx.clip();
    ctx.fillStyle = s.bar;
    ctx.fillRect(x, y, colW, 10);
    ctx.restore();
    rr(ctx, x, y, colW, h, 14);
    ctx.strokeStyle = tk.status === 'late' ? s.bar : '#e3e9f1';
    ctx.lineWidth = tk.status === 'late' ? 3 : 1.5;
    ctx.stroke();

    let cy = y + 54;
    text(ctx, tk.id, x + 18, cy, 26, '#0b2a4a', 800);
    text(ctx, tk.type, x + colW - 18, cy - 2, 18, '#334155', 600, 'right');
    cy += 34;
    text(ctx, tk.name, x + 18, cy, 18, '#64748b', 500);
    pill(ctx, x + colW - 104, cy - 24, 88, 34, s.bg);
    text(ctx, tk.time, x + colW - 60, cy - 1, 19, s.ink, 800, 'center');
    cy += 28;
    pill(ctx, x + 16, cy - 20, 18 + ctx.measureText(s.label).width + 26, 28, s.bg);
    ctx.beginPath();
    ctx.arc(x + 30, cy - 6, 6, 0, Math.PI * 2);
    ctx.fillStyle = s.bar;
    ctx.fill();
    text(ctx, s.label, x + 42, cy, 16, s.ink, 800);
    cy += 16;
    if (tk.note) {
      rr(ctx, x + 14, cy, colW - 28, 44, 8);
      ctx.fillStyle = '#fdf1d4';
      ctx.fill();
      text(ctx, tk.note, x + 28, cy + 29, 18, '#5b4a1c', 600);
      cy += 58;
    }
    tk.items.forEach((it) => {
      cy += 10;
      checkbox(ctx, x + 18, cy, 22, !!it.done);
      text(ctx, it.t, x + 50, cy + 18, 17, it.done ? '#94a3b8' : '#1e293b', 600);
      if (it.done) {
        ctx.font = `600 17px ${FONT}`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 50, cy + 12, ctx.measureText(it.t).width, 2);
      }
      cy += 34;
      it.mods?.forEach((m) => {
        checkbox(ctx, x + 50, cy, 18, false);
        text(ctx, m, x + 78, cy + 15, 16, '#475569', 500);
        cy += 34;
      });
      if (it.note) {
        rr(ctx, x + 46, cy, colW - 64, 42, 8);
        ctx.fillStyle = '#fdf1d4';
        ctx.fill();
        text(ctx, it.note, x + 60, cy + 27, 16, '#5b4a1c', 600);
        cy += 54;
      }
    });
    cy += 18;
    text(ctx, tk.state, x + 18, cy, 17, '#334155', 600);
    cy += 14;
    box(ctx, x + 14, cy, 96, 44);
    text(ctx, 'Reprint ▾', x + 62, cy + 28, 16, '#334155', 600, 'center');
    rr(ctx, x + 120, cy, colW - 134, 44, 8);
    ctx.fillStyle = s.btn;
    ctx.fill();
    text(ctx, 'Complete order', x + 120 + (colW - 134) / 2, cy + 28, 16, s.btnInk, 700, 'center');
  });
  return c;
}

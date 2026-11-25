import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BarChart, CUSTOMERS, DishesDonut, GROSS, MONTHS, ORDER_TYPES, RevenueChart, SERIES, Spark } from './charts';
import { kdsBoard } from '../three/kds';

gsap.registerPlugin(ScrollTrigger);

/** Same KDS board as the 3D journey (on time / due soon / late), rendered once to an image. */
function KdsShot() {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    void document.fonts.ready.then(() => setSrc(kdsBoard({ header: false }).toDataURL('image/png')));
  }, []);
  return src ? <img className="kds-shot" src={src} alt="Kitchen display with on-time, due-soon and late orders" /> : <div className="kds-shot" style={{ aspectRatio: '1500 / 730' }} />;
}

const TABS = ['Overview', 'Revenue', 'Dishes', 'Customers', 'Orders', 'Kitchen'] as const;
type Tab = (typeof TABS)[number];

const ORDERS = [
  { id: '#9684', name: 'Minh Anh', time: '11/25/2026 07:32', total: '$78.50', type: 'For here' },
  { id: '#9683', name: 'Eric Tran', time: '11/25/2026 07:18', total: '$44.28', type: 'For here' },
  { id: '#9682', name: 'Sofia Martinez', time: '11/25/2026 07:05', total: '$23.75', type: 'To go' },
  { id: '#9681', name: 'Luan Nguyen', time: '11/25/2026 06:51', total: '$115.60', type: 'For here' },
  { id: '#9680', name: 'Hannah Lee', time: '11/25/2026 06:44', total: '$31.20', type: 'Pick up' },
  { id: '#9679', name: 'David Kim', time: '11/25/2026 06:30', total: '$18.90', type: 'Delivery' },
];

const TOP = [
  { name: 'Banh mi · Traditional', n: 812, img: '/images/banh-mi.webp' },
  { name: 'Sliced Beef Pho', n: 644, img: '/images/pho.webp' },
  { name: 'Steam Bao Bun', n: 418, img: '/images/bao.png' },
];

const typeClass = (t: string) => 't-' + t.toLowerCase().replace(/\s/g, '');

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  chart: 'M21 12a9 9 0 1 1-9-9v9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  doc: 'M6 2h9l5 5v15H6zM14 2v6h6',
  kds: 'M3 4h18v12H3zM8 20h8M12 16v4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
};

function OrderTable({ rows = ORDERS, compact = false }: { rows?: typeof ORDERS; compact?: boolean }) {
  return (
    <table className="m-table">
      <thead>
        <tr><th>Order</th><th>Customer</th><th>Time</th><th>Total payment</th><th>Type</th></tr>
      </thead>
      <tbody>
        {rows.map((o, i) => (
          <tr key={o.id} style={{ animationDelay: `${i * 60}ms` }}>
            <td className="mono">{o.id}</td>
            <td>{o.name}</td>
            <td className="muted">{compact ? o.time.slice(11) : o.time}</td>
            <td><b>{o.total}</b></td>
            <td><span className={`type-pill ${typeClass(o.type)}`}>{o.type}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Overview() {
  const totalGross = GROSS.reduce((a, b) => a + b, 0);
  return (
    <div className="m-grid">
      <div className="m-card kpis">
        <div className="kpi-hero">
          <span className="m-label">Total revenue</span>
          <div className="kpi-big">${totalGross.toLocaleString('en-US')}<small>.00</small></div>
          <span className="delta up">▲ 18.4% vs last year</span>
        </div>
        <div className="kpi-row">
          <div><span className="m-label">Total dish ordered</span><b>6,482</b><span className="delta up">▲ 12.7%</span></div>
          <Spark data={[380, 410, 455, 430, 520, 560, 610, 590, 640, 700, 760]} />
        </div>
        <div className="kpi-row">
          <div><span className="m-label">Total customers</span><b>3,330</b><span className="delta up">▲ 9.3%</span></div>
          <Spark data={CUSTOMERS} color={SERIES[1]} />
        </div>
      </div>
      <div className="m-card">
        <div className="m-card-head"><h4>Orders by type</h4><span className="m-chip">This year</span></div>
        <BarChart
          labels={ORDER_TYPES.map((o) => o.name)} values={ORDER_TYPES.map((o) => o.value)}
          max={1500} ticks={[0, 500, 1000, 1500]} fmt={(n) => n.toLocaleString('en-US')} height={230}
          label="Orders by type this year"
        />
      </div>
      <div className="m-card span2">
        <div className="m-card-head"><h4>Order report</h4><span className="m-chip">Today · 128 orders</span></div>
        <OrderTable rows={ORDERS.slice(0, 4)} compact />
      </div>
      <div className="m-card">
        <div className="m-card-head"><h4>Most ordered</h4><span className="m-link">View all</span></div>
        <ul className="top-list">
          {TOP.map((t) => (
            <li key={t.name}>
              <img src={t.img} alt="" />
              <div><b>{t.name}</b><span>{t.n} dishes ordered</span></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Panel({ title, sub, right, children }: { title: string; sub?: string; right?: string; children: ReactNode }) {
  return (
    <div className="m-card full">
      <div className="m-card-head">
        <div><h3>{title}</h3>{sub && <p className="m-sub">{sub}</p>}</div>
        {right && <span className="m-select">{right} ▾</span>}
      </div>
      {children}
    </div>
  );
}

function TabBody({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'Overview':
      return <Overview />;
    case 'Revenue':
      return (
        <Panel title="Revenue" sub="Wednesday, 25 Nov 2026 · Location: Foodtruck" right="Yearly">
          <div className="rev-sum">
            <div><span className="m-label">Gross (YTD)</span><b>$60,520</b></div>
            <div><span className="m-label">Net (YTD)</span><b>$52,773</b></div>
            <div><span className="m-label">Avg. ticket</span><b>$21.54</b></div>
            <div><span className="m-label">Best month</span><b>Nov</b></div>
          </div>
          <RevenueChart />
        </Panel>
      );
    case 'Dishes':
      return (
        <Panel title="Dishes ordered" sub="Wednesday, 25 Nov 2026 · Location: Foodtruck" right="Yearly">
          <DishesDonut />
        </Panel>
      );
    case 'Customers':
      return (
        <Panel title="Total customers" sub="Wednesday, 25 Nov 2026 · Location: Foodtruck" right="Yearly">
          <BarChart
            labels={MONTHS} values={CUSTOMERS} max={400} ticks={[0, 100, 200, 300, 400]}
            fmt={(n) => String(n)} color={SERIES[1]} label="Customers per month, 2026" height={300}
          />
        </Panel>
      );
    case 'Orders':
      return (
        <Panel title="Order report" sub="Wednesday, 25 Nov 2026 · Location: Foodtruck" right="Today">
          <div className="order-counts">
            {[['72', 'Dine in'], ['31', 'To go'], ['17', 'Pickup'], ['8', 'Delivery'], ['128', 'Total orders']].map(([n, l]) => (
              <div key={l}><b>{n}</b><span>{l}</span></div>
            ))}
          </div>
          <OrderTable />
        </Panel>
      );
    case 'Kitchen':
      return (
        <Panel title="Kitchen display" sub="Petaluma · Active orders" right="Petaluma">
          <KdsShot />
        </Panel>
      );
  }
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [auto, setAuto] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.mockup',
        { rotateX: 24, scale: 0.86, y: 80, opacity: 0.4 },
        { rotateX: 0, scale: 1, y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: stageRef.current, start: 'top 95%', end: 'top 25%', scrub: 0.6 } },
      );
      gsap.utils.toArray<HTMLElement>('.float-chip').forEach((el, i) => {
        gsap.fromTo(el, { y: 60 + i * 20, opacity: 0 }, {
          y: -30 - i * 15, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: stageRef.current, start: 'top 85%', end: 'bottom 40%', scrub: 0.8 },
        });
      });
      gsap.from('.dash-head > *', { y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.dash-head', start: 'top 80%' } });
    }, sectionRef);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    if (stageRef.current) io.observe(stageRef.current);
    return () => {
      ctx.revert();
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const id = window.setInterval(() => {
      setTab((t) => TABS[(TABS.indexOf(t) + 1) % TABS.length]);
    }, 5200);
    return () => window.clearInterval(id);
  }, [auto, inView]);

  const pick = (t: Tab) => {
    setAuto(false);
    setTab(t);
  };

  const sideFor: Record<Tab, keyof typeof ICONS> = { Overview: 'home', Revenue: 'chart', Dishes: 'chart', Customers: 'chart', Orders: 'doc', Kitchen: 'kds' };

  return (
    <section className="dash" id="dashboard" ref={sectionRef}>
      <div className="container">
        <div className="dash-head">
          <span className="eyebrow">Admin dashboard</span>
          <h2>Every location, every order, <span className="grad-dark">one dashboard.</span></h2>
          <p>Revenue, dishes, customers and live kitchen status — synced from Square and your kiosks in real time, for one food truck or a whole chain.</p>
        </div>

        <div className="tabs" role="tablist" aria-label="Dashboard views">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => pick(t)}>
              {t}
              {tab === t && auto && inView && <i className="tab-timer" />}
            </button>
          ))}
        </div>

        <div className="mockup-stage" ref={stageRef}>
          <div className="float-chip c1"><b>▲ 18.4%</b> revenue this year</div>
          <div className="float-chip c2"><span className="dot" /> Square synced · 2s ago</div>
          <div className="float-chip c3"><b>6m 40s</b> avg. prep time</div>

          <div className="mockup">
            <div className="m-bar">
              <i /><i /><i />
              <span className="m-url">app.kiosify.com/admin/{tab.toLowerCase()}</span>
            </div>
            <div className="m-body">
              <aside className="m-side">
                <img src="/images/kiosify-logo.png" alt="Kiosify" />
                {(['home', 'chart', 'doc', 'kds', 'gear'] as const).map((k) => (
                  <span key={k} className={`m-ico ${sideFor[tab] === k ? 'on' : ''}`}><Icon d={ICONS[k]} /></span>
                ))}
                <span className="m-lang">EN</span>
              </aside>
              <div className="m-main">
                <div className="m-top">
                  <h3>{tab === 'Overview' ? 'Dashboard' : 'Report'}</h3>
                  <span className="m-date">Wednesday, 25 Nov 2026</span>
                  <span className="m-loc">📍 Location: <b>Foodtruck</b></span>
                </div>
                <div className="m-content" key={tab}>
                  <TabBody tab={tab} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

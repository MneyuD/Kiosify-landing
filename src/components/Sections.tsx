import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? '';

/* ------------------------------------------------------------------ */
export function Nav() {
  const [dark, setDark] = useState(true);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const j = document.getElementById('journey');
      if (!j) return;
      const r = j.getBoundingClientRect();
      // switch to the light nav as the tunnel fades to white (last ~3% of the journey)
      setDark(r.bottom - window.innerHeight > (r.height - window.innerHeight) * 0.03);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`nav ${dark ? 'nav-dark' : 'nav-light'} ${open ? 'open' : ''}`}>
      <a href="#top" className="nav-logo" aria-label="Kiosify home">
        <img src="/images/kiosify-logo.png" alt="Kiosify" />
      </a>
      <nav className="nav-links" onClick={() => setOpen(false)}>
        <a href="#journey">How it flows</a>
        <a href="#dashboard">Dashboard</a>
        <a href="#setup">Setup</a>
        <a href="#pricing">Pricing</a>
      </nav>
      <div className="nav-cta">
        <a className="nav-signin" href={APP_URL ? `${APP_URL}/auth` : '#signup'}>Sign in</a>
        <a className="btn btn-primary btn-sm" href="#signup">Get started</a>
      </div>
      <button className="nav-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}><i /><i /></button>
    </header>
  );
}

/* ------------------------------------------------------------------ */
export function Marquee() {
  const items = ['Self-order kiosk', 'Kitchen display system', 'Square POS sync', 'Star thermal printers', '6 languages', 'iOS & Android', 'Multi-location', 'Real-time reports'];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[...items, ...items].map((t, i) => (
          <span key={i}>{t}<i>✦</i></span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const STEPS = [
  { n: '01', t: 'Create your merchant', d: 'Sign up as a restaurant owner or chain and connect your Square account in one click.' },
  { n: '02', t: 'Add your locations', d: 'Every Square location appears automatically — food truck, flagship, or 20 branches.' },
  { n: '03', t: 'Get an Active Code', d: 'Each location gets its own code to securely pair kiosks and kitchen displays.' },
  { n: '04', t: 'Activate devices', d: 'Enter the code on an iPad or Android tablet and pick Kiosk or KDS mode. Done.' },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const [code, setCode] = useState('');
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.step', { y: 60, opacity: 0, stagger: 0.14, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 78%' } });
      gsap.fromTo('.steps-line i', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 45%', scrub: 0.5 } });
      gsap.from('.device', { y: 80, opacity: 0, rotate: -4, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.devices', start: 'top 80%' } });
      ScrollTrigger.create({
        trigger: '.devices',
        start: 'top 70%',
        once: true,
        onEnter: () => {
          const full = 'KSF-7Q4-29X';
          let i = 0;
          const id = window.setInterval(() => {
            i++;
            setCode(full.slice(0, i));
            if (i >= full.length) window.clearInterval(id);
          }, 110);
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  const done = code.length >= 11;
  return (
    <section className="how" id="setup" ref={ref}>
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Up and running in an afternoon</span>
          <h2>Merchant → Location → Active Code → Device</h2>
          <p>No new POS, no new hardware contracts. Kiosify sits on top of the Square account you already use.</p>
        </div>
        <div className="steps">
          <div className="steps-line"><i /></div>
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="devices">
          <div className="device tablet">
            <div className="device-screen">
              <img src="/images/kiosify-logo.png" alt="" className="device-logo" />
              <p className="device-label">Enter your Active Code</p>
              <div className={`code-input ${done ? 'ok' : ''}`}>
                {code}
                {!done && <span className="caret" />}
              </div>
              <div className="mode-pick">
                <span className={done ? 'on' : ''}>Self-Order Kiosk</span>
                <span>Kitchen Display</span>
              </div>
              <p className={`device-status ${done ? 'show' : ''}`}>✓ Paired with “Banh Mi Zon — Petaluma”</p>
            </div>
          </div>
          <ul className="device-feats">
            <li><b>Star printers</b> receipts &amp; kitchen tickets, routed per station</li>
            <li><b>6 languages</b> guests pick theirs on the welcome screen</li>
            <li><b>Push &amp; OTA updates</b> new features land without reinstalling</li>
            <li><b>Idle screen</b> your promos loop while the kiosk waits</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export const PLANS = [
  { id: 'smart', name: 'Smart Saving', price: 30, cta: 'Start 14 days trial', feats: ['Per location', 'Unlimited orders', 'A dedicated account manager', '24/7 support', 'Access to our online dashboard', 'Reporting and analytics'] },
  { id: 'basic', name: 'Basic', price: 50, cta: 'Sign up now', popular: true, feats: ['Per location', 'Up to 3 kiosks', 'Unlimited orders', 'A dedicated account manager', '24/7 support', 'Access to our online dashboard', 'Reporting and analytics'] },
  { id: 'premium', name: 'Premium', price: 80, cta: 'Sign up now', feats: ['Per location', 'Up to 10 kiosks', 'Free KDS', 'Multi-location support', 'Customizable branding', 'Marketing support', 'Advanced security features'] },
] as const;
export type PlanId = (typeof PLANS)[number]['id'];

export function Pricing({ onPick }: { onPick: (p: PlanId) => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.plan', { y: 70, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.plans', start: 'top 80%' } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section className="pricing" id="pricing" ref={ref}>
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Boost your productivity</span>
          <h2>A more effective way <span className="grad-dark">to track progress</span></h2>
          <p>Simple per-location pricing. No setup fees, cancel anytime.</p>
        </div>
        <div className="plans">
          {PLANS.map((p) => (
            <article key={p.id} className={`plan ${'popular' in p ? 'popular' : ''}`}>
              <header>
                <h3>{p.name}</h3>
                {'popular' in p && <span className="badge">Most popular</span>}
              </header>
              <div className="price"><b>${p.price}</b><span>/monthly</span></div>
              <a href="#signup" className={`btn ${'popular' in p ? 'btn-primary' : 'btn-outline'} btn-block`} onClick={() => onPick(p.id)}>{p.cta}</a>
              <ul>
                {p.feats.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function Signup({ plan, setPlan }: { plan: PlanId; setPlan: (p: PlanId) => void }) {
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.signup-copy > *', { y: 40, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.signup', start: 'top 75%' } });
      gsap.from('.signup-card', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.signup', start: 'top 70%' } });
    }, ref);
    return () => ctx.revert();
  }, []);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) return;
    setSent(true);
  };
  return (
    <section className="signup" id="signup" ref={ref}>
      <div className="signup-glow" aria-hidden="true" />
      <div className="container signup-grid">
        <div className="signup-copy">
          <span className="eyebrow light">Get started</span>
          <h2>Open your first kiosk <span className="grad">this week.</span></h2>
          <p>Create your merchant account, connect Square, and activate your first device with an Active Code. Our team helps you set up the menu and printers.</p>
          <ul className="signup-points">
            <li>14-day free trial on Smart Saving</li>
            <li>Works with your existing Square account</li>
            <li>iPad &amp; Android tablets supported</li>
          </ul>
        </div>

        <div className="signup-card">
          {!sent ? (
            <form onSubmit={submit} noValidate={false}>
              <h3>Create your account</h3>
              <div className="field-row">
                <label>First name<input name="first" required autoComplete="given-name" /></label>
                <label>Last name<input name="last" required autoComplete="family-name" /></label>
              </div>
              <label>Restaurant name<input name="restaurant" required placeholder="Banh Mi Zon" /></label>
              <label>Work email<input type="email" name="email" required autoComplete="email" placeholder="you@restaurant.com" /></label>
              <div className="field-row">
                <label>Phone<input type="tel" name="phone" autoComplete="tel" placeholder="(555) 010-2026" /></label>
                <label>Locations
                  <select name="locations" defaultValue="1">
                    <option value="1">1</option><option value="2-5">2–5</option><option value="6-20">6–20</option><option value="20+">20+</option>
                  </select>
                </label>
              </div>
              <label>Password<input type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
              <fieldset className="plan-pick">
                <legend>Plan</legend>
                {PLANS.map((p) => (
                  <label key={p.id} className={plan === p.id ? 'on' : ''}>
                    <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} />
                    <span>{p.name}</span><b>${p.price}</b>
                  </label>
                ))}
              </fieldset>
              <label className="check"><input type="checkbox" required /> I agree to the Terms of Service and Privacy Policy</label>
              <button className="btn btn-primary btn-block" type="submit">Create account</button>
              <p className="form-foot">Already have an account? <a href={APP_URL ? `${APP_URL}/auth` : '#'}>Sign in</a></p>
            </form>
          ) : (
            <div className="signup-done">
              <div className="done-check">✓</div>
              <h3>You're almost there!</h3>
              <p>Next step: connect your Square account so we can import your locations and menu.</p>
              <a className="btn btn-primary btn-block" href={APP_URL ? `${APP_URL}/auth` : '#'}>Connect Square →</a>
              <button className="btn-link" onClick={() => setSent(false)}>Back</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

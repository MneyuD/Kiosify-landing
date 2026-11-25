import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import './auth.css';

export type AuthMode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------- countries for the phone field ---------------- */
type Country = { iso: string; name: string; dial: string };
const COUNTRIES: Country[] = [
  { iso: 'VN', name: 'Vietnam', dial: '+84' },
  { iso: 'US', name: 'United States', dial: '+1' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'AU', name: 'Australia', dial: '+61' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso: 'SG', name: 'Singapore', dial: '+65' },
  { iso: 'JP', name: 'Japan', dial: '+81' },
  { iso: 'KR', name: 'South Korea', dial: '+82' },
];

/* small, simplified SVG flags (Windows has no flag emoji) */
const star = (cx: number, cy: number, r: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.4 : r;
    p.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return p.join(' ');
};
const UnionJack = () => (
  <>
    <rect width="30" height="20" fill="#012169" />
    <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth="4" />
    <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M15,0 V20 M0,10 H30" stroke="#fff" strokeWidth="6" />
    <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.4" />
  </>
);
const FLAGS: Record<string, ReactNode> = {
  VN: (
    <>
      <rect width="30" height="20" fill="#da251d" />
      <polygon fill="#ffff00" points={star(15, 10, 6)} />
    </>
  ),
  US: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
      ))}
      <rect width="13" height={(20 / 13) * 7} fill="#3c3b6e" />
    </>
  ),
  CA: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="7.5" height="20" fill="#d52b1e" />
      <rect x="22.5" width="7.5" height="20" fill="#d52b1e" />
      <path fill="#d52b1e" d="M15 4l1.3 2.6 1.6-.6-.6 3.4 2-2.1.4 1.3 1.8-.3-.8 2.3.9.5-3.5 2.6.4 1.3-3.2-.4V17h-.6v-2.4l-3.2.4.4-1.3-3.5-2.6.9-.5-.8-2.3 1.8.3.4-1.3 2 2.1-.6-3.4 1.6.6z" />
    </>
  ),
  GB: <UnionJack />,
  AU: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <g transform="scale(0.5)"><UnionJack /></g>
      <polygon fill="#fff" points={star(7.5, 15, 2.4)} />
      <polygon fill="#fff" points={star(22.5, 16.2, 1.3)} />
      <polygon fill="#fff" points={star(19.5, 8.5, 1.3)} />
      <polygon fill="#fff" points={star(22.5, 4, 1.3)} />
      <polygon fill="#fff" points={star(25.5, 7.7, 1.3)} />
    </>
  ),
  SG: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="10" fill="#ef3340" />
      <circle cx="6.5" cy="5" r="3.4" fill="#fff" />
      <circle cx="7.8" cy="5" r="3.1" fill="#ef3340" />
      {[[11, 2.8], [13, 4.3], [12.2, 6.6], [9.8, 6.6], [9, 4.3]].map(([x, y]) => (
        <polygon key={`${x}`} fill="#fff" points={star(x, y, 0.85)} />
      ))}
    </>
  ),
  JP: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#bc002d" />
    </>
  ),
  KR: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="5" fill="#0047a0" />
      <path d="M10 10a5 5 0 0 1 10 0a2.5 2.5 0 0 1-5 0a2.5 2.5 0 0 0-5 0z" fill="#cd2e3a" />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
        <g key={`${sx}${sy}`} transform={`translate(${15 + sx * 9.5} ${10 + sy * 6}) rotate(${sx * sy * 33.7})`}>
          <rect x="-1.8" y="-1.6" width="3.6" height="0.75" fill="#000" />
          <rect x="-1.8" y="-0.4" width="3.6" height="0.75" fill="#000" />
          <rect x="-1.8" y="0.8" width="3.6" height="0.75" fill="#000" />
        </g>
      ))}
    </>
  ),
};

function Flag({ iso }: { iso: string }) {
  const f = FLAGS[iso];
  if (!f) return <span className="flag flag-iso">{iso}</span>;
  return (
    <svg className="flag" viewBox="0 0 30 20" aria-hidden="true">
      {f}
    </svg>
  );
}

/* ---------------- country code picker (custom dropdown with search) ---------------- */
function CountrySelect({ value, onChange }: { value: Country; onChange: (c: Country) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q) || c.dial.replace('+', '').startsWith(q));
  }, [query]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // keep the highlighted option in view
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const openMenu = () => {
    setQuery('');
    setActive(Math.max(0, COUNTRIES.findIndex((c) => c.iso === value.iso)));
    setOpen(true);
  };
  const pick = (c: Country) => {
    onChange(c);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(list.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (list[active]) pick(list[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={`af-cc ${open ? 'open' : ''}`} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="af-country"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${value.name} ${value.dial}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <Flag iso={value.iso} />
        <b>{value.iso}</b>
        <span className="af-dial">{value.dial}</span>
        <svg className="af-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="af-cc-pop">
          <div className="af-cc-search">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              placeholder="Search country or code"
              aria-label="Search country or code"
              aria-controls="af-cc-list"
              aria-activedescendant={list[active] ? `af-cc-${list[active].iso}` : undefined}
            />
          </div>
          <ul id="af-cc-list" role="listbox" className="af-cc-list" ref={listRef} aria-label="Countries">
            {list.map((c, i) => {
              const selected = c.iso === value.iso;
              return (
                <li
                  key={c.iso}
                  id={`af-cc-${c.iso}`}
                  data-idx={i}
                  role="option"
                  aria-selected={selected}
                  className={`${i === active ? 'active' : ''} ${selected ? 'selected' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                >
                  <Flag iso={c.iso} />
                  <span className="af-cc-name">{c.name}</span>
                  <span className="af-cc-dial">{c.dial}</span>
                  <svg className="af-cc-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </li>
              );
            })}
            {!list.length && <li className="af-cc-empty">No matching country</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- small form building blocks ---------------- */
/**
 * A labelled form field. With `inputId` it renders a <div> + <label htmlFor> instead of
 * wrapping everything in a <label> — needed when the field also contains a button
 * (e.g. the country-code picker), so clicking the label text doesn't open it.
 */
function Field({ label, error, children, hint, inputId }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; inputId?: string }) {
  const body = (
    <>
      {inputId ? <label className="af-label" htmlFor={inputId}>{label}</label> : <span className="af-label">{label}</span>}
      {children}
      {error ? <span className="af-error" role="alert">{error}</span> : hint}
    </>
  );
  const cls = `af-field ${error ? 'has-error' : ''}`;
  return inputId ? <div className={cls}>{body}</div> : <label className={cls}>{body}</label>;
}

function PasswordInput(props: { value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <span className="af-input-wrap">
      <input
        className="af-input"
        type={show ? 'text' : 'password'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        aria-invalid={props.invalid}
      />
      <button type="button" className="af-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {!show && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </span>
  );
}

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}
const STRENGTH = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

/* ---------------- Sign in ---------------- */
function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) err.email = 'Please enter a valid email';
    if (!password) err.password = 'Please enter your password';
    setErrors(err);
    if (Object.keys(err).length) return;
    setState('loading');
    // TODO: connect to the Kiosify auth API (kiot-master /auth). Simulated for the landing page.
    await new Promise((r) => setTimeout(r, 900));
    setState('done');
  };

  if (state === 'done')
    return (
      <Done title="Welcome back!" body="You're signed in. Taking you to your dashboard…" />
    );

  return (
    <form className="af-form" onSubmit={submit} noValidate>
      <header className="af-head">
        <h1>Sign in</h1>
        <p>
          Don’t have an account?{' '}
          <a href="/signup" onClick={(e) => { e.preventDefault(); onSwitch(); }}>Sign up</a>
        </p>
      </header>

      <Field label="Email" error={errors.email}>
        <input
          className="af-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@restaurant.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          autoFocus
        />
      </Field>

      <Field label="Password" error={errors.password}>
        <PasswordInput value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" invalid={!!errors.password} />
      </Field>

      <div className="af-row">
        <label className="af-check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="af-box" aria-hidden="true" />
          Remember me?
        </label>
        <a className="af-forgot" href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password</a>
      </div>

      <button className="af-submit" type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? <span className="af-spinner" /> : 'Sign in'}
      </button>
    </form>
  );
}

/* ---------------- Sign up ---------------- */
function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const [v, setV] = useState({ first: '', last: '', email: '', phone: '', password: '', confirm: '' });
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));
  const pwScore = useMemo(() => strength(v.password), [v.password]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!v.first.trim()) err.first = 'First name is required';
    if (!EMAIL_RE.test(v.email.trim())) err.email = 'Please enter a valid email';
    const digits = v.phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 12) err.phone = 'Please enter a valid phone number';
    if (v.password.length < 8) err.password = 'At least 8 characters';
    if (!v.confirm) err.confirm = 'Please confirm your password';
    else if (v.confirm !== v.password) err.confirm = 'Passwords do not match';
    if (!agree) err.agree = 'Please accept the Terms and Privacy Policy';
    setErrors(err);
    if (Object.keys(err).length) return;
    setState('loading');
    // TODO: connect to the Kiosify sign-up API (kiot-master /auth). Simulated for the landing page.
    await new Promise((r) => setTimeout(r, 1100));
    setState('done');
  };

  if (state === 'done')
    return (
      <Done
        title="Account created!"
        body={`Next, connect your Square account so we can import your locations and menu, ${v.first.trim()}.`}
        cta="Connect Square →"
      />
    );

  return (
    <form className="af-form" onSubmit={submit} noValidate>
      <header className="af-head">
        <h1>Sign Up Now</h1>
      </header>

      <div className="af-grid2">
        <Field label="First name *" error={errors.first}>
          <input className="af-input" value={v.first} onChange={(e) => set('first')(e.target.value)} placeholder="Your first name" autoComplete="given-name" aria-invalid={!!errors.first} autoFocus />
        </Field>
        <Field label="Last name">
          <input className="af-input" value={v.last} onChange={(e) => set('last')(e.target.value)} placeholder="Your last name" autoComplete="family-name" />
        </Field>
      </div>

      <Field label="Email *" error={errors.email}>
        <input className="af-input" type="email" value={v.email} onChange={(e) => set('email')(e.target.value)} placeholder="you@restaurant.com" autoComplete="email" aria-invalid={!!errors.email} />
      </Field>

      <Field label="Phone no. *" error={errors.phone} inputId="af-phone">
        <span className={`af-phone ${errors.phone ? 'invalid' : ''}`}>
          <CountrySelect value={country} onChange={setCountry} />
          <input
            id="af-phone"
            className="af-input af-phone-input"
            type="tel"
            inputMode="tel"
            value={v.phone}
            onChange={(e) => set('phone')(e.target.value.replace(/[^\d\s-]/g, ''))}
            placeholder="Your phone no."
            autoComplete="tel-national"
            aria-invalid={!!errors.phone}
          />
        </span>
      </Field>

      <Field
        label="Password *"
        error={errors.password}
        hint={
          v.password ? (
            <span className="af-strength" data-score={pwScore}>
              <i /><i /><i /><i />
              <em>{STRENGTH[pwScore]}</em>
            </span>
          ) : undefined
        }
      >
        <PasswordInput value={v.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" invalid={!!errors.password} />
      </Field>

      <Field label="Confirm password *" error={errors.confirm}>
        <PasswordInput value={v.confirm} onChange={set('confirm')} placeholder="Repeat your password" autoComplete="new-password" invalid={!!errors.confirm} />
      </Field>

      <label className={`af-check af-agree ${errors.agree ? 'has-error' : ''}`}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span className="af-box" aria-hidden="true" />
        <span>
          By signing up you agree to our <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and{' '}
          <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>
        </span>
      </label>
      {errors.agree && <span className="af-error" role="alert">{errors.agree}</span>}

      <button className="af-submit" type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? <span className="af-spinner" /> : 'Sign up'}
      </button>

      <p className="af-foot">
        Already have an account?{' '}
        <a href="/signin" onClick={(e) => { e.preventDefault(); onSwitch(); }}>Sign in</a>
      </p>
    </form>
  );
}

function Done({ title, body, cta }: { title: string; body: string; cta?: string }) {
  return (
    <div className="af-done">
      <div className="af-done-check">✓</div>
      <h2>{title}</h2>
      <p>{body}</p>
      {cta && <a className="af-submit" href="#connect" onClick={(e) => e.preventDefault()}>{cta}</a>}
      <a className="af-back" href="/">← Back to kiosify.com</a>
    </div>
  );
}

/* ---------------- page ---------------- */
const SIDE: Record<AuthMode, { eyebrow: string; title: ReactNode; body: string }> = {
  signin: {
    eyebrow: 'Welcome back',
    title: <>Your kiosks and kitchen, <span className="grad-dark">all in one place.</span></>,
    body: 'Check today’s orders, revenue and live kitchen status — synced with Square in real time.',
  },
  signup: {
    eyebrow: 'Get started',
    title: <>Open your first kiosk <span className="grad-dark">this week.</span></>,
    body: 'Create your merchant account, connect Square and activate your first device with an Active Code.',
  },
};

export default function AuthPage({ mode: initial }: { mode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initial);
  const cardRef = useRef<HTMLDivElement>(null);

  const go = (m: AuthMode) => {
    setMode(m);
    history.pushState(null, '', m === 'signin' ? '/signin' : '/signup');
  };

  useEffect(() => {
    document.title = mode === 'signin' ? 'Sign in — Kiosify' : 'Sign up — Kiosify';
    const onPop = () => setMode(location.pathname.startsWith('/signup') ? 'signup' : 'signin');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [mode]);

  const side = SIDE[mode];

  return (
    <div className="auth">
      {/* colour washes drifting in the top-left and bottom-right corners */}
      <div className="auth-wash wash-tl" aria-hidden="true"><i /><i /></div>
      <div className="auth-wash wash-br" aria-hidden="true"><i /><i /></div>

      <a href="/" className="auth-logo" aria-label="Kiosify home">
        <img src="/images/kiosify-logo.png" alt="Kiosify" />
      </a>

      <div className="auth-grid">
        <aside className="auth-side" key={`side-${mode}`}>
          <span className="eyebrow">{side.eyebrow}</span>
          <h2>{side.title}</h2>
          <p>{side.body}</p>
        </aside>

        <div className="auth-card" ref={cardRef}>
          <div className="auth-body" key={mode}>
            {mode === 'signin' ? <SignInForm onSwitch={() => go('signup')} /> : <SignUpForm onSwitch={() => go('signin')} />}
          </div>
        </div>
      </div>

      <nav className="auth-legal" aria-label="Policies">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/sms">SMS Program</a>
      </nav>
    </div>
  );
}

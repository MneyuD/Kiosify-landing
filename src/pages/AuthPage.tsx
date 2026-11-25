import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
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

function Flag({ iso }: { iso: string }) {
  if (iso === 'VN')
    return (
      <svg className="flag" viewBox="0 0 30 20" aria-hidden="true">
        <rect width="30" height="20" fill="#da251d" />
        <path fill="#ffff00" d="M15 4.2l1.36 4.2h4.41l-3.57 2.6 1.36 4.2L15 12.6l-3.57 2.6 1.37-4.2-3.57-2.6h4.41z" />
      </svg>
    );
  if (iso === 'US')
    return (
      <svg className="flag" viewBox="0 0 30 20" aria-hidden="true">
        <rect width="30" height="20" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((i) => (
          <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
        ))}
        <rect width="13" height={(20 / 13) * 7} fill="#3c3b6e" />
      </svg>
    );
  return <span className="flag flag-iso">{iso}</span>;
}

/* ---------------- small form building blocks ---------------- */
function Field({ label, error, children, hint }: { label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className={`af-field ${error ? 'has-error' : ''}`}>
      <span className="af-label">{label}</span>
      {children}
      {error ? <span className="af-error" role="alert">{error}</span> : hint}
    </label>
  );
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

      <Field label="Phone no. *" error={errors.phone}>
        <span className={`af-phone ${errors.phone ? 'invalid' : ''}`}>
          <span className="af-country">
            <Flag iso={country.iso} />
            <b>{country.iso}</b>
            <span className="af-dial">{country.dial}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            <select
              aria-label="Country code"
              value={country.iso}
              onChange={(e) => setCountry(COUNTRIES.find((c) => c.iso === e.target.value) ?? COUNTRIES[0])}
            >
              {COUNTRIES.map((c) => (
                <option key={c.iso} value={c.iso}>{`${c.name} (${c.dial})`}</option>
              ))}
            </select>
          </span>
          <input
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

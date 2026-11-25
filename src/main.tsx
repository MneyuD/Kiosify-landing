import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PolicyPage } from './components/kiosify-footer';
import './styles.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);

const POLICY_PATHS = { '/privacy': 'privacy', '/terms': 'terms', '/sms': 'sms' } as const;
const policy = POLICY_PATHS[location.pathname.replace(/\/$/, '') as keyof typeof POLICY_PATHS];
if (policy) document.body.classList.add('is-policy');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {policy ? <PolicyPage kind={policy} /> : <App />}
  </StrictMode>,
);

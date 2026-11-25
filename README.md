# Kiosify Landing Page

Animated landing page for Kiosify — self-order kiosk + kitchen display (KDS) on Square POS.

**Stack:** Vite · React 18 · TypeScript · Three.js (WebGL scene) · GSAP ScrollTrigger · Lenis (smooth scroll)

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # preview the production build
```

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. On vercel.com → **Add New Project** → import the repo. Vercel detects Vite automatically
   (build `npm run build`, output `dist`) — `vercel.json` already sets this.
3. Optional env var: `VITE_APP_URL` = URL of the admin app (e.g. `https://app.kiosify.com`).
   "Sign in" and "Connect Square" link to `${VITE_APP_URL}/auth`.

Or from the CLI: `npx vercel` (preview) / `npx vercel --prod`.

## Page structure

| Section | File | What happens |
|---|---|---|
| Hero → order journey | `src/components/JourneySection.tsx`, `src/three/Journey.ts` | The Kiosify logo is rebuilt from ~10k particles (reacts to the mouse). Scrolling dissolves it and the camera rides a glowing rail past 6 zones: Square Stand → ordering → payment → KDS → cooking → handoff. A glowing order token (#9684) travels ahead and changes form at each zone; pulses fly from it to a "Square POS" hub on the horizon to show the sync. Zone colours tint the floor, rail and fog. |
| Zones | `src/three/zones.ts` | Each zone is a small 3D scene built from primitives + canvas textures, with its own scroll-driven animation (`update(lp, t)`). |
| Canvas art | `src/three/cards.ts`, `src/three/art.ts` | Kiosk UI, payment, ticket, cooking, ready sign, stand screen, token forms. Edit text/prices here. |
| Admin dashboard mockup | `src/components/Dashboard.tsx`, `charts.tsx` | Browser-frame mockup with 6 auto-rotating tabs (Overview, Revenue, Dishes, Customers, Orders, Kitchen) filled with sample data; charts have hover tooltips. Sample data is at the top of `charts.tsx`. |
| Setup flow, pricing, sign-up, footer | `src/components/Sections.tsx` | Merchant → Location → Active Code → Device, with a typing code animation; 3 plans; sign-up form (client-side only — wire `submit` to your API). |

## Notes

- The sign-up form doesn't send data anywhere yet: `Signup.submit` only shows the "Connect Square" step.
- If WebGL is unavailable, a static logo is shown instead.
- `prefers-reduced-motion` turns off smooth scrolling and CSS animations.

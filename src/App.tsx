import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import JourneySection from './components/JourneySection';
import Dashboard from './components/Dashboard';
import SilkRibbon from './components/SilkRibbon';
import { HowItWorks, Marquee, Nav, Pricing, Signup, type PlanId } from './components/Sections';
import { KiosifyFooter } from './components/kiosify-footer';

gsap.registerPlugin(ScrollTrigger);

/** The "Get started — Open your first kiosk this week." sign-up section is temporarily hidden. Set to true to bring it back. */
const SHOW_SIGNUP = false;

export default function App() {
  const [plan, setPlan] = useState<PlanId>('basic');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -20 } });
    lenis.on('scroll', ScrollTrigger.update);
    if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis;
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return (
    <div id="top">
      <SilkRibbon startAfterId="journey" />
      <Nav />
      <main>
        <JourneySection />
        <Marquee />
        <Dashboard />
        <HowItWorks />
        {/* While sign-up is hidden, "#signup" links (Get started, Start free trial…) land on pricing */}
        {!SHOW_SIGNUP && <div id="signup" aria-hidden="true" />}
        <Pricing onPick={setPlan} />
        {SHOW_SIGNUP && <Signup plan={plan} setPlan={setPlan} />}
      </main>
      <KiosifyFooter />
    </div>
  );
}

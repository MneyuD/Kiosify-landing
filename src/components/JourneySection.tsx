import { useEffect, useRef, useState } from 'react';
import { Journey } from '../three/Journey';

const STAGES = [
  { tag: 'Square Stand', title: 'It starts at your Square Stand', body: 'An iPad on a Square Stand becomes a self-order kiosk. Your Square menu, photos and prices load automatically.' },
  { tag: 'Ordering', title: 'Guests build their own order', body: 'Tap, customize, add notes like "more spicy", choose for here or to go. 6 languages, no line, no mistakes.' },
  { tag: 'Payment', title: 'Tap to pay, processed by Square', body: 'Card, phone or watch on the Square reader. Approved in seconds and synced to Square instantly.' },
  { tag: 'Kitchen display', title: 'The ticket lands on the KDS', body: 'The order is routed to the right station the moment it is paid, on screen and on the Star printer.' },
  { tag: 'Cooking', title: 'Cooks work every item live', body: 'Item-level checkoffs, highlighted notes and timers keep the line moving. Late orders are flagged automatically.' },
  { tag: 'Handoff', title: 'Ready. Bagged. Handed over.', body: 'The guest hears their number and grabs the bag. Every step is already in Square and on your dashboard.' },
];

export default function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(-1);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const sticky = stickyRef.current!;
    const section = sectionRef.current!;
    let journey: Journey;
    try {
      journey = new Journey(canvas, {
        onStage: setStage,
        onFrame: ({ p, dissolve, exit }) => {
          sticky.style.setProperty('--p', p.toFixed(4));
          sticky.style.setProperty('--dissolve', dissolve.toFixed(4));
          sticky.style.setProperty('--exit', exit.toFixed(4));
          sticky.classList.toggle('past-hero', dissolve > 0.3);
        },
      });
    } catch {
      setWebgl(false);
      return;
    }

    const onScroll = () => {
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      journey.setProgress(total > 0 ? -r.top / total : 0);
    };
    const onMove = (e: PointerEvent) => {
      journey.setMouse((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    const onLeave = () => journey.clearMouse();
    const onResize = () => {
      journey.resize();
      onScroll();
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? journey.start() : journey.stop()), { rootMargin: '100px' });
    io.observe(section);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    onScroll();
    journey.start();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      journey.dispose();
    };
  }, []);

  return (
    <section ref={sectionRef} className="journey" id="journey" aria-label="How an order flows through Kiosify">
      <div ref={stickyRef} className="journey-sticky">
        <canvas ref={canvasRef} className="journey-canvas" aria-hidden="true" />
        {!webgl && <div className="journey-fallback"><img src="/images/kiosify-logo.png" alt="Kiosify" /></div>}

        <div className="hero-overlay">
          <p className="hero-eyebrow">Self-order kiosk · Kitchen display · Square POS</p>
          <h1 className="hero-title">
            Orders that flow <span className="grad">from kiosk to kitchen.</span>
          </h1>
          <div className="hero-cta">
            <a className="btn btn-primary" href="/signup">Start free trial</a>
            <a className="btn btn-ghost" href="#dashboard">See the dashboard</a>
          </div>
        </div>

        <div className="scroll-hint" aria-hidden="true">
          <span>Scroll to dive in</span>
          <i />
        </div>

        <div className="stage-captions" aria-live="polite">
          {STAGES.map((s, i) => (
            <article key={s.tag} className={`stage-caption ${i === stage ? 'is-active' : ''} ${i % 2 ? 'right' : 'left'}`}>
              <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="stage-tag">{s.tag}</span>
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </article>
          ))}
        </div>

        <ol className="stage-rail" aria-hidden="true">
          {STAGES.map((s, i) => (
            <li key={s.tag} className={i === stage ? 'is-active' : i < stage ? 'is-done' : ''}>
              <span>{s.tag}</span>
            </li>
          ))}
        </ol>

        <div className="journey-exit" />
      </div>
    </section>
  );
}

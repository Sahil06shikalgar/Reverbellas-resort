import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Loader({ onComplete }) {
  const rootRef = useRef(null);
  const lineRef = useRef(null);
  const wordRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          if (onComplete) onComplete();
        },
      });

      if (prefersReduced) {
        tl.to(rootRef.current, { autoAlpha: 0, duration: 0.3 });
        return;
      }

      tl.from(wordRef.current, { autoAlpha: 0, y: 16, duration: 0.8 })
        .to(lineRef.current, { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, '-=0.3')
        .to(wordRef.current, { autoAlpha: 0, y: -12, duration: 0.5 }, '+=0.15')
        .to(rootRef.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.1');
    }, rootRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div className="loader" ref={rootRef} aria-hidden="true">
      <div className="loader-inner">
        <span className="loader-word" ref={wordRef}>RIVERBELLS</span>
        <div className="loader-track">
          <div className="loader-line" ref={lineRef} />
        </div>
      </div>
    </div>
  );
}

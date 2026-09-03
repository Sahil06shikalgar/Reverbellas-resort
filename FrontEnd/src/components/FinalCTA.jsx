import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { images } from '../data/media';

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTA() {
  const rootRef = useRef(null);
  const imgRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;
      gsap.to(imgRef.current, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="final-cta" ref={rootRef}>
      <div className="final-cta-media" ref={imgRef}>
        <img src={images.WA0004} alt="Lakeside sunset at Riverbells Resort" className="final-cta-image" loading="lazy" decoding="async" style={{ objectPosition: 'center 45%' }} />
      </div>
      <div className="final-cta-scrim" />
      <div className="container final-cta-content">
        <h2>
          Ready to Escape
          <br />
          the Ordinary?
        </h2>
        <p>Make your next getaway one to remember at Riverbells Resort.</p>
        <div className="final-cta-actions">
          <button className="btn btn-light" onClick={() => navigate('/book-stay')}>
            Book Your Stay
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </button>
          <a href="tel:+917499788935" className="btn btn-outline final-cta-outline">
            Call +91 74997 88935
          </a>
        </div>
      </div>
    </section>
  );
}

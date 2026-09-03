import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import packages from '../data/packages';

gsap.registerPlugin(ScrollTrigger);

export default function Packages() {
  const rootRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;
      gsap.fromTo(
        '.package-panel',
        { autoAlpha: 0, y: 35 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: rootRef.current, start: 'top 82%' },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const scrollToBooking = (e) => {
    e.preventDefault();
    navigate('/book-stay');
  };

  return (
    <section className="packages" id="packages" ref={rootRef}>
      <div className="packages-track">
        {packages.map((pkg) => (
          <article className="package-panel" key={pkg.id}>
            <div className="package-image">
              <img src={pkg.image} alt={pkg.title} loading="lazy" decoding="async" style={{ objectPosition: pkg.objectPosition }} />
            </div>
            <div className="package-info">
              <div className="package-head-row">
                <h3>{pkg.title}</h3>
                <span className="package-index">{pkg.index}</span>
              </div>
              <p className="package-subtitle">{pkg.subtitle}</p>

              <div className="package-pricing">
                {pkg.pricing.map((p) => (
                  <div className="package-price-row" key={p.label}>
                    <span className="package-price-label">{p.label}</span>
                    <span className="package-price-right">
                      <strong className="package-price-value">{p.value}</strong>
                      <em className="package-price-unit">{p.unit}</em>
                    </span>
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn-outline package-cta" onClick={scrollToBooking}>
                {pkg.cta}
                <span className="btn-arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { images } from '../data/media';
import comfortImage from '../assets/media/eb02be5e-7e8e-4725-97e3-01adfd583a13.png';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    id: 'comfort',
    num: '01',
    title: 'Comfort',
    desc: 'Spacious and thoughtfully designed interiors for a comfortable and relaxing stay.',
    image: comfortImage,
    alt: 'Comfortable resort room interior at Riverbells Resort',
  },
  {
    id: 'ac',
    num: '02',
    title: 'Air Condition',
    desc: 'Fully air-conditioned accommodation designed to keep guests comfortable throughout their stay.',
    image: images.WA0020,
    alt: 'Air-conditioned accommodation interior at Riverbells Resort',
  },
];

export default function Stay() {
  const rootRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      gsap.utils.toArray('.stay-feature-image').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            duration: 1.1,
            ease: 'power4.inOut',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          }
        );
      });

      gsap.utils.toArray('.stay-feature').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.15,
            scrollTrigger: { trigger: el, start: 'top 85%' },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section stay" id="stay" ref={rootRef}>      <div className="container">
        <div className="stay-head">
          <span className="eyebrow">Stay</span>
          <h2 className="stay-heading">
            <span className="reveal-line"><span>Comfort</span></span>
            <span className="reveal-line"><span>in Nature</span></span>
          </h2>
          <p className="stay-intro">
            Comfortable tent accommodation designed for a peaceful stay surrounded by nature.
          </p>
        </div>

        <div className="stay-features-grid">
          {FEATURES.map((feature) => (
            <div className="stay-feature" key={feature.id}>
              <div className="stay-feature-image">
                <img src={feature.image} alt={feature.alt} loading="lazy" decoding="async" />
              </div>
              <span className="feature-number">{feature.num}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="stay-cta">
          <button className="btn btn-fill" onClick={() => navigate('/book-stay')}>
            Book Your Stay
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}

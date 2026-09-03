import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import galleryItems, { galleryFilters } from '../data/gallery';
import Lightbox from './Lightbox';

gsap.registerPlugin(ScrollTrigger);

export default function Gallery() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const items = filter === 'ALL' ? galleryItems : galleryItems.filter((g) => g.tag === filter);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const ctx = gsap.context(() => {
      const reveal = (y) =>
        gsap.fromTo(
          '.gallery-item',
          { opacity: 0, y, scale: 0.99 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', () => reveal(24));
      mm.add('(max-width: 900px)', () => reveal(16));
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const firstFilter = useRef(true);
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gallery-item',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
      );
    }, rootRef);
    return () => ctx.revert();
  }, [filter]);

  return (
    <section className="section gallery" id="gallery" ref={rootRef}>
      <div className="container section-head gallery-head">
        <span className="eyebrow">Gallery</span>
        <h2>Moments at<br />Riverbells</h2>
      </div>

      <div className="container gallery-filters" role="tablist" aria-label="Gallery filters">
        {galleryFilters.map((f) => (
          <button
            key={f}
            className={`gallery-filter ${filter === f ? 'is-active' : ''}`}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="gallery-grid container">
        {items.map((img) => (
          <button
            key={img.id}
            className={`gallery-item gallery-${img.size}`}
            onClick={() => setActive(galleryItems.findIndex((g) => g.id === img.id))}
            aria-label={`Open image: ${img.label}`}
          >
            <img src={img.src} alt={img.label} loading="lazy" decoding="async" style={{ objectPosition: img.objectPosition }} />
          </button>
        ))}
      </div>

      <Lightbox
        items={galleryItems}
        index={active}
        onClose={() => setActive(null)}
        onNavigate={setActive}
      />
    </section>
  );
}

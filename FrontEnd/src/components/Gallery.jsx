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
    const ctx = gsap.context(() => {
      if (prefersReduced) return;
      gsap.fromTo(
        '.gallery-item',
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 80%' },
        }
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

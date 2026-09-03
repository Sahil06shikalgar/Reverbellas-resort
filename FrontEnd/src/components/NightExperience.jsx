import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { images } from '../data/media';

gsap.registerPlugin(ScrollTrigger);

const NIGHT = [
  { id: 'n1', src: images.WA0008, label: 'Night by the Pool', objectPosition: 'center 50%', cls: 'night-featured' },
  { id: 'n2', src: images.WA0006, label: 'Garden Lights', objectPosition: 'center 40%', cls: 'night-tall' },
  { id: 'n3', src: images.WA0009, label: 'Evening Walk', objectPosition: 'center 40%', cls: 'night-portrait' },
  { id: 'n4', src: images.WA0007, label: 'Pool at Dusk', objectPosition: 'center 50%', cls: 'night-wide' },
  { id: 'n5', src: images.WA0011, label: 'Bonfire Glow', objectPosition: 'center 40%', cls: 'night-portrait' },
  { id: 'n6', src: images.WA0017, label: 'Evening Gatherings', objectPosition: 'center 50%', cls: 'night-wide' },
  { id: 'n7', src: images.WA0019, label: 'Quiet Evening', objectPosition: 'center 45%', cls: 'night-wide' },
];

export default function NightExperience() {
  const rootRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      gsap.utils.toArray('.night-media').forEach((media) => {
        const img = media.querySelector('img');
        gsap.fromTo(
          img,
          { scale: 1.12 },
          {
            scale: 1,
            duration: 1.3,
            ease: 'power2.out',
            scrollTrigger: { trigger: media, start: 'top 85%' },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="night" id="night-experience" ref={rootRef}>
      <div className="container night-head">
        <span className="eyebrow">Night</span>
        <h2 className="night-heading">
          <span className="reveal-line"><span>After</span></span>
          <span className="reveal-line"><span>Sunset</span></span>
        </h2>
        <p className="night-intro">
          As daylight fades, Riverbells takes on a quieter mood — garden lights, open skies and
          peaceful evenings by the water.
        </p>
      </div>

      <div className="container night-layout">
        {NIGHT.map((n) => (
          <figure className={`night-media ${n.cls}`} key={n.id}>
            <img src={n.src} alt={n.label} loading="lazy" decoding="async" style={{ objectPosition: n.objectPosition }} />
            <span className="night-cap">{n.label}</span>
          </figure>
        ))}
      </div>
    </section>
  );
}

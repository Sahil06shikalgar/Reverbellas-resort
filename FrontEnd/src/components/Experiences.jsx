import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { amenities } from '../data/amenities';
import swimImage from '../assets/media/IMG-20260828-WA0005.jpg';

gsap.registerPlugin(ScrollTrigger);

const AMENITIES = ['Swimming Pool', 'Green Lawns', 'Bonfire', 'Cricket', 'Badminton', 'Music System', 'Karaoke Music'];

export default function Experiences() {
  const rootRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      gsap.utils.toArray('.experience-row').forEach((row) => {
        if (row.classList.contains('experience-row--swim')) return;
        gsap.fromTo(
          row,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 85%' },
          }
        );
      });

      gsap.fromTo(
        '.experience-row--swim .experience-image',
        { autoAlpha: 0, y: 50, scale: 1.04 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.experience-row--swim', start: 'top 80%' },
        }
      );

      gsap.fromTo(
        '.experience-row--swim .experience-text',
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.experience-row--swim', start: 'top 80%' },
        }
      );

      gsap.fromTo(
        '.amenity-row',
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.06,
          scrollTrigger: { trigger: '.experience-amenities', start: 'top 88%' },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const playRow = amenities[1];

  return (
    <section className="section experiences" id="experiences" ref={rootRef}>
      <div className="container section-head">
        <span className="eyebrow">Experiences</span>
        <h2>
          <span className="exp-heading-desktop">Everything You Need<br />to Unwind</span>
          <span className="exp-heading-mobile" aria-hidden="true">Everything You<br />Need to Unwind</span>
        </h2>
        <div className="experience-amenities" aria-label="Resort amenities">
          {AMENITIES.map((a, i) => (
            <div className="amenity-row" key={a}>
              <span className="amenity-number">{String(i + 1).padStart(2, '0')}</span>
              <span className="amenity-name">{a}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="experiences-list container">
        <div className="experience-row experience-row--swim">
          <div className="experience-image">
            <img src={swimImage} alt="Swimming pool experience at Riverbells Resort" loading="lazy" decoding="async" style={{ objectPosition: 'center 50%' }} />
          </div>
          <div className="experience-text">
            <span className="experience-number">01</span>
            <h3>Swim</h3>
            <p>Take a refreshing break by the pool.</p>
          </div>
        </div>

        <div className="experience-row">
          <div className="experience-image">
            <img src={playRow.image} alt="Time outdoors, cricket and badminton on the lawns" loading="lazy" decoding="async" style={{ objectPosition: playRow.objectPosition }} />
          </div>
          <div className="experience-text">
            <span className="experience-number">02</span>
            <h3>Play</h3>
            <p>Cricket, badminton and time outdoors.</p>
          </div>
        </div>

        <div className="experience-row">
          <div className="experience-image">
            <img src={amenities[2].image} alt="Enjoying an evening together on the lawns" loading="lazy" decoding="async" style={{ objectPosition: amenities[2].objectPosition }} />
          </div>
          <div className="experience-text">
            <span className="experience-number">03</span>
            <h3>Gather</h3>
            <p>Enjoy evenings together.</p>
          </div>
        </div>

        <div className="experience-row">
          <div className="experience-image">
            <img src={amenities[3].image} alt="Music and karaoke with your group" loading="lazy" decoding="async" style={{ objectPosition: amenities[3].objectPosition }} />
          </div>
          <div className="experience-text">
            <span className="experience-number">04</span>
            <h3>Celebrate</h3>
            <p>Music and karaoke with your group.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

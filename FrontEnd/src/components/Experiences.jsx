import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { amenities } from '../data/amenities';
import { images } from '../data/media';
import swimImage from '../assets/media/IMG-20260828-WA0005.jpg';
import playImage from '../assets/media/4686c0b060c3a3f60095bcbe7fbe5aa7.jpg';
import celebrateImage from '../assets/media/zMWWoOhN6T4YoC6TUKz2kAUwf_ANrwlcbUaPvokykrW2KB1XS2pNosVAEaVpRMtoh-iV852pr4T9ujQUYRS6p2fP_J-JMSVIQTNn3NyhM7ATk8RWcTFeDOLKaaq7tiJR8OAZHRBLocaqB7zsmAwqfB5Ero3lHenIfZk1P1ecg.jfif';

gsap.registerPlugin(ScrollTrigger);

const AMENITIES = [
  { number: '01', title: 'Swimming Pool', image: images.WA0007 },
  { number: '02', title: 'Green Lawns', image: images.WA0005 },
  { number: '03', title: 'Bonfire', image: images.WA0011 },
  { number: '04', title: 'Cricket', image: playImage },
  { number: '05', title: 'Badminton', image: playImage },
  { number: '06', title: 'Music System', image: images.WA0017 },
  { number: '07', title: 'Karaoke Music', image: celebrateImage },
];

export default function Experiences() {
  const rootRef = useRef(null);
  const previewRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activate = (i) => {
    if (i === activeIndex) return;
    const frame = previewRef.current;
    if (!frame) {
      setActiveIndex(i);
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setActiveIndex(i);
      return;
    }
    gsap.killTweensOf(frame);
    gsap.to(frame, {
      opacity: 0,
      duration: 0.15,
      ease: 'power2.out',
      onComplete: () => {
        setActiveIndex(i);
        gsap.fromTo(frame, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      },
    });
  };

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
        <div className="amenities-media">
          <div className="experience-amenities" role="tablist" aria-label="Resort amenities">
            {AMENITIES.map((a, i) => (
              <div
                key={a.title}
                role="tab"
                tabIndex={0}
                aria-selected={i === activeIndex}
                className={`amenity-row ${i === activeIndex ? 'amenity-row--active' : ''}`}
                onMouseEnter={() => activate(i)}
                onFocus={() => activate(i)}
                onClick={() => activate(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate(i);
                  }
                }}
              >
                <span className="amenity-number">{a.number}</span>
                <span className="amenity-name">{a.title}</span>
              </div>
            ))}
          </div>

          <div className="amenities-preview">
            <div className="amenities-preview-frame" ref={previewRef}>
              <img
                className="amenities-preview-image"
                src={AMENITIES[activeIndex].image}
                alt={AMENITIES[activeIndex].title}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="amenities-preview-caption">
              <span className="amenities-preview-number">{AMENITIES[activeIndex].number}</span>
              <span>{AMENITIES[activeIndex].title}</span>
            </p>
          </div>
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

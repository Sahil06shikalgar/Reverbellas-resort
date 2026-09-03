import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { images } from '../data/media';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const rootRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      gsap.fromTo(
        imageRef.current,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.3,
          ease: 'power4.inOut',
          scrollTrigger: { trigger: imageRef.current, start: 'top 80%' },
        }
      );

      gsap.fromTo(
        imageRef.current.querySelector('img'),
        { scale: 1.15 },
        {
          scale: 1,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: imageRef.current, start: 'top 80%' },
        }
      );

      // parallax on portrait image
      gsap.to(imageRef.current.querySelector('img'), {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: imageRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.fromTo(
        '.about-body',
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          scrollTrigger: { trigger: '.about-body', start: 'top 88%' },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section about" id="about" ref={rootRef}>
      <div className="container about-grid">
        <div className="about-media">
          <div className="about-image-main" ref={imageRef}>
            <img src={images.WA0002} alt="Tent accommodation surrounded by greenery at Riverbells Resort" loading="lazy" decoding="async" style={{ objectPosition: 'center 40%' }} />
          </div>
        </div>

        <div className="about-content">
          <span className="eyebrow">About Riverbells</span>
          <h2 className="about-heading">
            <span className="reveal-line"><span>A Stay Closer</span></span>
            <span className="reveal-line"><span>to Nature</span></span>
          </h2>
          <p className="about-body">
            Riverbells Resort is a peaceful countryside escape in Shahapur, Maharashtra. Surrounded
            by water, greenery and open skies, it offers a relaxed setting for families, couples and
            groups to reconnect, unwind and enjoy time away from the city.
          </p>
        </div>
      </div>
    </section>
  );
}

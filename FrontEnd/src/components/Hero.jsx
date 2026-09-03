import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { images, videos } from '../data/media';
import BookingBar from './BookingBar';

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ ready, onSearch }) {
  const rootRef = useRef(null);
  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const subRef = useRef(null);
  const scrollRef = useRef(null);
  const played = useRef(false);

  useEffect(() => {
    if (!ready || played.current) return;
    played.current = true;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (prefersReduced) {
        gsap.set(
          [mediaRef.current, line1Ref.current, line2Ref.current, subRef.current, scrollRef.current],
          { clearProps: 'all' }
        );
        return;
      }

      tl.fromTo(mediaRef.current, { scale: 1.08 }, { scale: 1, duration: 1.8, ease: 'power2.out' })
        .fromTo(
          [line1Ref.current, line2Ref.current],
          { yPercent: 110 },
          { yPercent: 0, duration: 1.1, stagger: 0.12 },
          0.35
        )
        .fromTo(subRef.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, '-=0.5')
        .fromTo(scrollRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.2');

      gsap.to(mediaRef.current, {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to('.hero-content', {
        y: -60,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom 30%',
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section className="hero" id="home" ref={rootRef}>
      <div className="hero-media" ref={mediaRef}>
        <video
          ref={videoRef}
          className="hero-video"
          src={videos.hero}
          poster={images.WA0004}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      </div>
      <div className="hero-content">
        <h1 className="hero-heading">
          <span className="reveal-line"><span ref={line1Ref}>Escape to</span></span>
          <span className="reveal-line"><span ref={line2Ref}>Riverbells</span></span>
        </h1>

        <p className="hero-sub" ref={subRef}>
          A peaceful lakeside retreat where open skies, nature and simple moments come together.
        </p>
      </div>

      <div className="hero-scroll" ref={scrollRef} aria-hidden="true">
        <div className="hero-scroll-mouse">
          <span className="hero-scroll-dot" />
        </div>
        <span className="hero-scroll-label">Scroll</span>
      </div>

      <BookingBar onSearch={onSearch} />
    </section>
  );
}

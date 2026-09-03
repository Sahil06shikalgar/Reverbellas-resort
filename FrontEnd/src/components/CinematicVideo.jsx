import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { videos } from '../data/media';

gsap.registerPlugin(ScrollTrigger);

export default function CinematicVideo() {
  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [inView, setInView] = useState(false);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      { isDesktop: '(min-width: 768px)', isReduced: '(prefers-reduced-motion: reduce)' },
      (context) => {
        const { isDesktop, isReduced } = context.conditions;
        if (!isDesktop || isReduced) return;

        gsap.to(frameRef.current, {
          width: '100vw',
          borderRadius: '0px',
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: '+=100%',
            scrub: true,
            pin: true,
          },
        });

        gsap.to(overlayRef.current, {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: '+=45%',
            scrub: true,
          },
        });
      }
    );

    return () => mm.revert();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      v.pause();
    }
  }, [inView]);

  return (
    <section className="cinematic" ref={rootRef}>
      <div className="cinematic-frame" ref={frameRef}>
        <video
          ref={videoRef}
          className="cinematic-video"
          src={videos.cinematic}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div className="cinematic-overlay" ref={overlayRef}>
          <h2>
            Where the Day
            <br />
            Slows Down.
          </h2>
          <p>Evenings by the water at Riverbells.</p>
        </div>
      </div>
    </section>
  );
}

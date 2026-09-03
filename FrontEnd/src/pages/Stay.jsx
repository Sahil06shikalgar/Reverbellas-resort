import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import NightExperience from '../components/NightExperience';
import Gallery from '../components/Gallery';
import BookingForm from '../components/BookingForm';
import Footer from '../components/Footer';
import { images } from '../data/media';
import { getLenis } from '../hooks/useLenis';

const NAV_OFFSET = 90;

export default function StayPage() {
  const location = useLocation();
  const heroRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;
      gsap.fromTo(
        '.stay-hero-heading > span',
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 0.1 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace('#', '');
    let cancelled = false;
    let timer;

    const scroll = () => {
      if (cancelled) return;
      const target = document.querySelector(`#${id}`);
      if (!target) return;
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.3 });
      } else {
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET,
          behavior: 'smooth',
        });
      }
    };

    const onLoad = () => {
      if (cancelled) return;
      timer = setTimeout(scroll, 60);
    };

    // First attempt after the initial paint…
    requestAnimationFrame(() => {
      requestAnimationFrame(scroll);
    });

    // …then re-scroll once the layout is fully settled (images above the
    // target often load after the first frames and shift its position).
    if (document.readyState === 'complete') {
      timer = setTimeout(scroll, 400);
    } else {
      window.addEventListener('load', onLoad);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('load', onLoad);
    };
  }, [location.hash]);

  return (
    <>
      <Navbar />
      <section className="section stay-hero" id="stay-hero" ref={heroRef}>
        <div className="stay-hero-media">
          <img src={images.WA0004} alt="Lakeside sunset at Riverbells Resort" />
        </div>
        <div className="stay-hero-scrim" />
        <div className="container stay-hero-content">
          <span className="eyebrow">Stay at Riverbells</span>
          <h1 className="stay-hero-heading">
            <span>Accommodation</span>
          </h1>
          <p>Tented comfort, modern amenities and a peaceful lakeside setting.</p>
        </div>
      </section>
      <Gallery />
      <NightExperience />
      <BookingForm />
      <Footer />
    </>
  );
}

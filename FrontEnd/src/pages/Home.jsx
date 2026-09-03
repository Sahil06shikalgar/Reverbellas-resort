import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AvailabilitySearch from '../components/AvailabilitySearch';
import About from '../components/About';
import Stay from '../components/Stay';
import CinematicVideo from '../components/CinematicVideo';
import Packages from '../components/Packages';
import Experiences from '../components/Experiences';
import Dining from '../components/Dining';
import StayInfo from '../components/StayInfo';
import Location from '../components/Location';
import GuestStories from '../components/GuestStories';
import BookingForm from '../components/BookingForm';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import { getLenis } from '../hooks/useLenis';

const NAV_OFFSET = 80;

export default function Home({ ready }) {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    let cancelled = false;

    const scroll = () => {
      if (cancelled) return;
      const target = document.getElementById(id);
      if (!target) return;
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.3 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(scroll));
    return () => {
      cancelled = true;
    };
  }, [location.hash]);

  return (
    <>
      <Navbar />
      <AvailabilitySearch ready={ready} />
      <About />
      <Stay />
      <CinematicVideo />
      <Packages />
      <Experiences />
      <Dining />
      <StayInfo />
      <Location />
      <GuestStories />
      <BookingForm />
      <FinalCTA />
      <Footer />
    </>
  );
}

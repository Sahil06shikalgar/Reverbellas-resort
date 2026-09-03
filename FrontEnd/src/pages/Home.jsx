import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
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

export default function Home({ ready }) {
  return (
    <>
      <Navbar />
      <Hero ready={ready} />
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

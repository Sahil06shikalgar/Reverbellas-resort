import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { getLenis } from '../hooks/useLenis';
import logo from '../assets/media/ab835e75f4b44727ad01d4481498b496.png';

const NAV_OFFSET = 90;

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Gallery', to: '/stay#gallery' },
  { label: 'Contact', to: '#booking-form' },
];

function scrollToEl(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.3 });
  } else {
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET, behavior: 'smooth' });
  }
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const linksRef = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const lenis = getLenis();
    if (lenis) {
      if (menuOpen) lenis.stop();
      else lenis.start();
    }
    if (menuOpen) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          menuRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }
        );
        gsap.fromTo(
          linksRef.current,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out', delay: 0.15 }
        );
      });
      return () => ctx.revert();
    }
  }, [menuOpen]);

  const handleNav = (e, link) => {
    e.preventDefault();
    setMenuOpen(false);

    if (link.to.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate(`/${link.to}`);
      } else {
        scrollToEl(link.to);
      }
      return;
    }

    const [path, hash] = link.to.split('#');

    if (location.pathname === path) {
      if (hash) {
        scrollToEl(`#${hash}`);
      } else {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 1.3 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    navigate(link.to);
  };

  return (
    <header className={`navbar ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-inner">
        <a href="/" className="navbar-logo" onClick={(e) => handleNav(e, { to: '/' })}>
          <img src={logo} alt="Riverbells Resort" className="navbar-logo-img" />
          <span className="brand-text">
            <span className="brand-name">Riverbells Resort</span>
            <span className="brand-location">SHAHAPUR, MAHARASHTRA</span>
          </span>
        </a>

        <nav className="navbar-links" aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.label} href={link.to} onClick={(e) => handleNav(e, link)}>
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="/book-stay"
          className="btn btn-fill navbar-cta"
          onClick={(e) => handleNav(e, { to: '/book-stay' })}
        >
          Book Your Stay
          <span className="btn-arrow" aria-hidden="true">↗</span>
        </a>

        <button
          className="navbar-burger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={26} strokeWidth={1.5} /> : <Menu size={26} strokeWidth={1.5} />}
        </button>
      </div>

      <div className="navbar-mobile" ref={menuRef} aria-hidden={!menuOpen}>
        <nav className="navbar-mobile-links" aria-label="Mobile">
          {LINKS.map((link, i) => (
            <div className="navbar-mobile-link-mask" key={link.label}>
              <a
                href={link.to}
                ref={(el) => (linksRef.current[i] = el)}
                onClick={(e) => handleNav(e, link)}
              >
                {link.label}
              </a>
            </div>
          ))}
        </nav>
        <a
          href="/book-stay"
          className="btn btn-light navbar-mobile-cta"
          onClick={(e) => handleNav(e, { to: '/book-stay' })}
        >
          Book Your Stay
        </a>
      </div>
    </header>
  );
}

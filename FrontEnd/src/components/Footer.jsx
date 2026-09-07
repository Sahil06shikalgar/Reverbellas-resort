import { useLocation, useNavigate } from 'react-router-dom';
import { getLenis } from '../hooks/useLenis';

const NAV_OFFSET = 80;

const LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Gallery', href: '/stay#gallery' },
  { label: 'Journal', href: '/blogs' },
  { label: 'Contact', href: '#booking-form' },
];

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (e, href) => {
    e.preventDefault();

    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      const lenis = getLenis();
      if (lenis && target) lenis.scrollTo(target, { offset: -NAV_OFFSET });
      else target?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const [path, hash] = href.split('#');

    if (location.pathname === path) {
      if (hash) {
        const target = document.querySelector(`#${hash}`);
        const lenis = getLenis();
        if (lenis && target) lenis.scrollTo(target, { offset: -NAV_OFFSET });
        else target?.scrollIntoView({ behavior: 'smooth' });
      } else {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 1.3 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    navigate(href);
  };

  return (
    <footer id="contact" className="footer section-bg-dark">
      <div className="container footer-top">
        <div className="footer-brand">
          <span className="footer-wordmark">Riverbells Resort</span>
          <span className="footer-tagline">Relax • Refresh • Reconnect</span>
        </div>

        <nav className="footer-links" aria-label="Footer">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={(e) => handleNav(e, link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="footer-contact">
          <a className="footer-phone" href="tel:+917499788935">+91 74997 88935</a>
          <address>
            Khutghar, Shahapur,<br />
            Maharashtra – 421601
          </address>
          <button
            type="button"
            className="footer-cta"
            onClick={(e) => handleNav(e, '/book-stay')}
          >
            Book Your Stay
            <span className="footer-cta-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© Riverbells Resort. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

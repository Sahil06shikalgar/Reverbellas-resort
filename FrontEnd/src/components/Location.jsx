import { MapPin, Phone } from 'lucide-react';

const MAPS_URL = 'https://maps.app.goo.gl/4eepgd6uwByiu59u6';

export default function Location() {
  return (
    <section className="section location" id="location">
      <div className="container location-grid">
        <div className="location-content">
          <span className="eyebrow">Find Us</span>
          <h2 className="location-heading">
            Closer Than
            <br />
            You Think
          </h2>

          <address className="location-address">
            Riverbells Resort
            <br />
            Sr. No. 208/1,
            <br />
            At Post Khutghar,
            <br />
            Taluka Shahapur,
            <br />
            Maharashtra – 421601
          </address>

          <div className="location-actions">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-fill location-cta"
            >
              <MapPin size={16} strokeWidth={1.8} />
              Get Directions
            </a>
            <a href="tel:+917499788935" className="location-phone">
              <Phone size={15} strokeWidth={1.8} />
              +91 74997 88935
            </a>
          </div>
        </div>

        <div className="location-map">
          <iframe
            title="Riverbells Resort location map"
            src="https://www.google.com/maps?q=Riverbells+Resort+Shahapur+Maharashtra&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className="location-access">
          <span className="location-kicker">Getting Here</span>
          <p className="location-blurb">
            Roughly 2.5 to 3 hours from Mumbai, tucked into the countryside of Shahapur — a short,
            scenic drive along the water and through open greenery.
          </p>

          <div className="location-distance">
            <div className="location-distance-item">
              <strong>Mumbai</strong>
              <span>≈ 2.5–3 hrs</span>
            </div>
            <div className="location-distance-item">
              <strong>Thane</strong>
              <span>≈ 1.5–2 hrs</span>
            </div>
            <div className="location-distance-item">
              <strong>Shahapur</strong>
              <span>≈ 20–25 min</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

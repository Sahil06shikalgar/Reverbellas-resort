import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BedDouble } from 'lucide-react';
import { resolvePropertyImages } from '../utils/propertyImages';

const MAX_VISIBLE_AMENITIES = 4;

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatDateRange(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  const opts = { day: '2-digit', month: 'short', year: 'numeric' };
  return `${start.toLocaleDateString('en-IN', opts)} — ${end.toLocaleDateString('en-IN', opts)}`;
}

function typeLabel(type) {
  if (!type) return '';
  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
}

function numberOfNightsLabel(n) {
  return `${n} night${n !== 1 ? 's' : ''}`;
}

function AvailabilityCard({ property, search }) {
  const navigate = useNavigate();
  const images = useMemo(() => resolvePropertyImages(property), [property]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const mainImage = images[photoIndex] || null;

  const visibleAmenities = (property.amenities || []).slice(0, MAX_VISIBLE_AMENITIES);
  const extraCount = Math.max(0, (property.amenities || []).length - MAX_VISIBLE_AMENITIES);

  const hasRate = property.hasRate !== false && Number(property.startingRate) > 0;

  const handleBook = () => {
    const params = new URLSearchParams({
      property: property._id,
      checkIn: search.checkIn || '',
      checkOut: search.checkOut || '',
      adults: search.adults || 2,
      children: search.children || 0,
    });
    navigate(`/book-stay?${params.toString()}`);
  };

  return (
    <article className="avail-card">
      <div className="avail-card-media">
        {mainImage ? (
          <img src={mainImage} alt={property.name} loading="lazy" />
        ) : (
          <div className="avail-card-media-empty" aria-hidden="true" />
        )}
        {images.length > 1 && (
          <div className="avail-card-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`avail-card-thumb${i === photoIndex ? ' is-active' : ''}`}
                onClick={() => setPhotoIndex(i)}
                aria-label={`View photo ${i + 1} of ${property.name}`}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="avail-card-info">
        <div className="avail-card-type">{typeLabel(property.type)}</div>
        <h3 className="avail-card-name">{property.name}</h3>
        {property.description && (
          <p className="avail-card-desc">{property.description}</p>
        )}

        <div className="avail-card-capacity">
          <Users size={16} strokeWidth={1.8} />
          <span>
            Up to {property.maxGuests} guest{property.maxGuests !== 1 ? 's' : ''}
          </span>
        </div>

        {visibleAmenities.length > 0 && (
          <div className="avail-card-amenities">
            {visibleAmenities.map((a) => (
              <span key={a} className="avail-card-amenity">{a}</span>
            ))}
            {extraCount > 0 && (
              <span className="avail-card-amenity avail-card-amenity-more">+{extraCount} more</span>
            )}
          </div>
        )}
      </div>

      <div className="avail-card-price">
        {hasRate ? (
          <>
            <div className="avail-card-price-night">
              <span className="avail-card-price-from">From</span>
              <span className="avail-card-price-value">{currency.format(property.startingRate)}</span>
              <span className="avail-card-price-per">/ night</span>
            </div>

            <div className="avail-card-price-total">
              <span className="avail-card-price-total-value">
                {currency.format(property.stayTotal)} total
              </span>
              <span className="avail-card-price-total-nights">
                for {numberOfNightsLabel(property.nightCount)}
              </span>
            </div>
          </>
        ) : (
          <div className="avail-card-price-contact">Contact for price</div>
        )}

        <button type="button" className="avail-card-book" onClick={handleBook}>
          Book This Stay
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}

export default function AvailabilityResults({ result }) {
  if (!result) return null;

  const {
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    availableProperties = [],
  } = result;

  const totalGuests = Number(adults || 0) + Number(children || 0);

  const handleChangeDates = () => {
    const el = document.querySelector('#booking-bar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="avail-results" id="availability-results">
      <div className="avail-results-inner">
        <header className="avail-results-head">
          <span className="eyebrow">AVAILABLE STAYS</span>
          <h2 className="avail-results-title">Choose your stay at Riverbells</h2>
          <p className="avail-results-meta">
            <span className="avail-results-meta-item">{formatDateRange(checkIn, checkOut)}</span>
            <span className="avail-results-meta-sep" aria-hidden="true">•</span>
            <span className="avail-results-meta-item">
              {nights} {nights !== 1 ? 'Nights' : 'Night'}
            </span>
            <span className="avail-results-meta-sep" aria-hidden="true">•</span>
            <span className="avail-results-meta-item">
              {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}
            </span>
          </p>
        </header>

        {availableProperties.length === 0 ? (
          <div className="avail-empty">
            <div className="avail-empty-icon" aria-hidden="true">
              <BedDouble size={40} strokeWidth={1.3} />
            </div>
            <h3 className="avail-empty-title">No stays available for your selected dates.</h3>
            <p className="avail-empty-text">
              Try another date or guest combination.
            </p>
            <button type="button" className="avail-empty-btn" onClick={handleChangeDates}>
              Change Dates
            </button>
          </div>
        ) : (
          <div className="avail-list">
            {availableProperties.map((property) => (
              <AvailabilityCard
                key={property._id}
                property={property}
                search={{ checkIn, checkOut, adults, children }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

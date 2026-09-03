import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { createBooking } from '../services/bookingService';
import { getProperties } from '../services/propertyService';

const SOURCE_OPTIONS = [
  'Direct',
  'Phone',
  'WhatsApp',
  'Website',
  'Walk-in',
  'Booking Platform',
  'Referral',
  'Other',
];

const initialForm = {
  name: '',
  mobile: '',
  email: '',
  city: '',
  checkIn: '',
  checkOut: '',
  propertyId: '',
  adults: 2,
  children: 0,
  source: 'Direct',
  message: '',
};

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function isWeekendDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function propertyTypeLabel(type) {
  if (!type) return '';
  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
}

function propertyRateSuffix(prop) {
  if (prop && prop.type && String(prop.type).toLowerCase() === 'lawn') {
    return '/day';
  }
  return '/night';
}

function propertyOptionLabel(prop) {
  const name = prop?.name || '';
  const rate = Number(prop?.standardWeekdayRate || 0);
  const rateText =
    rate > 0
      ? `${formatINR(rate)}${propertyRateSuffix(prop)}`
      : null;
  return rateText ? `${name} — ${rateText}` : name;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function differenceInDays(a, b) {
  if (!a || !b) return 0;
  const start = new Date(a);
  const end = new Date(b);
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export default function BookStay() {
  const [form, setForm] = useState(initialForm);
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getProperties()
      .then((res) => {
        const list = (res?.data || []).filter((p) => p.active === true);
        setProperties(list);
        setPropertiesError('');
      })
      .catch(() => {
        setPropertiesError('Unable to load stay types. Please try again.');
      })
      .finally(() => {
        setPropertiesLoading(false);
      });
  }, []);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: '' }));
    setApiError('');
  };

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const selectedProperty = useMemo(
    () => properties.find((p) => p._id === form.propertyId) || null,
    [properties, form.propertyId]
  );

  const effectiveRate = useMemo(() => {
    if (!selectedProperty) return 0;
    if (isWeekendDate(form.checkIn)) {
      return Number(selectedProperty.standardWeekendRate || 0);
    }
    return Number(selectedProperty.standardWeekdayRate || 0);
  }, [selectedProperty, form.checkIn]);

  const nights = useMemo(
    () => differenceInDays(form.checkIn, form.checkOut),
    [form.checkIn, form.checkOut]
  );

  const estimatedTotal = useMemo(() => {
    if (!selectedProperty || !form.checkIn || !form.checkOut || nights <= 0) return 0;
    let total = 0;
    const start = new Date(form.checkIn);
    for (let i = 0; i < nights; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6;
      total += isWeekend
        ? (selectedProperty.standardWeekendRate || selectedProperty.standardWeekdayRate || 0)
        : (selectedProperty.standardWeekdayRate || 0);
    }
    return total;
  }, [selectedProperty, form.checkIn, form.checkOut, nights]);

  const updateGuests = (field, delta) => {
    setForm((f) => {
      let val = Number(f[field]) + delta;
      if (field === 'adults') {
        const min = 1;
        const max = selectedProperty?.maxAdults || 10;
        val = Math.max(min, Math.min(max, val));
      } else {
        const max = selectedProperty?.maxChildren || 10;
        val = Math.max(0, Math.min(max, val));
      }
      return { ...f, [field]: val };
    });
    setErrors((err) => ({ ...err, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Please enter your full name.';
    }
    if (!form.mobile.trim()) {
      next.mobile = 'Please enter your mobile number.';
    } else if (!/^[0-9+\-\s]{7,15}$/.test(form.mobile.trim())) {
      next.mobile = 'Please enter a valid 10-digit mobile number.';
    }
    if (!form.city.trim()) {
      next.city = 'Please enter your city.';
    }
    if (!form.checkIn) {
      next.checkIn = 'Select a check-in date.';
    }
    if (!form.checkOut) {
      next.checkOut = 'Select a check-out date.';
    } else if (form.checkIn && form.checkOut <= form.checkIn) {
      next.checkOut = 'Check-out must be after check-in date.';
    }
    if (!form.propertyId) {
      next.propertyId = 'Select a stay type.';
    }
    if (!form.adults || Number(form.adults) < 1) {
      next.adults = 'At least 1 adult is required.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim(),
          city: form.city.trim(),
        },
        propertyId: form.propertyId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: Number(form.adults),
        children: Number(form.children || 0),
        source: form.source,
        status: 'inquiry',
        notes: form.message.trim(),
      };
      const response = await createBooking(payload);
      if (response && response.success && response.data?._id) {
        setBookingSuccess(true);
        navigate(`/billing/${response.data._id}`);
      } else {
        setApiError(response?.message || 'Booking could not be submitted.');
      }
    } catch (error) {
      setApiError(error.message || 'Booking could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="book-stay-page">
      <Navbar />

      <section className="book-stay-bg">
        <div className="book-stay-container">
          {/* Left Column: Intro */}
          <div className="book-stay-intro">
            <span className="eyebrow">BOOK YOUR STAY</span>
            <h1 className="book-stay-intro-heading">Book Your Stay</h1>
            <p className="book-stay-intro-text">
              "Complete your details and we'll confirm your booking shortly."
            </p>
            <p className="book-stay-intro-sub">
              Plan your stay at Riverbells with a simple and secure booking process.
            </p>
          </div>

          {/* Right Column: Reservation Form Card */}
          <div className="book-stay-card">
            <div className="book-stay-card-header">
              <span className="book-stay-card-eyebrow">BOOKING DETAILS</span>
              <h2 className="book-stay-card-title">Tell us about your stay</h2>
              <div className="book-stay-card-divider" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Section 1: Guest Information */}
              <div className="book-stay-section">
                <h3 className="book-stay-section-title">Guest Information</h3>
                <div className="book-stay-row">
                  <div className="book-stay-field">
                    <label className="book-stay-label" htmlFor="bs-name">Full Name</label>
                    <input
                      id="bs-name"
                      type="text"
                      className={`book-stay-input${errors.name ? ' book-stay-input-error' : ''}`}
                      placeholder="Your full name"
                      value={form.name}
                      onChange={update('name')}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <span className="book-stay-error">{errors.name}</span>}
                  </div>
                  <div className="book-stay-field">
                    <label className="book-stay-label" htmlFor="bs-mobile">Mobile Number</label>
                    <input
                      id="bs-mobile"
                      type="tel"
                      className={`book-stay-input${errors.mobile ? ' book-stay-input-error' : ''}`}
                      placeholder="+91 00000 00000"
                      value={form.mobile}
                      onChange={update('mobile')}
                      aria-invalid={!!errors.mobile}
                    />
                    {errors.mobile && <span className="book-stay-error">{errors.mobile}</span>}
                  </div>
                </div>

                <div className="book-stay-row">
                  <div className="book-stay-field">
                    <label className="book-stay-label" htmlFor="bs-email">Email</label>
                    <input
                      id="bs-email"
                      type="email"
                      className="book-stay-input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={update('email')}
                    />
                  </div>
                  <div className="book-stay-field">
                    <label className="book-stay-label" htmlFor="bs-city">City</label>
                    <input
                      id="bs-city"
                      type="text"
                      className={`book-stay-input${errors.city ? ' book-stay-input-error' : ''}`}
                      placeholder="Your city"
                      value={form.city}
                      onChange={update('city')}
                      aria-invalid={!!errors.city}
                    />
                    {errors.city && <span className="book-stay-error">{errors.city}</span>}
                  </div>
                </div>
              </div>

              {/* Section 2: Stay Details */}
              <div className="book-stay-section">
                <h3 className="book-stay-section-title">Stay Details</h3>
                <div className="book-stay-row">
                  <div className="book-stay-field">
                    <label className="book-stay-label" htmlFor="bs-checkin">Check-in</label>
                    <div className="book-stay-date-wrap">
                      <input
                        id="bs-checkin"
                        type="date"
                        className={`book-stay-input book-stay-date${errors.checkIn ? ' book-stay-input-error' : ''}`}
                        min={todayIso}
                        value={form.checkIn}
                        onChange={update('checkIn')}
                        aria-invalid={!!errors.checkIn}
                      />
                    </div>
                    {errors.checkIn && <span className="book-stay-error">{errors.checkIn}</span>}
                  </div>

                  <div className="book-stay-field">
                    <label className="book-stay-label" htmlFor="bs-checkout">Check-out</label>
                    <div className="book-stay-date-wrap">
                      <input
                        id="bs-checkout"
                        type="date"
                        className={`book-stay-input book-stay-date${errors.checkOut ? ' book-stay-input-error' : ''}`}
                        min={form.checkIn || todayIso}
                        value={form.checkOut}
                        onChange={update('checkOut')}
                        aria-invalid={!!errors.checkOut}
                      />
                    </div>
                    {errors.checkOut && <span className="book-stay-error">{errors.checkOut}</span>}
                  </div>
                </div>

                <div className="book-stay-field">
                  <label className="book-stay-label" htmlFor="bs-property">Property / Stay Type</label>
                  <select
                    id="bs-property"
                    className={`book-stay-input book-stay-select${errors.propertyId ? ' book-stay-input-error' : ''}`}
                    value={form.propertyId}
                    onChange={update('propertyId')}
                    aria-invalid={!!errors.propertyId}
                    disabled={propertiesLoading}
                  >
                    {propertiesLoading ? (
                      <option value="">Loading stay types...</option>
                    ) : propertiesError ? (
                      <option value="">Unable to load stay types. Please try again.</option>
                    ) : (
                      <>
                        <option value="">Select stay type</option>
                        {properties.map((p) => (
                          <option key={p._id} value={p._id}>
                            {propertyOptionLabel(p)}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.propertyId && <span className="book-stay-error">{errors.propertyId}</span>}

                  {propertiesLoading && (
                    <span className="book-stay-property-note">Loading stay types...</span>
                  )}
                  {propertiesError && !propertiesLoading && (
                    <span className="book-stay-property-note">Unable to load stay types. Please try again.</span>
                  )}

                  {selectedProperty && (
                    <div className="book-stay-property-card">
                      <div className="property-card-head">
                        <span className="property-card-name">{selectedProperty.name}</span>
                        {selectedProperty.type && (
                          <span className="property-card-type">
                            {propertyTypeLabel(selectedProperty.type)}
                          </span>
                        )}
                      </div>

                      {effectiveRate > 0 && (
                        <div className="property-card-price">
                          {formatINR(effectiveRate)} {propertyRateSuffix(selectedProperty)}
                        </div>
                      )}

                      {(typeof selectedProperty.maxGuests !== 'undefined' ||
                        typeof selectedProperty.maxAdults !== 'undefined' ||
                        typeof selectedProperty.maxChildren !== 'undefined') && (
                        <div className="property-card-capacity">
                          {typeof selectedProperty.maxGuests !== 'undefined' && (
                            <span>Up to {selectedProperty.maxGuests} guests</span>
                          )}
                          {typeof selectedProperty.maxAdults !== 'undefined' &&
                            typeof selectedProperty.maxChildren !== 'undefined' && (
                              <span className="property-card-capacity-detail">
                                {selectedProperty.maxAdults} Adult{Number(selectedProperty.maxAdults) !== 1 ? 's' : ''}
                                {Number(selectedProperty.maxChildren) > 0
                                  ? ` • ${selectedProperty.maxChildren} Child${Number(selectedProperty.maxChildren) !== 1 ? 'ren' : ''}`
                                  : ''}
                              </span>
                            )}
                        </div>
                      )}

                      {Number(selectedProperty.standardWeekdayRate) > 0 &&
                        Number(selectedProperty.standardWeekendRate) > 0 &&
                        Number(selectedProperty.standardWeekendRate) !== Number(selectedProperty.standardWeekdayRate) && (
                          <div className="property-card-weekend">
                            Weekend rate {formatINR(selectedProperty.standardWeekendRate)} {propertyRateSuffix(selectedProperty)}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Guests */}
              <div className="book-stay-section">
                <h3 className="book-stay-section-title">Guests</h3>
                <div className="book-stay-row">
                  <div className="book-stay-field">
                    <label className="book-stay-label">Adults</label>
                    <div className="book-stay-counter">
                      <button
                        type="button"
                        className="book-stay-counter-btn"
                        onClick={() => updateGuests('adults', -1)}
                        disabled={Number(form.adults) <= 1}
                        aria-label="Decrease adults"
                      >
                        −
                      </button>
                      <span className="book-stay-counter-value">{form.adults}</span>
                      <button
                        type="button"
                        className="book-stay-counter-btn"
                        onClick={() => updateGuests('adults', 1)}
                        disabled={selectedProperty && Number(form.adults) >= (selectedProperty.maxAdults || 10)}
                        aria-label="Increase adults"
                      >
                        +
                      </button>
                    </div>
                    {errors.adults && <span className="book-stay-error">{errors.adults}</span>}
                  </div>

                  <div className="book-stay-field">
                    <label className="book-stay-label">Children</label>
                    <div className="book-stay-counter">
                      <button
                        type="button"
                        className="book-stay-counter-btn"
                        onClick={() => updateGuests('children', -1)}
                        disabled={Number(form.children) <= 0}
                        aria-label="Decrease children"
                      >
                        −
                      </button>
                      <span className="book-stay-counter-value">{form.children}</span>
                      <button
                        type="button"
                        className="book-stay-counter-btn"
                        onClick={() => updateGuests('children', 1)}
                        disabled={selectedProperty && Number(form.children) >= (selectedProperty.maxChildren || 10)}
                        aria-label="Increase children"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Booking */}
              <div className="book-stay-section">
                <h3 className="book-stay-section-title">Booking</h3>
                <div className="book-stay-field">
                  <label className="book-stay-label" htmlFor="bs-source">Booking Source</label>
                  <select
                    id="bs-source"
                    className="book-stay-input book-stay-select"
                    value={form.source}
                    onChange={update('source')}
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 5: Special Request */}
              <div className="book-stay-section">
                <div className="book-stay-field">
                  <label className="book-stay-label" htmlFor="bs-message">Special Request / Message</label>
                  <textarea
                    id="bs-message"
                    className="book-stay-input book-stay-textarea"
                    rows="4"
                    placeholder="Tell us anything we should know about your stay..."
                    value={form.message}
                    onChange={update('message')}
                  />
                </div>
              </div>

              {/* Section 6: Booking Summary Card */}
              {form.propertyId && form.checkIn && form.checkOut && nights > 0 && (
                <div className="book-stay-summary">
                  <div className="book-stay-summary-title">YOUR STAY</div>
                  <div className="book-stay-summary-property">{selectedProperty?.name}</div>
                  <div className="book-stay-summary-dates">
                    {formatDisplayDate(form.checkIn)} → {formatDisplayDate(form.checkOut)}
                  </div>
                  <div className="book-stay-summary-nights">{nights} night{nights !== 1 ? 's' : ''}</div>
                  <div className="book-stay-summary-divider" />
                  <div className="book-stay-summary-row">
                    <span>Guests</span>
                    <span>
                      {form.adults} Adult{Number(form.adults) !== 1 ? 's' : ''}
                      {Number(form.children) > 0 ? ` · ${form.children} Child${Number(form.children) !== 1 ? 'ren' : ''}` : ''}
                    </span>
                  </div>
                  {estimatedTotal > 0 && (
                    <div className="book-stay-summary-total">
                      <span>Estimated total</span>
                      <span>{formatCurrency(estimatedTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {apiError && (
                <div className="book-stay-error-global">
                  {apiError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="book-stay-submit"
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'CONFIRM BOOKING'}
                <span className="book-stay-submit-arrow" aria-hidden="true">→</span>
              </button>

              {/* Success Notification */}
              {bookingSuccess && (
                <div className="book-stay-success">
                  Booking confirmed. Redirecting to billing…
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

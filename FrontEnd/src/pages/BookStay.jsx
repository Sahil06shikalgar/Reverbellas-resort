import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { createBooking } from '../services/bookingService';
import { getProperties, getAvailability } from '../services/propertyService';

const WHATSAPP_NUMBER = '917499788935';

const GST_PERCENT = 18;

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
  source: 'Website',
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

function buildWhatsAppUrl(messageLines, property, checkIn, checkOut, nights) {
  const lines = [
    'Hello Riverbells Resort,',
    '',
    'I would like to confirm my stay.',
    '',
    `Guest: ${messageLines.name}`,
    `Mobile: ${messageLines.mobile}`,
    `Property: ${property?.name || ''}`,
    '',
    `Check-In: ${formatDisplayDate(checkIn)}`,
    `Check-Out: ${formatDisplayDate(checkOut)}`,
    `Guests: ${messageLines.adults} Adult${Number(messageLines.adults) !== 1 ? 's' : ''}${
      Number(messageLines.children) > 0
        ? `, ${messageLines.children} Child${Number(messageLines.children) !== 1 ? 'ren' : ''}`
        : ''
    }`,
    `Nights: ${nights}`,
    '',
    `Stay Total: ${formatCurrency(messageLines.total)}`,
    '',
    'Please confirm availability and booking details.',
    '',
    'Thank you.',
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export default function BookStay() {
  const [searchParams] = useSearchParams();
  const initialFormFromParams = {
    ...initialForm,
    checkIn: searchParams.get('checkIn') || initialForm.checkIn,
    checkOut: searchParams.get('checkOut') || initialForm.checkOut,
    propertyId: searchParams.get('property') || initialForm.propertyId,
    adults: searchParams.get('adults') ? Number(searchParams.get('adults')) : initialForm.adults,
    children: searchParams.get('children') ? Number(searchParams.get('children')) : initialForm.children,
  };

  const [form, setForm] = useState(initialFormFromParams);
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const createdBookingId = useRef(null);
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
  };

  const handleCheckInChange = (value) => {
    if (value && todayIso && value < todayIso) {
      toast.error('Check-in date cannot be in the past.');
      return;
    }
    setForm((f) => ({ ...f, checkIn: value }));
    setErrors((err) => ({ ...err, checkIn: '' }));
    if (value && form.checkOut && new Date(form.checkOut) <= new Date(value)) {
      setForm((f) => ({ ...f, checkOut: '' }));
      setErrors((err) => ({ ...err, checkOut: '' }));
      toast.warning('Please select a new check-out date.');
    }
  };

  const handleCheckOutChange = (value) => {
    if (value && form.checkIn && new Date(value) <= new Date(form.checkIn)) {
      setForm((f) => ({ ...f, checkOut: '' }));
      setErrors((err) => ({ ...err, checkOut: '' }));
      toast.error('Check-out date must be after check-in.');
      return;
    }
    setForm((f) => ({ ...f, checkOut: value }));
    setErrors((err) => ({ ...err, checkOut: '' }));
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

  const discountAmount = 0;
  const otherCharges = 0;
  const gstAmount = Math.round(Number(estimatedTotal) * (GST_PERCENT / 100));
  const grandTotal = Number(estimatedTotal) + gstAmount;
  const alreadyPaid = 0;
  const pendingAmount = grandTotal;

  useEffect(() => {
    if (!form.propertyId || !form.checkIn || !form.checkOut || nights <= 0) return;
    let active = true;
    getAvailability({
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: Number(form.adults || 1),
      children: Number(form.children || 0),
    })
      .then((res) => {
        if (!active) return;
        const available = res?.data?.availableProperties || [];
        const found = available.some(
          (p) => String(p._id) === String(form.propertyId)
        );
        if (!found) {
          toast.error(
            'Selected stay is not available for these dates. Please choose another stay or change your dates.'
          );
        }
      })
      .catch(() => {
        if (!active) return;
        toast.error('Unable to check availability. Please try again.');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.propertyId, form.checkIn, form.checkOut, nights, form.adults, form.children]);

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

  const createInquiry = async () => {
    if (createdBookingId.current) return createdBookingId.current;
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
      source: 'Website',
      contactChannel: 'WhatsApp',
      status: 'inquiry',
      notes: form.message.trim(),
      pricing: {
        ratePerNight: nights > 0 ? Math.round(estimatedTotal / nights) : 0,
        nights,
        taxAmount: gstAmount,
      },
    };
    const response = await createBooking(payload);
    if (response && response.success && response.data?._id) {
      createdBookingId.current = response.data._id;
      return response.data._id;
    }
    throw new Error(response?.message || 'Booking could not be created.');
  };

  const handleProceedToPayment = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error('Please complete the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      const id = await createInquiry();
      toast.success('Booking enquiry created.');
      navigate(`/billing/${id}`);
    } catch (error) {
      toast.error(error.message || 'Booking could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueWhatsApp = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error('Please complete the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      const id = await createInquiry();
      const url = buildWhatsAppUrl(
        {
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          adults: Number(form.adults),
          children: Number(form.children || 0),
          total: grandTotal,
        },
        selectedProperty,
        form.checkIn,
        form.checkOut,
        nights
      );
      const isMobile = /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
      if (isMobile) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      toast.success('Booking enquiry created. Opening WhatsApp...');
      toast.info(`Your booking reference is ${id}.`);
    } catch (error) {
      toast.error(error.message || 'Booking could not be created. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const propertyCard = selectedProperty && (
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
  );

  return (
    <div className="book-stay-page">
      <Navbar />

      <section className="book-stay-bg">
        <div className="book-stay-container book-stay-checkout">
          <header className="book-stay-checkout-head">
            <span className="eyebrow">BOOK YOUR STAY</span>
            <h1 className="book-stay-intro-heading">Reserve Your Stay</h1>
            <p className="book-stay-intro-text">
              Complete your details, review your booking, then continue on WhatsApp or pay securely online.
            </p>
          </header>

          <div className="book-stay-checkout-grid">
            {/* LEFT — Personal + stay details */}
            <div className="book-stay-col-left">
              <form onSubmit={handleProceedToPayment} noValidate>
                {/* Section 1: Guest Details */}
                <div className="book-stay-card">
                  <div className="book-stay-card-header">
                    <h2 className="book-stay-card-title">Guest Details</h2>
                    <div className="book-stay-card-divider" />
                  </div>

                  <div className="book-stay-section">
                    <div className="book-stay-row">
                      <div className="book-stay-field">
                        <label className="book-stay-label" htmlFor="bs-name">Full Name *</label>
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
                        <label className="book-stay-label" htmlFor="bs-mobile">Mobile Number *</label>
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
                </div>

                {/* Section 2: Stay Details */}
                <div className="book-stay-card">
                  <div className="book-stay-card-header">
                    <h2 className="book-stay-card-title">Stay Details</h2>
                    <div className="book-stay-card-divider" />
                  </div>

                  <div className="book-stay-section">
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
                            onChange={(e) => handleCheckInChange(e.target.value)}
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
                            onChange={(e) => handleCheckOutChange(e.target.value)}
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

                      {propertyCard}
                    </div>

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

                    <div className="book-stay-field">
                      <label className="book-stay-label" htmlFor="bs-message">Special Request (optional)</label>
                      <textarea
                        id="bs-message"
                        className="book-stay-input book-stay-textarea"
                        rows="3"
                        placeholder="Tell us anything we should know about your stay..."
                        value={form.message}
                        onChange={update('message')}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT — Booking summary + actions */}
            <aside className="book-stay-col-right">
              <div className="book-stay-checkout-summary">
                <span className="book-stay-summary-eyebrow">BOOKING SUMMARY</span>

                <div className="book-stay-checkout-property">
                  <strong className="book-stay-checkout-property-name">
                    {selectedProperty?.name || 'Select a stay type'}
                  </strong>
                  {selectedProperty?.type && (
                    <span className="book-stay-checkout-property-type">
                      {propertyTypeLabel(selectedProperty.type)}
                    </span>
                  )}
                </div>

                <div className="book-stay-checkout-line">
                  <span>Check-In</span>
                  <strong>{formatDisplayDate(form.checkIn) || '—'}</strong>
                </div>
                <div className="book-stay-checkout-line">
                  <span>Check-Out</span>
                  <strong>{formatDisplayDate(form.checkOut) || '—'}</strong>
                </div>
                <div className="book-stay-checkout-line">
                  <span>Number of Nights</span>
                  <strong>{nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : '—'}</strong>
                </div>
                <div className="book-stay-checkout-line">
                  <span>Guests</span>
                  <strong>
                    {form.adults} Adult{Number(form.adults) !== 1 ? 's' : ''}
                    {Number(form.children) > 0 ? ` · ${form.children} Child${Number(form.children) !== 1 ? 'ren' : ''}` : ''}
                  </strong>
                </div>

                <div className="book-stay-checkout-divider" />

                <div className="book-stay-checkout-price">
                  <div className="book-stay-checkout-line">
                    <span>Stay Amount</span>
                    <strong>{formatCurrency(estimatedTotal)}</strong>
                  </div>
                  <div className="book-stay-checkout-line">
                    <span>Discount</span>
                    <strong>-{formatCurrency(discountAmount)}</strong>
                  </div>
                  <div className="book-stay-checkout-line">
                    <span>GST ({GST_PERCENT}%, est.)</span>
                    <strong>{formatCurrency(gstAmount)}</strong>
                  </div>
                  <div className="book-stay-checkout-line">
                    <span>Other Charges</span>
                    <strong>{formatCurrency(otherCharges)}</strong>
                  </div>
                  <div className="book-stay-checkout-total">
                    <span>Grand Total</span>
                    <strong>{formatCurrency(grandTotal)}</strong>
                  </div>
                  <div className="book-stay-checkout-line">
                    <span>Already Paid</span>
                    <strong>{formatCurrency(alreadyPaid)}</strong>
                  </div>
                  <div className="book-stay-checkout-line book-stay-checkout-pending">
                    <span>Pending Amount</span>
                    <strong>{formatCurrency(pendingAmount)}</strong>
                  </div>
                </div>

                {selectedProperty && form.checkIn && form.checkOut && nights > 0 && (
                  <p className="book-stay-checkout-note">
                    This is an estimated total based on current rates. The final amount is calculated on your
                    booking. Proceed to payment to review the confirmed billing.
                  </p>
                )}

                <div className="book-stay-checkout-divider" />

                <div className="book-stay-checkout-options">
                  <div className="book-stay-checkout-options-title">
                    HOW WOULD YOU LIKE TO CONTINUE?
                  </div>

                  <button
                    type="button"
                    className="book-stay-whatsapp-btn"
                    onClick={handleContinueWhatsApp}
                    disabled={submitting}
                  >
                    <MessageCircle size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span>
                      <strong>Continue on WhatsApp</strong>
                      <small>Confirm your stay with us directly</small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="book-stay-pay-btn"
                    onClick={handleProceedToPayment}
                    disabled={submitting}
                  >
                    <span>
                      <strong>Proceed to Payment</strong>
                      <small>Pay securely and confirm instantly</small>
                    </span>
                    <span className="book-stay-pay-arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useState } from 'react';

const PACKAGE_OPTIONS = [
  'Group / Family Stay',
  'Couple Stay',
  'One-Day Group / Family',
  'One-Day Couple',
];

const WHATSAPP_NUMBER = '917499788935';

const initialForm = {
  name: '',
  phone: '',
  checkIn: '',
  checkOut: '',
  guests: '',
  package: '',
  message: '',
};

export default function BookingForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.phone.trim()) next.phone = 'Please enter your phone number.';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (!form.checkIn) next.checkIn = 'Select a check-in date.';
    if (!form.checkOut) next.checkOut = 'Select a check-out date.';
    if (!form.guests) next.guests = 'Enter number of guests.';
    if (!form.package) next.package = 'Select a package.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setStatus('');
      return;
    }

    const lines = [
      'Hello Riverbells Resort,',
      '',
      'I would like to make a booking enquiry.',
      '',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Check-In: ${form.checkIn}`,
      `Check-Out: ${form.checkOut}`,
      `Guests: ${form.guests}`,
      `Package: ${form.package}`,
      `Message: ${form.message || '-'}`,
      '',
      'Thank you.',
    ];

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    setStatus('Opening WhatsApp with your enquiry…');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="section booking-form-section" id="booking-form">
      <div className="container booking-form-grid">
        <div className="booking-form-intro">
          <span className="eyebrow">Book Now</span>
          <h2>Your Escape Starts Here</h2>
          <p>
            Share a few details and we'll confirm availability over WhatsApp — no back and forth,
            no waiting.
          </p>
        </div>

        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="bf-name">Full Name</label>
            <input
              id="bf-name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={update('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="bf-phone">Phone Number</label>
            <input
              id="bf-phone"
              type="tel"
              placeholder="+91 00000 00000"
              value={form.phone}
              onChange={update('phone')}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="bf-checkin">Check-In Date</label>
            <input
              id="bf-checkin"
              type="date"
              value={form.checkIn}
              onChange={update('checkIn')}
              aria-invalid={!!errors.checkIn}
            />
            {errors.checkIn && <span className="form-error">{errors.checkIn}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="bf-checkout">Check-Out Date</label>
            <input
              id="bf-checkout"
              type="date"
              value={form.checkOut}
              onChange={update('checkOut')}
              aria-invalid={!!errors.checkOut}
            />
            {errors.checkOut && <span className="form-error">{errors.checkOut}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="bf-guests">Number of Guests</label>
            <input
              id="bf-guests"
              type="number"
              min="1"
              placeholder="2"
              value={form.guests}
              onChange={update('guests')}
              aria-invalid={!!errors.guests}
            />
            {errors.guests && <span className="form-error">{errors.guests}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="bf-package">Package Type</label>
            <select
              id="bf-package"
              value={form.package}
              onChange={update('package')}
              aria-invalid={!!errors.package}
            >
              <option value="">Select a package</option>
              {PACKAGE_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.package && <span className="form-error">{errors.package}</span>}
          </div>

          <div className="form-group full">
            <label htmlFor="bf-message">Message</label>
            <textarea
              id="bf-message"
              rows="3"
              placeholder="Anything else we should know?"
              value={form.message}
              onChange={update('message')}
            />
          </div>

          <div className="form-submit-row">
            <button type="submit" className="btn btn-light">
              Send Booking Enquiry
              <span className="btn-arrow" aria-hidden="true">↗</span>
            </button>
            {status && <span className="form-status">{status}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}

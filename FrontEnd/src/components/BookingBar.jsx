import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown } from 'lucide-react';

export default function BookingBar() {
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
  });
  const navigate = useNavigate();

  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openDatePicker = (field) => {
    const ref = field === 'checkIn' ? checkInRef : checkOutRef;
    if (ref.current?.showPicker) {
      ref.current.showPicker();
    } else {
      ref.current?.focus();
    }
  };

  const handleCheck = (e) => {
    e.preventDefault();
    navigate('/book-stay');
  };

  return (
    <section className="booking-bar-wrap" id="booking-bar">
      <form className="booking-bar" onSubmit={handleCheck}>
        <div className="booking-field">
          <label htmlFor="booking-check-in">Check-In</label>
          <div className="bb-input-icon" onClick={() => openDatePicker('checkIn')}>
            <input
              ref={checkInRef}
              id="booking-check-in"
              name="checkIn"
              type="date"
              min={todayIso}
              value={form.checkIn}
              onChange={update('checkIn')}
            />
            <Calendar size={20} strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>

        <div className="booking-field">
          <label htmlFor="booking-check-out">Check-Out</label>
          <div className="bb-input-icon" onClick={() => openDatePicker('checkOut')}>
            <input
              ref={checkOutRef}
              id="booking-check-out"
              name="checkOut"
              type="date"
              min={form.checkIn || todayIso}
              value={form.checkOut}
              onChange={update('checkOut')}
            />
            <Calendar size={20} strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>

        <div className="booking-field">
          <label htmlFor="bb-guests">Guests</label>
          <div className="bb-input-icon">
            <input
              id="bb-guests"
              type="number"
              min="1"
              placeholder="2"
              value={form.guests}
              onChange={update('guests')}
            />
            <ChevronDown size={20} strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>

        <button type="submit" className="btn btn-fill booking-submit">
          Check Availability
          <span className="btn-arrow" aria-hidden="true">↗</span>
        </button>
      </form>
    </section>
  );
}

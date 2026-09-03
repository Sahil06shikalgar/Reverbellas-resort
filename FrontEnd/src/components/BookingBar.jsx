import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, ChevronDown } from 'lucide-react';

export default function BookingBar({ onSearch }) {
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
  });
  const navigate = useNavigate();

  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleCheckInChange = (value) => {
    if (value && value < todayIso) {
      toast.error('Check-in date cannot be in the past.');
      return;
    }
    setForm((f) => ({ ...f, checkIn: value }));
    if (value && form.checkOut && new Date(form.checkOut) <= new Date(value)) {
      setForm((f) => ({ ...f, checkOut: '' }));
      toast.warning('Please select a new check-out date.');
    }
  };

  const handleCheckOutChange = (value) => {
    if (value && form.checkIn && new Date(value) <= new Date(form.checkIn)) {
      setForm((f) => ({ ...f, checkOut: '' }));
      toast.error('Check-out date must be after check-in.');
      return;
    }
    setForm((f) => ({ ...f, checkOut: value }));
  };

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

    if (!form.checkIn) {
      toast.error('Please select a check-in date.');
      return;
    }
    if (!form.checkOut) {
      toast.error('Please select a check-out date.');
      return;
    }
    if (form.checkOut <= form.checkIn) {
      toast.error('Check-out must be after check-in.');
      return;
    }
    if (!form.guests || Number(form.guests) < 1) {
      toast.error('Please enter the number of guests.');
      return;
    }

    if (onSearch) {
      onSearch({
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
      });
      return;
    }

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
              onChange={(e) => handleCheckInChange(e.target.value)}
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
              onChange={(e) => handleCheckOutChange(e.target.value)}
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

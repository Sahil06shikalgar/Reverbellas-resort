import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, ChevronDown } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function BookingBar({ onSearch }) {
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
  });
  const [calOpen, setCalOpen] = useState(false);
  const [calField, setCalField] = useState('checkIn');
  const navigate = useNavigate();

  const checkInFieldRef = useRef(null);
  const checkOutFieldRef = useRef(null);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const openDatePicker = (field) => {
    setCalField(field);
    setCalOpen(true);
  };

  const applyDates = ({ checkIn = null, checkOut = null }) => {
    setForm((f) => {
      const next = { ...f };
      if (checkIn) {
        if (checkIn < todayIso) return f;
        next.checkIn = checkIn;
        if (next.checkOut && next.checkOut <= checkIn) next.checkOut = '';
      }
      if (checkOut) {
        if (next.checkIn && checkOut <= next.checkIn) return f;
        next.checkOut = checkOut;
      }
      return next;
    });
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
        <div className="booking-field" ref={checkInFieldRef} onClick={() => openDatePicker('checkIn')}>
          <label htmlFor="booking-check-in">Check-In</label>
          <div className="bb-input-icon">
            <input
              id="booking-check-in"
              name="checkIn"
              type="text"
              readOnly
              value={formatDate(form.checkIn)}
              placeholder="Select date"
              autoComplete="off"
              aria-haspopup="dialog"
              aria-expanded={calOpen && calField === 'checkIn'}
            />
            <Calendar size={20} strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>

        <div className="booking-field" ref={checkOutFieldRef} onClick={() => openDatePicker('checkOut')}>
          <label htmlFor="booking-check-out">Check-Out</label>
          <div className="bb-input-icon">
            <input
              id="booking-check-out"
              name="checkOut"
              type="text"
              readOnly
              value={formatDate(form.checkOut)}
              placeholder="Select date"
              autoComplete="off"
              aria-haspopup="dialog"
              aria-expanded={calOpen && calField === 'checkOut'}
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

      <DateRangePicker
        open={calOpen}
        field={calField}
        anchorEl={calField === 'checkIn' ? checkInFieldRef : checkOutFieldRef}
        checkIn={form.checkIn}
        checkOut={form.checkOut}
        onChange={applyDates}
        onClose={() => setCalOpen(false)}
      />
    </section>
  );
}
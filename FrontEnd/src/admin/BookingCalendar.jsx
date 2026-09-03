import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings } from '../services/bookingService';
import { getProperties } from '../services/propertyService';
import BookingDetails from './BookingDetails';

const STATUS_LABEL = {
  inquiry: 'Inquiry',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function BookingCalendar() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [properties, setProperties] = useState([]);
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [bResp, pResp] = await Promise.all([getBookings(), getProperties()]);
      setBookings(bResp.data || []);
      setProperties(pResp.data || []);
    } catch (e) {
      setError(e.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grid = useMemo(() => {
    const first = new Date(month.y, month.m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [month]);

  const isActive = (s) => ['inquiry', 'confirmed', 'checked_in'].includes(s);

  const bookingsByDay = useMemo(() => {
    const map = {};
    const filtered = propertyFilter === 'all'
      ? bookings
      : bookings.filter((b) => b.property?._id === propertyFilter);

    filtered.forEach((b) => {
      if (!b.checkIn || !b.checkOut) return;
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === month.y && d.getMonth() === month.m) {
          const key = d.getDate();
          if (!map[key]) map[key] = [];
          map[key].push(b);
        }
      }
    });
    return map;
  }, [bookings, month, propertyFilter]);

  const prev = () => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const next = () => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  const today = () => {
    const now = new Date();
    setMonth({ y: now.getFullYear(), m: now.getMonth() });
  };

  const monthName = new Date(month.y, month.m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Booking Calendar</h1>
          <p className="admin-sub">Monthly availability and bookings</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => navigate('/admin/all-bookings')}>
          View All Bookings
        </button>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button type="button" className="admin-btn ghost" onClick={prev}>← Prev</button>
          <button type="button" className="admin-btn ghost" onClick={today}>Today</button>
          <button type="button" className="admin-btn ghost" onClick={next}>Next →</button>
          <span className="calendar-month">{monthName}</span>
        </div>

        <div className="calendar-filter">
          <label htmlFor="cal-property">Property</label>
          <select
            id="cal-property"
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
          >
            <option value="all">All properties</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading calendar…</div>
      ) : (
        <div className="calendar-grid-wrap">
          <div className="calendar-grid-head">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="calendar-day-head">{d}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {grid.map((day, i) => (
              <div key={i} className={`calendar-cell ${day === null ? 'empty' : ''}`}>
                {day !== null && (
                  <>
                    <span className="calendar-day-num">{day}</span>
                    <div className="calendar-books">
                      {(bookingsByDay[day] || []).slice(0, 3).map((b) => (
                        <button
                          key={b._id}
                          type="button"
                          className={`cal-booking ${isActive(b.status) ? 'active' : 'closed'}`}
                          onClick={() => setSelected(b)}
                          title={`${b.bookingCode} — ${b.customer?.name || ''} (${STATUS_LABEL[b.status] || b.status})`}
                        >
                          {b.bookingCode}
                        </button>
                      ))}
                      {(bookingsByDay[day] || []).length > 3 && (
                        <span className="cal-more">
                          +{(bookingsByDay[day] || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="calendar-legend">
        <span className="legend-dot active" /> Active (inquiry / confirmed / checked-in)
        <span className="legend-dot closed" /> Closed (checked-out / completed / cancelled)
      </div>

      {selected && (
        <BookingDetails
          bookingId={selected._id}
          onClose={() => setSelected(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getBookings } from '../services/bookingService';
import { getProperties } from '../services/propertyService';
import BookingDetails from './BookingDetails';
import NewBookingForm from './NewBookingForm';

const STATUS_LABEL = {
  inquiry: 'Inquiry',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [property, setProperty] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const bResp = await getBookings(params);
      setBookings(bResp.data || []);
    } catch (e) {
      toast.error(e.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProperties().then((r) => setProperties(r.data || [])).catch(() => {});
    load({ search, status, property });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => load({ search: search.trim(), status, property });

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setProperty('');
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>All Bookings</h1>
          <p className="admin-sub">Search, filter and manage every booking</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => setShowNew(true)}>
          + New Booking
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search booking no., customer, mobile, email, property…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="admin-input"
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select value={property} onChange={(e) => setProperty(e.target.value)} className="admin-input">
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        <button type="button" className="admin-btn" onClick={applyFilters}>Apply</button>
        <button type="button" className="admin-btn ghost" onClick={clearFilters}>Clear</button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="admin-empty">No bookings found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Property</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} onClick={() => setSelected(b)} className="clickable">
                  <td><strong>{b.bookingCode}</strong></td>
                  <td>{b.customer?.name || '—'}</td>
                  <td>{b.customer?.mobile || '—'}</td>
                  <td>{b.property?.name || '—'}</td>
                  <td>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : '—'}</td>
                  <td>{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : '—'}</td>
                  <td>{b.adults} A {b.children} C</td>
                  <td>
                    <span className={`status-chip ${b.status}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <BookingDetails
          bookingId={selected._id}
          onClose={() => setSelected(null)}
          onSaved={load}
        />
      )}

      {showNew && (
        <NewBookingForm
          properties={properties}
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
    </div>
  );
}
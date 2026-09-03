import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getCustomers, getCustomerById } from '../services/customerService';

const STATUS_LABEL = {
  inquiry: 'Inquiry',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function CustomerHistory() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (term = '') => {
    setLoading(true);
    try {
      const r = await getCustomers({ search: term });
      setCustomers(r.data || []);
    } catch (e) {
      toast.error(e.message || 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCustomer = async (c) => {
    setSelected(c);
    setDetail(null);
    setDetailLoading(true);
    try {
      const r = await getCustomerById(c._id);
      setDetail(r.data);
    } catch (e) {
      toast.error(e.message || 'Could not load customer history.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Customer History</h1>
          <p className="admin-sub">Database of guests, their bookings and spends</p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search name, mobile, email, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          className="admin-input"
        />
        <button type="button" className="admin-btn" onClick={() => load(search)}>Search</button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading customers…</div>
      ) : customers.length === 0 ? (
        <div className="admin-empty">No customers found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>City</th>
                <th>Total Bookings</th>
                <th>Latest Booking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const latest = c.latestBooking;
                return (
                  <tr key={c._id} className="clickable" onClick={() => openCustomer(c)}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.mobile || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.city || '—'}</td>
                    <td>{c.totalBookings ?? '—'}</td>
                    <td>
                      {latest
                        ? `${latest.bookingCode} · ${new Date(latest.checkIn).toLocaleDateString()}`
                        : '—'}
                    </td>
                    <td><span className="linklike">View history →</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{selected.name}</h3>
              <button type="button" className="modal-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            </div>

            <div className="modal-body">
              {detailLoading ? (
                <div className="admin-loading">Loading history…</div>
              ) : detail ? (
                <>
                  <div className="detail-grid">
                    <div>
                      <p><strong>Mobile:</strong> {detail.customer.mobile || '—'}</p>
                      <p><strong>Email:</strong> {detail.customer.email || '—'}</p>
                      <p><strong>City:</strong> {detail.customer.city || '—'}</p>
                      <p><strong>KYC:</strong> {detail.customer.kycType || ''} {detail.customer.kycNumber || ''}</p>
                    </div>
                    <div>
                      <p><strong>Total bookings:</strong> {detail.totalBookings}</p>
                      <p><strong>Total spent:</strong> ₹{detail.totalSpent}</p>
                    </div>
                  </div>

                  {detail.bookings.length > 0 ? (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Booking</th>
                            <th>Property</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.bookings.map((b) => (
                            <tr key={b._id}>
                              <td><strong>{b.bookingCode}</strong></td>
                              <td>{b.property?.name || '—'}</td>
                              <td>{new Date(b.checkIn).toLocaleDateString()}</td>
                              <td>{new Date(b.checkOut).toLocaleDateString()}</td>
                              <td><span className={`status-chip ${b.status}`}>{STATUS_LABEL[b.status] || b.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="muted">No bookings yet.</p>
                  )}

                  {detail.payments.length > 0 && (
                    <div className="detail-section">
                      <h4>Payments ({detail.payments.length})</h4>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Payment</th>
                              <th>Date</th>
                              <th>Mode</th>
                              <th>Type</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.payments.map((p) => (
                              <tr key={p._id}>
                                <td>{p.paymentCode}</td>
                                <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                <td>{p.mode}</td>
                                <td>{p.paymentType}</td>
                                <td>₹{p.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
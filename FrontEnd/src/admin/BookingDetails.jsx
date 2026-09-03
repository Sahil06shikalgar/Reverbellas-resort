import { useEffect, useState } from 'react';
import { getBookingById, changeBookingStatus, addServiceCharge } from '../services/bookingService';
import { getBookingPayments, addPayment } from '../services/paymentService';
import InvoiceModal from './InvoiceModal';

const STATUS_LABEL = {
  inquiry: 'Inquiry',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const NEXT_STATUS = {
  inquiry: 'confirmed',
  confirmed: 'checked_in',
  checked_in: 'checked_out',
  checked_out: 'completed',
};

const nextLabel = (s) => {
  const map = {
    inquiry: 'Confirm',
    confirmed: 'Check In',
    checked_in: 'Check Out',
    checked_out: 'Complete',
  };
  return map[s];
};

const MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'];
const PTYPES = ['Advance', 'Partial', 'Final', 'Refund', 'Other'];
const CATEGORIES = ['food', 'service', 'other'];

export default function BookingDetails({ bookingId, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payType, setPayType] = useState('Partial');
  const [payRef, setPayRef] = useState('');
  const [payBusy, setPayBusy] = useState(false);

  const [svcDesc, setSvcDesc] = useState('');
  const [svcCat, setSvcCat] = useState('other');
  const [svcQty, setSvcQty] = useState(1);
  const [svcRate, setSvcRate] = useState(0);
  const [svcBusy, setSvcBusy] = useState(false);

  const [showInvoice, setShowInvoice] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [bResp, pResp] = await Promise.all([
        getBookingById(bookingId),
        getBookingPayments(bookingId),
      ]);
      setData(bResp.data);
      setPayments(pResp.data || []);
    } catch (e) {
      setError(e.message || 'Could not load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const booking = data?.booking || null;
  const billing = data?.billing || null;

  const runStatus = async () => {
    if (!booking || !NEXT_STATUS[booking.status]) return;
    setActionBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await changeBookingStatus(booking._id, NEXT_STATUS[booking.status]);
      setNotice(res.message || 'Status updated.');
      await load();
      onSaved?.();
    } catch (e) {
      setError(e.message || 'Status change failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking || booking.status === 'cancelled' || booking.status === 'completed') return;
    setActionBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await changeBookingStatus(booking._id, 'cancelled');
      setNotice(res.message || 'Booking cancelled.');
      await load();
      onSaved?.();
    } catch (e) {
      setError(e.message || 'Could not cancel booking.');
    } finally {
      setActionBusy(false);
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setPayBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await addPayment({
        bookingId,
        amount: Number(payAmount),
        mode: payMode,
        paymentType: payType,
        reference: payRef,
      });
      setNotice(res.message || 'Payment recorded.');
      setPayAmount('');
      setPayRef('');
      setPayBusy(false);
      await load();
      onSaved?.();
    } catch (err) {
      setPayBusy(false);
      setError(err.message || 'Payment failed.');
    }
  };

  const submitService = async (e) => {
    e.preventDefault();
    setSvcBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await addServiceCharge(bookingId, {
        description: svcDesc,
        category: svcCat,
        quantity: Number(svcQty),
        rate: Number(svcRate),
      });
      setNotice(res.message || 'Service charge added.');
      setSvcDesc('');
      setSvcQty(1);
      setSvcRate(0);
      setSvcBusy(false);
      await load();
      onSaved?.();
    } catch (err) {
      setSvcBusy(false);
      setError(err.message || 'Could not add service charge.');
    }
  };

  if (loading) return <div className="modal-overlay"><div className="modal-box admin-loading">Loading…</div></div>;
  if (!booking) return <div className="modal-overlay"><div className="modal-box">{error}</div></div>;

  const balance = billing?.balance ?? 0;
  const canCheckout = balance <= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{booking.bookingCode}</h3>
            <span className={`status-chip ${booking.status}`}>
              {STATUS_LABEL[booking.status] || booking.status}
            </span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {notice && <div className="admin-notice">{notice}</div>}
        {error && <div className="admin-error">{error}</div>}

        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-col">
              <h4>Customer</h4>
              <p><strong>{booking.customer?.name || '—'}</strong></p>
              <p>Mobile: {booking.customer?.mobile || '—'}</p>
              <p>Email: {booking.customer?.email || '—'}</p>
              <p>City: {booking.customer?.city || '—'}</p>
              <p>KYC: {booking.customer?.kycType || ''} {booking.customer?.kycNumber || ''}</p>
            </div>

            <div className="detail-col">
              <h4>Stay</h4>
              <p><strong>{booking.property?.name || '—'}</strong></p>
              <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
              <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
              <p>Guests: {booking.adults} adults, {booking.children} children</p>
              <p>Source: {booking.source || '—'}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="detail-notes">
              <h4>Notes</h4>
              <p>{booking.notes}</p>
            </div>
          )}

          <div className="detail-section">
            <h4>Billing Summary</h4>
            {billing ? (
              <div className="billing-sheet">
                <div className="billing-row"><span>Base Stay Amount</span><span>₹{billing.baseAmount}</span></div>
                <div className="billing-row"><span>Discount</span><span>-₹{billing.discountAmount}</span></div>
                <div className="billing-row"><span>Tax</span><span>₹{billing.tax}</span></div>
                <div className="billing-row"><span>Other Charges</span><span>₹{billing.otherCharges}</span></div>
                <div className="billing-row"><span>Food / Service</span><span>₹{billing.servicesTotal}</span></div>
                <div className="billing-row total"><span>Grand Total</span><span>₹{billing.grandTotal}</span></div>
                <div className="billing-row"><span>Paid</span><span>₹{billing.totalPaid}</span></div>
                <div className={`billing-row ${balance > 0 ? 'due' : ''}`}><span>Balance</span><span>₹{balance}</span></div>
              </div>
            ) : (
              <p>Calculating…</p>
            )}
          </div>

          <div className="detail-section">
            <h4>Status Flow</h4>
            {NEXT_STATUS[booking.status] ? (
              <button
                type="button"
                className="admin-btn"
                disabled={actionBusy || (booking.status === 'checked_in' && !canCheckout)}
                onClick={runStatus}
              >
                {booking.status === 'checked_in' && !canCheckout
                  ? `Check Out (pending ₹${balance})`
                  : `${nextLabel(booking.status)} →`}
              </button>
            ) : (
              <span className="muted">Final state: {STATUS_LABEL[booking.status]}</span>
            )}
            {booking.status === 'checked_in' && !canCheckout && (
              <p className="admin-hint">Payment is still pending. Please clear the balance before checkout.</p>
            )}
            {!['cancelled', 'completed'].includes(booking.status) && (
              <button type="button" className="admin-btn danger" disabled={actionBusy} onClick={cancelBooking}>
                Cancel Booking
              </button>
            )}
            <button type="button" className="admin-btn ghost" onClick={() => setShowInvoice(true)}>
              Print / Save Invoice PDF
            </button>
          </div>

          {['inquiry', 'confirmed', 'checked_in', 'checked_out'].includes(booking.status) && (
            <>
              <div className="detail-section">
                <h4>Record Payment</h4>
                <form className="admin-inline-form" onSubmit={submitPayment}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="admin-input"
                    required
                  />
                  <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="admin-input">
                    {MODES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <select value={payType} onChange={(e) => setPayType(e.target.value)} className="admin-input">
                    {PTYPES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Reference (optional)"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="admin-input"
                  />
                  <button type="submit" className="admin-btn" disabled={payBusy}>
                    {payBusy ? 'Saving…' : 'Add Payment'}
                  </button>
                </form>
              </div>

              {booking.status === 'checked_in' && (
                <div className="detail-section">
                  <h4>Add Food / Service Charge</h4>
                  <form className="admin-inline-form" onSubmit={submitService}>
                    <input
                      type="text"
                      placeholder="Description"
                      value={svcDesc}
                      onChange={(e) => setSvcDesc(e.target.value)}
                      className="admin-input"
                      required
                    />
                    <select value={svcCat} onChange={(e) => setSvcCat(e.target.value)} className="admin-input">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={svcQty}
                      onChange={(e) => setSvcQty(e.target.value)}
                      className="admin-input"
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Rate"
                      value={svcRate}
                      onChange={(e) => setSvcRate(e.target.value)}
                      className="admin-input"
                      required
                    />
                    <button type="submit" className="admin-btn" disabled={svcBusy}>
                      {svcBusy ? 'Adding…' : 'Add Charge'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {payments.length > 0 && (
            <div className="detail-section">
              <h4>Payment History</h4>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Type</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td>{p.paymentCode}</td>
                        <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td>₹{p.amount}</td>
                        <td>{p.mode}</td>
                        <td>{p.paymentType}</td>
                        <td>{p.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {booking.services?.length > 0 && (
            <div className="detail-section">
              <h4>Food / Services</h4>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.services.map((s, i) => (
                      <tr key={i}>
                        <td>{s.description}</td>
                        <td>{s.category}</td>
                        <td>{s.quantity}</td>
                        <td>₹{s.rate}</td>
                        <td>₹{s.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showInvoice && booking && (
          <InvoiceModal
            booking={booking}
            billing={billing}
            payments={payments}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </div>
    </div>
  );
}
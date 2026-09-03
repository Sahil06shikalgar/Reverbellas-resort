import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getBookings, getBookingById } from '../services/bookingService';
import { addPayment, getBookingPayments } from '../services/paymentService';
import { gstTaxLabel } from '../utils/billingLabels';

const MODES = ['Cash', 'UPI', 'Google Pay', 'PhonePe', 'Card', 'Bank Transfer', 'Other'];
const PTYPES = ['Advance', 'Partial', 'Final', 'Refund', 'Other'];

const STATUS_LABEL = {
  inquiry: 'Inquiry',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const REF_LABEL = {
  UPI: 'UPI / Transaction Reference',
  Card: 'Reference / Transaction ID',
  'Bank Transfer': 'Transaction / Bank Reference',
  Cash: 'Reference (optional)',
  Other: 'Reference / Transaction ID (optional)',
};

const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function Payments() {
  const location = useLocation();
  const navigate = useNavigate();
  const deepLinkId = new URLSearchParams(location.search).get('booking');

  const [booking, setBooking] = useState(null);
  const [billing, setBilling] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(Boolean(deepLinkId));
  const [loadError, setLoadError] = useState('');

  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef('');

  const [mode, setMode] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Partial');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const balance = billing?.balance ?? 0;
  const paidComplete = booking && balance <= 0;

  const loadBooking = async (id) => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    setBooking(null);
    setBilling(null);
    setPayments([]);
    try {
      const [bResp, pResp] = await Promise.all([
        getBookingById(id),
        getBookingPayments(id),
      ]);
      setBooking(bResp.data.booking);
      setBilling(bResp.data.billing || null);
      setPayments(pResp.data || []);
      setAmount('');
      setPaymentType('Partial');
      setReference('');
      setNotes('');
      setMode('Cash');
    } catch (e) {
      setLoadError(e.message || 'Could not load booking.');
      toast.error(e.message || 'Could not load booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deepLinkId) {
      loadBooking(deepLinkId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId]);

  const search = async () => {
    const term = searchRef.current.trim();
    if (!term) {
      toast.error('Enter a booking ID, customer name or mobile number to search.');
      return;
    }
    setSearching(true);
    try {
      const r = await getBookings({ search: term });
      const list = r.data || [];
      setResults(list);
      if (list.length === 1) {
        await loadBooking(list[0]._id);
        setResults([]);
      }
    } catch (e) {
      toast.error(e.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const clearSelection = () => {
    setBooking(null);
    setBilling(null);
    setPayments([]);
    setResults([]);
    setLoadError('');
    navigate('/admin/payments', { replace: true });
  };

  const numAmount = Number(amount);
  const pending = balance;
  const payNow = Number.isFinite(numAmount) && numAmount > 0 ? numAmount : 0;
  const afterThis = Math.max(0, pending - payNow);

  const isFirstPayment = payments.length === 0;
  const suggestedType = useMemo(() => {
    if (!booking) return 'Partial';
    if (isFirstPayment) return 'Advance';
    if (Number.isFinite(numAmount) && numAmount > 0 && numAmount >= balance) return 'Final';
    return 'Partial';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numAmount, balance, isFirstPayment, booking]);

  useEffect(() => {
    setPaymentType(suggestedType);
  }, [suggestedType]);

  const quickFill = (pct) => {
    if (balance <= 0) return;
    const val = Math.round((balance * pct) / 100);
    setAmount(String(val));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error('Amount must be greater than 0.');
      return;
    }
    if (numAmount > balance) {
      toast.error(`Payment cannot exceed the pending amount of ${inr(balance)}.`);
      return;
    }
    if (!mode) {
      toast.error('Please select a payment mode.');
      return;
    }

    setSaving(true);
    try {
      const resp = await addPayment({
        bookingId: booking._id,
        amount: numAmount,
        mode,
        paymentType,
        reference,
        notes,
      });
      if (resp && resp.success) {
        navigate(`/admin/payment-success?booking=${booking._id}`, {
          state: {
            amount: numAmount,
            mode,
            paymentType,
            billing: resp.data?.billing,
          },
        });
      } else {
        toast.error(resp?.message || 'Payment could not be recorded.');
        setSaving(false);
      }
    } catch (err) {
      toast.error(err.message || 'Payment could not be recorded.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-head">
          <div>
            <h1>Billing &amp; Payment</h1>
            <p className="admin-sub">Review the bill and record a payment.</p>
          </div>
        </div>
        <div className="admin-loading">Loading billing details…</div>
      </div>
    );
  }

  if (!booking && !loadError && deepLinkId) {
    return (
      <div className="admin-page">
        <div className="admin-page-head">
          <div>
            <h1>Billing &amp; Payment</h1>
          </div>
        </div>
        <div className="admin-empty">Booking not found.</div>
        <button type="button" className="admin-btn ghost" onClick={clearSelection}>
          Back to Payments
        </button>
      </div>
    );
  }

  const customer = booking?.customer || {};
  const property = booking?.property || {};
  const billMissing = booking && !billing;

  return (
    <div className="admin-page bp-page">
      <div className="admin-page-head">
        <div>
          <h1>Billing &amp; Payment</h1>
          <p className="admin-sub">
            {booking
              ? `Review ${booking.bookingCode || 'the bill'} and record payment.`
              : 'Search for a booking to review and record its payment.'}
          </p>
        </div>
      </div>

      {billMissing && (
        <div className="admin-error">Billing details could not be loaded. Totals are not shown.</div>
      )}

      {!booking ? (
        <>
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search booking ID, customer name or mobile…"
              ref={searchRef}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              className="admin-input"
            />
            <button type="button" className="admin-btn" onClick={search} disabled={searching}>
              {searching ? 'Searching…' : 'Search Booking'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="detail-notes" style={{ marginBottom: 16 }}>
              <strong>{results.length} bookings found.</strong> Select one:
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {results.map((b) => (
                  <button
                    key={b._id}
                    type="button"
                    className="admin-btn ghost"
                    style={{ textAlign: 'left', textTransform: 'none', letterSpacing: 0 }}
                    onClick={() => loadBooking(b._id)}
                  >
                    {b.bookingCode} — {b.customer?.name || 'Customer'} · {b.property?.name || 'Property'} · {STATUS_LABEL[b.status] || b.status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && (
            <div className="admin-empty">
              Search for a booking to view its billing summary and record payments.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bp-card">
            {/* LEFT — Billing summary */}
            <aside className="bp-summary">
              <div className="bp-summary-brand">
                <span className="bp-summary-name">Riverbells Resort</span>
                <span className="bp-summary-kicker">Booking Summary</span>
              </div>

              <dl className="bp-booking">
                <div className="bp-row"><dt>Booking Number</dt><dd>{booking.bookingCode || '—'}</dd></div>
                <div className="bp-row"><dt>Customer Name</dt><dd>{customer.name || '—'}</dd></div>
                <div className="bp-row"><dt>Property / Stay</dt><dd>{property.name || '—'}</dd></div>
                <div className="bp-row"><dt>Check-In</dt><dd>{new Date(booking.checkIn).toLocaleDateString('en-IN')}</dd></div>
                <div className="bp-row"><dt>Check-Out</dt><dd>{new Date(booking.checkOut).toLocaleDateString('en-IN')}</dd></div>
                <div className="bp-row"><dt>Adults</dt><dd>{booking.adults}</dd></div>
                <div className="bp-row"><dt>Children</dt><dd>{booking.children || 0}</dd></div>
              </dl>

              <div className="bp-divider" />

              {!billMissing ? (
                <>
                  <dl className="bp-billing">
                    <div className="bp-row"><dt>Stay Amount</dt><dd>{inr(billing.baseAmount)}</dd></div>
                    <div className="bp-row"><dt>Discount</dt><dd>-{inr(billing.discountAmount)}</dd></div>
                    <div className="bp-row"><dt>{gstTaxLabel(billing)}</dt><dd>{inr(billing.tax)}</dd></div>
                    <div className="bp-row"><dt>Other Charges</dt><dd>{inr(billing.otherCharges)}</dd></div>
                    <div className="bp-row"><dt>Food / Service</dt><dd>{inr(billing.servicesTotal)}</dd></div>
                  </dl>

                  <div className="bp-total-row"><span>Grand Total</span><span>{inr(billing.grandTotal)}</span></div>
                  <div className="bp-total-row"><span>Already Paid</span><span>{inr(billing.totalPaid)}</span></div>
                  <div className="bp-total-row bp-pending"><span>Pending Amount</span><span>{inr(balance)}</span></div>

                  <div className="bp-status">
                    {paidComplete ? 'Fully Paid' : `${STATUS_LABEL[booking.status] || booking.status}`}
                  </div>
                </>
              ) : (
                <p className="bp-missing">Billing not available.</p>
              )}
            </aside>

            {/* RIGHT — Payment details */}
            <section className="bp-form">
              {paidComplete ? (
                <div className="bp-complete">
                  <div className="bp-complete-icon">✓</div>
                  <h2>Fully Paid</h2>
                  <p>This booking has no pending balance.</p>
                  <div className="bp-complete-actions">
                    <button type="button" className="bp-btn bp-btn-outline" onClick={() => window.print()}>
                      View Invoice
                    </button>
                    <button type="button" className="bp-btn" onClick={() => navigate('/admin')}>
                      Back to Booking
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bp-form-head">
                    <h2>Payment Details</h2>
                    <p>Complete or record payment for this booking.</p>
                  </div>

                  <form onSubmit={submit} noValidate>
                    <div className="bp-field">
                      <label className="bp-label">Payment Mode</label>
                      <div className="bp-modes">
                        {MODES.map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`bp-mode ${mode === m ? 'active' : ''}`}
                            onClick={() => { setMode(m); }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bp-field">
                      <label className="bp-label" htmlFor="bp-amount">Amount to Pay</label>
                      <div className="bp-amount-wrap">
                        <span className="bp-amount-currency">₹</span>
                        <input
                          id="bp-amount"
                          type="number"
                          min="1"
                          max={balance}
                          placeholder={String(balance || '')}
                          value={amount}
                          onChange={(e) => { setAmount(e.target.value); }}
                          className="bp-input"
                        />
                      </div>
                      <div className="bp-quick">
                        <button type="button" className="bp-quick-btn" onClick={() => quickFill(25)}>Pay 25%</button>
                        <button type="button" className="bp-quick-btn" onClick={() => quickFill(50)}>Pay 50%</button>
                        <button type="button" className="bp-quick-btn" onClick={() => quickFill(100)}>Pay Full Balance</button>
                      </div>
                    </div>

                    <div className="bp-field">
                      <label className="bp-label" htmlFor="bp-type">Payment Type</label>
                      <select id="bp-type" value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="bp-input">
                        {PTYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="bp-field">
                      <label className="bp-label" htmlFor="bp-ref">{REF_LABEL[mode] || 'Reference / Transaction ID'}</label>
                      <input
                        id="bp-ref"
                        type="text"
                        placeholder={mode === 'Cash' ? 'Optional' : 'Transaction / reference ID'}
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="bp-input"
                      />
                    </div>

                    <div className="bp-field">
                      <label className="bp-label" htmlFor="bp-notes">Notes</label>
                      <textarea
                        id="bp-notes"
                        rows="2"
                        placeholder="Any additional notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bp-input"
                      />
                    </div>

                    <div className="bp-preview">
                      <div className="bp-preview-row"><span>Total Pending</span><span>{inr(pending)}</span></div>
                      <div className="bp-preview-row"><span>Payment Now</span><span>{inr(payNow)}</span></div>
                      <div className="bp-preview-row bp-preview-after"><span>Balance After Payment</span><span>{inr(afterThis)}</span></div>
                    </div>

                    <button type="submit" className="bp-cta" disabled={saving}>
                      {saving ? 'Recording Payment…' : `Record Payment — ${inr(payNow || balance)}`}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>

          {/* Payment History */}
          <section className="bp-history">
            <h3 className="payments-card-title">Payment History</h3>
            {payments.length === 0 ? (
              <p className="muted">No payments recorded for this booking yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Payment ID</th>
                      <th>Type</th>
                      <th>Mode</th>
                      <th>Reference</th>
                      <th className="right">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td>{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td><strong>{p.paymentCode}</strong></td>
                        <td>{p.paymentType}</td>
                        <td>{p.mode}</td>
                        <td>{p.reference || '—'}</td>
                        <td className="right">{inr(p.amount)}</td>
                        <td>{p.status === 'cancelled' ? 'Cancelled' : 'Completed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div style={{ marginTop: 18 }}>
            <button type="button" className="admin-btn ghost" onClick={clearSelection}>
              ← Back to Payments
            </button>
          </div>
        </>
      )}
    </div>
  );
}

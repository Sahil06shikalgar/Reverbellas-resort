import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getBookingById } from '../services/bookingService';
import { getBookingPaymentList, addBookingPayment } from '../services/paymentService';

const METHODS = [
  { id: 'UPI', label: 'UPI' },
  { id: 'Google Pay', label: 'Google Pay' },
  { id: 'PhonePe', label: 'PhonePe' },
  { id: 'Card', label: 'Card' },
  { id: 'Bank Transfer', label: 'Bank Transfer' },
  { id: 'Cash', label: 'Cash' },
];

const CARD_TYPES = ['Visa', 'Mastercard', 'RuPay', 'Other'];
const PTYPES = ['Advance', 'Partial', 'Final', 'Refund', 'Other'];

const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [billing, setBilling] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [ref, setRef] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardType, setCardType] = useState('Visa');
  const [last4, setLast4] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState('Advance');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [b, p] = await Promise.all([
          getBookingById(bookingId),
          getBookingPaymentList(bookingId),
        ]);
        if (!active) return;
        setBooking(b.data.booking);
        setBilling(b.data.billing);
        setPayments(p.data || []);
      } catch (e) {
        if (active) {
          setError(e.message || 'Could not load this booking.');
          toast.error(e.message || 'Could not load this booking.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [bookingId]);

  const balance = billing?.balance ?? 0;
  const isFullyPaid =
    billing &&
    Number(billing.grandTotal) > 0 &&
    Number(billing.balance) === 0;
  const nights = booking?.pricing?.nights || 1;

  useEffect(() => {
    if (balance > 0) setAmount((a) => (a === '' ? String(balance) : a));
  }, [balance]);

  const userAmount = Number(amount);
  const isFirst = payments.length === 0;

  const suggestedType = isFirst
    ? 'Advance'
    : Number.isFinite(userAmount) && userAmount >= balance && balance > 0
    ? 'Final'
    : 'Partial';

  useEffect(() => {
    setPaymentType(suggestedType);
  }, [suggestedType]);

  const fillFull = () => {
    setAmount(String(balance));
  };

  const needsRef = method !== 'Cash';
  const isUpiLike = method === 'UPI' || method === 'Google Pay' || method === 'PhonePe';
  const isCard = method === 'Card';
  const isBank = method === 'Bank Transfer';

  const submit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    if (!Number.isFinite(userAmount) || userAmount <= 0) {
      toast.error('Enter a payment amount greater than 0.');
      return;
    }
    if (userAmount > balance) {
      toast.error(`Payment amount cannot exceed the pending balance of ${inr(balance)}.`);
      return;
    }
    if (needsRef && !String(ref || '').trim()) {
      toast.error('Please enter the transaction / reference ID.');
      return;
    }

    let reference = (ref || '').trim();
    let noteText = notes;
    if (isCard) {
      reference = (ref || '').trim() || (last4 && last4.trim() ? `card-${last4.trim()}` : '');
      const cardNote = `${cardType || 'Card'}${last4 && last4.trim() ? ` ending ${last4.trim()}` : ''}`;
      noteText = [cardNote, notes].filter(Boolean).join(' · ');
    } else if (isBank) {
      noteText = [bankRef && bankRef.trim() ? `Bank: ${bankRef.trim()}` : '', notes].filter(Boolean).join(' · ');
    }

    setSaving(true);
    setError('');

    try {
      const resp = await addBookingPayment(bookingId, {
        amount: userAmount,
        mode: method,
        paymentType,
        paymentDate: new Date().toISOString().slice(0, 10),
        reference,
        notes: noteText,
      });
      if (resp && resp.success) {
        toast.success('Payment recorded successfully.');
        navigate(`/payment-success?booking=${bookingId}`);
      } else {
        toast.error(resp?.message || 'Payment could not be recorded.');
      }
    } catch (err) {
      toast.error(err.message || 'Payment could not be recorded.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="guest-pay-page">
        <Navbar />
        <section className="section">
          <div className="container guest-pay-loading">Loading your booking…</div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="guest-pay-page">
        <Navbar />
        <section className="section">
          <div className="container guest-pay-loading">
            {error || 'Booking not found.'}
            <div style={{ marginTop: 16 }}>
              <Link className="btn btn-light" to="/">Back to website</Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="guest-pay-page">
        <Navbar />
        <section className="section">
          <div className="container guest-pay-loading">
            {'Unable to load billing details.'}
            <div style={{ marginTop: 16 }}>
              <Link className="btn btn-light" to="/book-stay">Back to Booking</Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const customer = booking.customer || {};
  const property = booking.property || {};

  return (
    <div className="guest-pay-page">
      <div className="guest-print-invoice">
        <div className="invoice">
            <div className="invoice-head">
              <div>
                <h2>Riverbells Resort</h2>
                <p>Khutghar, Shahapur, Maharashtra – 421601</p>
                <p>+91 74997 88935</p>
              </div>
              <div className="invoice-meta">
                <p><strong>Booking: {booking.bookingCode}</strong></p>
                <p>Booking ID: {booking._id}</p>
                <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            <div className="invoice-body">
              <div className="invoice-customer">
                <h4>Billed To</h4>
                <p><strong>{customer.name || '—'}</strong></p>
                <p>Mobile: {customer.mobile || '—'}</p>
                <p>Email: {customer.email || '—'}</p>
                <p>City: {customer.city || '—'}</p>
              </div>
              <div className="invoice-stay">
                <h4>Stay Details</h4>
                <p><strong>{property.name || '—'}</strong></p>
                <p>Check-in: {new Date(booking.checkIn).toLocaleDateString('en-IN')}</p>
                <p>Check-out: {new Date(booking.checkOut).toLocaleDateString('en-IN')}</p>
                <p>Guests: {booking.adults} adults, {booking.children} children</p>
                <p>Nights: {nights}</p>
              </div>
            </div>
            <div className="invoice-summary">
              <div className="invoice-line"><span>Grand Total</span><span>{inr(billing?.grandTotal)}</span></div>
              <div className="invoice-line"><span>Total Paid</span><span>{inr(billing?.totalPaid)}</span></div>
              <div className="invoice-line balance"><span>Balance Due</span><span>{inr(balance)}</span></div>
            </div>
          </div>
        </div>

      <Navbar />
      <section className="section booking-form-section guest-pay-section pp-section">
        <div className="container">
          <div className="guest-pay-head">
            <span className="eyebrow">Payment</span>
            <h2>{isFullyPaid ? 'Fully Paid' : 'Payment Details'}</h2>
            <p>
              {isFullyPaid
                ? 'This booking has no pending balance and is fully settled.'
                : `Choose your payment method and complete the payment. Pending: ${inr(balance)}.`}
            </p>
          </div>

          {isFullyPaid ? (
            <div className="pp-complete">
              <div className="pp-complete-icon">✓</div>
              <h3>Fully Paid</h3>
              <p className="muted">This booking has no pending balance.</p>
              <div className="guest-pay-cta-row">
                <button type="button" className="btn btn-light" onClick={() => window.print()}>
                  View Invoice
                </button>
                <Link className="btn btn-fill" to="/book-stay">Back to Booking</Link>
              </div>
            </div>
          ) : (
            <div className="pp-grid">
              {/* LEFT — billing summary */}
              <aside className="pp-panel pp-summary">
                <span className="pp-kicker">Booking Summary</span>
                <dl className="pp-summary-list">
                  <div><dt>Booking Number</dt><dd>{booking.bookingCode}</dd></div>
                  <div><dt>Customer Name</dt><dd>{customer.name || '—'}</dd></div>
                  <div><dt>Property</dt><dd>{property.name || '—'}</dd></div>
                </dl>
                <div className="pp-divider" />
                <div className="pp-totals">
                  <div className="pp-total"><span>Grand Total</span><strong>{inr(billing?.grandTotal)}</strong></div>
                  <div className="pp-total"><span>Already Paid</span><strong>{inr(billing?.totalPaid)}</strong></div>
                  <div className="pp-total pp-pending"><span>Pending Amount</span><strong>{inr(balance)}</strong></div>
                </div>
              </aside>

              {/* RIGHT — payment method + form */}
              <div className="pp-panel pp-form">
                <div className="pp-form-head">
                  <h3>Payment Details</h3>
                  <p>Select a payment method and enter the details.</p>
                </div>

                <form onSubmit={submit} noValidate>
                  <div className="pp-field">
                    <label className="pp-label">Payment Method</label>
                    <div className="pp-methods">
                      {METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`pp-method ${method === m.id ? 'active' : ''}`}
                          onClick={() => {
                            setMethod(m.id);
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pp-field">
                    <label className="pp-label" htmlFor="pp-amount">Amount to Pay</label>
                    <div className="pp-amount-wrap">
                      <span className="pp-currency">₹</span>
                      <input
                        id="pp-amount"
                        type="number"
                        min="1"
                        max={balance}
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); }}
                        className="pp-input"
                      />
                    </div>
                    <button type="button" className="pp-full" onClick={fillFull}>
                      Pay Full Balance ({inr(balance)})
                    </button>
                  </div>

                  <div className="pp-field">
                    <label className="pp-label" htmlFor="pp-type">Payment Type</label>
                    <select id="pp-type" className="pp-input" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                      {PTYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  {isUpiLike && (
                    <>
                      <div className="pp-field">
                        <label className="pp-label" htmlFor="pp-upiid">
                          {method === 'Google Pay' ? 'Google Pay / UPI ID' : method === 'PhonePe' ? 'PhonePe / UPI ID' : 'UPI ID'}
                        </label>
                        <input id="pp-upiid" type="text" className="pp-input" placeholder="example@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                      </div>
                      <div className="pp-field">
                        <label className="pp-label" htmlFor="pp-ref">{method === 'UPI' ? 'Transaction Reference' : 'Transaction ID / UTR'}</label>
                        <input id="pp-ref" type="text" className="pp-input" placeholder="Transaction ID / UTR" value={ref} onChange={(e) => setRef(e.target.value)} />
                      </div>
                    </>
                  )}

                  {isCard && (
                    <>
                      <div className="pp-field">
                        <label className="pp-label" htmlFor="pp-cardtype">Card Type</label>
                        <select id="pp-cardtype" className="pp-input" value={cardType} onChange={(e) => setCardType(e.target.value)}>
                          {CARD_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="pp-field">
                        <label className="pp-label" htmlFor="pp-ref">Transaction / Reference ID</label>
                        <input id="pp-ref" type="text" className="pp-input" placeholder="Transaction / reference ID" value={ref} onChange={(e) => setRef(e.target.value)} />
                      </div>
                      <div className="pp-field">
                        <label className="pp-label" htmlFor="pp-last4">Last 4 digits (optional)</label>
                        <input id="pp-last4" type="text" className="pp-input" maxLength="4" placeholder="••••" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} />
                      </div>
                    </>
                  )}

                  {isBank && (
                    <>
                      <div className="pp-field">
                        <label className="pp-label" htmlFor="pp-bankref">Bank / Payment Reference</label>
                        <input id="pp-bankref" type="text" className="pp-input" placeholder="Bank reference" value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
                      </div>
                      <div className="pp-field">
                        <label className="pp-label" htmlFor="pp-ref">UTR / Transaction ID</label>
                        <input id="pp-ref" type="text" className="pp-input" placeholder="UTR / transaction ID" value={ref} onChange={(e) => setRef(e.target.value)} />
                      </div>
                    </>
                  )}

                  {method === 'Cash' && (
                    <p className="pp-note">No transaction ID required for cash payments.</p>
                  )}

                  <div className="pp-field">
                    <label className="pp-label" htmlFor="pp-notes">Notes</label>
                    <textarea id="pp-notes" rows="2" className="pp-input" placeholder="Any additional notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>

                  <button type="submit" className="pp-cta" disabled={saving}>
                    {saving ? 'Recording Payment…' : `Record Payment — ${inr(userAmount || balance)}`}
                  </button>
                </form>
              </div>
            </div>
          )}

          {!isFullyPaid && payments.length > 0 && (
            <section className="guest-pay-card guest-pay-history pp-history">
              <h4>Payment History</h4>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Mode</th>
                      <th>Reference</th>
                      <th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td><strong>{p.paymentCode}</strong></td>
                        <td>{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>{p.paymentType}</td>
                        <td>{p.mode}</td>
                        <td>{p.reference || '—'}</td>
                        <td className="right">{inr(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

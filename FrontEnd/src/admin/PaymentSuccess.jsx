import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getBookingById } from '../services/bookingService';
import { getBookingPayments } from '../services/paymentService';

const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = new URLSearchParams(location.search).get('booking');

  const [booking, setBooking] = useState(null);
  const [billing, setBilling] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      setError('No booking referenced.');
      return;
    }
    let active = true;
    (async () => {
      try {
        const [b, p] = await Promise.all([
          getBookingById(bookingId),
          getBookingPayments(bookingId),
        ]);
        if (!active) return;
        setBooking(b.data.booking);
        setBilling(b.data.billing || null);
        setPayments(p.data || []);
      } catch (e) {
        if (active) {
          setError(e.message || 'Could not load booking.');
          toast.error(e.message || 'Could not load booking.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading payment confirmation…</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="admin-page">
        <div className="admin-page-head"><div><h1>Payment Confirmation</h1></div></div>
        <div className="admin-empty">{error || 'Booking not found.'}</div>
        <Link className="admin-btn ghost" to="/admin/payments">Back to Payments</Link>
      </div>
    );
  }

  const latest = payments[0];
  const balance = billing?.balance ?? 0;
  const fullyPaid = balance <= 0;
  const customer = booking.customer || {};

  return (
    <div className="admin-page">
      <div className="bp-success-card">
        <div className="bp-success-icon">{fullyPaid ? '✓' : '✓'}</div>
        <h1>{fullyPaid ? 'Fully Paid' : 'Payment Successful'}</h1>
        <p className="bp-success-sub">
          {fullyPaid
            ? 'This booking has been fully settled.'
            : `Payment recorded successfully for ${booking.bookingCode || 'this booking'}.`}
        </p>

        {billing && (
          <div className="bp-success-totals">
            <div className="bp-success-total"><span>Booking</span><strong>{booking.bookingCode}</strong></div>
            <div className="bp-success-total"><span>Customer</span><strong>{customer.name || '—'}</strong></div>
            {latest && (
              <div className="bp-success-total"><span>Payment Recorded</span><strong>{inr(latest.amount)}</strong></div>
            )}
            <div className="bp-success-total"><span>Already Paid</span><strong>{inr(billing.totalPaid)}</strong></div>
            <div className="bp-success-total"><span>Pending Amount</span><strong>{inr(balance)}</strong></div>
          </div>
        )}

        <div className="bp-success-actions">
          <button type="button" className="bp-btn bp-btn-outline" onClick={() => navigate(`/admin/payments?booking=${booking._id}`)}>
            View Booking
          </button>
          <Link className="bp-btn" to="/admin">Back to Bookings</Link>
        </div>
      </div>
    </div>
  );
}

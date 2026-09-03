import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getBookingById } from '../services/bookingService';

const WHATSAPP_NUMBER = '917499788935';

const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

function openWhatsApp(booking, billing) {
  const property = booking.property || {};
  const lines = [
    'Hello Riverbells Resort,',
    '',
    'Booking confirmed.',
    '',
    `Booking Number: ${booking.bookingCode}`,
    `Customer: ${booking.customer?.name || ''}`,
    `Property: ${property.name || ''}`,
    `Check-In: ${new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    `Check-Out: ${new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    `Guests: ${booking.adults} Adults, ${booking.children || 0} Children`,
    `Amount Paid: ${inr(billing?.totalPaid)}`,
    '',
    'Thank you.',
  ];
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = new URLSearchParams(location.search).get('booking');

  const [booking, setBooking] = useState(null);
  const [billing, setBilling] = useState(null);
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
        const b = await getBookingById(bookingId);
        if (!active) return;
        setBooking(b.data.booking);
        setBilling(b.data.billing || null);
      } catch (e) {
        if (active) setError(e.message || 'Could not load booking.');
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
      <div className="guest-pay-page">
        <Navbar />
        <section className="section">
          <div className="container guest-pay-loading">Loading payment confirmation…</div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!booking || !billing) {
    return (
      <div className="guest-pay-page">
        <Navbar />
        <section className="section">
          <div className="container guest-pay-loading">
            {error || booking ? 'Unable to load billing details.' : 'Booking not found.'}
            <div style={{ marginTop: 16 }}>
              <Link className="btn btn-light" to="/">Back to website</Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const customer = booking.customer || {};
  const balance = Number(billing.balance);
  const grandTotal = Number(billing.grandTotal);
  const fullyPaid = grandTotal > 0 && balance === 0;

  return (
    <div className="guest-pay-page">
      <Navbar />
      <section className="section booking-form-section guest-pay-section">
        <div className="container">
          <div className="guest-pay-head">
            <span className="eyebrow">Payment</span>
            <h2>{fullyPaid ? 'Payment Completed' : 'Payment Successful'}</h2>
            <p>
              {fullyPaid
                ? 'Thank you! This booking has been fully paid.'
                : 'Your payment was recorded successfully. A balance remains on this booking.'}
            </p>
          </div>

          <div className="guest-pay-success">
            <div className="guest-pay-success-icon">✓</div>
            <h3>{fullyPaid ? 'Fully Paid' : 'Payment Recorded Successfully'}</h3>
            <p className="muted">Booking {booking.bookingCode} · {customer.name || 'Customer'}</p>

            <div className="guest-pay-totals">
              <div className="guest-pay-row"><span>Grand Total</span><strong>{inr(billing.grandTotal)}</strong></div>
              <div className="guest-pay-row"><span>Already Paid</span><strong>{inr(billing.totalPaid)}</strong></div>
              <div className="guest-pay-row due"><span>Pending Amount</span><strong>{inr(balance)}</strong></div>
            </div>

            <div className="guest-pay-cta-row">
              <button type="button" className="btn btn-outline" onClick={() => openWhatsApp(booking, billing)}>
                <MessageCircle size={16} strokeWidth={1.8} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Send Booking Details on WhatsApp
              </button>
            </div>

            <div className="guest-pay-cta-row">
              {fullyPaid ? (
                <>
                  <button type="button" className="btn btn-light" onClick={() => window.print()}>
                    View Invoice
                  </button>
                  <Link className="btn btn-fill" to="/book-stay">Back to Booking</Link>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-fill" onClick={() => navigate(`/payments/${bookingId}`)}>
                    Make Another Payment ({inr(balance)})
                  </button>
                  <Link className="btn btn-light" to="/">Back to Website</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

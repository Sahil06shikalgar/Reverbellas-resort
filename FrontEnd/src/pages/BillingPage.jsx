import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getBookingById } from '../services/bookingService';
import { gstTaxLabel } from '../utils/billingLabels';

const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function BillingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const b = await getBookingById(bookingId);
        if (!active) return;
        setBooking(b.data.booking);
        setBilling(b.data.billing || null);
      } catch (e) {
        if (active) {
          setError(e.message || 'Unable to load billing details.');
          toast.error(e.message || 'Unable to load billing details.');
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

  if (loading) {
    return (
      <div className="guest-pay-page">
        <Navbar />
        <section className="section">
          <div className="container guest-pay-loading">Loading billing details…</div>
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
            {error || 'Unable to load billing details.'}
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
  const balance = billing?.balance ?? 0;

  return (
    <div className="guest-pay-page">
      <Navbar />
      <section className="section booking-form-section guest-pay-section">
        <div className="container">
          <div className="guest-pay-head">
            <span className="eyebrow">Billing</span>
            <h2>Review Your Billing</h2>
            <p>Review your booking details and total amount before proceeding to payment.</p>
          </div>

          <div className="guest-pay-banner">
            <div>
              <span className="guest-pay-banner-label">Booking</span>
              <strong className="guest-pay-banner-code">{booking.bookingCode}</strong>
              <span className="guest-pay-banner-status">
                {balance <= 0 ? 'PAID' : 'PARTIAL / DUE'}
              </span>
            </div>
            <div className="guest-pay-banner-total">
              <span>Pending</span>
              <strong>{inr(balance)}</strong>
            </div>
          </div>

          <div className="guest-pay-grid">
            <section className="guest-pay-card">
              <h4>Booking Details</h4>
              <div className="guest-pay-summary">
                <div className="guest-pay-row"><span>Booking Number</span><strong>{booking.bookingCode}</strong></div>
                <div className="guest-pay-row"><span>Customer Name</span><strong>{customer.name || '—'}</strong></div>
                <div className="guest-pay-row"><span>Mobile</span><strong>{customer.mobile || '—'}</strong></div>
                <div className="guest-pay-row"><span>Email</span><strong>{customer.email || '—'}</strong></div>
                <div className="guest-pay-row"><span>City</span><strong>{customer.city || '—'}</strong></div>
                <div className="guest-pay-row"><span>Property / Stay</span><strong>{property.name || '—'}</strong></div>
                <div className="guest-pay-row"><span>Check-in</span><strong>{new Date(booking.checkIn).toLocaleDateString('en-IN')}</strong></div>
                <div className="guest-pay-row"><span>Check-out</span><strong>{new Date(booking.checkOut).toLocaleDateString('en-IN')}</strong></div>
                <div className="guest-pay-row"><span>Adults</span><strong>{booking.adults}</strong></div>
                <div className="guest-pay-row"><span>Children</span><strong>{booking.children || 0}</strong></div>
              </div>
            </section>

            <section className="guest-pay-card">
              <h4>Amount Summary</h4>
              <div className="guest-pay-totals">
                <div className="guest-pay-row"><span>Stay Amount</span><strong>{inr(billing.baseAmount)}</strong></div>
                <div className="guest-pay-row"><span>Discount</span><strong>-{inr(billing.discountAmount)}</strong></div>
                <div className="guest-pay-row"><span>{gstTaxLabel(billing)}</span><strong>{inr(billing.tax)}</strong></div>
                <div className="guest-pay-row"><span>Other Charges</span><strong>{inr(billing.otherCharges)}</strong></div>
                <div className="guest-pay-row"><span>Food / Service Charges</span><strong>{inr(billing.servicesTotal)}</strong></div>
                <div className="guest-pay-row"><strong>Grand Total</strong><strong>{inr(billing.grandTotal)}</strong></div>
                <div className="guest-pay-row"><span>Already Paid</span><strong>{inr(billing.totalPaid)}</strong></div>
                <div className="guest-pay-row due"><span>Pending Amount</span><strong>{inr(balance)}</strong></div>
              </div>

              <div className="guest-pay-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-fill"
                  onClick={() => navigate(`/payments/${bookingId}`)}
                >
                  Proceed to Payment
                </button>
                <Link className="btn btn-light" to="/book-stay">Back to Booking</Link>
              </div>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

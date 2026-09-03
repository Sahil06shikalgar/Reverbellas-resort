export default function InvoiceModal({ booking, billing, payments, onClose }) {
  const customer = booking.customer || {};
  const property = booking.property || {};
  const nights = booking.pricing?.nights || 1;
  const invoiceNo = `INV-${booking.bookingCode?.replace('RB-', '') || booking._id}`;
  const invoiceDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '';

  const items = booking.services || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-actions no-print">
          <button type="button" className="admin-btn" onClick={() => window.print()}>
            Print Invoice
          </button>
          <button type="button" className="admin-btn ghost" onClick={() => window.print()}>
            Save as PDF
          </button>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="invoice">
          <div className="invoice-head">
            <div>
              <h2>Riverbells Resort</h2>
              <p>Khutghar, Shahapur, Maharashtra – 421601</p>
              <p>+91 74997 88935</p>
            </div>
            <div className="invoice-meta">
              <p><strong>Invoice {invoiceNo}</strong></p>
              <p>Booking: {booking.bookingCode}</p>
              <p>Date: {invoiceDate}</p>
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
              <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
              <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
              <p>Guests: {booking.adults} adults, {booking.children} children</p>
              <p>Nights: {nights}</p>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room stay ({property.name}) — {nights} night{nights > 1 ? 's' : ''}</td>
                <td>{nights}</td>
                <td>₹{booking.pricing?.ratePerNight || 0}</td>
                <td className="right">₹{billing?.baseAmount || 0}</td>
              </tr>
              {items.map((s, i) => (
                <tr key={i}>
                  <td>{s.description} <span className="invoice-cat">({s.category})</span></td>
                  <td>{s.quantity}</td>
                  <td>₹{s.rate}</td>
                  <td className="right">₹{s.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-summary">
            <div className="invoice-line"><span>Stay Charges</span><span>₹{billing?.baseAmount || 0}</span></div>
            <div className="invoice-line"><span>Discount</span><span>-₹{billing?.discountAmount || 0}</span></div>
            <div className="invoice-line"><span>Tax</span><span>₹{billing?.tax || 0}</span></div>
            <div className="invoice-line"><span>Other Charges</span><span>₹{billing?.otherCharges || 0}</span></div>
            <div className="invoice-line"><span>Food / Service Charges</span><span>₹{billing?.servicesTotal || 0}</span></div>
            <div className="invoice-line grand"><span>Grand Total</span><span>₹{billing?.grandTotal || 0}</span></div>
            <div className="invoice-line"><span>Total Paid</span><span>₹{billing?.totalPaid || 0}</span></div>
            <div className="invoice-line balance"><span>Balance Due</span><span>₹{billing?.balance || 0}</span></div>
          </div>

          {payments.length > 0 && (
            <div className="invoice-payments">
              <h4>Payment History</h4>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Type</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td>{p.paymentCode}</td>
                      <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td>{p.mode}</td>
                      <td>{p.paymentType}</td>
                      <td className="right">₹{p.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="invoice-foot">
            <p>Thank you for staying with us.</p>
            <p className="muted">This is a computer-generated invoice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
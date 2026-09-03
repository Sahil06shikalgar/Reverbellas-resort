import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createBooking } from '../services/bookingService';
import { getProperties } from '../services/propertyService';

const SOURCES = ['Direct', 'Website', 'Phone', 'WhatsApp', 'Walk-in', 'Google', 'Referral', 'Other'];
const KYC_TYPES = ['Aadhaar', 'PAN', 'Driving Licence', 'Passport', 'Other'];

const empty = {
  name: '',
  mobile: '',
  email: '',
  city: '',
  kycType: '',
  kycNumber: '',
  propertyId: '',
  checkIn: '',
  checkOut: '',
  adults: 1,
  children: 0,
  source: 'Direct',
  ratePerNight: '',
  discountType: 'fixed',
  discountValue: 0,
  taxAmount: 0,
  otherCharges: 0,
  notes: '',
};

export default function NewBookingForm({ properties, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [allProperties, setAllProperties] = useState(properties || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!properties || properties.length === 0) {
      getProperties().then((r) => setAllProperties(r.data || [])).catch(() => {});
    }
  }, [properties]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const onPropertyChange = (e) => {
    const id = e.target.value;
    const prop = allProperties.find((p) => p._id === id);
    setForm((f) => ({
      ...f,
      propertyId: id,
      ratePerNight: prop ? (prop.standardWeekdayRate ?? 0) : '',
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      toast.error('Check-out date must be after check-in date.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customer: {
          name: form.name,
          mobile: form.mobile,
          email: form.email,
          city: form.city,
          kycType: form.kycType,
          kycNumber: form.kycNumber,
        },
        propertyId: form.propertyId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: Number(form.adults),
        children: Number(form.children),
        source: form.source,
        status: 'inquiry',
        pricing: {
          ratePerNight: Number(form.ratePerNight || 0),
          discountType: form.discountType,
          discountValue: Number(form.discountValue || 0),
          taxAmount: Number(form.taxAmount || 0),
          otherCharges: Number(form.otherCharges || 0),
        },
        notes: form.notes,
      };
      await createBooking(payload);
      toast.success('Booking created.');
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Could not create booking.');
      setSaving(false);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>New Booking</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="admin-form" onSubmit={submit}>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Full Name *</label>
              <input className="admin-input" value={form.name} onChange={update('name')} required />
            </div>
            <div className="admin-field">
              <label>Mobile *</label>
              <input className="admin-input" value={form.mobile} onChange={update('mobile')} required />
            </div>
            <div className="admin-field">
              <label>Email</label>
              <input type="email" className="admin-input" value={form.email} onChange={update('email')} />
            </div>
            <div className="admin-field">
              <label>City</label>
              <input className="admin-input" value={form.city} onChange={update('city')} />
            </div>
            <div className="admin-field">
              <label>KYC Type</label>
              <select className="admin-input" value={form.kycType} onChange={update('kycType')}>
                <option value="">None</option>
                {KYC_TYPES.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label>KYC Number</label>
              <input className="admin-input" value={form.kycNumber} onChange={update('kycNumber')} />
            </div>
            <div className="admin-field">
              <label>Property / Stay Type *</label>
              <select className="admin-input" value={form.propertyId} onChange={onPropertyChange} required>
                <option value="">Select</option>
                {allProperties.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Check-in *</label>
              <input type="date" min={todayIso} className="admin-input" value={form.checkIn} onChange={update('checkIn')} required />
            </div>
            <div className="admin-field">
              <label>Check-out *</label>
              <input type="date" min={form.checkIn || todayIso} className="admin-input" value={form.checkOut} onChange={update('checkOut')} required />
            </div>
            <div className="admin-field">
              <label>Adults *</label>
              <input type="number" min="1" className="admin-input" value={form.adults} onChange={update('adults')} required />
            </div>
            <div className="admin-field">
              <label>Children</label>
              <input type="number" min="0" className="admin-input" value={form.children} onChange={update('children')} />
            </div>
            <div className="admin-field">
              <label>Source</label>
              <select className="admin-input" value={form.source} onChange={update('source')}>
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label>Rate / Night (₹)</label>
              <input type="number" min="0" className="admin-input" value={form.ratePerNight} onChange={update('ratePerNight')} />
            </div>
            <div className="admin-field">
              <label>Discount Type</label>
              <select className="admin-input" value={form.discountType} onChange={update('discountType')}>
                <option value="fixed">Fixed (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Discount Value</label>
              <input type="number" min="0" className="admin-input" value={form.discountValue} onChange={update('discountValue')} />
            </div>
            <div className="admin-field">
              <label>GST Tax (₹)</label>
              <input type="number" min="0" className="admin-input" value={form.taxAmount} onChange={update('taxAmount')} />
            </div>
            <div className="admin-field">
              <label>Other Charges (₹)</label>
              <input type="number" min="0" className="admin-input" value={form.otherCharges} onChange={update('otherCharges')} />
            </div>
          </div>

          <div className="admin-field">
            <label>Notes</label>
            <textarea className="admin-input" rows="2" value={form.notes} onChange={update('notes')} />
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
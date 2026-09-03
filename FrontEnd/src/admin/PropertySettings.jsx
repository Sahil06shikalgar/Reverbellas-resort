import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getProperties, createProperty, updateProperty } from '../services/propertyService';

const TYPES = ['villa', 'room', 'lawn', 'tent', 'other'];

const empty = {
  propertyCode: '',
  name: '',
  type: 'room',
  maxAdults: 1,
  maxChildren: 0,
  maxGuests: 1,
  standardWeekdayRate: 0,
  standardWeekendRate: 0,
  description: '',
  amenities: [],
  images: [],
  bookableFromWebsite: true,
  active: true,
  parentProperty: '',
};

export default function PropertySettings() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await getProperties();
      setProperties(r.data || []);
    } catch (e) {
      toast.error(e.message || 'Could not load properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const villas = properties.filter((p) => p.type === 'villa');

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Property Settings</h1>
          <p className="admin-sub">Master list of rooms, villas, lawns and tents</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => setShowNew(true)}>+ Add Property</button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading properties…</div>
      ) : properties.length === 0 ? (
        <div className="admin-empty">No properties found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Parent</th>
                <th>Max A / C / G</th>
                <th>Weekday ₹</th>
                <th>Weekend ₹</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p._id}>
                  <td>{p.propertyCode}</td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.type}</td>
                  <td>{p.parentProperty?.name || '—'}</td>
                  <td>{p.maxAdults} / {p.maxChildren} / {p.maxGuests}</td>
                  <td>₹{p.standardWeekdayRate}</td>
                  <td>₹{p.standardWeekendRate}</td>
                  <td>{p.active ? <span className="ok-badge">Active</span> : <span className="low-badge">Inactive</span>}</td>
                  <td>
                    <button type="button" className="admin-btn tiny" onClick={() => setEditing(p)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PropertyForm
          title={`Edit ${editing.name}`}
          initial={editing}
          villas={villas}
          onClose={() => setEditing(null)}
          onSubmit={async (form) => {
            try {
              await updateProperty(editing._id, form);
              setEditing(null);
              toast.success('Property updated.');
              await load();
            } catch (e) {
              toast.error(e.message || 'Could not update property.');
              throw e;
            }
          }}
        />
      )}

      {showNew && (
        <PropertyForm
          title="Add Property"
          villas={villas}
          onClose={() => setShowNew(false)}
          onSubmit={async (form) => {
            try {
              await createProperty(form);
              setShowNew(false);
              toast.success('Property created.');
              await load();
            } catch (e) {
              toast.error(e.message || 'Could not create property.');
              throw e;
            }
          }}
        />
      )}
    </div>
  );
}

function PropertyForm({ title, initial, villas, onClose, onSubmit }) {
  const [form, setForm] = useState(
    initial
      ? {
          propertyCode: initial.propertyCode,
          name: initial.name,
          type: initial.type,
          maxAdults: initial.maxAdults,
          maxChildren: initial.maxChildren,
          maxGuests: initial.maxGuests,
          standardWeekdayRate: initial.standardWeekdayRate,
          standardWeekendRate: initial.standardWeekendRate,
          description: initial.description || '',
          amenities: Array.isArray(initial.amenities) ? initial.amenities : [],
          images: Array.isArray(initial.images) ? initial.images : [],
          bookableFromWebsite:
            typeof initial.bookableFromWebsite === 'undefined'
              ? true
              : initial.bookableFromWebsite,
          active: initial.active,
          parentProperty: initial.parentProperty?._id || initial.parentProperty || '',
        }
      : empty
  );
  const [busy, setBusy] = useState(false);

  const update = (f) => (e) => {
    const v = e.target.value;
    setForm((x) => ({ ...x, [f]: v }));
    if (f === 'type' && v !== 'room' && v !== 'tent') {
      setForm((x) => ({ ...x, parentProperty: '' }));
    }
  };

  const updNum = (f) => (e) => setForm((x) => ({ ...x, [f]: Number(e.target.value) }));

  const updList = (f) => (e) =>
    setForm((x) => ({
      ...x,
      [f]: e.target.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form };
    if (!payload.parentProperty) payload.parentProperty = null;
    try {
      await onSubmit(payload);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="admin-form" onSubmit={submit}>
          <div className="admin-form-grid two-col">
            <div className="admin-field">
              <label>Property Code *</label>
              <input className="admin-input" value={form.propertyCode} onChange={update('propertyCode')} required />
            </div>
            <div className="admin-field">
              <label>Name *</label>
              <input className="admin-input" value={form.name} onChange={update('name')} required />
            </div>
            <div className="admin-field">
              <label>Type</label>
              <select className="admin-input" value={form.type} onChange={update('type')}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label>Parent Property</label>
              <select className="admin-input" value={form.parentProperty} onChange={update('parentProperty')}>
                <option value="">None (top-level)</option>
                {villas.map((v) => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Max Adults</label>
              <input type="number" min="0" className="admin-input" value={form.maxAdults} onChange={updNum('maxAdults')} />
            </div>
            <div className="admin-field">
              <label>Max Children</label>
              <input type="number" min="0" className="admin-input" value={form.maxChildren} onChange={updNum('maxChildren')} />
            </div>
            <div className="admin-field">
              <label>Max Guests</label>
              <input type="number" min="1" className="admin-input" value={form.maxGuests} onChange={updNum('maxGuests')} />
            </div>
            <div className="admin-field">
              <label>Weekday Rate (₹)</label>
              <input type="number" min="0" className="admin-input" value={form.standardWeekdayRate} onChange={updNum('standardWeekdayRate')} />
            </div>
            <div className="admin-field">
              <label>Weekend Rate (₹)</label>
              <input type="number" min="0" className="admin-input" value={form.standardWeekendRate} onChange={updNum('standardWeekendRate')} />
            </div>
            <div className="admin-field">
              <label>Active</label>
              <select className="admin-input" value={form.active ? 'true' : 'false'} onChange={(e) => setForm((x) => ({ ...x, active: e.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Bookable From Website</label>
              <select className="admin-input" value={form.bookableFromWebsite ? 'true' : 'false'} onChange={(e) => setForm((x) => ({ ...x, bookableFromWebsite: e.target.value === 'true' }))}>
                <option value="true">Yes</option>
                <option value="false">No (excluded from search)</option>
              </select>
            </div>
            <div className="admin-field admin-field-wide">
              <label>Description</label>
              <textarea className="admin-input" rows="3" value={form.description} onChange={update('description')} placeholder="Short guest-facing description shown in search results" />
            </div>
            <div className="admin-field admin-field-wide">
              <label>Amenities (comma-separated)</label>
              <input type="text" className="admin-input" value={form.amenities.join(', ')} onChange={updList('amenities')} placeholder="King Bed, AC, Pool Access, Balcony" />
            </div>
            <div className="admin-field admin-field-wide">
              <label>Images (file keys, comma-separated)</label>
              <input type="text" className="admin-input" value={form.images.join(', ')} onChange={updList('images')} placeholder="e.g. fullvilla, fullvilla-2, pool" />
              <small className="admin-hint">Resolved against FrontEnd/src/assets/media/<em>filename</em>.jpg</small>
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="admin-btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
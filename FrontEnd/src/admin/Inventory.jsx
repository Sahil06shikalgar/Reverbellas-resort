import { useEffect, useState } from 'react';
import {
  getInventory,
  createInventory,
  updateInventory,
  stockIn,
  stockOut,
} from '../services/inventoryService';

const empty = {
  itemCode: '',
  name: '',
  category: 'housekeeping',
  unit: 'pcs',
  currentStock: 0,
  minimumStock: 0,
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modal, setModal] = useState(null); // {type:'new'|'in'|'out'|'edit', item}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await getInventory({ search });
      setItems(r.data || []);
    } catch (e) {
      setError(e.message || 'Could not load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lowItems = items.filter((i) => i.currentStock <= i.minimumStock);

  const createNew = async (form) => {
    try {
      await createInventory(form);
      setNotice('Inventory item created.');
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e.message || 'Could not create item.');
      throw e;
    }
  };

  const editItem = async (id, form) => {
    try {
      await updateInventory(id, form);
      setNotice('Item updated.');
      setModal(null);
      await load();
    } catch (e) {
      setError(e.message || 'Could not update item.');
      throw e;
    }
  };

  const runStock = async (type, id, form) => {
    try {
      if (type === 'in') await stockIn(id, form);
      else await stockOut(id, form);
      setNotice(type === 'in' ? 'Stock added.' : 'Stock removed.');
      setModal(null);
      await load();
    } catch (e) {
      setError(e.message || 'Stock transaction failed.');
      throw e;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Inventory</h1>
          <p className="admin-sub">Track stock and low-stock alerts</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => setShowModal(true)}>+ New Item</button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search item, code, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          className="admin-input"
        />
        <button type="button" className="admin-btn" onClick={load}>Search</button>
      </div>

      {lowItems.length > 0 && (
        <div className="admin-lowstock">
          <strong>Low-stock alert:</strong> {lowItems.length} item(s) at or below minimum stock.
        </div>
      )}

      {notice && <div className="admin-notice">{notice}</div>}
      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading inventory…</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">No inventory items found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Code</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current</th>
                <th>Minimum</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const low = i.currentStock <= i.minimumStock;
                return (
                  <tr key={i._id} className={low ? 'row-low' : ''}>
                    <td><strong>{i.name}</strong></td>
                    <td>{i.itemCode}</td>
                    <td>{i.category}</td>
                    <td>{i.unit}</td>
                    <td>{i.currentStock}</td>
                    <td>{i.minimumStock}</td>
                    <td>
                      {low
                        ? <span className="low-badge">Low</span>
                        : <span className="ok-badge">OK</span>}
                    </td>
                    <td className="row-actions">
                      <button type="button" className="admin-btn tiny" onClick={() => setModal({ type: 'in', item: i })}>Stock IN</button>
                      <button type="button" className="admin-btn tiny" onClick={() => setModal({ type: 'out', item: i })}>Stock OUT</button>
                      <button type="button" className="admin-btn tiny ghost" onClick={() => setModal({ type: 'edit', item: i })}>Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ItemModal title="New Inventory Item" onClose={() => setShowModal(false)} onSubmit={createNew} />
      )}

      {modal && modal.type === 'edit' && (
        <ItemModal
          title={`Edit ${modal.item.name}`}
          initial={modal.item}
          onClose={() => setModal(null)}
          onSubmit={(form) => editItem(modal.item._id, form)}
        />
      )}

      {modal && (modal.type === 'in' || modal.type === 'out') && (
        <StockModal
          type={modal.type}
          item={modal.item}
          onClose={() => setModal(null)}
          onSubmit={(form) => runStock(modal.type, modal.item._id, form)}
        />
      )}
    </div>
  );
}

function ItemModal({ title, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          category: initial.category,
          unit: initial.unit,
          currentStock: initial.currentStock,
          minimumStock: initial.minimumStock,
        }
      : empty
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const update = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await onSubmit(form);
    } catch (err) {
      setErr(err.message || 'Something went wrong.');
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
          {err && <div className="admin-error">{err}</div>}
          {!initial && (
            <div className="admin-field">
              <label>Item Code *</label>
              <input className="admin-input" value={form.itemCode} onChange={update('itemCode')} required />
            </div>
          )}
          <div className="admin-field">
            <label>Name *</label>
            <input className="admin-input" value={form.name} onChange={update('name')} required />
          </div>
          <div className="admin-field">
            <label>Category</label>
            <input className="admin-input" value={form.category} onChange={update('category')} />
          </div>
          <div className="admin-field">
            <label>Unit</label>
            <input className="admin-input" value={form.unit} onChange={update('unit')} />
          </div>
          {!initial && (
            <div className="admin-field">
              <label>Opening Stock</label>
              <input type="number" min="0" className="admin-input" value={form.currentStock} onChange={update('currentStock')} />
            </div>
          )}
          <div className="admin-field">
            <label>Minimum Stock</label>
            <input type="number" min="0" className="admin-input" value={form.minimumStock} onChange={update('minimumStock')} />
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="admin-btn" disabled={busy}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockModal({ type, item, onClose, onSubmit }) {
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const n = Number(qty);
    if (!n || n <= 0) {
      setErr('Enter a valid quantity.');
      setBusy(false);
      return;
    }
    try {
      await onSubmit({ quantity: n, note });
    } catch (err) {
      setErr(err.message || 'Stock transaction failed.');
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{type === 'in' ? 'Stock IN' : 'Stock OUT'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="admin-form" onSubmit={submit}>
          <p className="muted">
            {item.name} — current stock: <strong>{item.currentStock}</strong> {item.unit}
          </p>
          {err && <div className="admin-error">{err}</div>}
          <div className="admin-field">
            <label>Quantity *</label>
            <input type="number" min="1" className="admin-input" value={qty} onChange={(e) => setQty(e.target.value)} required />
          </div>
          <div className="admin-field">
            <label>Note</label>
            <input className="admin-input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="admin-btn" disabled={busy}>
              {busy ? 'Saving…' : type === 'in' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Booking Calendar', end: true },
  { to: '/admin/all-bookings', label: 'All Bookings' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/properties', label: 'Property Settings' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <button
        type="button"
        className="admin-hamburger"
        aria-label="Toggle admin menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-name">Riverbells Resort</span>
          <span className="admin-brand-sub">Property Management</span>
        </div>

        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          {user && (
            <div className="admin-user-row">
              <span className="admin-user-name">{user.name}</span>
              <span className="admin-user-role">{user.role}</span>
            </div>
          )}
          <button
            type="button"
            className="admin-back-link"
            onClick={user ? logout : () => navigate('/admin/login')}
          >
            {user ? 'Sign out' : 'Sign in'}
          </button>
          <button
            type="button"
            className="admin-back-link"
            onClick={() => navigate('/')}
          >
            ← Back to website
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
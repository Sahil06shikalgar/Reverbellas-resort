import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Loader from './components/Loader';
import Home from './pages/Home';
import StayPage from './pages/Stay';
import BookStay from './pages/BookStay';
import BillingPage from './pages/BillingPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AdminLayout from './admin/AdminLayout';
import Login from './admin/Login';
import ProtectedRoute from './admin/ProtectedRoute';
import BookingCalendar from './admin/BookingCalendar';
import AllBookings from './admin/AllBookings';
import Payments from './admin/Payments';
import PaymentSuccess from './admin/PaymentSuccess';
import CustomerHistory from './admin/CustomerHistory';
import Inventory from './admin/Inventory';
import PropertySettings from './admin/PropertySettings';
import AdminBlogs from './admin/AdminBlogs';
import BlogEditor from './admin/BlogEditor';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import useLenis from './hooks/useLenis';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [showLoader, setShowLoader] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useLenis();

  useEffect(() => {
    document.body.style.overflow = showLoader ? 'hidden' : '';
  }, [showLoader]);

  useEffect(() => {
    if (showLoader) return;
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [showLoader, navigate]);

  useEffect(() => {
    ScrollTrigger.getAll().forEach((trigger) => {
      if (trigger.trigger && !document.body.contains(trigger.trigger)) {
        trigger.kill();
      }
    });
    ScrollTrigger.refresh();
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {showLoader && <Loader onComplete={() => setShowLoader(false)} />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'rb-toast',
        }}
      />
      <AppRoutes ready={!showLoader} />
    </div>
  );
}

function AppRoutes({ ready }) {
  return (
    <Routes>
      <Route path="/" element={<Home ready={ready} />} />
      <Route path="/stay" element={<StayPage ready={ready} />} />
      <Route path="/book-stay" element={<BookStay />} />
      <Route path="/billing/:bookingId" element={<BillingPage />} />
      <Route path="/payments/:bookingId" element={<PaymentPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/experiences" element={<Home ready={ready} />} />
      <Route path="/gallery" element={<Home ready={ready} />} />
      <Route path="/contact" element={<Home ready={ready} />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route path="/blogs/:slug" element={<BlogDetail />} />

      <Route path="/admin/login" element={<Login />} />

      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<BookingCalendar />} />
        <Route path="all-bookings" element={<AllBookings />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="customers" element={<CustomerHistory />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="properties" element={<PropertySettings />} />
        <Route path="blogs" element={<AdminBlogs />} />
        <Route path="blogs/new" element={<BlogEditor mode="new" />} />
        <Route path="blogs/:id/edit" element={<BlogEditor mode="edit" />} />
      </Route>

      <Route path="*" element={<Home ready={ready} />} />
    </Routes>
  );
}
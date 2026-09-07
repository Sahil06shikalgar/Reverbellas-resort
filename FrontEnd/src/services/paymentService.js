import request from "./api";
import { getBookingToken } from "./bookingAccess";

export const addPayment = async (paymentData) => {
  return request("/payments", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};

export const getBookingPayments = async (bookingId) => {
  return request(`/payments/booking/${bookingId}`);
};

// Guest-side payment endpoints (used by the payment page shown right after a
// booking is created). These require the booking's access token, which was
// saved locally at creation time.
export const addBookingPayment = async (bookingId, paymentData) => {
  const token = getBookingToken(bookingId);
  return request(`/bookings/${bookingId}/payments`, {
    method: "POST",
    body: JSON.stringify(paymentData),
    headers: token ? { "x-booking-token": token } : {},
  });
};

export const getBookingPaymentList = async (bookingId) => {
  const token = getBookingToken(bookingId);
  return request(`/bookings/${bookingId}/payments`, {
    headers: token ? { "x-booking-token": token } : {},
  });
};
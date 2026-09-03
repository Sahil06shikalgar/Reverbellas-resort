import request from "./api";

export const addPayment = async (paymentData) => {
  return request("/payments", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};

export const getBookingPayments = async (bookingId) => {
  return request(`/payments/booking/${bookingId}`);
};

// Public guest-side payment endpoints (used by the payment page shown
// right after a booking is created)
export const addBookingPayment = async (bookingId, paymentData) => {
  return request(`/bookings/${bookingId}/payments`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};

export const getBookingPaymentList = async (bookingId) => {
  return request(`/bookings/${bookingId}/payments`);
};
import request from "./api";
import { getBookingToken, saveBookingToken } from "./bookingAccess";

export const getBookings = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.status) {
    query.append("status", params.status);
  }

  if (params.property) {
    query.append("property", params.property);
  }

  if (params.search) {
    query.append("search", params.search);
  }

  const queryString = query.toString();

  return request(
    `/bookings${queryString ? `?${queryString}` : ""}`
  );
};

export const getBookingById = async (id, accessToken) => {
  // Staff callers authenticate with their JWT (added automatically in api.js).
  // Guest callers pass the booking accessToken, or we fall back to the token
  // saved when the booking was created.
  const token = accessToken || getBookingToken(id);
  return request(`/bookings/${id}`, {
    headers: token ? { "x-booking-token": token } : {},
  });
};

export const createBooking = async (bookingData) => {
  const response = await request("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });

  // Persist the one-time access token so the guest can view billing and pay
  // on the subsequent pages without an account.
  const bookingId = response?.data?._id;
  const accessToken = response?.data?.accessToken;
  if (bookingId && accessToken) {
    saveBookingToken(bookingId, accessToken);
  }

  return response;
};

export const changeBookingStatus = async (id, status) => {
  return request(`/bookings/${id}/status`, {
    method: "PATCH",

    body: JSON.stringify({
      status,
    }),
  });
};

export const addServiceCharge = async (id, data) => {
  return request(`/bookings/${id}/services`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};
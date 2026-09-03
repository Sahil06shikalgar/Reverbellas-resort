import request from "./api";

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

export const getBookingById = async (id) => {
  return request(`/bookings/${id}`);
};

export const createBooking = async (bookingData) => {
  return request("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
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
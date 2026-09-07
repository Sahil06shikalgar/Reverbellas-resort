// Guest booking access tokens.
//
// When a guest creates a booking, the API returns a one-time accessToken that
// authorizes viewing and paying for that specific booking without an account.
// We keep it in sessionStorage (cleared when the tab closes) keyed by booking
// id, so the billing / payment / success pages can retrieve it as the guest
// navigates between them.

const keyFor = (bookingId) => `riverbells_booking_token_${bookingId}`;

export const saveBookingToken = (bookingId, token) => {
  if (!bookingId || !token) return;
  try {
    sessionStorage.setItem(keyFor(bookingId), token);
  } catch {
    // sessionStorage may be unavailable (private mode / disabled). The guest
    // can still proceed within a single page; cross-page access just won't
    // persist. Fail silently rather than break the flow.
  }
};

export const getBookingToken = (bookingId) => {
  if (!bookingId) return "";
  try {
    return sessionStorage.getItem(keyFor(bookingId)) || "";
  } catch {
    return "";
  }
};

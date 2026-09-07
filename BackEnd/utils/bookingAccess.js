import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { JWT_SECRET } from "../config/env.js";

// Generate an unguessable token handed to the guest when a booking is created.
export const generateBookingAccessToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Constant-time comparison to avoid leaking token contents via timing.
const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// Returns true if the request carries a valid staff JWT.
const hasValidStaffToken = async (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return false;

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id isActive");
    return Boolean(user && user.isActive);
  } catch {
    return false;
  }
};

// Guard for guest-facing booking routes (view booking, list/add payments).
//
// Access is granted when EITHER:
//   - the caller is authenticated staff (valid JWT), or
//   - the caller supplies the booking's accessToken (header or body/query),
//     matching the token stored on that specific booking.
//
// This keeps the "pay right after booking" flow working while preventing
// anonymous enumeration of arbitrary bookings by ObjectId.
export const requireBookingAccess = async (req, res, next) => {
  try {
    const bookingId = req.params.id || req.params.bookingId;

    if (await hasValidStaffToken(req)) {
      return next();
    }

    const providedToken =
      req.headers["x-booking-token"] ||
      req.body?.accessToken ||
      req.query?.accessToken ||
      "";

    if (!providedToken) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "A booking access token is required to view or pay this booking"
      });
    }

    const booking = await Booking.findById(bookingId).select("+accessToken");

    if (!booking || !booking.accessToken || !safeEqual(providedToken, booking.accessToken)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Invalid booking access token"
      });
    }

    req.booking = booking;
    next();
  } catch (error) {
    next(error);
  }
};

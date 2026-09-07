import express from "express";

import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  changeBookingStatus,
  checkIn,
  checkout,
  getBilling,
  addServiceCharge
} from "../controllers/bookingController.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireBookingAccess } from "../utils/bookingAccess.js";
import { addPayment, getBookingPayments } from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", protect, getBookings);
router.post("/", createBooking);

// Guest booking-details + payment routes so a guest can pay right after
// booking. These are not public: the caller must present either a staff JWT
// or the booking's accessToken (returned when the booking was created).
router.get("/:id/payments", validateObjectId, requireBookingAccess, (req, res, next) => {
  req.params.bookingId = req.params.id;
  getBookingPayments(req, res, next);
});

router.post("/:id/payments", validateObjectId, requireBookingAccess, (req, res, next) => {
  req.body.bookingId = req.params.id;
  addPayment(req, res, next);
});

router.get("/:id", validateObjectId, requireBookingAccess, getBookingById);
router.put("/:id", validateObjectId, protect, updateBooking);

router.get("/:id/billing", validateObjectId, protect, getBilling);
router.post("/:id/check-in", validateObjectId, protect, checkIn);
router.post("/:id/checkout", validateObjectId, protect, checkout);

router.patch(
  "/:id/status",
  validateObjectId,
  protect,
  changeBookingStatus
);

router.post(
  "/:id/services",
  validateObjectId,
  protect,
  addServiceCharge
);

export default router;

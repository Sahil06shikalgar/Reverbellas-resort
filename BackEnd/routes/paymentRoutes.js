import express from "express";

import {
  addPayment,
  getBookingPayments
} from "../controllers/paymentController.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", addPayment);

router.get("/booking/:bookingId", validateObjectId, getBookingPayments);

export default router;

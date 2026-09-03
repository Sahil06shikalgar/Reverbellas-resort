import express from "express";

import {
  getCustomers,
  getCustomerById,
  getCustomerBookings
} from "../controllers/customerController.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getCustomers);
router.get("/:id", validateObjectId, getCustomerById);
router.get(
  "/:id/bookings",
  validateObjectId,
  getCustomerBookings
);

export default router;

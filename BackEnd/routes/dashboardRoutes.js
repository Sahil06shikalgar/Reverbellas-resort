import express from "express";

import {
  dashboardSummary,
  dashboardRevenue,
  dashboardOccupancy,
  dashboardBookings
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/summary", dashboardSummary);
router.get("/revenue", dashboardRevenue);
router.get("/occupancy", dashboardOccupancy);
router.get("/bookings", dashboardBookings);

export default router;

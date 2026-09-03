import express from "express";

import {
  getInvoice,
  getInvoicePdf
} from "../controllers/invoiceController.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/:bookingId", validateObjectId, getInvoice);
router.get("/:bookingId/pdf", validateObjectId, getInvoicePdf);

export default router;

import express from "express";

import {
  getInventory,
  createInventory,
  updateInventory,
  stockIn,
  stockOut
} from "../controllers/inventoryController.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getInventory);
router.post("/", createInventory);

router.put("/:id", validateObjectId, updateInventory);
router.post("/:id/stock-in", validateObjectId, stockIn);
router.post("/:id/stock-out", validateObjectId, stockOut);

export default router;

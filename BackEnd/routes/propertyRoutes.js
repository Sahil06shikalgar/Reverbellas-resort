import express from "express";

import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  getAvailableProperties
} from "../controllers/propertyController.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProperties);

router.get("/availability", getAvailableProperties);

router.get("/:id", validateObjectId, protect, getPropertyById);
router.post("/", protect, createProperty);
router.put("/:id", validateObjectId, protect, updateProperty);

export default router;

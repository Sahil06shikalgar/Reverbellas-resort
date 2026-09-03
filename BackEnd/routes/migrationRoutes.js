import express from "express";

import {
  importLegacyData
} from "../controllers/migrationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/import", importLegacyData);

export default router;

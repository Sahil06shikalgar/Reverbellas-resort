import express from "express";

import {
  getAdminBlogs,
  getPublishedBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus
} from "../controllers/blogController.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes (protected) — declared before the public slug route so that
// "/admin" and "/admin/:id" are never captured by "/:slug".
router.get("/admin", protect, getAdminBlogs);
router.get("/admin/:id", protect, validateObjectId, getBlogById);
router.post("/", protect, createBlog);
router.put("/:id", protect, validateObjectId, updateBlog);
router.patch("/:id/status", protect, validateObjectId, toggleBlogStatus);
router.delete("/:id", protect, validateObjectId, deleteBlog);

// Public routes — published blogs only
router.get("/", getPublishedBlogs);
router.get("/:slug", getBlogBySlug);

export default router;
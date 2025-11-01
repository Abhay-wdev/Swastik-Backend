import express from "express";
import multer from "../config/multer.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogBySlug
} from "../controllers/blogController.js";

const router = express.Router();

// =================== Public Routes ===================

// Get all blogs
router.get("/", getBlogs);

// Get a single blog by ID
router.get("/:id", getBlogById);

// Get a blog by slug (SEO friendly)
router.get("/slug/:slug", getBlogBySlug);

// =================== Protected Routes ===================
// Only admin, manager, or editor can create, update, or delete blogs

// Create a new blog with image upload
router.post(
  "/", multer.single("image"),createBlog
);

// Update blog by ID
router.put(
  "/:id",multer.single("image"),updateBlog
);

// Delete blog by ID
router.delete(
  "/:id",deleteBlog
);

export default router;

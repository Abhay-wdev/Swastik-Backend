import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewsByProduct,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Create a new review (any logged-in user)
router.post("/", protect, createReview);

// Get all reviews (open endpoint)
router.get("/", getAllReviews);

// Get reviews for a specific product
router.get("/product/:productId", getReviewsByProduct);

// Update a review (admin/manager only)
router.put("/:reviewId", protect, authorizeRoles("admin", "manager"), updateReview);

// Delete a review (admin/manager only)
router.delete("/:reviewId", deleteReview);
//protect, authorizeRoles("admin", "manager")

export default router;

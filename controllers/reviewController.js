import ReviewModel from "../models/reviewModel.js";
import SweetProduct from "../models/productModel.js";
import UserModel from "../models/userModel.js";
import mongoose from "mongoose";

// ===============================
// CREATE REVIEW
// ===============================
export const createReview = async (req, res) => {
  try {
    const { userId, productId, rating, title, comment, verifiedPurchase } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid user ID" });

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: "Invalid product ID" });

    // Check if user exists
    const userExists = await UserModel.findById(userId);
    if (!userExists) return res.status(404).json({ message: "User not found" });

    // Check if product exists
    const productExists = await SweetProduct.findById(productId);
    if (!productExists) return res.status(404).json({ message: "Product not found" });

    // Check for duplicate review
    const existingReview = await ReviewModel.findOne({ userId, productId });
    if (existingReview)
      return res.status(400).json({ success: false, message: "You have already reviewed this product." });

    // Create review
    const review = await ReviewModel.create({
      userId,
      productId,
      rating,
      title,
      comment,
      verifiedPurchase: verifiedPurchase || false,
    });

    // Link review to product
    await SweetProduct.findByIdAndUpdate(productId, { $push: { reviews: review._id } });

    // Populate before sending response
    const populatedReview = await ReviewModel.findById(review._id)
      .populate("userId", "name email")
      .populate("productId", "name category");

    res.status(201).json({ success: true, review: populatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// GET ALL REVIEWS
// ===============================
export const getAllReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const reviews = await ReviewModel.find()
      .populate("userId", "name email")
      .populate("productId", "name category")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// GET REVIEWS BY PRODUCT
// ===============================
export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: "Invalid product ID" });

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = parseInt(req.query.skip) || 0;

    const reviews = await ReviewModel.find({ productId })
      .populate("userId", "name email")
      .populate("productId", "name category")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// UPDATE REVIEW
// ===============================
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ message: "Invalid review ID" });

    const updatedReview = await ReviewModel.findByIdAndUpdate(reviewId, updateData, { new: true });

    if (!updatedReview) return res.status(404).json({ message: "Review not found" });

    const populatedReview = await ReviewModel.findById(updatedReview._id)
      .populate("userId", "name email")
      .populate("productId", "name category");

    res.status(200).json({ success: true, updatedReview: populatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// DELETE REVIEW
// ===============================
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ message: "Invalid review ID" });

    const review = await ReviewModel.findByIdAndDelete(reviewId);

    if (!review) return res.status(404).json({ message: "Review not found" });

    // Remove reference from product
    await SweetProduct.findByIdAndUpdate(review.productId, { $pull: { reviews: review._id } });

    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

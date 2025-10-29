import mongoose from "mongoose";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import PaymentAttempt from "../models/paymentAttemptModel.js";
import Coupon from "../models/couponModel.js";

/**
 * Check if a value is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Validate User ID
 */
export const validateUserId = async (userId) => {
  if (!isValidObjectId(userId)) return { valid: false, message: "Invalid user ID." };

  const user = await User.findById(userId);
  if (!user) return { valid: false, message: "User not found." };

  return { valid: true, user };
};

/**
 * Validate Order ID
 */
export const validateOrderId = async (orderId) => {
  if (!isValidObjectId(orderId)) return { valid: false, message: "Invalid order ID." };

  const order = await Order.findById(orderId);
  if (!order) return { valid: false, message: "Order not found." };

  return { valid: true, order };
};

/**
 * Validate Product ID
 */
export const validateProductId = async (productId) => {
  if (!isValidObjectId(productId)) return { valid: false, message: "Invalid product ID." };

  const product = await Product.findById(productId);
  if (!product) return { valid: false, message: "Product not found." };

  return { valid: true, product };
};

/**
 * Validate PaymentAttempt ID
 */
export const validatePaymentAttemptId = async (paymentId) => {
  if (!isValidObjectId(paymentId)) return { valid: false, message: "Invalid payment attempt ID." };

  const paymentAttempt = await PaymentAttempt.findById(paymentId);
  if (!paymentAttempt) return { valid: false, message: "Payment attempt not found." };

  return { valid: true, paymentAttempt };
};

/**
 * Validate Coupon ID
 */
export const validateCouponCode = async (code) => {
  try {
    if (!code || typeof code !== "string") {
      return { valid: false, message: "Coupon code is required and must be a string." };
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return { valid: false, message: "Coupon not found." };
    }

    // Check if coupon is active
    if (!coupon.active) {
      return { valid: false, message: "This coupon is not active." };
    }

    const currentDate = new Date();

    // Check start and expiry dates
    if (currentDate < coupon.startDate) {
      return { valid: false, message: "This coupon is not yet active." };
    }

    if (currentDate > coupon.expiryDate) {
      return { valid: false, message: "This coupon has expired." };
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: "Coupon usage limit reached." };
    }

    // ✅ Coupon is valid
    return { valid: true, coupon };

  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, message: "Error validating coupon code." };
  }
};

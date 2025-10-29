// routes/authRoutes.js
import express from "express";
import {
  sendRegistrationOTP,
  verifyOTPAndRegister,
  sendForgotPasswordOTP,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// Registration flow
router.post("/send-otp", sendRegistrationOTP);
router.post("/verify-otp", verifyOTPAndRegister);

// Forgot password flow
router.post("/forgot-password", sendForgotPasswordOTP);
router.post("/reset-password", resetPassword);

export default router;

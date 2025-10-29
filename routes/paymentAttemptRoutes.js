import express from "express";
import {
  createPaymentAttempt,
  getAllPaymentAttempts,
  getPaymentAttemptById,
  updatePaymentAttempt,
  deletePaymentAttempt
} from "../controllers/paymentAttemptController.js";

const router = express.Router();

// ===============================
// CREATE a new payment attempt
// POST /api/payment-attempt
// ===============================
router.post("/", createPaymentAttempt);

// ===============================
// GET all payment attempts
// GET /api/payment-attempt
// ===============================
router.get("/", getAllPaymentAttempts);

// ===============================
// GET a single payment attempt by ID
// GET /api/payment-attempt/:id
// ===============================
router.get("/:id", getPaymentAttemptById);

// ===============================
// UPDATE a payment attempt by ID
// PUT /api/payment-attempt/:id
// ===============================
router.put("/:id", updatePaymentAttempt);

// ===============================
// DELETE a payment attempt by ID
// DELETE /api/payment-attempt/:id
// ===============================
router.delete("/:id", deletePaymentAttempt);

export default router;

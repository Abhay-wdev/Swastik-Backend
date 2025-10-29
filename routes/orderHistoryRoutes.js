import express from "express";
import {
  createOrderHistory,
  getAllOrderHistories,
  getOrderHistoryById,
  updateOrderHistory,
  deleteOrderHistory
} from "../controllers/orderHistoryController.js";

const router = express.Router();

// ===============================
// CREATE a new order history entry
// POST /api/order-history
// ===============================
router.post("/", createOrderHistory);

// ===============================
// GET all order history entries
// GET /api/order-history
// ===============================
router.get("/", getAllOrderHistories);

// ===============================
// GET a single order history entry by ID
// GET /api/order-history/:id
// ===============================
router.get("/:id", getOrderHistoryById);

// ===============================
// UPDATE an order history entry by ID
// PUT /api/order-history/:id
// ===============================
router.put("/:id", updateOrderHistory);

// ===============================
// DELETE an order history entry by ID
// DELETE /api/order-history/:id
// ===============================
router.delete("/:id", deleteOrderHistory);

export default router;

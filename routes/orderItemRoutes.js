import express from "express";
import {
  createOrderItem,
  getAllOrderItems,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
} from "../controllers/orderItemController.js";

const router = express.Router();

// ===============================
// CREATE a new order item
// POST /api/order-item
// ===============================
router.post("/", createOrderItem);

// ===============================
// GET all order items
// GET /api/order-item
// ===============================
router.get("/", getAllOrderItems);

// ===============================
// GET a single order item by ID
// GET /api/order-item/:id
// ===============================
router.get("/:id", getOrderItemById);

// ===============================
// UPDATE an order item by ID
// PUT /api/order-item/:id
// ===============================
router.put("/:id", updateOrderItem);

// ===============================
// DELETE an order item by ID
// DELETE /api/order-item/:id
// ===============================
router.delete("/:id", deleteOrderItem);

export default router;

import express from "express";
import {
  createOrderItem,
  getAllOrderItems,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
} from "../controllers/orderItemController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
const router = express.Router();

// ===============================
// CREATE a new order item
// POST /api/order-item
// ===============================
router.post("/",protect, createOrderItem);

// ===============================
// GET all order items
// GET /api/order-item
// ===============================
router.get("/",protect, getAllOrderItems);

// ===============================
// GET a single order item by ID
// GET /api/order-item/:id
// ===============================
router.get("/:id",protect, getOrderItemById);

// ===============================
// UPDATE an order item by ID
// PUT /api/order-item/:id
// ===============================
router.put("/:id",protect, allowRoles("admin", "seller", "manager"), updateOrderItem);

// ===============================
// DELETE an order item by ID
// DELETE /api/order-item/:id
// ===============================
router.delete("/:id",protect, allowRoles("admin", "seller", "manager"), deleteOrderItem);

export default router;

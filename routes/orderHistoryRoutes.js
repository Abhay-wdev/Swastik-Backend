import express from "express";
import {
  createOrderHistory,
  getAllOrderHistories,
  getOrderHistoryById,
  updateOrderHistory,
  deleteOrderHistory
} from "../controllers/orderHistoryController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
const router = express.Router();

// ===============================
// CREATE a new order history entry
// POST /api/order-history
// ===============================
router.post("/",protect, createOrderHistory);

// ===============================
// GET all order history entries
// GET /api/order-history
// ===============================
router.get("/",protect, getAllOrderHistories);

// ===============================
// GET a single order history entry by ID
// GET /api/order-history/:id
// ===============================
router.get("/:id",protect, getOrderHistoryById);

// ===============================
// UPDATE an order history entry by ID
// PUT /api/order-history/:id
// ===============================
router.put("/:id",protect, allowRoles("admin", "seller", "manager"), updateOrderHistory);

// ===============================
// DELETE an order history entry by ID
// DELETE /api/order-history/:id
// ===============================
router.delete("/:id",protect, allowRoles("admin", "seller", "manager"), deleteOrderHistory);

export default router;

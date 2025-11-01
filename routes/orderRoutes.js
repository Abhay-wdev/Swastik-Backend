import express from "express";
import {
  placeOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { generateInvoice } from "../controllers/invoiceController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// 🟢 Create new order
router.post("/place-order",protect, placeOrder);

// 🟡 Get all orders (Admin)
router.get("/", protect, allowRoles("admin", "seller", "manager") , getAllOrders);

// 🟠 Get user orders
router.get("/user/:userId", protect, getUserOrders);

// 🔵 Get single order
router.get("/:orderId", protect, getOrderById);

// 🟣 Update order (Admin or status updates)
router.put("/:orderId", protect, allowRoles("admin", "seller", "manager"), updateOrder);

// 🔴 Delete order (Admin only)
router.delete("/:orderId",protect, allowRoles("admin", "seller", "manager"), deleteOrder);

// 📄 Generate PDF invoice
router.get("/invoice/:orderId",   generateInvoice);

export default router;

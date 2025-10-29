import express from "express";
import {
  createOrder,
  getOrderById,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  addPaymentAttempt,
  applyCoupon,
  addReturnRequest,
  deleteOrder
} from "../controllers/orderController.js";

const router = express.Router();

// CREATE ORDER
router.post("/", createOrder);

// GET ORDER BY ID
router.get("/:id", getOrderById);

// GET ORDERS BY USER
router.get("/user/:userId", getOrdersByUser);

// GET ALL ORDERS (Admin)
router.get("/", getAllOrders);

// UPDATE ORDER STATUS
router.put("/status/:id", updateOrderStatus);

// ADD PAYMENT ATTEMPT
router.post("/payment/:id", addPaymentAttempt);

// APPLY COUPON
router.post("/coupon/:id", applyCoupon);

// ADD RETURN / REFUND REQUEST
router.post("/return/:id", addReturnRequest);

// SOFT DELETE ORDER
router.delete("/:id", deleteOrder);

export default router;

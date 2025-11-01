import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
   
} from "../controllers/cartController.js";
import { protect } from "../middlewares/authMiddleware.js"; // JWT middleware
const router = express.Router();

// ===============================
// GET CART FOR USER
// GET /api/cart/:userId
// ===============================
router.get("/:userId",protect, getCart);

// ===============================
// ADD ITEM TO CART
// POST /api/cart/add
// ===============================
router.post("/add",protect, addToCart);

// ===============================
// UPDATE ITEM QUANTITY
// PUT /api/cart/update
// ===============================
router.put("/update",protect, updateCartItem);

// ===============================
// REMOVE ITEM FROM CART
// DELETE /api/cart/remove
// ===============================
router.delete("/remove",protect, removeCartItem);

// ===============================
// CLEAR CART
// DELETE /api/cart/clear/:userId
// ===============================
router.delete("/clear/:userId",protect, clearCart);

 

export default router;

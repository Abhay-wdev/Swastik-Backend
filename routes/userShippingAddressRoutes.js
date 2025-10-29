import express from "express";
import {
  createShippingAddress,
  getUserAddresses,
  getAddressById,
  updateShippingAddress,
  deleteShippingAddress
} from "../controllers/userShippingAddressController.js";
import { protect } from "../middlewares/authMiddleware.js"; // JWT middleware
const router = express.Router();

// ===============================
// CREATE a new shipping address
// POST /api/shipping-address
// ===============================
router.post("/",protect, createShippingAddress);

// ===============================
// GET all addresses for a user
// GET /api/shipping-address/user/:userId
// ===============================
router.get("/user/:userId",protect, getUserAddresses);

// ===============================
// GET a single address by ID
// GET /api/shipping-address/:id
// ===============================
router.get("/:id",protect, getAddressById);

// ===============================
// UPDATE an address by ID
// PUT /api/shipping-address/:id
// ===============================
router.put("/:id",protect, updateShippingAddress);

// ===============================
// DELETE an address by ID
// DELETE /api/shipping-address/:id
// ===============================
router.delete("/:id",protect, deleteShippingAddress);

export default router;

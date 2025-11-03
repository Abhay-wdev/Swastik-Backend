import express from "express";
import {
  createHomeAddress,
  getUserHomeAddresses,
  getHomeAddressById,
  updateHomeAddress,
  deleteHomeAddress
} from "../controllers/userHomeAddressController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
const router = express.Router();

// ===============================
// CREATE a new home address
// POST /api/home-address
// ===============================
router.post("/",protect, createHomeAddress);

// ===============================
// GET all home addresses for a user
// GET /api/home-address/user/:userId
// ===============================
router.get("/user/:userId",protect, getUserHomeAddresses);

// ===============================
// GET a single home address by ID
// GET /api/home-address/:id
// ===============================
router.get("/:id",protect, getHomeAddressById);

// ===============================
// UPDATE a home address by ID
// PUT /api/home-address/:id
// ===============================
router.put("/:id",protect, updateHomeAddress);

// ===============================
// DELETE a home address by ID
// DELETE /api/home-address/:id
// ===============================
router.delete("/:id",protect, allowRoles("admin", "seller", "manager"), deleteHomeAddress);

export default router;

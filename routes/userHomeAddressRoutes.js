import express from "express";
import {
  createHomeAddress,
  getUserHomeAddresses,
  getHomeAddressById,
  updateHomeAddress,
  deleteHomeAddress
} from "../controllers/userHomeAddressController.js";

const router = express.Router();

// ===============================
// CREATE a new home address
// POST /api/home-address
// ===============================
router.post("/", createHomeAddress);

// ===============================
// GET all home addresses for a user
// GET /api/home-address/user/:userId
// ===============================
router.get("/user/:userId", getUserHomeAddresses);

// ===============================
// GET a single home address by ID
// GET /api/home-address/:id
// ===============================
router.get("/:id", getHomeAddressById);

// ===============================
// UPDATE a home address by ID
// PUT /api/home-address/:id
// ===============================
router.put("/:id", updateHomeAddress);

// ===============================
// DELETE a home address by ID
// DELETE /api/home-address/:id
// ===============================
router.delete("/:id", deleteHomeAddress);

export default router;

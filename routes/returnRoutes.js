import express from "express";
import {
  createReturnRequest,
  getAllReturns,
  getReturnById,
  updateReturnRequest,
  deleteReturnRequest
} from "../controllers/returnController.js";

const router = express.Router();

// ===============================
// CREATE a new return request
// POST /api/return
// ===============================
router.post("/", createReturnRequest);

// ===============================
// GET all return requests
// GET /api/return
// ===============================
router.get("/", getAllReturns);

// ===============================
// GET a single return request by ID
// GET /api/return/:id
// ===============================
router.get("/:id", getReturnById);

// ===============================
// UPDATE a return request by ID
// PUT /api/return/:id
// ===============================
router.put("/:id", updateReturnRequest);

// ===============================
// DELETE a return request by ID
// DELETE /api/return/:id
// ===============================
router.delete("/:id", deleteReturnRequest);

export default router;

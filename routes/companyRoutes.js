import express from "express";
import {
  createOrUpdateCompany,
  getCompanies,
  getCompany,
  deleteCompany,
} from "../controllers/companyController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

/**
 * @route   POST /api/company/create
 * @desc    Create or update company (single instance)
 * @access  Admin
 */
router.post(
  "/create",
  protect, // ✅ Add authentication
  allowRoles("admin"), // ✅ Add role check
  upload.any(), // ✅ Allows multiple files like logo + dynamic socialIcon_*
  createOrUpdateCompany
);

/**
 * @route   GET /api/company
 * @desc    Get all companies
 * @access  Public or Admin
 */
router.get("/", getCompanies);

/**
 * @route   GET /api/company/:id
 * @desc    Get a single company (for invoice use)
 * @access  Public or Admin
 */
router.get("/:id", getCompany);

/**
 * @route   DELETE /api/company/:id
 * @desc    Delete a company (admin only)
 * @access  Admin
 */
router.delete("/:id", protect, allowRoles("admin"), deleteCompany);

export default router;
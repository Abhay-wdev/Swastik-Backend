import express from "express";
import categoryController from "../controllers/categoryController.js";
import upload from "../config/multer.js";
import { protect } from "../middlewares/authMiddleware.js"; // JWT auth middleware
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// CREATE CATEGORY (with optional image) – only admin, seller, manager
router.post(
  "/",
  protect,
  allowRoles("admin", "seller", "manager"),
  upload.single("image"),
  categoryController.createCategory
);

// GET ALL CATEGORIES – public
router.get("/", categoryController.getCategories);

// GET SINGLE CATEGORY BY ID – public
router.get("/:id", categoryController.getCategoryById);

// UPDATE CATEGORY – only admin, seller, manager
router.put(
  "/:id",
  protect,
  allowRoles("admin", "seller", "manager"),
  upload.single("image"),
  categoryController.updateCategory
);

// DELETE CATEGORY – only admin, seller, manager
router.delete(
  "/:id",
  protect,
  allowRoles("admin", "seller", "manager"),
  categoryController.deleteCategory
);

export default router;

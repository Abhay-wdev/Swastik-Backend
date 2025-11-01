import express from "express";
import subCategoryController from "../controllers/subCategoryController.js";
import upload from "../config/multer.js"; // your existing multer config
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js"; // JWT auth middleware
const router = express.Router();

// ================================
// SUBCATEGORY ROUTES
// ================================

// CREATE SUBCATEGORY (with optional image)
router.post("/",protect,allowRoles("admin", "seller", "manager"), upload.single("image"), subCategoryController.createSubCategory);

// GET ALL SUBCATEGORIES
router.get("/", subCategoryController.getSubCategories);
router.get("/subcategory/:slug", subCategoryController.getSubCategoriesByCategorySlug);
// GET SINGLE SUBCATEGORY BY ID
router.get("/:id", subCategoryController.getSubCategoriesByCategoryId);

// UPDATE SUBCATEGORY (with optional new image)
router.put("/:id",protect,allowRoles("admin", "seller", "manager"), upload.single("image"), subCategoryController.updateSubCategory);

// DELETE SUBCATEGORY
router.delete("/:id",protect,allowRoles("admin", "seller", "manager"), subCategoryController.deleteSubCategory);

export default router;

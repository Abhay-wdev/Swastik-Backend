import express from "express";
import multer from "../config/multer.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsBySubCategoryId,
  getProductsCards,
  getProductBySlug
} from "../controllers/productController.js";

const router = express.Router();

// Public Read
router.get("/", getProducts);
router.get("/all/", getProductsCards);
router.get("/:id", getProductById);
router.get("/slug/:slug", getProductBySlug);
router.get("/subcategory/:subCategoryId", getProductsBySubCategoryId);
// Protected CRUD
router.post("/", protect, allowRoles("admin", "seller", "manager"), multer.array("images", 10), createProduct);
router.put("/:id", protect, allowRoles("admin", "seller", "manager"), multer.array("images", 10), updateProduct);
router.delete("/:id", protect, allowRoles("admin", "seller", "manager"), deleteProduct);

export default router;

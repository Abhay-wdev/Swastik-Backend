import express from "express";
import couponController from "../controllers/couponController.js";
import upload from "../config/multer.js";

const router = express.Router();

// CRUD for Coupons with image upload
router.post("/", upload.array("images", 5), couponController.createCoupon);           // CREATE with images
router.get("/", couponController.getAllCoupons);                                        // READ all
router.get("/:id", couponController.getCouponById);                                     // READ single
router.put("/:id", upload.array("images", 5), couponController.updateCoupon);         // UPDATE with images
router.delete("/:id", couponController.deleteCoupon);                                   // DELETE

export default router;
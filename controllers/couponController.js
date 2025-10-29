
// ================================
// COUPON CONTROLLER (couponController.js)
// ================================
import Coupon from "../models/couponModel.js";
import Category from "../models/categoryModel.js";
import SubCategory from "../models/subCategoryModel.js";
import cloudinary from "../config/cloudinary.js";
import { v4 as uuidv4 } from "uuid";

// ================================
// CREATE COUPON
// ================================
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      maxDiscount,
      minOrderAmount,
      startDate,
      expiryDate,
      usageLimit,
      category,
      subCategory,
      description,
      validationNotes,
      active,
    } = req.body;

    // Basic validation
    if (!code || !type || !value) {
      return res.status(400).json({
        message: "Required fields missing: code, type, value",
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    // Validate category if provided
    if (category) {
      const categoryData = await Category.findById(category);
      if (!categoryData) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    // Validate subcategory if provided
    if (subCategory) {
      const subCategoryData = await SubCategory.findById(subCategory);
      if (!subCategoryData) {
        return res.status(404).json({ message: "SubCategory not found" });
      }
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: "coupons" })
        )
      );
      imageUrls = results.map((r) => r.secure_url);
    }

    // Create coupon object
    const newCoupon = new Coupon({
      code,
      type,
      value,
      maxDiscount: maxDiscount || null,
      minOrderAmount: minOrderAmount || null,
      startDate: startDate || new Date(),
      expiryDate: expiryDate || null,
      usageLimit: usageLimit || null,
      category: category || null,
      subCategory: subCategory || null,
      description: description || "",
      validationNotes: validationNotes || [],
      images: imageUrls,
      active: active !== undefined ? active : true,
    });

    const savedCoupon = await newCoupon.save();
    
    // Populate references before sending response
    const populatedCoupon = await Coupon.findById(savedCoupon._id)
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    res.status(201).json(populatedCoupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL COUPONS (Search + Limit)
// ================================
const getAllCoupons = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const search = req.query.search || "";

    const query = search
      ? { code: { $regex: search, $options: "i" } }
      : {};

    const coupons = await Coupon.find(query)
      .limit(limit)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({
      limit,
      totalCoupons: coupons.length,
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET SINGLE COUPON
// ================================
const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// UPDATE COUPON (Supports new images)
// ================================
// ================================
// UPDATE COUPON (Supports new images + Cloudinary)
// ================================
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Check if code is being changed and if new code already exists
    if (req.body.code && req.body.code !== existingCoupon.code) {
      const codeExists = await Coupon.findOne({ code: req.body.code });
      if (codeExists) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
    }

    // Validate category if provided
    if (req.body.category) {
      const categoryData = await Category.findById(req.body.category);
      if (!categoryData) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    // Validate subcategory if provided
    if (req.body.subCategory) {
      const subCategoryData = await SubCategory.findById(req.body.subCategory);
      if (!subCategoryData) {
        return res.status(404).json({ message: "SubCategory not found" });
      }
    }

    // Trim strings and convert dates
    const fieldsToTrim = ["code", "type", "description"];
    fieldsToTrim.forEach((key) => {
      if (req.body[key]) req.body[key] = req.body[key].trim();
    });

    if (req.body.startDate) req.body.startDate = new Date(req.body.startDate.trim());
    if (req.body.expiryDate) req.body.expiryDate = new Date(req.body.expiryDate.trim());

    // Start with existing images
    let updatedImages = [...existingCoupon.images];

    // Remove images if provided
    if (req.body.imagesToRemove && Array.isArray(req.body.imagesToRemove)) {
      updatedImages = updatedImages.filter(
        (url) => !req.body.imagesToRemove.includes(url)
      );
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: "coupons" })
        )
      );
      uploadResults.forEach((r) => {
        // Only add if URL not already present
        if (!updatedImages.includes(r.secure_url)) {
          updatedImages.push(r.secure_url);
        }
      });
    }

    // Apply custom image sequence if provided
    if (req.body.imageSequence && Array.isArray(req.body.imageSequence)) {
      updatedImages = req.body.imageSequence.filter((url) =>
        updatedImages.includes(url)
      );
    }

    // Merge updated data
    const updatedData = {
      ...req.body,
      images: updatedImages,
    };

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updatedData, {
      new: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    res.status(200).json(updatedCoupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: error.message });
  }
};


// ================================
// DELETE COUPON
// ================================
const deleteCoupon = async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// EXPORT (DEFAULT)
// ================================
export default {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};
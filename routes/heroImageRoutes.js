import express from "express";
import multerUpload from "../config/multer.js";
import {
  getHeroImages,
  uploadHeroImages,
  deleteHeroImage,
  updateHeroImage,
  reorderHeroImages,
} from "../controllers/heroImageController.js";

const router = express.Router();

// Enhanced middleware to handle file uploads with validation
const handleHeroImageUpload = (req, res, next) => {
  multerUpload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        message: "File upload error", 
        error: err.message,
        details: "Only image files are allowed with max size 5MB"
      });
    }
    
    // Validate required fields
    if (!req.body.link) {
      return res.status(400).json({ 
        message: "Validation error", 
        error: "Link is required"
      });
    }
    
    // Validate desktop image presence (required by schema)
    if (!req.files || !req.files.desktopImage || req.files.desktopImage.length === 0) {
      return res.status(400).json({ 
        message: "Validation error", 
        error: "Desktop image is required"
      });
    }
    
    next();
  });
};

// GET all hero images
router.get("/", getHeroImages);

// POST upload new hero image with validation
router.post("/upload", handleHeroImageUpload, uploadHeroImages);

// PUT update hero image (with file upload support)
router.put("/:id", (req, res, next) => {
  // Use same upload middleware for partial updates
  multerUpload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        message: "File upload error", 
        error: err.message,
        details: "Only image files are allowed with max size 5MB"
      });
    }
    next();
  });
}, updateHeroImage);

// PUT reorder hero images
router.put("/reorder", reorderHeroImages);

// DELETE hero image
router.delete("/:id", deleteHeroImage);

export default router;
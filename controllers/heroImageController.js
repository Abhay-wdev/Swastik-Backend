import HeroImage from "../models/HeroImage.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

/** Get all hero images sorted by sequence (max 5) */
export const getHeroImages = async (req, res) => {
  try {
    const images = await HeroImage.find().sort({ sequence: 1 }).limit(5);
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch hero images", error: err.message });
  }
};

/** Upload hero images (max 5) with optional Cloudinary */
export const uploadHeroImages = async (req, res) => {
  try {
    const files = req.files;
    const links = req.body.links || [];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const linkArray = Array.isArray(links) ? links : [links];

    // Check max 5 images in DB
    const currentCount = await HeroImage.countDocuments();
    if (currentCount + files.length > 5) {
      return res.status(400).json({ message: "Maximum of 5 hero images allowed" });
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(files[i].path, {
        folder: "hero_images",
        use_filename: true,
        unique_filename: false,
      });

      // Delete local temp file
      fs.unlinkSync(files[i].path);

      uploadedImages.push({
        imageUrl: result.secure_url,
        link: linkArray[i] || `/page-${currentCount + i + 1}`, // Default link based on position
        sequence: currentCount + i,
      });
    }

    const savedImages = await HeroImage.insertMany(uploadedImages);
    res.status(201).json({ message: "Hero images uploaded successfully", images: savedImages });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload hero images", error: err.message });
  }
};

/** Delete a hero image */
export const deleteHeroImage = async (req, res) => {
  try {
    const image = await HeroImage.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ message: "Hero image not found" });
    
    // Reorder remaining images
    const remainingImages = await HeroImage.find().sort({ sequence: 1 });
    const bulkOps = remainingImages.map((img, index) => ({
      updateOne: {
        filter: { _id: img._id },
        update: { 
          sequence: index,
          link: `/page-${index + 1}` // Update link based on new position
        },
      },
    }));
    await HeroImage.bulkWrite(bulkOps);
    
    res.json({ message: "Hero image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete hero image", error: err.message });
  }
};

/** Update hero image link */
export const updateHeroImage = async (req, res) => {
  try {
    const { link } = req.body;
    const image = await HeroImage.findByIdAndUpdate(
      req.params.id, 
      { link }, 
      { new: true }
    );
    if (!image) return res.status(404).json({ message: "Hero image not found" });
    res.json(image);
  } catch (err) {
    res.status(500).json({ message: "Failed to update hero image", error: err.message });
  }
};

/** Reorder hero images and update links */
export const reorderHeroImages = async (req, res) => {
  try {
    const { order } = req.body; // array of _id in desired sequence
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: "Order must be an array of image IDs" });
    }

    // Update sequence and link for each image
    const bulkOps = order.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { 
          sequence: index,
          link: `/page-${index + 1}` // Update link based on new position
        },
      },
    }));

    await HeroImage.bulkWrite(bulkOps);

    // Fetch the updated images
    const reordered = await HeroImage.find().sort({ sequence: 1 });
    res.json(reordered);
  } catch (err) {
    res.status(500).json({ message: "Failed to reorder images", error: err.message });
  }
};
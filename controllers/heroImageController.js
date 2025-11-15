import fs from "fs";
import HeroImage from "../models/HeroImage.js";
import cloudinary from "../config/cloudinary.js";
import {
  deleteCloudinaryImage,
  extractPublicId
} from "../utils/cloudinaryHelper.js";

// ================================
// GET ALL HERO IMAGES
// ================================
export const getHeroImages = async (req, res) => {
  try {
    const heroImages = await HeroImage.find().sort({ sequence: 1 });
    res.status(200).json(heroImages);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching hero images",
      error: error.message,
    });
  }
};

// ================================
// UPLOAD NEW HERO IMAGE
// ================================
export const uploadHeroImages = async (req, res) => {
  try {
    const { link, sequence } = req.body;

    // Desktop image (required)
    const desktopFile = req.files?.desktopImage?.[0];
    if (!desktopFile) {
      return res.status(400).json({ message: "Desktop image is required" });
    }

    const desktopUpload = await cloudinary.uploader.upload(desktopFile.path, {
      folder: "hero_images",
    });

    const desktopImageUrl = desktopUpload.secure_url;

    // Cleanup temp file
    fs.existsSync(desktopFile.path) && fs.unlinkSync(desktopFile.path);

    // Mobile image (optional)
    let mobileImageUrl = null;

    if (req.files?.mobileImage?.[0]) {
      const mobileFile = req.files.mobileImage[0];

      const mobileUpload = await cloudinary.uploader.upload(mobileFile.path, {
        folder: "hero_images",
      });

      mobileImageUrl = mobileUpload.secure_url;

      fs.existsSync(mobileFile.path) && fs.unlinkSync(mobileFile.path);
    }

    // Save to DB
    const newHeroImage = new HeroImage({
      desktopImageUrl,
      mobileImageUrl,
      link,
      sequence: sequence ? parseInt(sequence) : 0,
    });

    const saved = await newHeroImage.save();
    res.status(201).json(saved);

  } catch (error) {
    res.status(500).json({
      message: "Error uploading hero image",
      error: error.message,
    });
  }
};

// ================================
// UPDATE HERO IMAGE (with Cloudinary replace)
// ================================
export const updateHeroImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { link, sequence } = req.body;

    const heroImage = await HeroImage.findById(id);
    if (!heroImage) {
      return res.status(404).json({ message: "Hero image not found" });
    }

    // -------------------------------
    // 1️⃣ DESKTOP IMAGE REPLACE
    // -------------------------------
    if (req.files?.desktopImage?.length > 0) {
      const newFile = req.files.desktopImage[0];

      // Delete old desktop image
      if (heroImage.desktopImageUrl) {
        await deleteCloudinaryImage(heroImage.desktopImageUrl);
      }

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(newFile.path, {
        folder: "hero_images",
      });

      heroImage.desktopImageUrl = uploadResult.secure_url;

      fs.existsSync(newFile.path) && fs.unlinkSync(newFile.path);
    }

    // -------------------------------
    // 2️⃣ MOBILE IMAGE REPLACE
    // -------------------------------
    if (req.files?.mobileImage?.length > 0) {
      const newFile = req.files.mobileImage[0];

      // Delete old mobile image
      if (heroImage.mobileImageUrl) {
        await deleteCloudinaryImage(heroImage.mobileImageUrl);
      }

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(newFile.path, {
        folder: "hero_images",
      });

      heroImage.mobileImageUrl = uploadResult.secure_url;

      fs.existsSync(newFile.path) && fs.unlinkSync(newFile.path);
    }

    // -------------------------------
    // Update other fields
    // -------------------------------
    if (link) heroImage.link = link;
    if (sequence !== undefined) heroImage.sequence = parseInt(sequence);

    const updated = await heroImage.save();

    res.status(200).json(updated);

  } catch (error) {
    res.status(500).json({
      message: "Error updating hero image",
      error: error.message,
    });
  }
};

// ================================
// DELETE HERO IMAGE (auto Cloudinary cleanup)
// ================================
export const deleteHeroImage = async (req, res) => {
  try {
    const { id } = req.params;

    const heroImage = await HeroImage.findById(id);
    if (!heroImage) {
      return res.status(404).json({ message: "Hero image not found" });
    }

    // Delete desktop image
    if (heroImage.desktopImageUrl) {
      await deleteCloudinaryImage(heroImage.desktopImageUrl);
    }

    // Delete mobile image (if exists)
    if (heroImage.mobileImageUrl) {
      await deleteCloudinaryImage(heroImage.mobileImageUrl);
    }

    await HeroImage.findByIdAndDelete(id);

    res.status(200).json({ message: "Hero image deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting hero image",
      error: error.message,
    });
  }
};

// ================================
// REORDER HERO IMAGES
// ================================
export const reorderHeroImages = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Invalid updates format" });
    }

    const updatePromises = updates.map((u) =>
      HeroImage.findByIdAndUpdate(
        u.id,
        { sequence: u.sequence },
        { new: true, runValidators: true }
      )
    );

    const updatedImages = await Promise.all(updatePromises);

    res.status(200).json(updatedImages);

  } catch (error) {
    res.status(500).json({
      message: "Error reordering hero images",
      error: error.message,
    });
  }
};

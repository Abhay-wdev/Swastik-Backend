import VideoProduct from "../models/videoProduct.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// --------------------------------------------------
// Helper: safely delete local temp file
// --------------------------------------------------
const safeUnlink = (path) => {
  try {
    if (path && fs.existsSync(path)) fs.unlinkSync(path);
  } catch (err) {
    console.log("⚠️ safeUnlink error:", err.message);
  }
};

// --------------------------------------------------
// Helper: extract Cloudinary public ID from image URL
// Example:
// https://res.cloudinary.com/demo/image/upload/v123/products/abc123.jpg
// -> products/abc123
// --------------------------------------------------
const extractPublicId = (url) => {
  if (!url) return null;

  const noParams = url.split("?")[0];
  const afterUpload = noParams.split("/upload/")[1];
  if (!afterUpload) return null;

  const parts = afterUpload.split("/");

  // Remove version (v123)
  if (parts[0].startsWith("v")) parts.shift();

  const filePath = parts.join("/");
  return filePath.replace(/\.[^/.]+$/, ""); // remove .jpg / .png / .webp etc.
};

// --------------------------------------------------
// CREATE Video Product
// --------------------------------------------------
export const createVideoProduct = async (req, res) => {
  try {
    const { title, youtubeUrl, productUrl } = req.body;
    let thumbnailUrl = "";

    if (!title || !youtubeUrl || !productUrl) {
      safeUnlink(req.file?.path);
      return res.status(400).json({ message: "All text fields are required." });
    }

    // Upload image if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "videoproducts",
      });

      thumbnailUrl = result.secure_url;
      safeUnlink(req.file.path);
    }

    const newVideoProduct = await VideoProduct.create({
      title,
      thumbnail: thumbnailUrl,
      youtubeUrl,
      productUrl,
    });

    return res.status(201).json({
      message: "🎬 Video product created successfully",
      videoProduct: newVideoProduct,
    });
  } catch (error) {
    safeUnlink(req.file?.path);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --------------------------------------------------
// READ All Video Products
// --------------------------------------------------
export const getAllVideoProducts = async (req, res) => {
  try {
    const videoProducts = await VideoProduct.find().sort({ createdAt: -1 });
    res.json(videoProducts);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --------------------------------------------------
// READ Single Video Product
// --------------------------------------------------
export const getVideoProductById = async (req, res) => {
  try {
    const videoProduct = await VideoProduct.findById(req.params.id);
    if (!videoProduct)
      return res.status(404).json({ message: "Video product not found" });

    res.json(videoProduct);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --------------------------------------------------
// UPDATE Video Product (with optional new image)
// --------------------------------------------------
export const updateVideoProduct = async (req, res) => {
  try {
    const { title, youtubeUrl, productUrl } = req.body;

    const videoProduct = await VideoProduct.findById(req.params.id);
    if (!videoProduct)
      return res.status(404).json({ message: "Video product not found" });

    let updatedData = {
      title: title ?? videoProduct.title,
      youtubeUrl: youtubeUrl ?? videoProduct.youtubeUrl,
      productUrl: productUrl ?? videoProduct.productUrl,
    };

    // Replace image if new image uploaded
    if (req.file) {
      // Delete old image
      if (videoProduct.thumbnail) {
        const publicId = extractPublicId(videoProduct.thumbnail);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.log("⚠️ Cloudinary delete error:", err.message);
          }
        }
      }

      // Upload new image
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "videoproducts",
      });

      updatedData.thumbnail = uploadRes.secure_url;

      safeUnlink(req.file.path);
    }

    const updatedVideoProduct = await VideoProduct.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.json({
      message: "Video product updated successfully",
      videoProduct: updatedVideoProduct,
    });
  } catch (error) {
    safeUnlink(req.file?.path);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --------------------------------------------------
// DELETE Video Product (with Cloudinary image delete)
// --------------------------------------------------
export const deleteVideoProduct = async (req, res) => {
  try {
    const deletedVideoProduct = await VideoProduct.findByIdAndDelete(req.params.id);

    if (!deletedVideoProduct)
      return res.status(404).json({ message: "Video product not found" });

    // Delete Cloudinary thumbnail
    if (deletedVideoProduct.thumbnail) {
      const publicId = extractPublicId(deletedVideoProduct.thumbnail);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.log("⚠️ Failed to delete Cloudinary image:", err.message);
        }
      }
    }

    return res.json({ message: "Video product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import Testimonial from "../models/testimonial.js";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js"; // ✅ Correct helper import

// ----------------------------------------------------
// Safe temp file deletion
// ----------------------------------------------------
const safeUnlink = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.log("⚠️ Failed to delete temp file:", err.message);
  }
};

// ----------------------------------------------------
// CREATE TESTIMONIAL
// ----------------------------------------------------
export const createTestimonial = async (req, res) => {
  const { name, title, message } = req.body;

  if (!name || !title || !message) {
    safeUnlink(req.file?.path);
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "Image is required." });
    }

    const uploadRes = await cloudinary.uploader.upload(req.file.path, {
      folder: "spice_testimonials",
      resource_type: "image",
    });

    const newTestimonial = await Testimonial.create({
      name,
      title,
      message,
      image: uploadRes.secure_url,
    });

    safeUnlink(req.file.path);

    return res.status(201).json({
      message: "Testimonial created successfully",
      testimonial: newTestimonial,
    });

  } catch (err) {
    safeUnlink(req.file?.path);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ----------------------------------------------------
// READ ALL TESTIMONIALS
// ----------------------------------------------------
export const getTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 0 } = req.query;

    const options = { sort: { createdAt: -1 } };

    if (Number(limit) > 0) {
      const skip = (Number(page) - 1) * Number(limit);
      const data = await Testimonial.find({}, null, options)
        .skip(skip)
        .limit(Number(limit));

      const total = await Testimonial.countDocuments();

      return res.json({
        data,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    }

    const data = await Testimonial.find({}, null, options);
    return res.json(data);

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ----------------------------------------------------
// READ ONE BY ID
// ----------------------------------------------------
export const getTestimonialById = async (req, res) => {
  try {
    const doc = await Testimonial.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Testimonial not found" });

    return res.json(doc);

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ----------------------------------------------------
// UPDATE TESTIMONIAL
// ----------------------------------------------------
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const current = await Testimonial.findById(id);
    if (!current) {
      safeUnlink(req.file?.path);
      return res.status(404).json({ message: "Testimonial not found" });
    }

    const { name, title, message } = req.body;

    const updates = {
      name: name ?? current.name,
      title: title ?? current.title,
      message: message ?? current.message,
    };

    // ---------------------------------
    // Replace Image if new one uploaded
    // ---------------------------------
    if (req.file?.path) {
      try {
        if (current.image) {
          await deleteCloudinaryImage(current.image);
        }
      } catch (err) {
        console.log("⚠️ Failed to delete old Cloudinary image:", err.message);
      }

      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "spice_testimonials",
        resource_type: "image",
      });

      updates.image = uploadRes.secure_url;

      safeUnlink(req.file.path);
    }

    const updated = await Testimonial.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({
      message: "Testimonial updated successfully",
      testimonial: updated,
    });

  } catch (err) {
    safeUnlink(req.file?.path);
    console.error("❌ Update error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// ----------------------------------------------------
// DELETE TESTIMONIAL
// ----------------------------------------------------
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Testimonial not found" });

    if (deleted.image) {
      try {
        await deleteCloudinaryImage(deleted.image);
      } catch (err) {
        console.log("⚠️ Cloudinary delete error:", err.message);
      }
    }

    return res.json({ message: "Testimonial deleted successfully" });

  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

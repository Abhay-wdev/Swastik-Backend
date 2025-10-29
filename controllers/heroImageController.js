import HeroImage from "../models/HeroImage.js";
import { uploadImage, deleteImage, getPublicIdFromUrl } from "../config/cloudinary.js";

// Get all hero images sorted by sequence
export const getHeroImages = async (req, res) => {
  try {
    const heroImages = await HeroImage.find().sort({ sequence: 1 });
    res.status(200).json(heroImages);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching hero images", 
      error: error.message 
    });
  }
};

// Upload new hero image
export const uploadHeroImages = async (req, res) => {
  try {
    const { link, sequence } = req.body;
    
    // Upload desktop image (required)
    const desktopResult = await uploadImage(req.files.desktopImage[0].path);
    const desktopImageUrl = desktopResult.secure_url;
    const desktopPublicId = desktopResult.public_id;

    // Upload mobile image if provided
    let mobileImageUrl = null;
    let mobilePublicId = null;
    if (req.files.mobileImage && req.files.mobileImage.length > 0) {
      const mobileResult = await uploadImage(req.files.mobileImage[0].path);
      mobileImageUrl = mobileResult.secure_url;
      mobilePublicId = mobileResult.public_id;
    }

    // Create new hero image
    const newHeroImage = new HeroImage({
      desktopImageUrl,
      mobileImageUrl,
      link,
      sequence: sequence ? parseInt(sequence) : 0
    });

    const savedHeroImage = await newHeroImage.save();
    res.status(201).json(savedHeroImage);
  } catch (error) {
    res.status(500).json({ 
      message: "Error uploading hero image", 
      error: error.message 
    });
  }
};

// Update hero image
export const updateHeroImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { link, sequence } = req.body;
    
    const heroImage = await HeroImage.findById(id);
    if (!heroImage) {
      return res.status(404).json({ message: "Hero image not found" });
    }

    // Update desktop image if provided
    if (req.files.desktopImage && req.files.desktopImage.length > 0) {
      // Delete old image
      const desktopPublicId = getPublicIdFromUrl(heroImage.desktopImageUrl);
      await deleteImage(desktopPublicId);
      
      // Upload new image
      const desktopResult = await uploadImage(req.files.desktopImage[0].path);
      heroImage.desktopImageUrl = desktopResult.secure_url;
    }

    // Update mobile image if provided
    if (req.files.mobileImage && req.files.mobileImage.length > 0) {
      // Delete old mobile image if exists
      if (heroImage.mobileImageUrl) {
        const mobilePublicId = getPublicIdFromUrl(heroImage.mobileImageUrl);
        await deleteImage(mobilePublicId);
      }
      
      // Upload new mobile image
      const mobileResult = await uploadImage(req.files.mobileImage[0].path);
      heroImage.mobileImageUrl = mobileResult.secure_url;
    }

    // Update other fields
    if (link) heroImage.link = link;
    if (sequence !== undefined) heroImage.sequence = parseInt(sequence);

    const updatedHeroImage = await heroImage.save();
    res.status(200).json(updatedHeroImage);
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating hero image", 
      error: error.message 
    });
  }
};

// Delete hero image
export const deleteHeroImage = async (req, res) => {
  try {
    const { id } = req.params;
    const heroImage = await HeroImage.findById(id);
    
    if (!heroImage) {
      return res.status(404).json({ message: "Hero image not found" });
    }

    // Delete images from cloud storage
    const desktopPublicId = getPublicIdFromUrl(heroImage.desktopImageUrl);
    await deleteImage(desktopPublicId);
    
    if (heroImage.mobileImageUrl) {
      const mobilePublicId = getPublicIdFromUrl(heroImage.mobileImageUrl);
      await deleteImage(mobilePublicId);
    }

    await HeroImage.findByIdAndDelete(id);
    res.status(200).json({ message: "Hero image deleted successfully" });
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting hero image", 
      error: error.message 
    });
  }
};

// Reorder hero images
export const reorderHeroImages = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, sequence }

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Invalid updates format" });
    }

    // Update each hero image sequence
    const updatePromises = updates.map(update => 
      HeroImage.findByIdAndUpdate(
        update.id, 
        { sequence: update.sequence },
        { new: true, runValidators: true }
      )
    );

    const updatedImages = await Promise.all(updatePromises);
    res.status(200).json(updatedImages);
  } catch (error) {
    res.status(500).json({ 
      message: "Error reordering hero images", 
      error: error.message 
    });
  }
};
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs/promises"; // For file operations

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary
export const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "hero-images", // Optional: organize images in a folder
      use_filename: true,
      unique_filename: false,
    });
    
    // Clean up local file after upload
    await fs.unlink(filePath);
    
    return result;
  } catch (error) {
    // Clean up local file even if upload fails
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error("Error cleaning up file:", cleanupError);
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary using public ID
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

// Extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  try {
    // Split URL to get the path part
    const urlParts = url.split('/');
    // Get the last part (filename with extension)
    const filename = urlParts[urlParts.length - 1];
    // Remove extension and folder structure if present
    const publicId = filename.split('.')[0];
    return publicId;
  } catch (error) {
    throw new Error(`Failed to extract public ID from URL: ${error.message}`);
  }
};

export default cloudinary;
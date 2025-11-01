import Company from "../models/companyModal.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// ==================================================
// CREATE OR UPDATE COMPANY
// ==================================================

export const createOrUpdateCompany = async (req, res) => {
  try {
    let data = { ...req.body };

    // Helper: safely parse JSON values
    const parseIfJSON = (v) => {
      try {
        return typeof v === "string" ? JSON.parse(v) : v;
      } catch {
        return v;
      }
    };

    data.address = parseIfJSON(data.address);
    data.directors = parseIfJSON(data.directors);
    data.socialLinks = parseIfJSON(data.socialLinks);

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Handle file uploads
    const updatedSocialLinks = [...(data.socialLinks || [])];
    
    // ✅ Check if files exist before processing
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          if (file.fieldname === "logo") {
            // Upload company logo
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "company_logos",
            });
            data.logo = result.secure_url;
            
            // Clean up temp file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } else if (file.fieldname.startsWith("socialIcon_")) {
            // Upload dynamic social icons
            const index = parseInt(file.fieldname.split("_")[1]);
            
            // ✅ Ensure index is valid
            if (!isNaN(index) && index >= 0 && index < updatedSocialLinks.length) {
              const result = await cloudinary.uploader.upload(file.path, {
                folder: "company_social_icons",
              });
              
              if (!updatedSocialLinks[index]) {
                updatedSocialLinks[index] = {};
              }
              updatedSocialLinks[index].logoimage = result.secure_url;
              
              // Clean up temp file
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            }
          }
        } catch (uploadError) {
          console.error("❌ File upload error:", uploadError);
          // Clean up temp file on error
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    data.socialLinks = updatedSocialLinks;

    // ✅ Required field validation
    const requiredFields = [
      "name",
      "email",
      "phone",
      "address.street",
      "address.city",
      "address.state",
      "address.country",
      "address.postalCode",
    ];

    for (const field of requiredFields) {
      const parts = field.split(".");
      const value =
        parts.length > 1 ? data[parts[0]]?.[parts[1]] : data[parts[0]];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }

    // ✅ Validate directors array
    if (data.directors && Array.isArray(data.directors)) {
      data.directors = data.directors.filter(dir => dir.name && dir.name.trim() !== '');
    }

    // ✅ Validate social links array
    if (data.socialLinks && Array.isArray(data.socialLinks)) {
      data.socialLinks = data.socialLinks.filter(
        link => link.social || link.link || link.logoimage
      );
    }

    // ✅ Allow only one company entry
    let company = await Company.findOne();
    if (company) {
      company = await Company.findByIdAndUpdate(company._id, data, {
        new: true,
        runValidators: true,
      });
      return res.status(200).json({
        success: true,
        message: "Company details updated successfully",
        company,
      });
    }

    const newCompany = await Company.create({
      ...data,
      createdBy: req.user?._id || null,
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      company: newCompany,
    });
  } catch (error) {
    console.error("❌ Company create/update error:", error);
    
    // ✅ Clean up any temp files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create or update company",
      error: error.message,
    });
  }
};

// ==================================================
// GET ALL COMPANIES
// ==================================================
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, companies });
  } catch (error) {
    console.error("❌ Fetch companies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
      error: error.message,
    });
  }
};

// ==================================================
// GET SINGLE COMPANY
// ==================================================
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({ success: true, company });
  } catch (error) {
    console.error("❌ Fetch company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company",
      error: error.message,
    });
  }
};

// ==================================================
// DELETE COMPANY
// ==================================================
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    // ✅ Optional: Delete associated images from Cloudinary
    if (company.logo) {
      try {
        const publicId = company.logo.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Error deleting logo:", err);
      }
    }

    if (company.socialLinks && company.socialLinks.length > 0) {
      for (const link of company.socialLinks) {
        if (link.logoimage) {
          try {
            const publicId = link.logoimage.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Error deleting social icon:", err);
          }
        }
      }
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete company",
      error: error.message,
    });
  }
};
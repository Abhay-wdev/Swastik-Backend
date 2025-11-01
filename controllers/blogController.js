import Blog from "../models/blogModel.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
// ========================
// 🟢 Create Blog
// ========================
export const createBlog = async (req, res) => {
  try {
    const { title, content, author, htmlContent, category, tags, isPublished } =
      req.body;

    let imageUrl = "";

    // 🖼️ Upload image if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "blogs",
      });
      imageUrl = result.secure_url;
    }

    // 🧩 Parse content safely
    let parsedContent = content;
    if (typeof content === "string") {
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = {
          blocks: [{ type: "paragraph", data: { text: content } }],
        };
      }
    }

    const newBlog = await Blog.create({
      title,
      content: parsedContent,
      htmlContent,
      author,
      category,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      isPublished: isPublished === "true" || isPublished === true,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "✅ Blog created successfully",
      data: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 🟡 Get All Blogs
// ========================
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 🟡 Get Blog by ID
// ========================
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res.status(404).json({ success: false, message: "Blog not found" });

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 🟡 Get Blog by Slug
// ========================
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog)
      return res.status(404).json({ success: false, message: "Blog not found" });

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 🔵 Update Blog
// ========================
// ✅ Update Blog Controller
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    // 🧩 Find existing blog
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const { title, author, category, tags, htmlContent, isPublished } = req.body;

    // 🧠 Handle content safely
    let content = req.body.content;
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        content = blog.content; // fallback
      }
    }

    // 🧩 Prepare update fields
    const updateData = {
      title: title || blog.title,
      author: author || blog.author,
      category: category || blog.category,
      tags: tags
        ? tags.split(",").map((t) => t.trim())
        : blog.tags,
      htmlContent: htmlContent || blog.htmlContent,
      content,
      isPublished:
        isPublished === "true" || isPublished === true
          ? true
          : isPublished === "false" || isPublished === false
          ? false
          : blog.isPublished,
    };

    // 🖼️ If a new image is uploaded
    if (req.file) {
      // 1️⃣ Delete old image from Cloudinary
      if (blog.image) {
        try {
          // Extract public ID (handle both folder & direct URLs)
          const parts = blog.image.split("/");
          const publicIdWithExt = parts[parts.length - 1];
          const publicId = "blogs/" + publicIdWithExt.split(".")[0];

          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("⚠️ Error deleting old image:", err.message);
        }
      }

      // 2️⃣ Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "blogs",
      });

      // 3️⃣ Assign new image URL
      updateData.image = result.secure_url;

      // 4️⃣ Clean up local file (optional)
      fs.unlinkSync(req.file.path);
    }

    // 🧩 Update slug if title changed
    if (title && title !== blog.title) {
      updateData.slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // ✅ Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Update Blog Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ========================
// 🔴 Delete Blog
// ========================
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res.status(404).json({ success: false, message: "Blog not found" });

    // Delete associated image
    if (blog.image) {
      const publicId = blog.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`blogs/${publicId}`);
    }

    await blog.deleteOne();
    res.json({
      success: true,
      message: "🗑️ Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

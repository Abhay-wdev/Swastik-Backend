import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Editor.js / Quill JSON data
    content: {
      type: Object,
      required: true,
    },

    // Pre-rendered HTML version
    htmlContent: {
      type: String,
      required: false,
    },

    // Cover image
    image: {
      type: String,
      default: "",
    },

    author: {
      type: String,
      default: "Anonymous",
    },

    category: {
      type: String,
      default: "General",
    },

    tags: [
      {
        type: String,
      },
    ],

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 🔁 Auto-generate unique slug
blogSchema.pre("save", async function (next) {
  if (!this.isModified("title") && this.slug) return next();

  let baseSlug = this.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let counter = 1;

  // ensure uniqueness
  const Blog = mongoose.models.Blog;
  while (await Blog.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
  next();
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);
export default Blog;

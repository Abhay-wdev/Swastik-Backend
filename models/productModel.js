import mongoose from "mongoose";

const sweetProductSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    brand: {
      type: String,
    },
    manufacturer: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    shortdescription: {
      type: String,
      required: true,
    },
    ingredients: [
      {
        type: String,
      },
    ],
    shelfLife: {
      type: String, // e.g. "7 Days"
    },
    storageInstructions: {
      type: String,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    subCategorySlug: { type: String }, // 👈 Add this
    allergenInfo: {
      type: String,
    },
    nutritionalInfo: {
      per: { type: String, default: "100g" },
      values: [
        {
          name: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
    },
    weight: {
      type: String,
      required: true,
      default: "0g",
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    images: [
      {
        type: String, // Cloudinary image URLs
      },
    ],
    priorityNumber: {
    type: Number,
    default: 0, // 0 = lowest priority
    required: false
  },
    availabilityStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock", "Limited"],
      default: "In Stock",
    },
    availabeQuantity: {
      type: Number,
      default: 0,
    },
    ratings: {
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    technicalDetails: {
      packagingType: { type: String },
      countryOfOrigin: { type: String },
      itemForm: { type: String },
    },
    faq: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", sweetProductSchema);
export default Product;

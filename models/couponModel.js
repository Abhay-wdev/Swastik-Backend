import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    value: { type: Number, required: true },
    maxDiscount: Number,
    minOrderAmount: Number,
    startDate: Date,
    expiryDate: Date,
    usageLimit: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    description: String,
    validationNotes: [String],
    images: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);

import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productSnapshot: {
      name: { type: String, required: true },
      slug: { type: String },
      category: { type: String },
      subCategory: { type: String },
    },
    variant: { type: String },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true },
    discountedPrice: { type: Number },
    tax: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    sku: { type: String, uppercase: true },
    weight: { type: Number },
    image: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"],
      default: "Pending",
    },
    deliveryDate: Date,
    deliveredAt: Date,
    returnEligibleTill: Date,
  },
  { timestamps: true }
);

orderItemSchema.pre("validate", function (next) {
  const price = this.discountedPrice || this.price;
  this.subtotal = price * this.quantity;
  next();
});

export default mongoose.model("OrderItem", orderItemSchema);

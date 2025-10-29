import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Snapshot of product details at the time item added to cart
    productSnapshot: {
      name: { type: String, required: true },
      slug: { type: String },
      category: { type: String },
      subCategory: { type: String },
      price: { type: Number, required: true },
      image: { type: String },
      stock: { type: Number, default: 0 },
      weight: { type: String },
    },

    // Optional variant (e.g., size, color)
    variant: {
      type: Map,
      of: String, // flexible for { size: 'L', color: 'Red' }
      default: {},
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-calculate subtotal before saving
cartItemSchema.pre("validate", function (next) {
  this.subtotal = this.quantity * this.productSnapshot.price;
  next();
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [cartItemSchema],

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrice: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "ordered", "abandoned"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Recalculate totals before saving
cartSchema.pre("save", function (next) {
  let total = this.items.reduce((acc, item) => acc + item.subtotal, 0);
  this.totalPrice = total;
  this.grandTotal = total - (this.discount || 0);
  next();
});

// Method: apply a coupon dynamically
cartSchema.methods.applyCoupon = async function (coupon) {
  if (!coupon) return;

  // Example: Check expiry
  if (coupon.expiry && new Date() > new Date(coupon.expiry)) {
    throw new Error("Coupon has expired.");
  }

  // Example: Check min order requirement
  if (coupon.minAmount && this.totalPrice < coupon.minAmount) {
    throw new Error(`Minimum order amount for this coupon is ₹${coupon.minAmount}`);
  }

  // Apply discount
  this.coupon = coupon._id;
  this.discount = coupon.discountValue || 0;
  this.grandTotal = this.totalPrice - this.discount;
  await this.save();
};

export default mongoose.model("Cart", cartSchema);

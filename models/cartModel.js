import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Snapshot of product details at the time added
    productSnapshot: {
      name: { type: String, required: true },
      slug: { type: String },
      category: { type: String },
      subCategory: { type: String },
      price: { type: Number, required: true }, // actual product price
      discountPrice: { type: Number, default: 0 }, // discounted price
      image: { type: String },
      stock: { type: Number, default: 0 },
      weight: { type: String },
    },

    // Optional variant (size, color, etc.)
    variant: {
      type: Map,
      of: String,
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

    // ✅ total discount applied on this item
    itemDiscount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-calculate subtotal and discount before saving
cartItemSchema.pre("validate", function (next) {
  const actualPrice = this.productSnapshot.price;
  const discountedPrice = this.productSnapshot.discountPrice || actualPrice;

  this.itemDiscount = (actualPrice - discountedPrice) * this.quantity;
  this.subtotal = discountedPrice * this.quantity;

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

    // total discount = product discounts only
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

// ✅ Auto-calculate totals before saving
cartSchema.pre("save", function (next) {
  const productTotal = this.items.reduce((acc, item) => acc + item.subtotal, 0);
  const productDiscounts = this.items.reduce((acc, item) => acc + item.itemDiscount, 0);

  this.totalPrice = productTotal + productDiscounts; // total original prices
  this.discount = productDiscounts; // only product-level discounts
  this.grandTotal = productTotal; // final amount after discounts

  next();
});

export default mongoose.model("Cart", cartSchema);

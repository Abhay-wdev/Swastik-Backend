import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "OrderItem", required: true }],
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: "UserShippingAddress", required: true },
    billingAddress: { type: mongoose.Schema.Types.ObjectId, ref: "UserHomeAddress" },
     
    paymentAttempts: [{ type: mongoose.Schema.Types.ObjectId, ref: "PaymentAttempt" }],
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned", "Refunded"],
      default: "Pending",
    },
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "OrderHistory" }],
    returns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Return" }],
    notes: String,
    isDeleted: { type: Boolean, default: false },
    analytics: {
      source: String,
      device: String,
      campaignId: String,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1, orderNumber: 1 });

export default mongoose.model("Order", orderSchema);

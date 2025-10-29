import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    returnId: { type: String, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, maxlength: 300 },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
        priceAtPurchase: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    refundAmount: { type: Number },
    refundMethod: {
      type: String,
      enum: ["Original Payment Method", "Store Credit", "Manual"],
      default: "Original Payment Method",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Requested", "Under Review", "Approved", "Rejected", "Refunded"],
      default: "Requested",
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: Date,
    rejectionReason: String,
    notes: String,
    images: [{ url: String, publicId: String }],
    logistics: {
      pickupScheduled: { type: Boolean, default: false },
      pickupDate: Date,
      courierPartner: String,
      trackingId: String,
    },
  },
  { timestamps: true }
);

returnSchema.pre("save", function (next) {
  if (!this.returnId) this.returnId = `RET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  next();
});

export default mongoose.model("Return", returnSchema);

import mongoose from "mongoose";

const orderHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned", "Refunded"],
      default: "Pending",
    },
    previousStatus: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: String,
    reason: String,
    source: { type: String, enum: ["System", "Admin", "Customer", "Auto"], default: "System" },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

orderHistorySchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.model("OrderHistory", orderHistorySchema);

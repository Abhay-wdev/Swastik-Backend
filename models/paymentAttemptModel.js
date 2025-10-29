import mongoose from "mongoose";

const paymentAttemptSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, enum: ["UPI", "Card", "NetBanking", "Wallet", "COD", "Other"], default: "Other" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["Pending", "Completed", "Failed", "Refunded"], default: "Pending" },
    response: { type: mongoose.Schema.Types.Mixed, default: {} },
    attemptCount: { type: Number, default: 1 },
    transactionDate: { type: Date, default: Date.now },
    completedAt: Date,
    failureReason: String,
  },
  { timestamps: true }
);

export default mongoose.model("PaymentAttempt", paymentAttemptSchema);

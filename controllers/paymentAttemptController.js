import mongoose from "mongoose";
import PaymentAttempt from "../models/paymentAttemptModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

// ===============================
// CREATE PAYMENT ATTEMPT
// ===============================
export const createPaymentAttempt = async (req, res) => {
  try {
    const data = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(data.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Check if user exists
    const user = await User.findById(data.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if order exists
    const order = await Order.findById(data.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const newPayment = new PaymentAttempt(data);
    const savedPayment = await newPayment.save();

    res.status(201).json({ message: "Payment attempt created successfully", data: savedPayment });
  } catch (error) {
    res.status(500).json({ message: "Error creating payment attempt", error: error.message });
  }
};

// ===============================
// GET ALL PAYMENT ATTEMPTS
// ===============================
export const getAllPaymentAttempts = async (req, res) => {
  try {
    const payments = await PaymentAttempt.find()
      .populate("userId", "name email")
      .populate("orderId", "orderId")
      .sort({ createdAt: -1 });

    res.status(200).json({ data: payments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment attempts", error: error.message });
  }
};

// ===============================
// GET PAYMENT ATTEMPT BY ID
// ===============================
export const getPaymentAttemptById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment attempt ID" });
    }

    const payment = await PaymentAttempt.findById(id)
      .populate("userId", "name email")
      .populate("orderId", "orderId");

    if (!payment) return res.status(404).json({ message: "Payment attempt not found" });

    res.status(200).json({ data: payment });
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment attempt", error: error.message });
  }
};

// ===============================
// UPDATE PAYMENT ATTEMPT
// ===============================
export const updatePaymentAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment attempt ID" });
    }

    // Optional: validate userId or orderId if updated
    if (updateData.userId && !mongoose.Types.ObjectId.isValid(updateData.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (updateData.orderId && !mongoose.Types.ObjectId.isValid(updateData.orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const updatedPayment = await PaymentAttempt.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedPayment) return res.status(404).json({ message: "Payment attempt not found" });

    res.status(200).json({ message: "Payment attempt updated successfully", data: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: "Error updating payment attempt", error: error.message });
  }
};

// ===============================
// DELETE PAYMENT ATTEMPT
// ===============================
export const deletePaymentAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment attempt ID" });
    }

    const deletedPayment = await PaymentAttempt.findByIdAndDelete(id);
    if (!deletedPayment) return res.status(404).json({ message: "Payment attempt not found" });

    res.status(200).json({ message: "Payment attempt deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting payment attempt", error: error.message });
  }
};

import mongoose from "mongoose";
 import OrderHistory from "../models/orderHistoryModel.js";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";

// ===============================
// CREATE ORDER HISTORY ENTRY
// ===============================
export const createOrderHistory = async (req, res) => {
  try {
    const data = req.body;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Validate updatedBy (user)
    if (!mongoose.Types.ObjectId.isValid(data.updatedBy)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if order exists
    const order = await Order.findById(data.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user exists
    const user = await User.findById(data.updatedBy);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newHistory = new OrderHistory(data);
    const savedHistory = await newHistory.save();

    res.status(201).json({ message: "Order history entry created successfully", data: savedHistory });
  } catch (error) {
    res.status(500).json({ message: "Error creating order history", error: error.message });
  }
};

// ===============================
// GET ALL HISTORY ENTRIES
// ===============================
export const getAllOrderHistories = async (req, res) => {
  try {
    const histories = await OrderHistory.find()
      .populate("orderId", "orderId") // optional: populate order details
      .populate("updatedBy", "name email") // optional: populate user info
      .sort({ createdAt: -1 });

    res.status(200).json({ data: histories });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order histories", error: error.message });
  }
};

// ===============================
// GET HISTORY BY ID
// ===============================
export const getOrderHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid history ID" });
    }

    const history = await OrderHistory.findById(id)
      .populate("orderId", "orderId")
      .populate("updatedBy", "name email");

    if (!history) return res.status(404).json({ message: "Order history not found" });

    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order history", error: error.message });
  }
};

// ===============================
// UPDATE ORDER HISTORY ENTRY
// ===============================
export const updateOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid history ID" });
    }

    // Optional: validate updatedBy if provided
    if (updateData.updatedBy && !mongoose.Types.ObjectId.isValid(updateData.updatedBy)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updatedHistory = await OrderHistory.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedHistory) return res.status(404).json({ message: "Order history not found" });

    res.status(200).json({ message: "Order history updated successfully", data: updatedHistory });
  } catch (error) {
    res.status(500).json({ message: "Error updating order history", error: error.message });
  }
};

// ===============================
// DELETE ORDER HISTORY ENTRY
// ===============================
export const deleteOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid history ID" });
    }

    const deletedHistory = await OrderHistory.findByIdAndDelete(id);
    if (!deletedHistory) return res.status(404).json({ message: "Order history not found" });

    res.status(200).json({ message: "Order history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order history", error: error.message });
  }
};

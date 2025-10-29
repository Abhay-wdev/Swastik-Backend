import mongoose from "mongoose";
import ReturnModel from "../models/returnModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

// ===============================
// CREATE RETURN REQUEST
// ===============================
export const createReturnRequest = async (req, res) => {
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
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if order exists
    const order = await Order.findById(data.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Optional: calculate totalAmount if not provided
    if (!data.totalAmount && data.items && data.items.length > 0) {
      data.totalAmount = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    }

    const newReturn = new ReturnModel(data);
    const savedReturn = await newReturn.save();

    res.status(201).json({ message: "Return request created successfully", data: savedReturn });
  } catch (error) {
    res.status(500).json({ message: "Error creating return request", error: error.message });
  }
};

// ===============================
// GET ALL RETURN REQUESTS
// ===============================
export const getAllReturns = async (req, res) => {
  try {
    const returns = await ReturnModel.find().sort({ createdAt: -1 });
    res.status(200).json({ data: returns });
  } catch (error) {
    res.status(500).json({ message: "Error fetching returns", error: error.message });
  }
};

// ===============================
// GET RETURN BY ID
// ===============================
export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid return ID" });
    }

    const returnRequest = await ReturnModel.findById(id);
    if (!returnRequest) return res.status(404).json({ message: "Return request not found" });

    res.status(200).json({ data: returnRequest });
  } catch (error) {
    res.status(500).json({ message: "Error fetching return request", error: error.message });
  }
};

// ===============================
// UPDATE RETURN REQUEST
// ===============================
export const updateReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid return ID" });
    }

    // Optional: if updating user or order, validate them
    if (updateData.userId && !mongoose.Types.ObjectId.isValid(updateData.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (updateData.orderId && !mongoose.Types.ObjectId.isValid(updateData.orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const updatedReturn = await ReturnModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedReturn) return res.status(404).json({ message: "Return request not found" });

    res.status(200).json({ message: "Return request updated successfully", data: updatedReturn });
  } catch (error) {
    res.status(500).json({ message: "Error updating return request", error: error.message });
  }
};

// ===============================
// DELETE RETURN REQUEST
// ===============================
export const deleteReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid return ID" });
    }

    const deletedReturn = await ReturnModel.findByIdAndDelete(id);
    if (!deletedReturn) return res.status(404).json({ message: "Return request not found" });

    res.status(200).json({ message: "Return request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting return request", error: error.message });
  }
};

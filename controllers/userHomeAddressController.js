import mongoose from "mongoose";
import UserHomeAddress from "../models/userHomeAddressModel.js";
import User from "../models/userModel.js"; // Make sure this path matches your project

// ===============================
// CREATE HOME ADDRESS
// ===============================
export const createHomeAddress = async (req, res) => {
  try {
    const data = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(data.user)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if user exists
    const existingUser = await User.findById(data.user);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If isDefault is true, unset previous default addresses
    if (data.isDefault) {
      await UserHomeAddress.updateMany(
        { user: data.user },
        { $set: { isDefault: false } }
      );
    }

    // Create new address
    const newAddress = new UserHomeAddress(data);
    const savedAddress = await newAddress.save();

    res.status(201).json({ message: "Address created successfully", data: savedAddress });
  } catch (error) {
    res.status(500).json({ message: "Error creating address", error: error.message });
  }
};

// ===============================
// GET ALL HOME ADDRESSES FOR A USER
// ===============================
export const getUserHomeAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const addresses = await UserHomeAddress.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: addresses });
  } catch (error) {
    res.status(500).json({ message: "Error fetching addresses", error: error.message });
  }
};

// ===============================
// GET SINGLE HOME ADDRESS BY ID
// ===============================
export const getHomeAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const address = await UserHomeAddress.findById(id);
    if (!address) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ data: address });
  } catch (error) {
    res.status(500).json({ message: "Error fetching address", error: error.message });
  }
};

// ===============================
// UPDATE HOME ADDRESS
// ===============================
export const updateHomeAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const currentAddress = await UserHomeAddress.findById(id);
    if (!currentAddress) return res.status(404).json({ message: "Address not found" });

    // If isDefault is true, unset previous default addresses
    if (updateData.isDefault) {
      await UserHomeAddress.updateMany(
        { user: currentAddress.user, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    const updatedAddress = await UserHomeAddress.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: "Address updated successfully", data: updatedAddress });
  } catch (error) {
    res.status(500).json({ message: "Error updating address", error: error.message });
  }
};

// ===============================
// DELETE HOME ADDRESS
// ===============================
export const deleteHomeAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const deletedAddress = await UserHomeAddress.findByIdAndDelete(id);
    if (!deletedAddress) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting address", error: error.message });
  }
};

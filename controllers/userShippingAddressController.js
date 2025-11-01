import mongoose from "mongoose";
import UserShippingAddress from "../models/userShippingAddressModel.js";
import User from "../models/userModel.js"; // Make sure this path is correct

// ===============================
// CREATE SHIPPING ADDRESS
// ===============================
export const createShippingAddress = async (req, res) => {
  try {
    const data = req.body;

    // ✅ Validate userId
    if (!mongoose.Types.ObjectId.isValid(data.user)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // ✅ Check if user exists
    const existingUser = await User.findById(data.user);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Validate paymentMethod
    const validPaymentMethods = ["COD", "Online", "Card", "UPI", "NetBanking"];
    if (data.paymentMethod && !validPaymentMethods.includes(data.paymentMethod)) {
      return res.status(400).json({
        message: `Invalid payment method. Allowed: ${validPaymentMethods.join(", ")}`,
      });
    }

    // ✅ If isDefault is true, unset previous default addresses
    if (data.isDefault) {
      await UserShippingAddress.updateMany(
        { user: data.user },
        { $set: { isDefault: false } }
      );
    }

    // ✅ Create new address with payment method
    const newAddress = new UserShippingAddress({
      ...data,
      paymentMethod: data.paymentMethod || "COD", // default fallback
    });

    const savedAddress = await newAddress.save();
    res
      .status(201)
      .json({ message: "Address created successfully", data: savedAddress });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating address", error: error.message });
  }
};

// ===============================
// GET ALL ADDRESSES FOR A USER
// ===============================
export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const addresses = await UserShippingAddress.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ data: addresses });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching addresses", error: error.message });
  }
};

// ===============================
// GET SINGLE ADDRESS BY ID
// ===============================
export const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const address = await UserShippingAddress.findById(id);
    if (!address)
      return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ data: address });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching address", error: error.message });
  }
};

// ===============================
// UPDATE SHIPPING ADDRESS
// ===============================
export const updateShippingAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const currentAddress = await UserShippingAddress.findById(id);
    if (!currentAddress)
      return res.status(404).json({ message: "Address not found" });

    // ✅ Validate payment method if provided
    const validPaymentMethods = ["COD", "Online", "Card", "UPI", "NetBanking"];
    if (
      updateData.paymentMethod &&
      !validPaymentMethods.includes(updateData.paymentMethod)
    ) {
      return res.status(400).json({
        message: `Invalid payment method. Allowed: ${validPaymentMethods.join(", ")}`,
      });
    }

    // ✅ Handle default address switch
    if (updateData.isDefault) {
      await UserShippingAddress.updateMany(
        { user: currentAddress.user, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    // ✅ Update address (including payment method)
    const updatedAddress = await UserShippingAddress.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating address", error: error.message });
  }
};

// ===============================
// DELETE SHIPPING ADDRESS
// ===============================
export const deleteShippingAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const deletedAddress = await UserShippingAddress.findByIdAndDelete(id);
    if (!deletedAddress)
      return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting address", error: error.message });
  }
};

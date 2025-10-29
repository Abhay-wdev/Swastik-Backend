import mongoose from "mongoose";
import OrderItem from "../models/orderItemModel.js";
import Product from "../models/productModel.js"; // Make sure this path is correct

// ===============================
// CREATE ORDER ITEM
// ===============================
export const createOrderItem = async (req, res) => {
  try {
    const data = req.body;

    // Validate product ObjectId
    if (!mongoose.Types.ObjectId.isValid(data.product)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if product exists
    const product = await Product.findById(data.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Prepare product snapshot
    const snapshot = {
      name: product.name,
      slug: product.slug,
      category: product.category?.toString() || "",
      subCategory: product.subCategory?.toString() || "",
    };

    // Calculate subtotal (price * quantity)
    const price = data.discountedPrice || data.price || product.price || 0;
    const subtotal = price * (data.quantity || 1);

    // Create new order item
    const newOrderItem = new OrderItem({
      ...data,
      productSnapshot: snapshot,
      subtotal,
    });

    const savedOrderItem = await newOrderItem.save();
    res.status(201).json({ message: "Order item created successfully", data: savedOrderItem });
  } catch (error) {
    res.status(500).json({ message: "Error creating order item", error: error.message });
  }
};

// ===============================
// GET ALL ORDER ITEMS
// ===============================
export const getAllOrderItems = async (req, res) => {
  try {
    const items = await OrderItem.find().sort({ createdAt: -1 });
    res.status(200).json({ data: items });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order items", error: error.message });
  }
};

// ===============================
// GET ORDER ITEM BY ID
// ===============================
export const getOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order item ID" });
    }

    const item = await OrderItem.findById(id);
    if (!item) return res.status(404).json({ message: "Order item not found" });

    res.status(200).json({ data: item });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order item", error: error.message });
  }
};

// ===============================
// UPDATE ORDER ITEM
// ===============================
export const updateOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order item ID" });
    }

    // If updating product, validate it
    if (updateData.product) {
      if (!mongoose.Types.ObjectId.isValid(updateData.product)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await Product.findById(updateData.product);
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Update product snapshot
      updateData.productSnapshot = {
        name: product.name,
        slug: product.slug,
        category: product.category?.toString() || "",
        subCategory: product.subCategory?.toString() || "",
      };
    }

    // Recalculate subtotal if quantity or price is updated
    if (updateData.quantity || updateData.price || updateData.discountedPrice) {
      const item = await OrderItem.findById(id);
      const price = updateData.discountedPrice || updateData.price || item.price;
      const quantity = updateData.quantity || item.quantity;
      updateData.subtotal = price * quantity;
    }

    const updatedItem = await OrderItem.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedItem) return res.status(404).json({ message: "Order item not found" });

    res.status(200).json({ message: "Order item updated successfully", data: updatedItem });
  } catch (error) {
    res.status(500).json({ message: "Error updating order item", error: error.message });
  }
};

// ===============================
// DELETE ORDER ITEM
// ===============================
export const deleteOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order item ID" });
    }

    const deletedItem = await OrderItem.findByIdAndDelete(id);
    if (!deletedItem) return res.status(404).json({ message: "Order item not found" });

    res.status(200).json({ message: "Order item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order item", error: error.message });
  }
};

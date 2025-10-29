

import Order from "../models/orderModel.js";
import mongoose from "mongoose";

// ===============================
// CREATE ORDER
// ===============================
export const createOrder = async (req, res) => {
  try {
    const { user, orderItems, shippingAddress, billingAddress, paymentMethod, taxPrice, shippingPrice, discount, coupon } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Order must contain at least 1 item." });
    }

    const totalPrice = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0) + taxPrice + shippingPrice - (discount || 0);

    const order = await Order.create({
      orderNumber: `ORD-${Date.now()}`,
      user,
      orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      discount: discount || 0,
      coupon,
      totalPrice,
      status: "Pending",
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET ORDER BY ID
// ===============================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid order ID." });

    const order = await Order.findById(id).populate("user", "name email").populate("orderItems.product", "name price");
    if (!order) return res.status(404).json({ message: "Order not found." });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET ORDERS FOR USER
// ===============================
export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET ALL ORDERS (Admin)
// ===============================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// UPDATE ORDER STATUS
// ===============================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.status = status;
    order.orderHistory.push({ status, note });
    if (status === "Delivered") order.isDelivered = true, order.deliveredAt = Date.now();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ADD PAYMENT ATTEMPT
// ===============================
export const addPaymentAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.paymentAttempts.push(paymentData);
    if (paymentData.status === "Completed") order.isPaid = true, order.paidAt = Date.now();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// APPLY COUPON
// ===============================
export const applyCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const couponData = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.coupon = couponData;
    const orderItemsTotal = order.orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    let discountAmount = 0;

    if (couponData.type === "Percentage") {
      discountAmount = (orderItemsTotal * couponData.value) / 100;
      if (couponData.maxDiscount) discountAmount = Math.min(discountAmount, couponData.maxDiscount);
    } else {
      discountAmount = couponData.value;
    }

    order.discount = discountAmount;
    order.totalPrice = orderItemsTotal + order.taxPrice + order.shippingPrice - discountAmount;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ADD RETURN / REFUND REQUEST
// ===============================
export const addReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const returnData = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.returns.push(returnData);
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// SOFT DELETE ORDER
// ===============================
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.isDeleted = true;
    await order.save();

    res.json({ message: "Order soft deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

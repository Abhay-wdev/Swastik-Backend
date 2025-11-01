import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import UserShippingAddress from "../models/userShippingAddressModel.js";

// -------------------- PLACE ORDER --------------------
export const placeOrder = async (req, res) => {
  try {
    const { userId, addressId } = req.body;

    // Validate address
    const address = await UserShippingAddress.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Shipping address not found" });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Prepare order items
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      name: item.productSnapshot.name,
      price: item.productSnapshot.price,
      discountPrice: item.productSnapshot.discountPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      variant: item.variant,
      image: item.productSnapshot.image,
    }));

    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      address: address._id,
      totalPrice: cart.totalPrice,
      discount: cart.discount,
      grandTotal: cart.grandTotal,
      paymentStatus: "pending",
      orderStatus: "processing",
    });

    // Clear cart after order
    cart.items = [];
    cart.totalPrice = 0;
    cart.discount = 0;
    cart.grandTotal = 0;
    cart.status = "ordered";
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({
      success: false,
      message: "Error placing order",
      error: error.message,
    });
  }
};

// -------------------- GET ALL ORDERS (Admin) --------------------
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching all orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// -------------------- GET USER ORDERS --------------------
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ user: userId })
      .populate("address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
};

// -------------------- GET SINGLE ORDER --------------------
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "name email")
      .populate("address");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// -------------------- UPDATE ORDER --------------------
export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// -------------------- DELETE ORDER --------------------
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

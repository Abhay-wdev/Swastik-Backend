import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import mongoose from "mongoose";

// ===============================
// 🛒 1. Get Cart by User
// ===============================
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId })
      .populate("items.product", "name price slug")
      .populate("coupon");

    if (!cart)
      return res.status(404).json({ success: false, message: "Cart not found" });

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// 🧾 2. Add Item to Cart
// ===============================
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1, variant = {} } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    // Find or create a cart for this user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if the product already exists in the cart (same product + same variant)
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      // Snapshot product details
      const productSnapshot = {
        name: product.name,
        slug: product.slug,
        category: product.category?.toString() || "",
        subCategory: product.subCategory?.toString() || "",
        price: product.price,
        image: product.images?.[0] || "",
        stock: product.stock || 0,
        weight: product.weight || "",
      };

      cart.items.push({
        product: product._id,
        productSnapshot,
        quantity,
        variant,
      });
    }

    await cart.save();
    return res.status(200).json({ success: true, message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// 🧮 3. Update Item Quantity
// ===============================
export const updateCartItem = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (quantity < 1)
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(
      (i) => i.product.toString() === productId.toString()
    );

    if (!item)
      return res.status(404).json({ success: false, message: "Item not found in cart" });

    item.quantity = quantity;
    await cart.save();

    return res.status(200).json({ success: true, message: "Cart updated", cart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// ❌ 4. Remove Item from Cart
// ===============================
export const removeCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await cart.save();
    return res.status(200).json({ success: true, message: "Item removed", cart });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// 🧹 5. Clear Cart
// ===============================
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = [];
    cart.discount = 0;
    cart.coupon = null;
    cart.totalPrice = 0;
    cart.grandTotal = 0;

    await cart.save();
    return res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// 🎟️ 6. Apply Coupon
// ===============================
export const applyCoupon = async (req, res) => {
  try {
    const { userId, couponCode } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon)
      return res.status(404).json({ success: false, message: "Invalid coupon" });

    // Validate expiry
    if (coupon.expiry && new Date() > new Date(coupon.expiry))
      return res.status(400).json({ success: false, message: "Coupon expired" });

    // Validate minAmount
    if (coupon.minAmount && cart.totalPrice < coupon.minAmount)
      return res.status(400).json({
        success: false,
        message: `Minimum order ₹${coupon.minAmount} required for this coupon.`,
      });

    cart.discount = coupon.discountValue;
    cart.coupon = coupon._id;
    cart.grandTotal = cart.totalPrice - coupon.discountValue;

    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      cart,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

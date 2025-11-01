import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";

// ===============================
// 🛒 1. Get Cart by User
// ===============================
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      "name price slug discount"
    );

    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

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
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // ✅ Calculate discounted price
    const discountedPrice = product.discount
      ? Math.round(product.price - (product.price * product.discount) / 100)
      : product.price;

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    // Check for existing item
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const productSnapshot = {
        name: product.name,
        slug: product.slug,
        category: product.category?.toString() || "",
        subCategory: product.subCategory?.toString() || "",
        price: product.price,
        discountPrice: discountedPrice,
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
    return res
      .status(200)
      .json({ success: true, message: "Item added to cart", cart });
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
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart)
      return res.status(404).json({ success: false, message: "Cart not found" });

    const normalizedProductId =
      typeof productId === "object" && productId._id
        ? productId._id
        : productId;

    const item = cart.items.find(
      (i) => i.product._id.toString() === normalizedProductId.toString()
    );

    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });

    // ✅ Recheck product price/discount
    const product = await Product.findById(normalizedProductId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const discountedPrice = product.discount
      ? Math.round(product.price - (product.price * product.discount) / 100)
      : product.price;

    // ✅ Update item data
    item.productSnapshot.price = product.price;
    item.productSnapshot.discountPrice = discountedPrice;
    item.quantity = quantity;

    // Subtotal and itemDiscount will be recalculated automatically by pre-save hook
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
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
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await cart.save();
    return res
      .status(200)
      .json({ success: true, message: "Item removed from cart", cart });
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

    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    cart.items = [];
    cart.discount = 0;
    cart.totalPrice = 0;
    cart.grandTotal = 0;

    await cart.save();
    return res
      .status(200)
      .json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

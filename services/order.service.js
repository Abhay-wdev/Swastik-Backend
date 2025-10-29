// services/order.service.js
import mongoose from "mongoose";
import Order from "../models/order/order.model.js";
import OrderItemSchema from "../models/order/orderItem.model.js"; // if you keep as schema import
import Product from "../models/product/product.model.js";
import PaymentAttempt from "../models/payment/paymentAttempt.model.js";
import ReturnModel from "../models/order/return.model.js";
import { createHistoryEntry, addPaymentAttempt, createReturnRecord, runTransaction } from "./helpers.js";
import Coupon from "../models/coupon.model.js";
import OrderHistory from "../models/order/orderHistory.model.js";

/**
 * Create order (atomic):
 * - Validate addresses/products
 * - Reserve / decrement stock (or mark reserved)
 * - Apply coupon validation/discount
 * - Create Order document with embedded item snapshots
 * - Create initial OrderHistory entry
 */
export const createOrder = async ({ conn, userId, shippingAddressId, billingAddressId, items, paymentMethod, couponCode, meta = {} }) => {
  return await runTransaction(conn, async (session) => {
    // Validate user, addresses, and product availability
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    if (products.length !== productIds.length) throw new Error("Some products not found");

    // Build orderItems snapshot & compute totals
    let subtotal = 0;
    const orderItems = [];
    for (const it of items) {
      const prod = products.find(p => p._id.equals(it.productId));
      if (!prod) throw new Error(`Product ${it.productId} not found`);
      if (prod.stock < it.quantity) throw new Error(`Insufficient stock for ${prod._id}`);
      const price = prod.price;
      const discountedPrice = it.discountedPrice ?? null; // optional from frontend/server promo
      const effectivePrice = discountedPrice || price;
      const itemSubtotal = effectivePrice * it.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product: prod._id,
        productSnapshot: {
          name: prod.name,
          slug: prod.slug,
          category: prod.categoryName || prod.category,
          subCategory: prod.subCategoryName || prod.subCategory,
        },
        variant: it.variant || "",
        quantity: it.quantity,
        price,
        discountedPrice,
        tax: it.tax || 0,
        subtotal: itemSubtotal,
        sku: prod.sku,
        weight: prod.weight || 0,
        image: prod.image,
      });
    }

    // Coupon validation (if any)
    let coupon = null;
    let discount = 0;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, active: true }).session(session);
      if (!coupon) throw new Error("Invalid coupon code");
      // Example: flat or percent
      if (coupon.type === "percentage") {
        discount = (coupon.value / 100) * subtotal;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.value;
      }
      // check min order amount
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        throw new Error("Order doesn't meet coupon minimum amount");
      }
    }

    const taxPrice = 0; // compute tax if you need
    const shippingPrice = meta.shippingPrice || 0;
    const totalPrice = subtotal - (discount || 0) + taxPrice + shippingPrice;

    // Create orderNumber (you can replace with your generator)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create Order
    const order = new Order({
      orderNumber,
      user: userId,
      orderItems,
      shippingAddress: shippingAddressId,
      billingAddress: billingAddressId,
      paymentMethod,
      paymentAttempts: [],
      taxPrice,
      shippingPrice,
      discount,
      coupon: coupon ? coupon._id : null,
      totalPrice,
      isPaid: false,
      status: "Pending",
      analytics: meta.analytics || {}
    });

    await order.save({ session });

    // Decrement product stock (reservation)
    for (const it of orderItems) {
      const res = await Product.updateOne({ _id: it.product, stock: { $gte: it.quantity } }, { $inc: { stock: -it.quantity, reserved: it.quantity ? it.quantity : 0 } }).session(session);
      if (res.modifiedCount === 0) throw new Error(`Failed to reserve product ${it.product}`);
    }

    // Create initial history entry
    await createHistoryEntry({
      session,
      orderId: order._id,
      status: order.status,
      previousStatus: null,
      updatedBy: userId,
      note: "Order created",
      source: "Customer",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return order;
  });
};

/**
 * Fetch order by id with useful population
 */
export const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "name email role")
    .populate("shippingAddress")
    .populate("billingAddress")
    .populate("paymentAttempts")
    .populate("orderHistory")
    .populate("returns")
    .lean();
  if (!order) throw new Error("Order not found");
  return order;
};

/**
 * Update order status (atomic) — automatically writes history and triggers side-effects
 */
export const updateOrderStatus = async ({ conn, orderId, newStatus, updatedByUserId, note = "", source = "Admin" }) => {
  return await runTransaction(conn, async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Order not found");

    const prev = order.status;
    if (prev === newStatus) return order;

    // Business rules: forbid invalid transitions (example)
    const invalidTransition = (from, to) => {
      if (from === "Delivered" && to !== "Returned" && to !== "Refunded") return true;
      return false;
    };
    if (invalidTransition(prev, newStatus)) throw new Error(`Invalid transition ${prev} -> ${newStatus}`);

    order.status = newStatus;

    if (newStatus === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      // optionally set returnEligibleTill based on policy
      order.orderItems = order.orderItems.map(it => {
        if (!it.returnEligibleTill) it.returnEligibleTill = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        return it;
      });
    }

    if (newStatus === "Cancelled") {
      // release stock
      for (const it of order.orderItems) {
        await Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity } }).session(session);
      }
    }

    if (newStatus === "Refunded") {
      // TODO: optionally trigger refund via payment gateway
      order.isPaid = false;
    }

    await order.save({ session });

    // history
    await createHistoryEntry({
      session,
      orderId: order._id,
      status: newStatus,
      previousStatus: prev,
      updatedBy: updatedByUserId,
      note,
      source,
    });

    return order;
  });
};

/**
 * Add a payment attempt & apply payment success
 */
export const processPaymentAttempt = async ({ conn, orderId, attemptPayload, markPaid = false }) => {
  return await runTransaction(conn, async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Order not found");

    // Prevent duplicate paymentId
    if (attemptPayload.paymentId) {
      const existing = await PaymentAttempt.findOne({ paymentId: attemptPayload.paymentId }).session(session);
      if (existing) throw new Error("Duplicate payment attempt id");
    }

    const attempt = await addPaymentAttempt({ session, attemptPayload: { ...attemptPayload, orderId: order._id, userId: order.user } });

    order.paymentAttempts.push(attempt._id);

    if (markPaid && attemptPayload.status === "Completed") {
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = "Processing";
      // create history
      await createHistoryEntry({
        session,
        orderId: order._id,
        status: "Processing",
        previousStatus: "Pending",
        updatedBy: order.user,
        note: "Payment completed",
        source: "PaymentGateway",
      });
    }

    await order.save({ session });
    return { order, attempt };
  });
};

/**
 * Create / Request a return
 * - validates eligibility
 * - creates Return record
 * - updates order.returns and orderHistory
 */
export const createReturn = async ({ conn, orderId, userId, returnPayload }) => {
  return await runTransaction(conn, async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Order not found");
    if (!order.user.equals(userId)) throw new Error("Unauthorized");

    // Validate items exist and are eligible
    for (const it of returnPayload.items) {
      const orderItem = order.orderItems.find(oi => oi.product.equals(it.product));
      if (!orderItem) throw new Error(`Product ${it.product} not in order`);
      // optional: check returnEligibleTill
      if (orderItem.returnEligibleTill && new Date() > orderItem.returnEligibleTill) throw new Error(`Return window expired for ${it.product}`);
    }

    // compute totals from order item snapshots if required
    let totalAmount = 0;
    for (const it of returnPayload.items) {
      const orderItem = order.orderItems.find(oi => oi.product.equals(it.product));
      const qty = it.quantity;
      const lineSubtotal = orderItem.subtotal / orderItem.quantity * qty; // approximate proportional
      totalAmount += lineSubtotal;
    }

    const ret = await createReturnRecord({
      session,
      returnPayload: {
        returnId: `RET-${Date.now()}-${Math.floor(Math.random()*10000)}`,
        orderId,
        userId,
        reason: returnPayload.reason,
        items: returnPayload.items,
        totalAmount,
        refundAmount: returnPayload.refundAmount ?? totalAmount,
        status: "Requested",
      }
    });

    order.returns.push(ret._id);
    await order.save({ session });

    // history entry
    await createHistoryEntry({
      session,
      orderId: order._id,
      status: "Returned",
      previousStatus: order.status,
      updatedBy: userId,
      note: "Return requested",
      source: "Customer",
    });

    return ret;
  });
};

/**
 * Admin approves return and processes refund (example)
 */
export const approveReturnAndRefund = async ({ conn, returnId, approvedBy, refundTransactionId }) => {
  return await runTransaction(conn, async (session) => {
    const ret = await ReturnModel.findById(returnId).session(session);
    if (!ret) throw new Error("Return not found");
    if (ret.status !== "Requested" && ret.status !== "Under Review") throw new Error("Cannot approve return in its current status");

    ret.status = "Approved";
    ret.approvedBy = approvedBy;
    ret.processedAt = new Date();
    ret.refundTransactionId = refundTransactionId;
    await ret.save({ session });

    // update order item statuses & replenish stock if necessary
    const order = await Order.findById(ret.orderId).session(session);
    for (const ritem of ret.items) {
      // increase stock
      await Product.updateOne({ _id: ritem.product }, { $inc: { stock: ritem.quantity } }).session(session);
      // update specific item status inside order
      const item = order.orderItems.find(it => it.product.equals(ritem.product));
      if (item) item.status = "Returned";
    }
    await order.save({ session });

    // history
    await createHistoryEntry({
      session,
      orderId: order._id,
      status: "Returned",
      previousStatus: order.status,
      updatedBy: approvedBy,
      note: "Return approved and refunded",
      source: "Admin",
    });

    return ret;
  });
};

/**
 * Soft-delete order
 */
export const softDeleteOrder = async (orderId, deletedBy) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  order.isDeleted = true;
  await order.save();
  await createHistoryEntry({ orderId: order._id, status: "Cancelled", previousStatus: order.status, updatedBy: deletedBy, note: "Order soft-deleted", source: "Admin" });
  return order;
};

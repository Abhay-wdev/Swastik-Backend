// services/helpers.js
import mongoose from "mongoose";
import OrderHistory from "../models/order/orderHistory.model.js";
import PaymentAttempt from "../models/payment/paymentAttempt.model.js";
import ReturnModel from "../models/order/return.model.js";

export const createHistoryEntry = async ({ session, orderId, status, previousStatus, updatedBy, note = "", source = "System", ipAddress, userAgent }) => {
  const entry = new OrderHistory({
    orderId, status, previousStatus, updatedBy, note, source, ipAddress, userAgent
  });
  if (session) await entry.save({ session });
  else await entry.save();
  return entry;
};

export const addPaymentAttempt = async ({ session, attemptPayload }) => {
  const attempt = new PaymentAttempt(attemptPayload);
  if (session) await attempt.save({ session });
  else await attempt.save();
  return attempt;
};

export const createReturnRecord = async ({ session, returnPayload }) => {
  const ret = new ReturnModel(returnPayload);
  if (session) await ret.save({ session });
  else await ret.save();
  return ret;
};

// Convenience util to run transaction with retry
export const runTransaction = async (conn, callback) => {
  const session = await conn.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await callback(session);
    }, {
      // txn options if required
    });
  } finally {
    session.endSession();
  }
  return result;
};

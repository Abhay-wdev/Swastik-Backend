import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // Make sure you call this at the top before using process.env

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
